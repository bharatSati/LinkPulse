import Groq from 'groq-sdk';
import env, { isAiConfigured } from '../config/env.js';
import { parseJsonLoose } from '../utils/ai.js';
import logger from '../utils/logger.js';

export class AiError extends Error {
  constructor(code, message, userMessage) {
    super(message);
    this.name = 'AiError';
    this.code = code;
    this.isAiError = true;
    this.userMessage = userMessage || message;
  }
}

// Shown to end users. Deliberately generic so we never leak provider details
// such as rate limits, billing tiers, or credential problems.
const GENERIC_USER_MESSAGE =
  'Something went wrong while generating AI content. Please try again.';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let client = null;

function getClient() {
  if (!isAiConfigured()) return null;
  if (!client) {
    client = new Groq({
      apiKey: env.groqApiKey,
      timeout: env.groqTimeoutMs,
      maxRetries: 0,
    });
  }
  return client;
}

export function aiConfigured() {
  return isAiConfigured();
}

function mapGroqError(error) {
  const status = error?.status || error?.response?.status;
  const code = error?.code || error?.error?.code;
  const type = error?.error?.type;
  const message = error?.message || '';

  if (
    status === 429 ||
    status === 413 ||
    type === 'rate_limit_exceeded' ||
    code === 'rate_limit_exceeded' ||
    /rate[_ ]?limit|too large|tokens per minute/i.test(message)
  ) {
    return new AiError(
      'rate_limited',
      'The AI provider rejected the request due to a rate or token limit.',
      GENERIC_USER_MESSAGE
    );
  }

  if (status === 401 || status === 403 || type === 'invalid_api_key') {
    return new AiError(
      'auth',
      'The AI service rejected LinkPulse credentials. Check the Groq configuration.',
      GENERIC_USER_MESSAGE
    );
  }

  if (
    error?.name === 'APIConnectionTimeoutError' ||
    code === 'ETIMEDOUT' ||
    code === 'timedout' ||
    /timed?\s?out/i.test(error?.message || '')
  ) {
    return new AiError(
      'timeout',
      'The AI request timed out.',
      'The AI request took too long. Please try again.'
    );
  }

  if (error?.name === 'APIConnectionError' || /fetch failed|socket hang up|ECONNRESET|ENOTFOUND|EAI_AGAIN/i.test(error?.message || '')) {
    return new AiError(
      'connection',
      'Could not reach the AI service.',
      'Could not reach the AI service. Please try again.'
    );
  }

  return new AiError(
    'unavailable',
    `The AI service returned an error (status ${status ?? 'unknown'}).`,
    GENERIC_USER_MESSAGE
  );
}

// Only transient failures are worth retrying. Hard failures (bad key, invalid
// request, oversized payload) will not succeed on a plain retry.
const RETRYABLE_STATUS = new Set([408, 409, 413, 425, 429, 500, 502, 503, 504, 529]);

function isRetryable(error) {
  if (!error) return false;

  if (error.isAiError) {
    // An unreadable response is often a one-off; another sample may parse.
    return error.code === 'invalid_response';
  }

  const status = error?.status || error?.response?.status;
  if (typeof status === 'number' && (RETRYABLE_STATUS.has(status) || status >= 500)) {
    return true;
  }

  const code = error?.code || error?.error?.code;
  if (code === 'rate_limit_exceeded') return true;
  if (code === 'ETIMEDOUT' || code === 'ECONNRESET' || code === 'EAI_AGAIN' || code === 'ENOTFOUND') {
    return true;
  }

  const message = error?.message || '';
  if (error?.name === 'APIConnectionTimeoutError' || error?.name === 'APIConnectionError') {
    return true;
  }
  if (/timed?\s?out|fetch failed|socket hang up|ECONNRESET|rate[_ ]?limit|too large|tokens per minute/i.test(message)) {
    return true;
  }

  return false;
}

function backoffMs(attempt) {
  const ceiling = Math.min(env.groqRetryBaseMs * 2 ** attempt, env.groqRetryMaxMs);
  return Math.round(ceiling / 2 + Math.random() * (ceiling / 2));
}

function parseCompletion(completion) {
  const content = completion?.choices?.[0]?.message?.content;
  const usage = completion?.usage
    ? {
        promptTokens: completion.usage.prompt_tokens || 0,
        completionTokens: completion.usage.completion_tokens || 0,
        totalTokens: completion.usage.total_tokens || 0,
      }
    : null;

  try {
    return { data: parseJsonLoose(content), usage };
  } catch {
    throw new AiError(
      'invalid_response',
      'The AI returned an unreadable response.',
      GENERIC_USER_MESSAGE
    );
  }
}

/**
 * Send a chat completion to Groq and return the parsed JSON object.
 *
 * Retries the same model a bounded number of times (GROQ_MAX_ATTEMPTS) with
 * exponential backoff, but only for transient failures. Never surfaces raw
 * provider errors to callers — always an AiError with a generic user message.
 */
export async function requestJson({ system, user, maxTokens = 1200, temperature = 0.2 }) {
  const groq = getClient();
  if (!groq) {
    throw new AiError(
      'not_configured',
      'AI features are not configured for this deployment.',
      'AI features are not available right now.'
    );
  }

  const attempts = env.groqMaxAttempts;
  let lastError = null;

  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) {
      await sleep(backoffMs(attempt - 1));
    }

    try {
      const completion = await groq.chat.completions.create(
        {
          model: env.groqModel,
          temperature,
          max_tokens: maxTokens,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        },
        { timeout: env.groqTimeoutMs }
      );
      return parseCompletion(completion);
    } catch (error) {
      const mapped = error?.isAiError ? error : mapGroqError(error);
      lastError = mapped;

      const canRetry = isRetryable(error) && attempt < attempts - 1;
      if (canRetry) {
        logger.debug(
          `[ai] attempt ${attempt + 1}/${attempts} failed (${mapped.code}); retrying the same model`
        );
        continue;
      }
      throw mapped;
    }
  }

  throw lastError;
}
