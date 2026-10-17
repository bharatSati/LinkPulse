import { parse } from 'csv-parse/sync';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import Link from '../models/Link.js';
import Campaign from '../models/Campaign.js';
import ImportJob from '../models/ImportJob.js';
import { isValidHttpUrl, normalizeUrl, isValidAlias, normalizeAlias } from '../utils/url.js';
import { generateUniqueCode } from '../utils/shortCode.js';
import { isValidObjectId } from '../utils/validators.js';
import { MAX_TAGS_PER_RESOURCE } from '../utils/tags.js';
import { resolveTagIds } from './tag.service.js';

const REQUIRED_COLUMNS = ['originalurl'];
const COLUMN_ALIASES = {
  originalurl: 'originalurl',
  url: 'originalurl',
  destination: 'originalurl',
  customalias: 'customalias',
  alias: 'customalias',
  slug: 'customalias',
  title: 'title',
  name: 'title',
  campaign: 'campaign',
  tags: 'tags',
  expiresat: 'expiresat',
  expiry: 'expiresat',
  expiration: 'expiresat',
  clicklimit: 'clicklimit',
  limit: 'clicklimit',
};

const BATCH_SIZE = 100;
const MAX_STORED_ERRORS = 500;
const MAX_TITLE_LENGTH = 200;
const MAX_CLICK_LIMIT = 100000000;

function normalizeHeaderCell(value) {
  const key = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  return COLUMN_ALIASES[key] || key;
}

function parseImportDate(value) {
  const trimmed = String(value || '').trim();
  const match =
    /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?(Z|[+-]\d{2}:?\d{2})?$/.exec(
      trimmed
    );
  if (!match) return null;

  const [, year, month, day, hour, minute, second, tz] = match;
  const y = Number(year);
  const mo = Number(month);
  const d = Number(day);
  const h = hour === undefined ? 0 : Number(hour);
  const mi = minute === undefined ? 0 : Number(minute);
  const s = second === undefined ? 0 : Number(second);

  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59 || s > 59) {
    return null;
  }

  const iso = `${year}-${month}-${day}T${String(h).padStart(2, '0')}:${String(mi).padStart(
    2,
    '0'
  )}:${String(s).padStart(2, '0')}${tz || 'Z'}`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  const check = new Date(Date.UTC(y, mo - 1, d));
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) {
    return null;
  }

  return date;
}

async function loadCampaignMaps(workspaceId) {
  const campaigns = await Campaign.find({ workspace: workspaceId }).select('name nameKey');
  const byKey = new Map();
  const byId = new Map();
  for (const campaign of campaigns) {
    const ref = { id: String(campaign._id), name: campaign.name };
    byId.set(String(campaign._id), ref);
    byKey.set(campaign.nameKey || campaign.name.trim().toLowerCase(), ref);
  }
  return { byKey, byId };
}

function validateRow(record, campaigns) {
  const errors = [];

  const rawUrl = String(record.originalurl || '').trim();
  if (!rawUrl) {
    errors.push('originalUrl is required');
  } else if (!isValidHttpUrl(rawUrl)) {
    errors.push('originalUrl must be a valid http:// or https:// URL');
  }

  let customAlias = null;
  const rawAlias = String(record.customalias || '').trim();
  if (rawAlias) {
    if (!isValidAlias(rawAlias)) {
      errors.push(
        'customAlias must be 3-50 characters using letters, numbers, hyphens, or underscores'
      );
    } else {
      customAlias = normalizeAlias(rawAlias);
    }
  }

  let title = String(record.title || '').trim();
  if (title.length > MAX_TITLE_LENGTH) {
    errors.push(`title must be at most ${MAX_TITLE_LENGTH} characters`);
    title = title.slice(0, MAX_TITLE_LENGTH);
  }

  let expiresAt = null;
  const rawExpires = String(record.expiresat || '').trim();
  if (rawExpires) {
    const parsed = parseImportDate(rawExpires);
    if (!parsed) {
      errors.push('expiresAt must be a date such as 2026-12-31 or 2026-12-31T23:00:00Z');
    } else if (parsed.getTime() <= Date.now()) {
      errors.push('expiresAt must be in the future');
    } else {
      expiresAt = parsed;
    }
  }

  let clickLimit = null;
  const rawLimit = String(record.clicklimit || '').trim();
  if (rawLimit) {
    const parsed = Number(rawLimit);
    if (!Number.isInteger(parsed) || parsed < 1) {
      errors.push('clickLimit must be a positive whole number');
    } else if (parsed > MAX_CLICK_LIMIT) {
      errors.push(`clickLimit cannot exceed ${MAX_CLICK_LIMIT}`);
    } else {
      clickLimit = parsed;
    }
  }

  let campaign = null;
  const rawCampaign = String(record.campaign || '').trim();
  if (rawCampaign) {
    const found =
      campaigns.byKey.get(rawCampaign.toLowerCase()) ||
      (isValidObjectId(rawCampaign) ? campaigns.byId.get(rawCampaign) : null);
    if (!found) {
      errors.push(`campaign "${rawCampaign}" was not found in this workspace`);
    } else {
      campaign = found.id;
    }
  }

  const tagNames = String(record.tags || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
  if (tagNames.length > MAX_TAGS_PER_RESOURCE) {
    errors.push(`at most ${MAX_TAGS_PER_RESOURCE} tags are allowed per row`);
  }

  return {
    errors,
    data: {
      originalUrl: rawUrl && isValidHttpUrl(rawUrl) ? normalizeUrl(rawUrl) : '',
      customAlias,
      title,
      expiresAt,
      clickLimit,
      campaign,
      tagNames,
    },
  };
}

function describeWriteError(message) {
  if (/duplicate key|E11000/i.test(message)) {
    return 'This custom alias or short code is already in use';
  }
  return 'This row could not be saved';
}

export function buildTemplateCsv() {
  return [
    'originalUrl,customAlias,title,campaign,tags,expiresAt,clickLimit',
    'https://example.com/spring-sale,spring-sale,Spring Sale,Spring Launch,"newsletter,spring",2026-12-31,1000',
    'https://example.com/pricing,,Pricing page,,"product,seo",,',
    'https://example.com/blog/how-to-shorten-links,,Guide,Summer Launch,"content",2027-01-15T09:00:00Z,5000',
  ].join('\n');
}

export function serializeImportJob(job) {
  const value = typeof job.toObject === 'function' ? job.toObject() : job;
  return {
    id: String(value._id),
    workspace: String(value.workspace),
    user: value.user ? String(value.user) : null,
    fileName: value.fileName || '',
    fileSize: value.fileSize || 0,
    status: value.status,
    totalRows: value.totalRows || 0,
    imported: value.importedCount || 0,
    failed: value.failedCount || 0,
    skipped: value.skippedCount || 0,
    errors: (value.rowErrors || []).map((item) => ({ row: item.row, message: item.message })),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

export async function importLinksCsv({ workspaceId, userId, fileName, fileSize, buffer }) {
  if (!buffer || buffer.length === 0) {
    throw ApiError.badRequest('The uploaded CSV file is empty');
  }

  let header = [];
  let records;
  try {
    records = parse(buffer.toString('utf8'), {
      bom: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      columns: (cells) => {
        header = cells.map(normalizeHeaderCell);
        return header;
      },
    });
  } catch {
    throw ApiError.badRequest('The uploaded file could not be parsed as CSV');
  }

  const missing = REQUIRED_COLUMNS.filter((column) => !header.includes(column));
  if (missing.length > 0) {
    throw ApiError.badRequest('CSV is missing required columns', [
      `Required columns: originalUrl (found: ${header.join(', ') || 'none'})`,
    ]);
  }

  if (records.length === 0) {
    throw ApiError.badRequest('The CSV file contains no data rows');
  }

  if (records.length > env.importMaxRows) {
    throw ApiError.badRequest(
      `A single import can contain at most ${env.importMaxRows} rows`
    );
  }

  const startedAt = Date.now();
  const campaigns = await loadCampaignMaps(workspaceId);
  const errors = [];
  const skippedRows = [];
  const validRows = [];

  records.forEach((record, index) => {
    const rowNumber = index + 2;
    const hasContent = Object.values(record).some(
      (value) => value !== undefined && String(value).trim() !== ''
    );
    if (!hasContent) {
      skippedRows.push(rowNumber);
      return;
    }

    const { errors: rowErrors, data } = validateRow(record, campaigns);
    if (rowErrors.length > 0) {
      errors.push({ row: rowNumber, message: rowErrors.join('; ') });
      return;
    }
    validRows.push({ row: rowNumber, data });
  });

  const seenAliases = new Map();
  const uniqueRows = [];
  for (const item of validRows) {
    const alias = item.data.customAlias;
    if (alias) {
      if (seenAliases.has(alias)) {
        errors.push({
          row: item.row,
          message: `customAlias "${alias}" duplicates row ${seenAliases.get(alias)}`,
        });
        continue;
      }
      seenAliases.set(alias, item.row);
    }
    uniqueRows.push(item);
  }

  const aliases = uniqueRows.map((item) => item.data.customAlias).filter(Boolean);
  const taken = new Set();
  if (aliases.length > 0) {
    const existing = await Link.find({
      $or: [{ shortCode: { $in: aliases } }, { customAlias: { $in: aliases } }],
    }).select('shortCode customAlias');
    for (const link of existing) {
      if (link.shortCode) taken.add(link.shortCode);
      if (link.customAlias) taken.add(link.customAlias);
    }
  }

  const readyRows = [];
  for (const item of uniqueRows) {
    if (item.data.customAlias && taken.has(item.data.customAlias)) {
      errors.push({
        row: item.row,
        message: `customAlias "${item.data.customAlias}" is already in use`,
      });
      continue;
    }
    readyRows.push(item);
  }

  const usedCodes = new Set();
  const codeIsTaken = async (code) =>
    usedCodes.has(code) || Boolean(await Link.exists({ $or: [{ shortCode: code }, { customAlias: code }] }));

  let imported = 0;

  for (let start = 0; start < readyRows.length; start += BATCH_SIZE) {
    const batch = readyRows.slice(start, start + BATCH_SIZE);
    const docs = [];

    for (const item of batch) {
      try {
        const tags = item.data.tagNames.length
          ? await resolveTagIds({ workspaceId, userId, tags: item.data.tagNames })
          : [];
        const shortCode = await generateUniqueCode(codeIsTaken);
        usedCodes.add(shortCode);

        docs.push({
          row: item.row,
          doc: {
            originalUrl: item.data.originalUrl,
            shortCode,
            customAlias: item.data.customAlias || undefined,
            title: item.data.title,
            owner: userId,
            workspace: workspaceId,
            expiresAt: item.data.expiresAt,
            clickLimit: item.data.clickLimit,
            campaign: item.data.campaign,
            tags,
          },
        });
      } catch (error) {
        if (error instanceof ApiError) {
          errors.push({ row: item.row, message: error.message });
        } else {
          errors.push({ row: item.row, message: 'This row could not be prepared for import' });
        }
      }
    }

    if (docs.length === 0) continue;

    try {
      await Link.insertMany(
        docs.map((entry) => entry.doc),
        { ordered: false }
      );
      imported += docs.length;
    } catch (error) {
      const writeErrors = error?.writeErrors || error?.result?.result?.writeErrors || [];
      const failedIndexes = new Map();
      for (const writeError of writeErrors) {
        const index = writeError.index ?? writeError.err?.index;
        const message =
          writeError.err?.errmsg || writeError.errmsg || writeError.message || 'Insert failed';
        if (index !== undefined) failedIndexes.set(index, message);
      }

      docs.forEach((entry, index) => {
        if (failedIndexes.has(index)) {
          errors.push({ row: entry.row, message: describeWriteError(failedIndexes.get(index)) });
        } else {
          imported += 1;
        }
      });
    }
  }

  errors.sort((a, b) => a.row - b.row);

  const job = await ImportJob.create({
    workspace: workspaceId,
    user: userId,
    fileName: fileName || '',
    fileSize: fileSize || 0,
    status: 'completed',
    totalRows: records.length,
    importedCount: imported,
    failedCount: errors.length,
    skippedCount: skippedRows.length,
    rowErrors: errors.slice(0, MAX_STORED_ERRORS),
  });

  return {
    importId: String(job._id),
    fileName: fileName || '',
    totalRows: records.length,
    imported,
    failed: errors.length,
    skipped: skippedRows.length,
    durationMs: Date.now() - startedAt,
    errors,
    errorCountTruncated: errors.length > MAX_STORED_ERRORS,
    columns: header,
  };
}
