import { parseQrOptions, generateQrAssets } from '../utils/qr.js';
import { serializeLink } from './link.service.js';

const QR_KEYS = ['fgColor', 'bgColor', 'size', 'errorCorrectionLevel'];

function storedOptions(link) {
  return {
    fgColor: link.qr?.fgColor,
    bgColor: link.qr?.bgColor,
    size: link.qr?.size,
    errorCorrectionLevel: link.qr?.errorCorrectionLevel,
  };
}

function mergeOptions(base, input = {}) {
  const merged = { ...base };
  for (const key of QR_KEYS) {
    if (input?.[key] !== undefined && input[key] !== null && input[key] !== '') {
      merged[key] = input[key];
    }
  }
  return merged;
}

/**
 * Builds the QR payload for a link. The QR always encodes the link's public
 * short URL (custom alias when present, otherwise the generated short code).
 * When `persist` is true the effective customization is stored on the link as
 * settings only — no image data is ever written to MongoDB.
 */
export async function buildQrPayload(link, input = {}, { persist = false } = {}) {
  const options = parseQrOptions(mergeOptions(storedOptions(link), input));

  if (persist) {
    link.qr = options;
    await link.save();
  }

  const serialized = serializeLink(link);
  const assets = await generateQrAssets(serialized.shortUrl, options);

  return {
    link: serialized,
    qr: {
      shortUrl: serialized.shortUrl,
      ...options,
      png: assets.png,
      svg: assets.svg,
    },
  };
}
