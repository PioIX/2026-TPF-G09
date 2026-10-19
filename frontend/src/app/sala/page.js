"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "./sala.css";

export default function SalaPage() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function crearSala() {
    setError("");
    setCargando(true);

    try {
      const respuesta = await fetch("http://localhost:3001/salas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.mensaje || "No se pudo crear la sala");
      }

      const codigoSala = datos.codigo || datos.codigoSala;

      if (!codigoSala) {
        throw new Error("El servidor no devolvió el código de la sala");
      }

      router.push(`/espera?codigo=${encodeURIComponent(codigoSala)}`);
    } catch (error) {
      setError(error.message || "Error al conectar con el servidor");
    } finally {
      setCargando(false);
    }
  }

  async function unirseSala(evento) {
    evento.preventDefault();
    setError("");

    if (!codigo.trim()) {
      setError("Ingresá el código de la sala");
      return;
    }

    setCargando(true);

    try {
      const respuesta = await fetch(
        `http://localhost:3001/salas/${encodeURIComponent(codigo.trim())}/unirse`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.mensaje || "No se pudo ingresar a la sala");
      }

      router.push(
        `/espera?codigo=${encodeURIComponent(codigo.trim())}`
      );
    } catch (error) {
      setError(error.message || "Error al conectar con el servidor");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="sala-fondo">
      <section className="sala-contenedor">
        <h1>ARGENTILLO</h1>
        <p className="sala-subtitulo">
          ¡Prepará la partida y jugá con tus amigos!
        </p>

        <div className="sala-tarjeta">
          <h2>Crear una sala</h2>
          <p>Creá una partida nueva para invitar a otros jugadores.</p>

          <button
            className="boton boton-crear"
            onClick={crearSala}
            disabled={cargando}
          >
            {cargando ? "Procesando..." : "Crear sala"}
          </button>
        </div>

        <div className="sala-tarjeta">
          <h2>Unirse a una sala</h2>
          <p>¿Ya tenés un código? Ingresalo acá.</p>

          <form onSubmit={unirseSala}>
            <input
              type="text"
              placeholder="Código de la sala"
              value={codigo}
              onChange={(evento) => setCodigo(evento.target.value)}
            />

            <button
              className="boton boton-unirse"
              type="submit"
              disabled={cargando}
            >
              {cargando ? "Procesando..." : "Unirse"}
            </button>
          </form>
        </div>

        {error && <p className="sala-error">{error}</p>}
      </section>
    </main>
  );
}