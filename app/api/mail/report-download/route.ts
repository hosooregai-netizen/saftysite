import { NextResponse } from 'next/server';
import { fetchAdminOriginalPdfDocument } from '@/server/admin/originalPdfDocument';
import { SafetyServerApiError } from '@/server/admin/safetyApiServer';
import {
  readMailReportDownloadToken,
  resolveMailReportDownloadAccessToken,
} from '@/server/mail/reportDownloadLink';

export const runtime = 'nodejs';
export const maxDuration = 300;

function encodeAttachmentName(value: string) {
  return `attachment; filename*=UTF-8''${encodeURIComponent(value)}`;
}

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token')?.trim() || '';
    if (!token) {
      return NextResponse.json({ error: '다운로드 링크 토큰이 없습니다.' }, { status: 400 });
    }

    const payload = readMailReportDownloadToken(token);
    const accessToken = await resolveMailReportDownloadAccessToken(payload);
    const document = await fetchAdminOriginalPdfDocument({
      reportKey: payload.reportKey,
      request,
      token: accessToken,
    });

    return new Response(new Uint8Array(document.buffer), {
      headers: {
        'Cache-Control': 'private, no-store, max-age=0',
        'Content-Disposition': encodeAttachmentName(document.filename || payload.filename),
        'Content-Type': document.contentType,
      },
      status: 200,
    });
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : '외부 보고서 다운로드 링크를 처리하지 못했습니다.',
      },
      { status: 400 },
    );
  }
}
