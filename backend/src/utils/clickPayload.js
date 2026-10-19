export function serializeClick(payload, link = null) {
  const timestamp = payload?.timestamp ? new Date(payload.timestamp) : new Date();

  return {
    id: String(payload?._id ?? payload?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    linkId: String(payload?.link?._id ?? payload?.link ?? link?._id ?? link?.id ?? ''),
    title: link?.title || '',
    code: link?.customAlias || link?.shortCode || null,
    country: payload?.country || null,
    region: payload?.region || null,
    deviceType: payload?.deviceType || 'unknown',
    browser: payload?.browser || null,
    operatingSystem: payload?.operatingSystem || null,
    referrerDomain: payload?.referrerDomain || null,
    timestamp: Number.isNaN(timestamp.getTime()) ? new Date().toISOString() : timestamp.toISOString(),
  };
}
