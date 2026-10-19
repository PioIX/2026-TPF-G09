"use client";

import { useState } from "react";
import Link from "next/link";
import "./registro.css";

export default function Registro() {
  const [usuario, setUsuario] = useState("");
  const [mail, setmail] = useState("");
  const [contraseña, setcontraseña] = useState("");
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });

  async function handleSubmit(event) {
    event.preventDefault();
    setMensaje({ texto: "", tipo: "" });

    try {
      const response = await fetch("http://localhost:4000/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, mail, contraseña }),
      });

      const data = await response.json();

      if (response.ok) {
        setMensaje({ texto: "🎉 ¡Fichaje completado! Redirigiendo...", tipo: "success" });
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      } else {
        setMensaje({ texto: data.message || "Error al registrarse", tipo: "error" });
      }
    } catch (error) {
      setMensaje({ texto: "No se pudo conectar con el servidor backend", tipo: "error" });
    }
  }

  return (
    <main className="registro-container">
      <div className="registro-card">
        <h1>👑 FICHAJE NUEVO</h1>
        <p className="registro-subtitle">Sumate al plantel de Argentillo</p>

        <form className="registro-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="usuario">Usuario</label>
            <input
              type="text"
              id="usuario"
              placeholder="Ej: ElDiez99"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="mail">mail</label>
            <input
              type="mail"
              id="mail"
              placeholder="tu@mail.com"
              value={mail}
              onChange={(e) => setmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="contraseña">Contraseña</label>
            <input
              type="password"
              id="contraseña"
              placeholder="••••••••"
              value={contraseña}
              onChange={(e) => setcontraseña(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-registro-submit">
             FIRMAR CONTRATO
          </button>
        </form>

        {mensaje.texto && (
          <p className={`status-msg ${mensaje.tipo}`}>{mensaje.texto}</p>
        )}

        <p className="registro-footer">
          ¿Ya sos parte del club? <Link href="/login">Ingresá acá</Link>
        </p>
      </div>
    </main>
  );
}