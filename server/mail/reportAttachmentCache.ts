import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import type { MailAttachmentServerPayload, MailReportAttachmentInput } from './reportAttachment';

export interface MailReportAttachmentCacheKey
  extends Pick<
    MailReportAttachmentInput,
    'originalPdfAvailable' | 'preferredFilename' | 'reportKey' | 'reportTitle' | 'reportType'
  > {
  reportUpdatedAt?: string | null;
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function getCacheRoot() {
  const configured = process.env.MAIL_REPORT_ATTACHMENT_CACHE_DIR?.trim();
  return configured || path.join(os.tmpdir(), 'mail-report-attachment-cache');
}

function buildCacheStem(input: MailReportAttachmentCacheKey) {
  return createHash('sha1')
    .update(
      [
        normalizeText(input.reportKey),
        normalizeText(input.reportType),
        normalizeText(input.reportTitle),
        normalizeText(input.preferredFilename),
        normalizeText(input.reportUpdatedAt),
        input.originalPdfAvailable ? 'original' : 'generated',
      ].join('::'),
    )
    .digest('hex');
}

function resolveCachePath(input: MailReportAttachmentCacheKey) {
  const root = getCacheRoot();
  return {
    filePath: path.join(root, `${buildCacheStem(input)}.json`),
    root,
  };
}

export async function readMailReportAttachmentCache(
  input: MailReportAttachmentCacheKey,
): Promise<MailAttachmentServerPayload | null> {
  const { filePath } = resolveCachePath(input);
  try {
    const parsed = JSON.parse(await fs.readFile(filePath, 'utf8')) as Partial<MailAttachmentServerPayload>;
    const contentType = normalizeText(parsed.content_type);
    const dataBase64 = normalizeText(parsed.data_base64);
    const downloadUrl = normalizeText(parsed.download_url);
    const filename = normalizeText(parsed.filename);
    const sizeBytes =
      typeof parsed.size_bytes === 'number' && Number.isFinite(parsed.size_bytes) && parsed.size_bytes >= 0
        ? parsed.size_bytes
        : undefined;
    if (!contentType || !filename || (!dataBase64 && !downloadUrl)) {
      return null;
    }

    const downloadHeaders = parsed.download_headers;
    const normalizedDownloadHeaders =
      downloadHeaders && typeof downloadHeaders === 'object'
        ? Object.fromEntries(
            Object.entries(downloadHeaders).flatMap(([key, value]) => {
              const headerName = normalizeText(key);
              const headerValue = normalizeText(value);
              return headerName && headerValue ? [[headerName, headerValue]] : [];
            }),
          )
        : undefined;

    return {
      content_type: contentType,
      ...(dataBase64 ? { data_base64: dataBase64 } : {}),
      ...(normalizedDownloadHeaders && Object.keys(normalizedDownloadHeaders).length > 0
        ? { download_headers: normalizedDownloadHeaders }
        : {}),
      ...(downloadUrl ? { download_url: downloadUrl } : {}),
      filename,
      ...(sizeBytes !== undefined ? { size_bytes: sizeBytes } : {}),
    };
  } catch {
    return null;
  }
}

export async function writeMailReportAttachmentCache(
  input: MailReportAttachmentCacheKey,
  entry: MailAttachmentServerPayload,
) {
  const { filePath, root } = resolveCachePath(input);
  await fs.mkdir(root, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(entry));
}
