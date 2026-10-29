'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './registro.css';

export default function RegistroPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ usuario: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const res = await fetch('http://localhost:4000/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.mensaje || 'Error al registrarse');
      }

      router.push('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="registro-container">
      <div className="registro-card">
        
        <div className="registro-header">
          <h1 className="registro-title">ARGENTILLO 🎨</h1>
          <p className="registro-subtitle">¡Sumate a la comunidad!</p>
        </div>

        <h2 className="registro-form-title">Crear Cuenta</h2>

        {error && (
          <div className="registro-error">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="registro-group">
            <label className="registro-label">Usuario</label>
            <input
              type="text"
              required
              placeholder="EJ: ElDiego10"
              value={formData.usuario}
              onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
              className="registro-input"
            />
          </div>

          <div className="registro-group">
            <label className="registro-label">Email</label>
            <input
              type="email"
              required
              placeholder="tu@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="registro-input"
            />
          </div>

          <div className="registro-group">
            <label className="registro-label">Contraseña</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="registro-input"
            />
          </div>

          <button type="submit" disabled={cargando} className="registro-btn">
            {cargando ? 'Registrando...' : 'Registrarme 🚀'}
          </button>
        </form>

        <div className="registro-footer">
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="registro-link">
            Iniciá sesión
          </Link>
        </div>

      </div>
    </main>
  );
}