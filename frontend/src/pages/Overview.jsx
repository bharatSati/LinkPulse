import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Contact,
  Link2,
  Megaphone,
  MousePointerClick,
  Plus,
  RefreshCw,
  Tags,
  UserPlus,
  Users,
} from 'lucide-react';
import Card from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Button from '../components/ui/Button.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import StatCard from '../components/analytics/StatCard.jsx';
import ChartCard from '../components/analytics/ChartCard.jsx';
import ClicksChart from '../components/analytics/ClicksChart.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useWorkspace } from '../hooks/useWorkspace.js';
import { PERMISSIONS } from '../utils/permissions.js';
import { formatNumber } from '../utils/format.js';
import { getOverview } from '../services/workspace.service.js';
import { getClicksOverTime, getTopLinks } from '../services/analytics.service.js';

const RANGE_DAYS = 30;

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function secondaryStats(counts) {
  return [
    { key: 'bioPages', label: 'Bio pages', value: counts.bioPages, icon: Contact },
    { key: 'tags', label: 'Tags', value: counts.tags, icon: Tags },
    {
      key: 'pendingInvitations',
      label: 'Pending invites',
      value: counts.pendingInvitations,
      icon: UserPlus,
    },
  ];
}

export default function Overview() {
  const { user } = useAuth();
  const { activeWorkspace, ready, can } = useWorkspace();

  const workspaceId = activeWorkspace?._id;
  const canManageLinks = can(PERMISSIONS.LINKS_MANAGE);

  const firstName = useMemo(() => user?.name?.split(' ')[0] || 'there', [user]);
  const range = useMemo(() => {
    const to = new Date();
    const from = new Date(to.getTime() - (RANGE_DAYS - 1) * 86400000);
    return { from: isoDate(from), to: isoDate(to) };
  }, []);

  const [counts, setCounts] = useState(null);
  const [clicksOverTime, setClicksOverTime] = useState(null);
  const [topLinks, setTopLinks] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    if (!workspaceId) return undefined;

    let current = true;
    setLoading(true);
    setError('');

    Promise.all([
      getOverview(workspaceId),
      getClicksOverTime({ ...range, workspaceId }),
      getTopLinks({ ...range, workspaceId, limit: 5 }),
    ])
      .then(([overview, clicks, links]) => {
        if (!current) return;
        setCounts(overview.counts);
        setClicksOverTime(clicks);
        setTopLinks(links.links || []);
      })
      .catch((err) => {
        if (current) setError(err.message || 'Unable to load your workspace');
      })
      .finally(() => {
        if (current) setLoading(false);
      });

    return () => {
      current = false;
    };
  }, [workspaceId, range.from, range.to, reloadToken]);

  if (!ready) {
    return (
      <div className="flex justify-center py-24">
        <Spinner label="Preparing your workspace..." />
      </div>
    );
  }

  const safeCounts = counts || {
    clicks: 0,
    links: 0,
    campaigns: 0,
    bioPages: 0,
    tags: 0,
    members: 0,
    pendingInvitations: 0,
  };
  const showEmptyWorkspace = !loading && !error && safeCounts.links === 0 && safeCounts.clicks === 0;
  const periodClicks = (clicksOverTime?.points || []).reduce(
    (sum, point) => sum + (point.clicks || 0),
    0
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink-100">Hi {firstName}</h1>
            {activeWorkspace?.name && <Badge tone="accent">{activeWorkspace.name}</Badge>}
          </div>
          <p className="text-sm text-ink-400">
            Here is what is happening across your workspace.
          </p>
        </div>

        {canManageLinks && (
          <Link
            to="/app/links"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-accent-500 px-4 text-sm font-semibold text-base-950 shadow-glow transition hover:bg-accent-400"
          >
            <Plus className="h-4 w-4" />
            New link
          </Link>
        )}
      </div>

      {error && !loading ? (
        <div className="surface-card flex flex-col items-start gap-3 border-danger-500/30 p-5">
          <div className="flex items-center gap-2 text-danger-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Could not load your workspace</span>
          </div>
          <p className="text-sm text-ink-400">{error}</p>
          <Button variant="secondary" icon={RefreshCw} onClick={reload}>
            Retry
          </Button>
        </div>
      ) : showEmptyWorkspace ? (
        <EmptyState
          icon={BarChart3}
          title="No analytics yet"
          description="Create your first short link and share it — real-time click data, top referrers, and device breakdowns will appear here."
          action={
            <Link
              to="/app/links"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-accent-500 px-4 text-sm font-semibold text-base-950 shadow-glow transition hover:bg-accent-400"
            >
              <Link2 className="h-4 w-4" />
              Create your first link
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 stagger-children sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total clicks"
              value={formatNumber(safeCounts.clicks)}
              icon={MousePointerClick}
              hint="All time"
              loading={loading && !counts}
            />
            <StatCard
              label="Links"
              value={formatNumber(safeCounts.links)}
              icon={Link2}
              hint="In this workspace"
              loading={loading && !counts}
            />
            <StatCard
              label="Campaigns"
              value={formatNumber(safeCounts.campaigns)}
              icon={Megaphone}
              hint="Grouped initiatives"
              loading={loading && !counts}
            />
            <StatCard
              label="Team members"
              value={formatNumber(safeCounts.members)}
              icon={Users}
              hint={`${formatNumber(safeCounts.pendingInvitations)} pending invite${
                safeCounts.pendingInvitations === 1 ? '' : 's'
              }`}
              loading={loading && !counts}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 stagger-children sm:grid-cols-3">
            {secondaryStats(safeCounts).map(({ key, label, value, icon: Icon }) => (
              <Card key={key} interactive className="flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-base-800 text-accent-400 ring-1 ring-base-700">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs text-ink-500">{label}</p>
                  <p className="text-xl font-semibold text-ink-100">{formatNumber(value)}</p>
                </div>
              </Card>
            ))}
          </div>

          <ChartCard
            title="Clicks over time"
            description={`Last ${RANGE_DAYS} days`}
            action={
              <Link
                to="/app/analytics"
                className="inline-flex items-center gap-1 text-xs text-accent-400 transition hover:text-accent-300"
              >
                View analytics
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            }
            loading={loading && !clicksOverTime}
            empty={Boolean(clicksOverTime) && periodClicks === 0}
            emptyMessage="No clicks recorded in the last 30 days."
          >
            <ClicksChart
              points={clicksOverTime?.points || []}
              interval={clicksOverTime?.interval || 'day'}
            />
          </ChartCard>

          <ChartCard
            title="Top links"
            description={`Most clicked links in the last ${RANGE_DAYS} days`}
            loading={loading && !topLinks}
            empty={Boolean(topLinks) && topLinks.length === 0}
            emptyMessage="No link clicks in the last 30 days."
            bodyClassName="overflow-x-auto"
          >
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="border-b border-base-700 text-xs uppercase tracking-wider text-ink-500">
                  <th className="py-2 pr-3 font-medium">Link</th>
                  <th className="px-3 py-2 text-right font-medium">Clicks</th>
                  <th className="px-3 py-2 text-right font-medium">Visitors</th>
                </tr>
              </thead>
              <tbody>
                {(topLinks || []).map((item) => (
                  <tr key={item.linkId} className="border-b border-base-800/70 last:border-0">
                    <td className="max-w-[16rem] py-3 pr-3">
                      <Link
                        to={`/app/analytics?link=${item.linkId}`}
                        className="block truncate font-medium text-ink-100 hover:text-accent-300"
                      >
                        {item.title || 'Untitled link'}
                      </Link>
                      <span className="block truncate font-mono text-xs text-accent-400">
                        /{item.code || '—'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right text-ink-200">
                      {formatNumber(item.clicks)}
                    </td>
                    <td className="px-3 py-3 text-right text-ink-400">
                      {formatNumber(item.visitors)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ChartCard>
        </>
      )}
    </div>
  );
}
