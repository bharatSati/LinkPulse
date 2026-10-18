import dotenv from 'dotenv';

dotenv.config();

const required = ['MONGODB_URI', 'JWT_SECRET'];

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: (process.env.NODE_ENV || 'development') === 'production',
  // Console verbosity: error | warn | info | debug. Default keeps startup and
  // real errors only; set LOG_LEVEL=debug to see per-request and background noise.
  logLevel: (process.env.LOG_LEVEL || 'info').toLowerCase(),
  port: Number.parseInt(process.env.PORT, 10) || 5000,
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:5000',
  ipHashSalt: process.env.IP_HASH_SALT || process.env.JWT_SECRET,
  groqApiKey: process.env.GROQ_API_KEY || '',
  groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  groqTimeoutMs: Number.parseInt(process.env.GROQ_TIMEOUT_MS, 10) || 20000,
  // Bounded retries against the same model. Total attempts (first try included)
  // is capped so we never hammer the provider with unlimited requests.
  groqMaxAttempts: Math.min(Math.max(Number.parseInt(process.env.GROQ_MAX_ATTEMPTS, 10) || 3, 1), 5),
  groqRetryBaseMs: Number.parseInt(process.env.GROQ_RETRY_BASE_MS, 10) || 600,
  groqRetryMaxMs: Number.parseInt(process.env.GROQ_RETRY_MAX_MS, 10) || 4000,
  aiInsightsTtlMs: Number.parseInt(process.env.AI_INSIGHTS_TTL_MINUTES, 10)
    ? Number.parseInt(process.env.AI_INSIGHTS_TTL_MINUTES, 10) * 60 * 1000
    : 30 * 60 * 1000,
  aiHistoryDays: Number.parseInt(process.env.AI_HISTORY_DAYS, 10) || 60,
  aiQuestionMaxLength: Number.parseInt(process.env.AI_QUESTION_MAX_LENGTH, 10) || 300,
  importMaxFileMb: Number.parseInt(process.env.IMPORT_MAX_FILE_MB, 10) || 2,
  importMaxRows: Number.parseInt(process.env.IMPORT_MAX_ROWS, 10) || 1000,
  invitationTtlDays: Number.parseInt(process.env.INVITATION_TTL_DAYS, 10) || 7,
  // Transactional email via SMTP (Nodemailer). Delivery is only considered
  // configured when an SMTP host and a sender address are both present, so the
  // flag can never claim emails are sending when they are not.
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number.parseInt(process.env.SMTP_PORT, 10) || 587,
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  mailFrom: process.env.MAIL_FROM || '',
  mailReplyTo: process.env.MAIL_REPLY_TO || '',
  emailDeliveryConfigured: Boolean(process.env.SMTP_HOST && process.env.MAIL_FROM),
};

export function isAiConfigured() {
  return Boolean(env.groqApiKey && env.groqModel);
}

export function getMissingEnv() {
  return required.filter((key) => !process.env[key]);
}

export default env;
