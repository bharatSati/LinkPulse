import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import Logo from './ui/Logo.jsx';
import { NAV_SECTIONS } from '../config/navigation.js';
import { cn } from '../utils/cn.js';

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 animate-fade-in bg-base-950/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-base-800 bg-base-900 transition-transform duration-200 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-base-800 px-5">
          <Logo />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-ink-400 transition hover:bg-base-800 hover:text-ink-100 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                {section.label}
              </p>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition',
                          isActive
                            ? 'bg-accent-500/12 text-accent-300 ring-1 ring-inset ring-accent-600/30'
                            : 'text-ink-300 hover:bg-base-800 hover:text-ink-100'
                        )
                      }
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.name}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-base-800 p-4">
          <div className="rounded-xl bg-base-850 p-3 ring-1 ring-base-700">
            <p className="text-xs font-medium text-ink-200">Foundation release</p>
            <p className="mt-1 text-xs text-ink-500">
              Authentication and workspaces are live. Feature modules arrive next.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
