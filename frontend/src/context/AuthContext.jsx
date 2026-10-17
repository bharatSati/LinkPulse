import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/auth.service.js';
import { getStoredToken, setStoredToken, registerUnauthorizedHandler } from '../services/api.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const clearSession = useCallback(() => {
    setStoredToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      setUser(null);
    });
  }, []);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      if (!getStoredToken()) {
        setInitializing(false);
        return;
      }

      try {
        const currentUser = await authService.getMe();
        if (active) setUser(currentUser);
      } catch {
        clearSession();
      } finally {
        if (active) setInitializing(false);
      }
    }

    bootstrap();

    return () => {
      active = false;
    };
  }, [clearSession]);

  const login = useCallback(async (credentials) => {
    const { user: authenticatedUser, token } = await authService.login(credentials);
    setStoredToken(token);
    setUser(authenticatedUser);
    return authenticatedUser;
  }, []);

  const register = useCallback(async (payload) => {
    const { user: createdUser, token } = await authService.register(payload);
    setStoredToken(token);
    setUser(createdUser);
    return createdUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore network errors during logout; the local session is cleared regardless.
    }
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      initializing,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
    }),
    [user, initializing, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
