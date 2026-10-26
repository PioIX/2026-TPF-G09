"use client";

import styles from "./BotonCerrarSesion.module.css";

import { useRouter } from "next/navigation";

export default function BotonCerrarSesion() {
  const router = useRouter();

  const handleLogout = () => {
    // Redirige directamente al Login sin usar localStorage
    router.push("/");
  };

  return (
    <button className="btn-logout-flotante" onClick={handleLogout}>
      🚪 Cerrar sesión
    </button>
  );
}