'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegistroPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const res = await fetch("http://localhost:4000/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/login");
      } else {
        setError(data.mensaje || "Error al registrarse");
      }
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel p-8 w-full max-w-md border border-slate-700/50 shadow-2xl relative overflow-hidden">
        
        {/* Glow decorativo de fondo */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-sky-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-6">
          <div className="inline-block bg-amber-400/10 border border-amber-400/30 px-3 py-1 rounded-full text-xs font-bold text-amber-400 mb-2">
            🇦🇷 ¡Sumate a la comunidad!
          </div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-amber-300 to-sky-400">
            CREAR CUENTA
          </h1>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl mb-4 text-center animate-shake font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              Usuario
            </label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Ej: ElDiego10"
              required
              className="w-full px-4 py-2.5 input-argentillo text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="w-full px-4 py-2.5 input-argentillo text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2.5 input-argentillo text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-3 btn-argentina rounded-xl text-sm uppercase tracking-wider mt-2 disabled:opacity-50"
          >
            {cargando ? "Registrando..." : "Registrarme 🚀"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="text-amber-400 hover:underline font-bold">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </main>
  );
}