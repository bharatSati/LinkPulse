import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, Link2, QrCode, RefreshCw, Search } from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import QrPanel from '../components/qr/QrPanel.jsx';
import { useWorkspace } from '../hooks/useWorkspace.js';
import { useAuth } from '../hooks/useAuth.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { listLinks, getLink } from '../services/link.service.js';
import { formatNumber } from '../utils/format.js';

const PAGE_SIZE = 8;
const EDIT_ROLES = ['owner', 'admin', 'editor'];

export default function QrCodes() {
  const { activeWorkspace, ready } = useWorkspace();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const [page, setPage] = useState(1);

  const [links, setLinks] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  const [selectedId, setSelectedId] = useState(() => searchParams.get('link') || '');
  const [selectedLink, setSelectedLink] = useState(null);
  const [selectedLoading, setSelectedLoading] = useState(false);

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

  useEffect(() => {
    if (!workspaceId) return undefined;
    let current = true;
    setLoading(true);
    setError('');

    listLinks({ workspaceId, search: debouncedSearch, page, limit: PAGE_SIZE })
      .then((result) => {
        if (!current) return;
        setLinks(result.links);
        setPagination(result.pagination);
        setSelectedId((currentId) => {
          if (currentId && result.links.some((link) => link.id === currentId)) return currentId;
          return result.links[0]?.id || '';
        });
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
  }, [workspaceId, debouncedSearch, page, reloadToken]);

  useEffect(() => {
    setPage(1);
  }, [workspaceId, debouncedSearch]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedLink(null);
      return undefined;
    }

    const fromList = links.find((link) => link.id === selectedId);
    if (fromList) {
      setSelectedLink(fromList);
      return undefined;
    }

    let current = true;
    setSelectedLoading(true);
    getLink(selectedId)
      .then((link) => {
        if (current) setSelectedLink(link);
      })
      .catch(() => {
        if (current) setSelectedLink(null);
      })
      .finally(() => {
        if (current) setSelectedLoading(false);
      });

    return () => {
      current = false;
    };
  }, [selectedId, links]);

  function selectLink(id) {
    setSelectedId(id);
    const next = new URLSearchParams(searchParams);
    next.set('link', id);
    setSearchParams(next, { replace: true });
  }

  if (!ready && !activeWorkspace) {
    return (
      <div className="flex justify-center py-24">
        <Spinner label="Preparing your workspace..." />
      </div>
    );
  }

  const totalPages = pagination?.totalPages || 1;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-100">QR Codes</h1>
        <p className="mt-1 text-sm text-ink-400">
          Generate and download QR codes that point at your short links.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-3">
          <Input
            icon={Search}
            placeholder="Search links"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />

          {error ? (
            <div className="surface-card flex flex-col items-start gap-3 border-danger-500/30 p-4">
              <div className="flex items-center gap-2 text-danger-400">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Could not load links</span>
              </div>
              <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => setReloadToken((t) => t + 1)}>
                Retry
              </Button>
            </div>
          ) : loading && links.length === 0 ? (
            <div className="surface-card flex justify-center py-16">
              <Spinner label="Loading links..." />
            </div>
          ) : links.length === 0 ? (
            <EmptyState
              icon={Link2}
              title={debouncedSearch ? 'No matches' : 'No links yet'}
              description={
                debouncedSearch
                  ? 'Try a different search term.'
                  : 'Create a link first, then generate its QR code.'
              }
            />
          ) : (
            <>
              <div className="surface-card divide-y divide-base-800 overflow-hidden p-0">
                {links.map((link) => {
                  const active = link.id === selectedId;
                  return (
                    <button
                      key={link.id}
                      type="button"
                      onClick={() => selectLink(link.id)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                        active ? 'bg-accent-500/10' : 'hover:bg-base-850'
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          active ? 'bg-accent-500/20 text-accent-300' : 'bg-base-800 text-ink-400'
                        }`}
                      >
                        <QrCode className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink-100">
                          {link.title || 'Untitled link'}
                        </span>
                        <span className="block truncate font-mono text-xs text-ink-500">
                          /{link.code}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {pagination && pagination.total > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-ink-500">
                    {formatNumber(pagination.total)} link{pagination.total === 1 ? '' : 's'}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={page <= 1 || loading}
                      onClick={() => setPage((value) => Math.max(value - 1, 1))}
                    >
                      Prev
                    </Button>
                    <span className="text-xs text-ink-500">
                      {pagination.page}/{totalPages}
                    </span>
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
        </div>

        <div className="surface-card p-5">
          {selectedLoading ? (
            <div className="flex justify-center py-20">
              <Spinner label="Loading link..." />
            </div>
          ) : selectedLink ? (
            <QrPanel
              link={selectedLink}
              canEdit={canEdit}
              onSaved={(data) => {
                setSelectedLink(data.link);
                setLinks((current) =>
                  current.map((item) => (item.id === data.link.id ? data.link : item))
                );
              }}
            />
          ) : (
            <EmptyState
              icon={QrCode}
              title="Select a link"
              description="Choose a link on the left to preview and download its QR code."
            />
          )}
        </div>
      </div>
    </div>
  );
}
