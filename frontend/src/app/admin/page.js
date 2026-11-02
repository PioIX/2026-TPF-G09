'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '../sala/sala.css';

export default function AdminPage() {
  const router = useRouter();
  const [nuevaPalabra, setNuevaPalabra] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    const esAdmin = JSON.parse(localStorage.getItem('esAdmin') || 'false');
    if (!esAdmin) {
      router.push('/sala');
      return;
    }

    fetch('http://localhost:4000/api/categorias')
      .then((res) => res.json())
      .then((data) => {
        setCategorias(data);
        if (data.length > 0) setCategoriaSeleccionada(data[0].id_categoria);
      })
      .catch((err) => console.error('Error cargando categorías:', err));
  }, [router]);

  const handleAgregarPalabra = async (e) => {
    e.preventDefault();
    setMensaje('');

    try {
      const res = await fetch('http://localhost:4000/api/admin/palabras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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