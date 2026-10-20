"use client";

import { useEffect } from "react";
import { io } from "socket.io-client";

// Instancia única para evitar conexiones múltiples
export const socket = io("http://localhost:4000", {
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