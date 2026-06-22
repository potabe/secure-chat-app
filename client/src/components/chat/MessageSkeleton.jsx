/**
 * MessageSkeleton.jsx — Shimmer loading skeleton for chat history
 */
import { motion } from 'framer-motion';

function SkeletonBubble({ isMine, width, delay = 0 }) {
  return (
    <motion.div
      className={`flex items-start gap-3 px-4 py-2 ${isMine ? 'flex-row-reverse' : ''}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      {!isMine && (
        <div className="w-9 h-9 rounded-full skeleton-shimmer shrink-0" />
      )}
      <div className={`flex flex-col gap-1.5 ${isMine ? 'items-end' : 'items-start'}`}>
        {/* Name & timestamp */}
        <div className="flex items-center gap-2">
          <div className="h-3 w-20 rounded skeleton-shimmer" />
          <div className="h-2.5 w-10 rounded skeleton-shimmer opacity-60" />
        </div>
        {/* Message bubble */}
        <div
          className="h-9 rounded-2xl skeleton-shimmer"
          style={{ width }}
        />
      </div>
    </motion.div>
  );
}

export default function MessageSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto py-4 space-y-1">
      <SkeletonBubble isMine={false} width="180px" delay={0} />
      <SkeletonBubble isMine={true}  width="220px" delay={0.05} />
      <SkeletonBubble isMine={false} width="140px" delay={0.1} />
      <SkeletonBubble isMine={false} width="260px" delay={0.15} />
      <SkeletonBubble isMine={true}  width="160px" delay={0.2} />
      <SkeletonBubble isMine={true}  width="200px" delay={0.25} />
      <SkeletonBubble isMine={false} width="120px" delay={0.3} />
    </div>
  );
}
