import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CalendarClock,
  Copy,
  Link2,
  Megaphone,
  MousePointerClick,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Search,
  Tag as TagIcon,
  Trash2,
  Users,
} from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import Input from '../components/ui/Input.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Dialog from '../components/ui/Dialog.jsx';
import StatCard from '../components/analytics/StatCard.jsx';
import ChartCard from '../components/analytics/ChartCard.jsx';
import ClicksChart from '../components/analytics/ClicksChart.jsx';
import DonutChart from '../components/analytics/DonutChart.jsx';
import HBarChart from '../components/analytics/HBarChart.jsx';
import BarList from '../components/analytics/BarList.jsx';
import DateRangeFilter from '../components/analytics/DateRangeFilter.jsx';
import CampaignFormDialog from '../components/campaigns/CampaignFormDialog.jsx';
import LinkFormDialog from '../components/links/LinkFormDialog.jsx';
import { useWorkspace } from '../hooks/useWorkspace.js';
import { useToast } from '../hooks/useToast.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import {
  deleteCampaign as deleteCampaignRequest,
  getCampaign,
  getCampaignAnalytics,
  listCampaignLinks,
  updateCampaign,
} from '../services/campaign.service.js';
import { createTag, listTags } from '../services/tag.service.js';
import { formatDate, formatNumber } from '../utils/format.js';
import { campaignStatusMeta, formatSchedule } from '../utils/campaign.js';
import { linkDisplayStatus, resolveShortUrl } from '../utils/linkDisplay.js';

const EDIT_ROLES = ['owner', 'admin', 'editor'];
const LINKS_PAGE_SIZE = 8;

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function rangeForPreset(preset) {
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
  const to = new Date();
  const from = new Date(to.getTime() - (days - 1) * 86400000);
  return { from: isoDate(from), to: isoDate(to) };
}

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const { toast } = useToast();

  const [campaign, setCampaign] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  const [preset, setPreset] = useState('30d');
  const [custom, setCustom] = useState(() => rangeForPreset('30d'));
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [links, setLinks] = useState([]);
  const [linkPagination, setLinkPagination] = useState(null);
  const [linksLoading, setLinksLoading] = useState(false);
  const [linkPage, setLinkPage] = useState(1);
  const [linkSearchInput, setLinkSearchInput] = useState('');
  const debouncedLinkSearch = useDebouncedValue(linkSearchInput, 350);

  const [tags, setTags] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [addLinkOpen, setAddLinkOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const workspaceId = activeWorkspace?._id;
  const canEdit = role ? EDIT_ROLES.includes(role) : false;

  const range = useMemo(
    () => (preset === 'custom' ? custom : rangeForPreset(preset)),
    [preset, custom]
  );

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError('');

    getCampaign(id)
      .then((result) => {
        if (!current) return;
        setCampaign(result.campaign);
        setRole(result.role);
      })
      .catch((err) => {
        if (current) setError(err.message || 'Unable to load campaign');
      })
      .finally(() => {
        if (current) setLoading(false);
      });

    return () => {
      current = false;
    };
  }, [id, reloadToken]);

  useEffect(() => {
    let current = true;
    setAnalyticsLoading(true);

    getCampaignAnalytics(id, { from: range.from, to: range.to })
      .then((result) => {
        if (current) setAnalytics(result);
      })
      .catch(() => {
        if (current) setAnalytics(null);
      })
      .finally(() => {
        if (current) setAnalyticsLoading(false);
      });

    return () => {
      current = false;
    };
  }, [id, range.from, range.to, reloadToken]);

  useEffect(() => {
    setLinkPage(1);
  }, [id, debouncedLinkSearch]);

  useEffect(() => {
    let current = true;
    setLinksLoading(true);

    listCampaignLinks(id, {
      search: debouncedLinkSearch,
      page: linkPage,
      limit: LINKS_PAGE_SIZE,
    })
      .then((result) => {
        if (!current) return;
        setLinks(result.links);
        setLinkPagination(result.pagination);
      })
      .catch(() => {
        if (current) {
          setLinks([]);
          setLinkPagination(null);
        }
      })
      .finally(() => {
        if (current) setLinksLoading(false);
      });

    return () => {
      current = false;
    };
  }, [id, debouncedLinkSearch, linkPage, reloadToken]);

  useEffect(() => {
    if (!workspaceId) return undefined;
    let current = true;
    listTags({ workspaceId })
      .then((result) => {
        if (current) setTags(result);
      })
      .catch(() => {
        if (current) setTags([]);
      });
    return () => {
      current = false;
    };
  }, [workspaceId, reloadToken]);

  async function handleCreateTag(name) {
    const tag = await createTag({ workspaceId, name });
    setTags(await listTags({ workspaceId }));
    return tag;
  }

  async function handleToggleStatus() {
    if (!campaign) return;
    const nextStatus = campaign.status === 'archived' ? 'active' : 'archived';
    setBusy(true);
    try {
      const updated = await updateCampaign(campaign.id, { status: nextStatus });
      setCampaign(updated);
      toast.success(nextStatus === 'archived' ? 'Campaign archived' : 'Campaign reactivated');
    } catch (err) {
      toast.error(err.message || 'Unable to update campaign');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteCampaignRequest(campaign.id);
      toast.success('Campaign deleted. Its links were kept.');
      navigate('/app/campaigns');
    } catch (err) {
      toast.error(err.message || 'Unable to delete campaign');
      setDeleting(false);
    }
  }

  async function handleCopy(link) {
    try {
      await navigator.clipboard.writeText(resolveShortUrl(link));
      toast.success('Short link copied to clipboard');
    } catch {
      toast.error('Unable to copy. Copy it manually instead.');
    }
  }

  function handleSaved() {
    setEditOpen(false);
    setAddLinkOpen(false);
    toast.success('Saved');
    reload();
  }

  if (loading && !campaign) {
    return (
      <div className="flex justify-center py-24">
        <Spinner label="Loading campaign..." />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="animate-fade-in space-y-6">
        <Link
          to="/app/campaigns"
          className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-100"
        >
          <ArrowLeft className="h-4 w-4" /> Back to campaigns
        </Link>
        <div className="surface-card flex flex-col items-start gap-3 border-danger-500/30 p-5">
          <div className="flex items-center gap-2 text-danger-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Could not load campaign</span>
          </div>
          <p className="text-sm text-ink-400">{error || 'Campaign not found'}</p>
          <Button variant="secondary" icon={RefreshCw} onClick={reload}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const status = campaignStatusMeta(campaign.status);
  const overview = analytics?.overview;
  const totalPages = linkPagination?.totalPages || 1;

  return (
    <div className="animate-fade-in space-y-6">
      <Link
        to="/app/campaigns"
        className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-100"
      >
        <ArrowLeft className="h-4 w-4" /> Back to campaigns
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-ink-100">
              {campaign.name}
            </h1>
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>
          {campaign.description && (
            <p className="mt-1.5 max-w-2xl text-sm text-ink-400">{campaign.description}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5" />
              {formatSchedule(campaign.startDate, campaign.endDate)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5" />
              Created {formatDate(campaign.createdAt)}
            </span>
          </div>
          {campaign.tags?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {campaign.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1 rounded-full border border-base-600 bg-base-800 px-2.5 py-0.5 text-xs text-ink-300"
                >
                  <TagIcon className="h-3 w-3 text-accent-400" />
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {canEdit && (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" icon={Pencil} onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={Power}
              loading={busy}
              onClick={handleToggleStatus}
            >
              {campaign.status === 'archived' ? 'Reactivate' : 'Archive'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={Trash2}
              onClick={() => setDeleteOpen(true)}
              className="text-danger-400"
            >
              Delete
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total links"
          value={formatNumber(analytics?.totalLinks ?? campaign.linkCount ?? 0)}
          icon={Link2}
          hint="In this campaign"
          loading={analyticsLoading && !analytics}
        />
        <StatCard
          label="Total clicks"
          value={formatNumber(overview?.totalClicks ?? campaign.clickCount ?? 0)}
          icon={MousePointerClick}
          hint="All time"
          loading={analyticsLoading && !analytics}
        />
        <StatCard
          label="Clicks in period"
          value={formatNumber(overview?.periodClicks ?? 0)}
          icon={BarChart3}
          change={overview?.changePercent}
          loading={analyticsLoading && !analytics}
        />
        <StatCard
          label="Unique visitors"
          value={formatNumber(overview?.uniqueVisitors ?? 0)}
          icon={Users}
          hint="By hashed IP"
          loading={analyticsLoading && !analytics}
        />
      </div>

      <ChartCard
        title="Clicks over time"
        description={`Clicks and unique visitors per ${analytics?.clicksOverTime?.interval || 'day'}`}
        loading={analyticsLoading && !analytics}
        empty={Boolean(analytics) && (overview?.periodClicks ?? 0) === 0}
        emptyMessage="No clicks recorded in this period."
      >
        <ClicksChart
          points={analytics?.clicksOverTime?.points || []}
          interval={analytics?.clicksOverTime?.interval || 'day'}
        />
      </ChartCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="Top links"
          description="Most clicked links in this campaign"
          className="lg:col-span-2"
          loading={analyticsLoading && !analytics}
          empty={Boolean(analytics) && (analytics?.topLinks?.length ?? 0) === 0}
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
              {(analytics?.topLinks || []).map((item) => (
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
                  <td className="px-3 py-3 text-right text-ink-200">{formatNumber(item.clicks)}</td>
                  <td className="px-3 py-3 text-right text-ink-400">
                    {formatNumber(item.visitors)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ChartCard>

        <ChartCard
          title="Top referrers"
          description="Where visitors came from"
          loading={analyticsLoading && !analytics}
          empty={Boolean(analytics) && (analytics?.referrers?.total ?? 0) === 0}
          emptyMessage="No referrer data in this period."
        >
          <BarList
            items={(analytics?.referrers?.referrers || []).map((item) => ({
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
          loading={analyticsLoading && !analytics}
          empty={Boolean(analytics) && (analytics?.devices?.total ?? 0) === 0}
          emptyMessage="No device data in this period."
        >
          <DonutChart data={analytics?.devices?.devices || []} />
        </ChartCard>

        <ChartCard
          title="Browsers"
          description="Traffic split by browser"
          loading={analyticsLoading && !analytics}
          empty={Boolean(analytics) && (analytics?.browsers?.total ?? 0) === 0}
          emptyMessage="No browser data in this period."
        >
          <HBarChart data={analytics?.browsers?.browsers || []} />
        </ChartCard>
      </div>

      <ChartCard
        title="Locations"
        description="Top countries by clicks"
        loading={analyticsLoading && !analytics}
        empty={Boolean(analytics) && !analytics?.locations?.hasGeoData}
        emptyMessage="Geographic data is not available for this period."
      >
        <BarList
          items={(analytics?.locations?.locations || []).map((item) => ({
            label: item.country,
            value: item.clicks,
            percentage: item.percentage,
          }))}
        />
      </ChartCard>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-ink-100">
              Links in this campaign
            </h2>
            <p className="mt-0.5 text-sm text-ink-400">
              {formatNumber(linkPagination?.total ?? campaign.linkCount ?? 0)} link
              {(linkPagination?.total ?? campaign.linkCount ?? 0) === 1 ? '' : 's'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              icon={Search}
              placeholder="Search links"
              value={linkSearchInput}
              onChange={(event) => setLinkSearchInput(event.target.value)}
              className="sm:w-64"
            />
            {canEdit && (
              <Button icon={Plus} onClick={() => setAddLinkOpen(true)} className="shrink-0">
                Add link
              </Button>
            )}
          </div>
        </div>

        {linksLoading && links.length === 0 ? (
          <div className="flex justify-center py-16">
            <Spinner label="Loading links..." />
          </div>
        ) : links.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title={debouncedLinkSearch ? 'No links match your search' : 'No links in this campaign'}
            description={
              debouncedLinkSearch
                ? 'Try a different search term.'
                : 'Assign links to this campaign from the Links page or add one here.'
            }
            action={
              canEdit && !debouncedLinkSearch ? (
                <Button icon={Plus} onClick={() => setAddLinkOpen(true)}>
                  Add link
                </Button>
              ) : null
            }
          />
        ) : (
          <>
            <div className="surface-card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-base-700 text-xs uppercase tracking-wider text-ink-500">
                      <th className="px-5 py-3 font-medium">Link</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Clicks</th>
                      <th className="px-4 py-3 font-medium">Tags</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {links.map((link) => {
                      const linkStatus = linkDisplayStatus(link);
                      return (
                        <tr
                          key={link.id}
                          className="border-b border-base-800/70 transition last:border-0 hover:bg-base-850/60"
                        >
                          <td className="max-w-[20rem] px-5 py-4">
                            <p className="truncate font-medium text-ink-100">
                              {link.title || 'Untitled link'}
                            </p>
                            <a
                              href={resolveShortUrl(link)}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-0.5 block truncate font-mono text-xs text-accent-400 hover:text-accent-300"
                            >
                              {resolveShortUrl(link)}
                            </a>
                          </td>
                          <td className="px-4 py-4">
                            <Badge tone={linkStatus.tone}>{linkStatus.label}</Badge>
                          </td>
                          <td className="px-4 py-4 text-ink-200">{formatNumber(link.clickCount)}</td>
                          <td className="px-4 py-4">
                            {link.tags?.length ? (
                              <div className="flex flex-wrap gap-1">
                                {link.tags.slice(0, 2).map((tag) => (
                                  <span
                                    key={tag.id}
                                    className="rounded-full border border-base-600 bg-base-800 px-2 py-0.5 text-[11px] text-ink-300"
                                  >
                                    {tag.name}
                                  </span>
                                ))}
                                {link.tags.length > 2 && (
                                  <span className="text-[11px] text-ink-500">
                                    +{link.tags.length - 2}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-ink-600">—</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleCopy(link)}
                                className="rounded-lg p-1.5 text-ink-400 transition hover:bg-base-800 hover:text-ink-100"
                                aria-label="Copy short link"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                              <Link
                                to={`/app/analytics?link=${link.id}`}
                                className="rounded-lg p-1.5 text-ink-400 transition hover:bg-base-800 hover:text-ink-100"
                                aria-label="View link analytics"
                              >
                                <BarChart3 className="h-3.5 w-3.5" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {linkPagination && linkPagination.total > 0 && (
              <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                <p className="text-xs text-ink-500">
                  Page {linkPagination.page} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={linkPage <= 1 || linksLoading}
                    onClick={() => setLinkPage((value) => Math.max(value - 1, 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={linkPage >= totalPages || linksLoading}
                    onClick={() => setLinkPage((value) => Math.min(value + 1, totalPages))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <CampaignFormDialog
        open={editOpen}
        mode="edit"
        campaign={campaign}
        workspaceId={workspaceId}
        tags={tags}
        onCreateTag={handleCreateTag}
        onClose={() => setEditOpen(false)}
        onSaved={handleSaved}
      />

      <LinkFormDialog
        open={addLinkOpen}
        mode="create"
        link={null}
        workspaceId={workspaceId}
        campaigns={[{ id: campaign.id, name: campaign.name }]}
        defaultCampaignId={campaign.id}
        tags={tags}
        onCreateTag={handleCreateTag}
        onClose={() => setAddLinkOpen(false)}
        onSaved={handleSaved}
      />

      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete campaign"
        description={`"${campaign.name}" will be deleted. Its links are kept and simply detached — no links or click history are removed.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>
              Delete campaign
            </Button>
          </>
        }
      />
    </div>
  );
}
