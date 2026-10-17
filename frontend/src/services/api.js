import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const publicBaseUrl = import.meta.env.VITE_PUBLIC_BASE_URL || '';

export function getPublicBaseUrl() {
  if (publicBaseUrl) return publicBaseUrl.replace(/\/+$/, '');
  try {
    return new URL(baseURL).origin;
  } catch {
    return '';
  }
}

const TOKEN_KEY = 'linkpulse.auth.token';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

let unauthorizedHandler = null;

export function registerUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const payload = error.response?.data;

    if (status === 401) {
      setStoredToken(null);
      if (unauthorizedHandler) unauthorizedHandler();
    }

    let message = payload?.message || error.message || 'Something went wrong';

    if (!error.response) {
      message =
        'Unable to reach the LinkPulse API. Check that the backend is running and VITE_API_BASE_URL is correct.';
    }

    return Promise.reject({
      status: status ?? 0,
      message,
      errors: payload?.errors || [],
    });
  }
);

export default api;
