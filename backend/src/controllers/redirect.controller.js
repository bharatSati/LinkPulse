import env from '../config/env.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/ApiResponse.js';
import { detectDevice } from '../utils/device.js';
import { verifyLinkPassword } from '../utils/linkPassword.js';
import { renderErrorPage, renderPasswordPage } from '../utils/redirectPages.js';
import {
  LINK_STATE,
  UNLOCK_COOKIE,
  UNLOCK_TTL,
  createUnlockToken,
  evaluateLink,
  findLinkByCode,
  resolveDestination,
  verifyUnlockToken,
} from '../services/redirect.service.js';
import { recordSuccessfulClick } from '../services/tracking.service.js';
import {
  evaluateClickSpike,
  evaluatePasswordFailure,
  evaluateSourceBurst,
} from '../services/abuse.service.js';

function wantsJson(req) {
  const accept = req.headers.accept || '';
  if (req.query?.format === 'json') return true;
  return accept.includes('application/json') && !accept.includes('text/html');
}

function readCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;

  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    const key = part.slice(0, index).trim();
    if (key === name) {
      return decodeURIComponent(part.slice(index + 1).trim());
    }
  }
  return null;
}

function isUnlocked(req, link) {
  const cookieToken = readCookie(req, UNLOCK_COOKIE);
  if (verifyUnlockToken(cookieToken, link.id)) return true;

  const queryToken = typeof req.query?.token === 'string' ? req.query.token : null;
  return verifyUnlockToken(queryToken, link.id);
}

function sendState(res, req, state, code) {
  const wantsJsonResponse = wantsJson(req);

  switch (state) {
    case LINK_STATE.NOT_FOUND:
      if (wantsJsonResponse) {
        return res.status(404).json({ success: false, message: 'Short link not found', errors: [] });
      }
      return res.status(404).send(
        renderErrorPage({
          status: 404,
          title: 'Link not found',
          message: 'This short link does not exist or may have been removed.',
        })
      );

    case LINK_STATE.DISABLED:
      if (wantsJsonResponse) {
        return res.status(403).json({ success: false, message: 'This link is disabled', errors: [] });
      }
      return res.status(403).send(
        renderErrorPage({
          status: 403,
          title: 'Link disabled',
          message: 'This link has been disabled by its owner and is no longer available.',
        })
      );

    case LINK_STATE.EXPIRED:
      if (wantsJsonResponse) {
        return res.status(410).json({ success: false, message: 'This link has expired', errors: [] });
      }
      return res.status(410).send(
        renderErrorPage({
          status: 410,
          title: 'Link expired',
          message: 'This link is past its expiration date and can no longer be used.',
        })
      );

    case LINK_STATE.LIMIT_REACHED:
      if (wantsJsonResponse) {
        return res.status(429).json({ success: false, message: 'This link has reached its click limit', errors: [] });
      }
      return res.status(429).send(
        renderErrorPage({
          status: 429,
          title: 'Click limit reached',
          message: 'This link has reached its maximum number of clicks.',
        })
      );

    default:
      if (wantsJsonResponse) {
        return res.status(404).json({ success: false, message: 'Short link not found', errors: [] });
      }
      return res.status(404).send(
        renderErrorPage({
          status: 404,
          title: 'Link not found',
          message: `We could not resolve "${code}".`,
        })
      );
  }
}

export const handleRedirect = asyncHandler(async (req, res) => {
  const code = req.params.shortCode;
  const link = await findLinkByCode(code);
  const { state } = evaluateLink(link);

  if (state === LINK_STATE.NOT_FOUND) {
    return sendState(res, req, LINK_STATE.NOT_FOUND, code);
  }

  await evaluateSourceBurst({ link, req });

  if (state === LINK_STATE.PASSWORD_REQUIRED && !isUnlocked(req, link)) {
    if (wantsJson(req)) {
      return res.status(401).json({
        success: false,
        message: 'This link is password protected',
        errors: [],
        data: { requiresPassword: true },
      });
    }
    return res
      .status(200)
      .send(renderPasswordPage({ code, title: link.title, error: null }));
  }

  if (state !== LINK_STATE.OK && state !== LINK_STATE.PASSWORD_REQUIRED) {
    return sendState(res, req, state, code);
  }

  const updated = await recordSuccessfulClick({ link, req });

  if (!updated) {
    const refreshed = evaluateLink(await findLinkByCode(code));
    return sendState(res, req, refreshed.state, code);
  }

  await evaluateClickSpike({ link: updated });

  const device = detectDevice(req.headers['user-agent']);
  const destination = resolveDestination(updated, device);

  return res.redirect(302, destination);
});

export const handleUnlock = asyncHandler(async (req, res) => {
  const code = req.params.shortCode;
  const link = await findLinkByCode(code);
  const { state } = evaluateLink(link);

  if (state !== LINK_STATE.PASSWORD_REQUIRED) {
    if (state === LINK_STATE.NOT_FOUND) {
      return sendState(res, req, LINK_STATE.NOT_FOUND, code);
    }
    if (state === LINK_STATE.OK || isUnlocked(req, link)) {
      return res.redirect(303, `/${encodeURIComponent(code)}`);
    }
    return sendState(res, req, state, code);
  }

  if (isUnlocked(req, link)) {
    return res.redirect(303, `/${encodeURIComponent(code)}`);
  }

  const password = req.body?.password;
  const accepted =
    typeof password === 'string' && password.length > 0 && verifyLinkPassword(password, link.password);

  if (!accepted) {
    await evaluatePasswordFailure({ link });
    if (wantsJson(req)) {
      return res.status(401).json({ success: false, message: 'Incorrect password', errors: [] });
    }
    return res.status(401).send(
      renderPasswordPage({
        code,
        title: link.title,
        error: 'Incorrect password. Please try again.',
      })
    );
  }

  const token = createUnlockToken(link.id);

  if (wantsJson(req)) {
    return successResponse(res, {
      message: 'Password accepted',
      data: { token, expiresIn: UNLOCK_TTL },
    });
  }

  res.cookie(UNLOCK_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProduction,
    maxAge: UNLOCK_TTL * 1000,
    path: '/',
  });

  return res.redirect(303, `/${encodeURIComponent(code)}`);
});
