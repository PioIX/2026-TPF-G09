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
  const [palabras, setPalabras] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [editTexto, setEditTexto] = useState('');
  const [editCat, setEditCat] = useState('');
  const [mensaje, setMensaje] = useState('');

  function getBackendUrl() {
    if (typeof window !== 'undefined') {
      return 'http://' + window.location.hostname + ':4000';
    }
    return 'http://localhost:4000';
  }

  function cargarPalabras(key) {
    fetch(getBackendUrl() + '/api/admin/palabras', {
      headers: { 'x-admin-key': key },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPalabras(data);
        }
      })
      .catch((err) => console.error('Error cargando palabras:', err));
  }

  useEffect(() => {
    const esAdmin = localStorage.getItem('esAdmin');

    if (esAdmin !== '1' && esAdmin !== 'true') {
      router.push('/sala');
      return;
    }

    fetch(getBackendUrl() + '/api/categorias')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategorias(data);
          if (data.length > 0) {
            setCategoriaSeleccionada(data[0].id_categoria);
          }
        }
      })
      .catch((err) => console.error('Error cargando categorías:', err));

    const claveGuardada = sessionStorage.getItem('adminKey');
    if (claveGuardada) {
      setClaveActiva(claveGuardada);
      setVerificado(true);
      cargarPalabras(claveGuardada);
    }
  }, [router]);

  async function handleVerificar(e) {
    e.preventDefault();
    setMensaje('');
    setVerificando(true);

    const usuarioActual = localStorage.getItem('usuario') || '';

    try {
      const res = await fetch(getBackendUrl() + '/api/admin/verificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario: usuarioActual,
          claveAdmin: claveInput.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMensaje('⚠️ ' + (data.mensaje || 'Clave incorrecta'));
        setVerificando(false);
        return;
      }

      const key = claveInput.trim();
      sessionStorage.setItem('adminKey', key);
      setClaveActiva(key);
      setVerificado(true);
      setMensaje('');
      cargarPalabras(key);
    } catch (err) {
      setMensaje('⚠️ Error de conexión con el servidor');
    }

    setVerificando(false);
  }

  async function handleAgregarPalabra(e) {
    e.preventDefault();
    setMensaje('');

    try {
      const res = await fetch(getBackendUrl() + '/api/admin/palabras', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': claveActiva,
        },
        body: JSON.stringify({
          palabra: nuevaPalabra,
          id_categoria: categoriaSeleccionada,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMensaje('⚠️ ' + data.mensaje);
        return;
      }

      setMensaje('✅ Palabra agregada correctamente');
      setNuevaPalabra('');
      cargarPalabras(claveActiva);
    } catch (err) {
      setMensaje('⚠️ Error al guardar la palabra');
    }
  }

  function iniciarEdicion(p) {
    setEditandoId(p.id_palabra);
    setEditTexto(p.palabra);
    setEditCat(p.id_categoria);
  }

  async function handleGuardarEdicion(id) {
    try {
      const res = await fetch(getBackendUrl() + '/api/admin/palabras/' + id, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': claveActiva,
        },
        body: JSON.stringify({
          palabra: editTexto,
          id_categoria: editCat,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMensaje('⚠️ ' + data.mensaje);
        return;
      }

      setEditandoId(null);
      setMensaje('✅ Palabra actualizada');
      cargarPalabras(claveActiva);
    } catch (err) {
      setMensaje('⚠️ Error al actualizar');
    }
  }

  async function handleEliminarPalabra(id) {
    try {
      const res = await fetch(getBackendUrl() + '/api/admin/palabras/' + id, {
        method: 'DELETE',
        headers: { 'x-admin-key': claveActiva },
      });

      const data = await res.json();
      if (!res.ok) {
        setMensaje('⚠️ ' + data.mensaje);
        return;
      }

      setMensaje('🗑️ Palabra eliminada');
      cargarPalabras(claveActiva);
    } catch (err) {
      setMensaje('⚠️ Error al eliminar');
    }
  }

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
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link
              href="/puntajepartidas"
              className="sala-logout-btn"
              style={{ textDecoration: 'none', backgroundColor: '#2563eb', color: '#fff' }}
            >
              Puntaje Partidas 🏆
            </Link>
            <Link href="/sala" className="sala-logout-btn" style={{ textDecoration: 'none' }}>
              Volver a la Sala
            </Link>
          </div>
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

        <hr className="sala-divider" />

        <h2 className="sala-section-title">Palabras Cargadas ({palabras.length})</h2>
        <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
          {palabras.map((p) => (
            <div
              key={p.id_palabra}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0',
                borderBottom: '1px solid #334155',
              }}
            >
              {editandoId === p.id_palabra ? (
                <>
                  <input
                    type="text"
                    value={editTexto}
                    onChange={(e) => setEditTexto(e.target.value)}
                    className="sala-input"
                    style={{ padding: '0.35rem' }}
                  />
                  <select
                    value={editCat}
                    onChange={(e) => setEditCat(e.target.value)}
                    className="sala-select"
                    style={{ padding: '0.35rem' }}
                  >
                    {categorias.map((c) => (
                      <option key={c.id_categoria} value={c.id_categoria}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleGuardarEdicion(p.id_palabra)}
                    className="sala-logout-btn"
                    style={{ backgroundColor: '#22c55e', color: '#000' }}
                  >
                    Guardar
                  </button>
                </>
              ) : (
                <>
                  <span>
                    <strong>{p.palabra}</strong> <small>({p.categoria})</small>
                  </span>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={() => iniciarEdicion(p)}
                      className="sala-logout-btn"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminarPalabra(p.id_palabra)}
                      className="sala-logout-btn"
                      style={{ backgroundColor: '#ef4444' }}
                    >
                      Borrar
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}