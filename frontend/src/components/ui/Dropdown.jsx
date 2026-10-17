import { cloneElement, useEffect, useRef, useState } from 'react';
import { cn } from '../../utils/cn.js';

export default function Dropdown({ trigger, children, align = 'right', className }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function onPointerDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const triggerNode = cloneElement(trigger, {
    onClick: (event) => {
      trigger.props.onClick?.(event);
      setOpen((value) => !value);
    },
    'aria-expanded': open,
    'aria-haspopup': 'menu',
  });

  return (
    <div ref={containerRef} className="relative inline-block">
      {triggerNode}
      {open && (
        <div
          role="menu"
          className={cn(
            'absolute z-50 mt-2 min-w-[12rem] animate-slide-up overflow-hidden rounded-xl border border-base-700 bg-base-850 p-1 shadow-panel',
            align === 'right' ? 'right-0' : 'left-0',
            className
          )}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({ children, icon: Icon, danger = false, className, ...props }) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition',
        danger
          ? 'text-danger-400 hover:bg-danger-500/10'
          : 'text-ink-200 hover:bg-base-750 hover:text-ink-100',
        className
      )}
      {...props}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}

export function DropdownDivider() {
  return <div className="my-1 h-px bg-base-700" />;
}
