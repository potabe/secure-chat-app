/**
 * chatStore.js — Zustand global state management
 *
 * Room state shape:
 * {
 *   roomId: string,
 *   status: 'waiting' | 'handshaking' | 'secured' | 'partner-left' | 'error',
 *   messages: Message[],       ← in-memory only
 *   cryptoLog: LogEntry[],     ← per-room crypto log
 *   myKeyPair: CryptoKeyPair,  ← ECDH key pair
 *   aesKey: CryptoKey,         ← derived AES key
 *   partnerEmail: string,
 *   sharedSecretFingerprint: string,
 *   myPublicKeyJWK: object,    ← for display in crypto log
 *   unread: number,            ← unread message count
 * }
 */
import { create } from 'zustand';

const useChatStore = create((set, get) => ({
  // ─── Auth ─────────────────────────────────────────────────────────────────
  user: null,
  token: null,
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  clearAuth: () => set({ user: null, token: null }),

  // ─── Rooms ────────────────────────────────────────────────────────────────
  rooms: {},           // Map<roomId, RoomState>
  activeRoomId: null,

  setActiveRoom: (roomId) => {
    set({ activeRoomId: roomId });
    // Clear unread when switching to a room
    if (roomId) {
      set((state) => ({
        rooms: {
          ...state.rooms,
          [roomId]: { ...state.rooms[roomId], unread: 0 },
        },
      }));
    }
  },

  addRoom: (roomId, roomPassword = '') => {
    set((state) => {
      if (state.rooms[roomId]) return state; // already exists
      return {
        rooms: {
          ...state.rooms,
          [roomId]: {
            roomId,
            roomPassword,
            status: 'waiting',
            messages: [],
            cryptoLog: [],
            myKeyPair: null,
            aesKey: null,
            partnerEmail: null,
            sharedSecretFingerprint: null,
            myPublicKeyJWK: null,
            unread: 0,
            typingUsers: [], // ['email1', 'email2']
          },
        },
        activeRoomId: state.activeRoomId || roomId,
      };
    });
  },

  removeRoom: (roomId) => {
    set((state) => {
      const newRooms = { ...state.rooms };
      delete newRooms[roomId];
      const roomIds = Object.keys(newRooms);
      return {
        rooms: newRooms,
        activeRoomId:
          state.activeRoomId === roomId
            ? roomIds[roomIds.length - 1] || null
            : state.activeRoomId,
      };
    });
  },

  updateRoom: (roomId, updates) => {
    set((state) => ({
      rooms: {
        ...state.rooms,
        [roomId]: { ...state.rooms[roomId], ...updates },
      },
    }));
  },

  // ─── Messages ─────────────────────────────────────────────────────────────
  addMessage: (roomId, message) => {
    set((state) => {
      const room = state.rooms[roomId];
      if (!room) return state;
      const isActive = state.activeRoomId === roomId;
      const messageId = message.id || (Date.now() + Math.random().toString(36).substr(2, 9));

      if (message.ttl && message.ttl > 0) {
        setTimeout(() => {
          get().deleteMessage(roomId, messageId);
        }, message.ttl * 1000);
      }

      const fullMessage = {
        ...message,
        id: messageId,
        readBy: message.readBy || [],
        reactions: message.reactions || {},
        replyToId: message.replyToId || null,
      };

      return {
        rooms: {
          ...state.rooms,
          [roomId]: {
            ...room,
            messages: [...room.messages, fullMessage],
            unread: isActive ? 0 : (room.unread || 0) + (message.type === 'incoming' ? 1 : 0),
          },
        },
      };
    });
  },

  deleteMessage: (roomId, messageId) => {
    set((state) => {
      const room = state.rooms[roomId];
      if (!room) return state;
      return {
        rooms: {
          ...state.rooms,
          [roomId]: {
            ...room,
            messages: room.messages.filter((m) => m.id !== messageId),
          },
        },
      };
    });
  },

  updateMessage: (roomId, messageId, updates) => {
    set((state) => {
      const room = state.rooms[roomId];
      if (!room) return state;
      return {
        rooms: {
          ...state.rooms,
          [roomId]: {
            ...room,
            messages: room.messages.map((m) =>
              m.id === messageId ? { ...m, ...updates } : m
            ),
          },
        },
      };
    });
  },

  setMessages: (roomId, messages) => {
    set((state) => {
      const room = state.rooms[roomId];
      if (!room) return state;
      return {
        rooms: {
          ...state.rooms,
          [roomId]: {
            ...room,
            messages,
          },
        },
      };
    });
  },

  // ─── Crypto Log ───────────────────────────────────────────────────────────
  addCryptoLog: (roomId, entry) => {
    set((state) => {
      const room = state.rooms[roomId];
      if (!room) return state;
      return {
        rooms: {
          ...state.rooms,
          [roomId]: {
            ...room,
            cryptoLog: [
              ...room.cryptoLog,
              {
                ...entry,
                id: Date.now() + Math.random(),
                timestamp: new Date().toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                }),
              },
            ],
          },
        },
      };
    });
  },

  // ─── Selectors ────────────────────────────────────────────────────────────
  getRoom: (roomId) => get().rooms[roomId],
  getActiveRoom: () => {
    const { rooms, activeRoomId } = get();
    return activeRoomId ? rooms[activeRoomId] : null;
  },
  getRoomList: () => Object.values(get().rooms),
}));

export default useChatStore;
