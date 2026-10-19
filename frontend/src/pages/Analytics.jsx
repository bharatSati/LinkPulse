import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  Globe2,
  Link2,
  MousePointerClick,
  RefreshCw,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import StatCard from '../components/analytics/StatCard.jsx';
import LivePulse from '../components/analytics/LivePulse.jsx';
import ChartCard from '../components/analytics/ChartCard.jsx';
import ClicksChart from '../components/analytics/ClicksChart.jsx';
import DonutChart from '../components/analytics/DonutChart.jsx';
import HBarChart from '../components/analytics/HBarChart.jsx';
import BarList from '../components/analytics/BarList.jsx';
import DateRangeFilter from '../components/analytics/DateRangeFilter.jsx';
import { useWorkspace } from '../hooks/useWorkspace.js';
import {
  getBrowsers,
  getClicksOverTime,
  getDevices,
  getLinkAnalytics,
  getLocations,
  getOverview,
  getReferrers,
  getTopLinks,
} from '../services/analytics.service.js';
import { formatNumber } from '../utils/format.js';
import { linkDisplayStatus } from '../utils/linkDisplay.js';

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function rangeForPreset(preset) {
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
  const to = new Date();
  const from = new Date(to.getTime() - (days - 1) * 86400000);
  return { from: isoDate(from), to: isoDate(to) };
}

const regionNames = (() => {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' });
  } catch {
    return null;
  }
})();

function countryLabel(code) {
  if (!code) return 'Unknown';
  try {
    return regionNames?.of(code.toUpperCase()) || code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

export default function Analytics() {
  const { activeWorkspace, ready } = useWorkspace();
  const [searchParams, setSearchParams] = useSearchParams();
  const linkId = searchParams.get('link');

  const [preset, setPreset] = useState('30d');
  const [custom, setCustom] = useState(() => rangeForPreset('30d'));
  const [reloadToken, setReloadToken] = useState(0);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const workspaceId = activeWorkspace?._id;
  const range = useMemo(
    () => (preset === 'custom' ? custom : rangeForPreset(preset)),
    [preset, custom]
  );

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    if (!workspaceId && !linkId) return undefined;
    if (range.from > range.to) {
      setData(null);
      setError('The start date must be on or before the end date.');
      setLoading(false);
      return undefined;
    }

    let current = true;
    setLoading(true);
    setError('');

    const query = { from: range.from, to: range.to };
    const request = linkId
      ? getLinkAnalytics(linkId, query).then((result) => ({
          link: result.link,
          overview: result.overview,
          clicksOverTime: result.clicksOverTime,
          topLinks: null,
          referrers: result.referrers,
          devices: result.devices,
          browsers: result.browsers,
          locations: result.locations,
        }))
      : Promise.all([
          getOverview({ ...query, workspaceId }),
          getClicksOverTime({ ...query, workspaceId }),
          getTopLinks({ ...query, workspaceId, limit: 8 }),
          getReferrers({ ...query, workspaceId }),
          getDevices({ ...query, workspaceId }),
          getBrowsers({ ...query, workspaceId }),
          getLocations({ ...query, workspaceId }),
        ]).then(
          ([overview, clicksOverTime, topLinks, referrers, devices, browsers, locations]) => ({
            link: null,
            overview,
            clicksOverTime,
            topLinks: topLinks.links,
            referrers,
            devices,
            browsers,
            locations,
          })
        );

    request
      .then((result) => {
        if (current) setData(result);
      })
      .catch((err) => {
        if (current) setError(err.message || 'Unable to load analytics');
      })
      .finally(() => {
        if (current) setLoading(false);
      });

    return () => {
      current = false;
    };
  }, [workspaceId, linkId, range.from, range.to, reloadToken]);

  if (!ready && !linkId) {
    return (
      <div className="flex justify-center py-24">
        <Spinner label="Preparing your workspace..." />
      </div>
    );
  }

  const overview = data?.overview;
  const clicksOverTime = data?.clicksOverTime;
  const referrers = data?.referrers;
  const devices = data?.devices;
  const browsers = data?.browsers;
  const locations = data?.locations;
  const topLinks = data?.topLinks;
  const link = data?.link;

  const linkStatus = link ? linkDisplayStatus({ ...link, hasPassword: false }) : null;
  const showEmptyWorkspace =
    !loading && !error && !linkId && overview && overview.linksCount === 0;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-100">Analytics</h1>
          <p className="mt-1 text-sm text-ink-400">
            {link
              ? 'Performance for this link.'
              : 'Understand traffic, audience, and performance across your workspace.'}
          </p>
        </div>
        <DateRangeFilter
          preset={preset}
          custom={custom}
          onPresetChange={setPreset}
          onCustomChange={(next) => {
            setCustom(next);
            setPreset('custom');
          }}
        />
      </div>

      {linkId && (
        <div className="surface-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-medium text-ink-100">
                {link ? link.title || 'Untitled link' : 'Link analytics'}
              </p>
              {linkStatus && <Badge tone={linkStatus.tone}>{linkStatus.label}</Badge>}
            </div>
            <p className="mt-0.5 truncate font-mono text-xs text-accent-400">
              /{link ? link.customAlias || link.shortCode : ''}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={X}
            onClick={() => setSearchParams({})}
            className="shrink-0"
          >
            All links
          </Button>
        </div>
      )}

      {error && !loading ? (
        <div className="surface-card flex flex-col items-start gap-3 border-danger-500/30 p-5">
          <div className="flex items-center gap-2 text-danger-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Could not load analytics</span>
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
          description="Create a link and share it — clicks will appear here as visitors arrive."
          action={
            <Link
              to="/app/links"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-accent-500 px-4 text-sm font-semibold text-base-950 shadow-glow transition hover:bg-accent-400"
            >
              <Link2 className="h-4 w-4" />
              Go to links
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 stagger-children sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total clicks"
              value={formatNumber(overview?.totalClicks ?? 0)}
              icon={MousePointerClick}
              hint="All time"
              loading={loading && !overview}
            />
            <StatCard
              label="Clicks in period"
              value={formatNumber(overview?.periodClicks ?? 0)}
              icon={TrendingUp}
              change={overview?.changePercent}
              loading={loading && !overview}
            />
            <StatCard
              label="Unique visitors"
              value={formatNumber(overview?.uniqueVisitors ?? 0)}
              icon={Users}
              hint="By hashed IP"
              loading={loading && !overview}
            />
            <StatCard
              label="Avg. per day"
              value={overview?.avgDailyClicks ?? 0}
              icon={BarChart3}
              hint={`${overview?.range?.days ?? 0} days`}
              loading={loading && !overview}
            />
          </div>

          <LivePulse workspaceId={workspaceId} linkId={linkId} />

          <ChartCard
            title="Clicks over time"
            description={`Clicks and unique visitors per ${clicksOverTime?.interval || 'day'}`}
            loading={loading && !clicksOverTime}
            empty={Boolean(clicksOverTime) && (overview?.periodClicks ?? 0) === 0}
            emptyMessage="No clicks recorded in this period."
          >
            <ClicksChart
              points={clicksOverTime?.points || []}
              interval={clicksOverTime?.interval || 'day'}
            />
          </ChartCard>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {!linkId && (
              <ChartCard
                title="Top links"
                description="Most clicked links in this period"
                className="lg:col-span-2"
                loading={loading && !topLinks}
                empty={Boolean(topLinks) && topLinks.length === 0}
                emptyMessage="No link clicks in this period."
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
            )}

            <ChartCard
              title="Top referrers"
              description="Where your visitors came from"
              className={linkId ? 'lg:col-span-3' : ''}
              loading={loading && !referrers}
              empty={Boolean(referrers) && referrers.total === 0}
              emptyMessage="No referrer data in this period."
            >
              <BarList
                items={(referrers?.referrers || []).map((item) => ({
                  label: item.source,
                  value: item.clicks,
                  percentage: item.percentage,
                }))}
              />
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard
              title="Devices"
              description="Traffic split by device type"
              loading={loading && !devices}
              empty={Boolean(devices) && devices.total === 0}
              emptyMessage="No device data in this period."
            >
              <DonutChart data={devices?.devices || []} />
            </ChartCard>

            <ChartCard
              title="Browsers"
              description="Traffic split by browser"
              loading={loading && !browsers}
              empty={Boolean(browsers) && browsers.total === 0}
              emptyMessage="No browser data in this period."
            >
              <HBarChart data={browsers?.browsers || []} />
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard
              title="Operating systems"
              description="Traffic split by platform"
              loading={loading && !browsers}
              empty={Boolean(browsers) && browsers.total === 0}
              emptyMessage="No platform data in this period."
            >
              <HBarChart data={browsers?.operatingSystems || []} />
            </ChartCard>

            <ChartCard
              title="Locations"
              description="Top countries by clicks"
              loading={loading && !locations}
              empty={Boolean(locations) && !locations.hasGeoData}
              emptyMessage="Geographic data is not available. Country is only recorded when the request reaches LinkPulse through a CDN or proxy that forwards location headers."
            >
              <div className="space-y-4">
                <BarList
                  items={(locations?.locations || []).map((item) => ({
                    label: countryLabel(item.country),
                    value: item.clicks,
                    percentage: item.percentage,
                  }))}
                />
                {locations?.unknownClicks > 0 && (
                  <p className="flex items-center gap-1.5 text-xs text-ink-500">
                    <Globe2 className="h-3.5 w-3.5" />
                    {formatNumber(locations.unknownClicks)} click
                    {locations.unknownClicks === 1 ? '' : 's'} without location data
                  </p>
                )}
              </div>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
