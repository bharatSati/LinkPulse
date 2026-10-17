import { Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn.js';

export default function AiMark({ label = 'AI interpretation', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-none border border-accent-600/40 bg-accent-500/10 px-2.5 py-0.5 text-[11px] font-medium text-accent-300',
        className
      )}
    >
      <Sparkles className="h-3 w-3" />
      {label}
    </span>
  );
}
