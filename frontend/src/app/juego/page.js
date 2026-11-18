'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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

const MAX_RONDAS = 3;

function JuegoContenido() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { socket } = useSocket();

  const codigoSala = (searchParams.get('codigo') || '').toUpperCase();
  const usuario = searchParams.get('usuario') || 'Jugador';
  const categoriaUrl = searchParams.get('categoria') || 'TODAS';

  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const categoriaRef = useRef(categoriaUrl);
  const palabraActualRef = useRef('');
  const yaAdivinoRef = useRef(false);
  const turnoIdRef = useRef(1);

  const [jugadores, setJugadores] = useState([]);
  const [categoriaSala, setCategoriaSala] = useState(categoriaUrl);
  const [dibujante, setDibujante] = useState('');
  const [palabraSecreta, setPalabraSecreta] = useState('');
  const [turnoActivo, setTurnoActivo] = useState(false);
  const [rondaActual, setRondaActual] = useState(0);
  const [tiempoRestante, setTiempoRestante] = useState(60);
  const [modalFinPartida, setModalFinPartida] = useState(null);

  const [colorActual, setColorActual] = useState('#000000');
  const [mensajes, setMensajes] = useState([]);
  const [textoChat, setTextoChat] = useState('');

  const esDibujante = dibujante === usuario;
  const miJugador = jugadores.find((j) => j.usuario === usuario);
  const misTurnosJugados = miJugador?.turnosJugados || 0;
  const puedeDibujarAhora = turnoActivo && esDibujante;
  const partidaFinalizada =
    !turnoActivo &&
    jugadores.length > 0 &&
    jugadores.every((j) => (j.turnosJugados || 0) >= MAX_RONDAS);
  const esGoma = colorActual.toLowerCase() === '#ffffff';

  const getBackendUrl = () =>
    typeof window !== 'undefined'
      ? `http://${window.location.hostname}:4000`
      : 'http://localhost:4000';

  const trazarLinea = (ctx, x0, y0, x1, y1, color, grosor) => {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = color;
    ctx.lineWidth = grosor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.closePath();
  };

  const limpiarCanvasLocal = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    limpiarCanvasLocal();

    if (!codigoSala) {
      router.push('/sala');
      return;
    }

    if (!socket) return;

    socket.emit('unirse_sala', { codigoSala, usuario });

    const onUnidoExitoso = (data) => {
      if (data?.categoria && data.categoria !== 'TODAS') {
        categoriaRef.current = String(data.categoria);
        setCategoriaSala(String(data.categoria));
      }
      if (data?.sala?.jugadores) {
        setJugadores(data.sala.jugadores);
      }
    };

    const onActualizarJugadores = (lista) => {
      setJugadores(lista);
    };

    const onJugadorUnido = ({ usuario: nuevoUsuario }) => {
      setMensajes((prev) => [
        ...prev,
        { usuario: 'Sistema', mensaje: `${nuevoUsuario} se unió a la sala`, tipo: 'sistema' },
      ]);
    };

    const onDibujar = (datos) => {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      const grosorRemoto = datos.grosor || (datos.color === '#ffffff' ? 28 : 4);
      trazarLinea(ctx, datos.x0, datos.y0, datos.x1, datos.y1, datos.color, grosorRemoto);
    };

    const onLimpiarLienzo = () => {
      limpiarCanvasLocal();
    };

    const onTurnoIniciado = (datosTurno) => {
      setModalFinPartida(null);
      isDrawingRef.current = false;
      setDibujante(datosTurno.dibujante);
      setPalabraSecreta(datosTurno.palabra);
      setRondaActual(datosTurno.rondaActual || 1);
      palabraActualRef.current = datosTurno.palabra;
      turnoIdRef.current = datosTurno.turnoId || turnoIdRef.current + 1;
      yaAdivinoRef.current = false;
      setTiempoRestante(60);
      setTurnoActivo(true);
      limpiarCanvasLocal();

      setMensajes((prev) => [
        ...prev,
        {
          usuario: 'Sistema',
          mensaje: `🎨 Ronda ${datosTurno.rondaActual || 1}/${datosTurno.maxRondas || MAX_RONDAS} — Dibuja: ${datosTurno.dibujante}`,
          tipo: 'sistema',
        },
      ]);
    };

    const onPartidaTerminada = ({ ultimaPalabra }) => {
      isDrawingRef.current = false;
      setTurnoActivo(false);
      setDibujante('');
      limpiarCanvasLocal();
      setModalFinPartida(ultimaPalabra || palabraActualRef.current);
    };

    const onMensajeRecibido = (msg) => {
      setMensajes((prev) => [...prev, msg]);
    };

    socket.on('unido_exitoso', onUnidoExitoso);
    socket.on('actualizar_jugadores', onActualizarJugadores);
    socket.on('jugador_unido', onJugadorUnido);
    socket.on('dibujar', onDibujar);
    socket.on('limpiar_lienzo', onLimpiarLienzo);
    socket.on('turno_iniciado', onTurnoIniciado);
    socket.on('partida_terminada', onPartidaTerminada);
    socket.on('mensaje_recibido', onMensajeRecibido);

    return () => {
      socket.off('unido_exitoso', onUnidoExitoso);
      socket.off('actualizar_jugadores', onActualizarJugadores);
      socket.off('jugador_unido', onJugadorUnido);
      socket.off('dibujar', onDibujar);
      socket.off('limpiar_lienzo', onLimpiarLienzo);
      socket.off('turno_iniciado', onTurnoIniciado);
      socket.off('partida_terminada', onPartidaTerminada);
      socket.off('mensaje_recibido', onMensajeRecibido);
    };
  }, [socket, codigoSala, usuario, router]);

  useEffect(() => {
    if (!turnoActivo) return;

    const intervalo = setInterval(() => {
      setTiempoRestante((prev) => {
        if (prev <= 1) {
          clearInterval(intervalo);
          isDrawingRef.current = false;
          setTurnoActivo(false);
          limpiarCanvasLocal();

          if (esDibujante && socket) {
            socket.emit('tiempo_agotado', {
              codigoSala,
              turnoActual: turnoIdRef.current,
              palabraAnterior: palabraActualRef.current,
            });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalo);
  }, [turnoActivo, esDibujante, socket, codigoSala]);

  const handleIniciarTurno = async () => {
    if (!socket || turnoActivo || misTurnosJugados >= MAX_RONDAS) return;
    try {
      const res = await fetch(
        `${getBackendUrl()}/api/palabra?id_categoria=${encodeURIComponent(categoriaRef.current)}`
      );
      const data = await res.json();
      const palabraElegida = (data?.palabra || 'MATE').toUpperCase();

      socket.emit('limpiar_lienzo', codigoSala);
      socket.emit('nuevo_turno', {
        codigoSala,
        datosTurno: {
          dibujante: usuario,
          palabra: palabraElegida,
          categoria: categoriaRef.current,
          turnoId: 1,
        },
      });
    } catch (error) {
      console.error('Error al obtener palabra:', error);
    }
  };

  const handleGuardarYSalir = async () => {
    try {
      await fetch(`${getBackendUrl()}/api/partidas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigoSala, jugadores }),
      });
    } catch (err) {
      console.error('Error guardando partida:', err);
    } finally {
      router.push('/sala');
    }
  };

  const obtenerCoordenadas = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const empezarDibujo = (e) => {
    if (!puedeDibujarAhora) return;
    isDrawingRef.current = true;
    lastPosRef.current = obtenerCoordenadas(e);
  };

  const moverDibujo = (e) => {
    if (!isDrawingRef.current || !puedeDibujarAhora) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const posActual = obtenerCoordenadas(e);
    const grosor = esGoma ? 28 : 4;

    trazarLinea(
      ctx,
      lastPosRef.current.x,
      lastPosRef.current.y,
      posActual.x,
      posActual.y,
      colorActual,
      grosor
    );

    socket?.emit('dibujar', {
      codigoSala,
      datosTrazo: {
        x0: lastPosRef.current.x,
        y0: lastPosRef.current.y,
        x1: posActual.x,
        y1: posActual.y,
        color: colorActual,
        grosor,
      },
    });

    lastPosRef.current = posActual;
  };

  const terminarDibujo = () => {
    isDrawingRef.current = false;
  };

  const handleLimpiarTodo = () => {
    if (!puedeDibujarAhora) return;
    limpiarCanvasLocal();
    socket?.emit('limpiar_lienzo', codigoSala);
  };

  const handleEnviarMensaje = (e) => {
    e.preventDefault();
    const texto = textoChat.trim();
    if (!texto || !socket) return;

    const palabraObjetivo = palabraActualRef.current.trim().toUpperCase();

    if (
      turnoActivo &&
      !esDibujante &&
      !yaAdivinoRef.current &&
      palabraObjetivo &&
      texto.toUpperCase() === palabraObjetivo
    ) {
      yaAdivinoRef.current = true;
      socket.emit('enviar_mensaje', {
        codigoSala,
        usuario,
        mensaje: '🎉 ¡ADIVINÓ LA PALABRA! (+100 pts)',
        tipo: 'acierto',
      });
    } else {
      socket.emit('enviar_mensaje', {
        codigoSala,
        usuario,
        mensaje: texto,
        tipo: 'normal',
      });
    }

    setTextoChat('');
  };

  const palabraEnmascarada = palabraSecreta
    ? palabraSecreta
        .split('')
        .map((letra) => (letra === ' ' ? '   ' : '_'))
        .join(' ')
    : 'ESPERANDO TURNO...';

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <img
            src="/logo.png"
            alt="Argentillo"
            style={{ height: '42px', width: 'auto', objectFit: 'contain' }}
          />
          <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#38bdf8' }}>
            ARGENTILLO
          </span>
          <span style={{ marginLeft: '0.6rem', color: '#94a3b8' }}>
            Sala: <strong style={{ color: '#fff' }}>{codigoSala}</strong>
          </span>
          <span style={{ marginLeft: '0.6rem', color: '#94a3b8' }}>
            Cat ID: <strong style={{ color: '#c084fc' }}>{categoriaSala}</strong>
          </span>
          {turnoActivo && (
            <span style={{ marginLeft: '0.6rem', color: '#94a3b8' }}>
              Ronda: <strong style={{ color: '#38bdf8' }}>{rondaActual}/{MAX_RONDAS}</strong>
            </span>
          )}
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
          {turnoActivo
            ? esDibujante
              ? `DIBUJÁ: ${palabraSecreta}`
              : palabraEnmascarada
            : partidaFinalizada
            ? '🏁 PARTIDA FINALIZADA'
            : 'LISTO PARA JUGAR'}
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

          <Boton
            variant="primary"
            onClick={handleIniciarTurno}
            disabled={turnoActivo || misTurnosJugados >= MAX_RONDAS}
          >
            {misTurnosJugados >= MAX_RONDAS
              ? '✅ Rondas completas'
              : turnoActivo
              ? '🎨 En juego'
              : '🎲 Empezar partida'}
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
            {jugadores.map((j, idx) => {
              const rondasJugadas = j.turnosJugados || 0;
              return (
                <li
                  key={j.id || idx}
                  style={{
                    padding: '0.5rem',
                    marginBottom: '0.4rem',
                    borderRadius: '8px',
                    backgroundColor: j.usuario === dibujante ? '#3b82f6' : '#0f172a',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>
                    {j.usuario === dibujante ? '✏️ ' : rondasJugadas >= MAX_RONDAS ? '✅ ' : ''}
                    {j.usuario}{' '}
                    <small style={{ color: '#94a3b8' }}>
                      ({rondasJugadas}/{MAX_RONDAS})
                    </small>
                  </span>
                  <strong>{j.puntos || 0} pts</strong>
                </li>
              );
            })}
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
              cursor: !puedeDibujarAhora ? 'not-allowed' : esGoma ? 'cell' : 'crosshair',
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
              const esBotonGoma = c.toLowerCase() === '#ffffff';
              const seleccionado = colorActual.toLowerCase() === c.toLowerCase();

              return (
                <button
                  key={c}
                  type="button"
                  disabled={!puedeDibujarAhora}
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
                    cursor: puedeDibujarAhora ? 'pointer' : 'not-allowed',
                    opacity: puedeDibujarAhora ? 1 : 0.5,
                  }}
                >
                  {esBotonGoma ? '🧽' : ''}
                </button>
              );
            })}

            <Boton
              variant="danger"
              onClick={handleLimpiarTodo}
              disabled={!puedeDibujarAhora}
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

      {modalFinPartida && (
        <Modal onClose={() => setModalFinPartida(null)}>
          <h2 style={{ marginTop: 0, color: '#38bdf8' }}>🏁 ¡Partida terminada!</h2>
          <p style={{ fontSize: '1.1rem' }}>
            La última palabra era: <strong style={{ color: '#22c55e' }}>{modalFinPartida}</strong>
          </p>
          <p style={{ color: '#94a3b8' }}>
            Todos los jugadores completaron sus {MAX_RONDAS} rondas de dibujo.
          </p>
          <Boton variant="primary" onClick={handleGuardarYSalir}>
            🏆 Guardar puntajes y salir
          </Boton>
        </Modal>
      )}
    </main>
  );
}

export default function JuegoPage() {
  return (
    <Suspense fallback={<div style={{ color: '#fff', padding: '2rem' }}>Cargando partida...</div>}>
      <JuegoContenido />
    </Suspense>
  );
}