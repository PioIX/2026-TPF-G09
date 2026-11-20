const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { realizarQuery } = require("./modulos/mysql");

const app = express();
app.use(cors()); //no pide ip precisa, acpeta todas
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

const CLAVE_ADMIN = process.env.CLAVE_ADMIN || "Moranditequiero";
const MAX_RONDAS_POR_JUGADOR = 3;
const salas = {};

const verificarAdmin = (req, res, next) => {
  const clave = req.headers["x-admin-key"];
  if (!clave || clave !== CLAVE_ADMIN) {
    return res.status(403).json({ mensaje: "Acceso denegado: clave de administrador inválida" });
  }
  next();
};

const obtenerListaSalas = () => {
  return Object.values(salas).map((s) => ({
    codigo: s.codigo,
    nombre: s.nombre || `Sala ${s.codigo}`,
    categoriaNombre: s.categoriaNombre || "TODAS",
    cantidadJugadores: s.jugadores.length,
  }));
};

const emitirSalasActivas = () => {
  io.emit("lista_salas", obtenerListaSalas());
};

const obtenerPalabraAleatoria = async (catParam) => {
  let query = "SELECT palabra FROM Palabra";
  const params = [];

  if (
    catParam &&
    catParam !== "TODAS" &&
    catParam !== "null" &&
    catParam !== "undefined"
  ) {
    query += " WHERE id_categoria = ?";
    params.push(Number(catParam));
  }

  query += " ORDER BY RAND() LIMIT 1";
  const rows = await realizarQuery(query, params);
  if (rows && rows.length > 0) {
    return rows[0].palabra.trim().toUpperCase();
  }
  return "MATE";
};

const avanzarTurno = async (codigoUpper, mensajeSistema) => {
  const sala = salas[codigoUpper];
  if (!sala) return;

  io.to(codigoUpper).emit("limpiar_lienzo");

  if (mensajeSistema) {
    io.to(codigoUpper).emit("mensaje_recibido", {
      usuario: "Sistema",
      mensaje: mensajeSistema,
      tipo: "sistema",
    });
  }

  // Busca al jugador que menos turnos haya jugado y tenga menos de 3 rondas
  const candidatos = sala.jugadores.filter(
    (j) => (j.turnosJugados || 0) < MAX_RONDAS_POR_JUGADOR
  );

  if (candidatos.length > 0) {
    candidatos.sort((a, b) => (a.turnosJugados || 0) - (b.turnosJugados || 0));
    const siguienteJugador = candidatos[0];

    try {
      const nuevaPalabra = await obtenerPalabraAleatoria(sala.categoria);
      sala.turnoActual = (sala.turnoActual || 0) + 1;
      siguienteJugador.turnosJugados = (siguienteJugador.turnosJugados || 0) + 1;
      sala.palabraActual = nuevaPalabra;

      io.to(codigoUpper).emit("actualizar_jugadores", sala.jugadores);
      io.to(codigoUpper).emit("turno_iniciado", {
        dibujante: siguienteJugador.usuario,
        palabra: nuevaPalabra,
        categoria: sala.categoria,
        turnoId: sala.turnoActual,
        rondaActual: siguienteJugador.turnosJugados,
        maxRondas: MAX_RONDAS_POR_JUGADOR,
      });
    } catch (error) {
      console.error("Error al avanzar de turno:", error);
    }
  } else {
    // Todos completaron sus 3 rondas
    const ultimaPalabra = sala.palabraActual || "";
    sala.palabraActual = "";
    io.to(codigoUpper).emit("partida_terminada", {
      ultimaPalabra,
    });
  }
};

// ================= RUTAS HTTP =================

app.get("/api/categorias", async (req, res) => {
  try {
    const rows = await realizarQuery("SELECT id_categoria, nombre FROM categoria");
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ mensaje: "Error al obtener categorías" });
  }
});

app.get("/api/palabra", async (req, res) => {
  const catParam = req.query.id_categoria || req.query.categoria;

  try {
    const palabra = await obtenerPalabraAleatoria(catParam);
    return res.json({ palabra });
  } catch (error) {
    return res.status(500).json({ mensaje: "Error al buscar palabra" });
  }
});

app.get("/api/ranking", async (req, res) => {
  try {
    const rows = await realizarQuery(
      `SELECT u.nombre AS usuario, COALESCE(SUM(p.puntaje), 0) AS puntos_totales, COUNT(pu.id_partida) AS partidas_jugadas
       FROM Usuario u
       LEFT JOIN Partida_Usuario pu ON u.id_usuario = pu.id_usuario
       LEFT JOIN Partida p ON pu.id_partida = p.id_partida
       GROUP BY u.id_usuario, u.nombre
       ORDER BY puntos_totales DESC
       LIMIT 10`
    );
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ mensaje: "Error al obtener ranking" });
  }
});

app.post("/api/partidas", async (req, res) => {
  const { jugadores } = req.body;
  if (!jugadores || !Array.isArray(jugadores) || jugadores.length === 0) {
    return res.status(400).json({ mensaje: "No hay jugadores para guardar" });
  }

  try {
    for (const j of jugadores) {
      const userRows = await realizarQuery(
        "SELECT id_usuario FROM Usuario WHERE nombre = ?",
        [j.usuario]
      );

      if (userRows.length > 0) {
        const resultPartida = await realizarQuery(
          "INSERT INTO Partida (puntaje) VALUES (?)",
          [Number(j.puntos) || 0]
        );
        const idPartida = resultPartida.insertId;

        await realizarQuery(
          "INSERT INTO Partida_Usuario (id_usuario, id_partida) VALUES (?, ?)",
          [userRows[0].id_usuario, idPartida]
        );
      }
    }

    return res.status(201).json({ mensaje: "Partida y puntajes guardados en MySQL" });
  } catch (error) {
    return res.status(500).json({ mensaje: "Error al guardar la partida" });
  }
});

app.post("/api/registro", async (req, res) => {
  const { usuario, nombre, edad, email, mail, password, contraseña } = req.body;
  const nombreFinal = (nombre || usuario || "").trim();
  const mailFinal = (mail || email || "").trim();
  const passFinal = contraseña || password || "";
  const edadFinal = Number(edad) || 18;

  if (!nombreFinal || !mailFinal || !passFinal) {
    return res.status(400).json({ mensaje: "Faltan datos obligatorios" });
  }

  try {
    const existentes = await realizarQuery(
      "SELECT id_usuario FROM Usuario WHERE nombre = ? OR mail = ?",
      [nombreFinal, mailFinal]
    );

    if (existentes.length > 0) {
      return res.status(400).json({ mensaje: "El usuario o mail ya está registrado" });
    }

    await realizarQuery(
      "INSERT INTO Usuario (nombre, edad, mail, `contraseña`) VALUES (?, ?, ?, ?)",
      [nombreFinal, edadFinal, mailFinal, passFinal]
    );

    return res.status(201).json({ mensaje: "Usuario creado con éxito" });
  } catch (error) {
    return res.status(500).json({ mensaje: "Error al registrar usuario en la base de datos" });
  }
});

app.post("/api/login", async (req, res) => {
  const { usuario, nombre, email, mail, password, contraseña } = req.body;
  const identificador = (usuario || nombre || mail || email || "").trim();
  const passFinal = contraseña || password || "";

  if (!identificador || !passFinal) {
    return res.status(400).json({ mensaje: "Ingresá usuario y contraseña" });
  }

  try {
    const rows = await realizarQuery(
      "SELECT id_usuario, nombre, edad, mail FROM Usuario WHERE (nombre = ? OR mail = ?) AND `contraseña` = ?",
      [identificador, identificador, passFinal]
    );

    if (rows.length === 0) {
      return res.status(401).json({ mensaje: "Usuario o contraseña incorrectos" });
    }

    const user = rows[0];
    return res.json({
      mensaje: "Login exitoso",
      usuario: {
        id_usuario: user.id_usuario,
        usuario: user.nombre,
        nombre: user.nombre,
        edad: user.edad,
        mail: user.mail,
        es_admin: user.nombre.toLowerCase() === "admin" ? 1 : 0,
      },
    });
  } catch (error) {
    return res.status(500).json({ mensaje: "Error interno en el login" });
  }
});

app.post("/api/admin/verificar", async (req, res) => {
  const { usuario, claveAdmin } = req.body;

  try {
    const rows = await realizarQuery(
      "SELECT id_usuario FROM Usuario WHERE nombre = ?",
      [usuario]
    );

    if (rows.length === 0) {
      return res.status(403).json({ mensaje: "Usuario no encontrado" });
    }

    if (claveAdmin !== CLAVE_ADMIN) {
      return res.status(401).json({ mensaje: "Código de verificación incorrecto" });
    }

    return res.json({ autorizado: true });
  } catch (error) {
    return res.status(500).json({ mensaje: "Error al verificar administrador" });
  }
});

// ================= CRUD DE PALABRAS (ADMIN) =================

app.get("/api/admin/palabras", verificarAdmin, async (req, res) => {
  try {
    const rows = await realizarQuery(
      `SELECT p.id_palabra, p.palabra, p.id_categoria, c.nombre AS categoria
       FROM Palabra p
       INNER JOIN categoria c ON p.id_categoria = c.id_categoria
       ORDER BY p.id_palabra DESC`
    );
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ mensaje: "Error al listar palabras" });
  }
});

app.post("/api/admin/palabras", verificarAdmin, async (req, res) => {
  const { palabra, id_categoria } = req.body;
  if (!palabra || !id_categoria) {
    return res.status(400).json({ mensaje: "Faltan datos obligatorios" });
  }

  try {
    await realizarQuery(
      "INSERT INTO Palabra (palabra, id_categoria) VALUES (?, ?)",
      [palabra.trim().toUpperCase(), Number(id_categoria)]
    );
    return res.status(201).json({ mensaje: "Palabra cargada con éxito" });
  } catch (error) {
    return res.status(500).json({ mensaje: "Error al guardar la palabra" });
  }
});

app.put("/api/admin/palabras/:id", verificarAdmin, async (req, res) => {
  const { id } = req.params;
  const { palabra, id_categoria } = req.body;
  if (!palabra || !id_categoria) {
    return res.status(400).json({ mensaje: "Faltan datos para actualizar" });
  }

  try {
    await realizarQuery(
      "UPDATE Palabra SET palabra = ?, id_categoria = ? WHERE id_palabra = ?",
      [palabra.trim().toUpperCase(), Number(id_categoria), Number(id)]
    );
    return res.json({ mensaje: "Palabra actualizada correctamente" });
  } catch (error) {
    return res.status(500).json({ mensaje: "Error al actualizar la palabra" });
  }
});

app.delete("/api/admin/palabras/:id", verificarAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await realizarQuery("DELETE FROM Palabra WHERE id_palabra = ?", [Number(id)]);
    return res.json({ mensaje: "Palabra eliminada correctamente" });
  } catch (error) {
    return res.status(500).json({ mensaje: "Error al eliminar la palabra" });
  }
});

// ================= SOCKET.IO =================

io.on("connection", (socket) => {
  socket.emit("lista_salas", obtenerListaSalas());

  socket.on("obtener_salas", () => {
    socket.emit("lista_salas", obtenerListaSalas());
  });

  socket.on("crear_sala", ({ nombreSala, usuario, categoria, categoriaNombre }) => {
    const codigoSala = Math.random().toString(36).substring(2, 7).toUpperCase();

    salas[codigoSala] = {
      codigo: codigoSala,
      nombre: nombreSala?.trim() || `Sala de ${usuario}`,
      categoria: categoria ? String(categoria) : "TODAS",
      categoriaNombre: categoriaNombre || "TODAS",
      jugadores: [{ id: socket.id, usuario, puntos: 0, turnosJugados: 0 }],
      turnoActual: 0,
      palabraActual: "",
    };

    socket.join(codigoSala);
    socket.emit("sala_creada", { codigoSala, sala: salas[codigoSala] });
    emitirSalasActivas();
  });

  socket.on("unirse_sala", ({ codigoSala, usuario }) => {
    const codigoUpper = codigoSala ? codigoSala.toUpperCase() : "";

    if (!salas[codigoUpper]) {
      salas[codigoUpper] = {
        codigo: codigoUpper,
        nombre: `Sala ${codigoUpper}`,
        categoria: "TODAS",
        categoriaNombre: "TODAS",
        jugadores: [],
        turnoActual: 0,
        palabraActual: "",
      };
    }

    const sala = salas[codigoUpper];
    if (!sala.jugadores.some((j) => j.usuario === usuario)) {
      sala.jugadores.push({ id: socket.id, usuario, puntos: 0, turnosJugados: 0 });
    }

    socket.join(codigoUpper);
    socket.emit("unido_exitoso", {
      codigoSala: codigoUpper,
      categoria: sala.categoria,
      categoriaNombre: sala.categoriaNombre,
      sala,
    });
    io.to(codigoUpper).emit("actualizar_jugadores", sala.jugadores);
    io.to(codigoUpper).emit("jugador_unido", { id: socket.id, usuario });
    emitirSalasActivas();
  });

  socket.on("dibujar", ({ codigoSala, datosTrazo }) => {
    if (!codigoSala) return;
    socket.to(codigoSala.toUpperCase()).emit("dibujar", datosTrazo);
  });

  socket.on("limpiar_lienzo", (codigoSala) => {
    if (!codigoSala) return;
    io.to(codigoSala.toUpperCase()).emit("limpiar_lienzo");
  });

  socket.on("enviar_mensaje", async ({ codigoSala, usuario, mensaje, tipo }) => {
    if (!codigoSala) return;
    const codigoUpper = codigoSala.toUpperCase();
    const sala = salas[codigoUpper];

    if (tipo === "acierto" && sala) {
      const jugador = sala.jugadores.find((j) => j.usuario === usuario);
      if (jugador) {
        jugador.puntos += 100;
      }
      io.to(codigoUpper).emit("actualizar_jugadores", sala.jugadores);

      io.to(codigoUpper).emit("mensaje_recibido", {
        usuario,
        mensaje,
        tipo: "acierto",
      });

      const palabraAcertada = sala.palabraActual || "";
      // Corta el turno de inmediato y pasa al siguiente jugador
      await avanzarTurno(
        codigoUpper,
        `✅ ¡${usuario} adivinó "${palabraAcertada}"! Cambiando de turno...`
      );
      return;
    }

    io.to(codigoUpper).emit("mensaje_recibido", {
      usuario,
      mensaje,
      tipo: tipo || "normal",
    });
  });

  socket.on("nuevo_turno", ({ codigoSala, datosTurno }) => {
    if (!codigoSala) return;
    const codigoUpper = codigoSala.toUpperCase();
    const sala = salas[codigoUpper];

    if (sala) {
      sala.turnoActual = 1;
      sala.palabraActual = datosTurno.palabra;
      sala.jugadores.forEach((j) => {
        j.turnosJugados = j.usuario === datosTurno.dibujante ? 1 : 0;
      });
      io.to(codigoUpper).emit("actualizar_jugadores", sala.jugadores);
    }

    io.to(codigoUpper).emit("turno_iniciado", {
      ...datosTurno,
      turnoId: 1,
      rondaActual: 1,
      maxRondas: MAX_RONDAS_POR_JUGADOR,
    });
  });

  socket.on("tiempo_agotado", async ({ codigoSala, turnoActual, palabraAnterior }) => {
    if (!codigoSala) return;
    const codigoUpper = codigoSala.toUpperCase();
    const sala = salas[codigoUpper];
    if (!sala) return;

    // Evita procesar dos veces el mismo fin de turno
    if (turnoActual && sala.turnoActual !== turnoActual) return;

    await avanzarTurno(
      codigoUpper,
      `⏰ ¡Tiempo terminado! La palabra era: ${palabraAnterior || sala.palabraActual}`
    );
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});