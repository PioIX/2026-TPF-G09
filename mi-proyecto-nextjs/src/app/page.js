
import Link from "next/link";
import "./globals.css";

export default function Home() {
  return (
    <main className="home">
      <nav className="navbar">
        <Link href="/" className="logo">
          🇦🇷 ARGENTILLO
        </Link>

        <div className="nav-links">
          <Link href="/login" className="nav-login">
            Iniciar sesión
          </Link>
          <Link href="/registro" className="nav-register">
            Registrarse
          </Link>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <span className="tag">🇦🇷 EL JUEGO MÁS ARGENTO</span>

          <h1>
            DIBUJÁ.
            <br />
            <span>ADIVINÁ.</span>
            <br />
            GANÁ.
          </h1>

          <p className="description">
            Demostrá cuánto sabés dibujar y cuánto conocés
            a tus amigos. ¿Quién será el campeón del grupo?
          </p>

          <div className="buttons">
            <Link href="/registro" className="btn-play">
              ¡JUGAR AHORA! →
            </Link>

            <Link href="/login" className="btn-login">
              Ya tengo cuenta
            </Link>
          </div>

          <div className="features">
            <div>
              <span>🎨</span>
              <p>Dibujá</p>
            </div>

            <div>
              <span>🧠</span>
              <p>Adiviná</p>
            </div>

            <div>
              <span>🏆</span>
              <p>Competí</p>
            </div>
          </div>
        </div>

        <div className="game-preview">
          <div className="preview-top">
            <span className="live-dot"></span>
            SALA DE JUEGO
            <span className="round">RONDA 3</span>
          </div>

          <div className="word-box">
            <p>ADIVINÁ LA PALABRA</p>
            <div className="word">_ _ _ _ _ _</div>
          </div>

          <div className="drawing">
            <span className="sun">☀️</span>
            <span className="mountain">🏔️</span>
            <span className="ball">⚽</span>
            <span className="flag">🇦🇷</span>
          </div>

          <div className="players">
            <div className="player">
              <span>🧉</span>
              <div>
                <strong>Matecito</strong>
                <small>120 puntos</small>
              </div>
            </div>

            <div className="player">
              <span>⚽</span>
              <div>
                <strong>El Diegote</strong>
                <small>90 puntos</small>
              </div>
            </div>

            <div className="player">
              <span>🔥</span>
              <div>
                <strong>Vos</strong>
                <small>70 puntos</small>
              </div>
            </div>
          </div>

          <div className="fake-chat">
            <span>💬</span>
            <p>¿ES EL OBELISCO?</p>
            <span className="chat-check">✓</span>
          </div>
        </div>
      </section>

      <footer className="footer">
        <p>HECHO PARA JUGAR ENTRE AMIGOS 🇦🇷</p>
        <p>ARGENTILLO © 2026</p>
      </footer>
    </main>
  );
}