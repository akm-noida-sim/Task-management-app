import { describe, expect, it, vi } from 'vitest';
import api, {
  isSessionError,
  SESSION_CLEARED_EVENT,
  TOKEN_STORAGE_KEY,
} from '../services/api';

const rejected = api.interceptors.response.handlers[0].rejected;

function apiError(code, url = '/auth/me') {
  return {
    config: { url },
    response: { status: 401, data: { error: { code, message: 'Denied.' } } },
  };
}

describe('API response interceptor', () => {
  it('keeps the token when credentials are wrong', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'keep-me');
    const error = apiError('INVALID_CREDENTIALS', '/auth/change-password');

    expect(isSessionError(error)).toBe(false);
    await expect(rejected(error)).rejects.toBe(error);
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('keep-me');
  });

  it('clears the token and notifies AuthContext when the session is invalid', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'stale-token');
    const listener = vi.fn();
    window.addEventListener(SESSION_CLEARED_EVENT, listener);
    const error = apiError('TOKEN_REVOKED');

    expect(isSessionError(error)).toBe(true);
    await expect(rejected(error)).rejects.toBe(error);
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener(SESSION_CLEARED_EVENT, listener);
  });
});
