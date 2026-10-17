import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import BioPage from '../models/BioPage.js';
import Link from '../models/Link.js';
import { isValidHttpUrl, normalizeUrl } from '../utils/url.js';
import { isValidObjectId } from '../utils/validators.js';
import {
  BIO_BUTTON_STYLES,
  BIO_SOCIAL_PLATFORMS,
  BIO_THEMES,
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_TEXT_COLOR,
  MAX_BIO_DESCRIPTION,
  MAX_BIO_LINKS,
  MAX_BIO_LINK_TITLE,
  MAX_BIO_SOCIAL_LINKS,
  MAX_BIO_TITLE,
  isMailto,
  isValidUsername,
  normalizeHex,
  normalizeUsername,
  usernameError,
} from '../utils/bio.js';

const MAX_PAGE_SIZE = 50;

const POPULATE = [{ path: 'links.link', select: 'shortCode customAlias status' }];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function shortUrlFor(link) {
  const code = link.customAlias || link.shortCode;
  return code ? `${env.backendUrl}/${code}` : '';
}

function resolveItemUrl(item) {
  if (item.link && typeof item.link === 'object' && item.link.shortCode) {
    const resolved = shortUrlFor(item.link);
    if (resolved) return resolved;
  }
  return item.url || '';
}

function parseText(value, max, label) {
  if (value === undefined) return undefined;
  const text = typeof value === 'string' ? value.trim() : '';
  if (text.length > max) {
    throw ApiError.badRequest(`${label} must be at most ${max} characters`);
  }
  return text;
}

function parseAvatar(value) {
  if (value === undefined) return undefined;
  const url = typeof value === 'string' ? value.trim() : '';
  if (!url) return '';
  if (!isValidHttpUrl(url)) {
    throw ApiError.badRequest('Avatar URL must be a valid http:// or https:// URL');
  }
  return url;
}

function parseColor(value, fallback, label) {
  if (value === undefined) return undefined;
  const hex = normalizeHex(value, fallback);
  if (hex === null) {
    throw ApiError.badRequest(`${label} must be a hex value such as ${fallback}`);
  }
  return hex;
}

function parseEnum(value, allowed, label) {
  if (value === undefined) return undefined;
  if (!allowed.includes(value)) {
    throw ApiError.badRequest(`${label} must be one of ${allowed.join(', ')}`);
  }
  return value;
}

export async function parseLinksInput({ workspaceId, rawLinks }) {
  if (rawLinks === undefined) return undefined;
  if (!Array.isArray(rawLinks)) {
    throw ApiError.badRequest('links must be an array');
  }
  if (rawLinks.length > MAX_BIO_LINKS) {
    throw ApiError.badRequest(`A bio page can have at most ${MAX_BIO_LINKS} links`);
  }

  const result = [];

  for (const raw of rawLinks) {
    const title = typeof raw?.title === 'string' ? raw.title.trim() : '';
    if (title.length > MAX_BIO_LINK_TITLE) {
      throw ApiError.badRequest(`Link titles must be at most ${MAX_BIO_LINK_TITLE} characters`);
    }

    const enabled = raw?.enabled === undefined ? true : Boolean(raw.enabled);
    let linkId = null;
    let url = '';

    if (raw?.link) {
      if (!isValidObjectId(raw.link)) {
        throw ApiError.badRequest('Invalid LinkPulse link reference');
      }
      const link = await Link.findOne({ _id: raw.link, workspace: workspaceId });
      if (!link) {
        throw ApiError.badRequest('One or more LinkPulse links do not belong to this workspace');
      }
      linkId = link._id;
      url = shortUrlFor(link);
    } else {
      const rawUrl = typeof raw?.url === 'string' ? raw.url.trim() : '';
      if (!rawUrl) {
        throw ApiError.badRequest('Each bio link needs a destination URL or a LinkPulse link');
      }
      if (!isValidHttpUrl(rawUrl)) {
        throw ApiError.badRequest('Bio link destinations must use http:// or https://');
      }
      url = normalizeUrl(rawUrl);
    }

    result.push({ title, url, link: linkId, enabled });
  }

  return result;
}

function normalizeSocialUrl(platform, value) {
  const url = String(value || '').trim();
  if (!url) return null;

  if (platform === 'email') {
    if (isMailto(url)) return url;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(url)) return `mailto:${url}`;
    return null;
  }

  return isValidHttpUrl(url) ? normalizeUrl(url) : null;
}

export function parseSocialLinksInput(rawSocial) {
  if (rawSocial === undefined) return undefined;
  if (!Array.isArray(rawSocial)) {
    throw ApiError.badRequest('socialLinks must be an array');
  }
  if (rawSocial.length > MAX_BIO_SOCIAL_LINKS) {
    throw ApiError.badRequest(`A bio page can have at most ${MAX_BIO_SOCIAL_LINKS} social links`);
  }

  const result = [];

  for (const raw of rawSocial) {
    const platform = raw?.platform || 'website';
    if (!BIO_SOCIAL_PLATFORMS.includes(platform)) {
      throw ApiError.badRequest(`Unknown social platform "${platform}"`);
    }
    const url = normalizeSocialUrl(platform, raw?.url);
    if (!url) {
      throw ApiError.badRequest(
        platform === 'email'
          ? 'Email social links need an email address or mailto: link'
          : 'Social links must use http:// or https://'
      );
    }
    result.push({ platform, url });
  }

  return result;
}

export function serializeBioPage(page, { publicView = false } = {}) {
  const value = typeof page.toObject === 'function' ? page.toObject() : page;

  const links = (value.links || [])
    .filter((item) => !publicView || item.enabled !== false)
    .map((item) => ({
      id: String(item._id),
      title: item.title || '',
      url: resolveItemUrl(item),
      link: item.link
        ? String(item.link._id || item.link)
        : null,
      enabled: item.enabled !== false,
    }))
    .filter((item) => item.url);

  const socialLinks = (value.socialLinks || [])
    .map((item) => ({
      id: String(item._id),
      platform: item.platform,
      url: item.url,
    }))
    .filter((item) => item.url);

  const base = {
    username: value.username,
    title: value.title || '',
    description: value.description || '',
    avatarUrl: value.avatarUrl || '',
    backgroundColor: value.backgroundColor || DEFAULT_BACKGROUND_COLOR,
    textColor: value.textColor || DEFAULT_TEXT_COLOR,
    buttonStyle: value.buttonStyle || 'solid',
    theme: value.theme || 'dark',
    links,
    socialLinks,
    isPublished: Boolean(value.isPublished),
    path: `/bio/${value.username}`,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };

  if (publicView) return base;

  return {
    id: String(value._id),
    ...base,
    workspace: String(value.workspace),
    owner: value.owner ? String(value.owner._id || value.owner) : null,
  };
}

export async function listBioPages({ workspaceId, search = '', page = 1, limit = 10 }) {
  const query = { workspace: workspaceId };

  const term = typeof search === 'string' ? search.trim() : '';
  if (term) {
    const pattern = new RegExp(escapeRegExp(term), 'i');
    query.$or = [{ username: pattern }, { title: pattern }, { description: pattern }];
  }

  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 10, 1), MAX_PAGE_SIZE);
  const safePage = Math.max(Number.parseInt(page, 10) || 1, 1);

  const [pages, total] = await Promise.all([
    BioPage.find(query)
      .populate(POPULATE)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit),
    BioPage.countDocuments(query),
  ]);

  return {
    bioPages: pages.map((page_) => serializeBioPage(page_)),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(Math.ceil(total / safeLimit), 1),
    },
  };
}

export async function getBioPageById(id) {
  const page = await BioPage.findById(id).populate(POPULATE);
  if (!page) {
    throw ApiError.notFound('Bio page not found');
  }
  return page;
}

function validateTitleAndDescription(input) {
  const updates = {};
  const title = parseText(input?.title, MAX_BIO_TITLE, 'Title');
  if (title !== undefined) updates.title = title;
  const description = parseText(input?.description, MAX_BIO_DESCRIPTION, 'Description');
  if (description !== undefined) updates.description = description;
  return updates;
}

export async function createBioPage({ workspaceId, ownerId, input }) {
  const username = normalizeUsername(input?.username);
  const usernameIssue = usernameError(username);
  if (usernameIssue) {
    throw ApiError.badRequest(usernameIssue);
  }

  if (await BioPage.exists({ username })) {
    throw ApiError.conflict('This username is already taken');
  }

  const textFields = validateTitleAndDescription(input);
  const avatarUrl = parseAvatar(input?.avatarUrl);
  const backgroundColor = parseColor(input?.backgroundColor, DEFAULT_BACKGROUND_COLOR, 'Background color');
  const textColor = parseColor(input?.textColor, DEFAULT_TEXT_COLOR, 'Text color');
  const buttonStyle = parseEnum(input?.buttonStyle, BIO_BUTTON_STYLES, 'Button style');
  const theme = parseEnum(input?.theme, BIO_THEMES, 'Theme');
  const links = await parseLinksInput({ workspaceId, rawLinks: input?.links });
  const socialLinks = parseSocialLinksInput(input?.socialLinks);

  try {
    const page = await BioPage.create({
      owner: ownerId,
      workspace: workspaceId,
      username,
      title: textFields.title ?? '',
      description: textFields.description ?? '',
      avatarUrl: avatarUrl ?? '',
      backgroundColor: backgroundColor ?? DEFAULT_BACKGROUND_COLOR,
      textColor: textColor ?? DEFAULT_TEXT_COLOR,
      buttonStyle: buttonStyle ?? 'solid',
      theme: theme ?? 'dark',
      links: links ?? [],
      socialLinks: socialLinks ?? [],
      isPublished: Boolean(input?.isPublished),
    });

    await page.populate(POPULATE);
    return page;
  } catch (error) {
    if (error.code === 11000) {
      throw ApiError.conflict('This username is already taken');
    }
    throw error;
  }
}

export async function updateBioPage(page, input) {
  const updates = validateTitleAndDescription(input);

  if (input?.username !== undefined) {
    const username = normalizeUsername(input.username);
    const usernameIssue = usernameError(username);
    if (usernameIssue) {
      throw ApiError.badRequest(usernameIssue);
    }
    if (username !== page.username) {
      const conflict = await BioPage.exists({ _id: { $ne: page._id }, username });
      if (conflict) {
        throw ApiError.conflict('This username is already taken');
      }
    }
    updates.username = username;
  }

  const avatarUrl = parseAvatar(input?.avatarUrl);
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

  const backgroundColor = parseColor(input?.backgroundColor, DEFAULT_BACKGROUND_COLOR, 'Background color');
  if (backgroundColor !== undefined) updates.backgroundColor = backgroundColor;

  const textColor = parseColor(input?.textColor, DEFAULT_TEXT_COLOR, 'Text color');
  if (textColor !== undefined) updates.textColor = textColor;

  const buttonStyle = parseEnum(input?.buttonStyle, BIO_BUTTON_STYLES, 'Button style');
  if (buttonStyle !== undefined) updates.buttonStyle = buttonStyle;

  const theme = parseEnum(input?.theme, BIO_THEMES, 'Theme');
  if (theme !== undefined) updates.theme = theme;

  const links = await parseLinksInput({ workspaceId: page.workspace, rawLinks: input?.links });
  if (links !== undefined) updates.links = links;

  const socialLinks = parseSocialLinksInput(input?.socialLinks);
  if (socialLinks !== undefined) updates.socialLinks = socialLinks;

  if (input?.isPublished !== undefined) {
    updates.isPublished = Boolean(input.isPublished);
  }

  Object.assign(page, updates);

  try {
    await page.save();
  } catch (error) {
    if (error.code === 11000) {
      throw ApiError.conflict('This username is already taken');
    }
    throw error;
  }

  await page.populate(POPULATE);
  return page;
}

export async function setBioPagePublished(page, isPublished) {
  page.isPublished = Boolean(isPublished);
  await page.save();
  await page.populate(POPULATE);
  return page;
}

export async function deleteBioPage(page) {
  await BioPage.deleteOne({ _id: page._id });
}

export async function checkUsernameAvailability({ username, excludeId }) {
  const issue = usernameError(username);
  if (issue) {
    return { available: false, reason: issue };
  }

  const query = { username: normalizeUsername(username) };
  if (excludeId && isValidObjectId(excludeId)) {
    query._id = { $ne: excludeId };
  }

  const exists = await BioPage.exists(query);
  return {
    available: !exists,
    reason: exists ? 'This username is already taken' : null,
  };
}

export async function getPublicBioPage(username) {
  const normalized = normalizeUsername(username);
  if (!isValidUsername(normalized)) {
    throw ApiError.notFound('Bio page not found');
  }

  const page = await BioPage.findOne({ username: normalized }).populate(POPULATE);
  if (!page || !page.isPublished) {
    throw ApiError.notFound('Bio page not found');
  }

  return serializeBioPage(page, { publicView: true });
}
