import { NextResponse } from 'next/server';
import { normalizeInspectionSession } from '@/constants/inspectionSession';
import type { GenerateInspectionWordRequest } from '@/types/documents';
import {
  DocumentGenerationError,
  DocumentGeneratorNotConfiguredError,
  DocumentTemplateNotFoundError,
} from '@/server/documents/errors';
import { generateInspectionWordDocument } from '@/server/documents/generators/generateInspectionWordDocument';
import { mapInspectionSessionToWordData } from '@/server/documents/mappers/mapInspectionSessionToWordData';

export const runtime = 'nodejs';

function isGenerateInspectionWordRequest(
  value: unknown
): value is GenerateInspectionWordRequest {
  if (!value || typeof value !== 'object') return false;

  const session = (value as GenerateInspectionWordRequest).session;
  return Boolean(session && typeof session === 'object' && 'id' in session);
}

export async function POST(request: Request): Promise<Response> {
  try {
    const payload = (await request.json()) as unknown;

    if (!isGenerateInspectionWordRequest(payload)) {
      return NextResponse.json(
        { error: '문서 생성 요청 형식이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    const session = normalizeInspectionSession(payload.session);
    const data = mapInspectionSessionToWordData(session);
    const document = await generateInspectionWordDocument({
      templateId: payload.templateId,
      data,
    });

    return new Response(document.buffer, {
      headers: {
        'Content-Type': document.contentType,
        'Content-Disposition': `attachment; filename="${document.filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    if (
      error instanceof DocumentTemplateNotFoundError ||
      error instanceof DocumentGeneratorNotConfiguredError
    ) {
      return NextResponse.json({ error: error.message }, { status: 501 });
    }

    if (error instanceof DocumentGenerationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: '워드 문서 생성 중 알 수 없는 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

