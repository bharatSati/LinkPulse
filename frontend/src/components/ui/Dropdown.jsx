import { cloneElement, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn.js';

export default function Dropdown({ trigger, children, align = 'right', className }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef(null);
  const menuRef = useRef(null);

  const updatePosition = useCallback(() => {
    const triggerEl = containerRef.current;
    if (!triggerEl) return;

    const rect = triggerEl.getBoundingClientRect();
    const menuEl = menuRef.current;
    const menuWidth = menuEl?.offsetWidth ?? 192;
    const menuHeight = menuEl?.offsetHeight ?? 0;
    const gap = 8;
    const margin = 8;

    let left = align === 'right' ? rect.right - menuWidth : rect.left;
    left = Math.min(Math.max(margin, left), Math.max(margin, window.innerWidth - menuWidth - margin));

    let top = rect.bottom + gap;
    if (menuHeight && top + menuHeight > window.innerHeight - margin) {
      const above = rect.top - gap - menuHeight;
      top = above >= margin ? above : Math.max(margin, window.innerHeight - menuHeight - margin);
    }

    setPosition({ top, left });
  }, [align]);

  useLayoutEffect(() => {
    if (open) updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return undefined;

    function onPointerDown(event) {
      const inTrigger = containerRef.current?.contains(event.target);
      const inMenu = menuRef.current?.contains(event.target);
      if (!inTrigger && !inMenu) setOpen(false);
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, updatePosition]);

  const triggerNode = cloneElement(trigger, {
    onClick: (event) => {
      trigger.props.onClick?.(event);
      setOpen((value) => !value);
    },
    'aria-expanded': open,
    'aria-haspopup': 'menu',
  });

  return (
    <>
      <div ref={containerRef} className="relative inline-block">
        {triggerNode}
      </div>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ position: 'fixed', top: position.top, left: position.left }}
            className={cn(
              'z-50 min-w-[12rem] animate-slide-up overflow-hidden rounded-xl border border-base-700 bg-base-850 p-1 shadow-panel',
              className
            )}
            onClick={() => setOpen(false)}
          >
            {children}
          </div>,
          document.body
        )}
    </>
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
