'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useSocket from '@/hooks/useSocket';
import Modal from '@/components/modal';
import Boton from '@/components/boton';

const COLORES = [
  '#000000',
  '#ef4444',
  '#3b82f6',
  '#22c55e',
  '#eab308',
  '#a855f7',
  '#f97316',
  '#92400e',
  '#ffffff',
];

// Variables simples para controlar el lápiz sin re-renderizar React
let estaDibujando = false;
let ultimaPos = { x: 0, y: 0 };
let palabraEnCurso = '';
let yaAdivinoTurno = false;

export default function JuegoPage() {
  const router = useRouter();
  const { socket } = useSocket();
  const canvasRef = useRef(null);

  const [codigoSala, setCodigoSala] = useState('');
  const [usuario, setUsuario] = useState('Jugador');
  const [categoriaSala, setCategoriaSala] = useState('TODAS');

  const [jugadores, setJugadores] = useState([]);
  const [dibujante, setDibujante] = useState('');
  const [palabraSecreta, setPalabraSecreta] = useState('');
  const [turnoActivo, setTurnoActivo] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(60);
  const [modalFinTurno, setModalFinTurno] = useState(null);

  const [colorActual, setColorActual] = useState('#000000');
  const [mensajes, setMensajes] = useState([]);
  const [textoChat, setTextoChat] = useState('');

  const esDibujante = dibujante === usuario;
  const esGoma = colorActual === '#ffffff';

  function getBackendUrl() {
    if (typeof window !== 'undefined') {
      return 'http://' + window.location.hostname + ':4000';
    }
    return 'http://localhost:4000';
  }

  function trazarLinea(ctx, x0, y0, x1, y1, color, grosor) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = color;
    ctx.lineWidth = grosor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.closePath();
  }

  function limpiarCanvasLocal() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // 1. Leer parámetros de la URL y conectar a la sala por Socket.IO
  useEffect(() => {
    limpiarCanvasLocal();

    const params = new URLSearchParams(window.location.search);
    const cod = (params.get('codigo') || '').toUpperCase();
    const user = params.get('usuario') || 'Jugador';
    const cat = params.get('categoria') || 'TODAS';

    if (!cod) {
      router.push('/sala');
      return;
    }

    setCodigoSala(cod);
    setUsuario(user);
    setCategoriaSala(cat);

    if (!socket) return;

    socket.emit('unirse_sala', { codigoSala: cod, usuario: user });

    socket.on('unido_exitoso', (data) => {
      if (data.categoria && data.categoria !== 'TODAS') {
        setCategoriaSala(String(data.categoria));
      }
      if (data.sala && data.sala.jugadores) {
        setJugadores(data.sala.jugadores);
      }
    });

    socket.on('actualizar_jugadores', (lista) => {
      setJugadores(lista);
    });

    socket.on('jugador_unido', (data) => {
      setMensajes((prev) => [
        ...prev,
        { usuario: 'Sistema', mensaje: data.usuario + ' se unió a la sala', tipo: 'sistema' },
      ]);
    });

    socket.on('dibujar', (datos) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const grosorRemoto = datos.grosor || (datos.color === '#ffffff' ? 28 : 4);
      trazarLinea(ctx, datos.x0, datos.y0, datos.x1, datos.y1, datos.color, grosorRemoto);
    });

    socket.on('limpiar_lienzo', () => {
      limpiarCanvasLocal();
    });

    socket.on('turno_iniciado', (datosTurno) => {
      setModalFinTurno(null);
      setDibujante(datosTurno.dibujante);
      setPalabraSecreta(datosTurno.palabra);
      palabraEnCurso = datosTurno.palabra;
      yaAdivinoTurno = false;
      setTiempoRestante(60);
      setTurnoActivo(true);
      limpiarCanvasLocal();

      setMensajes((prev) => [
        ...prev,
        {
          usuario: 'Sistema',
          mensaje: '🎨 ¡Comenzó el turno! Dibuja: ' + datosTurno.dibujante,
          tipo: 'sistema',
        },
      ]);
    });

    socket.on('mensaje_recibido', (msg) => {
      setMensajes((prev) => [...prev, msg]);
    });

    return () => {
      socket.off('unido_exitoso');
      socket.off('actualizar_jugadores');
      socket.off('jugador_unido');
      socket.off('dibujar');
      socket.off('limpiar_lienzo');
      socket.off('turno_iniciado');
      socket.off('mensaje_recibido');
    };
  }, [socket, router]);

  // 2. Reloj de 60 segundos del turno
  useEffect(() => {
    if (!turnoActivo) return;

    const intervalo = setInterval(() => {
      setTiempoRestante((prev) => {
        if (prev <= 1) {
          clearInterval(intervalo);
          setTurnoActivo(false);
          setModalFinTurno(palabraEnCurso);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalo);
  }, [turnoActivo]);

  async function handleIniciarTurno() {
    if (!socket) return;
    try {
      const res = await fetch(
        getBackendUrl() + '/api/palabra?id_categoria=' + encodeURIComponent(categoriaSala)
      );
      const data = await res.json();
      const palabraElegida = (data.palabra || 'MATE').toUpperCase();

      socket.emit('limpiar_lienzo', codigoSala);
      socket.emit('nuevo_turno', {
        codigoSala: codigoSala,
        datosTurno: {
          dibujante: usuario,
          palabra: palabraElegida,
          categoria: categoriaSala,
        },
      });
    } catch (error) {
      console.error('Error al obtener palabra:', error);
    }
  }

  async function handleGuardarYSalir() {
    try {
      await fetch(getBackendUrl() + '/api/partidas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigoSala: codigoSala, jugadores: jugadores }),
      });
    } catch (err) {
      console.error('Error guardando partida:', err);
    }
    router.push('/sala');
  }

  function obtenerCoordenadas(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function empezarDibujo(e) {
    if (!esDibujante && turnoActivo) return;
    estaDibujando = true;
    ultimaPos = obtenerCoordenadas(e);
  }

  function moverDibujo(e) {
    if (!estaDibujando) return;
    if (!esDibujante && turnoActivo) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const posActual = obtenerCoordenadas(e);
    const grosor = esGoma ? 28 : 4;

    trazarLinea(ctx, ultimaPos.x, ultimaPos.y, posActual.x, posActual.y, colorActual, grosor);

    if (socket) {
      socket.emit('dibujar', {
        codigoSala: codigoSala,
        datosTrazo: {
          x0: ultimaPos.x,
          y0: ultimaPos.y,
          x1: posActual.x,
          y1: posActual.y,
          color: colorActual,
          grosor: grosor,
        },
      });
    }

    ultimaPos = posActual;
  }

  function terminarDibujo() {
    estaDibujando = false;
  }

  function handleLimpiarTodo() {
    limpiarCanvasLocal();
    if (socket) {
      socket.emit('limpiar_lienzo', codigoSala);
    }
  }

  function handleEnviarMensaje(e) {
    e.preventDefault();
    const texto = textoChat.trim();
    if (!texto || !socket) return;

    const palabraObjetivo = palabraEnCurso.trim().toUpperCase();

    if (
      turnoActivo &&
      !esDibujante &&
      !yaAdivinoTurno &&
      palabraObjetivo !== '' &&
      texto.toUpperCase() === palabraObjetivo
    ) {
      yaAdivinoTurno = true;
      socket.emit('enviar_mensaje', {
        codigoSala: codigoSala,
        usuario: usuario,
        mensaje: '🎉 ¡ADIVINÓ LA PALABRA! (+100 pts)',
        tipo: 'acierto',
      });
    } else {
      socket.emit('enviar_mensaje', {
        codigoSala: codigoSala,
        usuario: usuario,
        mensaje: texto,
        tipo: 'normal',
      });
    }

    setTextoChat('');
  }

  // Arma los guiones "_ _ _" para los que tienen que adivinar
  function obtenerTextoCabecera() {
    if (!turnoActivo) return 'LISTO PARA JUGAR';
    if (esDibujante) return 'DIBUJÁ: ' + palabraSecreta;

    let guiones = '';
    for (let i = 0; i < palabraSecreta.length; i++) {
      if (palabraSecreta[i] === ' ') {
        guiones = guiones + '   ';
      } else {
        guiones = guiones + '_ ';
      }
    }
    return guiones;
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        padding: '1rem',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#1e293b',
          padding: '0.75rem 1.25rem',
          borderRadius: '12px',
          marginBottom: '1rem',
          gap: '1rem',
        }}
      >
        <div>
          <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#38bdf8' }}>
            ARGENTILLO 🎨
          </span>
          <span style={{ marginLeft: '1rem', color: '#94a3b8' }}>
            Sala: <strong style={{ color: '#fff' }}>{codigoSala}</strong>
          </span>
          <span style={{ marginLeft: '1rem', color: '#94a3b8' }}>
            Cat ID: <strong style={{ color: '#c084fc' }}>{categoriaSala}</strong>
          </span>
        </div>

        <div
          style={{
            fontSize: '1.3rem',
            fontWeight: 'bold',
            letterSpacing: '2px',
            backgroundColor: '#0f172a',
            padding: '0.4rem 1.2rem',
            borderRadius: '8px',
            border: '1px solid #334155',
          }}
        >
          {obtenerTextoCabecera()}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            style={{
              backgroundColor: tiempoRestante <= 10 && turnoActivo ? '#ef4444' : '#334155',
              padding: '0.4rem 0.8rem',
              borderRadius: '8px',
              fontWeight: 'bold',
            }}
          >
            ⏱️ {tiempoRestante}s
          </span>

          <Boton variant="primary" onClick={handleIniciarTurno}>
            🎲 Dibujar yo
          </Boton>

          <Boton variant="danger" onClick={handleGuardarYSalir}>
            Guardar y Salir
          </Boton>
        </div>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '220px 1fr 300px',
          gap: '1rem',
          alignItems: 'start',
        }}
      >
        <aside
          style={{
            backgroundColor: '#1e293b',
            padding: '1rem',
            borderRadius: '12px',
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: '0.75rem', color: '#38bdf8' }}>
            Jugadores ({jugadores.length})
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {jugadores.map((j, idx) => (
              <li
                key={j.id || idx}
                style={{
                  padding: '0.5rem',
                  marginBottom: '0.4rem',
                  borderRadius: '8px',
                  backgroundColor: j.usuario === dibujante ? '#3b82f6' : '#0f172a',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>
                  {j.usuario === dibujante ? '✏️ ' : ''}
                  {j.usuario}
                </span>
                <strong>{j.puntos || 0} pts</strong>
              </li>
            ))}
          </ul>
        </aside>

        <section
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            onMouseDown={empezarDibujo}
            onMouseMove={moverDibujo}
            onMouseUp={terminarDibujo}
            onMouseLeave={terminarDibujo}
            onTouchStart={empezarDibujo}
            onTouchMove={moverDibujo}
            onTouchEnd={terminarDibujo}
            style={{
              width: '100%',
              maxWidth: '800px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '3px solid #334155',
              cursor: !esDibujante && turnoActivo ? 'not-allowed' : esGoma ? 'cell' : 'crosshair',
              touchAction: 'none',
            }}
          />

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#1e293b',
              padding: '0.6rem 1rem',
              borderRadius: '12px',
            }}
          >
            {COLORES.map((c) => {
              const esBotonGoma = c === '#ffffff';
              const seleccionado = colorActual === c;

              return (
                <button
                  key={c}
                  type="button"
                  title={esBotonGoma ? 'Goma de borrar' : c}
                  onClick={() => setColorActual(c)}
                  style={{
                    backgroundColor: c,
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    border: seleccionado ? '3px solid #a855f7' : '2px solid #94a3b8',
                    transform: seleccionado ? 'scale(1.12)' : 'scale(1)',
                    cursor: 'pointer',
                  }}
                >
                  {esBotonGoma ? '🧽' : ''}
                </button>
              );
            })}

            <Boton
              variant="danger"
              onClick={handleLimpiarTodo}
              disabled={!esDibujante && turnoActivo}
            >
              🗑️ Limpiar todo
            </Boton>
          </div>
        </section>

        <aside
          style={{
            backgroundColor: '#1e293b',
            padding: '1rem',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            height: '560px',
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: '0.75rem', color: '#38bdf8' }}>
            Chat y Respuestas
          </h3>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              backgroundColor: '#0f172a',
              borderRadius: '8px',
              padding: '0.6rem',
              marginBottom: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}
          >
            {mensajes.map((m, i) => (
              <div
                key={i}
                style={{
                  padding: '0.35rem 0.5rem',
                  borderRadius: '6px',
                  backgroundColor:
                    m.tipo === 'acierto'
                      ? '#166534'
                      : m.tipo === 'sistema'
                      ? '#1e293b'
                      : 'transparent',
                  color: m.tipo === 'acierto' ? '#86efac' : '#f1f5f9',
                  fontSize: '0.9rem',
                }}
              >
                {m.tipo !== 'sistema' && <strong>{m.usuario}: </strong>}
                <span>{m.mensaje}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleEnviarMensaje} style={{ display: 'flex', gap: '0.4rem' }}>
            <input
              type="text"
              placeholder={
                esDibujante && turnoActivo ? 'Estás dibujando...' : 'Escribí tu respuesta...'
              }
              disabled={esDibujante && turnoActivo}
              value={textoChat}
              onChange={(e) => setTextoChat(e.target.value)}
              style={{
                flex: 1,
                padding: '0.55rem',
                borderRadius: '8px',
                border: '1px solid #334155',
                backgroundColor: '#0f172a',
                color: '#fff',
              }}
            />
            <Boton type="submit" variant="primary" disabled={esDibujante && turnoActivo}>
              Enviar
            </Boton>
          </form>
        </aside>
      </div>

      {modalFinTurno && (
        <Modal onClose={() => setModalFinTurno(null)}>
          <h2 style={{ marginTop: 0, color: '#38bdf8' }}>⏰ ¡Tiempo terminado!</h2>
          <p style={{ fontSize: '1.1rem' }}>
            La palabra secreta era: <strong style={{ color: '#22c55e' }}>{modalFinTurno}</strong>
          </p>
          <Boton variant="primary" onClick={() => setModalFinTurno(null)}>
            Continuar
          </Boton>
        </Modal>
      )}
    </main>
  );
}