export const QR_MIN_SIZE = 64;
export const QR_MAX_SIZE = 1024;
export const QR_DEFAULT_SIZE = 320;
export const QR_ERROR_LEVELS = [
  { value: 'L', label: 'L — Low (7%)' },
  { value: 'M', label: 'M — Medium (15%)' },
  { value: 'Q', label: 'Q — Quartile (25%)' },
  { value: 'H', label: 'H — High (30%)' },
];
export const QR_DEFAULT_ERROR_LEVEL = 'M';
export const QR_DEFAULT_FG = '#000000';
export const QR_DEFAULT_BG = '#ffffff';

const HEX_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function isHexColor(value) {
  return typeof value === 'string' && HEX_PATTERN.test(value.trim());
}

export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function downloadDataUrl(dataUrl, filename) {
  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

export function downloadText(text, filename, mime = 'text/plain') {
  triggerDownload(new Blob([text], { type: `${mime};charset=utf-8` }), filename);
}

export function qrFileName(link, extension) {
  const code = link?.customAlias || link?.shortCode || 'link';
  const safe = String(code).replace(/[^a-z0-9-_]/gi, '-');
  return `linkpulse-qr-${safe}.${extension}`;
}
