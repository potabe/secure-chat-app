/**
 * ChatPage.jsx — Main chat application
 * Orchestrates: Socket.IO events, ECDH handshake, AES-GCM encrypt/decrypt,
 *               multi-room management, and Crypto Log.
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { connectSocket, disconnectSocket, getSocket } from '../lib/socket';
import {
  generateECDHKeyPair,
  exportPublicKeyJWK,
  importPublicKeyJWK,
  deriveSharedSecret,
  deriveAESKey,
  encryptMessage,
  decryptMessage,
  fingerprintBuffer,
  bufferToHex,
} from '../lib/crypto';
import useChatStore from '../store/chatStore';

import ServerSidebar from '../components/layout/ServerSidebar';
import ChannelSidebar from '../components/layout/ChannelSidebar';
import MessageList from '../components/chat/MessageList';
import MessageInput from '../components/chat/MessageInput';
import JoinRoomModal from '../components/chat/JoinRoomModal';
import CryptoLogPanel from '../components/crypto/CryptoLogPanel';

import {
  IconHash, IconLock, IconClock, IconHeartBroken, IconTerminal2, IconUsers, IconChevronRight,
  IconShield, IconAlertTriangle, IconArrowLeft
} from '@tabler/icons-react';
import { cn } from '../lib/cn';
import { AnimatePresence, motion } from 'framer-motion';
import MessageSkeleton from '../components/chat/MessageSkeleton';
import RoomInfoPanel from '../components/chat/RoomInfoPanel';
import ResizeHandle from '../components/layout/ResizeHandle';
import { useResize } from '../hooks/useResize';

// ─── Chat Area Header ──────────────────────────────────────────────────────────
function ChatHeader({ room, onToggleCryptoLog, cryptoLogOpen, onToggleRoomInfo, roomInfoOpen, onBack }) {
  if (!room) return null;

  const statusMap = {
    waiting:       { icon: IconClock,      label: 'Menunggu partner...',       color: '#f0b132' },
    handshaking:   { icon: IconShield,     label: 'Handshake ECDH...',         color: '#00a8fc' },
    secured:       { icon: IconLock,       label: 'Sesi Terenkripsi',          color: '#23a559' },
    'partner-left':{ icon: IconHeartBroken, label: 'Partner meninggalkan room', color: '#f23f43' },
    error:         { icon: IconAlertTriangle, label: 'Error',                  color: '#f23f43' },
  };

  const { icon: StatusIcon, label: statusLabel, color } = statusMap[room.status] || statusMap.waiting;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 border-b border-border shadow-sm"
      style={{ background: "var(--background)", minHeight: 48 }}
    >
      {onBack && (
        <button onClick={onBack} className="md:hidden p-1 -ml-2 rounded-md hover:bg-accent text-muted-foreground shrink-0">
          <IconArrowLeft className="w-5 h-5" />
        </button>
      )}
      <IconHash className="w-5 h-5 shrink-0" style={{ color: "var(--muted-foreground)" }} stroke={2} />
      <span className="font-semibold truncate" style={{ color: "var(--foreground)" }}>{room.roomId}</span>

      <div className="w-px h-4 mx-1" style={{ background: "var(--border)" }} />

      <StatusIcon className="w-3.5 h-3.5" style={{ color }} stroke={2} />
      <span className="text-sm" style={{ color }}>{statusLabel}</span>

      {room.partnerEmail && (
        <>
          <div className="w-px h-4 bg-accent mx-1" />
          <IconUsers className="w-3.5 h-3.5 text-muted-foreground" stroke={2} />
          <span className="text-xs text-muted-foreground">{room.partnerEmail}</span>
        </>
      )}

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onToggleCryptoLog}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold',
            'transition-all duration-200',
            cryptoLogOpen
              ? 'bg-[#5865f2]/20 text-[#5865f2] border border-[#5865f2]/30'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          )}
          title="Toggle Crypto Log"
        >
          <IconTerminal2 className="w-3.5 h-3.5" stroke={2} />
          Crypto Log
          {room.cryptoLog?.length > 0 && (
            <span className="bg-[#5865f2] text-white text-[9px] font-bold rounded-full px-1.5 py-0.5">
              {room.cryptoLog.length}
            </span>
          )}
        </button>

        <div className="w-px h-4" style={{ background: 'var(--border)' }} />

        <button
          onClick={onToggleRoomInfo}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold',
            'transition-all duration-200',
            roomInfoOpen
              ? 'bg-[#23a559]/20 text-[#23a559] border border-[#23a559]/30'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          )}
          title="Info Room"
        >
          <IconShield className="w-3.5 h-3.5" stroke={2} />
          Info Room
        </button>
      </div>
    </div>
  );
}

// ─── Handshake Overlay ─────────────────────────────────────────────────────────
function HandshakeOverlay({ status }) {
  if (status !== 'handshaking') return null;
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-[#5865f2]/20 flex items-center justify-center mx-auto mb-4">
          <IconShield className="w-8 h-8 text-[#5865f2] animate-pulse" stroke={2} />
        </div>
        <p className="text-foreground font-semibold">Membangun Sesi Terenkripsi</p>
        <p className="text-muted-foreground text-sm mt-1">ECDH P-256 handshake...</p>
        <div className="flex justify-center gap-1 mt-4">
          {[0,1,2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-[#5865f2] typing-dot"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main ChatPage ─────────────────────────────────────────────────────────────
export default function ChatPage({ onLogout }) {
  const {
    user, token,
    rooms, activeRoomId,
    addRoom, removeRoom, updateRoom, setActiveRoom,
    addMessage, addCryptoLog,
    getRoom, getActiveRoom,
    clearAuth,
  } = useChatStore();

  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [cryptoLogOpen, setCryptoLogOpen] = useState(false);
  const [roomInfoOpen, setRoomInfoOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [loadingHistoryRooms, setLoadingHistoryRooms] = useState(new Set());

  const socketRef = useRef(null);
  
  // Per-room: store myKeyPair separately to avoid Zustand serialization issues with CryptoKey
  const [roomKeyPairs, setRoomKeyPairsState] = useState({}); // { roomId: CryptoKeyPair }
  const [roomAesKeys, setRoomAesKeysState] = useState({});   // { roomId: { [keySize]: CryptoKey } }

  const roomKeyPairsRef = useRef({});
  const roomAesKeysRef = useRef({});

  const setRoomKeyPairs = useCallback((updater) => {
    setRoomKeyPairsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      roomKeyPairsRef.current = next;
      return next;
    });
  }, []);

  const setRoomAesKeys = useCallback((updater) => {
    setRoomAesKeysState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      roomAesKeysRef.current = next;
      return next;
    });
  }, []);

  // ── Socket.IO setup ─────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = connectSocket();

    socket.on('connect', () => {
      socket.emit('authenticate', { token, displayName: user?.displayName || user?.email?.split('@')[0] });
    });

    socket.on('auth-success', ({ uid, email }) => {
      console.log('[Auth] ✅ Authenticated as', email);
    });

    socket.on('auth-error', ({ message }) => {
      console.error('[Auth] ❌', message);
    });

    socket.on('room-joined', ({ roomId, userCount }) => {
      addRoom(roomId);
      addCryptoLog(roomId, {
        category: 'status',
        fields: [
          { label: 'Event', value: 'Room Joined' },
          { label: 'Room ID', value: roomId, copyable: true },
          { label: 'Users', value: `${userCount}/2` },
        ],
      });
      // Generate ECDH key pair for this room
      initRoomCrypto(roomId);
      // Fetch history if room has a password
      const roomPassword = useChatStore.getState().rooms[roomId]?.roomPassword;
      if (roomPassword) {
        setLoadingHistoryRooms(prev => new Set([...prev, roomId]));
        socket.emit('fetch-history', { roomId });
      }
    });

    socket.on('room-full', ({ roomId, message }) => {
      alert(`Room "${roomId}" penuh: ${message}`);
    });

    socket.on('partner-joined', ({ roomId, partnerEmail }) => {
      updateRoom(roomId, { status: 'handshaking', partnerEmail });
      addMessage(roomId, {
        type: 'system',
        text: `${partnerEmail} bergabung ke room. Memulai ECDH handshake...`,
        timestamp: new Date().toLocaleTimeString('id-ID'),
      });
      addCryptoLog(roomId, {
        category: 'status',
        fields: [
          { label: 'Event', value: 'Partner Joined' },
          { label: 'Partner', value: partnerEmail },
          { label: 'Status', value: 'Starting ECDH handshake...' },
        ],
      });
      // Send my public key to partner
      sendPublicKey(roomId);
    });

    socket.on('partner-key', async ({ roomId, publicKey: partnerPublicKeyJWK, fromEmail }) => {
      await handlePartnerKey(roomId, partnerPublicKeyJWK, fromEmail);
    });

    socket.on('receive-message', async ({ roomId, payload, timestamp, fromEmail }) => {
      await handleIncomingMessage(roomId, payload, timestamp, fromEmail);
    });

    socket.on('partner-left', ({ roomId, fromEmail }) => {
      updateRoom(roomId, { status: 'partner-left' });
      addMessage(roomId, {
        type: 'system',
        text: `${fromEmail} telah meninggalkan room.`,
        timestamp: new Date().toLocaleTimeString('id-ID'),
      });
      addCryptoLog(roomId, {
        category: 'status',
        fields: [
          { label: 'Event', value: 'Partner Disconnected' },
          { label: 'Partner', value: fromEmail },
          { label: 'Note', value: 'Sesi E2EE berakhir. Kunci sesi dihapus.' },
        ],
      });
      // Clear AES key for this room
      setRoomAesKeys((prev) => { const n = { ...prev }; delete n[roomId]; return n; });
    });

    socket.on('partner-typing', ({ roomId, email, isTyping }) => {
      const state = useChatStore.getState();
      const room = state.rooms[roomId];
      if (!room) return;
      const currentTyping = room.typingUsers || [];
      const newTyping = isTyping
        ? [...new Set([...currentTyping, email])]
        : currentTyping.filter(e => e !== email);
      state.updateRoom(roomId, { typingUsers: newTyping });
    });

    socket.on('message-read', ({ roomId, messageId, readBy }) => {
      const state = useChatStore.getState();
      const room = state.rooms[roomId];
      if (!room) return;
      const msg = room.messages.find(m => m.id === messageId);
      if (msg) {
        const newReadBy = [...new Set([...(msg.readBy || []), readBy])];
        state.updateMessage(roomId, messageId, { readBy: newReadBy });
      }
    });

    socket.on('message-reaction', ({ roomId: rId, messageId, emoji, fromEmail }) => {
      const state = useChatStore.getState();
      const room = state.rooms[rId];
      if (room) {
        const msg = room.messages.find(m => m.id === messageId);
        if (msg) {
          const reactions = { ...(msg.reactions || {}) };
          if (!reactions[emoji]) reactions[emoji] = [];
          if (!reactions[emoji].includes(fromEmail)) {
            reactions[emoji].push(fromEmail);
            state.updateMessage(rId, messageId, { reactions });
          }
        }
      }
    });

    socket.on('messages-expired', ({ messageIds }) => {
      const state = useChatStore.getState();
      Object.keys(state.rooms).forEach(rId => {
        const room = state.rooms[rId];
        if (room) {
          const hasExpired = room.messages.some(m => messageIds.includes(m.id));
          if (hasExpired) {
            state.setMessages(rId, room.messages.filter(m => !messageIds.includes(m.id)));
          }
        }
      });
    });

    socket.on('history-data', async ({ roomId, messages }) => {
      await handleHistoryData(roomId, messages);
      setLoadingHistoryRooms(prev => {
        const next = new Set(prev);
        next.delete(roomId);
        return next;
      });
    });

    return () => {
      socket.off('connect');
      socket.off('auth-success');
      socket.off('auth-error');
      socket.off('room-joined');
      socket.off('room-full');
      socket.off('partner-joined');
      socket.off('partner-key');
      socket.off('receive-message');
      socket.off('partner-left');
      socket.off('partner-typing');
      socket.off('message-read');
      socket.off('message-reaction');
      socket.off('history-data');
    };
  }, [token]);

  // ── ECDH: Generate key pair for room ────────────────────────────────────────
  const initRoomCrypto = async (roomId) => {
    try {
      const keyPair = await generateECDHKeyPair();
      const publicKeyJWK = await exportPublicKeyJWK(keyPair.publicKey);

      setRoomKeyPairs((prev) => ({ ...prev, [roomId]: keyPair }));
      updateRoom(roomId, { myPublicKeyJWK: publicKeyJWK });

      addCryptoLog(roomId, {
        category: 'ecdh',
        fields: [
          { label: 'Algorithm', value: 'ECDH P-256' },
          { label: 'Key Type', value: 'Public Key (JWK)', copyable: false },
          { label: 'kty', value: publicKeyJWK.kty },
          { label: 'crv', value: publicKeyJWK.crv },
          { label: 'x (coord)', value: publicKeyJWK.x, copyable: true },
          { label: 'y (coord)', value: publicKeyJWK.y, copyable: true },
          { label: 'Private Key', value: '[non-extractable — stays in browser]' },
        ],
      });
    } catch (err) {
      console.error('[Crypto] Key gen failed:', err);
    }
  };

  // ── Send my public key to partner ────────────────────────────────────────────
  const sendPublicKey = (roomId) => {
    const keyPair = roomKeyPairsRef.current[roomId];
    const room = getRoom(roomId);
    if (!keyPair || !room?.myPublicKeyJWK) {
      // Key pair not ready yet, retry after short delay
      setTimeout(() => sendPublicKey(roomId), 200);
      return;
    }
    const socket = getSocket();
    socket.emit('send-public-key', { roomId, publicKey: room.myPublicKeyJWK });
  };

  // ── Handle incoming partner public key → complete handshake ─────────────────
  const handlePartnerKey = async (roomId, partnerPublicKeyJWK, fromEmail) => {
    try {
      const keyPair = roomKeyPairsRef.current[roomId];
      if (!keyPair) {
        console.error('[Crypto] No key pair for room', roomId);
        return;
      }

      const partnerPublicKey = await importPublicKeyJWK(partnerPublicKeyJWK);
      const sharedSecretBuffer = await deriveSharedSecret(keyPair.privateKey, partnerPublicKey);
      const fingerprint = await fingerprintBuffer(sharedSecretBuffer);

      const room = getRoom(roomId);
      const roomPassword = room?.roomPassword || '';

      // Pre-derive both AES-128 and AES-256 keys
      const [aesKey128, aesKey256] = await Promise.all([
        deriveAESKey(sharedSecretBuffer, 128, roomPassword),
        deriveAESKey(sharedSecretBuffer, 256, roomPassword),
      ]);

      setRoomAesKeys((prev) => ({
        ...prev,
        [roomId]: { 128: aesKey128, 256: aesKey256 },
      }));

      updateRoom(roomId, {
        status: 'secured',
        sharedSecretFingerprint: fingerprint,
        partnerEmail: fromEmail || getRoom(roomId)?.partnerEmail,
      });

      addCryptoLog(roomId, {
        category: 'ecdh',
        fields: [
          { label: 'Event', value: 'ECDH Handshake Complete ✅' },
          { label: 'Partner Key (x)', value: partnerPublicKeyJWK.x, copyable: true },
          { label: 'Partner Key (y)', value: partnerPublicKeyJWK.y, copyable: true },
        ],
      });

      addCryptoLog(roomId, {
        category: 'hkdf',
        fields: [
          { label: 'Algorithm', value: 'HKDF-SHA256' },
          { label: 'Shared Secret Fingerprint (SHA-256)', value: fingerprint, copyable: true },
          { label: 'Info String', value: 'secure-chat-aes-gcm' },
          { label: 'Salt', value: '0x' + '00'.repeat(32) },
          { label: 'AES-128 Key', value: '[derived ✓ non-extractable]' },
          { label: 'AES-256 Key', value: '[derived ✓ non-extractable]' },
        ],
      });

      addMessage(roomId, {
        type: 'system',
        text: '🔐 Sesi terenkripsi berhasil terbentuk! Semua pesan kini dienkripsi dengan AES-GCM.',
        timestamp: new Date().toLocaleTimeString('id-ID'),
      });
    } catch (err) {
      console.error('[Crypto] Handshake failed:', err);
      updateRoom(roomId, { status: 'error' });
    }
  };

  // ── Handle incoming encrypted message ────────────────────────────────────────
  const handleIncomingMessage = async (roomId, payload, timestamp, fromEmail) => {
    const { ciphertext, iv, keySize, ttl } = payload;
    const aesKeys = roomAesKeysRef.current[roomId];

    if (!aesKeys?.[keySize]) {
      addMessage(roomId, {
        type: 'incoming',
        error: true,
        text: '[Gagal dekripsi - Kunci AES tidak ditemukan]',
        fromEmail,
        timestamp: new Date(timestamp).toLocaleTimeString('id-ID'),
      });
      return;
    }

    try {
      const aesKey = aesKeys[keySize];
      const plaintext = await decryptMessage(aesKey, ciphertext, iv);
      const messageId = payload.id || (Date.now() + Math.random().toString(36).substr(2, 9));

      addMessage(roomId, {
        id: messageId,
        type: 'incoming',
        text: plaintext,
        fromEmail,
        timestamp: new Date(timestamp).toLocaleTimeString('id-ID'),
        keySize,
        ttl,
        readBy: [],
        reactions: payload.reactions || {},
        replyToId: payload.replyToId || null,
      });

      // Mark as read if the chat window is focused/active
      if (getActiveRoom()?.roomId === roomId) {
        const socket = getSocket();
        if (socket) socket.emit('mark-read', { roomId, messageId });
      }

      addCryptoLog(roomId, {
        category: 'dec',
        fields: [
          { label: 'Algorithm', value: `AES-${keySize}-GCM` },
          { label: 'IV / Nonce (hex)', value: iv, copyable: true },
          { label: 'Ciphertext (hex)', value: ciphertext.slice(0, 96) + (ciphertext.length > 96 ? '...' : ''), copyable: true },
          { label: 'Auth Tag', value: '✅ Valid — pesan tidak dimanipulasi' },
          { label: 'From', value: fromEmail },
        ],
      });
    } catch (err) {
      // Auth tag invalid — tampered message
      addMessage(roomId, {
        type: 'incoming',
        error: true,
        text: '[Pesan gagal didekripsi - Integritas rusak atau kunci salah]',
        fromEmail,
        timestamp: new Date(timestamp).toLocaleTimeString('id-ID'),
      });
      addCryptoLog(roomId, {
        category: 'status',
        fields: [
          { label: 'Event', value: '⚠️ INTEGRITY CHECK FAILED' },
          { label: 'Reason', value: 'AES-GCM authentication tag invalid' },
          { label: 'Action', value: 'Message rejected and not displayed' },
          { label: 'From', value: fromEmail },
        ],
      });
    }
  };

  // ── Emit typing event ────────────────────────────────────────────────────────
  const handleTyping = (roomId, isTyping) => {
    getSocket()?.emit('typing', { roomId, isTyping });
  };

  // ── Emit reaction event ──────────────────────────────────────────────────────
  const handleReact = (messageId, emoji) => {
    const roomId = activeRoomId;
    if (!roomId) return;
    getSocket()?.emit('react-message', { roomId, messageId, emoji });
    
    // Optimistic update locally
    const state = useChatStore.getState();
    const room = state.rooms[roomId];
    if (room) {
      const msg = room.messages.find(m => m.id === messageId);
      if (msg) {
        const reactions = { ...(msg.reactions || {}) };
        if (!reactions[emoji]) reactions[emoji] = [];
        const myEmail = user?.email;
        if (!reactions[emoji].includes(myEmail)) {
          reactions[emoji].push(myEmail);
          state.updateMessage(roomId, messageId, { reactions });
        } else {
           // Toggle off reaction if clicked again
           reactions[emoji] = reactions[emoji].filter(e => e !== myEmail);
           if (reactions[emoji].length === 0) delete reactions[emoji];
           state.updateMessage(roomId, messageId, { reactions });
        }
      }
    }
  };

  // ── Send encrypted message ───────────────────────────────────────────────────
  const handleSend = async (text, keySize, ttl) => {
    const roomId = activeRoomId;
    const aesKeys = roomAesKeys[roomId];
    if (!aesKeys?.[keySize]) {
      console.error('[Crypto] No AES key for room', roomId, 'size', keySize);
      return;
    }

    try {
      const aesKey = aesKeys[keySize];
      const { ciphertext, iv } = await encryptMessage(aesKey, text);

      const socket = getSocket();
      const payloadId = Date.now() + Math.random().toString(36).substr(2, 9);
      const roomPassword = getRoom(roomId)?.roomPassword;
      const currentReplyTo = replyingTo?.id || null;
      socket.emit('send-message', {
        roomId,
        payload: { id: payloadId, ciphertext, iv, keySize, ttl, storeHistory: !!roomPassword, replyToId: currentReplyTo },
      });

      // Add to local messages immediately (no round-trip for own messages)
      addMessage(roomId, {
        id: payloadId,
        type: 'outgoing',
        text,
        timestamp: new Date().toLocaleTimeString('id-ID'),
        keySize,
        ttl,
        readBy: [],
        reactions: {},
        replyToId: currentReplyTo,
      });

      setReplyingTo(null);

      addCryptoLog(roomId, {
        category: 'enc',
        fields: [
          { label: 'Algorithm', value: `AES-${keySize}-GCM` },
          { label: 'IV / Nonce (hex)', value: iv, copyable: true },
          { label: 'Ciphertext (hex)', value: ciphertext.slice(0, 96) + (ciphertext.length > 96 ? '...' : ''), copyable: true },
          { label: 'Auth Tag', value: 'Embedded in last 32 hex chars of ciphertext (AES-GCM)' },
        ],
      });
    } catch (err) {
      console.error('[Crypto] Encrypt failed:', err);
    }
  };

  // ── Handle incoming encrypted history ─────────────────────────────────────────
  const handleHistoryData = async (roomId, messages) => {
    const room = getRoom(roomId);
    const roomPassword = room?.roomPassword;
    if (!roomPassword || !messages || messages.length === 0) return;

    // Derive a history AES key directly from the room password using a fixed salt (or zero salt)
    // to decrypt messages from previous sessions.
    try {
      const encoder = new TextEncoder();
      const passBuffer = encoder.encode(roomPassword);
      // We will hash the password to act as the raw key material
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        await crypto.subtle.digest('SHA-256', passBuffer),
        { name: 'HKDF' },
        false,
        ['deriveKey']
      );

      const historyAesKey = await crypto.subtle.deriveKey(
        {
          name: 'HKDF',
          hash: 'SHA-256',
          salt: new Uint8Array(32), // Fixed zero salt for history
          info: encoder.encode('secure-chat-history-aes-gcm'),
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );

      const decryptedMessages = [];
      for (const msg of messages) {
        try {
          const text = await decryptMessage(historyAesKey, msg.ciphertext, msg.iv);
          decryptedMessages.push({
            id: msg.id,
            type: msg.sender_email === user?.email ? 'outgoing' : 'incoming',
            text,
            timestamp: new Date(msg.created_at).toLocaleTimeString('id-ID'),
            ttl: msg.ttl,
            readBy: [],
            reactions: {},
            replyToId: msg.reply_to_id,
            fromEmail: msg.sender_email,
          });
        } catch (err) {
          console.error(`[History] Failed to decrypt msg ${msg.id}:`, err);
        }
      }

      useChatStore.getState().setMessages(roomId, decryptedMessages);
      addMessage(roomId, {
        type: 'system',
        text: `📦 Berhasil memulihkan ${decryptedMessages.length} pesan terenkripsi dari riwayat.`,
        timestamp: new Date().toLocaleTimeString('id-ID'),
      });
    } catch (err) {
      console.error('[History] Failed to process history:', err);
    }
  };



  // ── Join room ─────────────────────────────────────────────────────────────────
  const handleJoinRoom = (roomId, roomPassword = '') => {
    setReplyingTo(null);
    addRoom(roomId, roomPassword);
    const socket = getSocket();
    socket.emit('join-room', { roomId });
  };

  // ── Leave room ────────────────────────────────────────────────────────────────
  const handleLeaveRoom = (roomId) => {
    const socket = getSocket();
    socket.emit('leave-room', { roomId });
    removeRoom(roomId);
    setRoomKeyPairs((prev) => { const n = { ...prev }; delete n[roomId]; return n; });
    setRoomAesKeys((prev) => { const n = { ...prev }; delete n[roomId]; return n; });
  };

  // ── Logout ─────────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    disconnectSocket();
    clearAuth();
    await signOut(auth);
    onLogout();
  };

  const activeRoom = getRoom(activeRoomId);
  const isSecured = activeRoom?.status === 'secured';

  // ── No rooms yet — show welcome ────────────────────────────────────────────────
  const NoRoomSelected = () => (
    <div className="h-full flex flex-col items-center justify-center gap-4 text-center px-8">
      <div className="w-20 h-20 rounded-2xl bg-[#5865f2]/20 flex items-center justify-center">
        <IconShield className="w-10 h-10 text-[#5865f2]" stroke={2} />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Selamat Datang!</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          Bergabung ke sebuah room untuk memulai percakapan terenkripsi end-to-end.
        </p>
      </div>
      <div className="flex flex-col gap-2 text-sm text-muted-foreground text-left bg-card rounded-xl p-4 max-w-xs w-full">
        <p className="flex items-center gap-2"><IconShield className="w-4 h-4 text-[#5865f2]" stroke={2} /> ECDH P-256 key exchange</p>
        <p className="flex items-center gap-2"><IconLock className="w-4 h-4 text-[#23a559]" stroke={2} /> AES-GCM encryption</p>
        <p className="flex items-center gap-2"><IconTerminal2 className="w-4 h-4 text-[#9b59b6]" stroke={2} /> Real-time Crypto Log</p>
      </div>
      <button
        onClick={() => setJoinModalOpen(true)}
        className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all"
      >
        Join Room
      </button>
    </div>
  );

  // ─── Resizable sidebar ────────────────────────────────────────────────────────
  const { size: sidebarWidth, handleMouseDown: handleSidebarResize } = useResize({
    defaultSize: 240,
    min: 52,
    max: 400,
    direction: 'horizontal',
    storageKey: 'secure-chat-sidebar-width',
  });

  return (
    <div className="flex" style={{ height: '100%', overflow: 'hidden', background: "var(--background)" }}>
      {/* Sidebars Wrapper */}
      <div className={cn("shrink-0 h-full", activeRoom ? "hidden md:flex" : "flex w-full md:w-auto")}>
        {/* Server sidebar (leftmost) */}
        <ServerSidebar onLogout={handleLogout} />

        {/* Channel sidebar (rooms list) */}
        <div className="flex-1 md:flex-none">
          <ChannelSidebar
            onJoinRoom={() => setJoinModalOpen(true)}
            onLeaveRoom={handleLeaveRoom}
            width={sidebarWidth}
          />
        </div>

        {/* Resize handle */}
        <div className="hidden md:flex">
          <ResizeHandle onMouseDown={handleSidebarResize} direction="horizontal" />
        </div>
      </div>

      {/* Main content */}
      <div className={cn("flex-1 flex-col min-w-0 overflow-hidden", !activeRoom ? "hidden md:flex" : "flex")}>
        <AnimatePresence mode="wait">
        {activeRoom ? (
          <motion.div
            key={activeRoom.roomId}
            className="flex-1 flex flex-col min-w-0 h-full"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <ChatHeader
              room={activeRoom}
              onToggleCryptoLog={() => setCryptoLogOpen(!cryptoLogOpen)}
              cryptoLogOpen={cryptoLogOpen}
              onToggleRoomInfo={() => setRoomInfoOpen(!roomInfoOpen)}
              roomInfoOpen={roomInfoOpen}
              onBack={() => setActiveRoom(null)}
            />
            <div className="flex-1 flex overflow-hidden relative">
              {/* Chat area */}
              <div className="flex-1 flex flex-col min-w-0 relative">
                <HandshakeOverlay status={activeRoom.status} />
                {loadingHistoryRooms.has(activeRoom.roomId) ? (
                  <MessageSkeleton />
                ) : (
                  <MessageList
                    messages={activeRoom.messages}
                    roomId={activeRoom.roomId}
                    status={activeRoom.status}
                    onReact={handleReact}
                    onReply={(msg) => setReplyingTo(msg)}
                  />
                )}
                <MessageInput
                  onSend={handleSend}
                  onTyping={(isTyping) => handleTyping(activeRoom.roomId, isTyping)}
                  disabled={!isSecured}
                  roomId={activeRoom.roomId}
                  replyingTo={replyingTo}
                  onCancelReply={() => setReplyingTo(null)}
                  typingUsers={activeRoom.typingUsers?.filter(e => e !== user?.email)}
                />
              </div>

              {/* Crypto Log Panel */}
              <CryptoLogPanel
                isOpen={cryptoLogOpen}
                onClose={() => setCryptoLogOpen(false)}
                cryptoLog={activeRoom.cryptoLog || []}
                roomId={activeRoom.roomId}
              />

              {/* Room Info Panel */}
              <RoomInfoPanel
                isOpen={roomInfoOpen}
                onClose={() => setRoomInfoOpen(false)}
                room={activeRoom}
                currentUserEmail={user?.email}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="no-room"
            className="flex-1 h-full flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <NoRoomSelected />
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {/* Join Room Modal */}
      <JoinRoomModal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        onJoin={handleJoinRoom}
        existingRooms={Object.keys(rooms)}
      />
    </div>
  );
}
