export function parseReferrer(referrer, selfHost) {
  if (typeof referrer !== 'string' || referrer.trim() === '') {
    return { referrer: null, referrerDomain: null };
  }

  const raw = referrer.trim().slice(0, 2048);

  try {
    const url = new URL(raw);
    const domain = url.hostname.toLowerCase().replace(/^www\./, '');

    if (selfHost && domain === selfHost.toLowerCase().replace(/^www\./, '')) {
      return { referrer: null, referrerDomain: null };
    }

    return { referrer: raw, referrerDomain: domain || null };
  } catch {
    return { referrer: raw, referrerDomain: null };
  }
}
