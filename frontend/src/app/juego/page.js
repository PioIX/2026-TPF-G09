'use client';

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { io } from "socket.io-client";

let socket;

function JuegoContent() {
  // Hooks llamados estrictamente al inicio del componente
  const router = useRouter();
  const searchParams = useSearchParams();
  const codigo = searchParams.get("codigo");
  const usuario = searchParams.get("usuario");

  // Estados de Partida
  const [jugadores, setJugadores] = useState([]);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [copiado, setCopiado] = useState(false);

  // Reloj, Rondas, Turnos y Categoría
  const [tiempo, setTiempo] = useState(60);
  const [rondaInfo, setRondaInfo] = useState({ actual: 1, total: 3 });
  const [categoriaNombre, setCategoriaNombre] = useState("TODAS");
  const [dibujanteNombre, setDibujanteNombre] = useState("");
  const [esMiTurno, setEsMiTurno] = useState(false);
  const [palabraSecreta, setPalabraSecreta] = useState("");
  const [longitudPalabra, setLongitudPalabra] = useState(0);

  // Canvas
  const canvasRef = useRef(null);
  const [dibujando, setDibujando] = useState(false);
  const [color, setColor] = useState("#000000");
  
  useEffect(() => {
    if (!codigo || !usuario) {
      router.push("/sala");
      return;
    }

    if (!socket) socket = io("http://localhost:4000");

    socket.emit("unirse_sala", { codigoSala: codigo, usuario });

    socket.on("actualizar_jugadores", (lista) => setJugadores(lista));
    socket.on("mensaje_recibido", (msg) => setMensajes((prev) => [...prev, msg]));
    socket.on("tick_tiempo", (segundos) => setTiempo(segundos));

    socket.on("turno_iniciado", (data) => {
      const miTurno = data.dibujanteNombre === usuario;
      setDibujanteNombre(data.dibujanteNombre);
      setLongitudPalabra(data.longitudPalabra);
      setRondaInfo({ actual: data.rondaActual, total: data.totalRondas });
      setTiempo(data.duracion);
      if (data.categoria) setCategoriaNombre(data.categoria);
      setEsMiTurno(miTurno);

      if (!miTurno) {
        setPalabraSecreta("");
      }
    });

    socket.on("tu_turno", (data) => {
      setEsMiTurno(true);
      setPalabraSecreta(data.palabra);
    });

    socket.on("dibujar", (datosTrazo) => dibujarEnCanvas(datosTrazo));
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
      socket.off("tick_tiempo");
      socket.off("turno_iniciado");
      socket.off("tu_turno");
      socket.off("dibujar");
      socket.off("limpiar_lienzo");
    };
  }, [codigo, usuario, router]);

  const copiarCodigo = () => {
    navigator.clipboard.writeText(codigo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleIniciarPartida = () => {
    socket.emit("iniciar_partida", { codigoSala: codigo });
  };

  const empezarDibujo = (e) => {
    if (!esMiTurno) return;
    setDibujando(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const datosTrazo = { x, y, color, inicio: true };
    dibujarEnCanvas(datosTrazo);
    socket.emit("dibujar", { codigoSala: codigo, datosTrazo });
  };

  const hacerTrazo = (e) => {
    if (!dibujando || !esMiTurno) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const datosTrazo = { x, y, color, inicio: false };
    dibujarEnCanvas(datosTrazo);
    socket.emit("dibujar", { codigoSala: codigo, datosTrazo });
  };

  const terminarDibujo = () => {
    setDibujando(false);
  };

  const dibujarEnCanvas = ({ x, y, color, inicio }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.strokeStyle = color;

    if (inicio) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white p-4 flex flex-col items-center">
      <header className="w-full max-w-5xl glass-panel p-4 mb-4 flex flex-wrap justify-between items-center gap-4">
        <div>
          <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">
            Ronda {rondaInfo.actual} / {rondaInfo.total}
          </span>
          <h1 className="text-lg font-black">
            {esMiTurno ? (
              <span className="text-green-400">DIBUJÁ: {palabraSecreta}</span>
            ) : (
              <span className="text-slate-200">
                {dibujanteNombre ? `Dibuja ${dibujanteNombre}: ${"_ ".repeat(longitudPalabra)}` : "Esperando inicio..."}
              </span>
            )}
          </h1>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700">
          <span className="text-[10px] text-slate-400 uppercase font-bold">Categoría:</span>
          <span className="text-xs font-black text-amber-400">{categoriaNombre}</span>
        </div>

        <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-xl border border-slate-700">
          <span className="text-xs text-slate-400">CÓDIGO:</span>
          <span className="text-lg font-mono font-bold text-amber-400">{codigo}</span>
          <button
            onClick={copiarCodigo}
            className="text-xs bg-amber-400/10 border border-amber-400/30 text-amber-400 px-2 py-1 rounded hover:bg-amber-400/20 font-semibold"
          >
            {copiado ? "¡Copiado!" : "Copiar"}
          </button>
        </div>

        <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-xl border border-slate-700">
          <span className="text-xs text-slate-400">TIEMPO:</span>
          <span className={`text-2xl font-mono font-black ${tiempo <= 10 ? "timer-critical" : "text-amber-400"}`}>
            {tiempo}s
          </span>
        </div>

        <button
          onClick={handleIniciarPartida}
          className="btn-sol text-xs uppercase px-4 py-2 rounded-lg font-bold"
        >
          Iniciar / Siguiente Turno 🚀
        </button>
      </header>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Jugadores */}
        <div className="glass-panel p-4">
          <h2 className="text-sm font-bold text-amber-400 mb-3 border-b border-slate-700 pb-2">Jugadores</h2>
          <ul className="space-y-2">
            {jugadores.map((j) => (
              <li key={j.id} className={`flex justify-between items-center p-2 rounded-lg text-sm bg-slate-900/80 ${j.usuario === dibujanteNombre ? "border-l-4 border-amber-400" : ""}`}>
                <span>{j.usuario} {j.usuario === dibujanteNombre ? "✏️" : ""}</span>
                <span className="text-amber-400 font-bold">{j.puntos} pts</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Canvas de dibujo */}
        <div className="md:col-span-2 glass-panel p-4 flex flex-col items-center">
          <div className="canvas-wrapper">
            <canvas
              ref={canvasRef}
              width={400}
              height={350}
              onMouseDown={empezarDibujo}
              onMouseUp={terminarDibujo}
              onMouseLeave={terminarDibujo}
              onMouseMove={hacerTrazo}
              className={`bg-white rounded-lg touch-none ${esMiTurno ? "cursor-crosshair" : "cursor-not-allowed opacity-90"}`}
            />
          </div>

          {esMiTurno ? (
            <div className="flex flex-wrap items-center justify-between w-full mt-3 gap-2 px-2 py-2 bg-slate-900/80 rounded-xl border border-slate-700/80">
              <div className="flex items-center gap-1.5">
                {["#000000", "#ffffff", "#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#f97316"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{ backgroundColor: c }}
                    className={`color-swatch ${color === c ? "active" : ""}`}
                  />
                ))}
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 rounded-full border-none cursor-pointer bg-transparent"
                />
              </div>
              <button
                type="button"
                onClick={() => socket.emit("limpiar_lienzo", codigo)}
                className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 px-3 py-1.5 rounded-lg font-bold"
              >
                🗑️ Limpiar
              </button>
            </div>
          ) : (
            <div className="mt-3 py-1.5 px-4 bg-slate-900/50 rounded-lg text-xs text-slate-400 text-center font-medium border border-slate-800">
              👀 Mirá atentamente el dibujo e intentá adivinar la palabra
            </div>
          )}
        </div>

        {/* Chat */}
        <div className="glass-panel p-4 flex flex-col justify-between h-[420px]">
          <h2 className="text-sm font-bold text-amber-400 border-b border-slate-700 pb-2">Chat / Respuestas</h2>
          <div className="flex-1 overflow-y-auto space-y-2 my-2 pr-1 text-xs chat-messages-container">
            {mensajes.map((m, idx) => (
              <div key={idx} className={`p-2 rounded-lg chat-bubble ${m.tipo === "exito" ? "bg-green-500/20 text-green-300 border border-green-500/40 font-bold" : "bg-slate-900 text-slate-300"}`}>
                <span className="text-amber-400 font-bold">{m.usuario}: </span>
                <span>{m.mensaje}</span>
              </div>
            ))}
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (!nuevoMensaje.trim()) return;
            socket.emit("enviar_mensaje", { codigoSala: codigo, usuario, mensaje: nuevoMensaje.trim() });
            setNuevoMensaje("");
          }} className="flex gap-2">
            <input
              type="text"
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
              disabled={esMiTurno}
              placeholder={esMiTurno ? "Estás dibujando..." : "Arriesgá una palabra..."}
              className="flex-1 px-3 py-2 input-argentillo text-xs focus:outline-none disabled:opacity-50"
            />
            <button type="submit" disabled={esMiTurno} className="btn-sol px-3 py-2 text-xs uppercase disabled:opacity-50 rounded-lg">
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-amber-400 font-bold">Cargando partida...</div>}>
      <JuegoContent />
    </Suspense>
  );
}