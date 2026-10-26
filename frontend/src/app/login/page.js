"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/Input";
import Boton from "@/components/boton";
import BotonCerrarSesion from "@/components/BotonCerrarSesion";
import "./login.css";

export default function Login() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:4000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, clave }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/sala?usuario=${encodeURIComponent(data.usuario)}`);
      } else {
        setError(data.message || "Credenciales incorrectas");
      }
    } catch (err) {
      setError("No se pudo conectar con el servidor backend");
    }
  }

  return (
    <main className="login-container">
      <div className="login-card">
        <h1>🖌️ INGRESAR AL TALLER</h1>
        <p className="login-subtitle">¡Iniciá sesión para empezar a dibujar!</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <Input
            label="Usuario o Email"
            id="usuario"
            placeholder="Tu usuario"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            required
          />

          <Input
            label="Contraseña"
            id="clave"
            type="password"
            placeholder="••••••••"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            required
          />

          <Boton type="submit" variant="primary">
            ENTRAR Y JUGAR
          </Boton>
        </form>

        {error && <div className="error-msg">{error}</div>}

        <p className="login-footer">
          ¿No tenés cuenta? <Link href="/registro">Registrate gratis</Link>
        </p>
      </div>

      <BotonCerrarSesion />
    </main>
  );
}