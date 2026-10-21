"use client";

export default function Badge({ children, variant = "gold", className = "" }) {
  return (
    <span className={`badge-custom badge-${variant} ${className}`}>
      {children}
    </span>
  );
}