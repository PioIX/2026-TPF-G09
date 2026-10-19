"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ContenidoEspera() {
  const searchParams = useSearchParams();
  const codigo = searchParams.get("codigo");

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "#101827",
        color: "white",
        fontFamily: "Arial, sans-serif",
        textAlign: "center",
        padding: "20px",
      }}
    >
      <h1>ARGENTILLO</h1>
      <h2>Sala de espera</h2>

      <p>Compartí este código con tus amigos:</p>

      <h1 style={{ color: "#7cafff" }}>
        {codigo || "Sin código"}
      </h1>

      <p>Esperando a los demás jugadores...</p>
    </main>
  );
}

export default function EsperaPage() {
  return (
    <Suspense fallback={<p>Cargando sala...</p>}>
      <ContenidoEspera />
    </Suspense>
  );
}