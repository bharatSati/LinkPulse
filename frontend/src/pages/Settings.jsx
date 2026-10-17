import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  Check,
  Contact,
  ExternalLink,
  Eye,
  Link2,
  LogOut,
  Megaphone,
  RefreshCw,
  Save,
  Settings as SettingsIcon,
  Tag,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Badge from '../components/ui/Badge.jsx';
import Card, { CardHeader } from '../components/ui/Card.jsx';
import Dialog from '../components/ui/Dialog.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { useWorkspace } from '../hooks/useWorkspace.js';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import {
  deleteWorkspace,
  getOverview,
  leaveWorkspace,
  updateWorkspace,
} from '../services/workspace.service.js';
import { PERMISSIONS, ROLE_DESCRIPTIONS, roleLabel } from '../utils/permissions.js';
import { formatDate, formatNumber } from '../utils/format.js';

const COUNT_META = [
  { key: 'members', label: 'Members', icon: Users },
  { key: 'pendingInvitations', label: 'Pending invites', icon: Users },
  { key: 'links', label: 'Links', icon: Link2 },
  { key: 'campaigns', label: 'Campaigns', icon: Megaphone },
  { key: 'tags', label: 'Tags', icon: Tag },
  { key: 'bioPages', label: 'Bio pages', icon: Contact },
  { key: 'clicks', label: 'Tracked clicks', icon: BarChart3 },
];

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { activeWorkspace, ready, role, can, refresh } = useWorkspace();

  const workspaceId = activeWorkspace?._id;
  const canUpdate = can(PERMISSIONS.WORKSPACE_UPDATE);
  const canDelete = can(PERMISSIONS.WORKSPACE_DELETE);
  const canLeave = can(PERMISSIONS.WORKSPACE_LEAVE) && role !== 'owner';

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    if (activeWorkspace) setName(activeWorkspace.name);
  }, [activeWorkspace]);

  useEffect(() => {
    if (!workspaceId) return undefined;

    let current = true;
    setLoading(true);
    setError('');

    getOverview(workspaceId)
      .then((data) => {
        if (current) setOverview(data);
      })
      .catch((err) => {
        if (current) setError(err.message || 'Unable to load workspace overview');
      })
      .finally(() => {
        if (current) setLoading(false);
      });

    return () => {
      current = false;
    };
  }, [workspaceId, reloadToken]);

  async function saveName(event) {
    event.preventDefault();
    if (!name.trim() || name.trim() === activeWorkspace.name) return;

    setSavingName(true);
    try {
      await updateWorkspace(workspaceId, { name: name.trim() });
      toast.success('Workspace updated');
      refresh();
      reload();
    } catch (err) {
      toast.error(err.message || 'Unable to update workspace');
    } finally {
      setSavingName(false);
    }
  }

  async function confirmLeave() {
    setLeaving(true);
    try {
      await leaveWorkspace(workspaceId);
      toast.success('You left the workspace');
      setLeaveOpen(false);
      await refresh();
      navigate('/app', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Unable to leave workspace');
    } finally {
      setLeaving(false);
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deleteWorkspace(workspaceId, deleteConfirm.trim());
      toast.success('Workspace deleted');
      setDeleteOpen(false);
      await refresh();
      navigate('/app', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Unable to delete workspace');
    } finally {
      setDeleting(false);
    }
  }

  if (!ready && !activeWorkspace) {
    return (
      <div className="flex justify-center py-24">
        <Spinner label="Preparing your workspace..." />
      </div>
    );
  }

  if (!activeWorkspace) {
    return (
      <EmptyState
        icon={SettingsIcon}
        title="No workspace selected"
        description="Create or select a workspace to configure settings."
      />
    );
  }

  const counts = overview?.counts;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-100">Settings</h1>
        <p className="mt-1 text-sm text-ink-400">
          Manage workspace preferences and your account.
        </p>
      </div>

      {error && (
        <div className="surface-card flex flex-col items-start gap-3 border-danger-500/30 p-5">
          <div className="flex items-center gap-2 text-danger-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Could not load workspace overview</span>
          </div>
          <p className="text-sm text-ink-400">{error}</p>
          <Button variant="secondary" icon={RefreshCw} onClick={reload}>
            Retry
          </Button>
        </div>
      )}

      <Card>
        <CardHeader
          title="Workspace"
          description="General information about this workspace."
          action={<Badge tone="accent">{roleLabel(role)}</Badge>}
        />
        <form onSubmit={saveName} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Input
            label="Workspace name"
            value={name}
            disabled={!canUpdate}
            onChange={(event) => setName(event.target.value)}
            className="sm:max-w-md"
          />
          <Button
            type="submit"
            icon={Save}
            loading={savingName}
            disabled={!canUpdate || !name.trim() || name.trim() === activeWorkspace.name}
          >
            Save
          </Button>
        </form>
        {!canUpdate && (
          <p className="mt-3 text-xs text-ink-500">
            An admin or owner role is required to change workspace settings.
          </p>
        )}
        <p className="mt-3 text-xs text-ink-500">
          Created {formatDate(activeWorkspace.createdAt)} · Role permissions:{' '}
          {ROLE_DESCRIPTIONS[role]}
        </p>
      </Card>

      <Card>
        <CardHeader
          title="Workspace overview"
          description="Live resource counts for this workspace."
        />
        {loading && !counts ? (
          <div className="flex justify-center py-8">
            <Spinner label="Loading overview..." />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {COUNT_META.map((meta) => {
              const Icon = meta.icon;
              return (
                <div
                  key={meta.key}
                  className="rounded-xl border border-base-700 bg-base-850 p-3"
                >
                  <div className="flex items-center gap-2 text-ink-500">
                    <Icon className="h-3.5 w-3.5" />
                    <span className="text-[11px] font-medium uppercase tracking-wider">
                      {meta.label}
                    </span>
                  </div>
                  <p className="mt-2 text-xl font-semibold text-ink-100">
                    {formatNumber(counts?.[meta.key] ?? 0)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Your account" description="Signed-in profile." />
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-none bg-base-800 text-ink-200">
            <UserRound className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-medium text-ink-100">{user?.name}</p>
            <p className="text-xs text-ink-500">{user?.email}</p>
          </div>
        </div>
      </Card>

      <Card className="border-danger-500/30">
        <CardHeader
          title="Danger zone"
          description="Leaving removes your access. Deleting permanently removes all workspace data."
        />
        <div className="space-y-3">
          {canLeave && (
            <div className="flex flex-col gap-3 rounded-xl border border-base-700 bg-base-850 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-ink-100">Leave workspace</p>
                <p className="text-xs text-ink-500">
                  You will lose access until you are invited again. Links and history stay intact.
                </p>
              </div>
              <Button variant="secondary" icon={LogOut} onClick={() => setLeaveOpen(true)}>
                Leave
              </Button>
            </div>
          )}

          {canDelete && (
            <div className="flex flex-col gap-3 rounded-xl border border-danger-500/30 bg-danger-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-danger-300">Delete workspace</p>
                <p className="text-xs text-ink-500">
                  Permanently deletes this workspace and all of its links, campaigns, bio pages,
                  and click history.
                </p>
              </div>
              <Button variant="danger" icon={Trash2} onClick={() => { setDeleteConfirm(''); setDeleteOpen(true); }}>
                Delete
              </Button>
            </div>
          )}

          {!canLeave && !canDelete && (
            <p className="text-sm text-ink-500">
              Only the workspace owner can delete it, and members with an admin or higher role can
              manage other settings.
            </p>
          )}
        </div>
      </Card>

      <p className="flex items-center justify-center gap-1.5 text-xs text-ink-600">
        <Eye className="h-3.5 w-3.5" />
        <Check className="h-3.5 w-3.5" />
        <ExternalLink className="h-3.5 w-3.5" />
        Permissions are enforced on the server for every action.
      </p>

      <Dialog
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        title="Leave workspace"
        description={`You will be removed from ${activeWorkspace.name}.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setLeaveOpen(false)} disabled={leaving}>
              Cancel
            </Button>
            <Button variant="danger" loading={leaving} onClick={confirmLeave}>
              Leave workspace
            </Button>
          </>
        }
      />

      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete workspace"
        description={`This permanently deletes "${activeWorkspace.name}" and all of its data. This cannot be undone.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleting}
              disabled={deleteConfirm.trim() !== activeWorkspace.name}
              onClick={confirmDelete}
            >
              Delete workspace
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="rounded-xl border border-danger-500/30 bg-danger-500/10 px-3 py-2.5 text-xs text-danger-300">
            All links, click history, campaigns, tags, and bio pages in this workspace will be
            deleted.
          </p>
          <Input
            label={`Type "${activeWorkspace.name}" to confirm`}
            placeholder={activeWorkspace.name}
            value={deleteConfirm}
            onChange={(event) => setDeleteConfirm(event.target.value)}
          />
        </div>
      </Dialog>
    </div>
  );
}
