/**
 * MessageBubble.jsx — Discord-style message (avatar + name + timestamp + text)
 */
import { useState, useEffect } from 'react';
import { IconAlertTriangle, IconCheck, IconChecks, IconArrowBackUp } from '@tabler/icons-react';
import { cn } from '../../lib/cn';
import useChatStore from '../../store/chatStore';

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢'];

function Avatar({ email }) {
  const initial = email?.[0]?.toUpperCase() || '?';
  // Generate consistent color from email
  const colors = ['#5865f2', '#9b59b6', '#23a559', '#e91e63', '#00a8fc', '#f0b132'];
  const idx = email ? email.charCodeAt(0) % colors.length : 0;
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
      style={{ background: colors[idx] }}
    >
      {initial}
    </div>
  );
}

export default function MessageBubble({ message, onReact, onReply }) {
  const { id, type, text, fromEmail, timestamp, error, keySize, ttl, readBy, reactions, replyToId } = message;
  const isMine = type === 'outgoing';
  const displayEmail = isMine ? 'Kamu' : (fromEmail || 'Partner');

  const room = useChatStore(state => state.rooms[state.activeRoomId]);
  const repliedMessage = replyToId ? room?.messages?.find(m => m.id === replyToId) : null;

  const [timeLeft, setTimeLeft] = useState(ttl || 0);

  useEffect(() => {
    if (!ttl || ttl <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [ttl]);

  if (error) {
    return (
      <div className="flex items-start gap-3 px-4 py-1 hover:bg-accent group animate-fade-in">
        <Avatar email={fromEmail} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-sm font-semibold text-[#f23f43]">{displayEmail}</span>
            <span className="text-xs text-muted-foreground">{timestamp}</span>
          </div>
          <div className="flex items-center gap-2 bg-[#f23f43]/10 border border-[#f23f43]/30 rounded px-3 py-2">
            <IconAlertTriangle className="w-4 h-4 text-[#f23f43] shrink-0" stroke={2} />
            <span className="text-sm text-[#f23f43]">⚠️ Integrity check failed — pesan mungkin telah dimanipulasi</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-1 hover:bg-accent group message-enter',
        isMine && 'flex-row-reverse'
      )}
    >
      {!isMine && <Avatar email={fromEmail} />}
      <div className={cn('flex-1 min-w-0', isMine && 'flex flex-col items-end')}>
        <div className={cn('flex items-baseline gap-2 mb-1', isMine && 'flex-row-reverse')}>
          <span
            className="text-sm font-semibold"
            style={{ color: isMine ? '#5865f2' : 'var(--foreground)' }}
          >
            {displayEmail}
          </span>
          <span className="text-xs text-muted-foreground">{timestamp}</span>
          {keySize && (
            <span className="text-[9px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              AES-{keySize}
            </span>
          )}
          {ttl > 0 && (
            <span className="text-[10px] font-mono text-[#f23f43] font-bold flex items-center gap-0.5 ml-2" title="Pesan ini akan hancur otomatis">
              💣 {timeLeft}s
            </span>
          )}
          {isMine && (
            <span className="ml-1 text-muted-foreground flex items-center">
              {readBy?.length > 0 ? (
                <IconChecks className="w-3.5 h-3.5 text-[#00a8fc]" stroke={2} title="Dibaca" />
              ) : (
                <IconCheck className="w-3.5 h-3.5" stroke={2} title="Terkirim" />
              )}
            </span>
          )}
        </div>
        
        {/* Render Reply Preview above message if it exists */}
        {repliedMessage && (
          <div className={cn("flex items-center gap-1.5 mb-1 text-xs text-muted-foreground opacity-80 cursor-pointer hover:opacity-100 transition-opacity", isMine && "flex-row-reverse")}>
            <IconArrowBackUp className="w-3.5 h-3.5 shrink-0" />
            <span className="font-semibold">{repliedMessage.fromEmail === useChatStore.getState().user?.email ? 'Kamu' : (repliedMessage.fromEmail || 'Partner')}</span>
            <span className="truncate max-w-[150px] italic">
              {repliedMessage.text}
            </span>
          </div>
        )}

        <div className={cn("relative flex gap-2 max-w-[85%]", isMine && "flex-row-reverse")}>
          <div
            className={cn(
              'text-sm text-foreground leading-relaxed break-words',
              isMine ? 'bg-[#5865f2] text-white px-3 py-2 rounded-2xl rounded-tr-sm' : 'bg-secondary px-3 py-2 rounded-2xl rounded-tl-sm'
            )}
          >
            {text}
          </div>
          
          {/* Action Menu (Reaction & Reply) on Hover */}
          {!error && (onReact || onReply) && (
            <div className={cn(
              "opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-card border border-border rounded-lg px-1 py-0.5 absolute -top-4 z-10 shadow-sm",
              isMine ? "right-2" : "left-2"
            )}>
              {onReply && (
                <button
                  onClick={() => onReply(message)}
                  className="hover:bg-muted rounded p-1 text-sm transition-colors text-muted-foreground hover:text-foreground"
                  title="Balas pesan"
                >
                  <IconArrowBackUp className="w-4 h-4" stroke={2} />
                </button>
              )}
              {onReact && (
                <>
                  <div className="w-px h-4 bg-border mx-0.5" />
                  {EMOJI_OPTIONS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => onReact(id, emoji)}
                      className="hover:bg-muted rounded p-1 text-sm transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Display Reactions */}
        {reactions && Object.keys(reactions).length > 0 && (
          <div className={cn("flex flex-wrap gap-1 mt-1", isMine && "justify-end")}>
            {Object.entries(reactions).map(([emoji, users]) => (
              <div 
                key={emoji} 
                className={cn(
                  "flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] bg-secondary/50 border border-border cursor-pointer",
                  users.includes(displayEmail) && "bg-[#5865f2]/20 border-[#5865f2]/40"
                )}
                onClick={() => onReact && onReact(id, emoji)}
                title={users.join(', ')}
              >
                <span>{emoji}</span>
                <span className="font-semibold">{users.length}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
