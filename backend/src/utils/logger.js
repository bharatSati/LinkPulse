import env from '../config/env.js';

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

const threshold = LEVELS[env.logLevel] ?? LEVELS.info;

function write(level, args) {
  if (LEVELS[level] > threshold) return;

  const sink = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  sink(...args);
}

/*
 * Minimal leveled logger. Only messages at or above LOG_LEVEL (default: info)
 * are printed, so noisy per-request and best-effort background failures stay
 * hidden unless explicitly enabled with LOG_LEVEL=debug. Genuine failures
 * (startup, database, request errors, thrown errors) are logged at error level
 * and always surface.
 */
const logger = {
  error: (...args) => write('error', args),
  warn: (...args) => write('warn', args),
  info: (...args) => write('info', args),
  debug: (...args) => write('debug', args),
};

export default logger;
