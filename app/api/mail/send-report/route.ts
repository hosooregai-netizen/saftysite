import { NextResponse } from 'next/server';
import {
  readRequiredAdminToken,
  SafetyServerApiError,
  sendSafetyMailServer,
} from '@/server/admin/safetyApiServer';
import { mapBackendMailMessage } from '@/server/admin/upstreamMappers';
import { buildMailReportAttachment } from '@/server/mail/reportAttachment';

export const runtime = 'nodejs';
export const maxDuration = 300;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
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
    });
    const attachments = Array.isArray(payload.attachments) ? payload.attachments : [];

    return NextResponse.json(
      mapBackendMailMessage(
        await sendSafetyMailServer(
          token,
          {
            ...payload,
            attachments: [reportAttachment, ...attachments],
            report_key: reportKey || normalizeText(payload.report_key),
          },
          request,
        ),
      ),
    );
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
