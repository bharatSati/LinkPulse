import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';

function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  return null;
}

export const authenticate = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    throw ApiError.unauthorized('Authentication token is missing');
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
  } catch {
    throw ApiError.unauthorized('Invalid or expired authentication token');
  }

  const user = await User.findById(payload.sub);

  if (!user) {
    throw ApiError.unauthorized('The account associated with this token no longer exists');
  }

  if (user.status !== 'active') {
    throw ApiError.forbidden('This account is not active');
  }

  req.user = user;
  next();
});

/*
 * Attaches req.user when a valid bearer token is present but never rejects the
 * request. Used for public endpoints that enrich data for signed-in users
 * (e.g. abuse reports filed by a logged-in visitor).
 */
export const optionalAuthenticate = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next();

  try {
    const payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
    const user = await User.findById(payload.sub);
    if (user && user.status === 'active') {
      req.user = user;
    }
  } catch {
    // ignore invalid tokens on optional routes
  }

  return next();
});
