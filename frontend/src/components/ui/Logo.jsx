import { Activity } from 'lucide-react';
import { cn } from '../../utils/cn.js';

export default function Logo({ className, showText = true }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="relative flex h-9 w-9 items-center justify-center border-2 border-accent-500 bg-base-850 shadow-glow">
        <Activity className="h-5 w-5 text-accent-400" />
        <span className="absolute -right-1 -top-1 h-1.5 w-1.5 bg-citrus-400" />
      </span>
      {showText && (
        <span className="font-display text-base font-semibold tracking-tight text-ink-100">
          Link<span className="text-gradient">Pulse</span>
          <span className="animate-blink text-accent-500">_</span>
        </span>
      )}
    </div>
  );
}
