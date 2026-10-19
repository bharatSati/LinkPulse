import rateLimit from 'express-rate-limit';

const buildHandler =
  (message = 'Too many requests. Please slow down and try again shortly.') =>
  (req, res) => {
    const resetTime = req.rateLimit?.resetTime;
    const retryAfter = resetTime
      ? Math.max(1, Math.ceil((new Date(resetTime).getTime() - Date.now()) / 1000))
      : null;

    if (retryAfter) {
      res.set('Retry-After', String(retryAfter));
    }

    res.status(429).json({
      success: false,
      message,
      code: 'RATE_LIMITED',
      retryAfter,
      errors: [],
    });
  };

const standardOptions = {
  standardHeaders: true,
  legacyHeaders: false,
  handler: buildHandler(),
};

export const apiLimiter = rateLimit({
  ...standardOptions,
  windowMs: 15 * 60 * 1000,
  max: 600,
  // Uptime/health probes are hit on a fixed schedule and must never be
  // throttled (a 429 there would mark the service down).
  skip: (req) => req.originalUrl.split('?')[0].startsWith('/api/v1/health'),
});

export const authLimiter = rateLimit({
  ...standardOptions,
  windowMs: 15 * 60 * 1000,
  max: 30,
});

export const passwordAttemptLimiter = rateLimit({
  ...standardOptions,
  windowMs: 10 * 60 * 1000,
  max: 20,
});

export const importLimiter = rateLimit({
  ...standardOptions,
  windowMs: 60 * 60 * 1000,
  max: 30,
});

export const aiLimiter = rateLimit({
  ...standardOptions,
  windowMs: 15 * 60 * 1000,
  max: 20,
});

export const aiAskLimiter = rateLimit({
  ...standardOptions,
  windowMs: 15 * 60 * 1000,
  max: 15,
});

// Public short-link redirects: generous enough for legitimate short bursts
// (and for the abuse detector to observe a source burst) while still capping
// per-IP floods.
export const redirectLimiter = rateLimit({
  ...standardOptions,
  windowMs: 60 * 1000,
  max: 300,
});

export const abuseReportLimiter = rateLimit({
  ...standardOptions,
  windowMs: 60 * 60 * 1000,
  max: 10,
});

export const linkCreateLimiter = rateLimit({
  ...standardOptions,
  windowMs: 15 * 60 * 1000,
  max: 50,
});

// Public, unauthenticated read endpoints (e.g. bio-page lookups). Tighter than
// the global API cap so username enumeration / scraping gets expensive fast.
export const publicLimiter = rateLimit({
  ...standardOptions,
  windowMs: 60 * 1000,
  max: 120,
});

// SSE connections are opened rarely but held open. Cap how often a client can
// (re)open one so streams cannot be used to exhaust sockets or file descriptors.
export const streamLimiter = rateLimit({
  ...standardOptions,
  windowMs: 15 * 60 * 1000,
  max: 60,
});
