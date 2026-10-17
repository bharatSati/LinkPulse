import ApiError from '../utils/ApiError.js';
import { isEmail, isValidObjectId } from '../utils/validators.js';

function labelFor(field, rules) {
  return rules.label || field.charAt(0).toUpperCase() + field.slice(1);
}

export function validateBody(schema) {
  return (req, res, next) => {
    const errors = [];
    const validated = {};
    const body = req.body && typeof req.body === 'object' ? req.body : {};

    for (const [field, rules] of Object.entries(schema)) {
      const label = labelFor(field, rules);
      let value = body[field];

      if (typeof value === 'string') value = value.trim();

      const isEmpty = value === undefined || value === null || value === '';

      if (isEmpty) {
        if (rules.required) errors.push(`${label} is required`);
        continue;
      }

      if (rules.type === 'email' && !isEmail(value)) {
        errors.push(`${label} must be a valid email address`);
        continue;
      }

      if (rules.type === 'string' && typeof value !== 'string') {
        errors.push(`${label} must be a string`);
        continue;
      }

      if (rules.type === 'array' && !Array.isArray(value)) {
        errors.push(`${label} must be an array`);
        continue;
      }

      if (rules.objectId && !isValidObjectId(value)) {
        errors.push(`${label} must be a valid identifier`);
        continue;
      }

      if (rules.minLength && String(value).length < rules.minLength) {
        errors.push(`${label} must be at least ${rules.minLength} characters`);
        continue;
      }

      if (rules.maxLength && String(value).length > rules.maxLength) {
        errors.push(`${label} must be at most ${rules.maxLength} characters`);
        continue;
      }

      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`${label} must be one of: ${rules.enum.join(', ')}`);
        continue;
      }

      validated[field] = value;
    }

    if (errors.length > 0) {
      return next(ApiError.badRequest('Validation failed', errors));
    }

    req.validated = validated;
    return next();
  };
}
