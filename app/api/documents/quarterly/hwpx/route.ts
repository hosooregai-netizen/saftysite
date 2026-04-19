import { NextResponse } from 'next/server';

import { SafetyServerApiError } from '@/server/admin/safetyApiServer';
import {
  buildQuarterlyHwpxDocument,
  createHwpxDownloadResponse,
} from '@/server/documents/quarterly/hwpx';
import { resolveQuarterlyDocumentRequest } from '@/server/documents/quarterly/requestResolver';
import type { GenerateQuarterlyDocumentRequest } from '@/types/documents';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as GenerateQuarterlyDocumentRequest;
    const payload = await resolveQuarterlyDocumentRequest(request, body);
    const document = await buildQuarterlyHwpxDocument(payload.report, payload.site, {
      assetBaseUrl: new URL(request.url).origin,
      selectedSessions: payload.selectedSessions,
      siteSessions: payload.siteSessions,
    });
    return createHwpxDownloadResponse(document);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '문서를 생성하는 중 알 수 없는 오류가 발생했습니다.',
      },
      { status: error instanceof SafetyServerApiError ? error.status : 500 },
    );
  }
}
