import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';
import Tag from '../models/Tag.js';
import Link from '../models/Link.js';
import Campaign from '../models/Campaign.js';
import { isValidObjectId } from '../utils/validators.js';
import {
  MAX_TAG_LENGTH,
  MAX_TAGS_PER_RESOURCE,
  normalizeTagName,
  tagKey,
} from '../utils/tags.js';

function toObjectId(value) {
  return new mongoose.Types.ObjectId(value);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseTagName(value) {
  const name = normalizeTagName(value);
  if (!name) {
    throw ApiError.badRequest('Tag name is required');
  }
  if (name.length > MAX_TAG_LENGTH) {
    throw ApiError.badRequest(`Tag names must be at most ${MAX_TAG_LENGTH} characters`);
  }
  return name;
}

function tagUsage(Model, workspaceId) {
  return Model.aggregate([
    { $match: { workspace: toObjectId(workspaceId) } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
  ]).then((rows) => new Map(rows.map((row) => [String(row._id), row.count])));
}

export function serializeTag(tag) {
  const value = typeof tag.toObject === 'function' ? tag.toObject() : tag;
  return {
    id: String(value._id),
    name: value.name,
    key: value.key,
    workspace: String(value.workspace),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

export async function listTags({ workspaceId, search = '' }) {
  const query = { workspace: workspaceId };
  const term = typeof search === 'string' ? search.trim() : '';
  if (term) {
    query.name = new RegExp(escapeRegExp(term), 'i');
  }

  const [tags, linkCounts, campaignCounts] = await Promise.all([
    Tag.find(query).sort({ name: 1 }),
    tagUsage(Link, workspaceId),
    tagUsage(Campaign, workspaceId),
  ]);

  return {
    tags: tags.map((tag) => ({
      ...serializeTag(tag),
      linkCount: linkCounts.get(String(tag._id)) || 0,
      campaignCount: campaignCounts.get(String(tag._id)) || 0,
    })),
  };
}

export async function createTag({ workspaceId, userId, input }) {
  const name = parseTagName(input?.name);
  const key = tagKey(name);

  const existing = await Tag.findOne({ workspace: workspaceId, key });
  if (existing) {
    throw ApiError.conflict('A tag with this name already exists');
  }

  try {
    return await Tag.create({
      name,
      key,
      workspace: workspaceId,
      createdBy: userId || null,
    });
  } catch (error) {
    if (error.code === 11000) {
      throw ApiError.conflict('A tag with this name already exists');
    }
    throw error;
  }
}

export async function updateTag(tag, input) {
  if (input?.name !== undefined) {
    const name = parseTagName(input.name);
    const key = tagKey(name);

    if (key !== tag.key) {
      const conflict = await Tag.exists({
        _id: { $ne: tag._id },
        workspace: tag.workspace,
        key,
      });
      if (conflict) {
        throw ApiError.conflict('A tag with this name already exists');
      }
    }

    tag.name = name;
    tag.key = key;
  }

  try {
    await tag.save();
  } catch (error) {
    if (error.code === 11000) {
      throw ApiError.conflict('A tag with this name already exists');
    }
    throw error;
  }

  return tag;
}

export async function deleteTag(tag) {
  await Tag.deleteOne({ _id: tag._id });

  const [links, campaigns] = await Promise.all([
    Link.updateMany({ tags: tag._id }, { $pull: { tags: tag._id } }),
    Campaign.updateMany({ tags: tag._id }, { $pull: { tags: tag._id } }),
  ]);

  return {
    detachedLinks: links.modifiedCount,
    detachedCampaigns: campaigns.modifiedCount,
  };
}

/**
 * Resolves a list of tag references (existing ids or plain names) into a
 * de-duplicated array of Tag ObjectIds scoped to a workspace, creating any
 * missing name-based tags. Prevents cross-workspace references.
 */
export async function resolveTagIds({ workspaceId, userId = null, tags }) {
  if (tags === undefined) return undefined;
  if (tags === null) return [];
  if (!Array.isArray(tags)) {
    throw ApiError.badRequest('Tags must be an array');
  }

  const workspace = toObjectId(workspaceId);
  const ids = new Set();

  for (const raw of tags) {
    if (raw === null || raw === undefined || raw === '') continue;

    const entry = typeof raw === 'object' && raw.id ? raw.id : raw;
    const value = String(entry).trim();
    if (!value) continue;

    if (isValidObjectId(value)) {
      const existing = await Tag.findOne({ _id: value, workspace });
      if (!existing) {
        throw ApiError.badRequest('One or more tags do not belong to this workspace');
      }
      ids.add(String(existing._id));
      continue;
    }

    const name = parseTagName(value);
    const key = tagKey(name);

    let tag = await Tag.findOne({ workspace, key });
    if (!tag) {
      try {
        tag = await Tag.create({ name, key, workspace, createdBy: userId });
      } catch (error) {
        if (error.code === 11000) {
          tag = await Tag.findOne({ workspace, key });
        } else {
          throw error;
        }
      }
    }

    ids.add(String(tag._id));
  }

  if (ids.size > MAX_TAGS_PER_RESOURCE) {
    throw ApiError.badRequest(`A resource can have at most ${MAX_TAGS_PER_RESOURCE} tags`);
  }

  return [...ids];
}
