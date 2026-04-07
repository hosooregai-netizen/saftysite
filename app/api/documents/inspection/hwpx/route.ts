import { NextResponse } from 'next/server';

import { SafetyServerApiError } from '@/server/admin/safetyApiServer';
import {
  buildInspectionHwpxDocument,
  createInspectionHwpxDownloadResponse,
} from '@/server/documents/inspection/hwpx';
import { resolveInspectionDocumentRequest } from '@/server/documents/inspection/requestResolver';
import type { GenerateInspectionDocumentRequest } from '@/types/documents';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as GenerateInspectionDocumentRequest;
    const payload = await resolveInspectionDocumentRequest(request, body);
    const document = await buildInspectionHwpxDocument(payload.session, payload.siteSessions, {
      assetBaseUrl: new URL(request.url).origin,
    });
    return createInspectionHwpxDownloadResponse(document);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '기술지도 HWPX 문서를 생성하는 중 알 수 없는 오류가 발생했습니다.',
      },
      { status: error instanceof SafetyServerApiError ? error.status : 500 },
    );
  }
}
