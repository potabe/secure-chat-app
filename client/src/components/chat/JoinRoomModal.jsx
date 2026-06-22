/**
 * JoinRoomModal.jsx — Modal for joining/creating a room
 */
import { useState } from 'react';
import { IconX, IconHash, IconArrowRight, IconLoader2 } from '@tabler/icons-react';
import { cn } from '../../lib/cn';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export default function JoinRoomModal({ isOpen, onClose, onJoin, existingRooms = [] }) {
  const [roomCode, setRoomCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleaned = roomCode.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
    if (!cleaned) { setError('Kode room tidak valid.'); return; }
    if (existingRooms.includes(cleaned)) { setError('Kamu sudah berada di room ini.'); return; }

    setLoading(true);
    setError('');
    await onJoin(cleaned, password);
    setLoading(false);
    setRoomCode('');
    setPassword('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="glass-card border border-border p-6 max-w-sm rounded-2xl bg-card/90">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-white">Bergabung ke Room</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Masukkan kode room yang sama dengan partner Anda
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <IconX className="w-5 h-5" stroke={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Room code input */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Kode Room
            </label>
            <div className="relative">
              <IconHash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" stroke={2} />
              <input
                type="text"
                value={roomCode}
                onChange={(e) => { setRoomCode(e.target.value); setError(''); }}
                placeholder="contoh: demo-room"
                autoFocus
                className={cn(
                  'w-full bg-secondary border border-border rounded-lg',
                  'pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground',
                  'focus:outline-none focus:border-[#5865f2] focus:ring-1 focus:ring-[#5865f2]',
                  'transition-colors'
                )}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              Hanya huruf kecil, angka, tanda hubung, dan underscore.
            </p>
          </div>

          {/* Password input (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Password Room <span className="text-muted-foreground lowercase">(Opsional)</span>
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Rahasia enkripsi tambahan..."
                className={cn(
                  'w-full bg-secondary border border-border rounded-lg',
                  'px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground',
                  'focus:outline-none focus:border-[#5865f2] focus:ring-1 focus:ring-[#5865f2]',
                  'transition-colors'
                )}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 leading-tight">
              Tidak dikirim ke server. Digunakan sebagai <i>salt</i> ekstra untuk enkripsi E2E. Jika berbeda, pesan tidak bisa dibaca.
            </p>
          </div>

          {error && (
            <p className="text-xs text-[#f23f43] bg-[#f23f43]/10 border border-[#f23f43]/30 rounded px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !roomCode.trim()}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-3 rounded-lg',
              'bg-[#5865f2] hover:bg-[#4752c4] text-white font-semibold text-sm',
              'transition-all disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {loading ? (
              <><IconLoader2 className="w-4 h-4 animate-spin" stroke={2} /> Bergabung...</>
            ) : (
              <><IconArrowRight className="w-4 h-4" stroke={2} /> Bergabung</>
            )}
          </button>
        </form>

        {/* Info */}
        <div className="mt-4 p-3 bg-[#5865f2]/10 border border-[#5865f2]/20 rounded-lg">
          <p className="text-[11px] text-muted-foreground">
            💡 Dua pengguna yang memasukkan kode room yang sama akan terhubung dan sesi ECDH handshake akan dimulai secara otomatis.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
