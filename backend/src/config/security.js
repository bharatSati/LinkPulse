import dotenv from 'dotenv';

dotenv.config();

function int(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function bool(value, fallback = false) {
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
}

/*
 * Configurable abuse-detection thresholds and retention limits.
 * Every rule is deterministic; Groq never drives enforcement decisions.
 */
const security = {
  eventRetentionDays: int(process.env.SECURITY_EVENT_RETENTION_DAYS, 90),
  notificationRetentionDays: int(process.env.NOTIFICATION_RETENTION_DAYS, 180),

  // Never disable a link automatically unless this is explicitly enabled AND a
  // high-confidence destination rule fires. Traffic volume or an unfamiliar
  // domain alone never disables a link.
  autoDisable: bool(process.env.ABUSE_AUTO_DISABLE, false),

  // Minimum time between repeat alerts for the same rule target (per link or
  // per source) so a single incident produces one actionable notification.
  cooldownMs: int(process.env.ABUSE_ALERT_COOLDOWN_MINUTES, 15) * 60 * 1000,

  // Repeated link creation in a workspace within a rolling window.
  linkCreation: {
    windowMs: int(process.env.ABUSE_LINK_CREATION_WINDOW_MINUTES, 10) * 60 * 1000,
    max: int(process.env.ABUSE_LINK_CREATION_MAX, 20),
  },

  // Requests from a single source (hashed visitor IP) to short links.
  sourceRequests: {
    windowMs: int(process.env.ABUSE_SOURCE_REQUEST_WINDOW_SECONDS, 60) * 1000,
    max: int(process.env.ABUSE_SOURCE_REQUEST_MAX, 150),
  },

  // Unusually high click spikes on a single link.
  clickSpike: {
    windowMs: int(process.env.ABUSE_CLICK_SPIKE_WINDOW_MINUTES, 10) * 60 * 1000,
    multiplier: int(process.env.ABUSE_CLICK_SPIKE_MULTIPLIER, 8),
    minClicks: int(process.env.ABUSE_CLICK_SPIKE_MIN_CLICKS, 30),
    // How often a single link is re-evaluated at most (per process).
    checkIntervalMs: int(process.env.ABUSE_CLICK_SPIKE_CHECK_MS, 60 * 1000),
  },

  // Repeated failed password attempts against protected links.
  passwordFailures: {
    windowMs: int(process.env.ABUSE_PASSWORD_FAIL_WINDOW_MINUTES, 15) * 60 * 1000,
    max: int(process.env.ABUSE_PASSWORD_FAIL_MAX, 10),
  },

  // Destination risk score at which a link is flagged for review.
  destinationRiskScore: int(process.env.ABUSE_DESTINATION_RISK_SCORE, 50),

  // Duplicate public reports for the same link from the same source.
  reportThrottleMs: int(process.env.ABUSE_REPORT_THROTTLE_MINUTES, 60) * 60 * 1000,
};

export default security;
