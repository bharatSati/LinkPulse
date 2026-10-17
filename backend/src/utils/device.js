const IPAD_PATTERN = /ipad/i;
const TABLET_PATTERN = /(tablet|playbook|silk|kindle|(android(?!.*mobile)))/i;
const MOBILE_PATTERN =
  /(mobi|iphone|ipod|android.*mobile|windows phone|blackberry|opera mini|iemobile|webos)/i;

export const DEVICE_CATEGORIES = ['mobile', 'tablet', 'desktop'];

export function detectDevice(userAgent = '') {
  if (typeof userAgent !== 'string' || userAgent.trim() === '') {
    return 'unknown';
  }

  if (IPAD_PATTERN.test(userAgent) || TABLET_PATTERN.test(userAgent)) {
    return 'tablet';
  }

  if (MOBILE_PATTERN.test(userAgent)) {
    return 'mobile';
  }

  return 'desktop';
}
