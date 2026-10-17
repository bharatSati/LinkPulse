import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';
import Campaign, { CAMPAIGN_STATUSES } from '../models/Campaign.js';
import Link from '../models/Link.js';
import { listLinks } from './link.service.js';
import { resolveTagIds } from './tag.service.js';
import * as analyticsService from './analytics.service.js';
import { notifyWorkspaceAdmins } from './notification.service.js';

const MAX_PAGE_SIZE = 100;

const SORTS = {
  recent: { createdAt: -1 },
  oldest: { createdAt: 1 },
  name: { name: 1 },
};

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseName(value) {
  const name = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
  if (!name) {
    throw ApiError.badRequest('Campaign name is required');
  }
  if (name.length > 120) {
    throw ApiError.badRequest('Campaign name must be at most 120 characters');
  }
  return name;
}

function parseDescription(value) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') {
    throw ApiError.badRequest('Campaign description must be a string');
  }
  const description = value.trim();
  if (description.length > 1000) {
    throw ApiError.badRequest('Campaign description must be at most 1000 characters');
  }
  return description;
}

function parseStatus(value) {
  if (value === undefined) return undefined;
  if (!CAMPAIGN_STATUSES.includes(value)) {
    throw ApiError.badRequest(`Campaign status must be one of: ${CAMPAIGN_STATUSES.join(', ')}`);
  }
  return value;
}

function parseOptionalDate(value, label) {
  if (value === undefined || value === null || value === '') return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw ApiError.badRequest(`${label} is invalid`);
  }
  return date;
}

function assertDateOrder(startDate, endDate) {
  if (startDate && endDate && endDate.getTime() < startDate.getTime()) {
    throw ApiError.badRequest('Campaign end date must be on or after the start date');
  }
}

function serializeTagRef(tag) {
  if (tag && typeof tag === 'object' && tag._id) {
    return { id: String(tag._id), name: tag.name || '', key: tag.key || '' };
  }
  return { id: String(tag), name: '', key: '' };
}

export function serializeCampaign(campaign, extras = {}) {
  const value = typeof campaign.toObject === 'function' ? campaign.toObject() : campaign;
  const tags = Array.isArray(value.tags) ? value.tags : [];

  return {
    id: String(value._id),
    name: value.name,
    description: value.description || '',
    workspace: String(value.workspace),
    owner: value.owner ? String(value.owner) : null,
    status: value.status,
    startDate: value.startDate || null,
    endDate: value.endDate || null,
    tags: tags.map(serializeTagRef),
    linkCount: extras.linkCount ?? 0,
    clickCount: extras.clickCount ?? 0,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

async function campaignMetrics(workspaceId, campaignIds) {
  const map = new Map();
  if (!campaignIds || campaignIds.length === 0) return map;

  const ids = campaignIds.map((id) => new mongoose.Types.ObjectId(id));
  const rows = await Link.aggregate([
    {
      $match: {
        workspace: new mongoose.Types.ObjectId(workspaceId),
        campaign: { $in: ids },
      },
    },
    {
      $group: {
        _id: '$campaign',
        linkCount: { $sum: 1 },
        clickCount: { $sum: { $ifNull: ['$clickCount', 0] } },
      },
    },
  ]);

  for (const row of rows) {
    map.set(String(row._id), {
      linkCount: row.linkCount,
      clickCount: row.clickCount,
    });
  }
  return map;
}

export async function describeCampaign(campaign) {
  await campaign.populate('tags', 'name key');
  const metrics = await campaignMetrics(campaign.workspace, [campaign._id]);
  return serializeCampaign(campaign, metrics.get(String(campaign._id)) || {});
}

export async function listCampaigns({
  workspaceId,
  search = '',
  status = 'all',
  from,
  to,
  sort = 'recent',
  page = 1,
  limit = 12,
}) {
  const query = { workspace: workspaceId };

  if (status && status !== 'all') {
    if (!CAMPAIGN_STATUSES.includes(status)) {
      throw ApiError.badRequest('Invalid campaign status filter');
    }
    query.status = status;
  }

  const term = typeof search === 'string' ? search.trim() : '';
  if (term) {
    const pattern = new RegExp(escapeRegExp(term), 'i');
    query.$or = [{ name: pattern }, { description: pattern }];
  }

  const fromDate = parseOptionalDate(from, 'From date');
  const toDate = parseOptionalDate(to, 'To date');
  const andClauses = [];
  if (fromDate) {
    andClauses.push({ $or: [{ endDate: null }, { endDate: { $gte: fromDate } }] });
  }
  if (toDate) {
    andClauses.push({ $or: [{ startDate: null }, { startDate: { $lte: toDate } }] });
  }
  if (andClauses.length > 0) {
    query.$and = andClauses;
  }

  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 12, 1), MAX_PAGE_SIZE);
  const safePage = Math.max(Number.parseInt(page, 10) || 1, 1);
  const sortSpec = SORTS[sort] || SORTS.recent;

  const [docs, total] = await Promise.all([
    Campaign.find(query)
      .populate('tags', 'name key')
      .sort(sortSpec)
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit),
    Campaign.countDocuments(query),
  ]);

  const metrics = await campaignMetrics(workspaceId, docs.map((doc) => doc._id));

  return {
    campaigns: docs.map((doc) => serializeCampaign(doc, metrics.get(String(doc._id)) || {})),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(Math.ceil(total / safeLimit), 1),
    },
  };
}

export async function createCampaign({ workspaceId, ownerId, input }) {
  const name = parseName(input?.name);
  const nameKey = name.toLowerCase();

  const existing = await Campaign.findOne({ workspace: workspaceId, nameKey });
  if (existing) {
    throw ApiError.conflict('A campaign with this name already exists in this workspace');
  }

  const startDate = parseOptionalDate(input?.startDate, 'Start date');
  const endDate = parseOptionalDate(input?.endDate, 'End date');
  assertDateOrder(startDate, endDate);

  const tags = await resolveTagIds({ workspaceId, userId: ownerId, tags: input?.tags });

  try {
    const campaign = await Campaign.create({
      name,
      nameKey,
      description: parseDescription(input?.description),
      workspace: workspaceId,
      owner: ownerId,
      status: parseStatus(input?.status) ?? 'active',
      startDate: startDate ?? null,
      endDate: endDate ?? null,
      tags: tags ?? [],
    });

    await campaign.populate('tags', 'name key');

    await notifyWorkspaceAdmins({
      workspaceId,
      type: 'campaign_event',
      title: 'Campaign created',
      message: `Campaign "${campaign.name}" was created.`,
      targetUrl: '/app/campaigns',
      dedupeKey: `campaign_created:${campaign.id}`,
      data: { campaignId: campaign.id },
    });

    return campaign;
  } catch (error) {
    if (error.code === 11000) {
      throw ApiError.conflict('A campaign with this name already exists in this workspace');
    }
    throw error;
  }
}

export async function updateCampaign(campaign, input) {
  if (input?.name !== undefined) {
    const name = parseName(input.name);
    const nameKey = name.toLowerCase();

    if (nameKey !== campaign.nameKey) {
      const conflict = await Campaign.exists({
        _id: { $ne: campaign._id },
        workspace: campaign.workspace,
        nameKey,
      });
      if (conflict) {
        throw ApiError.conflict('A campaign with this name already exists in this workspace');
      }
    }

    campaign.name = name;
    campaign.nameKey = nameKey;
  }

  if (input?.description !== undefined) {
    campaign.description = parseDescription(input.description);
  }

  const previousStatus = campaign.status;
  if (input?.status !== undefined) {
    campaign.status = parseStatus(input.status);
  }

  let startDate = campaign.startDate;
  let endDate = campaign.endDate;
  if (input?.startDate !== undefined) {
    startDate = parseOptionalDate(input.startDate, 'Start date');
  }
  if (input?.endDate !== undefined) {
    endDate = parseOptionalDate(input.endDate, 'End date');
  }
  assertDateOrder(startDate, endDate);
  campaign.startDate = startDate;
  campaign.endDate = endDate;

  if (input?.tags !== undefined) {
    const tags = await resolveTagIds({
      workspaceId: campaign.workspace,
      userId: campaign.owner,
      tags: input.tags,
    });
    campaign.tags = tags ?? [];
  }

  try {
    await campaign.save();
  } catch (error) {
    if (error.code === 11000) {
      throw ApiError.conflict('A campaign with this name already exists in this workspace');
    }
    throw error;
  }

  await campaign.populate('tags', 'name key');

  if (previousStatus !== campaign.status) {
    await notifyWorkspaceAdmins({
      workspaceId: campaign.workspace,
      type: 'campaign_event',
      title: 'Campaign status changed',
      message: `Campaign "${campaign.name}" is now ${campaign.status}.`,
      targetUrl: '/app/campaigns',
      dedupeKey: `campaign_status:${campaign.id}:${campaign.status}`,
      data: { campaignId: String(campaign._id), status: campaign.status },
    });
  }

  return campaign;
}

/**
 * Safe deletion policy: detach links (and keep their click history intact)
 * before removing the campaign itself. Links and ClickEvents are never deleted.
 */
export async function deleteCampaign(campaign) {
  const detached = await Link.updateMany(
    { campaign: campaign._id },
    { $set: { campaign: null } }
  );

  await Campaign.deleteOne({ _id: campaign._id });

  return { detachedLinks: detached.modifiedCount };
}

export async function getCampaignLinks({ campaign, search, filter, page, limit }) {
  return listLinks({
    workspaceId: campaign.workspace,
    campaignId: campaign.id,
    search,
    filter,
    page,
    limit,
  });
}

export async function getCampaignAnalytics({ campaign, range }) {
  const workspaceId = campaign.workspace;
  const linkIds = await Link.find({ campaign: campaign._id }).distinct('_id');
  const scope = { workspaceId, linkIds, range };

  const [overview, clicksOverTime, topLinks, referrers, devices, browsers, locations] =
    await Promise.all([
      analyticsService.getOverview(scope),
      analyticsService.getClicksOverTime(scope),
      analyticsService.getTopLinks({ workspaceId, linkIds, range, limit: 10 }),
      analyticsService.getReferrers(scope),
      analyticsService.getDevices(scope),
      analyticsService.getBrowsers(scope),
      analyticsService.getLocations(scope),
    ]);

  const totalLinks = linkIds.length;

  return {
    campaign: serializeCampaign(campaign, {
      linkCount: totalLinks,
      clickCount: overview.totalClicks,
    }),
    totalLinks,
    overview: { ...overview, linksCount: totalLinks },
    clicksOverTime,
    topLinks,
    referrers,
    devices,
    browsers,
    locations,
  };
}
