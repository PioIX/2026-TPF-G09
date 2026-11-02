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
  const idCategoria = searchParams.get("categoria") || "TODAS";

  // Estados de Partida
  const [jugadores, setJugadores] = useState([]);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [tiempo, setTiempo] = useState(60);
  const [ronda, setRonda] = useState(1);
  const [dibujanteUsuario, setDibujanteUsuario] = useState("");
  const [palabraSecreta, setPalabraSecreta] = useState("");
  const [esMiTurno, setEsMiTurno] = useState(false);
  const [copiado, setCopiado] = useState(false);

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

    // Jugador unido a la lista
    socket.on("jugador_unido", (nuevoJugador) => {
      setJugadores((prev) => {
        if (prev.some((j) => j.usuario === nuevoJugador.usuario)) return prev;
        return [...prev, { ...nuevoJugador, puntos: 0 }];
      });
    });

    // Chat y Trazo de dibujo
    socket.on("mensaje_recibido", (msg) => setMensajes((prev) => [...prev, msg]));
    socket.on("dibujar", (datosTrazo) => dibujarEnCanvas(datosTrazo));

    // Limpiar Canvas
    socket.on("limpiar_lienzo", () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });

    // Recibir la palabra secreta (Únicamente enviada al dibujante)
    socket.on("tu_palabra", ({ palabra }) => {
      setPalabraSecreta(palabra);
      setEsMiTurno(true);
    });

    // Notificación global de inicio de turno
    socket.on("turno_iniciado", (datos) => {
      setTiempo(datos.duracion || 60);
      setRonda(datos.ronda || 1);
      const nombreDibujante = datos.dibujanteNombre || datos.dibujanteUsuario || "Dibujante";
      setDibujanteUsuario(nombreDibujante);

      if (nombreDibujante.trim().toLowerCase() !== usuario.trim().toLowerCase()) {
        setEsMiTurno(false);
        setPalabraSecreta("");
      }
    });

    return () => {
      socket.off("jugador_unido");
      socket.off("mensaje_recibido");
      socket.off("dibujar");
      socket.off("limpiar_lienzo");
      socket.off("tu_palabra");
      socket.off("turno_iniciado");
    };
  }, [codigo, usuario, router]);

  // Dimensiones dinámicas del Canvas
  useEffect(() => {
    const recalcular = () => {
      const canvas = canvasRef.current;
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = 480;
      }
    };
    recalcular();
    window.addEventListener("resize", recalcular);
    return () => window.removeEventListener("resize", recalcular);
  }, []);

  // Timer del turno
  useEffect(() => {
    if (!esMiTurno || tiempo <= 0) return;
    const interval = setInterval(() => setTiempo((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [esMiTurno, tiempo]);

  // Iniciar Turno de forma segura (Backend obtiene la palabra de MySQL)
  const handleIniciarTurno = () => {
    if (!socket || !codigo) return;
    socket.emit("iniciar_turno", {
      codigoSala: codigo,
      idCategoria: idCategoria || "TODAS",
      ronda
    });
  };

  // Copiar código de sala al portapapeles
  const handleCopiarCodigo = () => {
    if (!codigo) return;
    navigator.clipboard.writeText(codigo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  // Enviar y validar respuestas en el Chat
  const handleEnviarMensaje = (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim()) return;

    const intento = nuevoMensaje.trim().toUpperCase();

    if (!esMiTurno && palabraSecreta && intento === palabraSecreta.toUpperCase()) {
      socket.emit("enviar_mensaje", {
        codigoSala: codigo,
        usuario: "ARGENTILLO",
        mensaje: `🎉 ¡${usuario} ADIVINÓ LA PALABRA! (${palabraSecreta})`,
        tipo: "exito",
      });

      setJugadores((prev) =>
        prev.map((j) => (j.usuario === usuario ? { ...j, puntos: j.puntos + 100 } : j))
      );
    } else {
      socket.emit("enviar_mensaje", {
        codigoSala: codigo,
        usuario,
        mensaje: nuevoMensaje.trim(),
        tipo: "normal",
      });
    }

    setNuevoMensaje("");
  };

  // Trazados en el Canvas
  const empezarDibujo = (e) => {
    if (!esMiTurno) return;
    setDibujando(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const datosTrazo = { x: e.clientX - rect.left, y: e.clientY - rect.top, color, inicio: true };
    dibujarEnCanvas(datosTrazo);
    socket.emit("dibujar", { codigoSala: codigo, datosTrazo });
  };

  const hacerTrazo = (e) => {
    if (!dibujando || !esMiTurno) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const datosTrazo = { x: e.clientX - rect.left, y: e.clientY - rect.top, color, inicio: false };
    dibujarEnCanvas(datosTrazo);
    socket.emit("dibujar", { codigoSala: codigo, datosTrazo });
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
    <main className="min-h-screen bg-slate-950 text-white p-2 md:p-4 flex flex-col items-center w-full">
      
      {/* HEADER DE SALA Y CÓDIGO DESTACADO */}
      <header className="w-full glass-panel p-4 mb-4 flex flex-wrap justify-between items-center gap-4 bg-slate-900 border border-slate-800 rounded-2xl">
        <div>
          <span className="text-xs text-amber-400 font-bold uppercase">Ronda {ronda}</span>
          <h1 className="text-lg font-black">
            {esMiTurno ? (
              <span className="text-emerald-400">DIBUJÁ: {palabraSecreta}</span>
            ) : (
              <span className="text-slate-200">
                {dibujanteUsuario ? `Dibuja ${dibujanteUsuario}: ` : "Esperando inicio... "}
                <span className="text-amber-400 font-mono tracking-widest">
                  {palabraSecreta ? "_ ".repeat(palabraSecreta.length) : ""}
                </span>
              </span>
            )}
          </h1>
        </div>

        {/* CÓDIGO DE SALA VISIBLE */}
        <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-xl border border-sky-500/40">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest">CÓDIGO DE SALA: </span>
            <span className="text-xl font-black text-amber-300 font-mono tracking-widest">{codigo || '----'}</span>
          </div>
          <button
            onClick={handleCopiarCodigo}
            className="px-2.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded-lg transition-all active:scale-95 cursor-pointer ml-1"
          >
            {copiado ? '¡Copiado! 📋' : 'Copiar 🔗'}
          </button>
        </div>

        <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-xl border border-slate-700">
          <span className="text-xs text-slate-400">TIEMPO:</span>
          <span className="text-2xl font-mono font-black text-amber-400">{tiempo}s</span>
        </div>

        <button 
          onClick={handleIniciarTurno} 
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs uppercase px-5 py-2.5 rounded-xl font-black tracking-wider transition-all shadow-lg cursor-pointer"
        >
          Iniciar Mi Turno 🚀
        </button>
      </header>

      {/* CUERPO DEL JUEGO: JUGADORES - CANVAS - CHAT */}
      <div className="w-full flex flex-col lg:flex-row gap-4 flex-1">
        
        {/* Lista de Jugadores */}
        <div className="glass-panel p-4 lg:w-1/5 h-fit bg-slate-900 border border-slate-800 rounded-2xl">
          <h2 className="text-sm font-bold text-amber-400 mb-3 border-b border-slate-700 pb-2">Jugadores</h2>
          <ul className="space-y-2">
            {jugadores.map((j, i) => (
              <li key={i} className={`flex justify-between items-center p-2 rounded-lg text-sm bg-slate-950/80 ${j.usuario === dibujanteUsuario ? "border-l-4 border-amber-400" : ""}`}>
                <span>{j.usuario} {j.usuario === dibujanteUsuario ? "✏️" : ""}</span>
                <span className="text-amber-400 font-bold">{j.puntos} pts</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Canvas de Dibujo */}
        <div className="glass-panel p-4 flex-1 flex flex-col items-center w-full bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="canvas-wrapper w-full">
            <canvas
              ref={canvasRef}
              onMouseDown={empezarDibujo}
              onMouseUp={() => setDibujando(false)}
              onMouseLeave={() => setDibujando(false)}
              onMouseMove={hacerTrazo}
              className={`w-full bg-white rounded-lg touch-none ${esMiTurno ? "cursor-crosshair" : "cursor-not-allowed opacity-90"}`}
            />
          </div>

          {esMiTurno ? (
            <div className="flex items-center justify-between w-full mt-3 gap-2 px-3 py-2 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1.5">
                {["#000000", "#ffffff", "#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7"].map((c) => (
                  <button key={c} type="button" onClick={() => setColor(c)} style={{ backgroundColor: c }} className={`w-7 h-7 rounded-full border-2 transition-transform ${color === c ? "border-amber-400 scale-110" : "border-slate-700"}`} />
                ))}
              </div>
              <button type="button" onClick={() => socket.emit("limpiar_lienzo", codigo)} className="text-xs bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg font-bold hover:bg-red-500/30">
                🗑️ Limpiar Lienzo
              </button>
            </div>
          ) : (
            <div className="mt-3 py-2 px-4 bg-slate-950/50 rounded-lg text-xs text-slate-400 text-center font-medium border border-slate-800 w-full">
              👀 Mirá atentamente el dibujo e intentá adivinar la palabra en el chat
            </div>
          )}
        </div>

        {/* Chat / Respuestas */}
        <div className="glass-panel p-4 lg:w-1/4 flex flex-col justify-between h-[480px] bg-slate-900 border border-slate-800 rounded-2xl">
          <h2 className="text-sm font-bold text-amber-400 border-b border-slate-700 pb-2">Chat / Respuestas</h2>
          <div className="flex-1 overflow-y-auto space-y-2 my-2 text-xs">
            {mensajes.map((m, idx) => (
              <div key={idx} className={`p-2 rounded-lg ${m.tipo === "exito" ? "bg-green-500/20 text-green-300 font-bold" : "bg-slate-950 text-slate-300"}`}>
                <span className="text-amber-400 font-bold">{m.usuario}: </span>
                <span>{m.mensaje}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleEnviarMensaje} className="flex gap-2">
            <input
              type="text"
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
              disabled={esMiTurno}
              placeholder={esMiTurno ? "Estás dibujando..." : "Arriesgá una palabra..."}
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs focus:outline-none disabled:opacity-50 text-white"
            />
            <button type="submit" disabled={esMiTurno} className="bg-sky-500 hover:bg-sky-400 text-white px-3 py-2 text-xs font-bold uppercase disabled:opacity-50 rounded-xl">
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-amber-400 font-bold bg-slate-950">Cargando partida...</div>}>
      <JuegoContent />
    </Suspense>
  );
}