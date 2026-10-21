var express = require('express'); 
var http = require('http'); 
var { Server } = require('socket.io'); 
var bodyParser = require('body-parser'); 
var cors = require('cors');
const { realizarQuery } = require('./modulos/mysql');

var app = express(); 
var port = process.env.PORT || 4000; 

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

const server = http.createServer(app);

// Configuración de Socket.IO con CORS para permitir puertos 3000 y 3001
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

let salasActivas = {};

// Consulta asíncrona para obtener palabra aleatoria desde la BD según categoría
async function obtenerPalabraDeBD(nombreCategoria) {
  try {
    const query = `
      SELECT p.palabra 
      FROM Palabra p 
      INNER JOIN categoria c ON p.id_categoria = c.id_categoria 
      WHERE LOWER(c.nombre) = LOWER('${nombreCategoria}') 
         OR LOWER(c.categoria) = LOWER('${nombreCategoria}')
    `;
    const resultados = await realizarQuery(query);

    if (resultados && resultados.length > 0) {
      const randomIndex = Math.floor(Math.random() * resultados.length);
      return resultados[randomIndex].palabra;
    }
  } catch (error) {
    console.error("Error al consultar palabras en la base de datos:", error);
  }
  return "Mate"; // Palabra de respaldo si no hay registros
}

io.on('connection', (socket) => {
  console.log('⚡ Jugador conectado por Socket:', socket.id);

  // CREAR SALA PRIVADA
  socket.on('crear_sala', ({ usuario }) => {
    const codigoSala = Math.random().toString(36).substring(2, 8).toUpperCase();
    socket.join(codigoSala);

    salasActivas[codigoSala] = {
      codigo: codigoSala,
      jugadores: [{ id: socket.id, usuario, puntos: 0, esAnfitrion: true }],
      estado: 'esperando',
      categoria: null,
      palabraActual: "",
      dibujanteIndex: 0,
      rondaActual: 1,
      subronda: 1,
      tiempoRestante: 100,
      intervalo: null
    };

    socket.emit('sala_creada', { codigoSala, sala: salasActivas[codigoSala] });
  });

  // UNIRSE A SALA
  socket.on('unirse_sala', ({ codigoSala, usuario }) => {
    const codigo = codigoSala ? codigoSala.toUpperCase() : '';
    const sala = salasActivas[codigo];

    if (!sala) return socket.emit('error_sala', 'La sala no existe o venció');
    
    const yaEstaEnSala = sala.jugadores.some(j => j.id === socket.id);
    if (sala.jugadores.length >= 2 && !yaEstaEnSala) {
      return socket.emit('error_sala', 'La sala está llena');
    }

    socket.join(codigo);
    if (!yaEstaEnSala) {
      sala.jugadores.push({ id: socket.id, usuario, puntos: 0, esAnfitrion: false });
    }

    socket.emit('sala_unida', { codigoSala: codigo, sala });
    io.to(codigo).emit('actualizar_jugadores', sala.jugadores);
  });

  // SELECCIONAR CATEGORÍA E INICIAR TURNO
  socket.on('seleccionar_categoria', ({ codigoSala, categoria }) => {
    const sala = salasActivas[codigoSala];
    if (!sala) return;

    sala.categoria = categoria;
    sala.estado = 'jugando';

    iniciarTurno(codigoSala);
  });

  // SINCRONIZACIÓN DE CANVAS Y DIBUJO
  socket.on('dibujar_trazo', ({ codigoSala, x0, y0, x1, y1 }) => {
    socket.to(codigoSala).emit('recibir_trazo', { x0, y0, x1, y1 });
  });

  socket.on('limpiar_canvas', ({ codigoSala }) => {
    io.to(codigoSala).emit('canvas_limpiado');
  });

  // ENVIAR ADIVINANZA Y CHAT
  socket.on('enviar_intento', ({ codigoSala, intento, usuario }) => {
    const sala = salasActivas[codigoSala];
    if (!sala) return;

    const esCorrecto = intento.trim().toLowerCase() === sala.palabraActual.toLowerCase();

    if (esCorrecto) {
      const jugador = sala.jugadores.find(j => j.id === socket.id);
      if (jugador) jugador.puntos += 100;

      io.to(codigoSala).emit('adivinanza_correcta', {
        usuario,
        puntosActualizados: sala.jugadores,
        palabra: sala.palabraActual
      });

      clearInterval(sala.intervalo);
      avanzarTurno(codigoSala);
    } else {
      io.to(codigoSala).emit('intento_fallido', { usuario, texto: intento });
    }
  });

  // MANEJO DE DESCONEXIONES EN TIEMPO REAL
  socket.on('disconnect', () => {
    console.log('🔴 Jugador desconectado:', socket.id);

    for (const codigo in salasActivas) {
      const sala = salasActivas[codigo];
      const index = sala.jugadores.findIndex(j => j.id === socket.id);

      if (index !== -1) {
        const jugadorSalido = sala.jugadores[index];
        sala.jugadores.splice(index, 1);

        if (sala.intervalo) clearInterval(sala.intervalo);

        if (sala.jugadores.length === 0) {
          setTimeout(() => {
            if (salasActivas[codigo] && salasActivas[codigo].jugadores.length === 0) {
              delete salasActivas[codigo];
            }
          }, 5000);
        } else {
          io.to(codigo).emit('jugador_desconectado', {
            mensaje: `⚠️ ${jugadorSalido.usuario} abandonó la partida.`
          });
        }
        break;
      }
    }
  });
});

async function iniciarTurno(codigoSala) {
  const sala = salasActivas[codigoSala];
  if (!sala) return;

  // Obtener palabra desde la BD de MySQL
  sala.palabraActual = await obtenerPalabraDeBD(sala.categoria);
  sala.tiempoRestante = 100;

  const dibujanteActual = sala.jugadores[sala.dibujanteIndex];

  io.to(codigoSala).emit('inicio_turno', {
    dibujanteId: dibujanteActual.id,
    dibujanteNombre: dibujanteActual.usuario,
    palabraSecreta: sala.palabraActual,
    puntos: sala.jugadores,
    subronda: sala.subronda,
    ronda: sala.rondaActual
  });

  clearInterval(sala.intervalo);
  sala.intervalo = setInterval(() => {
    sala.tiempoRestante--;
    io.to(codigoSala).emit('timer_tick', { tiempo: sala.tiempoRestante });

    if (sala.tiempoRestante <= 0) {
      clearInterval(sala.intervalo);
      io.to(codigoSala).emit('tiempo_agotado', { palabra: sala.palabraActual });
      avanzarTurno(codigoSala);
    }
  }, 1000);
}

function avanzarTurno(codigoSala) {
  const sala = salasActivas[codigoSala];
  if (!sala) return;

  sala.subronda++;

  if (sala.subronda > 3) {
    sala.subronda = 1;
    sala.dibujanteIndex = (sala.dibujanteIndex === 0) ? 1 : 0;
    sala.rondaActual++;
  }

  if (sala.rondaActual > 2 && sala.dibujanteIndex === 0) {
    io.to(codigoSala).emit('fin_juego', { jugadores: sala.jugadores });
    if (sala.intervalo) clearInterval(sala.intervalo);
    delete salasActivas[codigoSala];
  } else {
    setTimeout(() => {
      iniciarTurno(codigoSala);
    }, 3000);
  }
}

/* ==========================================
   RUTAS HTTP AUTENTICACIÓN (MySQL)
   ========================================== */
app.get('/', function(req, res){ res.send({ message: 'OK' }); });

app.post('/registro', async function(req, res) {
  const nombre = req.body.usuario || req.body.nombre;
  const mail = req.body.email || req.body.mail;
  const contraseña = req.body.contrasena || req.body.contraseña;
  const edad = req.body.edad || 18;

  if (!nombre || !mail || !contraseña) {
    return res.status(400).send({ message: "Completá todos los campos obligatorios" });
  }

  try {
    let usuarioExistente = await realizarQuery(
      `SELECT * FROM Usuario WHERE mail="${mail}" OR nombre="${nombre}"`
    );

    if (usuarioExistente && usuarioExistente.length > 0) {
      return res.status(400).send({ message: "El usuario o email ya existe" });
    }

    await realizarQuery(`
      INSERT INTO Usuario (nombre, edad, mail, contraseña) VALUES
      ("${nombre}", ${edad}, "${mail}", "${contraseña}");
    `);

    res.status(200).send({ message: "Usuario registrado con éxito" });
  } catch (error) {
    console.error("Error en /registro:", error);
    res.status(500).send({ message: "Error interno en la base de datos" });
  }
});

app.post('/login', async function(req, res) {
  const usuarioIngresado = req.body.usuario || req.body.nombre;
  const claveIngresada = req.body.clave || req.body.contrasena || req.body.contraseña;

  if (!usuarioIngresado || !claveIngresada) {
    return res.status(400).send({ message: "Ingresá usuario y contraseña" });
  }

  try {
    let resultado = await realizarQuery(
      `SELECT * FROM Usuario WHERE (nombre="${usuarioIngresado}" OR mail="${usuarioIngresado}") AND contraseña="${claveIngresada}"`
    );

    if (resultado && resultado.length > 0) {
      res.status(200).send({ 
        message: "Login correcto", 
        usuario: resultado[0].nombre 
      });
    } else {
      res.status(401).send({ message: "Usuario o contraseña incorrectos" });
    }
  } catch (error) {
    console.error("Error en /login:", error);
    res.status(500).send({ message: "Error en la base de datos" });
  }
});

server.listen(port, () => console.log(`Servidor NodeJS corriendo en http://localhost:${port}`));