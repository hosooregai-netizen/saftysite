'use client';

const LOGIN_CREDENTIALS_STORAGE_KEY = 'saftysite:remembered-login-credentials';

export interface RememberedLoginCredentials {
  email: string;
  password: string;
  rememberCredentials: boolean;
  savedAt: string;
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function readRememberedLoginCredentials(): RememberedLoginCredentials | null {
  if (!canUseStorage()) return null;

  try {
    const raw = window.localStorage.getItem(LOGIN_CREDENTIALS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RememberedLoginCredentials>;
    if (
      typeof parsed.email !== 'string' ||
      typeof parsed.password !== 'string' ||
      typeof parsed.rememberCredentials !== 'boolean' ||
      typeof parsed.savedAt !== 'string'
    ) {
      return null;
    }
    return {
      email: parsed.email,
      password: parsed.password,
      rememberCredentials: parsed.rememberCredentials,
      savedAt: parsed.savedAt,
    };
  } catch {
    return null;
  }
}

export function writeRememberedLoginCredentials(input: {
  email: string;
  password: string;
  rememberCredentials: boolean;
}) {
  if (!canUseStorage()) return;

  const payload: RememberedLoginCredentials = {
    email: input.email,
    password: input.password,
    rememberCredentials: input.rememberCredentials,
    savedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(LOGIN_CREDENTIALS_STORAGE_KEY, JSON.stringify(payload));
}

export function clearRememberedLoginCredentials() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(LOGIN_CREDENTIALS_STORAGE_KEY);
}
