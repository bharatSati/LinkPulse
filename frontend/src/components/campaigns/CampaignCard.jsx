import { Link } from 'react-router-dom';
import { MousePointerClick, Link2, CalendarClock, Tag as TagIcon } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import CampaignActions from './CampaignActions.jsx';
import { campaignStatusMeta, formatSchedule } from '../../utils/campaign.js';
import { formatNumber, truncate } from '../../utils/format.js';

export default function CampaignCard({ campaign, onOpen, onEdit, onToggleStatus, onDelete, busy }) {
  const status = campaignStatusMeta(campaign.status);

  return (
    <div className="surface-card space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={`/app/campaigns/${campaign.id}`}
            className="block truncate font-medium text-ink-100 hover:text-accent-300"
          >
            {campaign.name}
          </Link>
          {campaign.description && (
            <p className="mt-0.5 truncate text-xs text-ink-500">
              {truncate(campaign.description, 56)}
            </p>
          )}
        </div>
        <CampaignActions
          campaign={campaign}
          busy={busy}
          onOpen={onOpen}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
          onDelete={onDelete}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-400">
        <Badge tone={status.tone}>{status.label}</Badge>
        <span className="inline-flex items-center gap-1.5">
          <Link2 className="h-3.5 w-3.5" />
          {formatNumber(campaign.linkCount || 0)} links
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MousePointerClick className="h-3.5 w-3.5" />
          {formatNumber(campaign.clickCount || 0)} clicks
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarClock className="h-3.5 w-3.5" />
          {formatSchedule(campaign.startDate, campaign.endDate)}
        </span>
      </div>

      {campaign.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {campaign.tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 rounded-full border border-base-600 bg-base-800 px-2 py-0.5 text-[11px] text-ink-300"
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
