"use client";

import Link from "next/link";
import Tarjeta from "@/components/Tarjeta";
import Badge from "@/components/Badge";
import Boton from "@/components/boton";
import "./home.css";
import { Component } from "react";

export default function Home() {
  return (
    <main className="main-container">
      <Tarjeta>
        <Badge variant="gold">🇦🇷 EDICIÓN CRIOLLA 🎨</Badge>
        <h1 className="title">ARGENTILLO</h1>
        <p className="subtitle">
          El clásico juego de adivinar dibujos con el toque argentino. ¡Pintá, arriesgá y ganá!
        </p>

        <div className="button-group">
          <Link href="/login" style={{ textDecoration: 'none' }}>
            <Boton variant="primary">🖌️ INGRESAR AL TALLER</Boton>
          </Link>

          <Link href="/registro" style={{ textDecoration: 'none', marginTop: '10px' }}>
            <Boton variant="secondary">👑 CREAR NUEVO ARTISTA</Boton>
          </Link>
        </div>

        <p className="footer-text">3 Rondas • 4 Categorías • Sockets en Vivo</p>
      </Tarjeta>
    </main>
  );
}