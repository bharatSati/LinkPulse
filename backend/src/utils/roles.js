export const WORKSPACE_ROLES = ['owner', 'admin', 'editor', 'analyst', 'viewer'];

export const SYSTEM_ROLES = ['user', 'admin'];

export const ACCOUNT_STATUSES = ['active', 'inactive', 'suspended'];

export const ROLE_RANK = {
  viewer: 1,
  analyst: 2,
  editor: 3,
  admin: 4,
  owner: 5,
};

export function hasWorkspaceRole(currentRole, requiredRole) {
  const currentRank = ROLE_RANK[currentRole] || 0;
  const requiredRank = ROLE_RANK[requiredRole] || Number.MAX_SAFE_INTEGER;
  return currentRank >= requiredRank;
}
