'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '../sala/sala.css';

export default function AdminPage() {
  const router = useRouter();
  const [verificado, setVerificado] = useState(false);
  const [claveInput, setClaveInput] = useState('');
  const [claveActiva, setClaveActiva] = useState('');
  const [verificando, setVerificando] = useState(false);

  const [nuevaPalabra, setNuevaPalabra] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [mensaje, setMensaje] = useState('');

  const getBackendUrl = () =>
    typeof window !== 'undefined'
      ? `http://${window.location.hostname}:4000`
      : 'http://localhost:4000';

  useEffect(() => {
    const esAdminRaw = localStorage.getItem('esAdmin');
    const esAdmin = esAdminRaw ? JSON.parse(esAdminRaw) : false;

    if (!esAdmin || esAdmin === 0 || esAdmin === '0') {
      router.push('/sala');
      return;
    }

    const claveGuardada = sessionStorage.getItem('adminKey');
    if (claveGuardada) {
      setClaveActiva(claveGuardada);
      setVerificado(true);
    }

    fetch(`${getBackendUrl()}/api/categorias`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategorias(data);
          if (data.length > 0) setCategoriaSeleccionada(data[0].id_categoria);
        }
      })
      .catch((err) => console.error('Error cargando categorías:', err));
  }, [router]);

  const handleVerificar = async (e) => {
    e.preventDefault();
    setMensaje('');
    setVerificando(true);

    const usuarioActual = localStorage.getItem('usuario') || '';

    try {
      const res = await fetch(`${getBackendUrl()}/api/admin/verificar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario: usuarioActual,
          claveAdmin: claveInput.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || 'Clave incorrecta');

      sessionStorage.setItem('adminKey', claveInput.trim());
      setClaveActiva(claveInput.trim());
      setVerificado(true);
      setMensaje('');
    } catch (err) {
      setMensaje(`⚠️ ${err.message}`);
    } finally {
      setVerificando(false);
    }
  };

  const handleAgregarPalabra = async (e) => {
    e.preventDefault();
    setMensaje('');

    try {
      const res = await fetch(`${getBackendUrl()}/api/admin/palabras`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': claveActiva
        },
        body: JSON.stringify({
          palabra: nuevaPalabra,
          id_categoria: categoriaSeleccionada
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje);

      setMensaje('✅ Palabra agregada correctamente');
      setNuevaPalabra('');
    } catch (err) {
      setMensaje(`⚠️ ${err.message}`);
    }
  };

  if (!verificado) {
    return (
      <main className="sala-container">
        <div className="sala-card">
          <div className="sala-header">
            <div>
              <h1 className="sala-title">Verificación Admin 🔒</h1>
              <p className="sala-subtitle">Ingresá la clave de seguridad para continuar</p>
            </div>
            <Link href="/sala" className="sala-logout-btn" style={{ textDecoration: 'none' }}>
              Volver a la Sala
            </Link>
          </div>

          {mensaje && (
            <p className="sala-subtitle" style={{ color: '#f87171', fontWeight: 'bold', marginBottom: '1rem' }}>
              {mensaje}
            </p>
          )}

          <form onSubmit={handleVerificar}>
            <div className="sala-group">
              <label className="sala-label">Código de Administrador</label>
              <input
                type="password"
                required
                placeholder="Ingresá la clave secreta..."
                value={claveInput}
                onChange={(e) => setClaveInput(e.target.value)}
                className="sala-input"
              />
            </div>

            <button type="submit" disabled={verificando} className="sala-btn-primary">
              {verificando ? 'Verificando...' : 'Desbloquear Panel 🔓'}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="sala-container">
      <div className="sala-card">
        <div className="sala-header">
          <div>
            <h1 className="sala-title">Panel Admin ⚙️</h1>
            <p className="sala-subtitle">Gestión de palabras de Argentillo</p>
          </div>
          <Link href="/sala" className="sala-logout-btn" style={{ textDecoration: 'none' }}>
            Volver a la Sala
          </Link>
        </div>

        {mensaje && (
          <p className="sala-subtitle" style={{ color: '#fbbf24', fontWeight: 'bold' }}>
            {mensaje}
          </p>
        )}

        <form onSubmit={handleAgregarPalabra}>
          <h2 className="sala-section-title">Cargar Nueva Palabra</h2>

          <div className="sala-group">
            <label className="sala-label">Palabra</label>
            <input
              type="text"
              required
              placeholder="Ej: CHORIPAN"
              value={nuevaPalabra}
              onChange={(e) => setNuevaPalabra(e.target.value)}
              className="sala-input"
            />
          </div>

          <div className="sala-group">
            <label className="sala-label">Categoría</label>
            <select
              value={categoriaSeleccionada}
              onChange={(e) => setCategoriaSeleccionada(e.target.value)}
              className="sala-select"
            >
              {categorias.map((cat) => (
                <option key={cat.id_categoria} value={cat.id_categoria}>
                  {cat.nombre.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="sala-btn-primary">
            Guardar Palabra 💾
          </button>
        </form>
      </div>
    </main>
  );
}