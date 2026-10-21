"use client";

import { useRouter } from "next/navigation";

export default function BotonCerrarSesion() {
  const router = useRouter();

  const handleLogout = () => {
<<<<<<< Updated upstream
    // Redirige directamente al Login sin usar localStorage
    router.push("/login");
=======
    router.push("/");
>>>>>>> Stashed changes
  };

  return (
    <button className="btn-logout-flotante" onClick={handleLogout}>
      🚪 Cerrar sesión
    </button>
  );
}