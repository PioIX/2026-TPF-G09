'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "./login.css";

export default function Login() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!usuario.trim() || !clave.trim()) {
      setError("Por favor completá todos los campos.");
      return;
    }

    setCargando(true);

    try {
      const response = await fetch("http://localhost:4000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario: usuario.trim(),
          password: clave.trim(), // Se envía como "password" según requiere Express
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("Respuesta inválida del servidor");
      }

      if (response.ok) {
        // Obtenemos el nombre exacto enviado por el backend
        const nombreUsuario = data.usuario?.usuario || usuario.trim();
        
        // Guardamos la sesión local si se necesita más adelante
        localStorage.setItem("usuario", JSON.stringify(data.usuario));

        // Redirigimos a la pantalla de salas
        router.push(`/sala?usuario=${encodeURIComponent(nombreUsuario)}`);
      } else {
        // Muestra el mensaje enviado desde Express (data.mensaje)
        setError(data.mensaje || "Credenciales incorrectas.");
      }
    } catch (err) {
      console.error("🔴 Error en login:", err);
      setError("No se pudo conectar con el servidor backend");
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">
        <h1 className="text-3xl font-black text-center text-amber-400 mb-2 tracking-wide">
          ARGENTILLO 🎨
        </h1>
        <p className="text-slate-400 text-center mb-6 text-sm">
          Iniciá sesión para entrar a jugar
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/40 text-red-400 text-sm p-3 rounded-xl mb-4 text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-300">
              Usuario o Email
            </label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Ingresá tu usuario"
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-white placeholder-slate-500 text-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-300">
              Contraseña
            </label>
            <input
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-white placeholder-slate-500 text-sm transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-3 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 disabled:bg-slate-700 text-slate-950 font-bold rounded-xl transition-all duration-200 shadow-lg shadow-amber-400/10 text-sm mt-2"
          >
            {cargando ? "Ingresando..." : "Iniciar Sesión"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          ¿No tenés una cuenta?{" "}
          <Link href="/registro" className="text-amber-400 hover:underline font-semibold">
            Registrate acá
          </Link>
        </p>
      </div>
    </main>
  );
}