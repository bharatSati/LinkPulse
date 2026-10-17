import { Copy, MousePointerClick, CalendarClock } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import LinkActions from './LinkActions.jsx';
import { linkDisplayStatus, resolveShortUrl } from '../../utils/linkDisplay.js';
import { formatDate, formatNumber, truncate } from '../../utils/format.js';

export default function LinkCard({
  link,
  onEdit,
  onToggle,
  onDelete,
  onCopy,
  onViewAnalytics,
  busy,
}) {
  const status = linkDisplayStatus(link);
  const shortUrl = resolveShortUrl(link);

  return (
    <div className="surface-card space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-ink-100">
            {link.title || 'Untitled link'}
          </p>
          <p className="mt-0.5 truncate text-xs text-ink-500" title={link.originalUrl}>
            {truncate(link.originalUrl, 44)}
          </p>
        </div>
        <LinkActions
          link={link}
          busy={busy}
          onEdit={onEdit}
          onToggle={onToggle}
          onDelete={onDelete}
          onCopy={onCopy}
          onViewAnalytics={onViewAnalytics}
        />
      </div>

      <div className="flex items-center gap-2">
        <a
          href={shortUrl}
          target="_blank"
          rel="noreferrer"
          className="min-w-0 flex-1 truncate font-mono text-xs text-accent-400"
        >
          {shortUrl}
        </a>
        <button
          type="button"
          onClick={() => onCopy(link)}
          className="rounded-lg border border-base-700 p-1.5 text-ink-400 transition hover:text-ink-100"
          aria-label="Copy short link"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-400">
        <Badge tone={status.tone}>{status.label}</Badge>
        <span className="inline-flex items-center gap-1.5">
          <MousePointerClick className="h-3.5 w-3.5" />
          {formatNumber(link.clickCount)}
          {link.clickLimit != null && ` / ${formatNumber(link.clickLimit)}`}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarClock className="h-3.5 w-3.5" />
          {link.expiresAt ? formatDate(link.expiresAt) : formatDate(link.createdAt)}
        </span>
      </div>
    </div>
  );
}
