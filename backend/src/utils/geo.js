const COUNTRY_HEADERS = [
  'cf-ipcountry',
  'x-vercel-ip-country',
  'x-country-code',
  'x-geo-country',
  'x-appengine-country',
];

const REGION_HEADERS = ['x-vercel-ip-country-region', 'cf-region', 'x-geo-region'];

const INVALID_COUNTRIES = new Set(['XX', 'T1']);

export function detectGeo(headers = {}) {
  let country = null;

  for (const header of COUNTRY_HEADERS) {
    const value = headers[header];
    if (typeof value !== 'string') continue;
    const code = value.trim().toUpperCase();
    if (/^[A-Z]{2}$/.test(code) && !INVALID_COUNTRIES.has(code)) {
      country = code;
      break;
    }
  }

  let region = null;

  for (const header of REGION_HEADERS) {
    const value = headers[header];
    if (typeof value === 'string' && value.trim() !== '') {
      region = value.trim().slice(0, 100);
      break;
    }
  }

  return { country, region };
}
