import QRCode from 'qrcode';
import ApiError from './ApiError.js';

export const QR_MIN_SIZE = 64;
export const QR_MAX_SIZE = 1024;
export const QR_DEFAULT_SIZE = 320;
export const QR_ERROR_LEVELS = ['L', 'M', 'Q', 'H'];
export const QR_DEFAULT_ERROR_LEVEL = 'M';
export const QR_DEFAULT_FG = '#000000';
export const QR_DEFAULT_BG = '#ffffff';

const HEX_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function normalizeHex(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!HEX_PATTERN.test(trimmed)) return null;
  const hex = trimmed.slice(1).toLowerCase();
  if (hex.length === 3) {
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
  }
  return `#${hex}`;
}

/**
 * Validates and normalizes QR customization input. Throws ApiError.badRequest
 * with a per-field error list when any value is out of range or malformed.
 */
export function parseQrOptions(input = {}) {
  const errors = [];

  let size = QR_DEFAULT_SIZE;
  if (input.size !== undefined && input.size !== null && input.size !== '') {
    const parsed = Number(input.size);
    if (!Number.isInteger(parsed) || parsed < QR_MIN_SIZE || parsed > QR_MAX_SIZE) {
      errors.push(`Size must be a whole number between ${QR_MIN_SIZE} and ${QR_MAX_SIZE}`);
    } else {
      size = parsed;
    }
  }

  let errorCorrectionLevel = QR_DEFAULT_ERROR_LEVEL;
  if (
    input.errorCorrectionLevel !== undefined &&
    input.errorCorrectionLevel !== null &&
    input.errorCorrectionLevel !== ''
  ) {
    const level = String(input.errorCorrectionLevel).trim().toUpperCase();
    if (!QR_ERROR_LEVELS.includes(level)) {
      errors.push(`Error correction level must be one of ${QR_ERROR_LEVELS.join(', ')}`);
    } else {
      errorCorrectionLevel = level;
    }
  }

  const fgColor = normalizeHex(input.fgColor, QR_DEFAULT_FG);
  if (fgColor === null) {
    errors.push('Foreground color must be a hex value such as #0f172a');
  }

  const bgColor = normalizeHex(input.bgColor, QR_DEFAULT_BG);
  if (bgColor === null) {
    errors.push('Background color must be a hex value such as #ffffff');
  }

  if (fgColor && bgColor && fgColor === bgColor) {
    errors.push('Foreground and background colors must differ so the QR code stays scannable');
  }

  if (errors.length > 0) {
    throw ApiError.badRequest('Invalid QR code options', errors);
  }

  return { size, fgColor, bgColor, errorCorrectionLevel };
}

/**
 * Generates PNG (data URL) and SVG representations of a QR code pointing at
 * the given short URL. Nothing is written to disk — assets are returned inline.
 */
export async function generateQrAssets(text, options) {
  const { size, fgColor, bgColor, errorCorrectionLevel } = options;

  const [png, svg] = await Promise.all([
    QRCode.toDataURL(text, {
      type: 'image/png',
      width: size,
      margin: 2,
      errorCorrectionLevel,
      color: { dark: fgColor, light: bgColor },
    }),
    QRCode.toString(text, {
      type: 'svg',
      width: size,
      margin: 2,
      errorCorrectionLevel,
      color: { dark: fgColor, light: bgColor },
    }),
  ]);

  return { png, svg };
}
