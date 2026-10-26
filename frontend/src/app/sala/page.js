'use client';

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { io } from "socket.io-client";

let socket;

function SalaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const usuarioQuery = searchParams.get("usuario");
  const [usuario, setUsuario] = useState("");

  const [nombreSala, setNombreSala] = useState("");
  const [codigoSala, setCodigoSala] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    // 1. Obtener usuario desde la URL o localStorage
    let user = usuarioQuery;
    if (!user) {
      const stored = localStorage.getItem("usuario");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          user = parsed.usuario;
        } catch {
          user = stored;
        }
      }
    }

    // Si no hay usuario, mandamos al login
    if (!user) {
      router.push("/login");
      return;
    }

    setUsuario(user);

    // 2. Conectar Socket.io al servidor backend
    if (!socket) {
      socket = io("http://localhost:4000");
    }

    // 3. Escuchar respuestas del servidor
    const onSalaCreada = ({ codigoSala }) => {
      setCargando(false);
      router.push(`/juego?codigo=${codigoSala}&usuario=${encodeURIComponent(user)}`);
    };

    const onUnidoExitoso = ({ codigoSala }) => {
      setCargando(false);
      router.push(`/juego?codigo=${codigoSala}&usuario=${encodeURIComponent(user)}`);
    };

    const onErrorSala = (msg) => {
      setCargando(false);
      setError(msg);
    };

    socket.on("sala_creada", onSalaCreada);
    socket.on("unido_exitoso", onUnidoExitoso);
    socket.on("error_sala", onErrorSala);

    return () => {
      socket.off("sala_creada", onSalaCreada);
      socket.off("unido_exitoso", onUnidoExitoso);
      socket.off("error_sala", onErrorSala);
    };
  }, [router, usuarioQuery]);

  const handleCrearSala = (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    if (!socket) socket = io("http://localhost:4000");

    socket.emit("crear_sala", {
      nombreSala: nombreSala.trim() || `Sala de ${usuario}`,
      usuario: usuario,
    });
  };

  const handleUnirseSala = (e) => {
    e.preventDefault();
    setError("");

    if (!codigoSala.trim()) {
      setError("Ingresá un código de sala válido.");
      return;
    }

    setCargando(true);

    if (!socket) socket = io("http://localhost:4000");

    socket.emit("unirse_sala", {
      codigoSala: codigoSala.trim().toUpperCase(),
      usuario: usuario,
    });
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-700">
        <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
          <div>
            <h1 className="text-2xl font-black text-amber-400">ARGENTILLO 🎨</h1>
            <p className="text-xs text-slate-400">¡Hola, <span className="text-amber-300 font-bold">{usuario}</span>!</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("usuario");
              router.push("/login");
            }}
            className="text-xs bg-red-500/10 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-all"
          >
            Cerrar sesión
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/40 text-red-400 text-sm p-3 rounded-xl mb-6 text-center font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Opción 1: Crear Sala */}
          <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-700/60 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-amber-400 mb-1">Crear Sala</h2>
              <p className="text-xs text-slate-400 mb-4">Iniciá una sala privada y sé el anfitrión.</p>
              
              <form onSubmit={handleCrearSala} className="space-y-3">
                <input
                  type="text"
                  value={nombreSala}
                  onChange={(e) => setNombreSala(e.target.value)}
                  placeholder="Nombre de la sala (opcional)"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm rounded-lg transition-all disabled:bg-slate-700"
                >
                  {cargando ? "Creando..." : "Crear Sala 🚀"}
                </button>
              </form>
            </div>
          </div>

          {/* Opción 2: Unirse a Sala */}
          <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-700/60 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-amber-400 mb-1">Unirse a Sala</h2>
              <p className="text-xs text-slate-400 mb-4">Ingresá con el código que te pasó un amigo.</p>
              
              <form onSubmit={handleUnirseSala} className="space-y-3">
                <input
                  type="text"
                  value={codigoSala}
                  onChange={(e) => setCodigoSala(e.target.value.toUpperCase())}
                  placeholder="Ej: X1Y2Z"
                  maxLength={5}
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white uppercase placeholder-slate-500 tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white font-bold text-sm rounded-lg transition-all disabled:bg-slate-800"
                >
                  {cargando ? "Entrando..." : "Unirse 🎮"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SalaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-amber-400">Cargando salas...</div>}>
      <SalaContent />
    </Suspense>
  );
}