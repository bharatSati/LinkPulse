import { cn } from '../../utils/cn.js';

export default function Card({ children, className, interactive = false, ...props }) {
  return (
    <div
      className={cn(
        'surface-card p-5',
        interactive && 'interactive-lift hover:border-accent-600',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, description, action, className }) {
  return (
    <div className={cn('mb-4 flex items-start justify-between gap-4', className)}>
      <div>
        <h3 className="text-sm font-semibold text-ink-100">{title}</h3>
        {description && <p className="mt-1 text-xs text-ink-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}
