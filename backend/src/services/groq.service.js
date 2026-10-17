import Groq from 'groq-sdk';
import env, { isAiConfigured } from '../config/env.js';
import { parseJsonLoose } from '../utils/ai.js';

export class AiError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'AiError';
    this.code = code;
    this.isAiError = true;
  }
}

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

  if (status === 429 || type === 'rate_limit_exceeded') {
    return new AiError(
      'rate_limited',
      'The AI service is rate-limited right now. Please try again in a moment.'
    );
  }

  if (status === 401 || status === 403 || type === 'invalid_api_key') {
    return new AiError(
      'auth',
      'The AI service rejected LinkPulse credentials. Check the Groq configuration.'
    );
  }

  if (
    error?.name === 'APIConnectionTimeoutError' ||
    code === 'ETIMEDOUT' ||
    code === 'timedout' ||
    /timeout/i.test(error?.message || '')
  ) {
    return new AiError('timeout', 'The AI request timed out. Please try again.');
  }

  if (error?.name === 'APIConnectionError') {
    return new AiError('connection', 'Could not reach the AI service. Please try again.');
  }

  return new AiError('unavailable', 'The AI service is temporarily unavailable.');
}

/**
 * Send a chat completion to Groq and return the parsed JSON object.
 * Never surfaces raw provider errors to callers — always an AiError.
 */
export async function requestJson({ system, user, maxTokens = 1200, temperature = 0.2 }) {
  const groq = getClient();
  if (!groq) {
    throw new AiError('not_configured', 'AI features are not configured for this deployment.');
  }

  let completion;
  try {
    completion = await groq.chat.completions.create(
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
  } catch (error) {
    if (error?.isAiError) throw error;
    throw mapGroqError(error);
  }

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
    throw new AiError('invalid_response', 'The AI returned an unreadable response. Please try again.');
  }
}
