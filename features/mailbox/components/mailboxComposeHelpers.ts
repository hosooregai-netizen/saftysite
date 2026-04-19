import {
  fetchBadWorkplacePdfDocumentByReportKey,
  fetchInspectionPdfDocumentByReportKey,
  fetchQuarterlyPdfDocumentByReportKey,
} from '@/lib/api';
import { normalizeControllerReportType } from '@/lib/admin/reportMeta';
import type { MailAttachmentPayload, MailThread } from '@/types/mail';
import type { ComposeState, MailboxReportOption, SelectedReportContext } from './mailboxPanelTypes';

const reportAttachmentCache = new Map<string, Promise<MailAttachmentPayload>>();

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function encodeByteArrayToBase64(bytes: Uint8Array) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

async function blobToBase64(blob: Blob) {
  return encodeByteArrayToBase64(new Uint8Array(await blob.arrayBuffer()));
}

function resolveSelectedReportType(report: Pick<MailboxReportOption, 'documentKind' | 'meta' | 'reportType'>) {
  const metaReportKind =
    report.meta && typeof report.meta.reportKind === 'string' ? report.meta.reportKind : report.documentKind || '';
  return normalizeControllerReportType(report.reportType || metaReportKind);
}

export function stripHtmlToText(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|blockquote|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function formatMailBodyHtml(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (!/<[a-z][\s\S]*>/i.test(trimmed)) {
    return escapeHtml(trimmed).replace(/\n/g, '<br />');
  }
  return trimmed
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/\s(on\w+)=(".*?"|'.*?'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '');
}

export function isLikelyEmail(value: string) {
  const normalized = value.trim();
  return normalized ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) : false;
}

export function dedupeRecipients(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const normalized = value.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

export function extractRecipientTokens(value: string) {
  return value
    .split(/[\s,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function buildComposeState(input?: Partial<ComposeState>): ComposeState {
  return {
    body: input?.body || '',
    subject: input?.subject || '',
    toInput: input?.toInput || '',
    toRecipients: input?.toRecipients || [],
  };
}

export function buildThreadRecipients(thread: MailThread, accountEmail: string) {
  return thread.participants
    .filter((item) => item.email !== accountEmail)
    .map((item) => item.email)
    .join(', ');
}

export function buildReplySubject(subject: string) {
  const normalized = subject.trim();
  if (!normalized) return '';
  return /^re:/i.test(normalized) ? normalized : `Re: ${normalized}`;
}

export async function buildReportAttachmentPayload(
  report: SelectedReportContext,
  authToken: string,
): Promise<MailAttachmentPayload> {
  const cacheKey = [
    report.reportKey || 'report',
    report.updatedAt || 'unknown',
    resolveSelectedReportType(report),
  ].join('::');
  const cached = reportAttachmentCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const pending = (async () => {
    const reportType = resolveSelectedReportType(report);
    const exported =
      reportType === 'bad_workplace'
        ? await fetchBadWorkplacePdfDocumentByReportKey(report.reportKey, authToken)
        : reportType === 'quarterly_report'
          ? await fetchQuarterlyPdfDocumentByReportKey(report.reportKey, authToken)
          : await fetchInspectionPdfDocumentByReportKey(report.reportKey, authToken);
    return {
      contentType: exported.blob.type || 'application/pdf',
      dataBase64: await blobToBase64(exported.blob),
      filename: exported.filename || `${report.reportKey || 'report'}.pdf`,
    };
  })();
  reportAttachmentCache.set(cacheKey, pending);
  return pending.catch((error) => {
    reportAttachmentCache.delete(cacheKey);
    throw error;
  });
}

export async function buildFileAttachmentPayload(file: File): Promise<MailAttachmentPayload> {
  return {
    contentType: file.type || 'application/octet-stream',
    dataBase64: await blobToBase64(file),
    filename: file.name,
  };
}
