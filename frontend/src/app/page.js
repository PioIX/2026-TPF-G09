"use client";

import Link from "next/link";
import Tarjeta from "@/components/tarjeta";
import Badge from "@/components/Badge";
import Boton from "@/components/boton";
import "./home.css";

export default function Home() {
  return (
    <main className="main-container">
      <Tarjeta>
        <div className="badge-wrapper">
          <Badge variant="gold">🇦🇷 EDICIÓN CRIOLLA 🎨</Badge>
        </div>

        <h1 className="title">ARGENTILLO</h1>

        <p className="subtitle">
          El clásico juego de adivinar dibujos con el toque argentino. ¡Pintá, arriesgá y ganá!
        </p>

        <div className="button-group">
          <Link href="/login" className="btn-link">
            <Boton variant="primary">🖌️ INGRESAR AL TALLER</Boton>
          </Link>

          <Link href="/registro" className="btn-link">
            <Boton variant="secondary">👑 CREAR NUEVO ARTISTA</Boton>
          </Link>
        </div>

        <p className="footer-text">3 Rondas • 4 Categorías • Sockets en Vivo</p>
      </Tarjeta>
    </main>
  );
}