import { cn } from '../../utils/cn.js';

const PRESETS = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
];

const inputClass =
  'bg-transparent text-xs text-ink-200 outline-none [color-scheme:dark] focus:text-ink-100';

export default function DateRangeFilter({ preset, custom, onPresetChange, onCustomChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-xl border border-base-700 bg-base-900/60 p-0.5">
        {PRESETS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onPresetChange(option.value)}
            className={cn(
              'rounded-[10px] px-3 py-1.5 text-xs font-medium transition',
              preset === option.value
                ? 'bg-accent-500 text-base-950'
                : 'text-ink-300 hover:text-ink-100'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div
        className={cn(
          'flex items-center gap-2 rounded-xl border px-2.5 py-1.5 transition',
          preset === 'custom' ? 'border-accent-600/50 bg-base-900/60' : 'border-base-700'
        )}
      >
        <input
          type="date"
          aria-label="From date"
          value={custom.from}
          max={custom.to || undefined}
          onChange={(event) => onCustomChange({ ...custom, from: event.target.value })}
          className={inputClass}
        />
        <span className="text-ink-600">–</span>
        <input
          type="date"
          aria-label="To date"
          value={custom.to}
          min={custom.from || undefined}
          onChange={(event) => onCustomChange({ ...custom, to: event.target.value })}
          className={inputClass}
        />
      </div>
    </div>
  );
}
