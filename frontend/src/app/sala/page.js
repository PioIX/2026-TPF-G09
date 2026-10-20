"use client";

import { useState } from "react";
import Link from "next/link";
import "./sala.css";

export default function Sala() {
  const [codigoSala, setCodigoSala] = useState("");
  const [error, setError] = useState("");

  // Crear una nueva sala con código aleatorio
  const handleCrearSala = () => {
    setError("");
    // Genera un código de 6 caracteres (Ej: A3X9P2)
    const codigoNuevo = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Redirige a la pantalla del juego pasando el código de sala por URL
    window.location.href = `/juego?sala=${codigoNuevo}`;
  };

  // Unirse a una sala existente mediante código
  const handleUnirseSala = (e) => {
    e.preventDefault();
    setError("");

    if (!codigoSala.trim()) {
      setError("Ingresá un código de sala válido");
      return;
    }

    const codigoLimpio = codigoSala.toUpperCase().trim();
    window.location.href = `/juego?sala=${codigoLimpio}`;
  };

  return (
    <main className="sala-container">
      <div className="sala-card">
        <h1>🎮 SALA DE JUEGO</h1>
        <p className="sala-subtitle">Elegí una opción para empezar la partida de Argentillo</p>

        <div className="opciones-container">
          {/* Opción 1: Crear Sala */}
          <div className="opcion-box">
            <h2>👑 SER ANFITRIÓN</h2>
            <p>Armá una sala nueva e invitá a tus amigos a jugar.</p>
            <button onClick={handleCrearSala} className="btn-crear">
              🔥 CREAR SALA
            </button>
          </div>

          <div className="divider">— O —</div>

          {/* Opción 2: Unirse a Sala */}
          <div className="opcion-box">
            <h2>⚽ SUMARTE A UNA SALA</h2>
            <p>Ingresá el código de la sala de tu amigo:</p>
            <form onSubmit={handleUnirseSala} className="unirse-form">
              <input
                type="text"
                placeholder="CÓDIGO (Ej: X7K9P2)"
                value={codigoSala}
                onChange={(e) => setCodigoSala(e.target.value)}
                maxLength={8}
                required
              />
              <button type="submit" className="btn-unirse">
                🚀 UNIRME A LA SALA
              </button>
            </form>
          </div>
        </div>

        {error && <p className="error-msg">{error}</p>}

        <div className="sala-footer">
          <Link href="/">⬅️ Volver al Inicio</Link>
        </div>
      </div>
    </main>
  );
}