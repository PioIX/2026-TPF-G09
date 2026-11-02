'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

      const nombreUsuario = data.usuario?.usuario || formData.usuario;
      const esAdmin = data.usuario?.es_admin ?? data.usuario?.esAdmin ?? 0;

      localStorage.setItem('usuario', nombreUsuario);
      localStorage.setItem('esAdmin', JSON.stringify(esAdmin));

      router.push('/sala');
    } catch (err) {
      setError(err.message || 'Error de conexión con el servidor');
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100">
      <div className="p-8 w-full max-w-md border border-slate-700/50 shadow-2xl relative overflow-hidden rounded-2xl bg-slate-900/80 backdrop-blur-md">
        
        <div className="text-center mb-6">
          <h1 className="text-3xl font-black text-sky-400">ARGENTILLO 🎨</h1>
          <p className="text-slate-400 text-sm">¡Bienvenido de nuevo!</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl mb-4 text-center font-semibold">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              Usuario o Email
            </label>
            <input
              type="text"
              required
              placeholder="EJ: ElDiego10"
              value={formData.usuario}
              onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-sky-400 text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-sky-400 text-white"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl text-sm uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
          >
            {cargando ? 'Entrando...' : 'Entrar 🚀'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          ¿No tenés cuenta?{' '}
          <Link href="/registro" className="text-amber-400 hover:underline font-bold">
            Registrate acá
          </Link>
        </p>

      </div>
    </main>
  );
}