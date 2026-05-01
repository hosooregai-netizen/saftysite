import { NextResponse } from 'next/server';
import {
  readRequiredAdminToken,
  SafetyServerApiError,
  sendSafetyMailServer,
} from '@/server/admin/safetyApiServer';
import { mapBackendMailMessage } from '@/server/admin/upstreamMappers';
import { buildMailReportAttachment, type MailAttachmentServerPayload } from '@/server/mail/reportAttachment';
import {
  buildOversizeReportFallbackBody,
  isOversizeMailAttachmentError,
  materializeMailAttachmentDownload,
  shouldSendReportAsDownloadLink,
} from './routeHelpers';

export const defaultSendReportRouteDeps = {
  buildMailReportAttachment,
  buildOversizeReportFallbackBody,
  isOversizeMailAttachmentError,
  mapBackendMailMessage,
  materializeMailAttachmentDownload,
  readRequiredAdminToken,
  sendSafetyMailServer,
  shouldSendReportAsDownloadLink,
};

export type SendReportRouteDeps = typeof defaultSendReportRouteDeps;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeReportPayloads(payload: Record<string, unknown>) {
  const rawReports = Array.isArray(payload.reports) ? payload.reports : [];
  const reports = rawReports
    .map(asRecord)
    .map((report) => ({
      originalPdfAvailable:
        report.original_pdf_available === true || payload.original_pdf_available === true,
      originalPdfDownloadPath:
        normalizeText(report.original_pdf_download_path) ||
        normalizeText(payload.original_pdf_download_path),
      reportFilename:
        normalizeText(report.report_filename) ||
        normalizeText(payload.report_filename) ||
        normalizeText(report.report_title) ||
        normalizeText(payload.report_title),
      reportKey: normalizeText(report.report_key),
      reportTitle: normalizeText(report.report_title) || normalizeText(payload.report_title),
      reportType: normalizeText(report.report_type) || normalizeText(payload.report_type),
      reportUpdatedAt:
        normalizeText(report.report_updated_at) || normalizeText(payload.report_updated_at),
    }))
    .filter((report) => report.reportKey);

  if (reports.length > 0) {
    return reports;
  }

  const report = asRecord(payload.report);
  const reportKey = normalizeText(report.report_key) || normalizeText(payload.report_key);
  if (!reportKey) {
    return [];
  }
  const reportTitle = normalizeText(report.report_title) || normalizeText(payload.report_title);
  return [
    {
      originalPdfAvailable:
        report.original_pdf_available === true || payload.original_pdf_available === true,
      originalPdfDownloadPath:
        normalizeText(report.original_pdf_download_path) ||
        normalizeText(payload.original_pdf_download_path),
      reportFilename:
        normalizeText(report.report_filename) || normalizeText(payload.report_filename) || reportTitle,
      reportKey,
      reportTitle,
      reportType: normalizeText(report.report_type) || normalizeText(payload.report_type),
      reportUpdatedAt:
        normalizeText(report.report_updated_at) || normalizeText(payload.report_updated_at),
    },
  ];
}

export async function handleSendReportPost(
  request: Request,
  deps: SendReportRouteDeps = defaultSendReportRouteDeps,
): Promise<Response> {
  try {
    const token = deps.readRequiredAdminToken(request);
    const payload = (await request.json()) as Record<string, unknown>;
    const reports = normalizeReportPayloads(payload);
    const attachments = Array.isArray(payload.attachments) ? [...payload.attachments] : [];
    const reportAttachments: MailAttachmentServerPayload[] = [];
    let nextBody = payload.body;
    for (const report of reports) {
      const reportAttachment = {
        ...(await deps.buildMailReportAttachment(request, token, {
          originalPdfAvailable: report.originalPdfAvailable,
          originalPdfDownloadPath: report.originalPdfDownloadPath,
          preferredFilename: report.reportFilename,
          reportKey: report.reportKey,
          reportTitle: report.reportTitle,
          reportType: report.reportType,
          reportUpdatedAt: report.reportUpdatedAt,
        })),
        report_key: report.reportKey,
        source: 'report',
      };
      const shouldSendAsDownloadLink = deps.shouldSendReportAsDownloadLink({
        attachments: [...reportAttachments, ...attachments],
        reportAttachment,
      });
      if (shouldSendAsDownloadLink) {
        nextBody = deps.buildOversizeReportFallbackBody({
          accessToken: token,
          body: nextBody,
          reportAttachment,
          reportFilename: report.reportFilename,
          reportKey: report.reportKey,
          reportTitle: report.reportTitle,
          requestUrl: request.url,
        });
        continue;
      }
      reportAttachments.push(await deps.materializeMailAttachmentDownload(reportAttachment));
    }
    const reportKeys = reports.map((report) => report.reportKey);
    const mailPayload = {
      ...payload,
      attachments: [...reportAttachments, ...attachments],
      body: nextBody,
      report_key: reportKeys[0] || normalizeText(payload.report_key),
      report_keys: reportKeys.length ? reportKeys : payload.report_keys,
    };

    try {
      return NextResponse.json(
        deps.mapBackendMailMessage(await deps.sendSafetyMailServer(token, mailPayload, request)),
      );
    } catch (error) {
      if (deps.isOversizeMailAttachmentError(error)) {
        return NextResponse.json(
          deps.mapBackendMailMessage(
            await deps.sendSafetyMailServer(
              token,
              {
                ...mailPayload,
                attachments,
                body: nextBody,
              },
              request,
            ),
          ),
        );
      }
      throw error;
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
