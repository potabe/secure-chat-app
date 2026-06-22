/**
 * CryptoLogPanel.jsx — Per-room collapsible crypto log console
 */
import { useState } from 'react';
import { IconChevronDown, IconChevronRight, IconX, IconTerminal2, IconCopy, IconCheck } from '@tabler/icons-react';
import { cn } from '../../lib/cn';

const categoryConfig = {
  ecdh:   { label: '🔑 ECDH Key',        colorClass: 'log-ecdh',   textColor: '#5865f2' },
  hkdf:   { label: '🔗 HKDF Derive',     colorClass: 'log-hkdf',   textColor: '#9b59b6' },
  enc:    { label: '🔒 AES-GCM Encrypt', colorClass: 'log-enc',    textColor: '#23a559' },
  dec:    { label: '🔓 AES-GCM Decrypt', colorClass: 'log-dec',    textColor: '#00a8fc' },
  status: { label: '📡 Status',          colorClass: 'log-status', textColor: '#f0b132' },
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      className="text-muted-foreground hover:text-foreground transition-colors"
      title="Salin"
    >
      {copied ? <IconCheck className="w-3.5 h-3.5 text-[#23a559]" stroke={2} /> : <IconCopy className="w-3.5 h-3.5" stroke={2} />}
    </button>
  );
}

function LogEntry({ entry }) {
  const [expanded, setExpanded] = useState(true);
  const config = categoryConfig[entry.category] || categoryConfig.status;

  return (
    <div
      className={cn(
        'bg-secondary rounded-lg mb-2 overflow-hidden',
        config.colorClass,
        'animate-fade-in'
      )}
    >
      {/* Entry header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors text-left"
      >
        {expanded
          ? <IconChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          : <IconChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        }
        <span className="text-xs font-semibold" style={{ color: config.textColor }}>
          {config.label}
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground font-mono">{entry.timestamp}</span>
      </button>

      {/* Entry fields */}
      {expanded && (
        <div className="px-3 pb-3 space-y-1.5">
          {entry.fields?.map((field, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                  {field.label}
                </span>
                {field.copyable && <CopyButton text={field.value} />}
              </div>
              <p className="font-mono-hex">{field.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CryptoLogPanel({ isOpen, onClose, cryptoLog, roomId }) {
  if (!isOpen) return null;

  return (
    <div
      className="flex flex-col h-full border-l border-border animate-slide-in-right absolute inset-0 z-50 md:relative md:inset-auto md:z-auto !w-full md:!w-[300px]"
      style={{ background: "var(--secondary)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <IconTerminal2 className="w-5 h-5 text-muted-foreground" stroke={2} />
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Crypto Log</p>
          <p className="text-[10px] text-muted-foreground">#{roomId}</p>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <IconX className="w-3.5 h-3.5" stroke={2} />
        </button>
      </div>

      {/* Legend */}
      <div className="px-3 py-2 border-b border-border flex flex-wrap gap-2">
        {Object.entries(categoryConfig).map(([key, cfg]) => (
          <span key={key} className="text-[9px] font-semibold" style={{ color: cfg.textColor }}>
            {cfg.label.split(' ')[0]}
          </span>
        ))}
      </div>

      {/* Log entries */}
      <div className="flex-1 overflow-y-auto p-3">
        {cryptoLog.length === 0 ? (
          <div className="text-center py-8">
            <IconTerminal2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" stroke={2} />
            <p className="text-xs text-muted-foreground">Log kriptografi akan muncul</p>
            <p className="text-xs text-muted-foreground">saat sesi berlangsung</p>
          </div>
        ) : (
          [...cryptoLog].reverse().map((entry) => (
            <LogEntry key={entry.id} entry={entry} />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-border">
        <p className="text-[9px] text-muted-foreground text-center">
          {cryptoLog.length} entri log · Server tidak melihat data ini
        </p>
      </div>
    </div>
  );
}
