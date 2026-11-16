'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import io from 'socket.io-client';
import './sala.css';

export default function SalaPage() {
  const router = useRouter();
  const socketRef = useRef(null);
  const categoriaRef = useRef('TODAS');

  const [usuario, setUsuario] = useState('');
  const [esAdmin, setEsAdmin] = useState(false);
  const [nombreSala, setNombreSala] = useState('');
  const [categoria, setCategoria] = useState('TODAS');
  const [codigoIngreso, setCodigoIngreso] = useState('');
  const [categoriasLista, setCategoriasLista] = useState([]);
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

    const backendUrl = getBackendUrl();
    const socket = io(backendUrl);
    socketRef.current = socket;

    fetch(`${backendUrl}/api/categorias`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCategoriasLista(data);
      })
      .catch((err) => console.error('Error cargando categorías:', err));

    socket.on('sala_creada', ({ codigoSala }) => {
      router.push(
        `/juego?codigo=${codigoSala}&usuario=${encodeURIComponent(userLocal)}&categoria=${categoriaRef.current}`
      );
    });

    socket.on('unido_exitoso', ({ codigoSala, categoria: catSala }) => {
      router.push(
        `/juego?codigo=${codigoSala}&usuario=${encodeURIComponent(userLocal)}&categoria=${catSala || 'TODAS'}`
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [router]);

  const handleCrearSala = (e) => {
    e.preventDefault();
    setCreando(true);
    categoriaRef.current = categoria;

    if (!socketRef.current) {
      socketRef.current = io(getBackendUrl());
    }

    const catObj = categoriasLista.find((c) => String(c.id_categoria) === String(categoria));
    const categoriaNombre = catObj ? catObj.nombre : 'TODAS';

    socketRef.current.emit('crear_sala', {
      nombreSala,
      usuario,
      categoria,
      categoriaNombre
    });
  };

  const handleUnirseSala = (e) => {
    e.preventDefault();
    if (!codigoIngreso) return;
    setEntrando(true);

    if (!socketRef.current) {
      socketRef.current = io(getBackendUrl());
    }

    socketRef.current.emit('unirse_sala', {
      codigoSala: codigoIngreso.toUpperCase(),
      usuario
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
            <p className="sala-subtitle">Jugador: <span>{usuario}</span></p>
          </div>
          <button onClick={handleCerrarSesion} className="sala-logout-btn">
            Salir
          </button>
        </div>

        {esAdmin && (
          <button
            onClick={() => router.push('/admin')}
            className="sala-btn-secondary"
            style={{ marginBottom: '1.25rem', backgroundColor: '#a855f7', color: '#ffffff' }}
          >
            ⚙️ PANEL DE ADMINISTRADOR
          </button>
        )}

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
    </main>
  );
}