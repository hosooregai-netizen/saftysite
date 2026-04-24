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
  isOversizeMailAttachmentError,
  materializeMailAttachmentDownload,
  shouldSendReportAsDownloadLink,
} from './routeHelpers';

export const runtime = 'nodejs';
export const maxDuration = 300;

const defaultSendReportRouteDeps = {
  buildMailReportAttachment,
  buildOversizeReportFallbackBody,
  isOversizeMailAttachmentError,
  mapBackendMailMessage,
  materializeMailAttachmentDownload,
  readRequiredAdminToken,
  sendSafetyMailServer,
  shouldSendReportAsDownloadLink,
};

type SendReportRouteDeps = typeof defaultSendReportRouteDeps;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function handleSendReportPost(
  request: Request,
  deps: SendReportRouteDeps = defaultSendReportRouteDeps,
): Promise<Response> {
  try {
    const token = deps.readRequiredAdminToken(request);
    const payload = (await request.json()) as Record<string, unknown>;
    const report = asRecord(payload.report);
    const reportKey = normalizeText(report.report_key) || normalizeText(payload.report_key);
    const reportTitle = normalizeText(report.report_title) || normalizeText(payload.report_title);
    const reportFilename =
      normalizeText(report.report_filename) || normalizeText(payload.report_filename) || reportTitle;
    const reportAttachment = await deps.buildMailReportAttachment(request, token, {
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
    const shouldSendAsDownloadLink = deps.shouldSendReportAsDownloadLink({
      attachments,
      reportAttachment,
    });
    const normalizedReportAttachment = shouldSendAsDownloadLink
      ? reportAttachment
      : await deps.materializeMailAttachmentDownload(reportAttachment);
    const mailPayload = {
      ...payload,
      attachments: [normalizedReportAttachment, ...attachments],
      report_key: reportKey || normalizeText(payload.report_key),
    };

    if (shouldSendAsDownloadLink) {
      const queuedBody = deps.buildOversizeReportFallbackBody({
        accessToken: token,
        body: payload.body,
        reportAttachment,
        reportFilename,
        reportKey,
        reportTitle,
        requestUrl: request.url,
      });
      return NextResponse.json(
        deps.mapBackendMailMessage(
          await deps.sendSafetyMailServer(
            token,
            {
              ...mailPayload,
              attachments,
              body: queuedBody,
            },
            request,
          ),
        ),
      );
    }

    try {
      return NextResponse.json(
        deps.mapBackendMailMessage(await deps.sendSafetyMailServer(token, mailPayload, request)),
      );
    } catch (error) {
      if (!deps.isOversizeMailAttachmentError(error) || !reportAttachment.download_url) {
        throw error;
      }

      return NextResponse.json(
        deps.mapBackendMailMessage(
          await deps.sendSafetyMailServer(
            token,
            {
              ...mailPayload,
              attachments,
              body: deps.buildOversizeReportFallbackBody({
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

export async function POST(request: Request): Promise<Response> {
  return handleSendReportPost(request);
}
