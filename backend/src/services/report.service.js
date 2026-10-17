import AbuseReport, { ABUSE_REASONS } from '../models/AbuseReport.js';
import Link from '../models/Link.js';
import ApiError from '../utils/ApiError.js';
import { isValidObjectId } from '../utils/validators.js';
import { getClientIp, hashIp } from '../utils/ip.js';
import { recordAudit } from './audit.service.js';
import { emitSecurityEvent } from './abuse.service.js';
import { notifyWorkspaceAdmins, createNotification } from './notification.service.js';
import { isCoolingDown, startCooldown } from '../utils/windowTracker.js';
import security from '../config/security.js';

const MAX_PAGE_SIZE = 50;
const REVIEW_STATUSES = ['reviewing', 'resolved', 'dismissed'];

function maskEmail(email) {
  if (typeof email !== 'string' || !email.includes('@')) return null;
  const [name, domain] = email.split('@');
  const visible = name.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(name.length - 2, 1))}@${domain}`;
}

function linkSummary(link) {
  if (!link) return null;
  if (typeof link === 'object' && link._id) {
    return {
      id: String(link._id),
      code: link.customAlias || link.shortCode || null,
      title: link.title || '',
      status: link.status || null,
    };
  }
  return { id: String(link), code: null, title: '', status: null };
}

export function serializeReport(report) {
  const value = typeof report.toObject === 'function' ? report.toObject() : report;
  const reporter =
    value.reportedBy && typeof value.reportedBy === 'object'
      ? {
          id: String(value.reportedBy._id),
          name: value.reportedBy.name || null,
          email: maskEmail(value.reportedBy.email),
        }
      : value.reportedBy
        ? { id: String(value.reportedBy), name: null, email: null }
        : null;

  return {
    id: String(value._id),
    reason: value.reason,
    description: value.description || '',
    status: value.status,
    link: linkSummary(value.link),
    reporter,
    reviewNotes: value.reviewNotes || '',
    reviewedAt: value.reviewedAt || null,
    createdAt: value.createdAt,
  };
}

async function resolveLinkByCode(code) {
  if (typeof code !== 'string' || code.trim() === '') {
    throw ApiError.badRequest('A short link code is required');
  }
  const normalized = code.trim().toLowerCase();
  const link = await Link.findOne({
    $or: [{ shortCode: normalized }, { customAlias: normalized }],
  }).select('_id workspace shortCode customAlias title');
  if (!link) throw ApiError.notFound('Short link not found');
  return link;
}

export async function submitReport({ code, reason, description = '', user = null, req = null }) {
  if (!ABUSE_REASONS.includes(reason)) {
    throw ApiError.badRequest('A valid report reason is required');
  }

  const link = await resolveLinkByCode(code);

  const ipHash = req ? hashIp(getClientIp(req)) : null;
  const throttleKey = `report:${link._id}:${ipHash || 'anonymous'}`;
  if (isCoolingDown(throttleKey)) {
    throw new ApiError(429, 'You have already reported this link recently. Thank you.');
  }
  startCooldown(throttleKey, security.reportThrottleMs);

  const report = await AbuseReport.create({
    link: link._id,
    workspace: link.workspace,
    reportedBy: user?.id || null,
    reason,
    description: typeof description === 'string' ? description.trim().slice(0, 1000) : '',
    status: 'pending',
  });

  await recordAudit({
    workspace: link.workspace,
    actor: user?.id || null,
    action: 'abuse.report.created',
    targetType: 'link',
    targetId: link._id,
    targetLabel: link.customAlias || link.shortCode,
    metadata: { reason, reportId: String(report._id) },
  });

  await emitSecurityEvent({
    workspace: link.workspace,
    link: link._id,
    type: 'reported',
    severity: 'medium',
    source: 'report',
    ruleKey: 'reported',
    title: 'Link reported for abuse',
    description: `A visitor reported this link. Reason: ${reason}.`,
    score: 1,
    metadata: { reason, reportId: String(report._id) },
    dedupeKey: null,
  });

  await notifyWorkspaceAdmins({
    workspaceId: link.workspace,
    type: 'abuse_report',
    title: 'New abuse report',
    message: `${link.customAlias || link.shortCode} was reported for ${reason}.`,
    targetUrl: '/app/abuse',
    data: { reportId: String(report._id), linkId: String(link._id), reason },
  });

  return { id: String(report._id), status: report.status, createdAt: report.createdAt };
}

export async function listReports({ workspaceId, status, page = 1, limit = 20 }) {
  const query = { workspace: workspaceId };
  if (status && ['pending', 'reviewing', 'resolved', 'dismissed'].includes(status)) {
    query.status = status;
  }

  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 20, 1), MAX_PAGE_SIZE);
  const safePage = Math.max(Number.parseInt(page, 10) || 1, 1);

  const [reports, total] = await Promise.all([
    AbuseReport.find(query)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .populate('link', 'shortCode customAlias title status')
      .populate('reportedBy', 'name email'),
    AbuseReport.countDocuments(query),
  ]);

  return {
    reports: reports.map(serializeReport),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(Math.ceil(total / safeLimit), 1),
    },
  };
}

export async function getReport({ workspaceId, reportId }) {
  if (!isValidObjectId(reportId)) throw ApiError.badRequest('Invalid report id');
  const report = await AbuseReport.findOne({ _id: reportId, workspace: workspaceId })
    .populate('link', 'shortCode customAlias title status originalUrl')
    .populate('reportedBy', 'name email');
  if (!report) throw ApiError.notFound('Report not found');
  return serializeReport(report);
}

export async function reviewReport({ workspaceId, reportId, actor, status, reviewNotes = '' }) {
  if (!isValidObjectId(reportId)) throw ApiError.badRequest('Invalid report id');
  if (!REVIEW_STATUSES.includes(status)) {
    throw ApiError.badRequest('Status must be "reviewing", "resolved", or "dismissed"');
  }

  const report = await AbuseReport.findOne({ _id: reportId, workspace: workspaceId });
  if (!report) throw ApiError.notFound('Report not found');

  report.status = status;
  report.reviewNotes = typeof reviewNotes === 'string' ? reviewNotes.trim().slice(0, 1000) : '';
  report.reviewedBy = actor;
  report.reviewedAt = new Date();
  await report.save();

  await recordAudit({
    workspace: workspaceId,
    actor,
    action: 'abuse.report.reviewed',
    targetType: 'abuse_report',
    targetId: report._id,
    targetLabel: report.reason,
    metadata: { status, reportId: String(report._id) },
  });

  if (report.reportedBy && (status === 'resolved' || status === 'dismissed')) {
    await createNotification({
      recipient: report.reportedBy,
      workspace: workspaceId,
      type: 'abuse_report',
      title: 'Your report was reviewed',
      message:
        status === 'resolved'
          ? 'Thank you. Our review of the link you reported has been completed.'
          : 'The link you reported was reviewed and no action was needed.',
      targetUrl: '/app',
      dedupeKey: `report_reviewed:${report._id}`,
      data: { reportId: String(report._id), status },
    });
  }

  await report.populate('link', 'shortCode customAlias title status');
  await report.populate('reportedBy', 'name email');
  return serializeReport(report);
}
