import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRightLeft,
  Building2,
  Check,
  Copy,
  Crown,
  Mail,
  MailPlus,
  RefreshCw,
  ShieldAlert,
  Trash2,
  UserMinus,
} from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Select from '../components/ui/Select.jsx';
import Badge from '../components/ui/Badge.jsx';
import { CardHeader } from '../components/ui/Card.jsx';
import Dialog from '../components/ui/Dialog.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { useWorkspace } from '../hooks/useWorkspace.js';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import {
  createInvitation,
  listAuditLogs,
  listInvitations,
  listMembers,
  removeMember,
  resendInvitation,
  revokeInvitation,
  transferOwnership,
  updateMemberRole,
} from '../services/workspace.service.js';
import {
  PERMISSIONS,
  ROLE_DESCRIPTIONS,
  assignableRoles,
  canManageMember,
  roleLabel,
} from '../utils/permissions.js';
import { describeAudit, auditActionLabel } from '../utils/activity.js';
import { formatDate, formatDateTime, formatNumber } from '../utils/format.js';

const STATUS_TONES = {
  pending: 'accent',
  accepted: 'neutral',
  revoked: 'danger',
  expired: 'warn',
  declined: 'neutral',
};

const ROLE_TONES = {
  owner: 'accent',
  admin: 'accent',
  editor: 'neutral',
  analyst: 'neutral',
  viewer: 'neutral',
};

function InviteLinkBox({ url, onCopied }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      onCopied?.();
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be unavailable */
    }
  }

  return (
    <div className="rounded-xl border border-base-700 bg-base-850 p-3">
      <p className="text-xs font-medium text-ink-300">Share this invite link</p>
      <div className="mt-2 flex items-center gap-2">
        <input
          readOnly
          value={url}
          className="h-9 w-full rounded-lg border border-base-600 bg-base-900 px-2 text-xs text-ink-300"
          onFocus={(event) => event.target.select()}
        />
        <Button
          variant="secondary"
          size="sm"
          icon={copied ? Check : Copy}
          onClick={copy}
        >
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <p className="mt-2 text-[11px] text-ink-500">
        Email delivery is not configured, so no email was sent. Share the link with the invitee
        directly.
      </p>
    </div>
  );
}

export default function Team() {
  const { activeWorkspace, ready, role, can, refresh } = useWorkspace();
  const { user } = useAuth();
  const { toast } = useToast();

  const workspaceId = activeWorkspace?._id;

  const canInvite = can(PERMISSIONS.MEMBERS_INVITE);
  const canManageRoles = can(PERMISSIONS.MEMBERS_ROLE_UPDATE);
  const canRemove = can(PERMISSIONS.MEMBERS_REMOVE);
  const canTransfer = can(PERMISSIONS.OWNERSHIP_TRANSFER);
  const canViewAudit = can(PERMISSIONS.AUDIT_VIEW);
  const roleOptions = useMemo(() => assignableRoles(role), [role]);

  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);
  const [busyId, setBusyId] = useState(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'viewer' });
  const [inviteError, setInviteError] = useState('');
  const [inviting, setInviting] = useState(false);
  const [latestInviteUrl, setLatestInviteUrl] = useState('');

  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);

  const [transferOpen, setTransferOpen] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState('');
  const [transferConfirm, setTransferConfirm] = useState('');
  const [transferring, setTransferring] = useState(false);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    if (!workspaceId) return undefined;

    let current = true;
    setLoading(true);
    setError('');

    const tasks = [listMembers(workspaceId)];
    tasks.push(canInvite ? listInvitations(workspaceId) : Promise.resolve([]));
    tasks.push(canViewAudit ? listAuditLogs(workspaceId, 20) : Promise.resolve([]));

    Promise.all(tasks)
      .then(([memberList, inviteList, activityList]) => {
        if (!current) return;
        setMembers(memberList);
        setInvitations(inviteList);
        setActivity(activityList);
      })
      .catch((err) => {
        if (current) setError(err.message || 'Unable to load team');
      })
      .finally(() => {
        if (current) setLoading(false);
      });

    return () => {
      current = false;
    };
  }, [workspaceId, canInvite, canViewAudit, reloadToken]);

  const transferableMembers = useMemo(
    () => members.filter((member) => member.role !== 'owner'),
    [members]
  );

  function openInvite() {
    const defaultRole = roleOptions.includes('viewer') ? 'viewer' : roleOptions[0] || 'viewer';
    setInviteForm({ email: '', role: defaultRole });
    setInviteError('');
    setLatestInviteUrl('');
    setInviteOpen(true);
  }

  async function submitInvite(event) {
    event.preventDefault();
    if (!inviteForm.email.trim()) {
      setInviteError('Email is required');
      return;
    }

    setInviting(true);
    setInviteError('');
    try {
      const result = await createInvitation(workspaceId, {
        email: inviteForm.email.trim(),
        role: inviteForm.role,
      });
      toast.success(
        result.emailSent ? 'Invitation sent' : 'Invitation created — copy the link to share'
      );
      if (result.inviteUrl) setLatestInviteUrl(result.inviteUrl);
      setInviteForm((current) => ({ ...current, email: '' }));
      reload();
    } catch (err) {
      setInviteError(err.message || 'Unable to create invitation');
    } finally {
      setInviting(false);
    }
  }

  async function handleResend(invitation) {
    setBusyId(invitation.id);
    try {
      const result = await resendInvitation(workspaceId, invitation.id);
      toast.success('Invitation refreshed — copy the link to share');
      if (result.inviteUrl) setLatestInviteUrl(result.inviteUrl);
      reload();
    } catch (err) {
      toast.error(err.message || 'Unable to resend invitation');
    } finally {
      setBusyId(null);
    }
  }

  async function handleRevoke(invitation) {
    setBusyId(invitation.id);
    try {
      await revokeInvitation(workspaceId, invitation.id);
      toast.success('Invitation revoked');
      reload();
    } catch (err) {
      toast.error(err.message || 'Unable to revoke invitation');
    } finally {
      setBusyId(null);
    }
  }

  async function handleRoleChange(member, nextRole) {
    if (nextRole === member.role) return;
    setBusyId(member.id);
    try {
      await updateMemberRole(workspaceId, member.id, nextRole);
      toast.success(`${member.name || member.email} is now ${roleLabel(nextRole)}`);
      reload();
      refresh();
    } catch (err) {
      toast.error(err.message || 'Unable to change role');
    } finally {
      setBusyId(null);
    }
  }

  async function confirmRemove() {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await removeMember(workspaceId, removeTarget.id);
      toast.success('Member removed');
      setRemoveTarget(null);
      reload();
    } catch (err) {
      toast.error(err.message || 'Unable to remove member');
    } finally {
      setRemoving(false);
    }
  }

  async function confirmTransfer() {
    if (!transferTargetId) return;
    setTransferring(true);
    try {
      await transferOwnership(workspaceId, transferTargetId);
      toast.success('Ownership transferred');
      setTransferOpen(false);
      setTransferTargetId('');
      setTransferConfirm('');
      reload();
      refresh();
    } catch (err) {
      toast.error(err.message || 'Unable to transfer ownership');
    } finally {
      setTransferring(false);
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
        icon={Building2}
        title="No workspace selected"
        description="Create or select a workspace to manage your team."
      />
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-100">Team</h1>
          <p className="mt-1 text-sm text-ink-400">
            Manage members, roles, and invitations for {activeWorkspace.name}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="neutral">
            You are {roleLabel(role)} · {formatNumber(members.length)} member
            {members.length === 1 ? '' : 's'}
          </Badge>
          {canInvite && (
            <Button icon={MailPlus} onClick={openInvite}>
              Invite member
            </Button>
          )}
        </div>
      </div>

      {!canInvite && (
        <div className="rounded-xl border border-warn-500/40 bg-warn-500/10 px-4 py-3 text-sm text-warn-400">
          You have read access to the team. An admin or owner role is required to invite or manage
          members.
        </div>
      )}

      {error ? (
        <div className="surface-card flex flex-col items-start gap-3 border-danger-500/30 p-5">
          <div className="flex items-center gap-2 text-danger-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Could not load the team</span>
          </div>
          <p className="text-sm text-ink-400">{error}</p>
          <Button variant="secondary" icon={RefreshCw} onClick={reload}>
            Retry
          </Button>
        </div>
      ) : loading && members.length === 0 ? (
        <div className="flex justify-center py-20">
          <Spinner label="Loading members..." />
        </div>
      ) : (
        <div className="surface-card">
          <div className="border-b border-base-800 p-5">
            <CardHeader
              title="Members"
              description="Roles determine what each person can do in this workspace."
              className="mb-0"
              action={
                canTransfer && transferableMembers.length > 0 ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={ArrowRightLeft}
                    onClick={() => {
                      setTransferTargetId('');
                      setTransferConfirm('');
                      setTransferOpen(true);
                    }}
                  >
                    Transfer ownership
                  </Button>
                ) : null
              }
            />
          </div>

          <ul className="divide-y divide-base-800">
            {members.map((member) => {
              const isSelf = user?._id === member.id;
              const isOwnerRow = member.role === 'owner';
              const manageable =
                canManageRoles && !isSelf && !isOwnerRow && canManageMember(role, member.role);
              const options = Array.from(new Set([...roleOptions, member.role]));

              return (
                <li
                  key={member.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-none bg-base-800 text-sm font-medium text-ink-200">
                      {(member.name || member.email || '?').slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 truncate text-sm font-medium text-ink-100">
                        {member.name || member.email}
                        {isOwnerRow && <Crown className="h-3.5 w-3.5 text-accent-400" />}
                        {isSelf && <span className="text-xs text-ink-500">(you)</span>}
                      </p>
                      <p className="truncate text-xs text-ink-500">
                        {member.email} · joined {formatDate(member.joinedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge tone={ROLE_TONES[member.role] || 'neutral'}>{roleLabel(member.role)}</Badge>
                    <Select
                      aria-label={`Role for ${member.name || member.email}`}
                      value={member.role}
                      disabled={!manageable || busyId === member.id}
                      onChange={(event) => handleRoleChange(member, event.target.value)}
                      className="w-36"
                      options={options.map((option) => ({
                        value: option,
                        label: roleLabel(option),
                      }))}
                    />
                    {canRemove && manageable && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-danger-400 hover:bg-danger-500/10"
                        icon={UserMinus}
                        onClick={() => setRemoveTarget(member)}
                        aria-label={`Remove ${member.name || member.email}`}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {canInvite && (
        <div className="surface-card">
          <div className="border-b border-base-800 p-5">
            <CardHeader
              title="Pending invitations"
              description="Invitations expire automatically and can be resent or revoked."
              className="mb-0"
            />
          </div>

          {latestInviteUrl && (
            <div className="border-b border-base-800 p-5">
              <InviteLinkBox url={latestInviteUrl} onCopied={() => toast.success('Link copied')} />
            </div>
          )}

          {invitations.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={Mail}
                title="No invitations yet"
                description="Invite a teammate by email to add them to this workspace."
                action={
                  <Button icon={MailPlus} onClick={openInvite}>
                    Invite member
                  </Button>
                }
              />
            </div>
          ) : (
            <ul className="divide-y divide-base-800">
              {invitations.map((invitation) => (
                <li
                  key={invitation.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-100">{invitation.email}</p>
                    <p className="truncate text-xs text-ink-500">
                      {roleLabel(invitation.role)} · expires {formatDateTime(invitation.expiresAt)}
                      {invitation.invitedBy?.name ? ` · invited by ${invitation.invitedBy.name}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={STATUS_TONES[invitation.status] || 'neutral'}>
                      {invitation.status}
                    </Badge>
                    {invitation.status !== 'accepted' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busyId === invitation.id}
                        onClick={() => handleResend(invitation)}
                      >
                        Resend
                      </Button>
                    )}
                    {invitation.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-danger-400 hover:bg-danger-500/10"
                        disabled={busyId === invitation.id}
                        icon={Trash2}
                        onClick={() => handleRevoke(invitation)}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {canViewAudit && (
        <div className="surface-card">
          <div className="border-b border-base-800 p-5">
            <CardHeader
              title="Workspace activity"
              description="Recent administrative actions in this workspace."
              className="mb-0"
            />
          </div>
          {activity.length === 0 ? (
            <p className="p-5 text-sm text-ink-500">No activity recorded yet.</p>
          ) : (
            <ul className="divide-y divide-base-800">
              {activity.map((log) => (
                <li key={log.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink-200">{describeAudit(log)}</p>
                    <p className="text-[11px] text-ink-500">{auditActionLabel(log.action)}</p>
                  </div>
                  <span className="shrink-0 text-xs text-ink-500">
                    {formatDateTime(log.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Dialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite a member"
        description={`Invite someone to ${activeWorkspace.name}.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setInviteOpen(false)} disabled={inviting}>
              Done
            </Button>
            <Button
              icon={MailPlus}
              loading={inviting}
              disabled={!inviteForm.email.trim()}
              onClick={submitInvite}
            >
              Send invitation
            </Button>
          </>
        }
      >
        <form onSubmit={submitInvite} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            icon={Mail}
            placeholder="teammate@company.com"
            value={inviteForm.email}
            error={inviteError}
            onChange={(event) => {
              setInviteForm((current) => ({ ...current, email: event.target.value }));
              setInviteError('');
            }}
          />
          <Select
            label="Role"
            value={inviteForm.role}
            onChange={(event) =>
              setInviteForm((current) => ({ ...current, role: event.target.value }))
            }
            options={roleOptions.map((option) => ({
              value: option,
              label: `${roleLabel(option)} — ${ROLE_DESCRIPTIONS[option]}`,
            }))}
          />
          {latestInviteUrl && (
            <InviteLinkBox url={latestInviteUrl} onCopied={() => toast.success('Link copied')} />
          )}
        </form>
      </Dialog>

      <Dialog
        open={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        title="Remove member"
        description={
          removeTarget
            ? `${removeTarget.name || removeTarget.email} will lose access to ${activeWorkspace.name}. Their content stays in the workspace.`
            : ''
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setRemoveTarget(null)} disabled={removing}>
              Cancel
            </Button>
            <Button variant="danger" loading={removing} onClick={confirmRemove}>
              Remove member
            </Button>
          </>
        }
      />

      <Dialog
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        title="Transfer ownership"
        description="The new owner gains full control. You will remain as an admin."
        footer={
          <>
            <Button variant="ghost" onClick={() => setTransferOpen(false)} disabled={transferring}>
              Cancel
            </Button>
            <Button
              variant="danger"
              icon={ShieldAlert}
              loading={transferring}
              disabled={!transferTargetId || transferConfirm.trim() !== activeWorkspace.name}
              onClick={confirmTransfer}
            >
              Transfer ownership
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="New owner"
            value={transferTargetId}
            onChange={(event) => setTransferTargetId(event.target.value)}
            options={[
              { value: '', label: 'Select a member' },
              ...transferableMembers.map((member) => ({
                value: member.id,
                label: `${member.name || member.email} (${roleLabel(member.role)})`,
              })),
            ]}
          />
          <Input
            label={`Type "${activeWorkspace.name}" to confirm`}
            placeholder={activeWorkspace.name}
            value={transferConfirm}
            onChange={(event) => setTransferConfirm(event.target.value)}
          />
        </div>
      </Dialog>
    </div>
  );
}
