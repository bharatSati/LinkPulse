import { WORKSPACE_ROLES, ROLE_RANK } from './roles.js';

export const PERMISSIONS = Object.freeze({
  WORKSPACE_VIEW: 'workspace.view',
  WORKSPACE_UPDATE: 'workspace.update',
  WORKSPACE_DELETE: 'workspace.delete',
  MEMBERS_VIEW: 'members.view',
  MEMBERS_INVITE: 'members.invite',
  MEMBERS_ROLE_UPDATE: 'members.role.update',
  MEMBERS_REMOVE: 'members.remove',
  OWNERSHIP_TRANSFER: 'ownership.transfer',
  WORKSPACE_LEAVE: 'workspace.leave',
  AUDIT_VIEW: 'audit.view',
  LINKS_VIEW: 'links.view',
  LINKS_MANAGE: 'links.manage',
  CAMPAIGNS_VIEW: 'campaigns.view',
  CAMPAIGNS_MANAGE: 'campaigns.manage',
  TAGS_VIEW: 'tags.view',
  TAGS_MANAGE: 'tags.manage',
  ANALYTICS_VIEW: 'analytics.view',
  ANALYTICS_EXPORT: 'analytics.export',
  QR_VIEW: 'qr.view',
  QR_MANAGE: 'qr.manage',
  BIO_VIEW: 'bio.view',
  BIO_MANAGE: 'bio.manage',
  AI_VIEW: 'ai.view',
  AI_GENERATE: 'ai.generate',
  ABUSE_MANAGE: 'abuse.manage',
});

const {
  WORKSPACE_VIEW,
  WORKSPACE_UPDATE,
  WORKSPACE_DELETE,
  MEMBERS_VIEW,
  MEMBERS_INVITE,
  MEMBERS_ROLE_UPDATE,
  MEMBERS_REMOVE,
  OWNERSHIP_TRANSFER,
  WORKSPACE_LEAVE,
  AUDIT_VIEW,
  LINKS_VIEW,
  LINKS_MANAGE,
  CAMPAIGNS_VIEW,
  CAMPAIGNS_MANAGE,
  TAGS_VIEW,
  TAGS_MANAGE,
  ANALYTICS_VIEW,
  ANALYTICS_EXPORT,
  QR_VIEW,
  QR_MANAGE,
  BIO_VIEW,
  BIO_MANAGE,
  AI_VIEW,
  AI_GENERATE,
  ABUSE_MANAGE,
} = PERMISSIONS;

const VIEWER = [
  WORKSPACE_VIEW,
  WORKSPACE_LEAVE,
  MEMBERS_VIEW,
  LINKS_VIEW,
  CAMPAIGNS_VIEW,
  TAGS_VIEW,
  ANALYTICS_VIEW,
  QR_VIEW,
  BIO_VIEW,
  AI_VIEW,
];

const ANALYST = [...VIEWER, ANALYTICS_EXPORT];

const EDITOR = [
  ...ANALYST,
  LINKS_MANAGE,
  CAMPAIGNS_MANAGE,
  TAGS_MANAGE,
  QR_MANAGE,
  BIO_MANAGE,
  AI_GENERATE,
];

const ADMIN = [
  ...EDITOR,
  WORKSPACE_UPDATE,
  MEMBERS_INVITE,
  MEMBERS_ROLE_UPDATE,
  MEMBERS_REMOVE,
  AUDIT_VIEW,
  ABUSE_MANAGE,
];

const OWNER = [...ADMIN, OWNERSHIP_TRANSFER, WORKSPACE_DELETE];

export const ROLE_PERMISSIONS = Object.freeze({
  viewer: VIEWER,
  analyst: ANALYST,
  editor: EDITOR,
  admin: ADMIN,
  owner: OWNER,
});

export function permissionsForRole(role) {
  return ROLE_PERMISSIONS[role] ? [...ROLE_PERMISSIONS[role]] : [];
}

export function can(role, permission) {
  return permissionsForRole(role).includes(permission);
}

export function canManageMember(actorRole, targetRole) {
  return (ROLE_RANK[actorRole] || 0) > (ROLE_RANK[targetRole] || 0);
}

export function assignableRoles(actorRole) {
  const actorRank = ROLE_RANK[actorRole] || 0;
  return WORKSPACE_ROLES.filter(
    (role) => role !== 'owner' && (ROLE_RANK[role] || 0) < actorRank
  );
}
