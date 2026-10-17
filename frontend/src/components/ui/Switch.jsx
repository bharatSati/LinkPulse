import { cn } from '../../utils/cn.js';

export default function Switch({ checked, onChange, label, description, disabled = false, id }) {
  return (
    <div className="flex items-start justify-between gap-4">
      {(label || description) && (
        <div className="min-w-0">
          {label && (
            <label htmlFor={id} className="block text-sm font-medium text-ink-200">
              {label}
            </label>
          )}
          {description && <p className="mt-0.5 text-xs text-ink-500">{description}</p>}
        </div>
      )}
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center border-2 transition',
          'disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'border-accent-600 bg-accent-500/20' : 'border-base-600 bg-base-850'
        )}
      >
        <span
          className={cn(
            'inline-block h-3.5 w-4 transform transition',
            checked ? 'translate-x-6 bg-accent-500' : 'translate-x-1 bg-ink-500'
          )}
        />
      </button>
    </div>
  );
}
