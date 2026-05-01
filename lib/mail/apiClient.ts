'use client';

import { readSafetyAuthToken, SafetyApiError } from '@/lib/safetyApi';
import type {
  MailAccount,
  MailAttachmentPayload,
  MailMessage,
  MailOAuthStartPayload,
  MailProviderStatus,
  MailRecipient,
  MailRecipientSuggestion,
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
  const naverWorksRedirectUri =
    typeof window === 'undefined' ? '' : `${window.location.origin}/mail/connect/naver-works`;
  return requestMailApi<{ rows: MailProviderStatus[] }>(
    withQuery('/providers/status', {
      googleRedirectUri,
      naverRedirectUri,
      naverWorksRedirectUri,
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

export async function startNaverWorksMailConnect() {
  const response = await requestMailApi<{ authorization_url: string; provider?: string; state: string }>(
    '/accounts/connect/naver-works/start',
    {
      method: 'POST',
      body: JSON.stringify({
        redirect_uri:
          typeof window === 'undefined' ? '' : `${window.location.origin}/mail/connect/naver-works`,
      }),
    },
  );
  return {
    authorizationUrl: response.authorization_url,
    provider: (response.provider || 'naver_works') as MailOAuthStartPayload['provider'],
    state: response.state,
  } satisfies MailOAuthStartPayload;
}

export async function completeNaverWorksMailConnect(input: {
  authCode: string;
  redirectUri?: string;
  state: string;
}) {
  return requestMailApi<MailAccount>('/accounts/connect/naver-works/complete', {
    method: 'POST',
    body: JSON.stringify({
      auth_code: input.authCode,
      state: input.state,
      redirect_uri: input.redirectUri || '',
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

export async function fetchMailRecipientSuggestions(input: {
  accountId?: string;
  limit?: number;
  query?: string;
}) {
  const response = await requestMailApi<{
    rows: Array<{
      email: string;
      last_used_at: string | null;
      name: string | null;
      usage_count: number;
    }>;
  }>(
    withQuery('/recipient-suggestions', {
      accountId: input.accountId || '',
      limit: input.limit ? String(input.limit) : '',
      query: input.query || '',
    }),
  );
  return {
    rows: response.rows.map((row) => ({
      email: row.email,
      lastUsedAt: row.last_used_at,
      name: row.name,
      usageCount: row.usage_count,
    })) satisfies MailRecipientSuggestion[],
  };
}

export async function sendMail(input: {
  accountId: string;
  attachments?: MailAttachmentPayload[];
  body: string;
  fromName?: string;
  headquarterId?: string;
  reportKey?: string;
  reportKeys?: string[];
  siteId?: string;
  subject: string;
  threadId?: string;
  to: MailRecipient[];
}) {
  const attachments = (input.attachments || []).map((attachment) => ({
    content_type: attachment.contentType,
    ...(attachment.dataBase64 ? { data_base64: attachment.dataBase64 } : {}),
    ...(attachment.downloadHeaders ? { download_headers: attachment.downloadHeaders } : {}),
    ...(attachment.downloadUrl ? { download_url: attachment.downloadUrl } : {}),
    filename: attachment.filename,
    ...(attachment.reportKey ? { report_key: attachment.reportKey } : {}),
    ...(typeof attachment.sizeBytes === 'number' ? { size_bytes: attachment.sizeBytes } : {}),
    ...(attachment.source ? { source: attachment.source } : {}),
  }));

  return requestMailApi<MailMessage>('/send', {
    method: 'POST',
    body: JSON.stringify({
      account_id: input.accountId,
      attachments,
      body: input.body,
      sender_name: input.fromName || '',
      headquarter_id: input.headquarterId || '',
      report_key: input.reportKey || '',
      report_keys: input.reportKeys || [],
      site_id: input.siteId || '',
      subject: input.subject,
      thread_id: input.threadId || '',
      to: input.to,
    }),
  });
}

export async function sendReportMail(input: {
  accountId: string;
  attachments?: MailAttachmentPayload[];
  body: string;
  fromName?: string;
  headquarterId?: string;
  originalPdfAvailable?: boolean;
  originalPdfDownloadPath?: string | null;
  reportFilename?: string | null;
  reportKey: string;
  reports?: Array<{
    originalPdfAvailable?: boolean;
    originalPdfDownloadPath?: string | null;
    reportFilename?: string | null;
    reportKey: string;
    reportTitle?: string | null;
    reportType?: string | null;
    reportUpdatedAt?: string | null;
  }>;
  reportTitle?: string | null;
  reportType?: string | null;
  reportUpdatedAt?: string | null;
  siteId?: string;
  subject: string;
  to: MailRecipient[];
}) {
  const attachments = (input.attachments || []).map((attachment) => ({
    content_type: attachment.contentType,
    ...(attachment.dataBase64 ? { data_base64: attachment.dataBase64 } : {}),
    ...(attachment.downloadHeaders ? { download_headers: attachment.downloadHeaders } : {}),
    ...(attachment.downloadUrl ? { download_url: attachment.downloadUrl } : {}),
    filename: attachment.filename,
    ...(attachment.reportKey ? { report_key: attachment.reportKey } : {}),
    ...(typeof attachment.sizeBytes === 'number' ? { size_bytes: attachment.sizeBytes } : {}),
    ...(attachment.source ? { source: attachment.source } : {}),
  }));

  const reports = input.reports?.length
    ? input.reports
    : [
        {
          originalPdfAvailable: input.originalPdfAvailable,
          originalPdfDownloadPath: input.originalPdfDownloadPath,
          reportFilename: input.reportFilename,
          reportKey: input.reportKey,
          reportTitle: input.reportTitle,
          reportType: input.reportType,
          reportUpdatedAt: input.reportUpdatedAt,
        },
      ];

  return requestMailApi<MailMessage>('/send-report', {
    method: 'POST',
    body: JSON.stringify({
      account_id: input.accountId,
      attachments,
      body: input.body,
      sender_name: input.fromName || '',
      headquarter_id: input.headquarterId || '',
      original_pdf_available: Boolean(input.originalPdfAvailable),
      original_pdf_download_path: input.originalPdfDownloadPath || '',
      report: {
        original_pdf_available: Boolean(input.originalPdfAvailable),
        original_pdf_download_path: input.originalPdfDownloadPath || '',
        report_filename: input.reportFilename || '',
        report_key: input.reportKey,
        report_title: input.reportTitle || '',
        report_type: input.reportType || '',
        report_updated_at: input.reportUpdatedAt || '',
      },
      reports: reports.map((report) => ({
        original_pdf_available: Boolean(report.originalPdfAvailable),
        original_pdf_download_path: report.originalPdfDownloadPath || '',
        report_filename: report.reportFilename || report.reportTitle || '',
        report_key: report.reportKey,
        report_title: report.reportTitle || '',
        report_type: report.reportType || '',
        report_updated_at: report.reportUpdatedAt || '',
      })),
      report_filename: input.reportFilename || '',
      report_key: input.reportKey,
      report_keys: reports.map((report) => report.reportKey),
      report_title: input.reportTitle || '',
      report_type: input.reportType || '',
      report_updated_at: input.reportUpdatedAt || '',
      site_id: input.siteId || '',
      subject: input.subject,
      thread_id: '',
      to: input.to,
    }),
  });
}

export function prepareReportMailAttachment(input: {
  originalPdfAvailable?: boolean;
  originalPdfDownloadPath?: string | null;
  reportFilename?: string | null;
  reportKey: string;
  reportTitle?: string | null;
  reportType?: string | null;
  reportUpdatedAt?: string | null;
}) {
  if (!input.reportKey) {
    return Promise.resolve();
  }

  return requestMailApi<{ prepared: boolean; skipped: string | null }>(
    '/prepare-report',
    {
      method: 'POST',
      body: JSON.stringify({
        original_pdf_available: Boolean(input.originalPdfAvailable),
        original_pdf_download_path: input.originalPdfDownloadPath || '',
        report: {
          original_pdf_available: Boolean(input.originalPdfAvailable),
          original_pdf_download_path: input.originalPdfDownloadPath || '',
          report_filename: input.reportFilename || '',
          report_key: input.reportKey,
          report_title: input.reportTitle || '',
          report_type: input.reportType || '',
          report_updated_at: input.reportUpdatedAt || '',
        },
        report_filename: input.reportFilename || '',
        report_key: input.reportKey,
        report_title: input.reportTitle || '',
        report_type: input.reportType || '',
        report_updated_at: input.reportUpdatedAt || '',
      }),
    },
  )
    .then(() => undefined);
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
