import { forwardRef, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../utils/cn.js';

const Input = forwardRef(function Input(
  { label, error, hint, icon: Icon, className, type = 'text', id, ...props },
  ref
) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [revealed, setRevealed] = useState(false);

  const isPassword = type === 'password';
  const resolvedType = isPassword && revealed ? 'text' : type;

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={inputId} className="field-label">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
        )}
        <input
          ref={ref}
          id={inputId}
          type={resolvedType}
          className={cn(
            'h-11 w-full rounded-xl border bg-base-850 px-3 text-sm text-ink-100 placeholder:text-ink-500',
            'transition focus:outline-none focus:ring-2 focus:ring-accent-500/40',
            'disabled:cursor-not-allowed disabled:opacity-60',
            Icon && 'pl-9',
            isPassword && 'pr-10',
            error ? 'border-danger-500/60' : 'border-base-600 focus:border-accent-600'
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((value) => !value)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 transition hover:text-ink-200"
            aria-label={revealed ? 'Hide password' : 'Show password'}
          >
            {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs text-danger-400">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-ink-500">{hint}</p>
      )}
    </div>
  );
});

export default Input;
