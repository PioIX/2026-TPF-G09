"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import useSocket from "@/hooks/useSocket";
import "./sala.css";

export default function Sala() {
  const router = useRouter();
  const socket = useSocket();

  const [usuario, setUsuario] = useState("");
  const [codigoIngresado, setCodigoIngresado] = useState("");
  const [codigoCreado, setCodigoCreado] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUsuario(params.get("usuario") || "Invitado");

    if (socket) {
      socket.on("sala_creada", ({ codigoSala }) => {
        setCodigoCreado(codigoSala);
        setMostrarModal(true);
      });

      socket.on("sala_unida", ({ codigoSala }) => {
        router.push(`/juego?sala=${codigoSala}&usuario=${encodeURIComponent(usuario)}`);
      });

      socket.on("error_sala", (msg) => {
        alert(msg);
      });
    }

    return () => {
      if (socket) {
        socket.off("sala_creada");
        socket.off("sala_unida");
        socket.off("error_sala");
      }
    };
  }, [socket, usuario, router]);

  const handleCrearSala = () => {
    socket.emit("crear_sala", { usuario });
  };

  const handleUnirseSala = (e) => {
    e.preventDefault();
    if (!codigoIngresado.trim()) return;
    socket.emit("unirse_sala", { codigoSala: codigoIngresado, usuario });
  };

  const irAlJuego = () => {
    router.push(`/juego?sala=${codigoCreado}&usuario=${encodeURIComponent(usuario)}`);
  };

  return (
    <main className="sala-container">
      <div className="sala-card">
        <h1>SALAS DE JUEGO 🎨</h1>
        <p className="sala-subtitle">Hola <strong>{usuario}</strong>, elegí una opción para jugar</p>

        <div className="opciones-container">
          <div className="opcion-box">
            <h2>Crear una Sala Privada</h2>
            <Boton variant="secondary" onClick={handleCrearSala}>
              ➕ CREAR NUEVA SALA
            </Boton>
          </div>

          <div className="divider">- O -</div>

          <div className="opcion-box">
            <h2>Sumarte a una Sala</h2>
            <form onSubmit={handleUnirseSala} className="unirse-form">
              <Input
                placeholder="CÓDIGO (Ej: A3X9P2)"
                value={codigoIngresado}
                onChange={(e) => setCodigoIngresado(e.target.value)}
                required
              />
              <Boton type="submit" variant="primary">
                🚪 UNIRSE A SALA
              </Boton>
            </form>
          </div>
        </div>
      </div>

      <Modal isOpen={mostrarModal} titulo="¡SALA CREADA! 🎉">
        <p>Pasale este código a tu compañero:</p>
        <div style={{ fontSize: "2rem", fontWeight: "bold", letterSpacing: "4px", color: "#d97706", margin: "15px 0" }}>
          {codigoCreado}
        </div>
        <Boton variant="secondary" onClick={irAlJuego}>
          IR A LA SALA DE ESPERA
        </Boton>
      </Modal>

      <BotonCerrarSesion />
    </main>
  );
}