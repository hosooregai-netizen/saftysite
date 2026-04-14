'use client';

const ADMIN_SESSION_CACHE_PREFIX = 'safety-admin-session-cache:';
const ADMIN_SESSION_CACHE_TTL_MS = 1000 * 60 * 5;

interface AdminSessionCacheRecord<T> {
  savedAt: number;
  value: T;
}

function buildStorageKey(scope: string, key: string) {
  return `${ADMIN_SESSION_CACHE_PREFIX}${scope}:${key}`;
}

function isBrowserReady() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

export function readAdminSessionCache<T>(scope: string | null | undefined, key: string) {
  if (!scope || !isBrowserReady()) {
    return { isFresh: false, value: null as T | null };
  }

  try {
    const rawValue = window.sessionStorage.getItem(buildStorageKey(scope, key));
    if (!rawValue) {
      return { isFresh: false, value: null as T | null };
    }

    const parsed = JSON.parse(rawValue) as AdminSessionCacheRecord<T>;
    if (!parsed || typeof parsed !== 'object' || typeof parsed.savedAt !== 'number') {
      return { isFresh: false, value: null as T | null };
    }

    return {
      isFresh: Date.now() - parsed.savedAt < ADMIN_SESSION_CACHE_TTL_MS,
      value: parsed.value ?? null,
    };
  } catch {
    return { isFresh: false, value: null as T | null };
  }
}

export function writeAdminSessionCache<T>(
  scope: string | null | undefined,
  key: string,
  value: T,
) {
  if (!scope || !isBrowserReady()) return;

  try {
    const payload: AdminSessionCacheRecord<T> = {
      savedAt: Date.now(),
      value,
    };
    window.sessionStorage.setItem(buildStorageKey(scope, key), JSON.stringify(payload));
  } catch {
    // Ignore cache write failures in session storage.
  }
}

export function clearAdminSessionCache(scope: string | null | undefined, key: string) {
  if (!scope || !isBrowserReady()) return;

  try {
    window.sessionStorage.removeItem(buildStorageKey(scope, key));
  } catch {
    // Ignore cache delete failures in session storage.
  }
}

export { ADMIN_SESSION_CACHE_TTL_MS };
