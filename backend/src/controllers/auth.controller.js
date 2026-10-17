import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/ApiResponse.js';
import * as authService from '../services/auth.service.js';

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.validated;

  const user = await authService.registerUser({ name, email, password });
  const token = authService.signAuthToken(user);

  return successResponse(res, {
    statusCode: 201,
    message: 'Account created successfully',
    data: { user, token },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated;

  const user = await authService.authenticateUser({ email, password });
  const token = authService.signAuthToken(user);

  return successResponse(res, {
    message: 'Logged in successfully',
    data: { user, token },
  });
});

export const logout = asyncHandler(async (req, res) => {
  return successResponse(res, {
    message: 'Logged out successfully',
    data: null,
  });
});

export const me = asyncHandler(async (req, res) => {
  return successResponse(res, {
    message: 'Current user retrieved',
    data: { user: req.user },
  });
});
