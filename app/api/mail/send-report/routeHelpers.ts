import { SafetyServerApiError } from '@/server/admin/safetyApiServer';
import type { MailAttachmentServerPayload } from '@/server/mail/reportAttachment';
import { buildMailReportDownloadUrl } from '@/server/mail/reportDownloadLink';
import type { MailMessage, MailRecipient } from '@/types/mail';

export const MAIL_ATTACHMENT_TOTAL_LIMIT_BYTES = 15 * 1024 * 1024;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function extractReportKeyFromOriginalPdfUrl(value: string) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return '';
  }

  try {
    const url = normalized.startsWith('http://') || normalized.startsWith('https://')
      ? new URL(normalized)
      : new URL(normalized, 'http://local.test');
    const match = url.pathname.match(/^\/api\/admin\/reports\/([^/]+)\/original-pdf$/i);
    if (!match?.[1]) {
      return '';
    }
    return decodeURIComponent(match[1]).trim();
  } catch {
    return '';
  }
}

function buildReportOpenUrl(reportKey: string, requestUrl?: string | null) {
  const normalizedReportKey = normalizeText(reportKey);
  const normalizedRequestUrl = normalizeText(requestUrl);
  if (!normalizedReportKey || !normalizedRequestUrl) {
    return '';
  }

  try {
    const baseUrl = new URL(normalizedRequestUrl).origin;
    return new URL(
      `/admin/report-open?reportKey=${encodeURIComponent(normalizedReportKey)}`,
      baseUrl,
    ).toString();
  } catch {
    return '';
  }
}

function stripHtml(value: string) {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function getBase64DecodedSizeBytes(value: string) {
  const normalized = value.replace(/\s+/g, '');
  if (!normalized) return 0;
  const padding = normalized.endsWith('==') ? 2 : normalized.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((normalized.length * 3) / 4) - padding);
}

export function getMailAttachmentPayloadSizeBytes(attachment: unknown) {
  const record = asRecord(attachment);
  const sizeBytes = record.size_bytes;
  if (typeof sizeBytes === 'number' && Number.isFinite(sizeBytes) && sizeBytes >= 0) {
    return sizeBytes;
  }

  const dataBase64 = normalizeText(record.data_base64);
  if (!dataBase64) {
    return null;
  }

  return getBase64DecodedSizeBytes(dataBase64);
}

async function readMailAttachmentDownloadError(response: Response) {
  try {
    const payload = (await response.json()) as Record<string, unknown>;
    return normalizeText(payload.error) || normalizeText(payload.detail) || '';
  } catch {
    return '';
  }
}

export async function materializeMailAttachmentDownload(
  attachment: MailAttachmentServerPayload,
): Promise<MailAttachmentServerPayload> {
  const downloadUrl = normalizeText(attachment.download_url);
  if (!downloadUrl) {
    return attachment;
  }

  const response = await fetch(downloadUrl, {
    cache: 'no-store',
    headers: attachment.download_headers || {},
  });
  if (!response.ok) {
    const detail = await readMailAttachmentDownloadError(response);
    throw new Error(
      detail || `첨부 파일을 다운로드해 메일 첨부로 변환하지 못했습니다. (${response.status})`,
    );
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length === 0) {
    throw new Error('메일 첨부용 원본 PDF 파일이 비어 있습니다.');
  }

  return {
    content_type: response.headers.get('content-type') || attachment.content_type || 'application/pdf',
    data_base64: buffer.toString('base64'),
    filename: attachment.filename,
    size_bytes: buffer.length,
  };
}

export function shouldSendReportAsDownloadLink(input: {
  attachments: unknown[];
  reportAttachment: MailAttachmentServerPayload;
}) {
  if (!normalizeText(input.reportAttachment.download_url)) {
    return false;
  }

  const reportSize = getMailAttachmentPayloadSizeBytes(input.reportAttachment);
  if (reportSize === null) {
    return false;
  }

  let totalSize = reportSize;
  for (const attachment of input.attachments) {
    const attachmentSize = getMailAttachmentPayloadSizeBytes(attachment);
    if (attachmentSize === null) {
      return false;
    }
    totalSize += attachmentSize;
  }

  return totalSize > MAIL_ATTACHMENT_TOTAL_LIMIT_BYTES;
}

export function isOversizeMailAttachmentError(error: unknown) {
  return (
    error instanceof SafetyServerApiError &&
    error.status === 400 &&
    error.message.includes('첨부 파일 총 용량이 너무 큽니다')
  );
}

export function buildOversizeReportFallbackBody(input: {
  accessToken?: string | null;
  body: unknown;
  reportAttachment: MailAttachmentServerPayload;
  reportFilename?: string | null;
  reportKey?: string | null;
  reportTitle?: string | null;
  requestUrl?: string | null;
}) {
  const originalBody = typeof input.body === 'string' ? input.body : '';
  const reportKey =
    normalizeText(input.reportKey) ||
    extractReportKeyFromOriginalPdfUrl(input.reportAttachment.download_url || '');
  const reportLabel =
    normalizeText(input.reportFilename) ||
    normalizeText(input.reportTitle) ||
    normalizeText(input.reportAttachment.filename) ||
    '보고서 PDF';
  let downloadUrl = '';

  try {
    downloadUrl = buildMailReportDownloadUrl({
      accessToken: normalizeText(input.accessToken),
      filename: reportLabel,
      reportKey,
      requestUrl: input.requestUrl,
    });
  } catch {
    downloadUrl = buildReportOpenUrl(reportKey, input.requestUrl);
  }

  if (!downloadUrl) {
    downloadUrl = buildReportOpenUrl(reportKey, input.requestUrl);
  }

  if (!downloadUrl) {
    return originalBody;
  }

  const usesBrowserOpenLink = downloadUrl.includes('/admin/report-open?');

  return [
    originalBody,
    '<hr />',
    usesBrowserOpenLink
      ? '<p>보고서 첨부 파일 용량이 커서 앱에서 여는 링크로 대체했습니다.</p>'
      : '<p>보고서 첨부 파일 용량이 커서 외부 다운로드 링크로 대체했습니다.</p>',
    usesBrowserOpenLink
      ? '<p>링크를 열면 앱 로그인 후 보고서를 확인할 수 있습니다.</p>'
      : '<p>링크는 일정 기간 뒤 만료될 수 있습니다.</p>',
    `<p><a href="${escapeHtml(downloadUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(reportLabel)}</a></p>`,
  ].join('');
}

export function buildQueuedMailMessage(input: {
  accountId: string;
  body: string;
  fromEmail?: string | null;
  fromName?: string | null;
  headquarterId?: string | null;
  id: string;
  reportKey?: string | null;
  siteId?: string | null;
  subject: string;
  to: MailRecipient[];
  queuedAt: string;
}) {
  const bodyPreview = stripHtml(input.body).slice(0, 280);
  return {
    accountId: input.accountId,
    body: input.body,
    bodyPreview,
    createdAt: input.queuedAt,
    deliveredAt: null,
    direction: 'outgoing',
    fromEmail: normalizeText(input.fromEmail),
    fromName: normalizeText(input.fromName) || null,
    headquarterId: normalizeText(input.headquarterId) || null,
    id: input.id,
    readAt: null,
    reportKey: normalizeText(input.reportKey) || null,
    sentAt: input.queuedAt,
    siteId: normalizeText(input.siteId) || null,
    subject: input.subject,
    threadId: input.id,
    to: input.to,
    updatedAt: input.queuedAt,
  } satisfies MailMessage;
}
