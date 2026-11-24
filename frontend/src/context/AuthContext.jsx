import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { authService } from '../services/authService';
import {
  getErrorMessage,
  isSessionError,
  SESSION_CLEARED_EVENT,
  TOKEN_STORAGE_KEY,
} from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [sessionError, setSessionError] = useState('');
  const validationRun = useRef(0);

  const clearSession = useCallback(() => {
    validationRun.current += 1;
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
    setSessionError('');
    setLoading(false);
  }, []);

  // The Axios interceptor clears stale tokens during ordinary API calls. Keep
  // React state in sync so protected routes react immediately.
  useEffect(() => {
    window.addEventListener(SESSION_CLEARED_EVENT, clearSession);
    return () => window.removeEventListener(SESSION_CLEARED_EVENT, clearSession);
  }, [clearSession]);

  // Re-validate the stored token with the API after a page refresh.
  const revalidate = useCallback(() => {
    let active = true;
    const run = ++validationRun.current;
    setLoading(true);
    setSessionError('');

    if (!token) {
      setUser(null);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    authService
      .me()
      .then((currentUser) => {
        if (active && run === validationRun.current) {
          setUser(currentUser);
          setSessionError('');
        }
      })
      .catch((error) => {
        if (!active || run !== validationRun.current) return;
        if (isSessionError(error) || error?.response?.status === 401) {
          clearSession();
          return;
        }
        // Keep the token on transient failures (network / 5xx) so the user can retry.
        setSessionError(getErrorMessage(error, 'Unable to verify your session.'));
      })
      .finally(() => {
        if (active && run === validationRun.current) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token, clearSession]);

  useEffect(() => revalidate(), [revalidate]);

  const persistSession = useCallback((data) => {
    validationRun.current += 1;
    localStorage.setItem(TOKEN_STORAGE_KEY, data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    setSessionError('');
    setLoading(false);
  }, []);

  const login = useCallback(
    async (credentials) => {
      const data = await authService.login(credentials);
      persistSession(data);
      return data.user;
    },
    [persistSession],
  );

  const register = useCallback(
    async (payload) => {
      const data = await authService.register(payload);
      persistSession(data);
      return data.user;
    },
    [persistSession],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const refreshUser = useCallback(async () => {
    const currentUser = await authService.me();
    setUser(currentUser);
    setSessionError('');
    return currentUser;
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      sessionError,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
      refreshUser,
      retry: revalidate,
    }),
    [
      user,
      token,
      loading,
      sessionError,
      login,
      register,
      logout,
      refreshUser,
      revalidate,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
