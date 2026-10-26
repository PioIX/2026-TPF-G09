"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useSocket from "@/hooks/useSocket";
import Input from "@/components/Input";
import Boton from "@/components/boton";
import Badge from "@/components/Badge";
import BotonCerrarSesion from "@/components/BotonCerrarSesion";
import "./sala.css";

const CATEGORIAS = ["Fútbol", "Lugares", "Comidas", "Tradiciones"];

export default function Juego() {
  const router = useRouter();
  const { socket } = useSocket();
}
  // Estados de sala
  const [codigoSala, setCodigoSala] = useState("");
  const [usuario, setUsuario] = useState("");
  const [jugadores, setJugadores] = useState([]);
  const [esAnfitrion, setEsAnfitrion] = useState(false);

  // Estados de partida
  const [estadoJuego, setEstadoJuego] = useState("esperando"); // 'esperando' | 'jugando' | 'finalizado'
  const [esDibujante, setEsDibujante] = useState(false);
  const [palabraSecreta, setPalabraSecreta] = useState("");
  const [tiempo, setTiempo] = useState(100);
  const [subronda, setSubronda] = useState(1);

  // Chat e Intentos
  const [intento, setIntento] = useState("");
  const [chat, setChat] = useState([]);

  // Canvas y Trazo
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [prevPos, setPrevPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const salaUrl = params.get("sala") || "";
    const usuarioUrl = params.get("usuario") || "";

    setCodigoSala(salaUrl);
    setUsuario(usuarioUrl);

    if (socket && salaUrl && usuarioUrl) {
      socket.emit("unirse_sala", { codigoSala: salaUrl, usuario: usuarioUrl });

      socket.on("actualizar_jugadores", (lista) => {
        setJugadores(lista);
        const yo = lista.find((j) => j.usuario === usuarioUrl);
        if (yo) setEsAnfitrion(yo.esAnfitrion);
      });

      socket.on("inicio_turno", (data) => {
        limpiarLienzoLocal();
        setEstadoJuego("jugando");
        setJugadores(data.puntos);
        setSubronda(data.subronda);

        const soyDibujante = socket.id === data.dibujanteId;
        setEsDibujante(soyDibujante);
        setPalabraSecreta(data.palabraSecreta);

        setChat((prev) => [
          ...prev,
          { tipo: "alerta", texto: `🔔 Turno de ${data.dibujanteNombre} (Turno ${data.subronda}/3)` }
        ]);
      });

      socket.on("timer_tick", ({ tiempo }) => setTiempo(tiempo));
      socket.on("recibir_trazo", ({ x0, y0, x1, y1 }) => dibujarEnCanvas(x0, y0, x1, y1));
      socket.on("canvas_limpiado", () => limpiarLienzoLocal());

      socket.on("adivinanza_correcta", ({ usuario, puntosActualizados, palabra }) => {
        setJugadores(puntosActualizados);
        setChat((prev) => [
          ...prev,
          { tipo: "exito", texto: `🎉 ¡GOLAZO! ${usuario} adivinó la palabra "${palabra}" (+100 pts)` }
        ]);
      });

      socket.on("intento_fallido", ({ usuario, texto }) => {
        setChat((prev) => [...prev, { tipo: "normal", texto: `${usuario}: ${texto}` }]);
      });

      socket.on("tiempo_agotado", ({ palabra }) => {
        setChat((prev) => [
          ...prev,
          { tipo: "alerta", texto: `⏱️ ¡Tiempo agotado! La palabra era "${palabra}"` }
        ]);
      });

      socket.on("jugador_desconectado", ({ mensaje }) => {
        setChat((prev) => [...prev, { tipo: "alerta", texto: mensaje }]);
      });

      socket.on("fin_juego", ({ jugadores }) => {
        setEstadoJuego("finalizado");
        setJugadores(jugadores);
      });
    }

    return () => {
      if (socket) {
        socket.off("actualizar_jugadores");
        socket.off("inicio_turno");
        socket.off("timer_tick");
        socket.off("recibir_trazo");
        socket.off("canvas_limpiado");
        socket.off("adivinanza_correcta");
        socket.off("intento_fallido");
        socket.off("tiempo_agotado");
        socket.off("jugador_desconectado");
        socket.off("fin_juego");
      }
    };
  }, [socket]);

  /* ==========================================
     FUNCIONES DEL CANVAS Y ACCIONES DE JUEGO
     ========================================== */

  const dibujarEnCanvas = (x0, y0, x1, y1) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const limpiarLienzoLocal = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const startDrawing = (e) => {
    if (!esDibujante) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setPrevPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing || !esDibujante) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    dibujarEnCanvas(prevPos.x, prevPos.y, currentX, currentY);

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

  const handleBorrarLienzo = () => {
    limpiarLienzoLocal();
    if (socket) {
      socket.emit("limpiar_canvas", { codigoSala });
    }
  };

  const handleEnviarIntento = (e) => {
    e.preventDefault();
    if (!intento.trim() || esDibujante) return;

    if (socket) {
      socket.emit("enviar_intento", { codigoSala, intento, usuario });
    }
    setIntento("");
  };

return (
  <main className="juego-main">
    <header className="juego-header">
      <h1>ARGENTILLO 🎨</h1>

      <span className="sala-badge">
        Sala: {codigoSala}
      </span>
    </header>
  </main>
);