import AuditLog, { AUDIT_ACTIONS } from '../models/AuditLog.js';
import logger from '../utils/logger.js';

const SENSITIVE_KEY = /(token|password|secret|apikey|api_key|hash|credential)/i;
const MAX_STRING = 300;
const MAX_KEYS = 12;
const MAX_DEPTH = 3;

function sanitizeValue(value, depth) {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…` : value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    if (depth >= MAX_DEPTH) return [];
    return value.slice(0, MAX_KEYS).map((item) => sanitizeValue(item, depth + 1));
  }

  if (typeof value === 'object') {
    if (depth >= MAX_DEPTH) return {};
    const result = {};
    let keys = 0;
    for (const [key, item] of Object.entries(value)) {
      if (SENSITIVE_KEY.test(key)) continue;
      if (keys >= MAX_KEYS) break;
      result[key] = sanitizeValue(item, depth + 1);
      keys += 1;
    }
    return result;
  }

  return undefined;
}

export function sanitizeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') return {};
  return sanitizeValue(metadata, 0);
}

export async function recordAudit({
  workspace,
  actor,
  action,
  targetType = null,
  targetId = null,
  targetLabel = null,
  metadata = {},
  session = null,
}) {
  if (!AUDIT_ACTIONS.includes(action)) return null;

  try {
    const payload = {
      workspace,
      actor: actor || null,
      action,
      targetType,
      targetId: targetId ? String(targetId) : null,
      targetLabel: targetLabel ? String(targetLabel).slice(0, 160) : null,
      metadata: sanitizeMetadata(metadata),
    };

    const [log] = await AuditLog.create([payload], session ? { session } : undefined);
    return log;
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      logger.debug(`Audit log skipped (${action}):`, error.message);
    }
    return null;
  }
}

function serializeAuditLog(log) {
  const actor =
    log.actor && typeof log.actor === 'object'
      ? {
          id: String(log.actor._id),
          name: log.actor.name || null,
          email: log.actor.email || null,
        }
      : log.actor
        ? { id: String(log.actor), name: null, email: null }
        : null;

  return {
    id: String(log._id),
    action: log.action,
    actor,
    targetType: log.targetType || null,
    targetId: log.targetId || null,
    targetLabel: log.targetLabel || null,
    metadata: log.metadata || {},
    createdAt: log.createdAt,
  };
}

export async function listAuditLogs({ workspaceId, limit = 50, action }) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);

  const query = { workspace: workspaceId };
  if (action && AUDIT_ACTIONS.includes(action)) query.action = action;

  const logs = await AuditLog.find(query)
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .populate('actor', 'name email')
    .lean();

  return logs.map(serializeAuditLog);
}
