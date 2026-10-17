import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import * as importService from '../services/import.service.js';

const ALLOWED_MIME_TYPES = new Set([
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
  'text/plain',
]);

export const template = (req, res) => {
  const csv = importService.buildTemplateCsv();
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="linkpulse-import-template.csv"'
  );
  return res.status(200).send(csv);
};

export const importLinks = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) {
    throw ApiError.badRequest('Attach a CSV file in the "file" field');
  }

  const fileName = file.originalname || 'import.csv';
  const mimeAllowed = ALLOWED_MIME_TYPES.has(file.mimetype);
  const extensionAllowed = /\.csv$/i.test(fileName);
  if (!mimeAllowed && !extensionAllowed) {
    throw ApiError.badRequest('Only .csv files can be imported');
  }

  const result = await importService.importLinksCsv({
    workspaceId: req.workspace.id,
    userId: req.user.id,
    fileName,
    fileSize: file.size,
    buffer: file.buffer,
  });

  return successResponse(res, {
    statusCode: 201,
    message: `Import finished: ${result.imported} imported, ${result.failed} failed`,
    data: result,
  });
});

export const getImport = asyncHandler(async (req, res) => {
  return successResponse(res, {
    message: 'Import retrieved',
    data: { import: importService.serializeImportJob(req.importJob) },
  });
});
