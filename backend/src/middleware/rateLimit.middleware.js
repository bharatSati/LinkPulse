import rateLimit from 'express-rate-limit';

const standardOptions = {
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please slow down and try again shortly.',
      errors: [],
    });
  },
};

export const apiLimiter = rateLimit({
  ...standardOptions,
  windowMs: 15 * 60 * 1000,
  max: 600,
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
