'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSocket from '@/hooks/useSocket';
import Modal from '@/components/modal';
import Boton from '@/components/boton';
import './sala.css';

// Variable simple para guardar la categoría elegida antes de entrar a la sala
let categoriaElegida = 'TODAS';

export default function SalaPage() {
  const router = useRouter();
  const { socket } = useSocket();

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

  function getBackendUrl() {
    if (typeof window !== 'undefined') {
      return 'http://' + window.location.hostname + ':4000';
    }
    return 'http://localhost:4000';
  }

  // 1. Cargar datos del usuario desde localStorage y pedir categorías a MySQL
  useEffect(() => {
    const userLocal = localStorage.getItem('usuario') || 'JugadorAnonimo';
    setUsuario(userLocal);

    const adminLocal = localStorage.getItem('esAdmin');
    if (adminLocal === '1' || adminLocal === 'true') {
      setEsAdmin(true);
    } else {
      setEsAdmin(false);
    }

    fetch(getBackendUrl() + '/api/categorias')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategoriasLista(data);
        }
      })
      .catch((err) => console.error('Error cargando categorías:', err));
  }, []);

  // 2. Escuchar respuestas del servidor cuando se crea o se une a una sala
  useEffect(() => {
    if (!socket) return;

    const userLocal = localStorage.getItem('usuario') || 'JugadorAnonimo';

    socket.on('sala_creada', (data) => {
      router.push(
        '/juego?codigo=' + data.codigoSala + '&usuario=' + userLocal + '&categoria=' + categoriaElegida
      );
    });

    socket.on('unido_exitoso', (data) => {
      const catSala = data.categoria || 'TODAS';
      router.push(
        '/juego?codigo=' + data.codigoSala + '&usuario=' + userLocal + '&categoria=' + catSala
      );
    });

    return () => {
      socket.off('sala_creada');
      socket.off('unido_exitoso');
    };
  }, [socket, router]);

  function abrirRanking() {
    fetch(getBackendUrl() + '/api/ranking')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRanking(data);
        }
        setMostrarRanking(true);
      })
      .catch((err) => console.error('Error cargando ranking:', err));
  }

  function handleCrearSala(e) {
    e.preventDefault();
    if (!socket) return;
    setCreando(true);
    categoriaElegida = categoria;

    // Buscamos el nombre de la categoría elegida con un ciclo for común
    let categoriaNombre = 'TODAS';
    for (let i = 0; i < categoriasLista.length; i++) {
      if (String(categoriasLista[i].id_categoria) === String(categoria)) {
        categoriaNombre = categoriasLista[i].nombre;
      }
    }

    socket.emit('crear_sala', {
      nombreSala: nombreSala,
      usuario: usuario,
      categoria: categoria,
      categoriaNombre: categoriaNombre,
    });
  }

  function handleUnirseSala(e) {
    e.preventDefault();
    if (!codigoIngreso || !socket) return;
    setEntrando(true);

    socket.emit('unirse_sala', {
      codigoSala: codigoIngreso.toUpperCase(),
      usuario: usuario,
    });
  }

  function handleCerrarSesion() {
    localStorage.removeItem('usuario');
    localStorage.removeItem('esAdmin');
    router.push('/login');
  }

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