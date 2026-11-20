import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { BACKEND_URL } from "@/app/config/backend";
// Apuntá a localhost mientras probás en tu PC
const SOCKET_SERVER_URL = BACKEND_URL

export default function useSocket({ serverUrl = SOCKET_SERVER_URL, options = {} } = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  if (!socketRef.current) {
    socketRef.current = io(serverUrl, options);
  }

  useEffect(() => {
    const socket = socketRef.current;

    const onConnect = () => {
      setIsConnected(true);
      console.log("🟢 WebSocket conectado:", socket.id);
    };

    const onDisconnect = () => {
      setIsConnected(false);
      console.log("🔴 WebSocket desconectado");
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  return { socket: socketRef.current, isConnected };
}