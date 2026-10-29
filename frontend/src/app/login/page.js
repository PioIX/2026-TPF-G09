'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './login.css';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ usuario: '', password: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const res = await fetch('http://localhost:4000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.mensaje || 'Error al iniciar sesión');
      }

      // Guardar sesión localmente
      localStorage.setItem('usuario', data.usuario.usuario);
      router.push('/sala');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="login-container">
      <div className="login-card">
        
        <div className="login-header">
          <h1 className="login-title">ARGENTILLO 🎨</h1>
          <p className="login-subtitle">¡Bienvenido de nuevo!</p>
        </div>

        <h2 className="login-form-title">Iniciar Sesión</h2>

        {error && (
          <div className="login-error">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="login-group">
            <label className="login-label">Usuario o Email</label>
            <input
              type="text"
              required
              placeholder="EJ: ElDiego10"
              value={formData.usuario}
              onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
              className="login-input"
            />
          </div>

          <div className="login-group">
            <label className="login-label">Contraseña</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="login-input"
            />
          </div>

          <button type="submit" disabled={cargando} className="login-btn">
            {cargando ? 'Entrando...' : 'Entrar 🚀'}
          </button>
        </form>

        <div className="login-footer">
          ¿No tenés cuenta?{' '}
          <Link href="/registro" className="login-link">
            Registrate acá
          </Link>
        </div>

      </div>
    </main>
  );
}