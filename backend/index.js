const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// ==========================================
// CONFIGURACIÓN Y CONEXIÓN A MYSQL
// ==========================================
const db = mysql.createPool({
  host: "localhost",
  user: "root",            // Ajustá tu usuario de MySQL
  password: "",            // Ajustá tu contraseña de MySQL
  database: "argentillo",  // Nombre de la base de datos
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Banco de memoria para usuarios y salas de juego
const usuarios = []; 
const salas = {};    

// Función para obtener palabra aleatoria de la base de datos
async function obtenerPalabraAleatoria() {
  try {
    const [rows] = await db.query("SELECT palabra FROM palabras ORDER BY RAND() LIMIT 1");
    if (rows.length > 0) {
      return rows[0].palabra.trim().toUpperCase();
    }
  } catch (error) {
    console.error("🔴 Error consultando palabras en MySQL:", error.message);
  }
  // Palabras de respaldo en caso de fallo de conexión a la BD
  const respaldo = ["MATE", "EMPANADA", "OBELISCO", "ASADO", "CARPINCHO"];
  return respaldo[Math.floor(Math.random() * respaldo.length)];
}

// ==========================================
// ENDPOINTS REST
// ==========================================

// Autenticación: Registro
app.post("/api/registro", (req, res) => {
  const { usuario, email, password } = req.body;

  if (!usuario || !email || !password) {
    return res.status(400).json({ mensaje: "Todos los campos son obligatorios." });
  }

  const existe = usuarios.find((u) => u.usuario === usuario || u.email === email);
  if (existe) {
    return res.status(400).json({ mensaje: "El usuario o email ya existe." });
  }

  const nuevoUsuario = { usuario, email, password };
  usuarios.push(nuevoUsuario);

  return res.status(201).json({ mensaje: "Usuario registrado con éxito", usuario: nuevoUsuario });
});

// Autenticación: Login
app.post("/api/login", (req, res) => {
  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.status(400).json({ mensaje: "Ingresá tu usuario y contraseña." });
  }

  const user = usuarios.find(
    (u) => (u.usuario === usuario || u.email === usuario) && u.password === password
  );

  if (!user) {
    return res.status(401).json({ mensaje: "Credenciales incorrectas." });
  }

  return res.json({ mensaje: "Inicio de sesión exitoso", usuario: user });
});

// Agregar palabras dinámicamente a la BD
app.post("/api/palabras", async (req, res) => {
  const { palabra } = req.body;

  if (!palabra || !palabra.trim()) {
    return res.status(400).json({ mensaje: "Ingresá una palabra válida." });
  }

  try {
    await db.query("INSERT INTO palabras (palabra) VALUES (?)", [palabra.trim().toUpperCase()]);
    return res.status(201).json({ mensaje: "Palabra guardada exitosamente." });
  } catch (error) {
    return res.status(500).json({ mensaje: "Error al guardar palabra o ya existe.", error: error.message });
  }
});

// ==========================================
// LÓGICA DE PARTIDA, TURNOS Y TEMPORIZADOR
// ==========================================

async function iniciarNuevoTurno(codigoSala) {
  const sala = salas[codigoSala];
  if (!sala || sala.jugadores.length === 0) return;

  if (sala.timerInterval) {
    clearInterval(sala.timerInterval);
  }

  // Rotación de dibujante y control de rondas
  if (sala.dibujanteIndex >= sala.jugadores.length) {
    sala.dibujanteIndex = 0;
    sala.rondaActual += 1;
  }

  if (sala.rondaActual > sala.totalRondas) {
    sala.estado = "finalizado";
    io.to(codigoSala).emit("juego_terminado", { jugadores: sala.jugadores });
    return;
  }

  const dibujanteActual = sala.jugadores[sala.dibujanteIndex];
  sala.dibujanteId = dibujanteActual.id;

  // Obtención asíncrona de la palabra desde MySQL
  sala.palabraActual = await obtenerPalabraAleatoria();
  sala.tiempoRestante = 60;

  // 1. Enviar la palabra secreta ÚNICAMENTE al dibujante
  io.to(sala.dibujanteId).emit("tu_turno", {
    palabra: sala.palabraActual,
    duracion: sala.tiempoRestante,
  });

  // 2. Notificar a toda la sala
  io.to(codigoSala).emit("turno_iniciado", {
    dibujanteId: sala.dibujanteId,
    dibujanteNombre: dibujanteActual.usuario,
    longitudPalabra: sala.palabraActual.length,
    rondaActual: sala.rondaActual,
    totalRondas: sala.totalRondas,
    duracion: sala.tiempoRestante,
  });

  io.to(codigoSala).emit("limpiar_lienzo");

  // 3. Control del tiempo mediante temporizador
  sala.timerInterval = setInterval(() => {
    sala.tiempoRestante -= 1;
    io.to(codigoSala).emit("tick_tiempo", sala.tiempoRestante);

    if (sala.tiempoRestante <= 0) {
      clearInterval(sala.timerInterval);
      io.to(codigoSala).emit("mensaje_recibido", {
        usuario: "ARGENTILLO",
        mensaje: `⏱️ ¡Tiempo agotado! La palabra era: ${sala.palabraActual}`,
        tipo: "exito",
      });

      sala.dibujanteIndex += 1;
      setTimeout(() => iniciarNuevoTurno(codigoSala), 3000);
    }
  }, 1000);
}

// ==========================================
// EVENTOS REAL-TIME CON SOCKET.IO
// ==========================================

io.on("connection", (socket) => {

  socket.on("crear_sala", ({ nombreSala, usuario }) => {
    const codigoSala = Math.random().toString(36).substring(2, 7).toUpperCase();

    salas[codigoSala] = {
      codigo: codigoSala,
      nombre: nombreSala || `Sala de ${usuario}`,
      anfitrion: socket.id,
      estado: "espera",
      palabraActual: "",
      dibujanteId: null,
      dibujanteIndex: 0,
      rondaActual: 1,
      totalRondas: 3,
      tiempoRestante: 60,
      timerInterval: null,
      jugadores: [{ id: socket.id, usuario, puntos: 0 }],
    };

    socket.join(codigoSala);
    socket.emit("sala_creada", { codigoSala, sala: salas[codigoSala] });
  });

  socket.on("unirse_sala", ({ codigoSala, usuario }) => {
    const sala = salas[codigoSala];

    if (!sala) {
      return socket.emit("error_sala", "La sala no existe.");
    }

    const yaExiste = sala.jugadores.find((j) => j.usuario === usuario);
    if (!yaExiste) {
      sala.jugadores.push({ id: socket.id, usuario, puntos: 0 });
    } else {
      yaExiste.id = socket.id;
    }

    socket.join(codigoSala);
    socket.emit("unido_exitoso", { codigoSala });
    io.to(codigoSala).emit("actualizar_jugadores", sala.jugadores);
  });

  socket.on("iniciar_partida", ({ codigoSala }) => {
    const sala = salas[codigoSala];
    if (!sala) return;

    sala.estado = "jugando";
    sala.rondaActual = 1;
    sala.dibujanteIndex = 0;

    iniciarNuevoTurno(codigoSala);
  });

  socket.on("enviar_mensaje", ({ codigoSala, usuario, mensaje }) => {
    const sala = salas[codigoSala];
    if (!sala || typeof mensaje !== "string") return;

    if (sala.estado !== "jugando" || socket.id === sala.dibujanteId) {
      return io.to(codigoSala).emit("mensaje_recibido", { usuario, mensaje, tipo: "normal" });
    }

    const intento = mensaje.trim().toUpperCase();

    if (intento === sala.palabraActual) {
      const jugador = sala.jugadores.find((j) => j.usuario === usuario);
      if (jugador) jugador.puntos += 100;

      io.to(codigoSala).emit("mensaje_recibido", {
        usuario: "ARGENTILLO",
        mensaje: `🎉 ¡${usuario} ADIVINÓ LA PALABRA! (+100 pts)`,
        tipo: "exito",
      });

      io.to(codigoSala).emit("actualizar_jugadores", sala.jugadores);

      clearInterval(sala.timerInterval);
      sala.dibujanteIndex += 1;
      setTimeout(() => iniciarNuevoTurno(codigoSala), 2000);
    } else {
      io.to(codigoSala).emit("mensaje_recibido", { usuario, mensaje, tipo: "normal" });
    }
  });

  socket.on("dibujar", ({ codigoSala, datosTrazo }) => {
    socket.to(codigoSala).emit("dibujar", datosTrazo);
  });

  socket.on("limpiar_lienzo", (codigoSala) => {
    io.to(codigoSala).emit("limpiar_lienzo");
  });

  socket.on("disconnect", () => {
    for (const codigo in salas) {
      const sala = salas[codigo];
      sala.jugadores = sala.jugadores.filter((j) => j.id !== socket.id);

      if (sala.jugadores.length === 0) {
        if (sala.timerInterval) clearInterval(sala.timerInterval);
        delete salas[codigo];
      } else {
        io.to(codigo).emit("actualizar_jugadores", sala.jugadores);
      }
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor de ARGENTILLO corriendo en http://localhost:${PORT}`);
});