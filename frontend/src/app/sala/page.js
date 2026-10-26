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
  const [categoria, setCategoria] = useState("TODAS"); // 👈 Estado para categoría
  const [codigoSala, setCodigoSala] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
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

    if (!user) {
      router.push("/login");
      return;
    }

    setUsuario(user);

    if (!socket) socket = io("http://localhost:4000");

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

    // Enviamos 'categoria' al backend
    socket.emit("crear_sala", {
      nombreSala: nombreSala.trim() || `Sala de ${usuario}`,
      usuario,
      categoria,
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
      usuario,
    });
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel p-8 w-full max-w-lg border border-slate-700/50 shadow-2xl">
        <div className="flex justify-between items-center mb-6 border-b border-slate-700/60 pb-4">
          <div>
            <h1 className="text-2xl font-black text-amber-400">ARGENTILLO 🎨</h1>
            <p className="text-xs text-slate-400">Jugador: <span className="text-amber-300 font-bold">{usuario}</span></p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("usuario");
              router.push("/login");
            }}
            className="text-xs bg-red-500/10 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-all font-semibold"
          >
            Cerrar sesión
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/40 text-red-400 text-sm p-3 rounded-xl mb-6 text-center font-medium animate-shake">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CREAR SALA */}
          <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-700/60 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-amber-400 mb-1">Crear Sala</h2>
              <p className="text-xs text-slate-400 mb-4">Elegí el nombre y la categoría de palabras.</p>

              <form onSubmit={handleCrearSala} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={nombreSala}
                    onChange={(e) => setNombreSala(e.target.value)}
                    placeholder="Ej: Sala del Diego"
                    className="w-full px-3 py-2 input-argentillo text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Categoría</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full px-3 py-2 input-argentillo text-xs bg-slate-900 cursor-pointer"
                  >
                    <option value="TODAS">🇦R TODAS LAS CATEGORÍAS</option>
                    <option value="COMIDAS">🥟 COMIDAS Y BEBIDAS</option>
                    <option value="FUTBOL">⚽ FÚTBOL ARGENTINO</option>
                    <option value="CULTURA">🏛️ CULTURA Y LUGARES</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full py-2.5 btn-sol text-xs uppercase tracking-wider rounded-lg mt-2"
                >
                  {cargando ? "Creando..." : "Crear Sala 🚀"}
                </button>
              </form>
            </div>
          </div>

          {/* UNIRSE A SALA */}
          <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-700/60 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-amber-400 mb-1">Unirse a Sala</h2>
              <p className="text-xs text-slate-400 mb-4">Ingresá con el código de 5 letras de tu amigo.</p>

              <form onSubmit={handleUnirseSala} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Código</label>
                  <input
                    type="text"
                    value={codigoSala}
                    onChange={(e) => setCodigoSala(e.target.value.toUpperCase())}
                    placeholder="EJ: X1Y2Z"
                    maxLength={5}
                    required
                    className="w-full px-3 py-2 input-argentillo text-xs tracking-widest font-mono text-center uppercase"
                  />
                </div>

                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full py-2.5 btn-argentina text-xs uppercase tracking-wider rounded-lg"
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-amber-400 font-bold">Cargando salas...</div>}>
      <SalaContent />
    </Suspense>
  );
}