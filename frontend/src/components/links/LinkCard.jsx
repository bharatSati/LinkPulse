import { Copy, MousePointerClick, CalendarClock, Megaphone, Tag as TagIcon } from 'lucide-react';
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
  onViewCampaign,
  onShowQr,
  busy,
}) {
  const status = linkDisplayStatus(link);
  const shortUrl = resolveShortUrl(link);

  return (
    <div className="surface-card interactive-lift space-y-3 p-4 hover:border-accent-600">
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
          onViewCampaign={onViewCampaign}
          onShowQr={onShowQr}
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

      {(link.campaign?.id || link.tags?.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 border-t border-base-800 pt-3">
          {link.campaign?.id && (
            <button
              type="button"
              onClick={() => onViewCampaign?.(link)}
              className="inline-flex max-w-full items-center gap-1.5 truncate rounded-none border border-accent-600/40 bg-accent-500/10 px-2.5 py-0.5 text-[11px] text-accent-300 transition hover:bg-accent-500/20"
              title={link.campaign.name}
            >
              <Megaphone className="h-3 w-3 shrink-0" />
              <span className="truncate">{link.campaign.name}</span>
            </button>
          )}
          {link.tags?.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 rounded-none border border-base-600 bg-base-800 px-2 py-0.5 text-[11px] text-ink-300"
            >
              <TagIcon className="h-2.5 w-2.5 text-accent-400" />
              {tag.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
