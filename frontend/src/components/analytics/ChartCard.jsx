import Card from '../ui/Card.jsx';
import Skeleton from '../ui/Skeleton.jsx';
import { cn } from '../../utils/cn.js';

export default function ChartCard({
  title,
  description,
  action,
  loading,
  empty,
  emptyMessage = 'No data for this period.',
  children,
  className,
  bodyClassName,
}) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink-100">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-ink-500">{description}</p>}
        </div>
        {action}
      </div>

      <div className={cn('flex-1', bodyClassName)}>
        {loading ? (
          <Skeleton className="h-48 w-full" />
        ) : empty ? (
          <div className="flex h-48 items-center justify-center px-4 text-center text-sm text-ink-500">
            {emptyMessage}
          </div>
        ) : (
          children
        )}
      </div>
    </Card>
  );
}
