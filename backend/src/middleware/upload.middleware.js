import multer from 'multer';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';

const storage = multer.memoryStorage();

const uploader = multer({
  storage,
  limits: {
    fileSize: env.importMaxFileMb * 1024 * 1024,
    files: 1,
  },
});

const singleFile = uploader.single('file');

export function uploadCsv(req, res, next) {
  singleFile(req, res, (error) => {
    if (!error) return next();

    if (error.code === 'LIMIT_FILE_SIZE') {
      return next(
        ApiError.badRequest(`CSV files must be ${env.importMaxFileMb}MB or smaller`)
      );
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(ApiError.badRequest('Upload a single CSV file in the "file" field'));
    }
    return next(ApiError.badRequest('The file upload could not be processed'));
  });
}

export default uploader;
