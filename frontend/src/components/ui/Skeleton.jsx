import { cn } from '../../utils/cn.js';

export default function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-lg bg-base-800', className)} />;
}
