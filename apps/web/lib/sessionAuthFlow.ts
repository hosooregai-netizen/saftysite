'use client';

import {
  canUseWorkspaceServerApis,
  claimAnonymousSession,
  completeGoogleWorkspaceAuth,
  isAuthenticatedSession,
  loginReportUser,
  signupReportUser,
  startGoogleWorkspaceAuth,
  type DemoSession,
} from '@/lib/reportApi';
import {
  markGuestWorkspaceImported,
  readGuestWorkspaceCache,
} from '@/lib/guestWorkspaceCache';
import { importGuestWorkspaceCache, type GuestWorkspaceImportResponse } from '@/lib/workspaceStorageApi';

const GOOGLE_AUTH_CONTEXT_PREFIX = 'saftysite-web-google-auth:';
const PENDING_GOOGLE_MAIL_CONNECT_KEY = 'saftysite-web-google-mail-connect:pending';

export interface ConnectWorkspaceAccountInput {
  anonymousToken?: string | null;
  email: string;
  mode: 'login' | 'signup';
  name?: string;
  password: string;
}

export interface ConnectWorkspaceAccountResult {
  importedGuestCache: GuestWorkspaceImportResponse | null;
  session: DemoSession;
}

export interface GoogleWorkspaceAuthContext {
  anonymousToken: string | null;
  nextPath: string;
  requestedAt: number;
}

export interface GoogleWorkspaceAuthCompletionResult {
  importedGuestCache: GuestWorkspaceImportResponse | null;
  nextPath: string;
  session: DemoSession;
}

export function markPendingGoogleMailConnect() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(PENDING_GOOGLE_MAIL_CONNECT_KEY, '1');
}

export function hasPendingGoogleMailConnect() {
  if (typeof window === 'undefined') return false;
  return window.sessionStorage.getItem(PENDING_GOOGLE_MAIL_CONNECT_KEY) === '1';
}

export function clearPendingGoogleMailConnect() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(PENDING_GOOGLE_MAIL_CONNECT_KEY);
}

function getGoogleWorkspaceRedirectUri() {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/auth/google/callback`;
}

function buildGoogleAuthContextStorageKey(state: string) {
  return `${GOOGLE_AUTH_CONTEXT_PREFIX}${state}`;
}

function writeGoogleWorkspaceAuthContext(state: string, context: GoogleWorkspaceAuthContext) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(
    buildGoogleAuthContextStorageKey(state),
    JSON.stringify(context),
  );
}

function readGoogleWorkspaceAuthContext(state: string): GoogleWorkspaceAuthContext | null {
  if (typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem(buildGoogleAuthContextStorageKey(state));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<GoogleWorkspaceAuthContext>;
    if (typeof parsed.nextPath !== 'string' || !parsed.nextPath.trim()) {
      return null;
    }
    return {
      anonymousToken:
        typeof parsed.anonymousToken === 'string' && parsed.anonymousToken.trim()
          ? parsed.anonymousToken
          : null,
      nextPath: parsed.nextPath,
      requestedAt:
        typeof parsed.requestedAt === 'number' && Number.isFinite(parsed.requestedAt)
          ? parsed.requestedAt
          : Date.now(),
    };
  } catch {
    return null;
  }
}

function clearGoogleWorkspaceAuthContext(state: string) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(buildGoogleAuthContextStorageKey(state));
}

async function importGuestCacheIfNeeded(
  session: DemoSession,
): Promise<GuestWorkspaceImportResponse | null> {
  const cache = await readGuestWorkspaceCache();
  const hasImportableData =
    cache.directory.headquarters.length > 0 ||
    cache.directory.sites.length > 0 ||
    cache.mailboxDrafts.length > 0 ||
    cache.photoAlbum.length > 0 ||
    cache.drive.items.length > 0 ||
    cache.drive.shares.length > 0;

  if (!hasImportableData || cache.sync.lastImportedWorkspaceId === session.workspaceId) {
    return null;
  }

  const importedGuestCache = await importGuestWorkspaceCache(session, cache);
  await markGuestWorkspaceImported(session.workspaceId);
  return importedGuestCache;
}

export async function beginGoogleWorkspaceAuth(input: {
  anonymousToken?: string | null;
  nextPath?: string;
} = {}): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('브라우저 환경에서만 구글 로그인을 시작할 수 있습니다.');
  }

  const redirectUri = getGoogleWorkspaceRedirectUri();
  const response = await startGoogleWorkspaceAuth(redirectUri);
  writeGoogleWorkspaceAuthContext(response.state, {
    anonymousToken:
      typeof input.anonymousToken === 'string' && input.anonymousToken.trim()
        ? input.anonymousToken
        : null,
    nextPath: input.nextPath?.trim() || `${window.location.pathname}${window.location.search}`,
    requestedAt: Date.now(),
  });
  window.location.assign(response.authorization_url);
}

export async function completeGoogleWorkspaceAuthCallback(input: {
  authCode: string;
  state: string;
}): Promise<GoogleWorkspaceAuthCompletionResult> {
  const context = readGoogleWorkspaceAuthContext(input.state);
  const nextPath = context?.nextPath || '/account#account';
  const redirectUri = getGoogleWorkspaceRedirectUri();
  let session = await completeGoogleWorkspaceAuth({
    authCode: input.authCode,
    redirectUri,
    state: input.state,
  });

  if (!canUseWorkspaceServerApis(session)) {
    throw new Error('구글 로그인에 성공했지만 계정 세션을 확인하지 못했습니다.');
  }

  if (context?.anonymousToken) {
    session = await claimAnonymousSession(session, context.anonymousToken);
  }

  const importedGuestCache = await importGuestCacheIfNeeded(session);
  clearGoogleWorkspaceAuthContext(input.state);

  return {
    importedGuestCache,
    nextPath,
    session,
  };
}

export async function connectWorkspaceAccount(
  input: ConnectWorkspaceAccountInput,
): Promise<ConnectWorkspaceAccountResult> {
  let session =
    input.mode === 'signup'
      ? await signupReportUser(input.name || '', input.email, input.password)
      : await loginReportUser(input.email, input.password);

  if (!isAuthenticatedSession(session)) {
    throw new Error('계정 연결에 실패했습니다.');
  }

  if (input.anonymousToken) {
    session = await claimAnonymousSession(session, input.anonymousToken);
  }

  return {
    importedGuestCache: await importGuestCacheIfNeeded(session),
    session,
  };
}
