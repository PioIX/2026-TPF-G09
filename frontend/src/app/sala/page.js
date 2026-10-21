"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import useSocket from "@/hooks/useSocket";
import "./sala.css";

export default function Sala() {
  const socket = useSocket();

  const [modalCrear, setModalCrear] = useState(false);
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [codigoIngresado, setCodigoIngresado] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!socket) return;

    socket.on("sala_creada", ({ codigoSala }) => {
      window.location.href = `/juego?sala=${codigoSala}&usuario=${encodeURIComponent(nombreUsuario)}`;
    });

    socket.on("sala_unida", ({ codigoSala }) => {
      window.location.href = `/juego?sala=${codigoSala}&usuario=${encodeURIComponent(nombreUsuario)}`;
    });

    socket.on("error_sala", (mensaje) => {
      setError(mensaje);
    });

    return () => {
      socket.off("sala_creada");
      socket.off("sala_unida");
      socket.off("error_sala");
    };
  }, [socket, nombreUsuario]);

  const handleCrearSala = (e) => {
    e.preventDefault();
    if (!nombreUsuario.trim()) return setError("Ingresá tu apodo de artista");
    setError("");

    socket.emit("crear_sala", { usuario: nombreUsuario });
  };

  const handleUnirseSala = (e) => {
    e.preventDefault();
    if (!nombreUsuario.trim()) return setError("Ingresá tu apodo de artista");
    if (!codigoIngresado.trim()) return setError("Ingresá un código de sala");
    setError("");

    socket.emit("unirse_sala", {
      codigoSala: codigoIngresado,
      usuario: nombreUsuario,
    });
  };

  return (
    <main className="sala-container">
      <div className="sala-card">
        <h1>🎮 SALA DE JUEGO</h1>
        <p className="sala-subtitle">Ingresá tu apodo para continuar</p>

        <div className="input-group" style={{ marginBottom: "20px" }}>
          <label>Tu Apodo</label>
          <input
            type="text"
            placeholder="Ej: Picassito"
            value={nombreUsuario}
            onChange={(e) => setNombreUsuario(e.target.value)}
            style={{ textTransform: "none", textAlign: "center" }}
            required
          />
        </div>

        <div className="opciones-container">
          <div className="opcion-box">
            <h2>👑 SER ANFITRIÓN</h2>
            <button onClick={() => setModalCrear(true)} className="btn-crear">
              🔥 CREAR SALA NUEVA
            </button>
          </div>

          <div className="divider">— O —</div>

          <div className="opcion-box">
            <h2>⚽ SUMARTE A UNA SALA</h2>
            <form onSubmit={handleUnirseSala} className="unirse-form">
              <input
                type="text"
                placeholder="CÓDIGO (Ej: A3X9P2)"
                value={codigoIngresado}
                onChange={(e) => setCodigoIngresado(e.target.value)}
                maxLength={8}
                required
              />
              <button type="submit" className="btn-unirse">
                🚀 UNIRME
              </button>
            </form>
          </div>
        </div>

        {error && <p className="error-msg">{error}</p>}

        <div className="sala-footer">
          <Link href="/">⬅️ Volver al Inicio</Link>
        </div>
      </div>

      {modalCrear && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>🎨 CREAR SALA</h2>
            <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
              ¿Listo para ser el anfitrión con el apodo <strong>{nombreUsuario || "Anónimo"}</strong>?
            </p>
            <div className="modal-actions">
              <button onClick={handleCrearSala} className="btn-confirmar">
                ✅ INGRESAR A LA SALA
              </button>
              <button onClick={() => setModalCrear(false)} className="btn-cancelar">
                ❌ CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}