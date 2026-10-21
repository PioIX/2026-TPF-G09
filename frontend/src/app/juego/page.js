"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useSocket from "@/hooks/useSocket";
import Input from "@/components/Input";
import Boton from "@/components/Boton";
import Badge from "@/components/Badge";
import BotonCerrarSesion from "@/components/BotonCerrarSesion";
import "./juego.css";

export default function Juego() {
  const router = useRouter();
  const { socket } = useSocket();

  // Estados de sala y usuario
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

  // 1. Escuchar trazos y eventos socket del rival
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
        socket.off("recibir_trazo");
        socket.off("canvas_limpiado");
      }
    };
  }, [socket]);

  /* ==========================================
     FUNCIONES DEL CANVAS (DIBUJO Y RETRANSMISIÓN)
     ========================================== */

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
        <Badge variant="gold">Sala: {codigoSala}</Badge>
      </header>

      {/* VISTA 1: SALA DE ESPERA */}
      {estadoJuego === "esperando" && (
        <div className="card-espera">
          <h2>Jugadores en Sala ({jugadores.length}/2)</h2>
          <div style={{ margin: "15px 0" }}>
            {jugadores.map((j) => (
              <p key={j.id} style={{ margin: "6px 0", fontSize: "1.1rem", fontWeight: 600 }}>
                👤 {j.usuario} {j.esAnfitrion ? "👑" : ""}
              </p>
            ))}
          </div>

          {jugadores.length < 2 ? (
            <p style={{ color: "#f59e0b", fontWeight: 700 }}>⏳ Esperando al rival para comenzar...</p>
          ) : esAnfitrion ? (
            <div>
              <p style={{ fontWeight: 700, color: "#0284c7" }}>Elegí la categoría del juego:</p>
              <div className="grid-categorias">
                {CATEGORIAS.map((cat) => (
                  <Boton
                    key={cat}
                    variant="secondary"
                    onClick={() => socket && socket.emit("seleccionar_categoria", { codigoSala, categoria: cat })}
                  >
                    {cat}
                  </Boton>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ color: "#0284c7", fontWeight: 700 }}>👑 El anfitrión está eligiendo la categoría...</p>
          )}
        </div>
      )}

      {/* VISTA 2: DIBUJO Y CHAT EN VIVO */}
      {estadoJuego === "jugando" && (
        <div className="juego-layout">
          <div className="panel-canvas">
            <div className="canvas-topbar">
              <Badge variant="red">⏱️ {tiempo}s</Badge>
              <Badge variant="blue">Turno {subronda}/3</Badge>
            </div>

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

            {esDibujante && (
              <Boton variant="danger" className="btn-borrar" onClick={handleBorrarLienzo}>
                🗑️ Borrar Lienzo
              </Boton>
            )}
          </div>

          <div className="panel-lateral">
            <div className="card-puntos">
              <h4>🏆 Puntuación</h4>
              {jugadores.map((j) => (
                <div key={j.id} className="jugador-fila">
                  <span>{j.usuario}</span>
                  <span>{j.puntos} pts</span>
                </div>
              ))}
            </div>

            <div className="card-chat">
              <div className="chat-box">
                {chat.map((msg, idx) => (
                  <p key={idx} className={`chat-msg ${msg.tipo || ""}`}>
                    {msg.texto}
                  </p>
                ))}
              </div>

              {!esDibujante && (
                <form onSubmit={handleEnviarIntento} className="form-chat">
                  <Input
                    placeholder="Escribí tu respuesta..."
                    value={intento}
                    onChange={(e) => setIntento(e.target.value)}
                    className="input-chat"
                  />
                  <Boton type="submit" variant="primary">
                    Enviar
                  </Boton>
                </form>
              )}
            </div>
          </div>
        </div>

      {/* VISTA 3: PODIO FINAL */}
      {estadoJuego === "finalizado" && (
        <div className="card-final">
          <h2>🏆 FIN DEL JUEGO</h2>
          <div style={{ margin: "20px 0" }}>
            {jugadores
              .sort((a, b) => b.puntos - a.puntos)
              .map((j, idx) => (
                <div key={j.id} className="jugador-fila" style={{ fontSize: "1.2rem", padding: "10px" }}>
                  <span>{idx === 0 ? "🥇 Ganador:" : "🥈 Segundo:"} {j.usuario}</span>
                  <strong>{j.puntos} pts</strong>
                </div>
              ))}
          </div>
          <Boton variant="secondary" onClick={() => router.push("/sala")}>
            🔄 Volver a las Salas
          </Boton>
        </div>
      )}

      <BotonCerrarSesion />
    </main>
  );
}