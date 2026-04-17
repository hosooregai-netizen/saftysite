import { NextResponse } from 'next/server';
import {
  buildTechnicalGuidancePhotoDraftUserContent,
  TECHNICAL_GUIDANCE_PHOTO_DRAFT_SYSTEM_PROMPT,
} from '@/lib/openai/technicalGuidancePhotoDraftPrompt';
import { openAiChat, resolveOpenAiApiKey } from '@/lib/openai';
import type { GenerateTechnicalGuidancePhotoDraftInput } from '@/types/legacyTechnicalGuidance';

export const runtime = 'nodejs';
export const maxDuration = 60;

function extractJsonObject(text: string): Record<string, unknown> | null {
  const normalized = text.trim();
  try {
    return JSON.parse(normalized) as Record<string, unknown>;
  } catch {
    const start = normalized.indexOf('{');
    const end = normalized.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    try {
      return JSON.parse(normalized.slice(start, end + 1)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

function asObjectArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object') : [];
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

export async function POST(request: Request): Promise<Response> {
  try {
    if (!resolveOpenAiApiKey()) {
      return NextResponse.json(
        { error: 'OpenAI API 키가 설정되지 않아 사진 기반 초안을 생성할 수 없습니다.' },
        { status: 503 },
      );
    }

    const body = (await request.json()) as GenerateTechnicalGuidancePhotoDraftInput;
    const completion = await openAiChat(
      [
        { role: 'system', content: TECHNICAL_GUIDANCE_PHOTO_DRAFT_SYSTEM_PROMPT },
        { role: 'user', content: buildTechnicalGuidancePhotoDraftUserContent(body) },
      ],
      {
        temperature: 0.25,
        maxTokens: 1400,
      },
    );

    const parsed = extractJsonObject(completion);
    if (!parsed) {
      return NextResponse.json(
        { error: 'AI 응답을 JSON으로 해석하지 못했습니다.' },
        { status: 502 },
      );
    }

    return NextResponse.json({
      doc3Scenes: asObjectArray(parsed.doc3Scenes),
      doc5SummaryHint:
        typeof parsed.doc5SummaryHint === 'string' ? parsed.doc5SummaryHint : '',
      doc7Findings: asObjectArray(parsed.doc7Findings),
      doc10Measurements: asObjectArray(parsed.doc10Measurements),
      doc11EducationRecords: asObjectArray(parsed.doc11EducationRecords),
      doc12Activities: asObjectArray(parsed.doc12Activities),
      reviewChecklist: asStringArray(parsed.reviewChecklist),
      lowConfidenceFields: asStringArray(parsed.lowConfidenceFields),
      warnings: asStringArray(parsed.warnings),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '사진 기반 초안 생성 중 알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}
