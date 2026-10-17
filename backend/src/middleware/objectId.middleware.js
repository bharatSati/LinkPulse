import ApiError from '../utils/ApiError.js';
import { isValidObjectId } from '../utils/validators.js';

export const validObjectId = (paramName) => (req, res, next) => {
  const value = req.params[paramName];

  if (!isValidObjectId(value)) {
    return next(ApiError.badRequest(`Invalid "${paramName}" parameter`));
  }

  return next();
};
