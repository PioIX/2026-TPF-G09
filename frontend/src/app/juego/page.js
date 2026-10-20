"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";

export default function LobbyJuego() {
  const socket = useSocket();
  const [codigoSala, setCodigoSala] = useState("");
  const [usuario, setUsuario] = useState("");
  const [jugadores, setJugadores] = useState([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const salaUrl = params.get("sala");
    const usuarioUrl = params.get("usuario");

    setCodigoSala(salaUrl || "");
    setUsuario(usuarioUrl || "");

    if (socket && salaUrl && usuarioUrl) {
      socket.emit("unirse_sala", { codigoSala: salaUrl, usuario: usuarioUrl });

      socket.on("actualizar_jugadores", (listaJugadores) => {
        setJugadores(listaJugadores);
      });
    }

    return () => {
      if (socket) socket.off("actualizar_jugadores");
    };
  }, [socket]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#090d16",
        color: "#fff",
        fontFamily: "sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "rgba(15, 23, 42, 0.9)",
          border: "2px solid #38bdf8",
          padding: "30px",
          borderRadius: "20px",
          textAlign: "center",
          maxWidth: "450px",
          width: "100%",
        }}
      >
        <h1 style={{ color: "#38bdf8", margin: 0 }}>SALA DE ESPERA</h1>
        <p style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#fbbf24" }}>
          Código: <span style={{ letterSpacing: "2px" }}>{codigoSala}</span>
        </p>

        <div
          style={{
            background: "#1e293b",
            padding: "15px",
            borderRadius: "12px",
            margin: "20px 0",
            textAlign: "left",
          }}
        >
          <h3 style={{ margin: "0 0 10px 0", color: "#7dd3fc" }}>
            Jugadores Conectados ({jugadores.length}/2):
          </h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {jugadores.map((j) => (
              <li
                key={j.id}
                style={{ padding: "8px 0", borderBottom: "1px solid #334155" }}
              >
                👤 {j.usuario} {j.esAnfitrion ? "👑 (Anfitrión)" : ""}
              </li>
            ))}
          </ul>
        </div>

        {jugadores.length < 2 ? (
          <p style={{ color: "#f59e0b", fontWeight: "bold" }}>
            ⏳ Esperando a que se una el segundo jugador...
          </p>
        ) : (
          <p style={{ color: "#4ade80", fontWeight: "bold" }}>
            ✅ ¡Sala llena! Todo listo para la elección de categoría.
          </p>
        )}
      </div>
    </main>
  );
}