import { NextResponse } from 'next/server';
import {
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { fetchAdminOriginalPdfDocument } from '@/server/admin/originalPdfDocument';
import { normalizeOriginalPdfRouteReportKey } from '@/server/admin/originalPdfRouteHelpers';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  context: { params: Promise<{ reportKey: string }> },
): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const params = await context.params;
    const reportKey = normalizeOriginalPdfRouteReportKey(params.reportKey);
    const document = await fetchAdminOriginalPdfDocument({
      reportKey,
      request,
      token,
    });

    return new Response(new Uint8Array(document.buffer), {
      headers: {
        'Content-Disposition': document.contentDisposition,
        'Content-Type': document.contentType,
        'X-Original-Pdf-Source': document.source,
      },
      status: 200,
    });
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '원본 PDF 다운로드에 실패했습니다.',
      },
      { status: 500 },
    );
  }
}
