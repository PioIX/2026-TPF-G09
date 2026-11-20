'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './login.css';
import { BACKEND_URL } from '../config/backend';

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

      const res = await fetch(`${BACKEND_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.mensaje || 'Error al iniciar sesión');
      }

      const nombreUsuario = data.usuario?.usuario || formData.usuario;
      const esAdmin = data.usuario?.es_admin ?? 0;

      localStorage.setItem('usuario', nombreUsuario);
      localStorage.setItem('esAdmin', JSON.stringify(esAdmin));
      sessionStorage.removeItem('adminKey'); // Fuerza pedir la clave maestra en cada nuevo login

      // Si es admin en la base de datos, va directo al panel; si no, a la sala de juego
      if (esAdmin === 1 || esAdmin === true || esAdmin === '1') {
        router.push('/admin');
      } else {
        router.push('/sala');
      }
    } catch (err) {
      setError(err.message || 'Error al conectar con el servidor');
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="login-container">
      <div className="login-card">
        
        <div className="login-header">
          <img src="/logo.png" alt="ARGENTILLO" className="login-logo" />
          <p className="login-subtitle">Un Pinturillo a la Argentina</p>
        </div>

        <h2 className="login-form-title">¡Bienvenido de nuevo!</h2>

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
              placeholder="Ej: ElDiego10 o admin"
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
          ¿No tenés cuenta?
          <Link href="/registro" className="login-link">
            Registrate acá
          </Link>
        </div>

      </div>
    </main>
  );
}