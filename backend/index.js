const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { realizarQuery } = require("./modulos/mysql");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

const CLAVE_ADMIN = process.env.CLAVE_ADMIN || "admin2026";
const salas = {};

// Middleware de protección para rutas de administrador
const verificarAdmin = (req, res, next) => {
  const clave = req.headers["x-admin-key"];
  if (!clave || clave !== CLAVE_ADMIN) {
    return res.status(403).json({ mensaje: "Acceso denegado: clave de administrador inválida" });
  }
  next();
};

// ================= RUTAS HTTP =================

// Obtener todas las categorías
app.get("/api/categorias", async (req, res) => {
  try {
    const rows = await realizarQuery("SELECT id_categoria, nombre FROM categoria");
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ mensaje: "Error al obtener categorías" });
  }
});

// Obtener palabra aleatoria según categoría
app.get("/api/palabra", async (req, res) => {
  const catParam = req.query.id_categoria || req.query.categoria;

  try {
    let query = "SELECT palabra FROM Palabra";
    let params = [];

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
      return res.json({ palabra: rows[0].palabra.trim().toUpperCase() });
    }
    return res.status(404).json({ mensaje: "No hay palabras cargadas en esta categoría" });
  } catch (error) {
    return res.status(500).json({ mensaje: "Error al buscar palabra" });
  }
});

// Registro de usuario en MySQL
app.post("/api/registro", async (req, res) => {
  const { usuario, email, password } = req.body;
  if (!usuario || !email || !password) {
    return res.status(400).json({ mensaje: "Faltan datos obligatorios" });
  }

  try {
    const existentes = await realizarQuery(
      "SELECT id_usuario FROM Usuario WHERE usuario = ? OR email = ?",
      [usuario.trim(), email.trim()]
    );

    if (existentes.length > 0) {
      return res.status(400).json({ mensaje: "El usuario o email ya está registrado" });
    }

    await realizarQuery(
      "INSERT INTO Usuario (usuario, email, password, es_admin) VALUES (?, ?, ?, 0)",
      [usuario.trim(), email.trim(), password]
    );

    return res.status(201).json({ mensaje: "Usuario creado con éxito" });
  } catch (error) {
    return res.status(500).json({ mensaje: "Error al registrar usuario en la base de datos" });
  }
});

// Login de usuario contra MySQL
app.post("/api/login", async (req, res) => {
  const { usuario, password } = req.body;
  if (!usuario || !password) {
    return res.status(400).json({ mensaje: "Ingresá usuario y contraseña" });
  }

  try {
    const rows = await realizarQuery(
      "SELECT id_usuario, usuario, es_admin FROM Usuario WHERE (usuario = ? OR email = ?) AND password = ?",
      [usuario.trim(), usuario.trim(), password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ mensaje: "Usuario o contraseña incorrectos" });
    }

    return res.json({
      mensaje: "Login exitoso",
      usuario: rows[0],
    });
  } catch (error) {
    return res.status(500).json({ mensaje: "Error interno en el login" });
  }
});

// Verificar clave secundaria de Administrador
app.post("/api/admin/verificar", async (req, res) => {
  const { usuario, claveAdmin } = req.body;

  try {
    const rows = await realizarQuery(
      "SELECT es_admin FROM Usuario WHERE usuario = ?",
      [usuario]
    );

    if (rows.length === 0 || rows[0].es_admin !== 1) {
      return res.status(403).json({ mensaje: "Tu cuenta no tiene permisos de administrador" });
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

// GET: Listar todas las palabras
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

// POST: Crear palabra
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

// PUT: Modificar palabra existente
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

// DELETE: Eliminar palabra
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
  socket.on("crear_sala", ({ nombreSala, usuario, categoria, categoriaNombre }) => {
    const codigoSala = Math.random().toString(36).substring(2, 7).toUpperCase();

    salas[codigoSala] = {
      codigo: codigoSala,
      nombre: nombreSala || `Sala de ${usuario}`,
      categoria: categoria ? String(categoria) : "TODAS",
      categoriaNombre: categoriaNombre || "TODAS",
      jugadores: [{ id: socket.id, usuario, puntos: 0 }],
    };

    socket.join(codigoSala);
    socket.emit("sala_creada", { codigoSala, sala: salas[codigoSala] });
  });

  socket.on("unirse_sala", ({ codigoSala, usuario }) => {
    const codigoUpper = codigoSala ? codigoSala.toUpperCase() : "";

    if (!salas[codigoUpper]) {
      salas[codigoUpper] = {
        codigo: codigoUpper,
        categoria: "TODAS",
        categoriaNombre: "TODAS",
        jugadores: [],
      };
    }

    const sala = salas[codigoUpper];
    if (!sala.jugadores.some((j) => j.usuario === usuario)) {
      sala.jugadores.push({ id: socket.id, usuario, puntos: 0 });
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
  });

  socket.on("dibujar", ({ codigoSala, datosTrazo }) => {
    if (!codigoSala) return;
    socket.to(codigoSala.toUpperCase()).emit("dibujar", datosTrazo);
  });

  socket.on("limpiar_lienzo", (codigoSala) => {
    if (!codigoSala) return;
    io.to(codigoSala.toUpperCase()).emit("limpiar_lienzo");
  });

  socket.on("enviar_mensaje", ({ codigoSala, usuario, mensaje, tipo }) => {
    if (!codigoSala) return;
    io.to(codigoSala.toUpperCase()).emit("mensaje_recibido", {
      usuario,
      mensaje,
      tipo: tipo || "normal",
    });
  });

  socket.on("nuevo_turno", ({ codigoSala, datosTurno }) => {
    if (!codigoSala) return;
    io.to(codigoSala.toUpperCase()).emit("turno_iniciado", datosTurno);
  });

  socket.on("palabra_adivinada", ({ codigoSala, usuario, palabra }) => {
    if (!codigoSala) return;
    io.to(codigoSala.toUpperCase()).emit("turno_finalizado", {
      ganador: usuario,
      palabra,
    });
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});