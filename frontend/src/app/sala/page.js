'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useSocket from '@/hooks/useSocket';
import Modal from '@/components/modal';
import Boton from '@/components/boton';
import './sala.css';

export default function SalaPage() {
  const router = useRouter();
  const { socket } = useSocket();
  const categoriaRef = useRef('TODAS');

  const [usuario, setUsuario] = useState('');
  const [esAdmin, setEsAdmin] = useState(false);
  const [nombreSala, setNombreSala] = useState('');
  const [categoria, setCategoria] = useState('TODAS');
  const [codigoIngreso, setCodigoIngreso] = useState('');
  const [categoriasLista, setCategoriasLista] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [mostrarRanking, setMostrarRanking] = useState(false);
  const [creando, setCreando] = useState(false);
  const [entrando, setEntrando] = useState(false);

  const getBackendUrl = () =>
    typeof window !== 'undefined'
      ? `http://${window.location.hostname}:4000`
      : 'http://localhost:4000';

  useEffect(() => {
    const userLocal = localStorage.getItem('usuario') || 'JugadorAnonimo';
    setUsuario(userLocal);

    const adminLocal = JSON.parse(localStorage.getItem('esAdmin') || 'false');
    setEsAdmin(Boolean(adminLocal));

    fetch(`${getBackendUrl()}/api/categorias`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCategoriasLista(data);
      })
      .catch((err) => console.error('Error cargando categorías:', err));
  }, []);

  useEffect(() => {
    if (!socket) return;

    const userLocal = localStorage.getItem('usuario') || 'JugadorAnonimo';

    const onSalaCreada = ({ codigoSala }) => {
      router.push(
        `/juego?codigo=${codigoSala}&usuario=${encodeURIComponent(userLocal)}&categoria=${categoriaRef.current}`
      );
    };

    const onUnidoExitoso = ({ codigoSala, categoria: catSala }) => {
      router.push(
        `/juego?codigo=${codigoSala}&usuario=${encodeURIComponent(userLocal)}&categoria=${catSala || 'TODAS'}`
      );
    };

    socket.on('sala_creada', onSalaCreada);
    socket.on('unido_exitoso', onUnidoExitoso);

    return () => {
      socket.off('sala_creada', onSalaCreada);
      socket.off('unido_exitoso', onUnidoExitoso);
    };
  }, [socket, router]);

  const abrirRanking = () => {
    fetch(`${getBackendUrl()}/api/ranking`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setRanking(data);
        setMostrarRanking(true);
      })
      .catch((err) => console.error('Error cargando ranking:', err));
  };

  const handleCrearSala = (e) => {
    e.preventDefault();
    if (!socket) return;
    setCreando(true);
    categoriaRef.current = categoria;

    const catObj = categoriasLista.find((c) => String(c.id_categoria) === String(categoria));
    const categoriaNombre = catObj ? catObj.nombre : 'TODAS';

    socket.emit('crear_sala', {
      nombreSala,
      usuario,
      categoria,
      categoriaNombre,
    });
  };

  const handleUnirseSala = (e) => {
    e.preventDefault();
    if (!codigoIngreso || !socket) return;
    setEntrando(true);

    socket.emit('unirse_sala', {
      codigoSala: codigoIngreso.toUpperCase(),
      usuario,
    });
  };

  const handleCerrarSesion = () => {
    localStorage.removeItem('usuario');
    localStorage.removeItem('esAdmin');
    router.push('/login');
  };

  return (
    <main className="sala-container">
      <div className="sala-card">
        <div className="sala-header">
          <div>
            <h1 className="sala-title">ARGENTILLO 🎨</h1>
            <p className="sala-subtitle">
              Jugador: <span>{usuario}</span>
            </p>
          </div>
          <button onClick={handleCerrarSesion} className="sala-logout-btn">
            Salir
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Boton variant="secondary" onClick={abrirRanking}>
            🏆 Ranking Histórico
          </Boton>

          {esAdmin && (
            <Boton variant="primary" onClick={() => router.push('/admin')}>
              ⚙️ Panel Admin
            </Boton>
          )}
        </div>

        <form onSubmit={handleCrearSala}>
          <h2 className="sala-section-title">Crear nueva sala</h2>

          <div className="sala-group">
            <label className="sala-label">Nombre de la Sala</label>
            <input
              type="text"
              placeholder="Ej: Sala del Diego"
              value={nombreSala}
              onChange={(e) => setNombreSala(e.target.value)}
              className="sala-input"
            />
          </div>

          <div className="sala-group">
            <label className="sala-label">Categoría de Palabras</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="sala-select"
            >
              <option value="TODAS">🌟 TODAS LAS CATEGORÍAS</option>
              {categoriasLista.map((cat) => (
                <option key={cat.id_categoria} value={cat.id_categoria}>
                  {cat.nombre.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={creando} className="sala-btn-primary">
            {creando ? 'Creando...' : 'Crear Sala 🚀'}
          </button>
        </form>

        <hr className="sala-divider" />

        <form onSubmit={handleUnirseSala}>
          <h2 className="sala-section-title">O unirte a una existente</h2>

          <div className="sala-group">
            <label className="sala-label">Código de 5 Letras</label>
            <input
              type="text"
              required
              maxLength={5}
              placeholder="EJ: X1Y2Z"
              value={codigoIngreso}
              onChange={(e) => setCodigoIngreso(e.target.value.toUpperCase())}
              className="sala-input"
            />
          </div>

          <button type="submit" disabled={entrando} className="sala-btn-secondary">
            {entrando ? 'Entrando...' : 'Unirse a la Sala 🎮'}
          </button>
        </form>
      </div>

      {mostrarRanking && (
        <Modal onClose={() => setMostrarRanking(false)}>
          <h2 style={{ marginTop: 0, color: '#fbbf24' }}>🏆 Top Jugadores Argentillo</h2>
          {ranking.length === 0 ? (
            <p>Todavía no hay partidas registradas.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0' }}>
              {ranking.map((r, i) => (
                <li
                  key={r.usuario}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0',
                    borderBottom: '1px solid #334155',
                  }}
                >
                  <span>
                    <strong>#{i + 1}</strong> {r.usuario}
                  </span>
                  <span>
                    <strong>{r.puntos_totales} pts</strong> ({r.partidas_jugadas} partidas)
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Boton variant="primary" onClick={() => setMostrarRanking(false)}>
            Cerrar
          </Boton>
        </Modal>
      )}
    </main>
  );
}