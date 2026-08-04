import type { CurrentUser } from '../types/api';

const AUTH_SESSION_KEY = 'auction-marketplace.auth';

export interface StoredAuthSession {
  token: string;
  user: CurrentUser;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCurrentUser(value: unknown): value is CurrentUser {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    typeof value.email === 'string' &&
    value.email.length > 0 &&
    typeof value.username === 'string' &&
    value.username.length > 0
  );
}

function isStoredAuthSession(value: unknown): value is StoredAuthSession {
  return (
    isRecord(value) &&
    typeof value.token === 'string' &&
    value.token.length > 0 &&
    isCurrentUser(value.user)
  );
}

export function readAuthSession(): StoredAuthSession | null {
  const rawSession = window.sessionStorage.getItem(AUTH_SESSION_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    const session = JSON.parse(rawSession) as unknown;

    if (isStoredAuthSession(session)) {
      return session;
    }
  } catch {
    // Invalid session data is cleared below.
  }

  clearAuthSession();
  return null;
}

export function saveAuthSession(session: StoredAuthSession): void {
  window.sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

export function clearAuthSession(): void {
  window.sessionStorage.removeItem(AUTH_SESSION_KEY);
}
