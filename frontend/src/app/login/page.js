"use client";

import { useState } from "react";
import Link from "next/link";
import "./login.css";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:4000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, clave }),
      });

      const data = await res.json();

      if (res.ok) {
        window.location.href = "/sala";
      } else {
        setError(data.message || "Usuario o clave incorrectos");
      }
    } catch (err) {
      setError("No se pudo conectar con el servidor backend");
    }
  };

  return (
    <main className="login-container">
      <div className="login-card">
        <h1>🔐 ENTRENÁ, CRACK</h1>
        <p className="login-subtitle">Ingresá tu cuenta para jugar a Argentillo</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label>Usuario</label>
            <input
              type="text"
              placeholder="Tu apodo guerrero"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-submit">
            ⚽ ENTRAR A LA CANCHA
          </button>
        </form>

        {error && <p className="error-msg">{error}</p>}

        <p className="login-footer">
          ¿Todavía no tenés cuenta? <Link href="/registro">Registrate acá</Link>
        </p>
      </div>
    </main>
  );
}