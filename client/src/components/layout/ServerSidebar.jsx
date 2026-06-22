/**
 * ServerSidebar.jsx — Leftmost icon bar (Discord server list style)
 */
import { useState } from 'react';
import { IconShield, IconLogout, IconSun, IconMoon, IconEdit, IconCheck, IconLoader2 } from '@tabler/icons-react';
import useChatStore from '../../store/chatStore';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useTheme } from 'next-themes';
import { updateProfile } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { cn } from '../../lib/cn';

export default function ServerSidebar({ onLogout }) {
  const { user, setUser } = useChatStore();
  const { theme, setTheme } = useTheme();

  const [editNameOpen, setEditNameOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [loadingName, setLoadingName] = useState(false);

  const displayName = user?.displayName || user?.email?.split('@')[0] || '?';
  const initial = displayName[0]?.toUpperCase() || '?';

  const handleSaveName = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoadingName(true);
    try {
      await updateProfile(auth.currentUser, { displayName: newName.trim() });
      // Update local zustand state
      setUser({ ...user, displayName: newName.trim() });
      setEditNameOpen(false);
    } catch (err) {
      console.error('Failed to update name', err);
    }
    setLoadingName(false);
  };

  return (
    <div
      className="flex flex-col items-center py-3 gap-2 w-[72px] min-w-[72px] bg-secondary border-r border-border shrink-0"
    >
      {/* App Logo */}
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <div className="server-icon mb-1 bg-primary text-primary-foreground">
            <IconShield className="w-6 h-6" stroke={2} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-popover text-popover-foreground font-semibold px-3 py-1.5 ml-2">
          <p>SecureChat</p>
        </TooltipContent>
      </Tooltip>

      {/* Separator */}
      <div className="w-8 h-px bg-border my-1" />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Theme Toggle */}
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="server-icon bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {theme === 'dark' ? <IconSun className="w-5 h-5" stroke={2} /> : <IconMoon className="w-5 h-5" stroke={2} />}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-popover text-popover-foreground font-semibold px-3 py-1.5 ml-2">
          <p>Ganti Tema</p>
        </TooltipContent>
      </Tooltip>

      {/* User Avatar & Edit Dialog */}
      <Dialog open={editNameOpen} onOpenChange={(open) => {
        setEditNameOpen(open);
        if (open) setNewName(user?.displayName || '');
      }}>
        <Tooltip delayDuration={0}>
          <DialogTrigger asChild>
            <TooltipTrigger asChild>
              <div className="relative group cursor-pointer">
                <div
                  className="server-icon bg-primary text-primary-foreground text-lg font-bold"
                >
                  {initial}
                </div>
                {/* Online dot */}
                <div
                  className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-secondary bg-[#23a559]"
                />
              </div>
            </TooltipTrigger>
          </DialogTrigger>
          <TooltipContent side="right" className="bg-popover text-popover-foreground font-semibold px-3 py-1.5 ml-2">
            <p>{displayName}</p>
            <p className="text-[10px] text-muted-foreground font-normal">Klik untuk ubah nama</p>
          </TooltipContent>
        </Tooltip>

        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Ubah Username</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveName} className="space-y-4 mt-2">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
                maxLength={32}
                className={cn(
                  'w-full bg-input border border-border rounded-lg',
                  'px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground',
                  'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary',
                  'transition-colors'
                )}
                placeholder="Masukkan nama panggilan..."
              />
            </div>
            <button
              type="submit"
              disabled={loadingName || !newName.trim() || newName.trim() === user?.displayName}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3 rounded-lg',
                'bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm',
                'transition-all disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {loadingName ? <IconLoader2 className="w-4 h-4 animate-spin" stroke={2} /> : <IconCheck className="w-4 h-4" stroke={2} />}
              Simpan Perubahan
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Settings / Logout */}
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <button
            onClick={onLogout}
            className="server-icon bg-transparent text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-colors group"
          >
            <IconLogout className="w-5 h-5 group-hover:text-destructive transition-colors" stroke={2} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-popover text-popover-foreground font-semibold px-3 py-1.5 ml-2">
          <p>Keluar</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
