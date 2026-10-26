"use client";

import styles from "./Tarjeta.module.css";

export default function Tarjeta({ children, className = "" }) {
  return <div className={`card-container ${className}`}>{children}</div>;
}