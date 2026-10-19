import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Check,
  Contact,
  Copy,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Badge from '../components/ui/Badge.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Dialog from '../components/ui/Dialog.jsx';
import Dropdown, { DropdownItem, DropdownDivider } from '../components/ui/Dropdown.jsx';
import { useWorkspace } from '../hooks/useWorkspace.js';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import {
  deleteBioPage,
  listBioPages,
  publishBioPage,
} from '../services/bioPage.service.js';
import { formatDate, formatNumber } from '../utils/format.js';
import { publicBioUrl } from '../utils/bio.js';

const PAGE_SIZE = 9;
const EDIT_ROLES = ['owner', 'admin', 'editor'];

export default function BioPages() {
  const { activeWorkspace, ready } = useWorkspace();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const [page, setPage] = useState(1);

  const [bioPages, setBioPages] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  const [busyId, setBusyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

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

  useEffect(() => {
    setPage(1);
  }, [workspaceId, debouncedSearch]);

  useEffect(() => {
    if (!workspaceId) return undefined;

    let current = true;
    setLoading(true);
    setError('');

    listBioPages({ workspaceId, search: debouncedSearch, page, limit: PAGE_SIZE })
      .then((result) => {
        if (!current) return;
        setBioPages(result.bioPages);
        setPagination(result.pagination);
      })
      .catch((err) => {
        if (current) setError(err.message || 'Unable to load bio pages');
      })
      .finally(() => {
        if (current) setLoading(false);
      });

    return () => {
      current = false;
    };
  }, [workspaceId, debouncedSearch, page, reloadToken]);

  async function handleTogglePublish(bioPage) {
    setBusyId(bioPage.id);
    try {
      await publishBioPage(bioPage.id, !bioPage.isPublished);
      toast.success(bioPage.isPublished ? 'Bio page unpublished' : 'Bio page published');
      reload();
    } catch (err) {
      toast.error(err.message || 'Unable to update bio page');
    } finally {
      setBusyId(null);
    }
  }

  async function handleCopy(bioPage) {
    const url = publicBioUrl(bioPage.username);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(bioPage.id);
      toast.success('Public URL copied');
      setTimeout(() => setCopiedId((value) => (value === bioPage.id ? null : value)), 1500);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteBioPage(deleteTarget.id);
      toast.success('Bio page deleted');
      setDeleteTarget(null);
      if (bioPages.length === 1 && page > 1) {
        setPage((value) => value - 1);
      } else {
        reload();
      }
    } catch (err) {
      toast.error(err.message || 'Unable to delete bio page');
    } finally {
      setDeleting(false);
    }
  }

  const hasSearch = debouncedSearch.trim() !== '';
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
          <h1 className="text-2xl font-semibold tracking-tight text-ink-100">Bio Pages</h1>
          <p className="mt-1 text-sm text-ink-400">
            Publish a mobile-first link-in-bio page under your brand.
          </p>
        </div>
        <Button
          icon={Plus}
          onClick={() => navigate('/app/bio-pages/new')}
          disabled={!canEdit || !workspaceId}
        >
          New bio page
        </Button>
      </div>

      {!canEdit && (
        <div className="rounded-xl border border-warn-500/40 bg-warn-500/10 px-4 py-3 text-sm text-warn-400">
          You have read-only access to this workspace. An editor role is required to manage bio pages.
        </div>
      )}

      <Input
        icon={Search}
        placeholder="Search bio pages"
        value={searchInput}
        onChange={(event) => setSearchInput(event.target.value)}
        className="sm:max-w-sm"
      />

      {error ? (
        <div className="surface-card flex flex-col items-start gap-3 border-danger-500/30 p-5">
          <div className="flex items-center gap-2 text-danger-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Could not load bio pages</span>
          </div>
          <p className="text-sm text-ink-400">{error}</p>
          <Button variant="secondary" icon={RefreshCw} onClick={reload}>
            Retry
          </Button>
        </div>
      ) : loading && bioPages.length === 0 ? (
        <div className="flex justify-center py-20">
          <Spinner label="Loading bio pages..." />
        </div>
      ) : bioPages.length === 0 ? (
        hasSearch ? (
          <EmptyState
            icon={Search}
            title="No bio pages match your search"
            description="Try a different search term."
            action={
              <Button variant="secondary" onClick={() => setSearchInput('')}>
                Clear search
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Contact}
            title="No bio pages yet"
            description="Create a bio page to share all your links from a single URL."
            action={
              <Button
                icon={Plus}
                onClick={() => navigate('/app/bio-pages/new')}
                disabled={!canEdit}
              >
                Create a bio page
              </Button>
            }
          />
        )
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 stagger-children sm:grid-cols-2 lg:grid-cols-3">
            {bioPages.map((bioPage) => (
              <div key={bioPage.id} className="surface-card interactive-lift flex flex-col gap-4 p-4 hover:border-accent-600">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => navigate(`/app/bio-pages/${bioPage.id}`)}
                      className="block truncate text-left font-medium text-ink-100 hover:text-accent-300"
                    >
                      {bioPage.title || `@${bioPage.username}`}
                    </button>
                    <p className="mt-0.5 truncate text-xs text-ink-500">/bio/{bioPage.username}</p>
                  </div>
                  <Dropdown
                    trigger={
                      <button
                        type="button"
                        disabled={busyId === bioPage.id}
                        className="rounded-lg p-1.5 text-ink-400 transition hover:bg-base-800 hover:text-ink-100 disabled:opacity-50"
                        aria-label="Bio page actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    }
                  >
                    <DropdownItem icon={Pencil} onClick={() => navigate(`/app/bio-pages/${bioPage.id}`)}>
                      Edit
                    </DropdownItem>
                    <DropdownItem icon={ExternalLink} onClick={() => window.open(publicBioUrl(bioPage.username), '_blank', 'noopener')}>
                      Open public page
                    </DropdownItem>
                    <DropdownItem icon={Copy} onClick={() => handleCopy(bioPage)}>
                      Copy public URL
                    </DropdownItem>
                    <DropdownDivider />
                    <DropdownItem
                      icon={Power}
                      onClick={() => handleTogglePublish(bioPage)}
                    >
                      {bioPage.isPublished ? 'Unpublish' : 'Publish'}
                    </DropdownItem>
                    <DropdownItem icon={Trash2} danger onClick={() => setDeleteTarget(bioPage)}>
                      Delete
                    </DropdownItem>
                  </Dropdown>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-400">
                  <Badge tone={bioPage.isPublished ? 'accent' : 'neutral'}>
                    {bioPage.isPublished ? 'Published' : 'Draft'}
                  </Badge>
                  <span>{formatNumber(bioPage.links?.length || 0)} links</span>
                  <span>Updated {formatDate(bioPage.updatedAt)}</span>
                </div>

                <div className="mt-auto flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/app/bio-pages/${bioPage.id}`)}
                    disabled={!canEdit}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={copiedId === bioPage.id ? Check : Copy}
                    onClick={() => handleCopy(bioPage)}
                  >
                    {copiedId === bioPage.id ? 'Copied' : 'Copy URL'}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {pagination && pagination.total > 0 && (
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-xs text-ink-500">
                {formatNumber(pagination.total)} bio page{pagination.total === 1 ? '' : 's'} · page{' '}
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

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete bio page"
        description={`"${deleteTarget?.title || `@${deleteTarget?.username || ''}`}" will be permanently deleted. The underlying links are kept.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={confirmDelete}>
              Delete bio page
            </Button>
          </>
        }
      />
    </div>
  );
}
