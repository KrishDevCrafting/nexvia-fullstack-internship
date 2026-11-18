import { io } from "socket.io-client";

const SOCKET_BASE =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.PROD
    ? "https://nexvia-fullstack-internship.onrender.com"
    : "http://localhost:5001");

export const socket = io(SOCKET_BASE, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});
