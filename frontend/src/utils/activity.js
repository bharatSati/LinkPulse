export const AUDIT_ACTION_LABELS = {
  'workspace.created': 'Workspace created',
  'workspace.updated': 'Workspace settings updated',
  'workspace.deleted': 'Workspace deleted',
  'member.added': 'Member added',
  'member.joined': 'Member joined',
  'member.removed': 'Member removed',
  'member.left': 'Member left',
  'member.role_changed': 'Member role changed',
  'ownership.transferred': 'Ownership transferred',
  'invitation.created': 'Invitation sent',
  'invitation.resent': 'Invitation resent',
  'invitation.revoked': 'Invitation revoked',
  'invitation.declined': 'Invitation declined',
  'invitation.accepted': 'Invitation accepted',
  'invitation.expired': 'Invitation expired',
  'link.disabled': 'Link disabled',
  'link.reactivated': 'Link reactivated',
  'abuse.report.created': 'Abuse report filed',
  'abuse.report.reviewed': 'Abuse report reviewed',
  'security.event.reviewed': 'Security event reviewed',
};

export function auditActionLabel(action) {
  return AUDIT_ACTION_LABELS[action] || action;
}

export function describeAudit(log) {
  const actor = log.actor?.name || log.actor?.email || 'System';
  const target = log.targetLabel ? ` · ${log.targetLabel}` : '';
  const meta = log.metadata || {};

  if (log.action === 'member.role_changed' && meta.from && meta.to) {
    return `${actor} changed role from ${meta.from} to ${meta.to}${target}`;
  }

  if (log.action === 'workspace.updated' && meta.name) {
    return `${actor} renamed the workspace to "${meta.name.to}"`;
  }

  if (log.action === 'ownership.transferred') {
    return `${actor} transferred ownership`;
  }

  if (log.action === 'link.disabled' || log.action === 'link.reactivated') {
    const reason = meta.reason ? ` · ${meta.reason}` : '';
    return `${actor} ${log.action === 'link.disabled' ? 'disabled' : 'reactivated'} a link${target}${reason}`;
  }

  if (log.action === 'abuse.report.reviewed' && meta.status) {
    return `${actor} marked a report as ${meta.status}${target}`;
  }

  if (log.action === 'security.event.reviewed' && meta.status) {
    return `${actor} marked a security event as ${meta.status}${target}`;
  }

  return `${actor} · ${auditActionLabel(log.action)}${target}`;
}
