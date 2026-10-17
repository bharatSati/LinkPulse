import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn.js';

const Select = forwardRef(function Select(
  { label, error, hint, options = [], className, id, children, ...props },
  ref
) {
  const generatedId = useId();
  const selectId = id || generatedId;

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={selectId} className="field-label">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'h-11 w-full appearance-none rounded-none border-2 bg-base-850 px-3 pr-9 text-sm text-ink-100',
            'transition focus:outline-none focus:ring-2 focus:ring-accent-500/40',
            error ? 'border-danger-500/60' : 'border-base-600 focus:border-accent-600'
          )}
          {...props}
        >
          {children ||
            options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-danger-400">{error}</p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-ink-500">{hint}</p>
      )}
    </div>
  );
});

export default Select;
