import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';
import ClickEvent from '../models/ClickEvent.js';
import Link from '../models/Link.js';
import { serializeClick } from '../utils/clickPayload.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_RANGE_DAYS = 731;

function toObjectId(value) {
  return new mongoose.Types.ObjectId(value);
}

function clampLimit(value, fallback = 10, max = 100) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

function percentage(count, total) {
  if (!total) return 0;
  return Math.round((count / total) * 1000) / 10;
}

function parseDate(value, endOfDay) {
  if (typeof value !== 'string' || value.trim() === '') return null;

  const trimmed = value.trim();
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
  const date = dateOnly
    ? new Date(`${trimmed}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`)
    : new Date(trimmed);

  if (Number.isNaN(date.getTime())) {
    throw ApiError.badRequest(`Invalid date value: "${value}"`);
  }

  return date;
}

export function resolveRange(query = {}) {
  const now = new Date();
  let from = parseDate(query.from, false);
  let to = parseDate(query.to, true);

  if (!to) to = now;
  if (!from) {
    const startOfToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    from = new Date(startOfToday - 29 * DAY_MS);
  }

  if (from.getTime() > to.getTime()) {
    throw ApiError.badRequest('"from" must be before or equal to "to"');
  }

  const days = Math.max(Math.ceil((to.getTime() - from.getTime()) / DAY_MS), 1);
  if (days > MAX_RANGE_DAYS) {
    throw ApiError.badRequest(`Date range cannot exceed ${MAX_RANGE_DAYS} days`);
  }

  return { from, to, days };
}

function buildScope({ workspaceId, linkId, linkIds }) {
  const scope = { workspace: toObjectId(workspaceId) };
  if (linkId) {
    scope.link = toObjectId(linkId);
  } else if (Array.isArray(linkIds)) {
    scope.link = { $in: linkIds.map(toObjectId) };
  }
  return scope;
}

function withRange(scope, range) {
  const match = { ...scope };
  if (range?.from || range?.to) {
    match.timestamp = {};
    if (range.from) match.timestamp.$gte = range.from;
    if (range.to) match.timestamp.$lte = range.to;
  }
  return match;
}

function fillSeries(range, interval, byKey) {
  const points = [];
  const stepMs = interval === 'hour' ? 60 * 60 * 1000 : DAY_MS;

  const cursor = new Date(
    interval === 'hour'
      ? Math.floor(range.from.getTime() / stepMs) * stepMs
      : Date.UTC(range.from.getUTCFullYear(), range.from.getUTCMonth(), range.from.getUTCDate())
  );

  const limit = 1000;
  while (cursor.getTime() <= range.to.getTime() && points.length < limit) {
    const key =
      interval === 'hour'
        ? `${cursor.toISOString().slice(0, 13)}:00:00Z`
        : cursor.toISOString().slice(0, 10);

    const entry = byKey.get(key) || { clicks: 0, visitors: 0 };
    points.push({ date: key, clicks: entry.clicks, visitors: entry.visitors });

    cursor.setTime(cursor.getTime() + stepMs);
  }

  return points;
}

export async function getOverview({ workspaceId, linkId, linkIds, range }) {
  const scope = buildScope({ workspaceId, linkId, linkIds });
  const periodMatch = withRange(scope, range);

  const duration = range.to.getTime() - range.from.getTime();
  const previousRange = {
    from: new Date(range.from.getTime() - duration - 1),
    to: new Date(range.from.getTime() - 1),
  };
  const previousMatch = withRange(scope, previousRange);

  const [totalClicks, periodClicks, previousPeriodClicks, uniqueAgg, geoCount, referrerCount, linksCount] =
    await Promise.all([
      ClickEvent.countDocuments(scope),
      ClickEvent.countDocuments(periodMatch),
      ClickEvent.countDocuments(previousMatch),
      ClickEvent.aggregate([
        { $match: { ...periodMatch, ipHash: { $ne: null } } },
        { $group: { _id: '$ipHash' } },
        { $count: 'count' },
      ]),
      ClickEvent.countDocuments({ ...periodMatch, country: { $ne: null } }),
      ClickEvent.countDocuments({ ...periodMatch, referrerDomain: { $ne: null } }),
      linkId
        ? Promise.resolve(1)
        : Array.isArray(linkIds)
          ? Promise.resolve(linkIds.length)
          : Link.countDocuments({ workspace: toObjectId(workspaceId) }),
    ]);

  const uniqueVisitors = uniqueAgg[0]?.count || 0;
  const changePercent =
    previousPeriodClicks > 0
      ? Math.round(((periodClicks - previousPeriodClicks) / previousPeriodClicks) * 1000) / 10
      : periodClicks > 0
        ? 100
        : 0;

  return {
    range: {
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      days: range.days,
    },
    totalClicks,
    periodClicks,
    previousPeriodClicks,
    changePercent,
    uniqueVisitors,
    avgDailyClicks: Math.round((periodClicks / range.days) * 100) / 100,
    linksCount,
    hasGeoData: geoCount > 0,
    hasReferrerData: referrerCount > 0,
  };
}

export async function getClicksOverTime({ workspaceId, linkId, linkIds, range, interval = 'day' }) {
  const match = withRange(buildScope({ workspaceId, linkId, linkIds }), range);
  const resolvedInterval = interval === 'hour' && range.days <= 31 ? 'hour' : 'day';
  const format = resolvedInterval === 'hour' ? '%Y-%m-%dT%H:00:00Z' : '%Y-%m-%d';

  const rows = await ClickEvent.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format, date: '$timestamp', timezone: 'UTC' } },
        clicks: { $sum: 1 },
        visitors: { $addToSet: '$ipHash' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const byKey = new Map(
    rows.map((row) => [
      row._id,
      { clicks: row.clicks, visitors: row.visitors.filter(Boolean).length },
    ])
  );

  return { interval: resolvedInterval, points: fillSeries(range, resolvedInterval, byKey) };
}

export async function getTopLinks({ workspaceId, linkIds, range, limit = 10 }) {
  const match = withRange(buildScope({ workspaceId, linkIds }), range);

  const rows = await ClickEvent.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$link',
        clicks: { $sum: 1 },
        visitors: { $addToSet: '$ipHash' },
      },
    },
    { $sort: { clicks: -1 } },
    { $limit: clampLimit(limit, 10, 100) },
    {
      $lookup: {
        from: 'links',
        localField: '_id',
        foreignField: '_id',
        as: 'link',
      },
    },
    { $unwind: { path: '$link', preserveNullAndEmptyArrays: true } },
  ]);

  return rows.map((row) => ({
    linkId: String(row._id),
    title: row.link?.title || '',
    code: row.link?.customAlias || row.link?.shortCode || null,
    originalUrl: row.link?.originalUrl || null,
    status: row.link?.status || 'deleted',
    clicks: row.clicks,
    visitors: row.visitors.filter(Boolean).length,
  }));
}

export async function getLinkTrends({ workspaceId, range, limit = 50 }) {
  const scope = buildScope({ workspaceId });
  const duration = range.to.getTime() - range.from.getTime();
  const previousFrom = new Date(range.from.getTime() - duration - 1);

  const rows = await ClickEvent.aggregate([
    {
      $match: {
        ...scope,
        timestamp: { $gte: previousFrom, $lte: range.to },
      },
    },
    {
      $group: {
        _id: {
          link: '$link',
          period: { $cond: [{ $gte: ['$timestamp', range.from] }, 'current', 'previous'] },
        },
        clicks: { $sum: 1 },
        visitors: { $addToSet: '$ipHash' },
      },
    },
  ]);

  const map = new Map();
  for (const row of rows) {
    const key = String(row._id.link);
    const entry = map.get(key) || {
      linkId: key,
      currentClicks: 0,
      previousClicks: 0,
      currentVisitors: 0,
      previousVisitors: 0,
    };
    const visitors = row.visitors.filter(Boolean).length;
    if (row._id.period === 'current') {
      entry.currentClicks = row.clicks;
      entry.currentVisitors = visitors;
    } else {
      entry.previousClicks = row.clicks;
      entry.previousVisitors = visitors;
    }
    map.set(key, entry);
  }

  const entries = [...map.values()];
  if (entries.length === 0) return [];

  const linkIds = entries.map((entry) => new mongoose.Types.ObjectId(entry.linkId));
  const links = await Link.find({ _id: { $in: linkIds } })
    .select('title shortCode customAlias status campaign')
    .lean();
  const linkMap = new Map(links.map((link) => [String(link._id), link]));

  return entries
    .map((entry) => {
      const link = linkMap.get(entry.linkId);
      const changePercent =
        entry.previousClicks > 0
          ? Math.round(((entry.currentClicks - entry.previousClicks) / entry.previousClicks) * 1000) / 10
          : entry.currentClicks > 0
            ? 100
            : 0;

      return {
        linkId: entry.linkId,
        title: link?.title || '',
        code: link?.customAlias || link?.shortCode || null,
        status: link?.status || 'deleted',
        campaignId: link?.campaign ? String(link.campaign) : null,
        currentClicks: entry.currentClicks,
        previousClicks: entry.previousClicks,
        currentVisitors: entry.currentVisitors,
        previousVisitors: entry.previousVisitors,
        changePercent,
      };
    })
    .sort(
      (a, b) =>
        Math.max(b.currentClicks, b.previousClicks) - Math.max(a.currentClicks, a.previousClicks)
    )
    .slice(0, clampLimit(limit, 50, 200));
}

export async function getReferrers({ workspaceId, linkId, linkIds, range, limit = 10 }) {
  const match = withRange(buildScope({ workspaceId, linkId, linkIds }), range);

  const rows = await ClickEvent.aggregate([
    { $match: match },
    { $group: { _id: { $ifNull: ['$referrerDomain', 'Direct'] }, clicks: { $sum: 1 } } },
    { $sort: { clicks: -1 } },
    { $limit: clampLimit(limit, 10, 100) },
  ]);

  const total = rows.reduce((sum, row) => sum + row.clicks, 0);

  return {
    total,
    referrers: rows.map((row) => ({
      source: row._id,
      clicks: row.clicks,
      percentage: percentage(row.clicks, total),
    })),
  };
}

export async function getDevices({ workspaceId, linkId, linkIds, range }) {
  const match = withRange(buildScope({ workspaceId, linkId, linkIds }), range);

  const rows = await ClickEvent.aggregate([
    { $match: match },
    { $group: { _id: '$deviceType', clicks: { $sum: 1 } } },
    { $sort: { clicks: -1 } },
  ]);

  const total = rows.reduce((sum, row) => sum + row.clicks, 0);

  return {
    total,
    devices: rows.map((row) => ({
      type: row._id || 'unknown',
      clicks: row.clicks,
      percentage: percentage(row.clicks, total),
    })),
  };
}

export async function getBrowsers({ workspaceId, linkId, linkIds, range }) {
  const match = withRange(buildScope({ workspaceId, linkId, linkIds }), range);

  const [browserRows, osRows] = await Promise.all([
    ClickEvent.aggregate([
      { $match: match },
      { $group: { _id: { $ifNull: ['$browser', 'Unknown'] }, clicks: { $sum: 1 } } },
      { $sort: { clicks: -1 } },
      { $limit: 20 },
    ]),
    ClickEvent.aggregate([
      { $match: match },
      { $group: { _id: { $ifNull: ['$operatingSystem', 'Unknown'] }, clicks: { $sum: 1 } } },
      { $sort: { clicks: -1 } },
      { $limit: 20 },
    ]),
  ]);

  const browserTotal = browserRows.reduce((sum, row) => sum + row.clicks, 0);
  const osTotal = osRows.reduce((sum, row) => sum + row.clicks, 0);

  return {
    total: browserTotal,
    browsers: browserRows.map((row) => ({
      name: row._id,
      clicks: row.clicks,
      percentage: percentage(row.clicks, browserTotal),
    })),
    operatingSystems: osRows.map((row) => ({
      name: row._id,
      clicks: row.clicks,
      percentage: percentage(row.clicks, osTotal),
    })),
  };
}

export async function getLocations({ workspaceId, linkId, linkIds, range, limit = 50 }) {
  const match = withRange(buildScope({ workspaceId, linkId, linkIds }), range);

  const [rows, unknownClicks] = await Promise.all([
    ClickEvent.aggregate([
      { $match: { ...match, country: { $ne: null } } },
      { $group: { _id: { country: '$country', region: '$region' }, clicks: { $sum: 1 } } },
      { $sort: { clicks: -1 } },
      { $limit: clampLimit(limit, 50, 200) },
    ]),
    ClickEvent.countDocuments({ ...match, country: null }),
  ]);

  const total = rows.reduce((sum, row) => sum + row.clicks, 0);

  return {
    hasGeoData: rows.length > 0,
    unknownClicks,
    locations: rows.map((row) => ({
      country: row._id.country,
      region: row._id.region,
      clicks: row.clicks,
      percentage: percentage(row.clicks, total),
    })),
  };
}

export async function getLinkAnalytics({ link, range }) {
  const scope = { workspaceId: String(link.workspace), linkId: String(link._id) };

  const scoped = { ...scope, range };

  const [overview, clicksOverTime, referrers, devices, browsers, locations] = await Promise.all([
    getOverview(scoped),
    getClicksOverTime(scoped),
    getReferrers(scoped),
    getDevices(scoped),
    getBrowsers(scoped),
    getLocations(scoped),
  ]);

  return { overview, clicksOverTime, referrers, devices, browsers, locations };
}

export async function getRecentClicks({ workspaceId, linkId = null, limit = 20 }) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const filter = {
    workspace: toObjectId(workspaceId),
    timestamp: { $gte: since },
  };

  if (linkId) filter.link = toObjectId(linkId);

  const rows = await ClickEvent.find(filter)
    .sort({ timestamp: -1 })
    .limit(clampLimit(limit, 20, 50))
    .populate('link', 'title shortCode customAlias')
    .lean();

  return rows.map((row) => serializeClick(row, row.link));
}
