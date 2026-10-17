import { cn } from '../../utils/cn.js';

const TONES = {
  neutral: 'border-base-600 bg-base-800 text-ink-300',
  accent: 'border-accent-600/40 bg-accent-500/10 text-accent-300',
  warn: 'border-warn-500/40 bg-warn-500/10 text-warn-400',
  danger: 'border-danger-500/40 bg-danger-500/10 text-danger-400',
};

export default function Badge({ children, tone = 'neutral', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
