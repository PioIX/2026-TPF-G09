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

const usuariosBD = [];
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

// Palabra filtrada por id_categoria o por nombre de categoría
app.get("/api/palabra", async (req, res) => {
  const { id_categoria } = req.query;

  try {
    let query = "SELECT p.palabra FROM Palabra p";
    let params = [];

    if (
      id_categoria &&
      id_categoria !== "TODAS" &&
      id_categoria !== "null" &&
      id_categoria !== "undefined"
    ) {
      if (!isNaN(id_categoria)) {
        query += " WHERE p.id_categoria = ?";
        params.push(Number(id_categoria));
      } else {
        query += " INNER JOIN categoria c ON p.id_categoria = c.id_categoria WHERE LOWER(c.nombre) LIKE LOWER(?)";
        params.push(`%${id_categoria}%`);
      }
    }

    query += " ORDER BY RAND() LIMIT 1";

    const [rows] = await db.query(query, params);

    if (rows && rows.length > 0) {
      return res.json({ palabra: rows[0].palabra.trim().toUpperCase() });
    }
  } catch (error) {
    console.error("🔴 Error en /api/palabra:", error.message);
  }

  // Respaldo
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

app.post("/api/login", (req, res) => {
  const { usuario, password } = req.body;
  if (!usuario) return res.status(400).json({ mensaje: "Ingresá un usuario" });

  let user = usuariosBD.find((u) => (u.usuario === usuario || u.email === usuario) && u.password === password);
  
  if (!user) {
    user = { usuario, password: password || "123456" };
    usuariosBD.push(user);
  }

  return res.json({ usuario: user });
});

// Sockets
io.on("connection", (socket) => {
  socket.on("crear_sala", ({ nombreSala, usuario, categoria, categoriaNombre }) => {
    const codigoSala = Math.random().toString(36).substring(2, 7).toUpperCase();

    salas[codigoSala] = {
      codigo: codigoSala,
      nombre: nombreSala || `Sala de ${usuario}`,
      categoria: categoria || "TODAS",
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
        jugadores: [],
      };
    }

    const sala = salas[codigoUpper];
    if (!sala.jugadores.some((j) => j.usuario === usuario)) {
      sala.jugadores.push({ id: socket.id, usuario, puntos: 0 });
    }

    socket.join(codigoUpper);
    socket.emit("unido_exitoso", { codigoSala: codigoUpper });
    io.to(codigoUpper).emit("actualizar_jugadores", sala.jugadores);
    io.to(codigoUpper).emit("jugador_unido", { id: socket.id, usuario });
  });

  socket.on("dibujar", ({ codigoSala, datosTrazo }) => {
    socket.to(codigoSala).emit("dibujar", datosTrazo);
  });

  socket.on("limpiar_lienzo", (codigoSala) => {
    io.to(codigoSala).emit("limpiar_lienzo");
  });

  socket.on("enviar_mensaje", ({ codigoSala, usuario, mensaje, tipo }) => {
    io.to(codigoSala).emit("mensaje_recibido", { usuario, mensaje, tipo: tipo || "normal" });
  });

  socket.on("nuevo_turno", ({ codigoSala, datosTurno }) => {
    io.to(codigoSala).emit("turno_iniciado", datosTurno);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor backend escuchando en http://localhost:${PORT}`);
});