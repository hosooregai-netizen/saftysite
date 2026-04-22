const POST_LOGIN_REDIRECT_STORAGE_KEY = 'safety-post-login-redirect';

function canUseSessionStorage() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

function normalizePendingRedirectTarget(target: string | null | undefined) {
  if (typeof target !== 'string') return null;
  const trimmedTarget = target.trim();
  if (!trimmedTarget.startsWith('/')) return null;
  return trimmedTarget;
}

export const ADMIN_OVERVIEW_POST_LOGIN_REDIRECT = '/admin?section=overview';
export const WORKER_CALENDAR_POST_LOGIN_REDIRECT = '/calendar';

export function writePendingPostLoginRedirect(target: string) {
  const normalizedTarget = normalizePendingRedirectTarget(target);
  if (!normalizedTarget || !canUseSessionStorage()) return;
  window.sessionStorage.setItem(POST_LOGIN_REDIRECT_STORAGE_KEY, normalizedTarget);
}

export function consumePendingPostLoginRedirect() {
  if (!canUseSessionStorage()) return null;
  const target = normalizePendingRedirectTarget(
    window.sessionStorage.getItem(POST_LOGIN_REDIRECT_STORAGE_KEY),
  );
  window.sessionStorage.removeItem(POST_LOGIN_REDIRECT_STORAGE_KEY);
  return target;
}

export function clearPendingPostLoginRedirect() {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(POST_LOGIN_REDIRECT_STORAGE_KEY);
}
