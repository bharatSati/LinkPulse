import mongoose from 'mongoose';
import security from '../config/security.js';
import SecurityEvent from '../models/SecurityEvent.js';
import AbuseReport from '../models/AbuseReport.js';
import Link from '../models/Link.js';
import ClickEvent from '../models/ClickEvent.js';
import ApiError from '../utils/ApiError.js';
import { isValidObjectId } from '../utils/validators.js';
import { getClientIp, hashIp } from '../utils/ip.js';
import { recordAudit } from './audit.service.js';
import { notifyWorkspaceAdmins } from './notification.service.js';
import { hit, isCoolingDown, startCooldown } from '../utils/windowTracker.js';

const MAX_PAGE_SIZE = 50;
const SEVERITY_RANK = { low: 1, medium: 2, high: 3 };
const EVENT_STATUSES = ['open', 'reviewing', 'resolved', 'dismissed'];
const REVIEW_STATUSES = ['reviewing', 'resolved', 'dismissed'];

const KNOWN_SHORTENERS = new Set([
  'bit.ly', 't.co', 'tinyurl.com', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly',
  'adf.ly', 'bit.do', 'cutt.ly', 'rb.gy', 'shorturl.at', 'rebrand.ly',
  'tiny.cc', 'lnkd.in', 'trib.al', 's.id', 'v.gd', 'shorte.st',
]);

const RISKY_TLDS = new Set([
  'zip', 'mov', 'top', 'xyz', 'click', 'link', 'work', 'gq', 'tk', 'ml',
  'ga', 'cf', 'rest', 'cam', 'surf', 'bar', 'loan', 'download',
]);

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

function bucket(windowMs) {
  return Math.floor(Date.now() / windowMs);
}

function riskSignals(rawUrl) {
  const signals = [];

  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return { signals, score: 0 };
  }

  const host = url.hostname.toLowerCase();

  if (IPV4.test(host) || host.includes(':')) {
    signals.push({ code: 'ip_host', label: 'Destination is a bare IP address', weight: 40 });
  }

  if (host.includes('xn--')) {
    signals.push({ code: 'punycode', label: 'Destination uses a punycode (xn--) hostname', weight: 20 });
  }

  if (url.username || url.password) {
    signals.push({ code: 'embedded_credentials', label: 'Destination embeds credentials before the host', weight: 30 });
  }

  const labels = host.split('.').filter(Boolean);
  if (labels.length >= 4) {
    signals.push({ code: 'many_subdomains', label: 'Destination uses an unusually deep subdomain chain', weight: 15 });
  }

  if (KNOWN_SHORTENERS.has(host)) {
    signals.push({ code: 'shortener_chain', label: 'Destination is another link shortener', weight: 20 });
  }

  const tld = labels[labels.length - 1] || '';
  if (RISKY_TLDS.has(tld)) {
    signals.push({ code: 'keyword_tld', label: `Destination uses a frequently abused .${tld} domain`, weight: 35 });
  }

  if (rawUrl.length > 300) {
    signals.push({ code: 'long_url', label: 'Destination URL is unusually long', weight: 10 });
  }

  const score = signals.reduce((sum, signal) => sum + signal.weight, 0);
  return { signals, score };
}

export function detectSuspiciousDestination(rawUrl) {
  if (typeof rawUrl !== 'string' || rawUrl.length === 0) {
    return { flagged: false, score: 0, signals: [] };
  }

  const { signals, score } = riskSignals(rawUrl);
  const highConfidence = signals.some(
    (signal) => signal.code === 'ip_host' || signal.code === 'embedded_credentials'
  );
  const flagged = highConfidence || score >= security.destinationRiskScore;

  return { flagged, score, signals };
}

function severityForScore(score) {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

async function recordEvent({
  workspace,
  link = null,
  type,
  severity = 'low',
  source = 'rules',
  ruleKey = null,
  title,
  description = '',
  score = 0,
  metadata = {},
  dedupeKey = null,
}) {
  const payload = {
    workspace,
    link: link || null,
    type,
    severity,
    source,
    ruleKey,
    title,
    description,
    score,
    metadata,
    dedupeKey,
  };

  try {
    if (!dedupeKey) {
      return await SecurityEvent.create(payload);
    }

    return await SecurityEvent.findOneAndUpdate(
      { dedupeKey },
      { $setOnInsert: payload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    if (error.code !== 11000) {
      console.error('[abuse] Failed to record security event:', error.message);
    }
    return null;
  }
}

export async function emitSecurityEvent(payload) {
  const event = await recordEvent(payload);
  if (!event) return null;

  try {
    await notifyWorkspaceAdmins({
      workspaceId: payload.workspace,
      type: 'security_event',
      title: payload.title,
      message: payload.description,
      targetUrl: '/app/abuse',
      dedupeKey: payload.dedupeKey
        ? `sec:${payload.dedupeKey}`
        : `sec:${event._id}`,
      data: { eventId: String(event._id), severity: payload.severity, ruleKey: payload.ruleKey },
    });
  } catch {
    // notifications are best-effort
  }

  return event;
}

/* ------------------------------------------------------------------ *
 * Detection hooks (fire-and-forget; never throw to the caller)
 * ------------------------------------------------------------------ */

export async function evaluateLinkCreation({ workspaceId, link }) {
  try {
    const events = [];
    const now = Date.now();
    const { windowMs, max } = security.linkCreation;

    const count = await Link.countDocuments({
      workspace: workspaceId,
      createdAt: { $gte: new Date(now - windowMs) },
    });

    if (count >= max) {
      const severity = count >= max * 2 ? 'high' : 'medium';
      const event = await emitSecurityEvent({
        workspace: workspaceId,
        link: link?._id || null,
        type: 'link_creation_burst',
        severity,
        ruleKey: 'link_creation_burst',
        title: 'Unusual link creation rate',
        description: `${count} links were created in this workspace within ${Math.round(
          windowMs / 60000
        )} minutes.`,
        score: count,
        metadata: { count, max, windowMinutes: Math.round(windowMs / 60000) },
        dedupeKey: `link_burst:${workspaceId}:${bucket(windowMs)}`,
      });
      if (event) events.push(event);
    }

    const risk = detectSuspiciousDestination(link?.originalUrl);
    if (risk.flagged && link) {
      const event = await emitSecurityEvent({
        workspace: workspaceId,
        link: link._id,
        type: 'suspicious_destination',
        severity: severityForScore(risk.score),
        ruleKey: 'suspicious_destination',
        title: 'Link destination flagged for review',
        description: risk.signals.map((signal) => signal.label).join('; '),
        score: risk.score,
        metadata: { signals: risk.signals, destination: link.originalUrl },
        dedupeKey: `dest:${link._id}`,
      });
      if (event) events.push(event);
    }

    return events;
  } catch (error) {
    console.error('[abuse] Link creation evaluation failed:', error.message);
    return [];
  }
}

export async function evaluateClickSpike({ link }) {
  try {
    if (!link || !link.workspace) return null;

    const { windowMs, multiplier, minClicks, checkIntervalMs } = security.clickSpike;
    const checkKey = `spikecheck:${link._id}`;
    const firstCheck = hit(checkKey, { windowMs: checkIntervalMs, max: 1 });
    if (firstCheck.count > 1) return null;
    if (isCoolingDown(`spike:${link._id}`)) return null;

    const windowStart = new Date(Date.now() - windowMs);

    const [recent, last24h] = await Promise.all([
      ClickEvent.countDocuments({ link: link._id, createdAt: { $gte: windowStart } }),
      ClickEvent.countDocuments({
        link: link._id,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }),
    ]);

    const windowsPerDay = (24 * 60 * 60 * 1000) / windowMs;
    const baselinePerWindow = Math.max((last24h - recent) / Math.max(windowsPerDay - 1, 1), 0);
    const threshold = Math.max(minClicks, Math.ceil(multiplier * baselinePerWindow));

    if (recent < threshold) return null;

    startCooldown(`spike:${link._id}`, security.cooldownMs);

    return emitSecurityEvent({
      workspace: link.workspace,
      link: link._id,
      type: 'click_spike',
      severity: 'high',
      ruleKey: 'click_spike',
      title: 'Abnormal click spike detected',
      description: `${recent} clicks arrived within ${Math.round(
        windowMs / 60000
      )} minutes, far above this link's typical pace.`,
      score: recent,
      metadata: { recent, threshold, baselinePerWindow: Number(baselinePerWindow.toFixed(2)) },
      dedupeKey: `spike:${link._id}:${bucket(windowMs)}`,
    });
  } catch (error) {
    console.error('[abuse] Click spike evaluation failed:', error.message);
    return null;
  }
}

export async function evaluateSourceBurst({ link, req }) {
  try {
    if (!link || !link.workspace) return null;

    const ipHash = hashIp(getClientIp(req));
    if (!ipHash) return null;

    const { windowMs, max } = security.sourceRequests;
    const result = hit(`src:${ipHash}`, { windowMs, max });
    if (!result.exceeded) return null;

    const cooldownKey = `src:${ipHash}`;
    if (isCoolingDown(cooldownKey)) return null;
    startCooldown(cooldownKey, security.cooldownMs);

    return emitSecurityEvent({
      workspace: link.workspace,
      link: link._id,
      type: 'source_request_burst',
      severity: 'medium',
      ruleKey: 'source_request_burst',
      title: 'Single source hammering short links',
      description: `A single source made ${result.count} requests within ${Math.round(
        windowMs / 1000
      )} seconds.`,
      score: result.count,
      metadata: { count: result.count, max, windowSeconds: Math.round(windowMs / 1000) },
      dedupeKey: `srcburst:${ipHash}:${bucket(windowMs)}`,
    });
  } catch (error) {
    console.error('[abuse] Source burst evaluation failed:', error.message);
    return null;
  }
}

export async function evaluatePasswordFailure({ link }) {
  try {
    if (!link || !link.workspace) return null;

    const { windowMs, max } = security.passwordFailures;
    const result = hit(`pwfail:${link._id}`, { windowMs, max });
    if (!result.exceeded) return null;

    const cooldownKey = `pwfail:${link._id}`;
    if (isCoolingDown(cooldownKey)) return null;
    startCooldown(cooldownKey, security.cooldownMs);

    return emitSecurityEvent({
      workspace: link.workspace,
      link: link._id,
      type: 'password_failures',
      severity: 'medium',
      ruleKey: 'password_failures',
      title: 'Repeated failed password attempts',
      description: `${result.count} incorrect password attempts were made against this protected link within ${Math.round(
        windowMs / 60000
      )} minutes.`,
      score: result.count,
      metadata: { count: result.count, max, windowMinutes: Math.round(windowMs / 60000) },
      dedupeKey: `pwfail:${link._id}:${bucket(windowMs)}`,
    });
  } catch (error) {
    console.error('[abuse] Password failure evaluation failed:', error.message);
    return null;
  }
}

/* ------------------------------------------------------------------ *
 * Serialization
 * ------------------------------------------------------------------ */

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

export function serializeEvent(event) {
  const value = typeof event.toObject === 'function' ? event.toObject() : event;
  return {
    id: String(value._id),
    type: value.type,
    severity: value.severity,
    status: value.status,
    source: value.source,
    ruleKey: value.ruleKey || null,
    title: value.title,
    description: value.description || '',
    score: value.score || 0,
    link: linkSummary(value.link),
    metadata: value.metadata || {},
    resolutionNote: value.resolutionNote || '',
    resolvedAt: value.resolvedAt || null,
    createdAt: value.createdAt,
  };
}

/* ------------------------------------------------------------------ *
 * Admin reads
 * ------------------------------------------------------------------ */

export async function listEvents({ workspaceId, status, severity, type, page = 1, limit = 20 }) {
  const query = { workspace: workspaceId };
  if (status && EVENT_STATUSES.includes(status)) query.status = status;
  if (severity && SEVERITY_RANK[severity]) query.severity = severity;
  if (type) query.type = type;

  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 20, 1), MAX_PAGE_SIZE);
  const safePage = Math.max(Number.parseInt(page, 10) || 1, 1);

  const [events, total] = await Promise.all([
    SecurityEvent.find(query)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .populate('link', 'shortCode customAlias title status')
      .lean(),
    SecurityEvent.countDocuments(query),
  ]);

  return {
    events: events.map(serializeEvent),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(Math.ceil(total / safeLimit), 1),
    },
  };
}

export async function updateEventStatus({ workspaceId, eventId, actor, status, note = '' }) {
  if (!isValidObjectId(eventId)) throw ApiError.badRequest('Invalid security event id');
  if (!REVIEW_STATUSES.includes(status)) {
    throw ApiError.badRequest('Status must be "reviewing", "resolved", or "dismissed"');
  }

  const event = await SecurityEvent.findOne({ _id: eventId, workspace: workspaceId });
  if (!event) throw ApiError.notFound('Security event not found');

  event.status = status;
  event.resolutionNote = typeof note === 'string' ? note.trim() : '';
  if (status === 'resolved' || status === 'dismissed') {
    event.resolvedBy = actor;
    event.resolvedAt = new Date();
  }
  await event.save();

  await recordAudit({
    workspace: workspaceId,
    actor,
    action: 'security.event.reviewed',
    targetType: 'security_event',
    targetId: event._id,
    targetLabel: event.title,
    metadata: { status, ruleKey: event.ruleKey },
  });

  await event.populate('link', 'shortCode customAlias title status');
  return serializeEvent(event);
}

export async function listSuspiciousLinks({ workspaceId, minSeverity, page = 1, limit = 20 }) {
  const oid = new mongoose.Types.ObjectId(String(workspaceId));
  const openEventMatch = {
    workspace: oid,
    link: { $ne: null },
    status: { $in: ['open', 'reviewing'] },
  };

  const [eventRows, reportRows] = await Promise.all([
    SecurityEvent.aggregate([
      { $match: openEventMatch },
      {
        $group: {
          _id: '$link',
          events: { $sum: 1 },
          highestSeverity: { $max: '$severity' },
          types: { $addToSet: '$type' },
          lastEventAt: { $max: '$createdAt' },
        },
      },
    ]),
    AbuseReport.aggregate([
      { $match: { workspace: oid, status: { $in: ['pending', 'reviewing'] } } },
      {
        $group: {
          _id: '$link',
          reports: { $sum: 1 },
          lastReportAt: { $max: '$createdAt' },
        },
      },
    ]),
  ]);

  const reportMap = new Map(reportRows.map((row) => [String(row._id), row]));
  const linkIds = new Set([
    ...eventRows.map((row) => String(row._id)),
    ...reportRows.map((row) => String(row._id)),
  ]);

  const severityRank = { low: 1, medium: 2, high: 3 };
  const minRank = SEVERITY_RANK[minSeverity] || 0;

  let rows = eventRows.map((row) => {
    const report = reportMap.get(String(row._id));
    const severityValue =
      severityRank[row.highestSeverity] >= (report ? 2 : 0)
        ? row.highestSeverity
        : 'medium';
    return {
      linkId: String(row._id),
      events: row.events,
      reports: report ? report.reports : 0,
      highestSeverity: severityValue,
      types: row.types,
      lastActivityAt: row.lastEventAt,
    };
  });

  for (const report of reportRows) {
    const id = String(report._id);
    if (eventRows.some((row) => String(row._id) === id)) continue;
    rows.push({
      linkId: id,
      events: 0,
      reports: report.reports,
      highestSeverity: 'medium',
      types: ['reported'],
      lastActivityAt: report.lastReportAt,
    });
  }

  rows = rows
    .filter((row) => severityRank[row.highestSeverity] >= minRank)
    .sort((a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt));

  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 20, 1), MAX_PAGE_SIZE);
  const safePage = Math.max(Number.parseInt(page, 10) || 1, 1);
  const total = rows.length;
  const paged = rows.slice((safePage - 1) * safeLimit, (safePage - 1) * safeLimit + safeLimit);

  const links = await Link.find({ _id: { $in: paged.map((row) => row.linkId) } })
    .select('shortCode customAlias title originalUrl status clickCount createdAt')
    .lean();
  const linkMap = new Map(links.map((link) => [String(link._id), link]));

  const items = paged
    .map((row) => {
      const link = linkMap.get(row.linkId);
      if (!link) return null;
      return {
        ...row,
        shortCode: link.customAlias || link.shortCode || null,
        title: link.title || '',
        originalUrl: link.originalUrl,
        status: link.status,
        clickCount: link.clickCount || 0,
        createdAt: link.createdAt,
      };
    })
    .filter(Boolean);

  return {
    links: items,
    total,
    linkIds: [...linkIds].length,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: items.length,
      totalPages: Math.max(Math.ceil(total / safeLimit), 1),
    },
  };
}

export async function inspectLink({ workspaceId, linkId }) {
  if (!isValidObjectId(linkId)) throw ApiError.badRequest('Invalid link id');

  const link = await Link.findOne({ _id: linkId, workspace: workspaceId })
    .select('shortCode customAlias title originalUrl status clickCount clickLimit expiresAt createdAt')
    .lean();
  if (!link) throw ApiError.notFound('Link not found');

  const [events, eventTotal, openEvents, reports, reportTotal, pendingReports] =
    await Promise.all([
      SecurityEvent.find({ workspace: workspaceId, link: linkId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      SecurityEvent.countDocuments({ workspace: workspaceId, link: linkId }),
      SecurityEvent.countDocuments({
        workspace: workspaceId,
        link: linkId,
        status: { $in: ['open', 'reviewing'] },
      }),
      AbuseReport.find({ workspace: workspaceId, link: linkId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      AbuseReport.countDocuments({ workspace: workspaceId, link: linkId }),
      AbuseReport.countDocuments({
        workspace: workspaceId,
        link: linkId,
        status: { $in: ['pending', 'reviewing'] },
      }),
    ]);

  const risk = detectSuspiciousDestination(link.originalUrl);

  return {
    link: {
      id: String(link._id),
      shortCode: link.customAlias || link.shortCode,
      title: link.title || '',
      originalUrl: link.originalUrl,
      status: link.status,
      clickCount: link.clickCount || 0,
      clickLimit: link.clickLimit ?? null,
      expiresAt: link.expiresAt || null,
      createdAt: link.createdAt,
    },
    destinationRisk: risk,
    counts: {
      events: eventTotal,
      openEvents,
      reports: reportTotal,
      pendingReports,
    },
    recentEvents: events.map(serializeEvent),
    recentReports: reports.map((report) => ({
      id: String(report._id),
      reason: report.reason,
      description: report.description || '',
      status: report.status,
      createdAt: report.createdAt,
    })),
  };
}

/* ------------------------------------------------------------------ *
 * Admin enforcement
 * ------------------------------------------------------------------ */

async function setLinkStatus({ workspaceId, linkId, actor, status, reason, action, title }) {
  if (!isValidObjectId(linkId)) throw ApiError.badRequest('Invalid link id');

  const link = await Link.findOne({ _id: linkId, workspace: workspaceId });
  if (!link) throw ApiError.notFound('Link not found');

  if (link.status === status) {
    return { id: String(link._id), status, unchanged: true };
  }

  link.status = status;
  await link.save();

  await recordAudit({
    workspace: workspaceId,
    actor,
    action,
    targetType: 'link',
    targetId: link._id,
    targetLabel: link.title || link.customAlias || link.shortCode,
    metadata: { reason: reason || '', status },
  });

  await notifyWorkspaceAdmins({
    workspaceId,
    type: 'link_disabled',
    title,
    message: `${link.customAlias || link.shortCode} was marked "${status}".${reason ? ` Reason: ${reason}` : ''}`,
    targetUrl: '/app/links',
    data: { linkId: String(link._id), status },
  });

  return { id: String(link._id), status, unchanged: false };
}

export async function disableLink({ workspaceId, linkId, actor, reason = '' }) {
  return setLinkStatus({
    workspaceId,
    linkId,
    actor,
    status: 'disabled',
    reason,
    action: 'link.disabled',
    title: 'A link was disabled',
  });
}

export async function reactivateLink({ workspaceId, linkId, actor, reason = '' }) {
  return setLinkStatus({
    workspaceId,
    linkId,
    actor,
    status: 'active',
    reason,
    action: 'link.reactivated',
    title: 'A link was reactivated',
  });
}

export async function getAbuseSummary({ workspaceId }) {
  const [openEvents, highEvents, pendingReports] = await Promise.all([
    SecurityEvent.countDocuments({
      workspace: workspaceId,
      status: { $in: ['open', 'reviewing'] },
    }),
    SecurityEvent.countDocuments({
      workspace: workspaceId,
      severity: 'high',
      status: { $in: ['open', 'reviewing'] },
    }),
    AbuseReport.countDocuments({
      workspace: workspaceId,
      status: { $in: ['pending', 'reviewing'] },
    }),
  ]);

  return { openEvents, highEvents, pendingReports };
}
