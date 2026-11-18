'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Boton from '@/components/boton';

function PuntajePartidasContenido() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [usuario, setUsuario] = useState('');
  const [ranking, setRanking] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const getBackendUrl = () =>
    typeof window !== 'undefined'
      ? `http://${window.location.hostname}:4000`
      : 'http://localhost:4000';

  const cargarDatos = async () => {
    setCargando(true);
    setError('');
    try {
      const [resRanking, resHistorial] = await Promise.all([
        fetch(`${getBackendUrl()}/api/ranking`),
        fetch(`${getBackendUrl()}/api/partidas`),
      ]);

      const dataRanking = await resRanking.json();
      if (Array.isArray(dataRanking)) {
        setRanking(dataRanking);
      }

      if (resHistorial.ok) {
        const dataHistorial = await resHistorial.json();
        if (Array.isArray(dataHistorial)) {
          setHistorial(dataHistorial);
        }
      }
    } catch (err) {
      console.error('Error al cargar puntajes:', err);
      setError('No se pudieron cargar los puntajes desde el servidor.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    const usuarioQuery = searchParams.get('usuario');
    let nombreFinal = usuarioQuery || '';

    if (typeof window !== 'undefined') {
      const userGuardado = localStorage.getItem('usuarioArgentillo');
      if (userGuardado) {
        try {
          const parsed = JSON.parse(userGuardado);
          nombreFinal = nombreFinal || parsed.usuario || parsed.nombre || '';
        } catch {
          nombreFinal = nombreFinal || userGuardado;
        }
      }
    }

    setUsuario(nombreFinal);
    cargarDatos();
  }, [searchParams]);

  const handleVolverLobby = () => {
    if (usuario) {
      router.push(`/sala?usuario=${encodeURIComponent(usuario)}`);
    } else {
      router.push('/sala');
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        padding: '1.5rem',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* ENCABEZADO */}
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#1e293b',
          padding: '0.85rem 1.5rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img
            src="/logo.png"
            alt="Argentillo"
            style={{ height: '44px', width: 'auto', objectFit: 'contain' }}
          />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', color: '#38bdf8' }}>
              PUNTAJE DE PARTIDAS
            </h1>
            <small style={{ color: '#94a3b8' }}>
              Resultados guardados en la base de datos MySQL
            </small>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {usuario && (
            <span style={{ color: '#cbd5e1' }}>
              Jugador: <strong style={{ color: '#fff' }}>{usuario}</strong>
            </span>
          )}

          <Boton variant="secondary" onClick={cargarDatos}>
            🔄 Actualizar
          </Boton>

          <Boton variant="primary" onClick={handleVolverLobby}>
            ⬅️ Volver a Salas
          </Boton>
        </div>
      </header>

      {error && (
        <div
          style={{
            backgroundColor: '#7f1d1d',
            color: '#fecaca',
            padding: '0.85rem 1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
          }}
        >
          {error}
        </div>
      )}

      {cargando ? (
        <div
          style={{
            backgroundColor: '#1e293b',
            padding: '2rem',
            borderRadius: '12px',
            textAlign: 'center',
            color: '#94a3b8',
          }}
        >
          Cargando puntajes de partidas desde MySQL...
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '1.5rem',
            alignItems: 'start',
          }}
        >
          {/* TABLA 1: RANKING ACUMULADO POR JUGADOR */}
          <section
            style={{
              backgroundColor: '#1e293b',
              padding: '1.5rem',
              borderRadius: '12px',
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: '1rem', color: '#fbbf24' }}>
              🏆 Tabla General de Posiciones
            </h2>

            {ranking.length === 0 ? (
              <p style={{ color: '#94a3b8' }}>Todavía no hay puntajes cargados.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: '2px solid #334155',
                      color: '#94a3b8',
                      textAlign: 'left',
                    }}
                  >
                    <th style={{ padding: '0.65rem' }}>Puesto</th>
                    <th style={{ padding: '0.65rem' }}>Jugador</th>
                    <th style={{ padding: '0.65rem', textAlign: 'center' }}>Partidas</th>
                    <th style={{ padding: '0.65rem', textAlign: 'right' }}>Puntaje Total</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((fila, idx) => {
                    const esUsuarioActual =
                      usuario && fila.usuario.toLowerCase() === usuario.toLowerCase();

                    return (
                      <tr
                        key={fila.usuario}
                        style={{
                          borderBottom: '1px solid #0f172a',
                          backgroundColor: esUsuarioActual
                            ? 'rgba(56, 189, 248, 0.16)'
                            : 'transparent',
                        }}
                      >
                        <td style={{ padding: '0.7rem 0.65rem', fontWeight: 'bold' }}>
                          {idx === 0
                            ? '🥇 1°'
                            : idx === 1
                            ? '🥈 2°'
                            : idx === 2
                            ? '🥉 3°'
                            : `${idx + 1}°`}
                        </td>
                        <td style={{ padding: '0.7rem 0.65rem', fontWeight: 'bold' }}>
                          {fila.usuario} {esUsuarioActual ? '(Vos)' : ''}
                        </td>
                        <td
                          style={{
                            padding: '0.7rem 0.65rem',
                            textAlign: 'center',
                            color: '#94a3b8',
                          }}
                        >
                          {fila.partidas_jugadas}
                        </td>
                        <td
                          style={{
                            padding: '0.7rem 0.65rem',
                            textAlign: 'right',
                            fontWeight: 'bold',
                            color: '#22c55e',
                          }}
                        >
                          {fila.puntos_totales} pts
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>

          {/* TABLA 2: HISTORIAL DE PARTIDAS GUARDADAS */}
          <section
            style={{
              backgroundColor: '#1e293b',
              padding: '1.5rem',
              borderRadius: '12px',
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: '1rem', color: '#38bdf8' }}>
              📜 Últimas Partidas Guardadas
            </h2>

            {historial.length === 0 ? (
              <p style={{ color: '#94a3b8' }}>
                No hay registros individuales todavía.
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: '2px solid #334155',
                      color: '#94a3b8',
                      textAlign: 'left',
                    }}
                  >
                    <th style={{ padding: '0.65rem' }}>ID Partida</th>
                    <th style={{ padding: '0.65rem' }}>Jugador</th>
                    <th style={{ padding: '0.65rem', textAlign: 'right' }}>Puntos Obtenidos</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((item) => (
                    <tr
                      key={`${item.id_partida}-${item.usuario}`}
                      style={{ borderBottom: '1px solid #0f172a' }}
                    >
                      <td style={{ padding: '0.65rem', color: '#94a3b8' }}>
                        #{item.id_partida}
                      </td>
                      <td style={{ padding: '0.65rem', fontWeight: 'bold' }}>
                        {item.usuario}
                      </td>
                      <td
                        style={{
                          padding: '0.65rem',
                          textAlign: 'right',
                          fontWeight: 'bold',
                          color: '#38bdf8',
                        }}
                      >
                        +{item.puntaje} pts
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

export default function PuntajePartidasPage() {
  return (
    <Suspense
      fallback={<div style={{ color: '#fff', padding: '2rem' }}>Cargando puntajes...</div>}
    >
      <PuntajePartidasContenido />
    </Suspense>
  );
}