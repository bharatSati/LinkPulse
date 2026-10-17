import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/ApiResponse.js';
import * as qrService from '../services/qr.service.js';

export const getQr = asyncHandler(async (req, res) => {
  const payload = await qrService.buildQrPayload(req.link, req.query, { persist: false });

  return successResponse(res, {
    message: 'QR code generated',
    data: payload,
  });
});

export const generateQr = asyncHandler(async (req, res) => {
  const payload = await qrService.buildQrPayload(req.link, req.body, { persist: true });

  return successResponse(res, {
    message: 'QR code generated',
    data: payload,
  });
});
