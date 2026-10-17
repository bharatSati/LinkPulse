import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Link2, RefreshCw, AlertTriangle, Tags, Upload } from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Select from '../components/ui/Select.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Dialog from '../components/ui/Dialog.jsx';
import LinkTable from '../components/links/LinkTable.jsx';
import LinkCard from '../components/links/LinkCard.jsx';
import LinkFormDialog from '../components/links/LinkFormDialog.jsx';
import ImportLinksDialog from '../components/links/ImportLinksDialog.jsx';
import ManageTagsDialog from '../components/tags/ManageTagsDialog.jsx';
import QrCodeDialog from '../components/qr/QrCodeDialog.jsx';
import { useWorkspace } from '../hooks/useWorkspace.js';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { listLinks, updateLink, deleteLink as deleteLinkRequest } from '../services/link.service.js';
import { listAllCampaigns } from '../services/campaign.service.js';
import { listTags, createTag } from '../services/tag.service.js';
import { resolveShortUrl } from '../utils/linkDisplay.js';
import { formatNumber } from '../utils/format.js';

const PAGE_SIZE = 10;

const FILTERS = [
  { value: 'all', label: 'All links' },
  { value: 'active', label: 'Active' },
  { value: 'disabled', label: 'Disabled' },
  { value: 'expired', label: 'Expired' },
  { value: 'protected', label: 'Protected' },
];

const EDIT_ROLES = ['owner', 'admin', 'editor'];

export default function Links() {
  const { activeWorkspace, ready } = useWorkspace();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const [filter, setFilter] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('');
  const [page, setPage] = useState(1);

  const [campaigns, setCampaigns] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [manageTagsOpen, setManageTagsOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [qrTarget, setQrTarget] = useState(null);

  const [links, setLinks] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [activeLink, setActiveLink] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const workspaceId = activeWorkspace?._id;

  const role = useMemo(() => {
    if (!activeWorkspace) return null;
    const ownerId = activeWorkspace.owner?._id || activeWorkspace.owner;
    if (ownerId && ownerId === user?._id) return 'owner';
    const membership = activeWorkspace.members?.find(
      (member) => (member.user?._id || member.user) === user?._id
    );
    return membership?.role || null;
  }, [activeWorkspace, user]);

  const canEdit = role ? EDIT_ROLES.includes(role) : true;

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  const refreshTags = useCallback(async () => {
    if (!workspaceId) return;
    setTagsLoading(true);
    try {
      setTags(await listTags({ workspaceId }));
    } catch {
      setTags([]);
    } finally {
      setTagsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    let current = true;
    if (!workspaceId) return undefined;
    listAllCampaigns(workspaceId)
      .then((result) => {
        if (current) setCampaigns(result);
      })
      .catch(() => {
        if (current) setCampaigns([]);
      });
    return () => {
      current = false;
    };
  }, [workspaceId, reloadToken]);

  useEffect(() => {
    refreshTags();
  }, [refreshTags, reloadToken]);

  async function handleCreateTag(name) {
    const tag = await createTag({ workspaceId, name });
    await refreshTags();
    return tag;
  }

  useEffect(() => {
    setPage(1);
  }, [workspaceId, debouncedSearch, filter, campaignFilter, tagFilter]);

  useEffect(() => {
    if (!workspaceId) return undefined;

    let current = true;
    setLoading(true);
    setError('');

    listLinks({
      workspaceId,
      search: debouncedSearch,
      filter,
      campaignId: campaignFilter,
      tagId: tagFilter,
      page,
      limit: PAGE_SIZE,
    })
      .then((result) => {
        if (!current) return;
        setLinks(result.links);
        setPagination(result.pagination);
      })
      .catch((err) => {
        if (current) setError(err.message || 'Unable to load links');
      })
      .finally(() => {
        if (current) setLoading(false);
      });

    return () => {
      current = false;
    };
  }, [workspaceId, debouncedSearch, filter, campaignFilter, tagFilter, page, reloadToken]);

  function openCreate() {
    setDialogMode('create');
    setActiveLink(null);
    setDialogOpen(true);
  }

  function openEdit(link) {
    setDialogMode('edit');
    setActiveLink(link);
    setDialogOpen(true);
  }

  function handleSaved(_saved, mode) {
    setDialogOpen(false);
    setActiveLink(null);
    toast.success(mode === 'edit' ? 'Link updated' : 'Link created');
    reload();
  }

  async function handleToggle(link) {
    const nextStatus = link.status === 'disabled' ? 'active' : 'disabled';
    setBusyId(link.id);
    try {
      await updateLink(link.id, { status: nextStatus });
      toast.success(nextStatus === 'active' ? 'Link enabled' : 'Link disabled');
      reload();
    } catch (err) {
      toast.error(err.message || 'Unable to update link');
    } finally {
      setBusyId(null);
    }
  }

  function handleViewAnalytics(link) {
    navigate(`/app/analytics?link=${link.id}`);
  }

  function handleViewCampaign(link) {
    if (link.campaign?.id) {
      navigate(`/app/campaigns/${link.campaign.id}`);
    }
  }

  function handleShowQr(link) {
    setQrTarget(link);
  }

  async function handleCopy(link) {
    const url = resolveShortUrl(link);
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Short link copied to clipboard');
    } catch {
      toast.error('Unable to copy. Copy it manually instead.');
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteLinkRequest(deleteTarget.id);
      toast.success('Link deleted');
      setDeleteTarget(null);
      if (links.length === 1 && page > 1) {
        setPage((value) => value - 1);
      } else {
        reload();
      }
    } catch (err) {
      toast.error(err.message || 'Unable to delete link');
    } finally {
      setDeleting(false);
    }
  }

  const hasFilters =
    debouncedSearch.trim() !== '' ||
    filter !== 'all' ||
    campaignFilter !== 'all' ||
    tagFilter !== '';
  const totalPages = pagination?.totalPages || 1;

  const campaignFilterOptions = [
    { value: 'all', label: 'All campaigns' },
    { value: 'none', label: 'No campaign' },
    ...campaigns.map((campaign) => ({ value: campaign.id, label: campaign.name })),
  ];
  const tagFilterOptions = [
    { value: '', label: 'All tags' },
    ...tags.map((tag) => ({ value: tag.id, label: tag.name })),
  ];

  if (!ready && !activeWorkspace) {
    return (
      <div className="flex justify-center py-24">
        <Spinner label="Preparing your workspace..." />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-100">Links</h1>
          <p className="mt-1 text-sm text-ink-400">
            Create short links, set limits, and route visitors by device.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            icon={Upload}
            onClick={() => setImportOpen(true)}
            disabled={!canEdit || !workspaceId}
          >
            Import CSV
          </Button>
          <Button variant="secondary" icon={Tags} onClick={() => setManageTagsOpen(true)}>
            Manage tags
          </Button>
          <Button icon={Plus} onClick={openCreate} disabled={!canEdit || !workspaceId}>
            New link
          </Button>
        </div>
      </div>

      {!canEdit && (
        <div className="rounded-xl border border-warn-500/40 bg-warn-500/10 px-4 py-3 text-sm text-warn-400">
          You have read-only access to this workspace. An editor role is required to manage links.
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          icon={Search}
          placeholder="Search by title, URL, or alias"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className="sm:max-w-sm"
        />
        <Select
          value={filter}
          options={FILTERS}
          onChange={(event) => setFilter(event.target.value)}
          className="sm:w-44"
        />
        <Select
          value={campaignFilter}
          options={campaignFilterOptions}
          onChange={(event) => setCampaignFilter(event.target.value)}
          className="sm:w-44"
        />
        <Select
          value={tagFilter}
          options={tagFilterOptions}
          onChange={(event) => setTagFilter(event.target.value)}
          className="sm:w-40"
        />
      </div>

      {error ? (
        <div className="surface-card flex flex-col items-start gap-3 border-danger-500/30 p-5">
          <div className="flex items-center gap-2 text-danger-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Could not load links</span>
          </div>
          <p className="text-sm text-ink-400">{error}</p>
          <Button variant="secondary" icon={RefreshCw} onClick={reload}>
            Retry
          </Button>
        </div>
      ) : loading && links.length === 0 ? (
        <div className="flex justify-center py-20">
          <Spinner label="Loading links..." />
        </div>
      ) : links.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon={Search}
            title="No links match your filters"
            description="Try a different search term or clear the filters."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchInput('');
                  setFilter('all');
                  setCampaignFilter('all');
                  setTagFilter('');
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Link2}
            title="No links yet"
            description="Create your first short link to start tracking clicks."
            action={
              <Button icon={Plus} onClick={openCreate} disabled={!canEdit}>
                Create a link
              </Button>
            }
          />
        )
      ) : (
        <>
          <LinkTable
            links={links}
            busyId={busyId}
            onEdit={openEdit}
            onToggle={handleToggle}
            onDelete={setDeleteTarget}
            onCopy={handleCopy}
            onViewAnalytics={handleViewAnalytics}
            onViewCampaign={handleViewCampaign}
            onShowQr={handleShowQr}
          />

          <div className="space-y-3 md:hidden">
            {links.map((link) => (
              <LinkCard
                key={link.id}
                link={link}
                busy={busyId === link.id}
                onEdit={openEdit}
                onToggle={handleToggle}
                onDelete={setDeleteTarget}
                onCopy={handleCopy}
                onViewAnalytics={handleViewAnalytics}
                onViewCampaign={handleViewCampaign}
                onShowQr={handleShowQr}
              />
            ))}
          </div>

          {pagination && pagination.total > 0 && (
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-xs text-ink-500">
                {formatNumber(pagination.total)} link{pagination.total === 1 ? '' : 's'} · page{' '}
                {pagination.page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((value) => Math.max(value - 1, 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((value) => Math.min(value + 1, totalPages))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <LinkFormDialog
        open={dialogOpen}
        mode={dialogMode}
        link={activeLink}
        workspaceId={workspaceId}
        campaigns={campaigns}
        tags={tags}
        onCreateTag={handleCreateTag}
        onClose={() => {
          setDialogOpen(false);
          setActiveLink(null);
        }}
        onSaved={handleSaved}
      />

      <ManageTagsDialog
        open={manageTagsOpen}
        onClose={() => setManageTagsOpen(false)}
        workspaceId={workspaceId}
        tags={tags}
        loading={tagsLoading}
        onChanged={async () => {
          await refreshTags();
          reload();
        }}
      />

      <ImportLinksDialog
        open={importOpen}
        workspaceId={workspaceId}
        canEdit={canEdit}
        onClose={() => setImportOpen(false)}
        onImported={() => {
          reload();
          refreshTags();
        }}
      />

      <QrCodeDialog
        open={Boolean(qrTarget)}
        link={qrTarget}
        canEdit={canEdit}
        onClose={() => setQrTarget(null)}
        onSaved={(data) => {
          setQrTarget(data.link);
          setLinks((current) =>
            current.map((item) => (item.id === data.link.id ? data.link : item))
          );
        }}
      />

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete link"
        description={`"${deleteTarget?.title || deleteTarget?.shortCode || 'This link'}" will be permanently deleted. This cannot be undone.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={confirmDelete}>
              Delete link
            </Button>
          </>
        }
      />
    </div>
  );
}
