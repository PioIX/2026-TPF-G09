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

    socket.on("jugador_unido", (nuevoJugador) => {
      setJugadores((prev) => {
        if (prev.some((j) => j.usuario === nuevoJugador.usuario)) return prev;
        return [...prev, { ...nuevoJugador, puntos: 0 }];
      });
    });

    socket.on("mensaje_recibido", (msg) => setMensajes((prev) => [...prev, msg]));
    socket.on("dibujar", (datosTrazo) => dibujarEnCanvas(datosTrazo));

    socket.on("limpiar_lienzo", () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });

    // Evento donde se recibe el nuevo turno y la palabra desde la BD
    socket.on("turno_iniciado", (datos) => {
      setTiempo(60);
      setRonda(datos.ronda);
      setDibujanteUsuario(datos.dibujanteUsuario);
      
      // Guardamos la palabra en estado para poder validar el chat
      setPalabraSecreta(datos.palabra || "");

      // Evaluamos si el usuario actual es quien dibuja
      const esDibujante = datos.dibujanteUsuario.trim().toLowerCase() === usuario.trim().toLowerCase();
      setEsMiTurno(esDibujante);
    });

    return () => {
      socket.off("jugador_unido");
      socket.off("mensaje_recibido");
      socket.off("dibujar");
      socket.off("limpiar_lienzo");
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

  // Timer local controlado por el dibujante
  useEffect(() => {
    if (!esMiTurno || tiempo <= 0) return;
    const interval = setInterval(() => setTiempo((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [esMiTurno, tiempo]);

  // Pedir palabra a MySQL (API Backend) e iniciar turno
  const iniciarSiguienteTurno = async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/palabra?id_categoria=${idCategoria}`);
      const data = await res.json();
      const palabraBD = data.palabra;

      const datosTurno = {
        dibujanteUsuario: usuario,
        ronda,
        palabra: palabraBD,
      };

      socket.emit("nuevo_turno", { codigoSala: codigo, datosTurno });
      socket.emit("limpiar_lienzo", codigo);
    } catch (err) {
      console.error("Error pidiendo palabra a la BD:", err);
    }
  };

  // Enviar y validar mensajes en el Frontend
  const handleEnviarMensaje = (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim()) return;

    const intento = nuevoMensaje.trim().toUpperCase();

    // Comprobación local de la palabra
    if (!esMiTurno && palabraSecreta && intento === palabraSecreta) {
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

  // Trazo en Canvas
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
    <main className="min-h-screen bg-slate-900 text-white p-2 md:p-4 flex flex-col items-center w-full">
      <header className="w-full glass-panel p-4 mb-4 flex flex-wrap justify-between items-center gap-4">
        <div>
          <span className="text-xs text-amber-400 font-bold uppercase">Ronda {ronda}</span>
          <h1 className="text-lg font-black">
            {esMiTurno ? (
              <span className="text-green-400">DIBUJÁ: {palabraSecreta}</span>
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

        <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-xl border border-slate-700">
          <span className="text-xs text-slate-400">TIEMPO:</span>
          <span className="text-2xl font-mono font-black text-amber-400">{tiempo}s</span>
        </div>

        <button onClick={iniciarSiguienteTurno} className="btn-sol text-xs uppercase px-4 py-2 rounded-lg font-bold">
          Iniciar Mi Turno 🚀
        </button>
      </header>

      <div className="w-full flex flex-col lg:flex-row gap-4 flex-1">
        {/* Jugadores */}
        <div className="glass-panel p-4 lg:w-1/5 h-fit">
          <h2 className="text-sm font-bold text-amber-400 mb-3 border-b border-slate-700 pb-2">Jugadores</h2>
          <ul className="space-y-2">
            {jugadores.map((j, i) => (
              <li key={i} className={`flex justify-between items-center p-2 rounded-lg text-sm bg-slate-900/80 ${j.usuario === dibujanteUsuario ? "border-l-4 border-amber-400" : ""}`}>
                <span>{j.usuario} {j.usuario === dibujanteUsuario ? "✏️" : ""}</span>
                <span className="text-amber-400 font-bold">{j.puntos} pts</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Canvas */}
        <div className="glass-panel p-4 flex-1 flex flex-col items-center w-full">
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
            <div className="flex items-center justify-between w-full mt-3 gap-2 px-3 py-2 bg-slate-900/80 rounded-xl border border-slate-700/80">
              <div className="flex items-center gap-1.5">
                {["#000000", "#ffffff", "#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7"].map((c) => (
                  <button key={c} type="button" onClick={() => setColor(c)} style={{ backgroundColor: c }} className={`color-swatch ${color === c ? "active" : ""}`} />
                ))}
              </div>
              <button type="button" onClick={() => socket.emit("limpiar_lienzo", codigo)} className="text-xs bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg font-bold">
                🗑️ Limpiar
              </button>
            </div>
          ) : (
            <div className="mt-3 py-1.5 px-4 bg-slate-900/50 rounded-lg text-xs text-slate-400 text-center font-medium border border-slate-800 w-full">
              👀 Mirá atentamente el dibujo e intentá adivinar la palabra
            </div>
          )}
        </div>

        {/* Chat */}
        <div className="glass-panel p-4 lg:w-1/4 flex flex-col justify-between h-[480px]">
          <h2 className="text-sm font-bold text-amber-400 border-b border-slate-700 pb-2">Chat / Respuestas</h2>
          <div className="flex-1 overflow-y-auto space-y-2 my-2 text-xs">
            {mensajes.map((m, idx) => (
              <div key={idx} className={`p-2 rounded-lg ${m.tipo === "exito" ? "bg-green-500/20 text-green-300 font-bold" : "bg-slate-900 text-slate-300"}`}>
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