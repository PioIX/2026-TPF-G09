"use client";

import styles from "./Boton.module.css"; // O className si usás globales

export default function Boton({
  children,
  variant = "primary",
  type = "button",
  onClick, // 👈 1. IMPORTANTE: Recibir la propiedad onClick
  disabled = false,
  className = "",
}) {
  // Mapeo de clases según la variante
  const variantClass =
    variant === "secondary"
      ? styles.secondary
      : variant === "danger"
      ? styles.danger
      : styles.primary;

  return (
    <button
      type={type}
      onClick={onClick} // 👈 2. IMPORTANTE: Pasársela al button nativo
      disabled={disabled}
      className={`${styles.btnCustom} ${variantClass} ${className}`}
    >
      {children}
    </button>
  );
}