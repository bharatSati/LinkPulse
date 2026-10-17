import { Activity } from 'lucide-react';
import { cn } from '../../utils/cn.js';

export default function Logo({ className, showText = true }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-500/15 ring-1 ring-accent-600/40">
        <Activity className="h-5 w-5 text-accent-500" />
      </span>
      {showText && (
        <span className="text-lg font-semibold tracking-tight text-ink-100">
          Link<span className="text-accent-500">Pulse</span>
        </span>
      )}
    </div>
  );
}
