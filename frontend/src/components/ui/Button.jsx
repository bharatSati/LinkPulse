import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn.js';

const VARIANTS = {
  primary:
    'border-accent-400 bg-accent-gradient text-base-950 hover:brightness-110 active:brightness-95 font-semibold shadow-glow',
  secondary:
    'bg-base-800 text-ink-100 hover:bg-base-700 border-base-600',
  outline:
    'border-base-600 text-ink-200 hover:border-accent-600 hover:text-accent-300',
  ghost: 'border-transparent text-ink-300 hover:bg-base-800 hover:text-ink-100',
  danger: 'border-danger-500 bg-danger-600 text-white hover:bg-danger-500',
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
        'inline-flex select-none items-center justify-center gap-2 rounded-none border-2 font-medium uppercase tracking-wider transition duration-100',
        'active:translate-x-0.5 active:translate-y-0.5 active:shadow-none',
        'disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 disabled:border-base-600 disabled:bg-base-800 disabled:bg-none disabled:text-ink-500 disabled:shadow-none disabled:brightness-100',
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
