import { NextResponse } from 'next/server';
import {
  readRequiredAdminToken,
  SafetyServerApiError,
  sendSafetyMailServer,
} from '@/server/admin/safetyApiServer';
import { mapBackendMailMessage } from '@/server/admin/upstreamMappers';
import {
  buildMailReportAttachment,
  type MailAttachmentServerPayload,
} from '@/server/mail/reportAttachment';

export const runtime = 'nodejs';
export const maxDuration = 300;
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

export async function POST(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const payload = (await request.json()) as Record<string, unknown>;
    const report = asRecord(payload.report);
    const reportKey = normalizeText(report.report_key) || normalizeText(payload.report_key);
    const reportTitle = normalizeText(report.report_title) || normalizeText(payload.report_title);
    const reportFilename =
      normalizeText(report.report_filename) || normalizeText(payload.report_filename) || reportTitle;
    const reportAttachment = await buildMailReportAttachment(request, token, {
      originalPdfAvailable:
        report.original_pdf_available === true || payload.original_pdf_available === true,
      preferredFilename: reportFilename,
      reportKey,
      reportTitle,
      reportType: normalizeText(report.report_type) || normalizeText(payload.report_type),
      reportUpdatedAt:
        normalizeText(report.report_updated_at) || normalizeText(payload.report_updated_at),
    });
    const attachments = Array.isArray(payload.attachments) ? payload.attachments : [];
    const mailPayload = {
      ...payload,
      attachments: [reportAttachment, ...attachments],
      report_key: reportKey || normalizeText(payload.report_key),
    };

    if (shouldSendReportAsDownloadLink({ attachments, reportAttachment })) {
      return NextResponse.json(
        mapBackendMailMessage(
          await sendSafetyMailServer(
            token,
            {
              ...mailPayload,
              attachments,
              body: buildOversizeReportFallbackBody({
                body: payload.body,
                reportAttachment,
                reportFilename,
                reportTitle,
              }),
            },
            request,
          ),
        ),
      );
    }

    try {
      return NextResponse.json(
        mapBackendMailMessage(await sendSafetyMailServer(token, mailPayload, request)),
      );
    } catch (error) {
      if (!isOversizeMailAttachmentError(error) || !reportAttachment.download_url) {
        throw error;
      }

      return NextResponse.json(
        mapBackendMailMessage(
          await sendSafetyMailServer(
            token,
            {
              ...mailPayload,
              attachments,
              body: buildOversizeReportFallbackBody({
                body: payload.body,
                reportAttachment,
                reportFilename,
                reportTitle,
              }),
            },
            request,
          ),
        ),
      );
    }
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '보고서 첨부 메일 발송에 실패했습니다.' },
      { status: 500 },
    );
  }
}
