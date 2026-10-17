import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import Link from '../models/Link.js';
import { isValidHttpUrl, normalizeUrl, isValidAlias, normalizeAlias } from '../utils/url.js';
import { generateUniqueCode } from '../utils/shortCode.js';
import { hashLinkPassword } from '../utils/linkPassword.js';
import Campaign from '../models/Campaign.js';
import { resolveTagIds } from './tag.service.js';
import { isValidObjectId } from '../utils/validators.js';

const STATUSES = ['active', 'disabled'];
const MAX_CLICK_LIMIT = 100000000;
const MAX_PAGE_SIZE = 100;

const POPULATE = [
  { path: 'campaign', select: 'name status' },
  { path: 'tags', select: 'name key' },
];

async function resolveCampaignId(workspaceId, value) {
  if (value === undefined) return undefined;
  if (value === null || value === '' || value === 'none') return null;
  if (!isValidObjectId(value)) {
    throw ApiError.badRequest('Invalid campaign id');
  }

  const campaign = await Campaign.findOne({ _id: value, workspace: workspaceId });
  if (!campaign) {
    throw ApiError.badRequest('Campaign does not belong to this workspace');
  }

  return campaign._id;
}

function serializeCampaignRef(campaign) {
  if (!campaign) return null;
  if (typeof campaign === 'object' && campaign._id) {
    return {
      id: String(campaign._id),
      name: campaign.name || '',
      status: campaign.status || null,
    };
  }
  return { id: String(campaign), name: '', status: null };
}

function serializeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags.map((tag) => {
    if (tag && typeof tag === 'object' && tag._id) {
      return { id: String(tag._id), name: tag.name || '', key: tag.key || '' };
    }
    return { id: String(tag), name: '', key: '' };
  });
}

function codeIsTaken(code) {
  return Link.exists({ $or: [{ shortCode: code }, { customAlias: code }] });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseExpiresAt(value, { allowClear = false } = {}) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return allowClear ? null : null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw ApiError.badRequest('Expiration date is invalid');
  }
  if (date.getTime() <= Date.now()) {
    throw ApiError.badRequest('Expiration date must be in the future');
  }
  return date;
}

function parseClickLimit(value) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw ApiError.badRequest('Click limit must be a positive whole number');
  }
  if (parsed > MAX_CLICK_LIMIT) {
    throw ApiError.badRequest(`Click limit cannot exceed ${MAX_CLICK_LIMIT}`);
  }
  return parsed;
}

function cleanDestination(value) {
  if (value === undefined || value === null || value === '') return null;
  if (!isValidHttpUrl(value)) {
    throw ApiError.badRequest('Redirect destinations must use http:// or https://');
  }
  return normalizeUrl(value);
}

function normalizeRedirectRules(input) {
  if (input === undefined) return undefined;

  const errors = [];
  let defaultUrl = null;
  let devices = { mobile: null, tablet: null, desktop: null };

  try {
    defaultUrl = cleanDestination(input?.defaultUrl);
  } catch (error) {
    errors.push(error.message);
  }

  for (const category of ['mobile', 'tablet', 'desktop']) {
    try {
      devices[category] = cleanDestination(input?.devices?.[category]);
    } catch (error) {
      errors.push(`${category}: ${error.message}`);
    }
  }

  if (errors.length > 0) {
    throw ApiError.badRequest('Invalid redirect rules', errors);
  }

  const hasAnyDestination = Boolean(defaultUrl) || Object.values(devices).some(Boolean);

  if (input?.enabled && !hasAnyDestination) {
    throw ApiError.badRequest(
      'Enable redirect rules requires at least one destination URL'
    );
  }

  return {
    enabled: Boolean(input?.enabled && hasAnyDestination),
    defaultUrl,
    devices,
  };
}

function parseOriginalUrl(value) {
  const normalized = normalizeUrl(value);
  if (!isValidHttpUrl(normalized)) {
    throw ApiError.badRequest('Original URL must be a valid http:// or https:// URL');
  }
  return normalized;
}

export function serializeLink(link) {
  const value = typeof link.toObject === 'function' ? link.toObject() : link;
  const code = value.customAlias || value.shortCode;
  const now = Date.now();
  const expiresAt = value.expiresAt ? new Date(value.expiresAt) : null;

  return {
    id: String(value._id),
    originalUrl: value.originalUrl,
    shortCode: value.shortCode,
    customAlias: value.customAlias || null,
    code,
    shortUrl: `${env.backendUrl}/${code}`,
    title: value.title || '',
    workspace: String(value.workspace),
    owner: String(value.owner),
    status: value.status,
    clickCount: value.clickCount || 0,
    clickLimit: value.clickLimit ?? null,
    expiresAt,
    hasPassword: Boolean(value.password),
    campaign: serializeCampaignRef(value.campaign),
    tags: serializeTags(value.tags),
    redirectRules: value.redirectRules || {
      enabled: false,
      defaultUrl: null,
      devices: { mobile: null, tablet: null, desktop: null },
    },
    qr: {
      fgColor: value.qr?.fgColor || '#000000',
      bgColor: value.qr?.bgColor || '#ffffff',
      size: value.qr?.size || 320,
      errorCorrectionLevel: value.qr?.errorCorrectionLevel || 'M',
    },
    isExpired: Boolean(expiresAt && expiresAt.getTime() <= now),
    isLimitReached: value.clickLimit != null && (value.clickCount || 0) >= value.clickLimit,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

export async function createLink({ workspaceId, ownerId, input }) {
  const originalUrl = parseOriginalUrl(input?.originalUrl);

  let customAlias = null;
  if (input?.customAlias) {
    if (!isValidAlias(input.customAlias)) {
      throw ApiError.badRequest(
        'Custom alias must be 3-50 characters using letters, numbers, hyphens, or underscores'
      );
    }
    customAlias = normalizeAlias(input.customAlias);
    if (await codeIsTaken(customAlias)) {
      throw ApiError.conflict('This custom alias is already in use');
    }
  }

  const expiresAt = parseExpiresAt(input?.expiresAt, { allowClear: true });
  const clickLimit = parseClickLimit(input?.clickLimit);
  const redirectRules = normalizeRedirectRules(input?.redirectRules);
  const password = input?.password ? hashLinkPassword(String(input.password)) : null;
  const campaign = await resolveCampaignId(
    workspaceId,
    input?.campaign !== undefined ? input.campaign : input?.campaignId
  );
  const tags = await resolveTagIds({ workspaceId, userId: ownerId, tags: input?.tags });

  const shortCode = await generateUniqueCode(codeIsTaken);

  try {
    const link = await Link.create({
      originalUrl,
      shortCode,
      customAlias: customAlias || undefined,
      title: typeof input?.title === 'string' ? input.title.trim() : '',
      owner: ownerId,
      workspace: workspaceId,
      expiresAt: expiresAt ?? null,
      clickLimit: clickLimit ?? null,
      password,
      campaign: campaign ?? null,
      tags: tags ?? [],
      redirectRules: redirectRules ?? undefined,
    });

    await link.populate(POPULATE);
    return link;
  } catch (error) {
    if (error.code === 11000) {
      throw ApiError.conflict('This short code or alias is already in use');
    }
    throw error;
  }
}

export async function listLinks({
  workspaceId,
  filter = 'all',
  search = '',
  campaignId,
  tagId,
  page = 1,
  limit = 10,
}) {
  const query = { workspace: workspaceId };

  if (filter === 'active') {
    query.status = 'active';
  } else if (filter === 'disabled') {
    query.status = 'disabled';
  } else if (filter === 'expired') {
    query.expiresAt = { $ne: null, $lte: new Date() };
  } else if (filter === 'protected') {
    query.password = { $ne: null };
  }

  if (campaignId !== undefined && campaignId !== null && campaignId !== '') {
    if (campaignId === 'none') {
      query.campaign = null;
    } else if (campaignId !== 'all') {
      if (!isValidObjectId(campaignId)) {
        throw ApiError.badRequest('Invalid campaign filter');
      }
      query.campaign = campaignId;
    }
  }

  if (tagId) {
    if (!isValidObjectId(tagId)) {
      throw ApiError.badRequest('Invalid tag filter');
    }
    query.tags = tagId;
  }

  const term = typeof search === 'string' ? search.trim() : '';
  if (term) {
    const pattern = new RegExp(escapeRegExp(term), 'i');
    query.$or = [
      { title: pattern },
      { originalUrl: pattern },
      { shortCode: pattern },
      { customAlias: pattern },
    ];
  }

  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 10, 1), MAX_PAGE_SIZE);
  const safePage = Math.max(Number.parseInt(page, 10) || 1, 1);

  const [links, total] = await Promise.all([
    Link.find(query)
      .select('+password')
      .populate(POPULATE)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit),
    Link.countDocuments(query),
  ]);

  return {
    links: links.map(serializeLink),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(Math.ceil(total / safeLimit), 1),
    },
  };
}

export async function getLinkById(id) {
  const link = await Link.findById(id).select('+password').populate(POPULATE);
  if (!link) {
    throw ApiError.notFound('Link not found');
  }
  return link;
}

export async function updateLink(link, input) {
  const updates = {};

  if (input?.originalUrl !== undefined) {
    updates.originalUrl = parseOriginalUrl(input.originalUrl);
  }

  if (input?.customAlias !== undefined) {
    if (input.customAlias === null || input.customAlias === '') {
      updates.customAlias = undefined;
    } else {
      if (!isValidAlias(input.customAlias)) {
        throw ApiError.badRequest(
          'Custom alias must be 3-50 characters using letters, numbers, hyphens, or underscores'
        );
      }
      const alias = normalizeAlias(input.customAlias);
      const conflict = await Link.exists({
        _id: { $ne: link.id },
        $or: [{ shortCode: alias }, { customAlias: alias }],
      });
      if (conflict) {
        throw ApiError.conflict('This custom alias is already in use');
      }
      updates.customAlias = alias;
    }
  }

  if (input?.title !== undefined) {
    updates.title = typeof input.title === 'string' ? input.title.trim() : '';
  }

  if (input?.status !== undefined) {
    if (!STATUSES.includes(input.status)) {
      throw ApiError.badRequest('Status must be either "active" or "disabled"');
    }
    updates.status = input.status;
  }

  if (input?.expiresAt !== undefined) {
    updates.expiresAt = parseExpiresAt(input.expiresAt, { allowClear: true });
  }

  if (input?.clickLimit !== undefined) {
    updates.clickLimit = parseClickLimit(input.clickLimit);
  }

  if (input?.password !== undefined) {
    if (input.password === null || input.password === '') {
      updates.password = null;
    } else if (typeof input.password === 'string') {
      if (input.password.length < 4) {
        throw ApiError.badRequest('Link password must be at least 4 characters');
      }
      updates.password = hashLinkPassword(input.password);
    } else {
      throw ApiError.badRequest('Link password must be a string');
    }
  }

  if (input?.redirectRules !== undefined) {
    const rules = normalizeRedirectRules(input.redirectRules);
    if (rules) updates.redirectRules = rules;
  }

  if (input?.campaign !== undefined || input?.campaignId !== undefined) {
    const value = input.campaign !== undefined ? input.campaign : input.campaignId;
    updates.campaign = await resolveCampaignId(link.workspace, value);
  }

  if (input?.tags !== undefined) {
    const tags = await resolveTagIds({
      workspaceId: link.workspace,
      userId: link.owner,
      tags: input.tags,
    });
    updates.tags = tags ?? [];
  }

  Object.assign(link, updates);

  try {
    await link.save();
  } catch (error) {
    if (error.code === 11000) {
      throw ApiError.conflict('This short code or alias is already in use');
    }
    throw error;
  }

  await link.populate(POPULATE);
  return link;
}

export async function deleteLink(link) {
  await Link.deleteOne({ _id: link._id });
}
