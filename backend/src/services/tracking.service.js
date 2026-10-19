import Link from '../models/Link.js';
import ClickEvent from '../models/ClickEvent.js';
import { detectDevice } from '../utils/device.js';
import { serializeClick } from '../utils/clickPayload.js';
import { publishClick } from './realtime.service.js';
import logger from '../utils/logger.js';
import { parseUserAgent } from '../utils/userAgent.js';
import { parseReferrer } from '../utils/referrer.js';
import { detectGeo } from '../utils/geo.js';
import { getClientIp, hashIp } from '../utils/ip.js';

/*
 * Atomically claims a click for a link. The status/expiry/click-limit conditions
 * live in the same update filter so concurrent requests can never exceed the
 * configured limit. Returns the updated link, or null when the click must not
 * be counted (disabled, expired, or limit reached).
 */
async function claimClick(linkId) {
  const now = new Date();

  return Link.findOneAndUpdate(
    {
      _id: linkId,
      status: 'active',
      $and: [
        { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
        {
          $or: [
            { clickLimit: null },
            { $expr: { $lt: ['$clickCount', '$clickLimit'] } },
          ],
        },
      ],
    },
    { $inc: { clickCount: 1 } },
    { new: true }
  );
}

function buildClickEvent(link, req) {
  const userAgent = req.headers['user-agent'] || '';
  const { browser, operatingSystem } = parseUserAgent(userAgent);
  const { referrer, referrerDomain } = parseReferrer(
    req.headers.referer || req.headers.referrer,
    req.hostname
  );
  const { country, region } = detectGeo(req.headers);

  return {
    link: link._id,
    workspace: link.workspace,
    timestamp: new Date(),
    referrer,
    referrerDomain,
    country,
    region,
    deviceType: detectDevice(userAgent),
    browser,
    operatingSystem,
    userAgent: userAgent ? userAgent.slice(0, 512) : null,
    ipHash: hashIp(getClientIp(req)),
  };
}

export async function recordSuccessfulClick({ link, req }) {
  const updated = await claimClick(link.id);
  if (!updated) return null;

  try {
    const event = await ClickEvent.create(buildClickEvent(updated, req));
    publishClick(updated.workspace, serializeClick(event, updated));
  } catch (error) {
    logger.debug('[tracking] Failed to persist click event:', error.message);
  }

  return updated;
}
