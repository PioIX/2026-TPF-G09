const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mysql = require("mysql2/promise");

// Evita cierres del servidor ante errores no capturados
process.on("unhandledRejection", (reason) => {
  console.error("⚠️ Error de Promesa no capturado:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("💥 Excepción no capturada:", err.message);
});

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// Configuración DB con fallback de variables de entorno
const db = mysql.createPool({
  host: process.env.MYSQL_HOST || "10.1.5.205",
  user: process.env.MYSQL_USERNAME || "2026_5INF_G09",
  password: process.env.MYSQL_PASSWORD || "brbr",
  database: process.env.MYSQL_DB || "2026_5INF_G09",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});


const salas = {};

// Categorías
app.get("/api/categorias", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id_categoria, nombre FROM categoria");
    return res.json(rows);
  } catch (error) {
    console.error("🔴 Error en /api/categorias:", error.message);
    return res.status(200).json([]);
  }
});

// Obtener palabra aleatoria según la categoría elegida
app.get("/api/palabra", async (req, res) => {
  const catParam = req.query.id_categoria || req.query.categoria;
  console.log("🎯 Buscando palabra para categoría:", catParam);

  try {
    let query = "SELECT p.palabra FROM Palabra p";
    let params = [];

    if (
      catParam &&
      catParam !== "TODAS" &&
      catParam !== "null" &&
      catParam !== "undefined"
    ) {
      if (!isNaN(catParam)) {
        query += " WHERE p.id_categoria = ?";
        params.push(Number(catParam));
      } else {
        query += " INNER JOIN Categoria c ON p.id_categoria = c.id_categoria WHERE LOWER(c.nombre) LIKE LOWER(?)";
        params.push(`%${catParam}%`);
      }
    }

    query += " ORDER BY RAND() LIMIT 1";

    const [rows] = await db.query(query, params);

    if (rows && rows.length > 0) {
      return res.json({ palabra: rows[0].palabra.trim().toUpperCase() });
    } else {
      console.log("⚠️ La consulta devolvió 0 palabras para la categoría:", catParam);
    }
  } catch (error) {
    console.error("🔴 Error SQL al filtrar palabra:", error.message);
  }
  // (Acá dejá tu respaldo por si falla la BD)

  // Fallback si la categoría elegida no tiene palabras cargadas en la BD
  const palabrasRespaldo = ["MATE", "EMPANADA", "OBELISCO", "ASADO", "CARPINCHO", "MESSI"];
  const palabraAzar = palabrasRespaldo[Math.floor(Math.random() * palabrasRespaldo.length)];

  return res.json({ palabra: palabraAzar });
  });

// Login y Registro
app.post("/api/registro", (req, res) => {
  const { usuario, email, password } = req.body;
  if (!usuario || !email || !password) return res.status(400).json({ mensaje: "Faltan datos" });
  usuariosBD.push({ usuario, email, password });
  return res.status(201).json({ mensaje: "Usuario creado", usuario: { usuario, email } });
});

const usuariosBD = [
  {
    id_usuario: 1,
    usuario: "admin",
    email: "admin@argentillo.com",
    password: "admin123",
    es_admin: 1
  }
];

app.post("/api/login", (req, res) => {
  const { usuario, password } = req.body;
  if (!usuario) return res.status(400).json({ mensaje: "Ingresá un usuario" });

  let user = usuariosBD.find(
    (u) => (u.usuario === usuario || u.email === usuario) && u.password === password
  );

  if (!user) {
    user = { usuario, password: password || "123456", es_admin: 0 };
    usuariosBD.push(user);
  }

  return res.json({ usuario: user });
});

app.post("/api/admin/verificar", (req, res) => {
  const { usuario, claveAdmin } = req.body;
  const user = usuariosBD.find((u) => u.usuario === usuario);

  if (!user || user.es_admin !== 1) {
    return res.status(403).json({ mensaje: "Tu cuenta no tiene permisos de administrador" });
  }

  if (claveAdmin !== CLAVE_ADMIN) {
    return res.status(401).json({ mensaje: "Código de verificación incorrecto" });
  }

  return res.json({ autorizado: true });
});

// Sockets
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
  console.log(`🚀 Servidor backend escuchando en http://localhost:${PORT}`);
});
// Endpoint de Login
app.post("/api/login", async (req, res) => {
  const { usuario, password } = req.body;

  try {
    const [rows] = await db.query(
      "SELECT id_usuario, usuario, es_admin FROM Usuario WHERE usuario = ? AND password = ?",
      [usuario, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ mensaje: "Usuario o contraseña incorrectos" });
    }

    const user = rows[0];

    return res.json({
      mensaje: "Login exitoso",
      usuario: {
        id: user.id_usuario,
        usuario: user.usuario,
        esAdmin: Boolean(user.es_admin)
      }
    });
  } catch (error) {
    console.error("🔴 Error en login:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
});

// Endpoint para que el Admin agregue palabras
app.post("/api/admin/palabras", async (req, res) => {
  const { palabra, id_categoria } = req.body;

  if (!palabra || !id_categoria) {
    return res.status(400).json({ mensaje: "Faltan datos obligatorios" });
  }

  try {
    await db.query(
      "INSERT INTO Palabra (palabra, id_categoria) VALUES (?, ?)",
      [palabra.trim().toUpperCase(), id_categoria]
    );

    return res.json({ mensaje: "Palabra cargada con éxito" });
  } catch (error) {
    console.error("🔴 Error agregando palabra:", error);
    return res.status(500).json({ mensaje: "Error al guardar la palabra" });
  }
});

const CLAVE_ADMIN = 'Moranditequiero';

// Endpoint para verificar usuario + clave maestra
app.post('/api/admin/verificar', async (req, res) => {
  const { usuario, claveAdmin } = req.body;

  try {
    const [filas] = await pool.query(
      'SELECT es_admin FROM Usuario WHERE usuario = ?',
      [usuario]
    );

    if (filas.length === 0 || filas[0].es_admin !== 1) {
      return res.status(403).json({ mensaje: 'Tu cuenta no tiene permisos de administrador' });
    }

    if (claveAdmin !== CLAVE_ADMIN) {
      return res.status(401).json({ mensaje: 'Código de verificación incorrecto' });
    }

    res.json({ autorizado: true });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al verificar administrador' });
  }
});

// Middleware que protege las rutas de admin
const verificarAdmin = (req, res, next) => {
  const clave = req.headers['x-admin-key'];
  if (!clave || clave !== CLAVE_ADMIN) {
    return res.status(403).json({ mensaje: 'Acceso denegado: verificación requerida' });
  }
  next();
};