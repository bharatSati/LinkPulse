import crypto from 'crypto';

export const AI_INSIGHT_TYPES = [
  'performance',
  'trend',
  'distribution',
  'organization',
  'optimization',
  'anomaly',
  'insight',
];

export const AI_PRIORITIES = ['high', 'medium', 'low'];

export const PRIORITY_RANK = { high: 3, medium: 2, low: 1 };

export const MAX_AI_INSIGHTS = 8;
export const MAX_AI_RECOMMENDATIONS = 6;
export const MAX_AI_EVIDENCE = 6;
export const MAX_AI_ANSWER = 2000;
export const MAX_AI_QUESTION = 300;

export function sanitizeString(value, max = 800) {
  if (typeof value !== 'string') {
    if (value === null || value === undefined) return '';
    value = String(value);
  }
  const text = value.replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export function normalizePriority(value) {
  return AI_PRIORITIES.includes(value) ? value : 'medium';
}

export function normalizeInsightType(value) {
  return AI_INSIGHT_TYPES.includes(value) ? value : 'insight';
}

export function normalizeEvidence(value) {
  const source = Array.isArray(value) ? value : value ? [value] : [];
  return source
    .map((entry) => {
      if (entry && typeof entry === 'object') {
        const label = sanitizeString(entry.label, 120);
        const val = sanitizeString(entry.value, 240);
        return label ? `${label}: ${val}` : val;
      }
      return sanitizeString(entry, 260);
    })
    .filter(Boolean)
    .slice(0, MAX_AI_EVIDENCE);
}

function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

export function buildDataSignature(value) {
  return crypto.createHash('sha1').update(stableStringify(value)).digest('hex');
}

export function parseJsonLoose(content) {
  if (typeof content !== 'string') {
    throw new Error('Empty AI response');
  }

  let text = content.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();

  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw new Error('AI response was not valid JSON');
  }
}
