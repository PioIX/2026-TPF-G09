"use client";

import clsx from "clsx";
import styles from "./Badge.module.css";

export default function Badge({ children, variant = "gold", className = "" }) {
  return (
    <span
      className={clsx(
        styles.badgeCustom,
        variant === "gold" && styles.gold,
        variant === "blue" && styles.blue,
        variant === "green" && styles.green,
        className
      )}
    >
      {children}
    </span>
  );
}