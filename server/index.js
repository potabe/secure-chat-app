require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const admin = require('firebase-admin');
const { supabase } = require('./supabase');
const cors = require('cors');
const path = require('path');

// ─── Firebase Admin Init ────────────────────────────────────────────────────
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || './serviceAccountKey.json';

let firebaseInitialized = false;
try {
  const serviceAccount = require(path.resolve(serviceAccountPath));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  firebaseInitialized = true;
  console.log('[Firebase] Admin SDK initialized successfully');
} catch (err) {
  console.warn('[Firebase] WARNING: Could not load serviceAccountKey.json.');
  console.warn('[Firebase] Token verification will be SKIPPED (dev mode).');
  console.warn('[Firebase] Error:', err.message);
}

// ─── Express + HTTP + Socket.IO Setup ───────────────────────────────────────
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', firebase: firebaseInitialized });
});

// ─── In-Memory State ─────────────────────────────────────────────────────────
// rooms: Map<roomId, Set<socketId>>
const rooms = new Map();

function getRoomSockets(roomId) {
  return rooms.get(roomId) || new Set();
}

function addToRoom(roomId, socketId) {
  if (!rooms.has(roomId)) rooms.set(roomId, new Set());
  rooms.get(roomId).add(socketId);
}

function removeFromRoom(roomId, socketId) {
  const roomSockets = rooms.get(roomId);
  if (!roomSockets) return;
  roomSockets.delete(socketId);
  if (roomSockets.size === 0) {
    rooms.delete(roomId);
  }
}

function getPartnerSocket(roomId, mySocketId) {
  const roomSockets = getRoomSockets(roomId);
  for (const sid of roomSockets) {
    if (sid !== mySocketId) return sid;
  }
  return null;
}

// ─── Socket.IO Logic ─────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // Track rooms this socket has joined
  socket.joinedRooms = new Set();

  // ── authenticate ────────────────────────────────────────────────────────
  socket.on('authenticate', async ({ token, displayName }) => {
    if (!token) {
      socket.emit('auth-error', { message: 'No token provided' });
      return;
    }

    if (!firebaseInitialized) {
      // Dev mode: skip verification, use socket id as uid
      console.warn(`[Auth] DEV MODE — Skipping token verification for ${socket.id}`);
      socket.uid = `dev-${socket.id}`;
      socket.userEmail = displayName || 'dev@localhost';
      socket.authenticated = true;
      socket.emit('auth-success', { uid: socket.uid, email: socket.userEmail });
      return;
    }

    try {
      const decoded = await admin.auth().verifyIdToken(token);
      socket.uid = decoded.uid;
      socket.userEmail = displayName || decoded.name || decoded.email || decoded.uid;
      socket.authenticated = true;
      console.log(`[Auth] Verified: ${socket.userEmail} (${socket.id})`);
      socket.emit('auth-success', { uid: decoded.uid, email: decoded.email, displayName: socket.userEmail });
    } catch (err) {
      console.error(`[Auth] Failed for ${socket.id}:`, err.message);
      socket.emit('auth-error', { message: 'Invalid or expired token. Please log in again.' });
    }
  });

  // ── join-room ────────────────────────────────────────────────────────────
  socket.on('join-room', ({ roomId }) => {
    if (!socket.authenticated) {
      socket.emit('auth-error', { message: 'Not authenticated' });
      return;
    }
    if (!roomId || typeof roomId !== 'string' || roomId.trim() === '') {
      socket.emit('join-error', { roomId, message: 'Invalid room ID' });
      return;
    }

    const cleanRoomId = roomId.trim().toLowerCase();

    // Already in this room?
    if (socket.joinedRooms.has(cleanRoomId)) {
      socket.emit('room-joined', { roomId: cleanRoomId, userCount: getRoomSockets(cleanRoomId).size });
      return;
    }

    const currentOccupants = getRoomSockets(cleanRoomId);

    // Enforce max 2 per room
    if (currentOccupants.size >= 2) {
      socket.emit('room-full', { roomId: cleanRoomId, message: 'Room is full (max 2 participants)' });
      return;
    }

    // Join
    addToRoom(cleanRoomId, socket.id);
    socket.joinedRooms.add(cleanRoomId);
    socket.join(cleanRoomId);

    const userCount = getRoomSockets(cleanRoomId).size;
    console.log(`[Room] ${socket.userEmail} joined room "${cleanRoomId}" (${userCount}/2)`);

    socket.emit('room-joined', { roomId: cleanRoomId, userCount });

    // Notify partner
    const partnerSocketId = getPartnerSocket(cleanRoomId, socket.id);
    if (partnerSocketId) {
      const partnerSocket = io.sockets.sockets.get(partnerSocketId);
      const partnerEmail = partnerSocket?.userEmail || 'Unknown';

      socket.emit('partner-joined', { roomId: cleanRoomId, partnerEmail });
      io.to(partnerSocketId).emit('partner-joined', {
        roomId: cleanRoomId,
        partnerEmail: socket.userEmail,
      });
    }
  });

  // ── leave-room ───────────────────────────────────────────────────────────
  socket.on('leave-room', ({ roomId }) => {
    handleLeaveRoom(socket, roomId);
  });

  // ── send-public-key ──────────────────────────────────────────────────────
  socket.on('send-public-key', ({ roomId, publicKey }) => {
    if (!socket.authenticated) return;
    const cleanRoomId = roomId?.trim().toLowerCase();
    if (!socket.joinedRooms.has(cleanRoomId)) return;

    const partnerSocketId = getPartnerSocket(cleanRoomId, socket.id);
    if (partnerSocketId) {
      console.log(`[Crypto] Relaying public key from ${socket.userEmail} in room "${cleanRoomId}"`);
      io.to(partnerSocketId).emit('partner-key', {
        roomId: cleanRoomId,
        publicKey,
        fromEmail: socket.userEmail,
      });
    }
  });

  // ── send-message ─────────────────────────────────────────────────────────
  socket.on('send-message', async ({ roomId, payload }) => {
    if (!socket.authenticated) return;
    const cleanRoomId = roomId?.trim().toLowerCase();
    if (!socket.joinedRooms.has(cleanRoomId)) return;

    // Optional: save to Supabase if storeHistory is true
    if (payload.storeHistory && supabase) {
      try {
        await supabase.from('messages').insert({
          id: payload.id, // client should provide a uuid
          room_id: cleanRoomId,
          sender_email: socket.userEmail,
          ciphertext: payload.ciphertext,
          iv: payload.iv,
          key_size: payload.keySize,
          ttl: payload.ttl || null,
          reply_to_id: payload.replyToId || null,
        });
      } catch (err) {
        console.error('[Supabase] Insert error:', err.message);
      }
    }

    const partnerSocketId = getPartnerSocket(cleanRoomId, socket.id);
    if (partnerSocketId) {
      io.to(partnerSocketId).emit('receive-message', {
        roomId: cleanRoomId,
        payload,
        timestamp: Date.now(),
        fromEmail: socket.userEmail,
      });
    }
  });

  // ── fetch-history ────────────────────────────────────────────────────────
  socket.on('fetch-history', async ({ roomId }) => {
    if (!socket.authenticated || !supabase) return;
    const cleanRoomId = roomId?.trim().toLowerCase();
    if (!socket.joinedRooms.has(cleanRoomId)) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', cleanRoomId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      socket.emit('history-data', { roomId: cleanRoomId, messages: data });
    } catch (err) {
      console.error('[Supabase] Fetch history error:', err.message);
    }
  });

  // ── typing ───────────────────────────────────────────────────────────────
  socket.on('typing', ({ roomId, isTyping }) => {
    if (!socket.authenticated) return;
    const cleanRoomId = roomId?.trim().toLowerCase();
    if (!socket.joinedRooms.has(cleanRoomId)) return;

    const partnerSocketId = getPartnerSocket(cleanRoomId, socket.id);
    if (partnerSocketId) {
      io.to(partnerSocketId).emit('partner-typing', {
        roomId: cleanRoomId,
        email: socket.userEmail,
        isTyping
      });
    }
  });

  // ── mark-read ────────────────────────────────────────────────────────────
  socket.on('mark-read', ({ roomId, messageId }) => {
    if (!socket.authenticated) return;
    const cleanRoomId = roomId?.trim().toLowerCase();
    if (!socket.joinedRooms.has(cleanRoomId)) return;

    const partnerSocketId = getPartnerSocket(cleanRoomId, socket.id);
    if (partnerSocketId) {
      io.to(partnerSocketId).emit('message-read', {
        roomId: cleanRoomId,
        messageId,
        readBy: socket.userEmail
      });
    }
  });

  // ── react-message ────────────────────────────────────────────────────────
  socket.on('react-message', ({ roomId, messageId, emoji }) => {
    if (!socket.authenticated) return;
    const cleanRoomId = roomId?.trim().toLowerCase();
    if (!socket.joinedRooms.has(cleanRoomId)) return;

    // We don't save reactions to Supabase right now for simplicity, just relay
    // but in a full implementation we would update the message record or a reactions table.

    const partnerSocketId = getPartnerSocket(cleanRoomId, socket.id);
    if (partnerSocketId) {
      io.to(partnerSocketId).emit('message-reaction', {
        roomId: cleanRoomId,
        messageId,
        emoji,
        fromEmail: socket.userEmail
      });
    }
  });

  // ── disconnect ───────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${socket.id} (${socket.userEmail || 'unauthenticated'})`);
    for (const roomId of socket.joinedRooms || []) {
      handleLeaveRoom(socket, roomId);
    }
  });

  // ─── Helper: leave room ──────────────────────────────────────────────────
  function handleLeaveRoom(socket, roomId) {
    const cleanRoomId = roomId?.trim().toLowerCase();
    if (!cleanRoomId || !socket.joinedRooms?.has(cleanRoomId)) return;

    removeFromRoom(cleanRoomId, socket.id);
    socket.joinedRooms.delete(cleanRoomId);
    socket.leave(cleanRoomId);

    console.log(`[Room] ${socket.userEmail} left room "${cleanRoomId}"`);

    const partnerSocketId = getPartnerSocket(cleanRoomId, socket.id);
    if (partnerSocketId) {
      io.to(partnerSocketId).emit('partner-left', {
        roomId: cleanRoomId,
        fromEmail: socket.userEmail,
      });
    }
  }
});

// ─── Cron Job for Self-Destruct Messages ─────────────────────────────────────
setInterval(async () => {
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('id, created_at, ttl')
      .gt('ttl', 0);

    if (error) throw error;
    if (!messages || messages.length === 0) return;

    const now = Date.now();
    const expiredIds = messages.filter(msg => {
      const createdAt = new Date(msg.created_at).getTime();
      const expiresAt = createdAt + (msg.ttl * 1000);
      return now >= expiresAt;
    }).map(msg => msg.id);

    if (expiredIds.length > 0) {
      const { error: delErr } = await supabase
        .from('messages')
        .delete()
        .in('id', expiredIds);
      if (delErr) throw delErr;
      console.log(`[Cron] Deleted ${expiredIds.length} expired self-destruct messages.`);
      
      // Optionally emit event to clients to delete locally
      io.emit('messages-expired', { messageIds: expiredIds });
    }
  } catch (err) {
    console.error('[Cron] Failed to process self-destruct messages:', err);
  }
}, 30 * 1000); // Check every 30 seconds

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🔐 Secure Chat Relay Server running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health\n`);
});
