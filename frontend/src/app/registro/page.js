"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Tarjeta from "@/components/Tarjeta";
import Input from "@/components/Input";
import Boton from "@/components/Boton";
import BotonCerrarSesion from "@/components/BotonCerrarSesion"
import "./registro.css";

export default function Registro() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!nombre.trim() || !email.trim() || !password.trim()) {
      setError("Por favor completá todos los campos.");
      return;
    }

    setCargando(true);

    try {
      const res = await fetch("http://localhost:4000/api/registro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nombre, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/login");
      } else {
        setError(data.mensaje || "Error al registrar usuario.");
      }
    } catch (err) {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
      <Tarjeta>
        <h1 style={{ color: "#0284c7", marginBottom: "8px", fontSize: "2.2rem" }}>ARGENTILLO 🎨</h1>
        <h2 style={{ fontSize: "1.1rem", color: "#64748b", marginBottom: "20px" }}>Creá tu cuenta de jugador</h2>

        {error && (
          <div style={{ background: "#fef2f2", color: "#b91c1c", padding: "10px", borderRadius: "12px", marginBottom: "15px", border: "2px solid #fca5a5", fontSize: "0.9rem", fontWeight: "bold" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <Input
            label="Nombre de usuario"
            type="text"
            placeholder="Ej: ElDiego10"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />

          <Input
            label="Correo electrónico"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Boton type="submit" variant="primary" disabled={cargando}>
            {cargando ? "Cargando..." : "Registrarse"}
          </Boton>
        </form>

        <p style={{ marginTop: "20px", fontSize: "0.95rem", color: "#475569" }}>
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" style={{ color: "#0284c7", fontWeight: "bold", textDecoration: "none" }}>
            Iniciá sesión acá
          </Link>
        </p>
      </Tarjeta>
    </main>
  );
}