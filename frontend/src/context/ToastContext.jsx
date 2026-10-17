import { createContext, useCallback, useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

const STYLES = {
  success: 'border-accent-600/40 text-accent-300',
  error: 'border-danger-500/40 text-danger-400',
  info: 'border-base-600 text-ink-200',
};

let counter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (type, message) => {
      counter += 1;
      const id = counter;
      setToasts((current) => [...current, { id, type, message }]);
      window.setTimeout(() => remove(id), 4500);
    },
    [remove]
  );

  const toast = useMemo(
    () => ({
      success: (message) => push('success', message),
      error: (message) => push('error', message),
      info: (message) => push('info', message),
    }),
    [push]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:left-auto sm:right-4 sm:items-end">
        {toasts.map(({ id, type, message }) => {
          const Icon = ICONS[type] || Info;
          return (
            <div
              key={id}
              role="status"
              className={`pointer-events-auto flex w-full max-w-sm animate-slide-in-right items-start gap-3 rounded-xl border bg-base-850/95 px-4 py-3 shadow-panel backdrop-blur ${STYLES[type]}`}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="flex-1 text-sm text-ink-100">{message}</p>
              <button
                type="button"
                onClick={() => remove(id)}
                className="rounded p-0.5 text-ink-400 transition hover:text-ink-100"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
