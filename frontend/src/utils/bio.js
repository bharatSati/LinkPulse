import {
  Facebook,
  Github,
  Globe,
  Instagram,
  Link2,
  Linkedin,
  Mail,
  Music2,
  Twitter,
  Youtube,
} from 'lucide-react';

export const BIO_THEMES = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'gradient', label: 'Gradient' },
];

export const BIO_BUTTON_STYLES = [
  { value: 'solid', label: 'Solid' },
  { value: 'outline', label: 'Outline' },
  { value: 'soft', label: 'Soft' },
  { value: 'shadow', label: 'Raised' },
];

export const BIO_PLATFORMS = [
  { value: 'website', label: 'Website', icon: Globe },
  { value: 'twitter', label: 'X / Twitter', icon: Twitter },
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'facebook', label: 'Facebook', icon: Facebook },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { value: 'youtube', label: 'YouTube', icon: Youtube },
  { value: 'tiktok', label: 'TikTok', icon: Music2 },
  { value: 'github', label: 'GitHub', icon: Github },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'other', label: 'Other', icon: Link2 },
];

const PLATFORM_MAP = new Map(BIO_PLATFORMS.map((item) => [item.value, item]));

export function platformMeta(value) {
  return PLATFORM_MAP.get(value) || { value, label: value, icon: Link2 };
}

export const DEFAULT_BIO_BACKGROUND = '#0b0d10';
export const DEFAULT_BIO_TEXT = '#f3f5f7';

export function bioItemKey() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

const HEX_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])$/;

export function isHexColor(value) {
  return typeof value === 'string' && HEX_PATTERN.test(value.trim());
}

export function isValidUsername(value) {
  return typeof value === 'string' && USERNAME_PATTERN.test(value.trim().toLowerCase());
}

export function isHttpUrl(value) {
  if (typeof value !== 'string' || value.trim() === '') return false;
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function publicBioUrl(username) {
  if (!username) return '';
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : '';
  return `${origin}/bio/${username}`;
}

function expandHex(hex) {
  const value = hex.trim().replace('#', '');
  if (value.length === 3) {
    return `#${value[0]}${value[0]}${value[1]}${value[1]}${value[2]}${value[2]}`;
  }
  return `#${value}`;
}

export function hexToRgba(hex, alpha = 1) {
  if (!isHexColor(hex)) return `rgba(0, 0, 0, ${alpha})`;
  const expanded = expandHex(hex);
  const r = Number.parseInt(expanded.slice(1, 3), 16);
  const g = Number.parseInt(expanded.slice(3, 5), 16);
  const b = Number.parseInt(expanded.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function shiftHex(hex, amount) {
  if (!isHexColor(hex)) return hex;
  const expanded = expandHex(hex);
  const clamp = (value) => Math.max(0, Math.min(255, value));
  const r = clamp(Number.parseInt(expanded.slice(1, 3), 16) + amount);
  const g = clamp(Number.parseInt(expanded.slice(3, 5), 16) + amount);
  const b = clamp(Number.parseInt(expanded.slice(5, 7), 16) + amount);
  return `#${[r, g, b].map((part) => part.toString(16).padStart(2, '0')).join('')}`;
}

export function bioThemeBackground(theme, backgroundColor) {
  if (theme === 'gradient') {
    return {
      backgroundColor,
      backgroundImage: `linear-gradient(165deg, ${shiftHex(backgroundColor, 22)} 0%, ${backgroundColor} 45%, ${shiftHex(backgroundColor, -28)} 100%)`,
    };
  }
  return { backgroundColor };
}

export function bioButtonStyle(style, textColor, backgroundColor) {
  switch (style) {
    case 'outline':
      return { border: `1px solid ${hexToRgba(textColor, 0.5)}`, color: textColor, backgroundColor: 'transparent' };
    case 'soft':
      return { backgroundColor: hexToRgba(textColor, 0.14), color: textColor };
    case 'shadow':
      return {
        backgroundColor: textColor,
        color: backgroundColor,
        boxShadow: `0 10px 30px -12px ${hexToRgba(textColor, 0.7)}`,
      };
    case 'solid':
    default:
      return { backgroundColor: textColor, color: backgroundColor };
  }
}
