/**
 * MessageInput.jsx — Message input with AES key size selector
 */
import { useState, useEffect, useRef } from 'react';
import { IconSend, IconChevronDown, IconLock, IconClock, IconX, IconArrowBackUp } from '@tabler/icons-react';
import { cn } from '../../lib/cn';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const ttlOptions = [
  { value: 0, label: 'Off' },
  { value: 10, label: '10s' },
  { value: 30, label: '30s' },
  { value: 60, label: '1m' },
];

export default function MessageInput({ onSend, onTyping, disabled, roomId, replyingTo, onCancelReply, typingUsers }) {
  const [text, setText] = useState('');
  const [keySize, setKeySize] = useState(256);
  const [ttl, setTtl] = useState(0);
  const typingTimeoutRef = useRef(null);

  const handleTextChange = (e) => {
    setText(e.target.value);
    
    if (onTyping) {
      onTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 2000);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text.trim(), keySize, ttl);
    setText('');
    if (onTyping) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      onTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="px-4 pb-6 pt-2 relative">
      {/* Typing Indicator */}
      {typingUsers && typingUsers.length > 0 && (
        <div className="absolute -top-7 left-8 z-10 px-3 py-1.5 bg-card/90 backdrop-blur rounded-full text-xs text-muted-foreground flex items-center gap-2 shadow-sm border border-border animate-fade-in">
          <span className="flex space-x-0.5 items-end">
            <span className="typing-dot w-1.5 h-1.5 bg-[#5865f2] rounded-full" />
            <span className="typing-dot w-1.5 h-1.5 bg-[#5865f2] rounded-full" />
            <span className="typing-dot w-1.5 h-1.5 bg-[#5865f2] rounded-full" />
          </span>
          <span className="font-medium">{typingUsers.join(', ')}</span> sedang mengetik...
        </div>
      )}

      {/* Reply Preview */}
      {replyingTo && (
        <div className="flex items-center justify-between bg-card border border-border rounded-t-xl px-3 py-2 -mb-2 z-0 relative shadow-sm mx-1">
          <div className="flex items-center gap-2 overflow-hidden text-sm">
            <IconArrowBackUp className="w-4 h-4 text-[#5865f2] shrink-0" stroke={2} />
            <span className="font-semibold text-foreground shrink-0 text-xs">Membalas {replyingTo.fromEmail || 'Partner'}:</span>
            <span className="text-muted-foreground truncate text-xs italic">
              {replyingTo.text.length > 50 ? replyingTo.text.substring(0, 50) + '...' : replyingTo.text}
            </span>
          </div>
          <button 
            type="button" 
            onClick={onCancelReply}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className={cn(
          "flex items-center gap-2 bg-input px-3 py-2 z-10 relative",
          replyingTo ? "rounded-b-xl rounded-t-none" : "rounded-xl"
        )}
      >
        {/* AES Key Size Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              className={cn(
                'flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold',
                'bg-[#5865f2]/20 hover:bg-[#5865f2]/30 text-[#5865f2]',
                'border border-[#5865f2]/30 transition-all outline-none',
                'disabled:opacity-40 disabled:cursor-not-allowed'
              )}
              title="Pilih ukuran kunci AES"
            >
              <IconLock className="w-3 h-3" stroke={2} />
              AES-{keySize}
              <IconChevronDown className="w-3 h-3" stroke={2} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[180px] bg-secondary border-border text-foreground">
            {[128, 256].map((size) => (
              <DropdownMenuItem
                key={size}
                onClick={() => setKeySize(size)}
                className={cn(
                  'flex items-center gap-2 cursor-pointer focus:bg-[#5865f2]/20 focus:text-white',
                  keySize === size ? 'text-[#5865f2] font-semibold' : ''
                )}
              >
                <IconLock className="w-3.5 h-3.5" stroke={2} />
                AES-{size}
                {size === 256 && (
                  <span className="ml-auto text-[9px] text-[#23a559] font-bold">STRONG</span>
                )}
              </DropdownMenuItem>
            ))}
            <div className="px-2 py-1.5 mt-1 border-t border-border">
              <p className="text-[10px] text-muted-foreground">Kunci diturunkan via HKDF dari shared ECDH secret</p>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* TTL Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              className={cn(
                'flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold',
                'bg-[#f23f43]/10 hover:bg-[#f23f43]/20',
                ttl > 0 ? 'text-[#f23f43] border border-[#f23f43]/30' : 'text-muted-foreground border border-transparent hover:text-foreground',
                'transition-all outline-none',
                'disabled:opacity-40 disabled:cursor-not-allowed'
              )}
              title="Auto-destruct timer"
            >
              <IconClock className="w-3 h-3" stroke={2} />
              {ttl > 0 ? `${ttl}s` : 'Off'}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[100px] bg-secondary border-border text-foreground">
            {ttlOptions.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => setTtl(opt.value)}
                className={cn(
                  'flex items-center gap-2 cursor-pointer focus:bg-[#f23f43]/20 focus:text-white',
                  ttl === opt.value ? 'text-[#f23f43] font-semibold' : ''
                )}
              >
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Text Input */}
        <input
          type="text"
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={
            disabled
              ? 'Menunggu koneksi terenkripsi...'
              : `Pesan di #${roomId}`
          }
          className={cn(
            'flex-1 bg-transparent text-sm text-foreground',
            'placeholder:text-muted-foreground outline-none',
            'disabled:cursor-not-allowed'
          )}
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={!text.trim() || disabled}
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            'bg-[#5865f2] hover:bg-[#4752c4] active:bg-[#3c45a5]',
            'transition-all disabled:opacity-30 disabled:cursor-not-allowed',
            'text-white'
          )}
        >
          <IconSend className="w-3.5 h-3.5" stroke={2} />
        </button>
      </form>
      <p className="text-[10px] text-muted-foreground text-center mt-2">
        🔐 Pesan dienkripsi dengan AES-{keySize}-GCM sebelum dikirim
      </p>
    </div>
  );
}
