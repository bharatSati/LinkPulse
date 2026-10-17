import { cn } from '../../utils/cn.js';
import {
  DEFAULT_BIO_BACKGROUND,
  DEFAULT_BIO_TEXT,
  bioButtonStyle,
  bioThemeBackground,
  hexToRgba,
  isHttpUrl,
  platformMeta,
} from '../../utils/bio.js';

function initialsFor(page) {
  const source = (page.title || page.username || '?').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function BioPageView({ page, className, showHidden = false, footer = false }) {
  if (!page) return null;

  const backgroundColor = page.backgroundColor || DEFAULT_BIO_BACKGROUND;
  const textColor = page.textColor || DEFAULT_BIO_TEXT;

  const links = (page.links || []).filter((item) => {
    if (!item.url) return false;
    if (!showHidden && item.enabled === false) return false;
    return true;
  });

  const socials = (page.socialLinks || []).filter((item) => {
    const url = item.url || '';
    return url.startsWith('mailto:') || isHttpUrl(url);
  });

  const buttonStyle = bioButtonStyle(page.buttonStyle, textColor, backgroundColor);
  const mutedText = hexToRgba(textColor, 0.7);

  return (
    <div
      className={cn('flex w-full flex-col items-center px-6 py-10 text-center', className)}
      style={{ ...bioThemeBackground(page.theme, backgroundColor), color: textColor }}
    >
      <div
        className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full text-2xl font-semibold"
        style={{ backgroundColor: hexToRgba(textColor, 0.12), color: textColor }}
      >
        {isHttpUrl(page.avatarUrl) ? (
          <img
            src={page.avatarUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span>{initialsFor(page)}</span>
        )}
      </div>

      {page.title && (
        <h1 className="mt-4 font-sans text-xl font-semibold normal-case tracking-tight">{page.title}</h1>
      )}
      {page.description && (
        <p className="mt-2 max-w-xs text-sm" style={{ color: mutedText }}>
          {page.description}
        </p>
      )}

      {socials.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {socials.map((social, index) => {
            const Icon = platformMeta(social.platform).icon;
            return (
              <a
                key={social.id || `${social.platform}-${index}`}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                aria-label={platformMeta(social.platform).label}
                className="flex h-9 w-9 items-center justify-center rounded-full transition hover:scale-105"
                style={{ backgroundColor: hexToRgba(textColor, 0.12), color: textColor }}
              >
                <Icon className="h-4 w-4" />
              </a>
            );
          })}
        </div>
      )}

      <div className="mt-7 flex w-full max-w-sm flex-col gap-3">
        {links.length === 0 && (
          <p className="rounded-xl px-4 py-6 text-sm" style={{ color: mutedText, border: `1px dashed ${hexToRgba(textColor, 0.3)}` }}>
            No links yet
          </p>
        )}
        {links.map((item, index) => (
          <a
            key={item.id || index}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="flex min-h-[3rem] items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition hover:opacity-90"
            style={{ ...buttonStyle, opacity: item.enabled === false ? 0.45 : 1 }}
          >
            {item.title || item.url}
          </a>
        ))}
      </div>

      {footer && (
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-10 text-xs font-medium"
          style={{ color: mutedText }}
        >
          Made with LinkPulse
        </a>
      )}
    </div>
  );
}
