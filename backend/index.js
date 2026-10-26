const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

// Configuración de Middlewares
app.use(cors());
app.use(express.json());

// Configuración de Socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Base de datos en memoria para pruebas
const usuarios = [];
const salas = {};

// ==========================================
// 1. RUTAS HTTP (REST API)
// ==========================================

// Ruta base de prueba
app.get("/", (req, res) => {
  res.send("Backend de ARGENTILLO activo 🎨");
});

// ==========================================
// REGISTRO DE USUARIOS
// ==========================================

app.post("/api/registro", (req, res) => {
  // Convertimos a String para evitar que números rompan el .trim()
  const usuario = String(req.body.usuario || req.body.nombre || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "").trim();

  // Comprobar que estén todos los campos
  if (!usuario || !email || !password) {
    return res.status(400).json({
      ok: false,
      mensaje: "Todos los campos son obligatorios."
    });
  }

  // Comprobar si el nombre de usuario ya existe
  const existeUsuario = usuarios.find(
    (u) => u.usuario.toLowerCase() === usuario.toLowerCase()
  );

  if (existeUsuario) {
    return res.status(400).json({
      ok: false,
      mensaje: "El nombre de usuario ya está registrado."
    });
  }

  // Comprobar si el correo ya existe
  const existeEmail = usuarios.find(
    (u) => u.email.toLowerCase() === email
  );

  if (existeEmail) {
    return res.status(400).json({
      ok: false,
      mensaje: "El correo electrónico ya está registrado."
    });
  }

  // Crear el usuario
  const nuevoUsuario = { usuario, email, password };
  usuarios.push(nuevoUsuario);

  console.log(`👤 Nuevo usuario registrado: ${usuario}`);

  return res.status(201).json({
    ok: true,
    mensaje: "Usuario registrado con éxito.",
    usuario: { usuario, email }
  });
});

// ==========================================
// INICIO DE SESIÓN
// ==========================================

app.post("/api/login", (req, res) => {
  const usuario = String(
    req.body.usuario || req.body.nombre || req.body.email || ""
  ).trim();

  const password = String(req.body.password || "").trim();

  if (!usuario || !password) {
    return res.status(400).json({
      ok: false,
      mensaje: "Completá usuario y contraseña."
    });
  }

  const user = usuarios.find(
    (u) =>
      (u.usuario.toLowerCase() === usuario.toLowerCase() ||
        u.email.toLowerCase() === usuario.toLowerCase()) &&
      u.password === password
  );

  if (!user) {
    return res.status(401).json({
      ok: false,
      mensaje: "Usuario o contraseña incorrectos."
    });
  }

  return res.status(200).json({
    ok: true,
    mensaje: "Inicio de sesión exitoso.",
    usuario: {
      usuario: user.usuario,
      email: user.email
    }
  });
});

// ==========================================
// 2. EVENTOS EN TIEMPO REAL (SOCKET.IO)
// ==========================================

io.on("connection", (socket) => {
  console.log(`🟢 Socket conectado: ${socket.id}`);

  // Crear sala
  socket.on("crear_sala", ({ nombreSala, usuario }) => {
    const usuarioLimpio = String(usuario || "Jugador").trim();
    const codigoSala = Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase();

    salas[codigoSala] = {
      codigo: codigoSala,
      nombre: nombreSala || `Sala de ${usuarioLimpio}`,
      anfitrion: socket.id,
      estado: "espera",
      palabraActual: "",
      dibujanteId: null,
      jugadores: [
        {
          id: socket.id,
          usuario: usuarioLimpio,
          puntos: 0
        }
      ]
    };

    socket.join(codigoSala);

    socket.emit("sala_creada", {
      codigoSala,
      sala: salas[codigoSala]
    });

    console.log(`🏠 Sala creada: ${codigoSala} por ${usuarioLimpio}`);
  });

  // Unirse a sala
  socket.on("unirse_sala", ({ codigoSala, usuario }) => {
    const codigo = String(codigoSala || "").trim().toUpperCase();
    const usuarioLimpio = String(usuario || "Jugador").trim();
    const sala = salas[codigo];

    if (!sala) {
      return socket.emit("error_sala", "La sala no existe.");
    }

    const existe = sala.jugadores.find(
      (j) => j.usuario.toLowerCase() === usuarioLimpio.toLowerCase()
    );

    if (!existe) {
      sala.jugadores.push({
        id: socket.id,
        usuario: usuarioLimpio,
        puntos: 0
      });
    } else {
      existe.id = socket.id;
    }

    socket.join(codigo);

    io.to(codigo).emit("actualizar_jugadores", sala.jugadores);

    socket.emit("unido_exitoso", {
      codigoSala: codigo,
      sala
    });

    console.log(`👤 ${usuarioLimpio} se unió a la sala: ${codigo}`);
  });

  // Iniciar partida
  socket.on("iniciar_partida", ({ codigoSala, categoria }) => {
    const sala = salas[codigoSala];

    if (!sala || sala.jugadores.length === 0) return;

    const bancoPalabras = {
      general: ["MATE", "EMPANADA", "OBELISCO", "FUTBOL", "TANGO", "ASADO", "CARPINCHO"],
      personajes: ["MESSI", "MARADONA", "MAFALDA", "GATURRO"],
      lugares: ["CAMINITO", "BARILOCHE", "CORRIENTES", "OBELISCO"]
    };

    const palabras = bancoPalabras[categoria] || bancoPalabras.general;
    const palabraElegida = palabras[Math.floor(Math.random() * palabras.length)];

    sala.estado = "jugando";
    sala.palabraActual = palabraElegida;
    sala.dibujanteId = sala.jugadores[0].id;

    io.to(codigoSala).emit("partida_iniciada", {
      palabraActual: sala.palabraActual,
      dibujanteId: sala.dibujanteId,
      duracion: 60
    });
  });

  // Sincronizar trazos del Canvas
  socket.on("dibujar", ({ codigoSala, datosTrazo }) => {
    socket.to(codigoSala).emit("dibujar", datosTrazo);
  });

  // Limpiar Canvas
  socket.on("limpiar_lienzo", (codigoSala) => {
    io.to(codigoSala).emit("limpiar_lienzo");
  });

  // Chat y detección de respuestas correctas
  socket.on("enviar_mensaje", ({ codigoSala, usuario, mensaje }) => {
    const sala = salas[codigoSala];

    if (!sala || typeof mensaje !== "string") return;

    const intento = mensaje.trim().toUpperCase();

    if (sala.estado === "jugando" && intento === sala.palabraActual) {
      const jugador = sala.jugadores.find((j) => j.usuario === usuario);

      if (jugador) {
        jugador.puntos += 100;
      }

      io.to(codigoSala).emit("mensaje_recibido", {
        usuario: "ARGENTILLO",
        mensaje: `🎉 ¡${usuario} ADIVINÓ LA PALABRA! (+100 pts)`,
        tipo: "exito"
      });

      io.to(codigoSala).emit("actualizar_jugadores", sala.jugadores);
    } else {
      io.to(codigoSala).emit("mensaje_recibido", {
        usuario,
        mensaje,
        tipo: "normal"
      });
    }
  });

  // Desconexión
  socket.on("disconnect", () => {
    console.log(`🔴 Socket desconectado: ${socket.id}`);

    for (const codigo in salas) {
      const sala = salas[codigo];

      sala.jugadores = sala.jugadores.filter((j) => j.id !== socket.id);

      if (sala.jugadores.length === 0) {
        delete salas[codigo];
      } else {
        // Reasignar anfitrión si el creador abandonó
        if (sala.anfitrion === socket.id && sala.jugadores.length > 0) {
          sala.anfitrion = sala.jugadores[0].id;
        }
        io.to(codigo).emit("actualizar_jugadores", sala.jugadores);
      }
    }
  });
});

// ==========================================
// 3. INICIO DEL SERVIDOR
// ==========================================

const PORT = process.env.PORT || 4000;

server.listen(PORT, "0.0.0.0", () => {
  console.log("===========================================");
  console.log("🎨 Servidor ARGENTILLO activo");
  console.log(`Puerto: ${PORT}`);
  console.log(`Dirección: http://localhost:${PORT}`);
  console.log("===========================================");
});