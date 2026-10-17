import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn.js';

const VARIANTS = {
  primary:
    'bg-accent-500 text-base-950 hover:bg-accent-400 active:bg-accent-600 font-semibold shadow-glow',
  secondary:
    'bg-base-800 text-ink-100 hover:bg-base-700 border border-base-600',
  outline:
    'border border-base-600 text-ink-200 hover:border-accent-600 hover:text-accent-300',
  ghost: 'text-ink-300 hover:bg-base-800 hover:text-ink-100',
  danger: 'bg-danger-500 text-white hover:bg-danger-600',
};

const SIZES = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    icon: Icon,
    iconRight: IconRight,
    className,
    disabled,
    type = 'button',
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex select-none items-center justify-center gap-2 rounded-xl font-medium transition duration-150',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        Icon && <Icon className="h-4 w-4" />
      )}
      {children}
      {IconRight && !loading && <IconRight className="h-4 w-4" />}
    </button>
  );
});

export default Button;
