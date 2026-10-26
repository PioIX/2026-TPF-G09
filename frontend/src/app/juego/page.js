'use client';

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { io } from "socket.io-client";

let socket;

function JuegoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const codigo = searchParams.get("codigo");
  const usuario = searchParams.get("usuario");

  const [jugadores, setJugadores] = useState([]);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [copiado, setCopiado] = useState(false);

  // Estados del Canvas
  const canvasRef = useRef(null);
  const [dibujando, setDibujando] = useState(false);
  const [color, setColor] = useState("#000000");

  useEffect(() => {
    if (!codigo || !usuario) {
      router.push("/sala");
      return;
    }

    if (!socket) {
      socket = io("http://localhost:4000");
    }

    // Unirse o reconectarse a la sala
    socket.emit("unirse_sala", { codigoSala: codigo, usuario });

    // Escuchar actualización de jugadores
    socket.on("actualizar_jugadores", (listaJugadores) => {
      setJugadores(listaJugadores);
    });

    // Escuchar chat
    socket.on("mensaje_recibido", (data) => {
      setMensajes((prev) => [...prev, data]);
    });

    // Escuchar trazos del canvas
    socket.on("dibujar", (datosTrazo) => {
      dibujarEnCanvas(datosTrazo);
    });

    socket.on("limpiar_lienzo", () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });

    return () => {
      socket.off("actualizar_jugadores");
      socket.off("mensaje_recibido");
      socket.off("dibujar");
      socket.off("limpiar_lienzo");
    };
  }, [codigo, usuario, router]);

  // Copiar código de la sala
  const copiarCodigo = () => {
    navigator.clipboard.writeText(codigo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  // Enviar mensaje al chat
  const handleEnviarMensaje = (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim()) return;

    socket.emit("enviar_mensaje", {
      codigoSala: codigo,
      usuario,
      mensaje: nuevoMensaje.trim(),
    });

    setNuevoMensaje("");
  };

  // Lógica del Canvas
  const empezarDibujo = (e) => {
    setDibujando(true);
    hacerTrazo(e);
  };

  const terminarDibujo = () => {
    setDibujando(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.beginPath();
    }
  };

  const hacerTrazo = (e) => {
    if (!dibujando) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const datosTrazo = { x, y, color };
    dibujarEnCanvas(datosTrazo);

    // Enviar trazo al servidor
    socket.emit("dibujar", { codigoSala: codigo, datosTrazo });
  };

  const dibujarEnCanvas = ({ x, y, color }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.strokeStyle = color;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const limpiarLienzo = () => {
    socket.emit("limpiar_lienzo", codigo);
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white p-4 flex flex-col items-center">
      {/* Encabezado con Código de Sala */}
      <header className="w-full max-w-5xl bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-wrap justify-between items-center mb-4 gap-4">
        <div>
          <h1 className="text-xl font-black text-amber-400">ARGENTILLO 🎨</h1>
          <p className="text-xs text-slate-400">Jugador: <span className="text-amber-300 font-bold">{usuario}</span></p>
        </div>

        {/* Código aleatorio generado */}
        <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-lg border border-slate-700">
          <span className="text-xs text-slate-400">CÓDIGO DE SALA:</span>
          <span className="text-lg font-mono font-bold text-amber-400 tracking-wider">{codigo}</span>
          <button
            onClick={copiarCodigo}
            className="text-xs bg-amber-400/10 border border-amber-400/30 text-amber-400 px-2 py-1 rounded hover:bg-amber-400/20 transition-all"
          >
            {copiado ? "¡Copiado!" : "Copiar"}
          </button>
        </div>
      </header>

      {/* Área del juego */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Lista de Jugadores */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <h2 className="text-sm font-bold text-amber-400 mb-3 border-b border-slate-700 pb-2">
            Jugadores ({jugadores.length})
          </h2>
          <ul className="space-y-2">
            {jugadores.map((j) => (
              <li key={j.id} className="flex justify-between items-center bg-slate-900 p-2 rounded-lg text-sm">
                <span className="font-medium text-slate-200">{j.usuario}</span>
                <span className="text-xs text-amber-400 font-bold">{j.puntos || 0} pts</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Canvas de Dibujo */}
        <div className="md:col-span-2 bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col items-center">
          <canvas
            ref={canvasRef}
            width={400}
            height={350}
            onMouseDown={empezarDibujo}
            onMouseUp={terminarDibujo}
            onMouseMove={hacerTrazo}
            className="bg-white rounded-lg cursor-crosshair border border-slate-600 touch-none"
          />

          {/* Herramientas de Dibujo */}
          <div className="flex gap-4 items-center mt-3">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
            />
            <button
              onClick={limpiarLienzo}
              className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/30 transition-all font-semibold"
            >
              Borrar todo
            </button>
          </div>
        </div>

        {/* Chat / Adivinanzas */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col justify-between h-[420px]">
          <h2 className="text-sm font-bold text-amber-400 border-b border-slate-700 pb-2">Chat / Respuestas</h2>

          <div className="flex-1 overflow-y-auto space-y-2 my-2 pr-1 text-xs">
            {mensajes.map((m, idx) => (
              <div key={idx} className={`p-2 rounded-lg ${m.tipo === "exito" ? "bg-green-500/20 text-green-300 border border-green-500/40" : "bg-slate-900 text-slate-300"}`}>
                <span className="font-bold text-amber-400">{m.usuario}: </span>
                <span>{m.mensaje}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleEnviarMensaje} className="flex gap-2">
            <input
              type="text"
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
              placeholder="Arriesgá una palabra..."
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
            <button type="submit" className="bg-amber-400 text-slate-950 px-3 py-2 rounded-lg font-bold text-xs hover:bg-amber-300">
              Enviar
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function JuegoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-amber-400">Cargando juego...</div>}>
      <JuegoContent />
    </Suspense>
  );
}