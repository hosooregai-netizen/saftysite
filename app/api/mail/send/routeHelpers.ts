import { SafetyServerApiError } from '@/server/admin/safetyApiServer';
import type { MailAttachmentServerPayload } from '@/server/mail/reportAttachment';
import {
  getMailAttachmentPayloadSizeBytes,
  MAIL_ATTACHMENT_TOTAL_LIMIT_BYTES,
  materializeMailAttachmentDownload,
} from '../send-report/routeHelpers';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeHeaders(value: unknown): Record<string, string> | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const entries = Object.entries(value).filter((entry): entry is [string, string] => {
    return typeof entry[1] === 'string' && entry[1].trim().length > 0;
  });

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function normalizeAttachment(value: unknown): MailAttachmentServerPayload | null {
  const record = asRecord(value);
  const filename = normalizeText(record.filename);
  const dataBase64 = normalizeText(record.data_base64) || undefined;
  const downloadUrl = normalizeText(record.download_url) || undefined;
  if (!filename) {
    return null;
  }
  if (!dataBase64 && !downloadUrl) {
    return null;
  }

  return {
    content_type: normalizeText(record.content_type) || 'application/octet-stream',
    data_base64: dataBase64,
    download_headers: normalizeHeaders(record.download_headers),
    download_url: downloadUrl,
    filename,
    size_bytes:
      typeof record.size_bytes === 'number' && Number.isFinite(record.size_bytes)
        ? record.size_bytes
        : undefined,
  };
}

export async function materializeMailSendAttachments(attachments: unknown[]) {
  const normalizedAttachments = attachments
    .map(normalizeAttachment)
    .filter((attachment): attachment is MailAttachmentServerPayload => Boolean(attachment));
  const knownTotalAttachmentBytes = normalizedAttachments.reduce((total, attachment) => {
    const sizeBytes = getMailAttachmentPayloadSizeBytes(attachment);
    return sizeBytes === null ? total : total + sizeBytes;
  }, 0);

  if (knownTotalAttachmentBytes > MAIL_ATTACHMENT_TOTAL_LIMIT_BYTES) {
    throw new SafetyServerApiError('첨부 파일 총 용량이 너무 큽니다. 20MB 이하로 줄여 주세요.', 400);
  }

  const materializedAttachments = await Promise.all(
    normalizedAttachments.map((attachment) => materializeMailAttachmentDownload(attachment)),
  );
  const totalAttachmentBytes = materializedAttachments.reduce((total, attachment) => {
    const sizeBytes = getMailAttachmentPayloadSizeBytes(attachment);
    return total + (sizeBytes || 0);
  }, 0);

  if (totalAttachmentBytes > MAIL_ATTACHMENT_TOTAL_LIMIT_BYTES) {
    throw new SafetyServerApiError('첨부 파일 총 용량이 너무 큽니다. 20MB 이하로 줄여 주세요.', 400);
  }

  return materializedAttachments;
}
