'use client';

const ADMIN_SESSION_CACHE_PREFIX = 'safety-admin-session-cache:';
const ADMIN_SESSION_CACHE_TTL_MS = 1000 * 60 * 5;
const adminSessionCacheInFlight = new Map<string, Promise<unknown>>();
const adminSessionCacheGenerations = new Map<string, number>();

interface AdminSessionCacheRecord<T> {
  savedAt: number;
  value: T;
}

interface AdminSessionCacheReadResult<T> {
  isFresh: boolean;
  savedAt: number | null;
  value: T | null;
}

function buildStorageKey(scope: string, key: string) {
  return `${ADMIN_SESSION_CACHE_PREFIX}${scope}:${key}`;
}

function buildScopePrefix(scope: string) {
  return `${ADMIN_SESSION_CACHE_PREFIX}${scope}:`;
}

function isBrowserReady() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

function bumpAdminSessionCacheGeneration(requestKey: string) {
  adminSessionCacheGenerations.set(
    requestKey,
    (adminSessionCacheGenerations.get(requestKey) ?? 0) + 1,
  );
}

export function getAdminSessionCacheGeneration(
  scope: string | null | undefined,
  key: string,
) {
  if (!scope) return 0;
  return adminSessionCacheGenerations.get(buildStorageKey(scope, key)) ?? 0;
}

export function readAdminSessionCache<T>(scope: string | null | undefined, key: string) {
  if (!scope || !isBrowserReady()) {
    return { isFresh: false, savedAt: null, value: null as T | null } satisfies AdminSessionCacheReadResult<T>;
  }

  try {
    const rawValue = window.sessionStorage.getItem(buildStorageKey(scope, key));
    if (!rawValue) {
      return { isFresh: false, savedAt: null, value: null as T | null } satisfies AdminSessionCacheReadResult<T>;
    }

    const parsed = JSON.parse(rawValue) as AdminSessionCacheRecord<T>;
    if (!parsed || typeof parsed !== 'object' || typeof parsed.savedAt !== 'number') {
      return { isFresh: false, savedAt: null, value: null as T | null } satisfies AdminSessionCacheReadResult<T>;
    }

    return {
      isFresh: Date.now() - parsed.savedAt < ADMIN_SESSION_CACHE_TTL_MS,
      savedAt: parsed.savedAt,
      value: parsed.value ?? null,
    } satisfies AdminSessionCacheReadResult<T>;
  } catch {
    return { isFresh: false, savedAt: null, value: null as T | null } satisfies AdminSessionCacheReadResult<T>;
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
  if (!scope) return;

  const requestKey = buildStorageKey(scope, key);
  adminSessionCacheInFlight.delete(requestKey);
  bumpAdminSessionCacheGeneration(requestKey);
  if (!isBrowserReady()) return;

  try {
    window.sessionStorage.removeItem(buildStorageKey(scope, key));
  } catch {
    // Ignore cache delete failures in session storage.
  }
}

export function clearAdminSessionCacheByPrefix(
  scope: string | null | undefined,
  keyPrefix: string,
) {
  if (!scope) return;

  const scopedPrefix = `${buildScopePrefix(scope)}${keyPrefix}`;
  for (const requestKey of adminSessionCacheInFlight.keys()) {
    if (requestKey.startsWith(scopedPrefix)) {
      adminSessionCacheInFlight.delete(requestKey);
      bumpAdminSessionCacheGeneration(requestKey);
    }
  }

  if (!isBrowserReady()) return;

  try {
    for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = window.sessionStorage.key(index);
      if (!key || !key.startsWith(scopedPrefix)) continue;
      window.sessionStorage.removeItem(key);
      bumpAdminSessionCacheGeneration(key);
    }
  } catch {
    // Ignore cache delete failures in session storage.
  }
}

export function fetchAdminSessionCacheOnce<T>(
  scope: string | null | undefined,
  key: string,
  fetcher: () => Promise<T>,
  options?: { force?: boolean },
) {
  if (!scope) {
    return fetcher();
  }

  const requestKey = buildStorageKey(scope, key);
  if (options?.force) {
    bumpAdminSessionCacheGeneration(requestKey);
  }
  const existing = options?.force ? null : adminSessionCacheInFlight.get(requestKey);
  if (existing) {
    return existing as Promise<T>;
  }

  let nextRequest!: Promise<T>;
  nextRequest = Promise.resolve(fetcher()).finally(() => {
    if (adminSessionCacheInFlight.get(requestKey) === nextRequest) {
      adminSessionCacheInFlight.delete(requestKey);
    }
  });
  adminSessionCacheInFlight.set(requestKey, nextRequest);
  return nextRequest;
}

export { ADMIN_SESSION_CACHE_TTL_MS };
