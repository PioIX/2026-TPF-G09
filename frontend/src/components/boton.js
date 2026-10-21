"use client";

export default function Boton({
  children,
  onClick,
  type = "button",
  variant = "primary", // "primary", "secondary", "danger"
  className = "",
  disabled = false,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn-custom btn-${variant} ${className}`}
    >
      {children}
    </button>
  );
}