import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import User from '../models/User.js';
import { normalizeEmail } from '../utils/validators.js';

/*
 * DEVELOPMENT ONLY
 * Passwords are intentionally stored and compared as plain text in this
 * foundation release. All password handling is isolated in this module so the
 * strategy can be swapped for a real hashing algorithm (e.g. bcrypt/argon2)
 * without touching controllers or routes. Do not deploy this to production.
 */
export function preparePassword(plainPassword) {
  return plainPassword;
}

export function comparePassword(plainPassword, storedPassword) {
  return plainPassword === storedPassword;
}

export function signAuthToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

export async function registerUser({ name, email, password }) {
  const normalizedEmail = normalizeEmail(email);

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    password: preparePassword(password),
  });

  return user;
}

export async function authenticateUser({ email, password }) {
  const normalizedEmail = normalizeEmail(email);

  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user || !comparePassword(password, user.password)) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (user.status !== 'active') {
    throw ApiError.forbidden('This account is not active');
  }

  user.password = undefined;
  return user;
}

export async function getUserById(id) {
  const user = await User.findById(id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return user;
}
