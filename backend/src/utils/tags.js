export const MAX_TAG_LENGTH = 50;
export const MAX_TAGS_PER_RESOURCE = 20;

export function normalizeTagName(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tagKey(value) {
  return normalizeTagName(value).toLowerCase();
}
