import { Copy, Megaphone, Tag as TagIcon } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import LinkActions from './LinkActions.jsx';
import { linkDisplayStatus, resolveShortUrl } from '../../utils/linkDisplay.js';
import { formatDate, formatNumber, truncate } from '../../utils/format.js';

export default function LinkTable({
  links,
  onEdit,
  onToggle,
  onDelete,
  onCopy,
  onViewAnalytics,
  onViewCampaign,
  onShowQr,
  busyId,
}) {
  return (
    <div className="surface-card hidden overflow-hidden p-0 md:block">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead>
            <tr className="border-b border-base-700 text-xs uppercase tracking-wider text-ink-500">
              <th className="px-5 py-3 font-medium">Link</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Campaign</th>
              <th className="px-4 py-3 font-medium">Tags</th>
              <th className="px-4 py-3 font-medium">Clicks</th>
              <th className="px-4 py-3 font-medium">Expires</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {links.map((link) => {
              const status = linkDisplayStatus(link);
              const shortUrl = resolveShortUrl(link);
              return (
                <tr
                  key={link.id}
                  className="border-b border-base-800/70 transition last:border-0 hover:bg-base-850/60"
                >
                  <td className="max-w-[20rem] px-5 py-4">
                    <p className="truncate font-medium text-ink-100">
                      {link.title || 'Untitled link'}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <a
                        href={shortUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate font-mono text-xs text-accent-400 hover:text-accent-300"
                        title={shortUrl}
                      >
                        {shortUrl}
                      </a>
                      <button
                        type="button"
                        onClick={() => onCopy(link)}
                        className="rounded p-1 text-ink-500 transition hover:bg-base-800 hover:text-ink-200"
                        aria-label="Copy short link"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="mt-1 truncate text-xs text-ink-500" title={link.originalUrl}>
                      {truncate(link.originalUrl, 42)}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col items-start gap-1">
                      <Badge tone={status.tone}>{status.label}</Badge>
                      {link.hasPassword && (
                        <span className="text-[11px] text-ink-500">Password</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {link.campaign?.id ? (
                      <button
                        type="button"
                        onClick={() => onViewCampaign?.(link)}
                        className="inline-flex max-w-[10rem] items-center gap-1.5 truncate text-xs text-ink-300 transition hover:text-accent-300"
                        title={link.campaign.name}
                      >
                        <Megaphone className="h-3.5 w-3.5 shrink-0 text-accent-400" />
                        <span className="truncate">{link.campaign.name}</span>
                      </button>
                    ) : (
                      <span className="text-xs text-ink-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {link.tags?.length ? (
                      <div className="flex max-w-[12rem] flex-wrap gap-1">
                        {link.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center gap-1 rounded-full border border-base-600 bg-base-800 px-2 py-0.5 text-[11px] text-ink-300"
                          >
                            <TagIcon className="h-2.5 w-2.5 text-accent-400" />
                            {tag.name}
                          </span>
                        ))}
                        {link.tags.length > 2 && (
                          <span className="text-[11px] text-ink-500">+{link.tags.length - 2}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-ink-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-ink-200">
                    {formatNumber(link.clickCount)}
                    {link.clickLimit != null && (
                      <span className="text-xs text-ink-500"> / {formatNumber(link.clickLimit)}</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-ink-300">
                    {link.expiresAt ? formatDate(link.expiresAt) : '—'}
                  </td>
                  <td className="px-4 py-4 text-ink-300">{formatDate(link.createdAt)}</td>
                  <td className="px-4 py-4 text-right">
                    <LinkActions
                      link={link}
                      busy={busyId === link.id}
                      onEdit={onEdit}
                      onToggle={onToggle}
                      onDelete={onDelete}
                      onCopy={onCopy}
                      onViewAnalytics={onViewAnalytics}
                      onViewCampaign={onViewCampaign}
                      onShowQr={onShowQr}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
