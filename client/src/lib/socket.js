/**
 * socket.js — Socket.IO client singleton
 * Wraps socket.io-client with typed event helpers
 */
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL 
  ? import.meta.env.VITE_SOCKET_URL 
  : (window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin);

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket'],
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) socket.disconnect();
}

export default getSocket;
