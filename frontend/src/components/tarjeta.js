"use client";

export default function Tarjeta({ children, className = "" }) {
  return <div className={`card-container ${className}`}>{children}</div>;
}