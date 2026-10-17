import { Link } from 'react-router-dom';
import { Tag as TagIcon } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import CampaignActions from './CampaignActions.jsx';
import { campaignStatusMeta, formatSchedule } from '../../utils/campaign.js';
import { formatNumber, truncate } from '../../utils/format.js';

export default function CampaignTable({
  campaigns,
  onOpen,
  onEdit,
  onToggleStatus,
  onDelete,
  busyId,
}) {
  return (
    <div className="surface-card hidden overflow-hidden p-0 md:block">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b border-base-700 text-xs uppercase tracking-wider text-ink-500">
              <th className="px-5 py-3 font-medium">Campaign</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Links</th>
              <th className="px-4 py-3 font-medium">Clicks</th>
              <th className="px-4 py-3 font-medium">Schedule</th>
              <th className="px-4 py-3 font-medium">Tags</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => {
              const status = campaignStatusMeta(campaign.status);
              return (
                <tr
                  key={campaign.id}
                  className="border-b border-base-800/70 transition last:border-0 hover:bg-base-850/60"
                >
                  <td className="max-w-[22rem] px-5 py-4">
                    <Link
                      to={`/app/campaigns/${campaign.id}`}
                      className="block truncate font-medium text-ink-100 hover:text-accent-300"
                    >
                      {campaign.name}
                    </Link>
                    {campaign.description && (
                      <p className="mt-1 truncate text-xs text-ink-500" title={campaign.description}>
                        {truncate(campaign.description, 60)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </td>
                  <td className="px-4 py-4 text-ink-200">{formatNumber(campaign.linkCount || 0)}</td>
                  <td className="px-4 py-4 text-ink-200">{formatNumber(campaign.clickCount || 0)}</td>
                  <td className="px-4 py-4 text-xs text-ink-400">
                    {formatSchedule(campaign.startDate, campaign.endDate)}
                  </td>
                  <td className="px-4 py-4">
                    {campaign.tags?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {campaign.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center gap-1 rounded-full border border-base-600 bg-base-800 px-2 py-0.5 text-[11px] text-ink-300"
                          >
                            <TagIcon className="h-2.5 w-2.5 text-accent-400" />
                            {tag.name}
                          </span>
                        ))}
                        {campaign.tags.length > 3 && (
                          <span className="text-[11px] text-ink-500">+{campaign.tags.length - 3}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-ink-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <CampaignActions
                      campaign={campaign}
                      busy={busyId === campaign.id}
                      onOpen={onOpen}
                      onEdit={onEdit}
                      onToggleStatus={onToggleStatus}
                      onDelete={onDelete}
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
