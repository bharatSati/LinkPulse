import { Menu, LogOut, Settings, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Dropdown, { DropdownItem, DropdownDivider } from './ui/Dropdown.jsx';
import WorkspaceSwitcher from './WorkspaceSwitcher.jsx';
import NotificationBell from './NotificationBell.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function Topbar({ onOpenSidebar }) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    toast.info('You have been signed out');
    navigate('/login', { replace: true });
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b-2 border-base-800 bg-base-950/90 px-4 lg:px-6">
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-500/50 to-transparent"
        aria-hidden="true"
      />
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="rounded-lg p-2 text-ink-300 transition hover:bg-base-800 hover:text-ink-100 active:scale-95 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <WorkspaceSwitcher />
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />

        <Dropdown
        trigger={
          <button
            type="button"
            className="flex items-center gap-2.5 rounded-none border border-base-700 bg-base-850 py-1.5 pl-1.5 pr-3 transition hover:border-base-600"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-none bg-accent-500/15 text-xs font-semibold text-accent-300">
              {initials(user?.name) || <UserRound className="h-4 w-4" />}
            </span>
            <span className="hidden max-w-[10rem] truncate text-sm text-ink-200 sm:block">
              {user?.email}
            </span>
          </button>
        }
      >
        <div className="px-3 py-2">
          <p className="truncate text-sm font-medium text-ink-100">{user?.name}</p>
          <p className="truncate text-xs text-ink-500">{user?.email}</p>
        </div>
        <DropdownDivider />
        <DropdownItem icon={Settings} onClick={() => navigate('/app/settings')}>
          Settings
        </DropdownItem>
        <DropdownItem icon={LogOut} danger onClick={handleLogout}>
          Sign out
        </DropdownItem>
        </Dropdown>
      </div>
    </header>
  );
}
