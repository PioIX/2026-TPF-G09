"use client";

import { useRouter } from "next/navigation";

export default function BotonCerrarSesion() {
  const router = useRouter();

  const handleLogout = () => {
    router.push("/page.js");
  };

  return (
    <button className="btn-logout-flotante" onClick={handleLogout}>
      🚪 Cerrar sesión
    </button>
  );
}