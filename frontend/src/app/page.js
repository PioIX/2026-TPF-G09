"use client";

import Link from "next/link";
import "./home.css";

export default function Home() {
  return (
    <main className="main-container">
      <div className="card">
        <span className="badge">🔥 100% CRIOLLO • LA SCALONETA 🇦🇷</span>
        <h1 className="title">ARGENTILLO</h1>
        <p className="subtitle">
          El juego de adivinar dibujos <span>sin piedad</span>. Dibujá, arriesgá y domá a tus amigos.
        </p>

        <div className="button-group">
          <Link href="/login" className="btn-login">
            ⚽ Tirar Magia (Login)
          </Link>

          <Link href="/registro" className="btn-registro">
            👑 Crear Cuenta, Rey
          </Link>
        </div>

        <p className="footer-text">Prohibido para pechos fríos ⭐️⭐️⭐️</p>
      </div>
    </main>
  );
}