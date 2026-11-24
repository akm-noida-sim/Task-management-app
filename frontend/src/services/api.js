import axios from 'axios';

export const TOKEN_STORAGE_KEY = 'taskflow.token';

/** Emitted when an API response proves the stored session can no longer be used. */
export const SESSION_CLEARED_EVENT = 'taskflow:session-cleared';

/** 401 codes that mean the session itself is unusable (not bad credentials). */
export const SESSION_FAILURE_CODES = new Set([
  'AUTH_REQUIRED',
  'INVALID_TOKEN',
  'TOKEN_EXPIRED',
  'TOKEN_REVOKED',
  'FRESH_TOKEN_REQUIRED',
  'ACCOUNT_NOT_FOUND',
  'INVALID_IDENTITY',
  'UNAUTHORIZED',
]);

export function isSessionError(error) {
  const code = error?.response?.data?.error?.code;
  return error?.response?.status === 401 && SESSION_FAILURE_CODES.has(code);
}

/** Shared Axios client: attaches the JWT and normalises API errors. */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isSessionError(error)) {
      // Only unusable sessions are cleared. INVALID_CREDENTIALS (for example a
      // wrong current password) must not silently log the user out.
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(SESSION_CLEARED_EVENT));
      }
    }
    return Promise.reject(error);
  },
);

export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

export function getErrorCode(error) {
  return error?.response?.data?.error?.code || 'UNKNOWN_ERROR';
}

export default api;
