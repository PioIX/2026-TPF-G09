"use client";

import { useEffect, useRef, useState } from "react";
import  useSocket  from "@/hooks/useSocket";
import "./juego.css";

const CATEGORIAS = ["Fútbol", "Lugares", "Comidas", "Tradiciones"];

export default function Juego() {
  const socket = useSocket();

  // Estados de sala
  const [codigoSala, setCodigoSala] = useState("");
  const [usuario, setUsuario] = useState("");
  const [jugadores, setJugadores] = useState([]);
  const [esAnfitrion, setEsAnfitrion] = useState(false);

  // Estados de partida
  const [estadoJuego, setEstadoJuego] = useState("esperando"); // 'esperando' | 'jugando' | 'finalizado'
  const [categoria, setCategoria] = useState("");
  const [esDibujante, setEsDibujante] = useState(false);
  const [palabraSecreta, setPalabraSecreta] = useState("");
  const [tiempo, setTiempo] = useState(100);
  const [subronda, setSubronda] = useState(1);

  // Chat e Intentos
  const [intento, setIntento] = useState("");
  const [chat, setChat] = useState([]);

  // Canvas
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

      socket.on("timer_tick", ({ tiempo }) => {
        setTiempo(tiempo);
      });

      socket.on("recibir_trazo", ({ x0, y0, x1, y1 }) => {
        dibujarEnCanvas(x0, y0, x1, y1);
      });

      socket.on("canvas_limpiado", () => {
        limpiarLienzoLocal();
      });

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

  // Manejo de Canvas
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

    socket.emit("dibujar_trazo", {
      codigoSala,
      x0: prevPos.x,
      y0: prevPos.y,
      x1: currentX,
      y1: currentY,
    });

    setPrevPos({ x: currentX, y: currentY });
  };

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

  const handleEnviarIntento = (e) => {
    e.preventDefault();
    if (!intento.trim() || esDibujante) return;

    socket.emit("enviar_intento", {
      codigoSala,
      intento,
      usuario,
    });
    setIntento("");
  };

  return (
    <main className="juego-main">
      <header className="juego-header">
        <h1>ARGENTILLO 🎨</h1>
        <span className="badge-sala">Sala: {codigoSala}</span>
      </header>

      {/* VISTA 1: ESPERA Y CATEGORÍAS */}
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
                  <button
                    key={cat}
                    className="btn-categoria"
                    onClick={() => socket.emit("seleccionar_categoria", { codigoSala, categoria: cat })}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ color: "#0284c7", fontWeight: 700 }}>👑 El anfitrión está eligiendo la categoría...</p>
          )}
        </div>
      )}

      {/* VISTA 2: PARTIDA Y CANVAS */}
      {estadoJuego === "jugando" && (
        <div className="juego-layout">
          {/* Columna Canvas */}
          <div className="panel-canvas">
            <div className="canvas-topbar">
              <span className="timer-badge">⏱️ {tiempo}s</span>
              <span className="turno-badge">Turno {subronda}/3</span>
            </div>

            <div className="palabra-box">
              {esDibujante ? `Te toca dibujar: ${palabraSecreta}` : "👀 ¡Adiviná el dibujo!"}
            </div>

            <canvas
              ref={canvasRef}
              width={540}
              height={360}
              className="lienzo-pinturillo"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={() => setIsDrawing(false)}
              onMouseLeave={() => setIsDrawing(false)}
            />

            {esDibujante && (
              <button
                className="btn-borrar"
                onClick={() => {
                  limpiarLienzoLocal();
                  socket.emit("limpiar_canvas", { codigoSala });
                }}
              >
                🗑️ Borrar Lienzo
              </button>
            )}
          </div>

          {/* Columna Lateral */}
          <div className="panel-lateral">
            {/* Tabla de Puntos */}
            <div className="card-puntos">
              <h4>🏆 Puntuación</h4>
              {jugadores.map((j) => (
                <div key={j.id} className="jugador-fila">
                  <span>{j.usuario}</span>
                  <span>{j.puntos} pts</span>
                </div>
              ))}
            </div>

            {/* Chat de Adivinanza */}
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
                  <input
                    type="text"
                    className="input-chat"
                    placeholder="Escribí tu respuesta..."
                    value={intento}
                    onChange={(e) => setIntento(e.target.value)}
                  />
                  <button type="submit" className="btn-enviar">
                    Enviar
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

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
          <button className="btn-categoria" onClick={() => (window.location.href = "/sala")}>
            🔄 Volver a las Salas
          </button>
        </div>
      )}
    </main>
  );
}