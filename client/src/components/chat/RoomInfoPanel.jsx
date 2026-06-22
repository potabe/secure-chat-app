/**
 * RoomInfoPanel.jsx — Sliding panel showing room details, security info, and stats
 */
import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconX, IconShield, IconLock, IconKey, IconUsers, IconHash,
  IconMessage, IconClock, IconCopy, IconCheck, IconAlertTriangle,
  IconHeartBroken, IconFingerprint
} from '@tabler/icons-react';
import { useState } from 'react';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-muted transition-colors shrink-0"
      title="Salin"
    >
      {copied
        ? <IconCheck className="w-3 h-3 text-[#23a559]" stroke={2.5} />
        : <IconCopy className="w-3 h-3 text-muted-foreground" stroke={2} />
      }
    </button>
  );
}

function InfoRow({ label, value, mono = false, copyable = false }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 border-b border-border last:border-0">
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
        {label}
      </span>
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className={`text-xs break-all leading-relaxed flex-1 ${mono ? 'font-mono' : ''}`}
          style={{ color: 'var(--foreground)' }}
        >
          {value}
        </span>
        {copyable && value && <CopyButton text={value} />}
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2 px-1">
        <Icon className="w-3.5 h-3.5 text-[#5865f2]" stroke={2} />
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#5865f2]">
          {title}
        </span>
      </div>
      <div className="bg-card rounded-xl border border-border px-3 divide-y divide-border">
        {children}
      </div>
    </div>
  );
}

const STATUS_CONFIG = {
  waiting:       { label: 'Menunggu Partner',      color: '#f0b132', icon: IconClock },
  handshaking:   { label: 'Handshake ECDH...',     color: '#00a8fc', icon: IconShield },
  secured:       { label: 'Terenkripsi E2E',        color: '#23a559', icon: IconLock },
  'partner-left':{ label: 'Partner Meninggalkan',  color: '#f23f43', icon: IconHeartBroken },
  error:         { label: 'Error',                  color: '#f23f43', icon: IconAlertTriangle },
};

export default function RoomInfoPanel({ isOpen, onClose, room, currentUserEmail }) {
  const statusCfg = STATUS_CONFIG[room?.status] || STATUS_CONFIG.waiting;
  const StatusIcon = statusCfg.icon;

  const stats = useMemo(() => {
    if (!room) return {};
    const msgs = room.messages || [];
    const outgoing = msgs.filter(m => m.type === 'outgoing').length;
    const incoming = msgs.filter(m => m.type === 'incoming').length;
    const selfDestruct = msgs.filter(m => m.ttl > 0).length;
    return { total: msgs.length, outgoing, incoming, selfDestruct };
  }, [room?.messages]);

  const fingerprintDisplay = room?.sharedSecretFingerprint
    ? room.sharedSecretFingerprint.match(/.{1,4}/g)?.join(' ') || room.sharedSecretFingerprint
    : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            className="absolute inset-0 z-10 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="absolute inset-0 z-50 md:relative md:inset-auto md:z-20 flex flex-col border-l border-border overflow-hidden !w-full md:!w-[280px] md:!min-w-[280px]"
            style={{ background: 'var(--card)' }}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0"
              style={{ background: 'var(--background)' }}
            >
              <div className="flex items-center gap-2">
                <IconShield className="w-4 h-4 text-[#5865f2]" stroke={2} />
                <span className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
                  Info Room
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted transition-colors"
              >
                <IconX className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} stroke={2} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">

              {/* Room Hero */}
              <div className="flex flex-col items-center gap-2 mb-5 py-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-1"
                  style={{ background: 'rgba(88,101,242,0.15)' }}
                >
                  <IconHash className="w-7 h-7 text-[#5865f2]" stroke={2} />
                </div>
                <span className="font-bold text-base" style={{ color: 'var(--foreground)' }}>
                  #{room?.roomId}
                </span>
                {/* Live status badge */}
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
                  style={{
                    color: statusCfg.color,
                    borderColor: `${statusCfg.color}40`,
                    background: `${statusCfg.color}15`,
                  }}
                >
                  <StatusIcon className="w-3 h-3" stroke={2} />
                  {statusCfg.label}
                </div>
              </div>

              {/* Security section */}
              <Section title="Keamanan" icon={IconShield}>
                <InfoRow label="Protokol" value="ECDH P-256 + AES-256-GCM" />
                <InfoRow label="Status Enkripsi" value={statusCfg.label} />
                {room?.status === 'secured' && (
                  <InfoRow
                    label="Shared Secret Fingerprint"
                    value={fingerprintDisplay || '—'}
                    mono
                    copyable={!!fingerprintDisplay}
                  />
                )}
                {room?.roomPassword && (
                  <InfoRow label="Riwayat Pesan" value="Dienkripsi & Tersimpan di Supabase" />
                )}
              </Section>

              {/* Participants section */}
              <Section title="Peserta" icon={IconUsers}>
                <InfoRow label="Kamu" value={currentUserEmail || '—'} />
                <InfoRow label="Partner" value={room?.partnerEmail || 'Belum bergabung'} />
              </Section>

              {/* Stats section */}
              <Section title="Statistik Room" icon={IconMessage}>
                <InfoRow label="Total Pesan" value={`${stats.total ?? 0} pesan`} />
                <InfoRow label="Dikirim" value={`${stats.outgoing ?? 0} pesan`} />
                <InfoRow label="Diterima" value={`${stats.incoming ?? 0} pesan`} />
                {stats.selfDestruct > 0 && (
                  <InfoRow label="Self-Destruct Aktif" value={`${stats.selfDestruct} pesan`} />
                )}
                <InfoRow label="Log Kriptografi" value={`${room?.cryptoLog?.length ?? 0} entri`} />
              </Section>

              {/* Warning if not secured */}
              {room?.status !== 'secured' && (
                <div
                  className="flex items-start gap-2 p-3 rounded-xl text-xs border mt-2"
                  style={{
                    background: '#f0b13215',
                    borderColor: '#f0b13240',
                    color: '#f0b132',
                  }}
                >
                  <IconAlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" stroke={2} />
                  <span>Enkripsi end-to-end belum aktif. Pesan belum aman dikirim.</span>
                </div>
              )}

              {/* E2E confirmed badge */}
              {room?.status === 'secured' && (
                <div
                  className="flex items-start gap-2 p-3 rounded-xl text-xs border mt-2"
                  style={{
                    background: '#23a55915',
                    borderColor: '#23a55940',
                    color: '#23a559',
                  }}
                >
                  <IconFingerprint className="w-3.5 h-3.5 mt-0.5 shrink-0" stroke={2} />
                  <span>
                    Sesi ini dilindungi oleh enkripsi end-to-end. Tidak ada pihak ketiga yang bisa membaca pesan kamu.
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
