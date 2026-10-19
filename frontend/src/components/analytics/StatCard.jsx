import { cn } from '../../utils/cn.js';
import Skeleton from '../ui/Skeleton.jsx';

export default function StatCard({ label, value, icon: Icon, hint, change, loading }) {
  if (loading) {
    return (
      <div className="surface-card p-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-7 w-20" />
        <Skeleton className="mt-2 h-3 w-16" />
      </div>
    );
  }

  return (
    <div className="surface-card group interactive-lift p-5 hover:border-accent-600">
      <div className="flex items-center justify-between">
        <p className="text-xs text-ink-500">{label}</p>
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-base-800 text-accent-400 ring-1 ring-base-700 transition group-hover:-translate-y-0.5 group-hover:ring-accent-600">
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p key={value} className="mt-3 animate-pop-in text-2xl font-semibold tracking-tight text-ink-100">
        {value}
      </p>
      {change != null ? (
        <p
          className={cn(
            'mt-1 text-xs',
            change >= 0 ? 'text-accent-400' : 'text-danger-400'
          )}
        >
          {change >= 0 ? '▲' : '▼'} {Math.abs(change)}% vs previous period
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>
      )}
    </div>
  );
}
