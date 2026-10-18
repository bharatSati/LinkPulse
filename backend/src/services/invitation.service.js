import crypto from 'node:crypto';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import Workspace from '../models/Workspace.js';
import User from '../models/User.js';
import WorkspaceInvitation from '../models/WorkspaceInvitation.js';
import env from '../config/env.js';
import { normalizeEmail } from '../utils/validators.js';
import { assignableRoles } from '../utils/permissions.js';
import { runInTransaction } from '../utils/transaction.js';
import { recordAudit } from './audit.service.js';
import { createNotification } from './notification.service.js';
import { sendInvitationEmail } from './mail.service.js';

const DAY_MS = 24 * 60 * 60 * 1000;

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function invitationStatus(invitation, now = new Date()) {
  if (invitation.acceptedAt) return 'accepted';
  if (invitation.revokedAt) return 'revoked';
  if (invitation.declinedAt) return 'declined';
  if (invitation.expiresAt && invitation.expiresAt.getTime() <= now.getTime()) return 'expired';
  return 'pending';
}

function maskEmail(email) {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  const visible = local.slice(0, 1);
  return `${visible}${'*'.repeat(Math.max(local.length - 1, 1))}@${domain}`;
}

function serializeInvitation(invitation) {
  const inviter =
    invitation.invitedBy && typeof invitation.invitedBy === 'object'
      ? {
          id: String(invitation.invitedBy._id),
          name: invitation.invitedBy.name || null,
          email: invitation.invitedBy.email || null,
        }
      : invitation.invitedBy
        ? { id: String(invitation.invitedBy), name: null, email: null }
        : null;

  return {
    id: String(invitation._id),
    email: invitation.email,
    role: invitation.role,
    status: invitationStatus(invitation),
    invitedBy: inviter,
    expiresAt: invitation.expiresAt,
    acceptedAt: invitation.acceptedAt,
    lastSentAt: invitation.lastSentAt,
    resendCount: invitation.resendCount || 0,
    createdAt: invitation.createdAt,
  };
}

function buildInviteUrl(token) {
  const base = (env.frontendUrl || '').replace(/\/+$/, '');
  return `${base}/invite/${token}`;
}

/*
 * Best-effort invitation email delivery. A failed send never breaks the
 * invitation itself — the invite link is still returned so it can be shared
 * manually. Returns whether the email was actually handed to the provider.
 */
async function deliverInvitationEmail({ email, inviteUrl, workspaceName, inviterName, role, expiresAt }) {
  try {
    const { sent } = await sendInvitationEmail({
      to: email,
      inviteUrl,
      workspaceName,
      inviterName,
      role,
      expiresAt,
    });
    return sent;
  } catch (error) {
    logger.warn('[mail] Failed to send invitation email:', error.message);
    return false;
  }
}

async function assertAssignableRole(actorRole, role) {
  const allowed = assignableRoles(actorRole);
  if (!allowed.includes(role)) {
    throw ApiError.forbidden(
      `You cannot assign the "${role}" role. Allowed roles: ${allowed.join(', ') || 'none'}.`
    );
  }
}

export async function createInvitation({ workspace, email, role, actor, actorRole }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw ApiError.badRequest('Email is required');
  }

  await assertAssignableRole(actorRole, role);

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (
    existingUser &&
    workspace.members.some((member) => member.user.toString() === existingUser.id)
  ) {
    throw ApiError.conflict('This user is already a member of the workspace');
  }

  const now = new Date();
  const pending = await WorkspaceInvitation.findOne({
    workspace: workspace.id,
    email: normalizedEmail,
    acceptedAt: null,
    revokedAt: null,
    declinedAt: null,
    expiresAt: { $gt: now },
  });

  if (pending) {
    throw ApiError.conflict('A pending invitation already exists for this email');
  }

  const token = generateToken();
  const expiresAt = new Date(now.getTime() + env.invitationTtlDays * DAY_MS);

  const invitation = await WorkspaceInvitation.create({
    workspace: workspace.id,
    email: normalizedEmail,
    role,
    invitedBy: actor,
    tokenHash: hashToken(token),
    expiresAt,
    lastSentAt: now,
  });

  await recordAudit({
    workspace: workspace.id,
    actor,
    action: 'invitation.created',
    targetType: 'invitation',
    targetId: invitation.id,
    targetLabel: normalizedEmail,
    metadata: { role, email: normalizedEmail },
  });

  if (existingUser) {
    await createNotification({
      recipient: existingUser.id,
      workspace: workspace.id,
      type: 'invitation',
      title: `You're invited to ${workspace.name}`,
      message: `You have been invited to join "${workspace.name}" as ${role}.`,
      targetUrl: `/invite/${token}`,
      dedupeKey: `invitation:${invitation.id}`,
      data: { invitationId: invitation.id, role },
    });
  }

  const populated = await WorkspaceInvitation.findById(invitation.id).populate(
    'invitedBy',
    'name email'
  );

  const inviteUrl = buildInviteUrl(token);
  const emailSent = await deliverInvitationEmail({
    email: normalizedEmail,
    inviteUrl,
    workspaceName: workspace.name,
    inviterName: populated.invitedBy?.name,
    role,
    expiresAt,
  });

  return { invitation: serializeInvitation(populated), token, inviteUrl, emailSent };
}

export async function listInvitations({ workspaceId }) {
  const now = new Date();

  const expired = await WorkspaceInvitation.find({
    workspace: workspaceId,
    acceptedAt: null,
    revokedAt: null,
    declinedAt: null,
    expiresAt: { $lte: now },
    expiredNotified: false,
  });

  if (expired.length > 0) {
    await WorkspaceInvitation.updateMany(
      { _id: { $in: expired.map((item) => item._id) } },
      { $set: { expiredNotified: true } }
    );
    await Promise.all(
      expired.map((item) =>
        recordAudit({
          workspace: workspaceId,
          actor: null,
          action: 'invitation.expired',
          targetType: 'invitation',
          targetId: item.id,
          targetLabel: item.email,
          metadata: { role: item.role },
        })
      )
    );
  }

  const invitations = await WorkspaceInvitation.find({ workspace: workspaceId })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('invitedBy', 'name email');

  return invitations.map(serializeInvitation);
}

export async function revokeInvitation({ workspaceId, invitationId, actor }) {
  const invitation = await WorkspaceInvitation.findOne({
    _id: invitationId,
    workspace: workspaceId,
  });

  if (!invitation) {
    throw ApiError.notFound('Invitation not found');
  }

  if (invitation.acceptedAt) {
    throw ApiError.conflict('This invitation has already been accepted');
  }

  if (invitation.revokedAt) {
    return serializeInvitation(await invitation.populate('invitedBy', 'name email'));
  }

  invitation.revokedAt = new Date();
  await invitation.save();

  await recordAudit({
    workspace: workspaceId,
    actor,
    action: 'invitation.revoked',
    targetType: 'invitation',
    targetId: invitation.id,
    targetLabel: invitation.email,
    metadata: { role: invitation.role },
  });

  await invitation.populate('invitedBy', 'name email');
  return serializeInvitation(invitation);
}

export async function resendInvitation({ workspaceId, invitationId, actor }) {
  const invitation = await WorkspaceInvitation.findOne({
    _id: invitationId,
    workspace: workspaceId,
  });

  if (!invitation) {
    throw ApiError.notFound('Invitation not found');
  }

  if (invitation.acceptedAt) {
    throw ApiError.conflict('This invitation has already been accepted');
  }

  const token = generateToken();
  const now = new Date();

  invitation.tokenHash = hashToken(token);
  invitation.expiresAt = new Date(now.getTime() + env.invitationTtlDays * DAY_MS);
  invitation.revokedAt = null;
  invitation.declinedAt = null;
  invitation.expiredNotified = false;
  invitation.lastSentAt = now;
  invitation.resendCount = (invitation.resendCount || 0) + 1;
  await invitation.save();

  await recordAudit({
    workspace: workspaceId,
    actor,
    action: 'invitation.resent',
    targetType: 'invitation',
    targetId: invitation.id,
    targetLabel: invitation.email,
    metadata: { role: invitation.role, resendCount: invitation.resendCount },
  });

  const workspace = await Workspace.findById(workspaceId).select('name');
  const invitee = await User.findOne({ email: invitation.email });
  if (invitee) {
    await createNotification({
      recipient: invitee.id,
      workspace: workspaceId,
      type: 'invitation',
      title: `Reminder: join ${workspace?.name || 'a workspace'}`,
      message: `Your invitation to join "${workspace?.name || 'a workspace'}" as ${invitation.role} has been refreshed.`,
      targetUrl: `/invite/${token}`,
      dedupeKey: `invitation_resend:${invitation.id}:${invitation.resendCount}`,
      data: { invitationId: invitation.id, role: invitation.role },
    });
  }

  await invitation.populate('invitedBy', 'name email');

  const inviteUrl = buildInviteUrl(token);
  const emailSent = await deliverInvitationEmail({
    email: invitation.email,
    inviteUrl,
    workspaceName: workspace?.name,
    inviterName: invitation.invitedBy?.name,
    role: invitation.role,
    expiresAt: invitation.expiresAt,
  });

  return {
    invitation: serializeInvitation(invitation),
    token,
    inviteUrl,
    emailSent,
  };
}

export async function previewInvitation(token) {
  if (!token || typeof token !== 'string') {
    throw ApiError.badRequest('Invitation token is required');
  }

  const invitation = await WorkspaceInvitation.findOne({ tokenHash: hashToken(token) })
    .populate('workspace', 'name')
    .populate('invitedBy', 'name');

  if (!invitation) {
    throw ApiError.notFound('This invitation is invalid or no longer exists');
  }

  return {
    workspaceName: invitation.workspace?.name || null,
    inviterName: invitation.invitedBy?.name || null,
    email: maskEmail(invitation.email),
    role: invitation.role,
    status: invitationStatus(invitation),
    expiresAt: invitation.expiresAt,
  };
}

export async function acceptInvitation({ token, user }) {
  if (!token || typeof token !== 'string') {
    throw ApiError.badRequest('Invitation token is required');
  }

  const invitation = await WorkspaceInvitation.findOne({ tokenHash: hashToken(token) });
  if (!invitation) {
    throw ApiError.notFound('This invitation is invalid or no longer exists');
  }

  const status = invitationStatus(invitation);
  if (status === 'accepted') {
    throw ApiError.conflict('This invitation has already been accepted');
  }
  if (status === 'revoked') {
    throw new ApiError(410, 'This invitation has been revoked');
  }
  if (status === 'declined') {
    throw new ApiError(410, 'This invitation was declined');
  }
  if (status === 'expired') {
    throw new ApiError(410, 'This invitation has expired');
  }

  if (normalizeEmail(user.email) !== invitation.email) {
    throw ApiError.forbidden(
      `This invitation was sent to ${invitation.email}. Sign in with that email to accept it.`
    );
  }

  const workspace = await Workspace.findById(invitation.workspace);
  if (!workspace) {
    throw ApiError.notFound('The workspace for this invitation no longer exists');
  }

  const alreadyMember = workspace.members.some(
    (member) => member.user.toString() === String(user.id)
  );

  await runInTransaction(async (session) => {
    const options = session ? { session } : undefined;

    if (!alreadyMember) {
      workspace.members.push({ user: user.id, role: invitation.role });
      await workspace.save(options);
      await User.findByIdAndUpdate(
        user.id,
        { $addToSet: { workspaces: workspace.id } },
        options
      );
    }

    invitation.acceptedAt = new Date();
    await invitation.save(options);
  });

  await recordAudit({
    workspace: workspace.id,
    actor: user.id,
    action: 'invitation.accepted',
    targetType: 'invitation',
    targetId: invitation.id,
    targetLabel: invitation.email,
    metadata: { role: invitation.role, alreadyMember },
  });

  if (!alreadyMember) {
    await recordAudit({
      workspace: workspace.id,
      actor: user.id,
      action: 'member.joined',
      targetType: 'user',
      targetId: user.id,
      targetLabel: user.email,
      metadata: { role: invitation.role, via: 'invitation' },
    });
  }

  if (invitation.invitedBy && String(invitation.invitedBy) !== String(user.id)) {
    await createNotification({
      recipient: invitation.invitedBy,
      workspace: workspace.id,
      type: 'member_event',
      title: `${user.name || user.email} joined ${workspace.name}`,
      message: `${user.name || user.email} accepted your invitation and joined as ${invitation.role}.`,
      targetUrl: '/app/team',
      dedupeKey: `member_joined:${invitation.id}`,
      data: { userId: String(user.id), role: invitation.role },
    });
  }

  return { workspace, role: invitation.role, alreadyMember };
}

export async function rejectInvitation({ token, user }) {
  if (!token || typeof token !== 'string') {
    throw ApiError.badRequest('Invitation token is required');
  }

  const invitation = await WorkspaceInvitation.findOne({ tokenHash: hashToken(token) });
  if (!invitation) {
    throw ApiError.notFound('This invitation is invalid or no longer exists');
  }

  if (invitation.acceptedAt) {
    throw ApiError.conflict('This invitation has already been accepted');
  }

  if (normalizeEmail(user.email) !== invitation.email) {
    throw ApiError.forbidden('Only the invited email address can respond to this invitation');
  }

  if (!invitation.declinedAt && !invitation.revokedAt) {
    invitation.declinedAt = new Date();
    await invitation.save();

    await recordAudit({
      workspace: invitation.workspace,
      actor: user.id,
      action: 'invitation.declined',
      targetType: 'invitation',
      targetId: invitation.id,
      targetLabel: invitation.email,
      metadata: { role: invitation.role },
    });
  }

  return { declined: true };
}
