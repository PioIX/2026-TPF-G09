"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/Input";
import Boton from "@/components/Boton";
import BotonCerrarSesion from "@/components/BotonCerrarSesion";
import "./registro.css";

export default function Registro() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });

  async function handleSubmit(event) {
    event.preventDefault();
    setMensaje({ texto: "", tipo: "" });

    try {
      const response = await fetch("http://localhost:4000/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, email, contrasena }),
      });

      const data = await response.json();

      if (response.ok) {
        setMensaje({ texto: "🎉 ¡Perfil creado! Redirigiendo...", tipo: "success" });
        setTimeout(() => {
          router.push("/login");
        }, 1200);
      } else {
        setMensaje({ texto: data.message || "Error al registrarse", tipo: "error" });
      }
    } catch (error) {
      setMensaje({ texto: "No se pudo conectar con el servidor", tipo: "error" });
    }
  }

  return (
    <main className="registro-container">
      <div className="registro-card">
        <h1>👑 NUEVO ARTISTA</h1>
        <p className="registro-subtitle">Sumate al taller de Argentillo</p>

        <form className="registro-form" onSubmit={handleSubmit}>
          <Input
            label="Usuario"
            id="usuario"
            placeholder="Ej: Picassito"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            required
          />

          <Input
            label="Email"
            id="email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Contraseña"
            id="contrasena"
            type="password"
            placeholder="••••••••"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            required
          />

          <Boton type="submit" variant="secondary">
            🎨 PREPARAR EL LIENZO
          </Boton>
        </form>

        {mensaje.texto && (
          <p className={`status-msg ${mensaje.tipo}`}>{mensaje.texto}</p>
        )}

        <p className="registro-footer">
          ¿Ya sos parte del taller? <Link href="/login">Ingresá acá</Link>
        </p>
      </div>

      <BotonCerrarSesion />
    </main>
  );
}