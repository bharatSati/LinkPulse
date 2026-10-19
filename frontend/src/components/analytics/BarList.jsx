import { formatNumber } from '../../utils/format.js';

export default function BarList({ items, emptyMessage = 'No data for this period.' }) {
  if (!items || items.length === 0) {
    return <p className="py-10 text-center text-sm text-ink-500">{emptyMessage}</p>;
  }

  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-xs">
            <span className="truncate text-ink-300">{item.label}</span>
            <span className="shrink-0 text-ink-500">
              {formatNumber(item.value)}
              {item.percentage != null && ` · ${item.percentage}%`}
            </span>
          </div>
          <div className="h-2 overflow-hidden border border-base-700 bg-base-800">
            <div
              className="h-full origin-left animate-bar-grow bg-accent-500"
              style={{ width: `${Math.max((item.value / max) * 100, 3)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
