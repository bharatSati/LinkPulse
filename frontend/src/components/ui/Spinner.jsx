import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn.js';

export default function Spinner({ className, label }) {
  return (
    <span className="inline-flex items-center gap-2 text-ink-300" role="status">
      <Loader2 className={cn('h-5 w-5 animate-spin text-accent-500', className)} />
      {label && <span className="text-sm">{label}</span>}
      <span className="sr-only">Loading</span>
    </span>
  );
}
