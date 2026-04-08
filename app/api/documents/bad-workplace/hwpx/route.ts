import { NextResponse } from 'next/server';

import { SafetyServerApiError } from '@/server/admin/safetyApiServer';
import {
  buildBadWorkplaceHwpxDocument,
  createHwpxDownloadResponse,
} from '@/server/documents/badWorkplace/hwpx';
import { resolveBadWorkplaceDocumentRequest } from '@/server/documents/badWorkplace/requestResolver';
import type { GenerateBadWorkplaceDocumentRequest } from '@/types/documents';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as GenerateBadWorkplaceDocumentRequest;
    const payload = await resolveBadWorkplaceDocumentRequest(request, body);
    const document = await buildBadWorkplaceHwpxDocument(payload.report, payload.site);
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
