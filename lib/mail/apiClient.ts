'use client';

import { readSafetyAuthToken, SafetyApiError } from '@/lib/safetyApi';
import type {
  MailAccount,
  MailAttachmentPayload,
  MailMessage,
  MailOAuthStartPayload,
  MailProviderStatus,
  MailRecipient,
  MailSyncSummary,
  MailThread,
  MailThreadDetail,
} from '@/types/mail';

async function parseErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as Record<string, unknown>;
    if (typeof payload.error === 'string' && payload.error.trim()) return payload.error;
    if (typeof payload.detail === 'string' && payload.detail.trim()) return payload.detail;
  } catch {
    // ignore
  }

  return response.statusText || '요청 처리 중 오류가 발생했습니다.';
}

async function requestMailApi<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = readSafetyAuthToken();
  if (!token) {
    throw new SafetyApiError('로그인이 만료되었습니다. 다시 로그인해 주세요.', 401);
  }

  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);

  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`/api/mail${path}`, {
    ...options,
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new SafetyApiError(await parseErrorMessage(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function withQuery(path: string, params: Record<string, string | null | undefined>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (!value) return;
    searchParams.set(key, value);
  });
  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

export async function fetchMailAccounts() {
  return requestMailApi<{ rows: MailAccount[] }>('/accounts');
}

export async function fetchMailProviderStatuses() {
  const googleRedirectUri =
    typeof window === 'undefined' ? '' : `${window.location.origin}/mail/connect/google`;
  const naverRedirectUri =
    typeof window === 'undefined' ? '' : `${window.location.origin}/mail/connect/naver`;
  return requestMailApi<{ rows: MailProviderStatus[] }>(
    withQuery('/providers/status', {
      googleRedirectUri,
      naverRedirectUri,
    }),
  );
}

export async function startGoogleMailConnect() {
  const response = await requestMailApi<{ authorization_url: string; provider?: string; state: string }>(
    '/accounts/connect/google/start',
    {
      method: 'POST',
      body: JSON.stringify({
        redirect_uri:
          typeof window === 'undefined' ? '' : `${window.location.origin}/mail/connect/google`,
      }),
    },
  );
  return {
    authorizationUrl: response.authorization_url,
    provider: (response.provider || 'google') as MailOAuthStartPayload['provider'],
    state: response.state,
  } satisfies MailOAuthStartPayload;
}

export async function completeGoogleMailConnect(input: {
  authCode: string;
  redirectUri?: string;
  state: string;
}) {
  return requestMailApi<MailAccount>('/accounts/connect/google/complete', {
    method: 'POST',
    body: JSON.stringify({
      auth_code: input.authCode,
      state: input.state,
      redirect_uri: input.redirectUri || '',
    }),
  });
}

export async function startNaverMailConnect() {
  const response = await requestMailApi<{ authorization_url: string; provider?: string; state: string }>(
    '/accounts/connect/naver/start',
    {
      method: 'POST',
      body: JSON.stringify({
        redirect_uri:
          typeof window === 'undefined' ? '' : `${window.location.origin}/mail/connect/naver`,
      }),
    },
  );
  return {
    authorizationUrl: response.authorization_url,
    provider: (response.provider || 'naver_mail') as MailOAuthStartPayload['provider'],
    state: response.state,
  } satisfies MailOAuthStartPayload;
}

export async function completeNaverMailConnect(input: {
  authCode: string;
  redirectUri?: string;
  state: string;
}) {
  return requestMailApi<MailAccount>('/accounts/connect/naver/complete', {
    method: 'POST',
    body: JSON.stringify({
      auth_code: input.authCode,
      state: input.state,
      redirect_uri: input.redirectUri || '',
    }),
  });
}

export async function connectNaverMail(input: {
  appPassword?: string;
  displayName?: string;
  email: string;
}) {
  return requestMailApi<MailAccount>('/accounts/connect/naver', {
    method: 'POST',
    body: JSON.stringify({
      app_password: input.appPassword || '',
      display_name: input.displayName || '',
      email: input.email,
    }),
  });
}

export async function disconnectMailAccount(accountId: string) {
  return requestMailApi<void>(`/accounts/${encodeURIComponent(accountId)}`, {
    method: 'DELETE',
  });
}

export async function fetchMailThreads(input: {
  accountId?: string;
  box?: string;
  headquarterId?: string;
  limit?: number;
  offset?: number;
  query?: string;
  reportKey?: string;
  siteId?: string;
}) {
  return requestMailApi<{ rows: MailThread[]; total: number }>(
    withQuery('/threads', {
      accountId: input.accountId || '',
      box: input.box || '',
      headquarterId: input.headquarterId || '',
      limit: input.limit ? String(input.limit) : '',
      offset: input.offset ? String(input.offset) : '0',
      query: input.query || '',
      reportKey: input.reportKey || '',
      siteId: input.siteId || '',
    }),
  );
}

export async function fetchMailThreadDetail(threadId: string) {
  return requestMailApi<MailThreadDetail>(`/threads/${encodeURIComponent(threadId)}`);
}

export async function fetchMailMessage(messageId: string) {
  return requestMailApi<MailMessage>(`/messages/${encodeURIComponent(messageId)}`);
}

export async function sendMail(input: {
  accountId: string;
  attachments?: MailAttachmentPayload[];
  body: string;
  headquarterId?: string;
  reportKey?: string;
  siteId?: string;
  subject: string;
  threadId?: string;
  to: MailRecipient[];
}) {
  return requestMailApi<MailMessage>('/send', {
    method: 'POST',
    body: JSON.stringify({
      account_id: input.accountId,
      attachments: (input.attachments || []).map((attachment) => ({
        content_type: attachment.contentType,
        data_base64: attachment.dataBase64,
        filename: attachment.filename,
      })),
      body: input.body,
      headquarter_id: input.headquarterId || '',
      report_key: input.reportKey || '',
      site_id: input.siteId || '',
      subject: input.subject,
      thread_id: input.threadId || '',
      to: input.to,
    }),
  });
}

export async function syncMail() {
  const response = await requestMailApi<{
    backfill_account_count: number;
    incremental_account_count: number;
    message_count: number;
    queued_message_count: number;
    synced_account_count: number;
    sync_errors: string[];
    thread_count: number;
  }>('/sync', {
    method: 'POST',
  });
  return {
    backfillAccountCount: response.backfill_account_count,
    incrementalAccountCount: response.incremental_account_count,
    messageCount: response.message_count,
    queuedMessageCount: response.queued_message_count,
    syncedAccountCount: response.synced_account_count,
    syncErrors: Array.isArray(response.sync_errors) ? response.sync_errors : [],
    threadCount: response.thread_count,
  } satisfies MailSyncSummary;
}
