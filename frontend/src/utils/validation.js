const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value) {
  if (!value) return 'Email is required';
  if (!EMAIL_PATTERN.test(value.trim())) return 'Enter a valid email address';
  return null;
}

export function validateRequired(value, label = 'This field') {
  if (value === undefined || value === null || String(value).trim() === '') {
    return `${label} is required`;
  }
  return null;
}

export function validateMinLength(value, min, label = 'This field') {
  if (!value || value.length < min) {
    return `${label} must be at least ${min} characters`;
  }
  return null;
}
