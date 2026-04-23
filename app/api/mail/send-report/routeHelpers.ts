import { SafetyServerApiError } from '@/server/admin/safetyApiServer';
import type { MailAttachmentServerPayload } from '@/server/mail/reportAttachment';

export const MAIL_ATTACHMENT_TOTAL_LIMIT_BYTES = 20 * 1024 * 1024;

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
  body: unknown;
  reportAttachment: MailAttachmentServerPayload;
  reportFilename?: string | null;
  reportTitle?: string | null;
}) {
  const originalBody = typeof input.body === 'string' ? input.body : '';
  const downloadUrl = normalizeText(input.reportAttachment.download_url);
  if (!downloadUrl) {
    return originalBody;
  }

  const reportLabel =
    normalizeText(input.reportFilename) ||
    normalizeText(input.reportTitle) ||
    normalizeText(input.reportAttachment.filename) ||
    '보고서 PDF';

  return [
    originalBody,
    '<hr />',
    '<p>보고서 첨부 파일 용량이 커서 다운로드 링크로 대체했습니다.</p>',
    `<p><a href="${escapeHtml(downloadUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(reportLabel)}</a></p>`,
  ].join('');
}
