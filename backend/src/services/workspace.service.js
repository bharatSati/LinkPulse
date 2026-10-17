import ApiError from '../utils/ApiError.js';
import Workspace from '../models/Workspace.js';
import User from '../models/User.js';
import Link from '../models/Link.js';
import Campaign from '../models/Campaign.js';
import Tag from '../models/Tag.js';
import BioPage from '../models/BioPage.js';
import ClickEvent from '../models/ClickEvent.js';
import WorkspaceInvitation from '../models/WorkspaceInvitation.js';
import AuditLog from '../models/AuditLog.js';
import { canManageMember, assignableRoles } from '../utils/permissions.js';
import { runInTransaction } from '../utils/transaction.js';
import { recordAudit } from './audit.service.js';

function assertCanAssignRole(actorRole, role) {
  if (role === 'owner') {
    throw ApiError.badRequest('Ownership can only be changed using the transfer action');
  }
  if (!assignableRoles(actorRole).includes(role)) {
    throw ApiError.forbidden(
      `You cannot assign the "${role}" role. Allowed roles: ${assignableRoles(actorRole).join(', ') || 'none'}.`
    );
  }
}

function serializeMember(member) {
  const user = member.user && typeof member.user === 'object' ? member.user : null;
  return {
    id: user ? String(user._id) : String(member.user),
    name: user?.name || null,
    email: user?.email || null,
    role: member.role,
    joinedAt: member.createdAt || null,
  };
}

function serializeMembers(workspace) {
  const members = workspace.members.map(serializeMember);
  const owner = workspace.owner && typeof workspace.owner === 'object' ? workspace.owner : null;
  const ownerId = owner ? String(owner._id) : String(workspace.owner);

  if (ownerId && !members.some((member) => member.id === ownerId)) {
    members.unshift({
      id: ownerId,
      name: owner?.name || null,
      email: owner?.email || null,
      role: 'owner',
      joinedAt: workspace.createdAt || null,
    });
  }

  return members.sort((a, b) => (a.role === 'owner' ? -1 : b.role === 'owner' ? 1 : 0));
}

export async function createWorkspace({ name, ownerId }) {
  const workspace = await Workspace.create({
    name,
    owner: ownerId,
    members: [{ user: ownerId, role: 'owner' }],
  });

  await User.findByIdAndUpdate(ownerId, { $addToSet: { workspaces: workspace.id } });

  await recordAudit({
    workspace: workspace.id,
    actor: ownerId,
    action: 'workspace.created',
    targetType: 'workspace',
    targetId: workspace.id,
    targetLabel: workspace.name,
    metadata: { name: workspace.name },
  });

  return workspace;
}

export async function listWorkspacesForUser(userId) {
  const workspaces = await Workspace.find({ 'members.user': userId })
    .sort({ createdAt: -1 })
    .lean();

  return workspaces.map((workspace) => ({
    ...workspace,
    memberCount: Array.isArray(workspace.members) ? workspace.members.length : 0,
  }));
}

export async function getWorkspaceById(id) {
  const workspace = await Workspace.findById(id)
    .populate('owner', 'name email')
    .populate('members.user', 'name email');

  if (!workspace) {
    throw ApiError.notFound('Workspace not found');
  }

  return workspace;
}

export async function listWorkspaceMembers({ workspaceId }) {
  const workspace = await getWorkspaceById(workspaceId);
  return serializeMembers(workspace);
}

export async function updateWorkspace({ workspaceId, name, actor }) {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw ApiError.notFound('Workspace not found');
  }

  const previousName = workspace.name;
  if (name && name !== workspace.name) {
    workspace.name = name;
    await workspace.save();
  }

  if (previousName !== workspace.name) {
    await recordAudit({
      workspace: workspace.id,
      actor,
      action: 'workspace.updated',
      targetType: 'workspace',
      targetId: workspace.id,
      targetLabel: workspace.name,
      metadata: { name: { from: previousName, to: workspace.name } },
    });
  }

  return workspace;
}

export async function addWorkspaceMember({ workspaceId, userId, role, actor, actorRole }) {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw ApiError.notFound('Workspace not found');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const alreadyMember = workspace.members.some(
    (member) => member.user.toString() === user.id
  );
  if (alreadyMember) {
    throw ApiError.conflict('This user is already a member of the workspace');
  }

  if (actorRole) {
    assertCanAssignRole(actorRole, role);
  }

  workspace.members.push({ user: user.id, role });
  await workspace.save();

  await User.findByIdAndUpdate(user.id, { $addToSet: { workspaces: workspace.id } });

  await recordAudit({
    workspace: workspace.id,
    actor: actor || null,
    action: 'member.added',
    targetType: 'user',
    targetId: user.id,
    targetLabel: user.email,
    metadata: { role },
  });

  return workspace;
}

export async function updateWorkspaceMemberRole({ workspaceId, userId, role, actor, actorRole }) {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw ApiError.notFound('Workspace not found');
  }

  if (workspace.owner.toString() === userId) {
    throw ApiError.badRequest('The workspace owner role cannot be changed');
  }

  const membership = workspace.members.find(
    (member) => member.user.toString() === userId
  );
  if (!membership) {
    throw ApiError.notFound('This user is not a member of the workspace');
  }

  if (userId === String(actor)) {
    throw ApiError.badRequest('You cannot change your own role');
  }

  if (actorRole) {
    if (!canManageMember(actorRole, membership.role)) {
      throw ApiError.forbidden('You cannot manage a member with an equal or higher role');
    }
    assertCanAssignRole(actorRole, role);
  }

  const previousRole = membership.role;
  membership.role = role;
  await workspace.save();

  if (previousRole !== role) {
    await recordAudit({
      workspace: workspace.id,
      actor: actor || null,
      action: 'member.role_changed',
      targetType: 'user',
      targetId: userId,
      targetLabel: membership.user?.email || null,
      metadata: { from: previousRole, to: role },
    });
  }

  return workspace;
}

export async function removeWorkspaceMember({ workspaceId, userId, actor, actorRole }) {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw ApiError.notFound('Workspace not found');
  }

  if (workspace.owner.toString() === userId) {
    throw ApiError.badRequest('The workspace owner cannot be removed');
  }

  const membership = workspace.members.find(
    (member) => member.user.toString() === userId
  );
  if (!membership) {
    throw ApiError.notFound('This user is not a member of the workspace');
  }

  if (userId === String(actor)) {
    throw ApiError.badRequest('Use the leave workspace action to remove yourself');
  }

  if (actorRole && !canManageMember(actorRole, membership.role)) {
    throw ApiError.forbidden('You cannot remove a member with an equal or higher role');
  }

  const removedRole = membership.role;
  workspace.members = workspace.members.filter(
    (member) => member.user.toString() !== userId
  );
  await workspace.save();

  await User.findByIdAndUpdate(userId, { $pull: { workspaces: workspace.id } });

  await recordAudit({
    workspace: workspace.id,
    actor: actor || null,
    action: 'member.removed',
    targetType: 'user',
    targetId: userId,
    targetLabel: membership.user?.email || null,
    metadata: { role: removedRole },
  });

  return workspace;
}

export async function leaveWorkspace({ workspaceId, userId }) {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw ApiError.notFound('Workspace not found');
  }

  if (workspace.owner.toString() === userId) {
    throw ApiError.badRequest('Transfer ownership before leaving this workspace');
  }

  const membership = workspace.members.find(
    (member) => member.user.toString() === userId
  );
  if (!membership) {
    throw ApiError.notFound('You are not a member of this workspace');
  }

  workspace.members = workspace.members.filter(
    (member) => member.user.toString() !== userId
  );
  await workspace.save();

  await User.findByIdAndUpdate(userId, { $pull: { workspaces: workspace.id } });

  await recordAudit({
    workspace: workspace.id,
    actor: userId,
    action: 'member.left',
    targetType: 'user',
    targetId: userId,
    targetLabel: membership.user?.email || null,
    metadata: { role: membership.role },
  });

  return workspace;
}

export async function transferOwnership({ workspaceId, targetUserId, actor }) {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw ApiError.notFound('Workspace not found');
  }

  if (workspace.owner.toString() !== String(actor)) {
    throw ApiError.forbidden('Only the workspace owner can transfer ownership');
  }

  if (targetUserId === String(actor)) {
    throw ApiError.badRequest('You already own this workspace');
  }

  const targetMembership = workspace.members.find(
    (member) => member.user.toString() === targetUserId
  );
  if (!targetMembership) {
    throw ApiError.badRequest('The new owner must already be a member of the workspace');
  }

  await runInTransaction(async (session) => {
    const options = session ? { session } : undefined;

    const previousOwnerId = workspace.owner;

    workspace.owner = targetMembership.user;
    targetMembership.role = 'owner';

    const previousOwnerMembership = workspace.members.find(
      (member) => member.user.toString() === String(previousOwnerId)
    );
    if (previousOwnerMembership) {
      previousOwnerMembership.role = 'admin';
    } else {
      workspace.members.push({ user: previousOwnerId, role: 'admin' });
    }

    await workspace.save(options);
  });

  await recordAudit({
    workspace: workspace.id,
    actor,
    action: 'ownership.transferred',
    targetType: 'user',
    targetId: targetUserId,
    targetLabel: null,
    metadata: { newOwner: targetUserId, previousOwner: String(actor) },
  });

  return workspace;
}

export async function deleteWorkspace({ workspaceId, actor, confirmName }) {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw ApiError.notFound('Workspace not found');
  }

  if (workspace.owner.toString() !== String(actor)) {
    throw ApiError.forbidden('Only the workspace owner can delete the workspace');
  }

  if (!confirmName || confirmName.trim() !== workspace.name) {
    throw ApiError.badRequest(
      'To confirm deletion, provide the exact workspace name in the "confirmName" field'
    );
  }

  const id = workspace.id;

  await Link.deleteMany({ workspace: id });
  await Campaign.deleteMany({ workspace: id });
  await Tag.deleteMany({ workspace: id });
  await BioPage.deleteMany({ workspace: id });
  await ClickEvent.deleteMany({ workspace: id });
  await WorkspaceInvitation.deleteMany({ workspace: id });
  await AuditLog.deleteMany({ workspace: id });

  await User.updateMany({ workspaces: id }, { $pull: { workspaces: id } });
  await Workspace.findByIdAndDelete(id);

  return { id };
}

export async function getWorkspaceOverview({ workspaceId }) {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw ApiError.notFound('Workspace not found');
  }

  const now = new Date();
  const [campaigns, tags, bioPages, links, clicks, pendingInvitations] = await Promise.all([
    Campaign.countDocuments({ workspace: workspaceId }),
    Tag.countDocuments({ workspace: workspaceId }),
    BioPage.countDocuments({ workspace: workspaceId }),
    Link.countDocuments({ workspace: workspaceId }),
    ClickEvent.countDocuments({ workspace: workspaceId }),
    WorkspaceInvitation.countDocuments({
      workspace: workspaceId,
      acceptedAt: null,
      revokedAt: null,
      declinedAt: null,
      expiresAt: { $gt: now },
    }),
  ]);

  return {
    workspace: {
      id: workspace.id,
      name: workspace.name,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
      owner: String(workspace.owner),
    },
    counts: {
      members: workspace.members.length,
      pendingInvitations,
      links,
      campaigns,
      tags,
      bioPages,
      clicks,
    },
  };
}
