/*
 * Tiny in-memory fixed-window tracker used for cheap, best-effort abuse signals
 * (per-source request bursts, repeated password failures, spike cooldowns).
 *
 * This is intentionally dependency-free and non-authoritative: it only produces
 * hints for the abuse-detection service and never blocks a redirect. Counters
 * are per-process, so multi-instance deployments should treat these as
 * approximate. No raw IP addresses are stored — callers pass hashed keys.
 */
const buckets = new Map();

let lastSweep = 0;

function sweep(now) {
  if (now - lastSweep < 60 * 1000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function hit(key, { windowMs, max }) {
  const now = Date.now();
  sweep(now);

  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;

  return {
    count: bucket.count,
    exceeded: bucket.count >= max,
    resetAt: new Date(bucket.resetAt),
  };
}

export function isCoolingDown(key, cooldownMs) {
  const now = Date.now();
  const until = buckets.get(`cooldown:${key}`);
  return Boolean(until && until.resetAt > now);
}

export function startCooldown(key, cooldownMs) {
  buckets.set(`cooldown:${key}`, { count: 0, resetAt: Date.now() + cooldownMs });
}

export function resetWindowTracker() {
  buckets.clear();
  lastSweep = 0;
}
