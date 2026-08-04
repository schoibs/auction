'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { apiFetch } from '../lib/api-client';
import { ApiError } from '../lib/api-error';
import {
  clearAuthSession,
  readAuthSession,
  saveAuthSession,
} from '../lib/auth-storage';
import type {
  AuthResponse,
  CurrentUser,
  LoginInput,
  RegisterInput,
} from '../types/api';

export type AuthStatus = 'loading' | 'anonymous' | 'authenticated';

interface AuthContextValue {
  status: AuthStatus;
  token: string | null;
  user: CurrentUser | null;
  sessionVerificationError: string | null;
  login(input: LoginInput): Promise<void>;
  register(input: RegisterInput): Promise<void>;
  logout(): void;
  revalidate(): Promise<void>;
  handleUnauthorized(error: unknown): boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_VERIFICATION_ERROR =
  'Your session could not be verified. Check your connection and try again.';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [sessionVerificationError, setSessionVerificationError] = useState<
    string | null
  >(null);

  const clearSession = useCallback(() => {
    clearAuthSession();
    setToken(null);
    setUser(null);
    setSessionVerificationError(null);
    setStatus('anonymous');
  }, []);

  const applySession = useCallback(
    (nextToken: string, nextUser: CurrentUser) => {
      saveAuthSession({ token: nextToken, user: nextUser });
      setToken(nextToken);
      setUser(nextUser);
      setSessionVerificationError(null);
      setStatus('authenticated');
    },
    [],
  );

  useEffect(() => {
    let isActive = true;
    const storedSession = readAuthSession();

    if (!storedSession) {
      setStatus('anonymous');
      return;
    }

    const restoreSession = async () => {
      try {
        const currentUser = await apiFetch<CurrentUser>('/auth/me', {
          token: storedSession.token,
        });

        if (isActive) {
          applySession(storedSession.token, currentUser);
        }
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          clearSession();
          return;
        }

        setToken(storedSession.token);
        setUser(storedSession.user);
        setSessionVerificationError(SESSION_VERIFICATION_ERROR);
        setStatus('authenticated');
      }
    };

    void restoreSession();

    return () => {
      isActive = false;
    };
  }, [applySession, clearSession]);

  const login = useCallback(
    async (input: LoginInput) => {
      const response = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: input,
      });

      applySession(response.accessToken, response.user);
    },
    [applySession],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const response = await apiFetch<AuthResponse>('/auth/register', {
        method: 'POST',
        body: input,
      });

      applySession(response.accessToken, response.user);
    },
    [applySession],
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const revalidate = useCallback(async () => {
    if (!token) {
      clearSession();
      return;
    }

    try {
      const currentUser = await apiFetch<CurrentUser>('/auth/me', { token });
      applySession(token, currentUser);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearSession();
        return;
      }

      setSessionVerificationError(SESSION_VERIFICATION_ERROR);
      throw error;
    }
  }, [applySession, clearSession, token]);

  const handleUnauthorized = useCallback(
    (error: unknown) => {
      if (!(error instanceof ApiError) || error.status !== 401) {
        return false;
      }

      clearSession();
      return true;
    },
    [clearSession],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      token,
      user,
      sessionVerificationError,
      login,
      register,
      logout,
      revalidate,
      handleUnauthorized,
    }),
    [
      handleUnauthorized,
      login,
      logout,
      register,
      revalidate,
      sessionVerificationError,
      status,
      token,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }

  return context;
}
