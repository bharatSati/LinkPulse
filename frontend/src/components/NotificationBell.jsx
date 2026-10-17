import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notification.service.js';
import { useWorkspace } from '../hooks/useWorkspace.js';
import { cn } from '../utils/cn.js';

const POLL_MS = 60000;

const TYPE_TONES = {
  security_event: 'text-danger-400',
  abuse_report: 'text-warn-400',
  link_disabled: 'text-warn-400',
  anomaly: 'text-accent-300',
  invitation: 'text-accent-300',
  member_event: 'text-ink-300',
  campaign_event: 'text-ink-300',
  link_event: 'text-ink-300',
  system: 'text-ink-300',
};

function relativeTime(value) {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default function NotificationBell() {
  const { activeWorkspaceId } = useWorkspace();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const containerRef = useRef(null);

  const refreshCount = useCallback(async () => {
    try {
      const count = await getUnreadCount(activeWorkspaceId || undefined);
      setUnread(count);
    } catch {
      /* silent: the bell should never break the shell */
    }
  }, [activeWorkspaceId]);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listNotifications({
        workspaceId: activeWorkspaceId || undefined,
        limit: 15,
      });
      setNotifications(data.notifications || []);
      setUnread(data.unread || 0);
    } catch (err) {
      setError(err.message || 'Unable to load notifications');
    } finally {
      setLoading(false);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    refreshCount();
    const timer = setInterval(refreshCount, POLL_MS);
    return () => clearInterval(timer);
  }, [refreshCount]);

  useEffect(() => {
    function onPointerDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) await loadList();
  }

  async function handleOpenNotification(notification) {
    if (!notification.isRead) {
      try {
        await markNotificationRead(notification.id);
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item
          )
        );
        setUnread((current) => Math.max(current - 1, 0));
      } catch {
        /* ignore */
      }
    }

    if (notification.targetUrl) {
      setOpen(false);
      navigate(notification.targetUrl);
    }
  }

  async function handleMarkAll() {
    try {
      await markAllNotificationsRead(activeWorkspaceId || undefined);
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnread(0);
    } catch {
      /* ignore */
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        className="relative rounded-lg p-2 text-ink-300 transition hover:bg-base-800 hover:text-ink-100"
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-none bg-danger-500 px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-80 animate-slide-up overflow-hidden rounded-xl border border-base-700 bg-base-850 shadow-panel"
        >
          <div className="flex items-center justify-between border-b border-base-700 px-4 py-3">
            <p className="text-sm font-semibold text-ink-100">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="inline-flex items-center gap-1 text-xs text-accent-300 hover:text-accent-200"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-ink-500">Loading…</p>
            ) : error ? (
              <p className="px-4 py-6 text-center text-sm text-danger-400">{error}</p>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <Inbox className="h-6 w-6 text-ink-500" />
                <p className="text-sm text-ink-400">You're all caught up</p>
              </div>
            ) : (
              <ul className="divide-y divide-base-800">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => handleOpenNotification(notification)}
                      className={cn(
                        'flex w-full flex-col gap-1 px-4 py-3 text-left transition hover:bg-base-800',
                        !notification.isRead && 'bg-accent-500/5'
                      )}
                    >
                      <span className="flex items-center gap-2">
                        {!notification.isRead && (
                          <span className="h-1.5 w-1.5 rounded-none bg-accent-400" />
                        )}
                        <span
                          className={cn(
                            'truncate text-sm font-medium',
                            TYPE_TONES[notification.type] || 'text-ink-200'
                          )}
                        >
                          {notification.title}
                        </span>
                        <span className="ml-auto shrink-0 text-[11px] text-ink-500">
                          {relativeTime(notification.createdAt)}
                        </span>
                      </span>
                      {notification.message && (
                        <span className="line-clamp-2 text-xs text-ink-400">
                          {notification.message}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
