"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import Boton from "@/components/Boton";
import Input from "@/components/Input";
import BotonCerrarSesion from "@/components/BotonCerrarSesionjs";
import "./juego.css";

export default function Juego() {
  const router = useRouter();
  const socket = useSocket();

  // Estados de sala y usuario
  const [codigoSala, setCodigoSala] = useState("");
  const [usuario, setUsuario] = useState("");
  const [esDibujante, setEsDibujante] = useState(true); // Cambiar a false cuando sea turno del rival
  const [palabraSecreta, setPalabraSecreta] = useState("Mate");

  // Referencia y estados del Canvas
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [prevPos, setPrevPos] = useState({ x: 0, y: 0 });

  // 1. Escuchar trazos y eventos socket del rival
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCodigoSala(params.get("sala") || "SALA1");
    setUsuario(params.get("usuario") || "Jugador");

    if (socket) {
      // Recibir trazo del rival
      socket.on("recibir_trazo", ({ x0, y0, x1, y1 }) => {
        dibujarEnCanvas(x0, y0, x1, y1);
      });

      // Recibir orden de limpiar canvas
      socket.on("canvas_limpiado", () => {
        limpiarLienzoLocal();
      });
    }

    return () => {
      if (socket) {
        socket.off("recibir_trazo");
        socket.off("canvas_limpiado");
      }
    };
  }, [socket]);

  // 2. Funciones para dibujar en la pantalla local
  const dibujarEnCanvas = (x0, y0, x1, y1) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = "#0284c7"; // Color celeste
    ctx.lineWidth = 4;           // Grosor de trazo
    ctx.lineCap = "round";       // Bordes suaves
    ctx.stroke();
  };

  const limpiarLienzoLocal = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // 3. Eventos del Mouse (Solo cuando es tu turno de dibujar)
  const handleMouseDown = (e) => {
    if (!esDibujante) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPrevPos({ x, y });
    setIsDrawing(true);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !esDibujante) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    // Dibujar localmente
    dibujarEnCanvas(prevPos.x, prevPos.y, currentX, currentY);

    // Transmitir al backend
    if (socket) {
      socket.emit("dibujar_trazo", {
        codigoSala,
        x0: prevPos.x,
        y0: prevPos.y,
        x1: currentX,
        y1: currentY,
      });
    }

    setPrevPos({ x: currentX, y: currentY });
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleBorrarLienzo = () => {
    limpiarLienzoLocal();
    if (socket) {
      socket.emit("limpiar_canvas", { codigoSala });
    }
  };

  return (
    <main className="juego-main">
      <header className="juego-header">
        <h1>ARGENTILLO 🎨</h1>
        <span className="badge-sala">Sala: {codigoSala}</span>
      </header>

      <div className="panel-canvas">
        <div className="palabra-box">
          {esDibujante ? `Te toca dibujar: ${palabraSecreta}` : "👀 ¡Adiviná el dibujo!"}
        </div>

        {/* LIENZO CANVAS */}
        <canvas
          ref={canvasRef}
          width={540}
          height={360}
          className="lienzo-pinturillo"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        {esDibujante && (
          <Boton variant="danger" className="btn-borrar" onClick={handleBorrarLienzo}>
            🗑️ Borrar Lienzo
          </Boton>
        )}
      </div>

      <BotonCerrarSesion />
    </main>
  );
}