import { Copy } from 'lucide-react';
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
  busyId,
}) {
  return (
    <div className="surface-card hidden overflow-hidden p-0 md:block">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-base-700 text-xs uppercase tracking-wider text-ink-500">
              <th className="px-5 py-3 font-medium">Link</th>
              <th className="px-4 py-3 font-medium">Status</th>
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
                  <td className="max-w-[22rem] px-5 py-4">
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
                      {truncate(link.originalUrl, 48)}
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
