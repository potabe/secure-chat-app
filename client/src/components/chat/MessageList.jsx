/**
 * MessageList.jsx — Scrollable message area with auto-scroll
 */
import { useEffect, useRef } from 'react';
import { IconShield } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBubble from './MessageBubble';

export default function MessageList({ messages, roomId, status, onReact, onReply }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
        <div className="w-16 h-16 rounded-full bg-[#5865f2]/20 flex items-center justify-center">
          <IconShield className="w-8 h-8 text-[#5865f2]" stroke={2} />
        </div>
        <div>
          <p className="font-semibold text-foreground text-lg">#{roomId}</p>
          {status === 'secured' ? (
            <p className="text-sm text-muted-foreground mt-1">
              🔐 Sesi terenkripsi terbentuk. Mulai percakapan!
            </p>
          ) : status === 'waiting' ? (
            <p className="text-sm text-muted-foreground mt-1">
              ⏳ Menunggu partner bergabung ke room ini...
            </p>
          ) : status === 'partner-left' ? (
            <p className="text-sm text-[#f23f43] mt-1">
              💔 Partner telah meninggalkan room ini.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mt-1">
              🤝 Sedang melakukan handshake kriptografi...
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto py-4 space-y-0.5">
      {/* Start-of-channel message */}
      <div className="px-4 pb-4 border-b border-border mb-4">
        <div className="w-12 h-12 rounded-full bg-[#5865f2]/20 flex items-center justify-center mb-3">
          <IconShield className="w-6 h-6 text-[#5865f2]" stroke={2} />
        </div>
        <p className="font-bold text-xl" style={{ color: "var(--foreground)" }}>#{roomId}</p>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          Ini adalah awal dari percakapan terenkripsi di room <strong style={{ color: "var(--foreground)" }}>#{roomId}</strong>.
        </p>
      </div>

      <AnimatePresence initial={false}>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <MessageBubble message={msg} onReact={onReact} onReply={onReply} />
          </motion.div>
        ))}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  );
}
