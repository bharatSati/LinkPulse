import ApiError from '../utils/ApiError.js';
import Workspace from '../models/Workspace.js';
import User from '../models/User.js';

export async function createWorkspace({ name, ownerId }) {
  const workspace = await Workspace.create({
    name,
    owner: ownerId,
    members: [{ user: ownerId, role: 'owner' }],
  });

  await User.findByIdAndUpdate(ownerId, { $addToSet: { workspaces: workspace.id } });

  return workspace;
}

export async function listWorkspacesForUser(userId) {
  return Workspace.find({ 'members.user': userId }).sort({ createdAt: -1 });
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

export async function addWorkspaceMember({ workspaceId, userId, role }) {
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

  workspace.members.push({ user: user.id, role });
  await workspace.save();

  await User.findByIdAndUpdate(user.id, { $addToSet: { workspaces: workspace.id } });

  return workspace;
}

export async function updateWorkspaceMemberRole({ workspaceId, userId, role }) {
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

  membership.role = role;
  await workspace.save();

  return workspace;
}

export async function removeWorkspaceMember({ workspaceId, userId }) {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw ApiError.notFound('Workspace not found');
  }

  if (workspace.owner.toString() === userId) {
    throw ApiError.badRequest('The workspace owner cannot be removed');
  }

  workspace.members = workspace.members.filter(
    (member) => member.user.toString() !== userId
  );
  await workspace.save();

  await User.findByIdAndUpdate(userId, { $pull: { workspaces: workspace.id } });

  return workspace;
}
