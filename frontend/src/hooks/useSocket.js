"use client";

import { useEffect } from "react";
import { io } from "socket.io-client";

// Detecta la IP del host automáticamente para permitir conexiones en red local
const getBackendUrl = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    return `http://${hostname}:4000`;
  }
  return "http://localhost:4000";
};

export const socket = io(getBackendUrl(), {
  autoConnect: false,
});

export function useSocket() {
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }
  }, []);

  return socket;
}