import { NextResponse } from 'next/server';
import { openAiChat, resolveOpenAiApiKey } from '@/lib/openai';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface ErpDraftRequestBody {
  documentKind?: string;
  recentDocuments?: Array<{ title?: string; kind?: string; updatedAt?: string | null }>;
  site?: {
    siteName?: string | null;
    address?: string | null;
    managerName?: string | null;
  };
  templates?: Array<{ title?: string; body?: string | null }>;
  unresolvedItems?: Array<string>;
  draftContext?: {
    previousDocument?: {
      title?: string;
      updatedAt?: string | null;
      summaryItems?: string[];
    } | null;
    recentDocuments?: Array<{
      title?: string;
      kind?: string;
      updatedAt?: string | null;
      summaryItems?: string[];
    }>;
    templateItems?: string[];
    unresolvedItems?: string[];
    recentPayload?: Record<string, unknown>;
    unresolvedPayload?: Record<string, unknown>;
    workerSummary?: {
      registeredCount?: number;
      activeCount?: number;
      tradeNames?: string[];
      companyNames?: string[];
      workerNames?: string[];
      employmentBreakdown?: Record<string, number>;
    };
  };
}

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

export async function POST(request: Request): Promise<Response> {
  try {
    if (!resolveOpenAiApiKey()) {
      return NextResponse.json(
        { error: 'OpenAI API 키가 설정되지 않아 AI 초안을 생성할 수 없습니다.' },
        { status: 503 }
      );
    }

    const body = (await request.json()) as ErpDraftRequestBody;
    const documentKind = body.documentKind ?? 'unknown';
    const draftContext = body.draftContext ?? {};
    const legacyTemplates =
      body.templates?.map((item) =>
        [item.title?.trim(), item.body?.trim()].filter(Boolean).join(': ')
      ) ?? [];
    const promptByKind: Record<string, string> = {
      tbm: 'TBM 문서 초안입니다. title은 작업 주제, bullet_items는 위험요인, cautions는 대응 대책으로 맞추세요.',
      hazard_notice:
        '위험 공지 문서 초안입니다. title은 공지 제목, bullet_items는 핵심 안내 항목, cautions는 추가 주의사항으로 맞추세요.',
      safety_education:
        '안전교육 문서 초안입니다. title은 교육명, bullet_items는 교육 아젠다, cautions는 현장 강조 포인트로 맞추세요.',
      safety_work_log:
        '안전 작업일지 초안입니다. bullet_items는 주요 작업, cautions는 당일 이슈와 확인 포인트로 맞추세요.',
      safety_inspection_log:
        '안전 점검일지 초안입니다. bullet_items는 점검 체크 항목, cautions는 조치 필요 항목으로 맞추세요.',
      patrol_inspection_log:
        '순회 점검일지 초안입니다. bullet_items는 순회 체크 항목, cautions는 후속 조치 항목으로 맞추세요.',
    };
    const payload = {
      document_kind: documentKind,
      site: body.site ?? {},
      previous_document: draftContext.previousDocument ?? null,
      recent_documents:
        draftContext.recentDocuments ??
        (body.recentDocuments ?? []).map((item) => ({
          title: item.title,
          kind: item.kind,
          updatedAt: item.updatedAt,
          summaryItems: [],
        })),
      template_items: draftContext.templateItems ?? legacyTemplates,
      unresolved_items: draftContext.unresolvedItems ?? body.unresolvedItems ?? [],
      recent_payload: draftContext.recentPayload ?? {},
      unresolved_payload: draftContext.unresolvedPayload ?? {},
      worker_summary: draftContext.workerSummary ?? {},
    };

    const completion = await openAiChat(
      [
        {
          role: 'system',
          content:
            [
              'You draft concise Korean construction safety ERP documents from existing ERP data.',
              'Use only the supplied context and do not invent site-specific facts.',
              'Return JSON only with keys: title, summary, bullet_items, cautions.',
              'bullet_items and cautions must be arrays of short Korean strings.',
              promptByKind[documentKind] ??
                '문서 종류에 맞는 간결한 한국어 초안을 작성하세요.',
            ].join(' '),
        },
        {
          role: 'user',
          content: [
            '다음 현장 문맥과 기존 ERP 데이터를 바탕으로 새 안전관리 문서 초안을 제안해 주세요.',
            '반드시 JSON만 응답하세요.',
            JSON.stringify(payload),
          ].join('\n\n'),
        },
      ],
      {
        temperature: 0.4,
        maxTokens: 700,
      }
    );

    const parsed = extractJsonObject(completion);
    if (!parsed) {
      return NextResponse.json(
        { error: 'AI 응답을 해석하지 못했습니다. 잠시 후 다시 시도해 주세요.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      title: typeof parsed.title === 'string' ? parsed.title : '',
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      bullet_items: Array.isArray(parsed.bullet_items)
        ? parsed.bullet_items.filter((item): item is string => typeof item === 'string')
        : [],
      cautions: Array.isArray(parsed.cautions)
        ? parsed.cautions.filter((item): item is string => typeof item === 'string')
        : [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'AI 초안 생성 중 알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
