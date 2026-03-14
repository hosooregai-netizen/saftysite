import { NextResponse } from 'next/server';
import { normalizeInspectionSession } from '@/constants/inspectionSession';
import type { GenerateInspectionWordRequest } from '@/types/documents';
import {
  DocumentGenerationError,
  DocumentTemplateNotFoundError,
} from '@/server/documents/errors';
import { generateInspectionWordDocument } from '@/server/documents/generators/generateInspectionWordDocument';
import { mapInspectionSessionToWordData } from '@/server/documents/mappers/mapInspectionSessionToWordData';

export const runtime = 'nodejs';

function createContentDisposition(filename: string): string {
  const asciiFallback =
    filename
      .normalize('NFKD')
      .replace(/[^\x20-\x7e]/g, '')
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() || 'inspection-report.docx';

  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(
    filename
  )}`;
}

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

    return new Response(new Uint8Array(document.buffer), {
      headers: {
        'Content-Type': document.contentType,
        'Content-Disposition': createContentDisposition(document.filename),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    if (error instanceof DocumentTemplateNotFoundError) {
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
