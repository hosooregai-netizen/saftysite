import { NextResponse } from 'next/server';
import {
  readRequiredAdminToken,
  SafetyServerApiError,
  sendSafetyMailServer,
} from '@/server/admin/safetyApiServer';
import { mapBackendMailMessage } from '@/server/admin/upstreamMappers';
import {
  buildMailReportAttachment,
} from '@/server/mail/reportAttachment';
import {
  buildOversizeReportFallbackBody,
  buildQueuedMailMessage,
  isOversizeMailAttachmentError,
  materializeMailAttachmentDownload,
  shouldSendReportAsDownloadLink,
} from './routeHelpers';

export const runtime = 'nodejs';
export const maxDuration = 300;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeRecipients(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const record = asRecord(item);
      const email = normalizeText(record.email);
      if (!email) {
        return null;
      }

      return {
        email,
        name: normalizeText(record.name) || null,
      };
    })
    .filter((item): item is { email: string; name: string | null } => Boolean(item));
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
      originalPdfDownloadPath:
        normalizeText(report.original_pdf_download_path) ||
        normalizeText(payload.original_pdf_download_path),
      preferredFilename: reportFilename,
      reportKey,
      reportTitle,
      reportType: normalizeText(report.report_type) || normalizeText(payload.report_type),
      reportUpdatedAt:
        normalizeText(report.report_updated_at) || normalizeText(payload.report_updated_at),
    });
    const attachments = Array.isArray(payload.attachments) ? payload.attachments : [];
    const shouldSendAsDownloadLink = shouldSendReportAsDownloadLink({
      attachments,
      reportAttachment,
    });
    const normalizedReportAttachment = shouldSendReportAsDownloadLink({
      attachments,
      reportAttachment,
    })
      ? reportAttachment
      : await materializeMailAttachmentDownload(reportAttachment);
    const mailPayload = {
      ...payload,
      attachments: [normalizedReportAttachment, ...attachments],
      report_key: reportKey || normalizeText(payload.report_key),
    };

    if (shouldSendAsDownloadLink) {
      const queuedBody = buildOversizeReportFallbackBody({
        accessToken: token,
        body: payload.body,
        reportAttachment,
        reportFilename,
        reportKey,
        reportTitle,
        requestUrl: request.url,
      });
      const queuedMailPayload = {
        ...mailPayload,
        attachments,
        body: queuedBody,
      };
      const queuedAt = new Date().toISOString();
      const queuedId = `queued:mail-report:${crypto.randomUUID()}`;

      globalThis.setTimeout(() => {
        void sendSafetyMailServer(token, queuedMailPayload, null).catch((error) => {
          console.error('[mail/send-report] oversized link send failed', {
            error: error instanceof Error ? error.message : String(error),
            reportKey,
            subject: normalizeText(payload.subject),
          });
        });
      }, 0);

      return NextResponse.json(
        buildQueuedMailMessage({
          accountId: normalizeText(payload.account_id),
          body: queuedBody,
          fromEmail: normalizeText(payload.sender_email),
          fromName: normalizeText(payload.sender_name),
          headquarterId: normalizeText(payload.headquarter_id),
          id: queuedId,
          queuedAt,
          reportKey,
          siteId: normalizeText(payload.site_id),
          subject: normalizeText(payload.subject),
          to: normalizeRecipients(payload.to),
        }),
        { status: 202 },
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
                accessToken: token,
                body: payload.body,
                reportAttachment,
                reportFilename,
                reportKey,
                reportTitle,
                requestUrl: request.url,
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
