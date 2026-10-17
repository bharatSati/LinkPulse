import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Megaphone, Plus, RefreshCw, Search, Tags } from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Select from '../components/ui/Select.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Dialog from '../components/ui/Dialog.jsx';
import CampaignTable from '../components/campaigns/CampaignTable.jsx';
import CampaignCard from '../components/campaigns/CampaignCard.jsx';
import CampaignFormDialog from '../components/campaigns/CampaignFormDialog.jsx';
import ManageTagsDialog from '../components/tags/ManageTagsDialog.jsx';
import { useWorkspace } from '../hooks/useWorkspace.js';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import {
  listCampaigns,
  updateCampaign,
  deleteCampaign as deleteCampaignRequest,
} from '../services/campaign.service.js';
import { listTags, createTag } from '../services/tag.service.js';
import { formatNumber } from '../utils/format.js';

const PAGE_SIZE = 9;
const EDIT_ROLES = ['owner', 'admin', 'editor'];

const STATUS_FILTERS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

const SORT_OPTIONS = [
  { value: 'recent', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name', label: 'Name (A–Z)' },
];

export default function Campaigns() {
  const { activeWorkspace, ready } = useWorkspace();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(1);

  const [campaigns, setCampaigns] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  const [tags, setTags] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [manageTagsOpen, setManageTagsOpen] = useState(false);

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
    refreshTags();
  }, [refreshTags]);

  useEffect(() => {
    setPage(1);
  }, [workspaceId, debouncedSearch, status, sort]);

  useEffect(() => {
    if (!workspaceId) return undefined;

    let current = true;
    setLoading(true);
    setError('');

    listCampaigns({
      workspaceId,
      search: debouncedSearch,
      status,
      sort,
      page,
      limit: PAGE_SIZE,
    })
      .then((result) => {
        if (!current) return;
        setCampaigns(result.campaigns);
        setPagination(result.pagination);
      })
      .catch((err) => {
        if (current) setError(err.message || 'Unable to load campaigns');
      })
      .finally(() => {
        if (current) setLoading(false);
      });

    return () => {
      current = false;
    };
  }, [workspaceId, debouncedSearch, status, sort, page, reloadToken]);

  async function handleCreateTag(name) {
    const tag = await createTag({ workspaceId, name });
    await refreshTags();
    return tag;
  }

  function openCreate() {
    setDialogMode('create');
    setActiveCampaign(null);
    setDialogOpen(true);
  }

  function openEdit(campaign) {
    setDialogMode('edit');
    setActiveCampaign(campaign);
    setDialogOpen(true);
  }

  function openDetails(campaign) {
    navigate(`/app/campaigns/${campaign.id}`);
  }

  function handleSaved(_saved, mode) {
    setDialogOpen(false);
    setActiveCampaign(null);
    toast.success(mode === 'edit' ? 'Campaign updated' : 'Campaign created');
    reload();
  }

  async function handleToggleStatus(campaign) {
    const nextStatus = campaign.status === 'archived' ? 'active' : 'archived';
    setBusyId(campaign.id);
    try {
      await updateCampaign(campaign.id, { status: nextStatus });
      toast.success(nextStatus === 'archived' ? 'Campaign archived' : 'Campaign reactivated');
      reload();
    } catch (err) {
      toast.error(err.message || 'Unable to update campaign');
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCampaignRequest(deleteTarget.id);
      toast.success('Campaign deleted. Its links were kept.');
      setDeleteTarget(null);
      if (campaigns.length === 1 && page > 1) {
        setPage((value) => value - 1);
      } else {
        reload();
      }
    } catch (err) {
      toast.error(err.message || 'Unable to delete campaign');
    } finally {
      setDeleting(false);
    }
  }

  const hasFilters = debouncedSearch.trim() !== '' || status !== 'all';
  const totalPages = pagination?.totalPages || 1;

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
          <h1 className="text-2xl font-semibold tracking-tight text-ink-100">Campaigns</h1>
          <p className="mt-1 text-sm text-ink-400">
            Group links into campaigns and measure their performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" icon={Tags} onClick={() => setManageTagsOpen(true)}>
            Manage tags
          </Button>
          <Button icon={Plus} onClick={openCreate} disabled={!canEdit || !workspaceId}>
            New campaign
          </Button>
        </div>
      </div>

      {!canEdit && (
        <div className="rounded-xl border border-warn-500/40 bg-warn-500/10 px-4 py-3 text-sm text-warn-400">
          You have read-only access to this workspace. An editor role is required to manage campaigns.
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          icon={Search}
          placeholder="Search campaigns"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className="sm:max-w-sm"
        />
        <Select
          value={status}
          options={STATUS_FILTERS}
          onChange={(event) => setStatus(event.target.value)}
          className="sm:w-44"
        />
        <Select
          value={sort}
          options={SORT_OPTIONS}
          onChange={(event) => setSort(event.target.value)}
          className="sm:w-44"
        />
      </div>

      {error ? (
        <div className="surface-card flex flex-col items-start gap-3 border-danger-500/30 p-5">
          <div className="flex items-center gap-2 text-danger-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Could not load campaigns</span>
          </div>
          <p className="text-sm text-ink-400">{error}</p>
          <Button variant="secondary" icon={RefreshCw} onClick={reload}>
            Retry
          </Button>
        </div>
      ) : loading && campaigns.length === 0 ? (
        <div className="flex justify-center py-20">
          <Spinner label="Loading campaigns..." />
        </div>
      ) : campaigns.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon={Search}
            title="No campaigns match your filters"
            description="Try a different search term or clear the filters."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchInput('');
                  setStatus('all');
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Megaphone}
            title="No campaigns yet"
            description="Create a campaign to group links and track shared performance."
            action={
              <Button icon={Plus} onClick={openCreate} disabled={!canEdit}>
                Create a campaign
              </Button>
            }
          />
        )
      ) : (
        <>
          <CampaignTable
            campaigns={campaigns}
            busyId={busyId}
            onOpen={openDetails}
            onEdit={openEdit}
            onToggleStatus={handleToggleStatus}
            onDelete={setDeleteTarget}
          />

          <div className="space-y-3 md:hidden">
            {campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                busy={busyId === campaign.id}
                onOpen={openDetails}
                onEdit={openEdit}
                onToggleStatus={handleToggleStatus}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>

          {pagination && pagination.total > 0 && (
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-xs text-ink-500">
                {formatNumber(pagination.total)} campaign{pagination.total === 1 ? '' : 's'} · page{' '}
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

      <CampaignFormDialog
        open={dialogOpen}
        mode={dialogMode}
        campaign={activeCampaign}
        workspaceId={workspaceId}
        tags={tags}
        onCreateTag={handleCreateTag}
        onClose={() => {
          setDialogOpen(false);
          setActiveCampaign(null);
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

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete campaign"
        description={`"${deleteTarget?.name || 'This campaign'}" will be deleted. Its links are kept and simply detached from the campaign — no links or click history are removed.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={confirmDelete}>
              Delete campaign
            </Button>
          </>
        }
      />
    </div>
  );
}
