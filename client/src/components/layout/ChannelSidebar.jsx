/**
 * ChannelSidebar.jsx — Room list sidebar (Discord channel list style)
 */
import { useState } from 'react';
import { IconPlus, IconHash, IconLock, IconX, IconClock, IconHeartBroken } from '@tabler/icons-react';
import useChatStore from '../../store/chatStore';
import { cn } from '../../lib/cn';

const statusIcon = {
  waiting:      { icon: IconClock,      color: '#f0b132' },
  handshaking:  { icon: IconClock,      color: '#00a8fc' },
  secured:      { icon: IconLock,       color: '#23a559' },
  'partner-left': { icon: IconHeartBroken, color: '#f23f43' },
  error:        { icon: IconHeartBroken, color: '#f23f43' },
};

function RoomItem({ room, isActive, onSelect, onLeave, collapsed }) {
  const [hovered, setHovered] = useState(false);
  const { icon: StatusIcon, color } = statusIcon[room.status] || statusIcon.waiting;

  return (
    <div
      className={cn('channel-item group relative', isActive && 'active')}
      onClick={() => onSelect(room.roomId)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={collapsed ? room.roomId : undefined}
    >
      {/* Room name */}
      <IconHash className="w-4 h-4 shrink-0" style={{ color: "var(--muted-foreground)" }} stroke={2} />
      {!collapsed && <span className="flex-1 truncate">{room.roomId}</span>}

      {/* Conditional Right Action Area — only show when not collapsed */}
      {!collapsed && (
        <div className="flex items-center gap-1.5 shrink-0 ml-1">
          {!isActive && room.unread > 0 && (
            <span
              className="min-w-[18px] h-[18px] rounded-full bg-[#f23f43] text-white text-[10px] font-bold flex items-center justify-center px-1"
            >
              {room.unread > 9 ? '9+' : room.unread}
            </span>
          )}
          
          <StatusIcon 
            className="w-3.5 h-3.5 block md:group-hover:hidden" 
            style={{ color }} 
            stroke={2} 
          />

          <button
            onClick={(e) => { e.stopPropagation(); onLeave(room.roomId); }}
            className="w-6 h-6 rounded items-center justify-center hover:bg-[#f23f43]/20 transition-colors shrink-0 flex md:hidden md:group-hover:flex"
            title="Keluar dari room"
          >
            <IconX className="w-3 h-3 text-muted-foreground hover:text-[#f23f43]" stroke={2} />
          </button>
        </div>
      )}

      {/* Collapsed mode: unread dot only */}
      {collapsed && !isActive && room.unread > 0 && (
        <div
          className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#f23f43]"
        />
      )}
    </div>
  );
}

export default function ChannelSidebar({ onJoinRoom, onLeaveRoom, width = 240 }) {
  const roomsMap = useChatStore((s) => s.rooms);
  const rooms = Object.values(roomsMap);
  const activeRoomId = useChatStore((s) => s.activeRoomId);
  const setActiveRoom = useChatStore((s) => s.setActiveRoom);
  const user = useChatStore((s) => s.user);

  // Collapse room names below a threshold
  const collapsed = width < 180;

  return (
    <div
      className="flex flex-col h-full bg-card border-r border-border mobile-full-width"
      style={{ width, minWidth: width, overflow: 'hidden' }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border shadow-sm bg-card">
        {collapsed ? (
          <div className="flex flex-col items-center gap-1">
            <div
              className="w-7 h-7 rounded-full bg-[#5865f2]/20 flex items-center justify-center text-[#5865f2] font-bold text-xs"
            >
              {user?.email?.[0]?.toUpperCase() || '?'}
            </div>
          </div>
        ) : (
          <>
            <div className="font-semibold text-foreground text-sm truncate">{user?.email}</div>
            <div className="text-xs text-[#23a559] font-medium flex items-center gap-1 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-[#23a559] animate-pulse-dot" />
              Online
            </div>
          </>
        )}
      </div>

      {/* Rooms section */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* Section header */}
        <div className="flex items-center justify-between px-3 mb-1">
          {!collapsed && (
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Rooms ({rooms.length})
            </span>
          )}
          <button
            onClick={onJoinRoom}
            className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors ml-auto"
            title="Join / Buat Room"
          >
            <IconPlus className="w-4 h-4" stroke={2} />
          </button>
        </div>

        {/* Room list */}
        <div className="px-2 space-y-0.5">
          {rooms.length === 0 ? (
            <div className="text-center py-6 px-2">
              <IconHash className="w-8 h-8 text-muted-foreground mx-auto mb-2" stroke={2} />
              {!collapsed && (
                <>
                  <p className="text-xs text-muted-foreground">Belum ada room</p>
                  <p className="text-xs text-muted-foreground mt-1">Klik + untuk bergabung</p>
                </>
              )}
            </div>
          ) : (
            rooms.map((room) => (
              <RoomItem
                key={room.roomId}
                room={room}
                isActive={activeRoomId === room.roomId}
                onSelect={setActiveRoom}
                onLeave={onLeaveRoom}
                collapsed={collapsed}
              />
            ))
          )}
        </div>
      </div>

      {/* Bottom: Join room button */}
      <div className="p-3 border-t border-border">
        {collapsed ? (
          <button
            onClick={onJoinRoom}
            className="w-full flex items-center justify-center py-2 rounded-lg bg-[#5865f2]/20 hover:bg-[#5865f2]/30 border border-[#5865f2]/30 transition-all"
            title="Join Room"
          >
            <IconPlus className="w-4 h-4 text-[#5865f2]" stroke={2} />
          </button>
        ) : (
          <button
            onClick={onJoinRoom}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2 rounded-lg',
              'text-sm font-semibold text-foreground',
              'bg-[#5865f2]/20 hover:bg-[#5865f2]/30 border border-[#5865f2]/30',
              'transition-all duration-200'
            )}
          >
            <IconPlus className="w-4 h-4" stroke={2} />
            Join Room
          </button>
        )}
      </div>
    </div>
  );
}
