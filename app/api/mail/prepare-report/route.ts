import { NextResponse } from 'next/server';
import {
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { prepareGeneratedMailReportPdf } from '@/server/mail/reportAttachment';

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
    const result = await prepareGeneratedMailReportPdf(request, token, {
      originalPdfAvailable:
        report.original_pdf_available === true || payload.original_pdf_available === true,
      reportKey,
      reportType: normalizeText(report.report_type) || normalizeText(payload.report_type),
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '보고서 PDF 캐시 준비에 실패했습니다.' },
      { status: 500 },
    );
  }
}
