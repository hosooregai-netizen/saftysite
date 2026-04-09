import { NextResponse } from 'next/server';
import {
  ACCIDENT_TYPE_OPTIONS,
  CAUSATIVE_AGENT_LABELS,
  CAUSATIVE_AGENT_OPTIONS,
  normalizeDoc7CausativeAgentKey,
} from '@/constants/inspectionSession/doc7Catalog';
import type { CausativeAgentKey } from '@/types/siteOverview';
import { resolveOpenAiApiKey } from '@/lib/openai';

const OPENAI_CHAT_COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_OPENAI_CHAT_MODEL = 'gpt-4o-mini';
const RISK_LEVEL_OPTIONS = ['상', '중', '하'] as const;

export const runtime = 'nodejs';
export const maxDuration = 60;

interface OpenAiChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: OpenAiAssistantMessageContent;
    };
  }>;
  error?: {
    message?: string;
  };
}

type OpenAiAssistantMessageContent =
  | string
  | Array<{
      type?: string;
      text?: string;
    }>
  | undefined;

interface Doc7FindingResponse {
  location?: string;
  accidentType?: string;
  riskLevel?: string;
  causativeAgentKey?: string;
  hazardDescription?: string;
  improvementRequest?: string;
}

function normalizeAssistantMessageContent(content: OpenAiAssistantMessageContent) {
  if (typeof content === 'string') {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .join('\n')
      .trim();
  }

  return '';
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

function readJsonString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeLooseText(value: string) {
  return value.replace(/[\s"'`()[\]{}:;,.!?/\\_-]+/g, '').toLowerCase();
}

function normalizeLocation(value: string) {
  const cleaned = value
    .replace(/^장소\s*[:：-]?\s*/i, '')
    .replace(/^위치\s*[:：-]?\s*/i, '')
    .replace(/현장|사진|구역|작업중|작업|상태|모습/gi, ' ')
    .replace(/[,:/|()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const tokens = cleaned.split(' ').filter(Boolean);
  if (tokens.length === 0) {
    return '작업구간';
  }

  return tokens[0].slice(0, 12);
}

const accidentTypeMap = new Map<string, string>();

ACCIDENT_TYPE_OPTIONS.forEach((option) => {
  accidentTypeMap.set(normalizeLooseText(option), option);
});

[
  ['추락', '떨어짐'],
  ['낙상', '떨어짐'],
  ['넘어짐', '넘어짐'],
  ['전도', '넘어짐'],
  ['미끄러짐', '넘어짐'],
  ['깔림', '깔림/뒤집힘'],
  ['압착', '깔림/뒤집힘'],
  ['뒤집힘', '깔림/뒤집힘'],
  ['충돌', '부딪힘'],
  ['맞음', '물체에 맞음'],
  ['낙하', '물체에 맞음'],
  ['붕괴', '무너짐'],
  ['베임', '절단/베임/찔림'],
  ['절단', '절단/베임/찔림'],
  ['찔림', '절단/베임/찔림'],
  ['화재', '화재/폭발'],
  ['폭발', '화재/폭발'],
  ['질식', '산소결핍'],
  ['감전', '감전'],
  ['교통', '교통사고'],
  ['근골격계', '불균형 및 무리한 동작'],
  ['직업병', '업무상 질병'],
  ['질병', '업무상 질병'],
  ['기타', '기타'],
].forEach(([alias, normalized]) => {
  accidentTypeMap.set(normalizeLooseText(alias), normalized);
});

function normalizeAccidentType(value: string) {
  return accidentTypeMap.get(normalizeLooseText(value)) || '기타';
}

function normalizeRiskLevel(value: string) {
  const normalized = value.trim();
  if (RISK_LEVEL_OPTIONS.includes(normalized as (typeof RISK_LEVEL_OPTIONS)[number])) {
    return normalized;
  }

  if (/상|높/.test(normalized)) return '상';
  if (/중|보통/.test(normalized)) return '중';
  if (/하|낮/.test(normalized)) return '하';
  return '중';
}

const causativeKeyMap = new Map<string, CausativeAgentKey>();

CAUSATIVE_AGENT_OPTIONS.forEach((option) => {
  causativeKeyMap.set(normalizeLooseText(option.key), option.key);
  causativeKeyMap.set(normalizeLooseText(CAUSATIVE_AGENT_LABELS[option.key] ?? option.label), option.key);
  causativeKeyMap.set(normalizeLooseText(option.label), option.key);
});

function normalizeCausativeKey(value: string) {
  const exact = causativeKeyMap.get(normalizeLooseText(value));
  if (exact) {
    return normalizeDoc7CausativeAgentKey(exact) as CausativeAgentKey;
  }

  const normalizedLegacy = normalizeDoc7CausativeAgentKey(value);
  if (normalizedLegacy) {
    return normalizedLegacy as CausativeAgentKey;
  }

  return 'other_causative' as CausativeAgentKey;
}

function normalizeHazardDescription(value: string, accidentType: string) {
  const cleaned = value
    .replace(/^유해위험요인\s*[:：-]?\s*/i, '')
    .replace(/\r\n/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .split(/[.!?]/)[0]
    .trim();

  if (cleaned) {
    return cleaned.slice(0, 80);
  }

  if (accidentType === '떨어짐') return '작업 중 추락 위험';
  if (accidentType === '감전') return '노출 배선 접촉으로 인한 감전 위험';
  if (accidentType === '화재/폭발') return '불티 및 가연물 접촉으로 인한 화재 위험';
  if (accidentType === '절단/베임/찔림') return '공구 사용 중 절단 및 베임 위험';
  return '사진 기준 주요 안전조치 미흡 위험';
}

function defaultImprovementSecondSentence(accidentType: string) {
  if (accidentType === '떨어짐') {
    return '작업 전 안전난간과 작업발판 상태를 확인할 것.';
  }
  if (accidentType === '감전') {
    return '작업 전 전원 차단과 배선 상태를 확인할 것.';
  }
  if (accidentType === '화재/폭발') {
    return '작업 전 가연물 제거와 소화기 비치 상태를 확인할 것.';
  }
  if (accidentType === '절단/베임/찔림') {
    return '작업 전 방호장치와 공구 상태를 확인할 것.';
  }

  return '작업 전 안전조치와 보호구 착용 상태를 확인할 것.';
}

function normalizeImprovementRequest(value: string, accidentType: string) {
  const cleaned = value
    .replace(/^개선\s*요구\s*사항\s*[:：-]?\s*/i, '')
    .replace(/^개선\s*요구사항\s*[:：-]?\s*/i, '')
    .replace(/\r\n/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const rawSentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const sentences = rawSentences.slice(0, 2);

  if (sentences.length === 0) {
    sentences.push('해당 위험요인 주변 안전조치를 보강할 것.');
  }
  if (sentences.length === 1) {
    sentences.push(defaultImprovementSecondSentence(accidentType));
  }

  return sentences
    .map((sentence) => {
      const trimmed = sentence.replace(/[.!?]+$/g, '').trim();
      if (/것$/.test(trimmed)) {
        return `${trimmed}.`;
      }
      return `${trimmed} 것.`;
    })
    .join(' ')
    .slice(0, 140);
}

function buildAllowedCausativeAgentLines() {
  return CAUSATIVE_AGENT_OPTIONS.map((option) => {
    const label = CAUSATIVE_AGENT_LABELS[option.key] ?? option.label;
    return `- ${option.key}: ${label}`;
  }).join('\n');
}

async function readOpenAiErrorMessage(response: Response) {
  const text = await response.text();
  if (!text) {
    return `OpenAI 요청이 실패했습니다 (${response.status}).`;
  }

  try {
    const payload = JSON.parse(text) as OpenAiChatCompletionResponse;
    return payload.error?.message?.trim() || text;
  } catch {
    return text;
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const apiKey = resolveOpenAiApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API 키가 설정되지 않아 문서7 자동 채우기를 실행할 수 없습니다.' },
        { status: 503 },
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: '이미지 파일이 필요합니다.' }, { status: 400 });
    }

    const mimeType = file.type || 'image/jpeg';
    const bytes = Buffer.from(await file.arrayBuffer());
    const dataUrl = `data:${mimeType};base64,${bytes.toString('base64')}`;

    const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_CHAT_MODEL?.trim() || DEFAULT_OPENAI_CHAT_MODEL,
        temperature: 0.2,
        max_tokens: 260,
        messages: [
          {
            role: 'system',
            content: `
너는 건설현장 기술지도 보고서 문서7(현존 유해·위험요인 세부 지적)을 작성하는 한국어 안전전문가다.

사진 1장을 보고 아래 6개 항목만 JSON으로 반환한다.
- location
- accidentType
- riskLevel
- causativeAgentKey
- hazardDescription
- improvementRequest

중요 규칙:
- 반드시 JSON만 반환한다.
- location은 반드시 한 단어의 매우 짧은 장소명만 작성한다.
- location에는 조사, 설명문, 문장형 표현을 넣지 않는다.
- location 예시: 개구부, 단부, 비계, 사다리, 작업발판, 전선, 굴착기
- accidentType은 반드시 제공된 allowedAccidentTypes 중 하나만 선택한다.
- riskLevel은 반드시 제공된 allowedRiskLevels 중 하나만 선택한다.
- causativeAgentKey는 반드시 제공된 allowedCausativeAgents의 key 중 하나만 선택한다.
- hazardDescription은 사진을 근거로 한 한 문장만 작성한다.
- improvementRequest는 정확히 2문장으로 작성한다.
- improvementRequest는 시정조치와 예방조치 위주로 짧게 쓴다.
- 중점관리 위험요인 및 관리대책, 관계 법령, 참고자료는 생성하지 않는다.
- 없는 내용을 지어내지 않는다.
- 애매하면 가장 가까운 선택지 하나를 고른다.
- "~입니다" 같은 설명형 종결은 쓰지 않는다.
- hazardDescription은 짧고 직접적으로 쓴다.
- improvementRequest는 "~할 것." 문체를 우선 사용한다.

판단 우선순위:
- 개구부, 단부, 비계, 사다리, 고소작업대, 작업발판이 보이면 떨어짐 계열 우선 검토
- 굴착기, 차량, 트럭, 중장비가 보이면 부딪힘/깔림 계열 우선 검토
- 연삭기, 절단기, 전동공구가 보이면 절단/베임/찔림 계열 우선 검토
- 용접, 불티, 가연물이 보이면 화재/폭발 계열 우선 검토
- 전선, 충전, 배선 노출이 보이면 감전 계열 우선 검토
            `.trim(),
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: [
                  '아래 선택지 안에서만 문서7 자동작성 JSON을 생성해줘.',
                  `allowedAccidentTypes:\n- ${ACCIDENT_TYPE_OPTIONS.join('\n- ')}`,
                  `allowedRiskLevels:\n- ${RISK_LEVEL_OPTIONS.join('\n- ')}`,
                  `allowedCausativeAgents:\n${buildAllowedCausativeAgentLines()}`,
                  '조건:',
                  '- location은 반드시 한 단어',
                  '- location 예시: 개구부, 단부, 비계, 사다리',
                  '- hazardDescription은 한 문장',
                  '- improvementRequest는 두 문장',
                  '- JSON 외 텍스트 금지',
                ].join('\n'),
              },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: await readOpenAiErrorMessage(response) },
        { status: response.status },
      );
    }

    const payload = (await response.json()) as OpenAiChatCompletionResponse;
    const content = normalizeAssistantMessageContent(payload.choices?.[0]?.message?.content);
    const parsed = extractJsonObject(content);
    if (!parsed) {
      return NextResponse.json(
        { error: 'AI 응답을 해석하지 못했습니다. 다시 시도해 주세요.' },
        { status: 502 },
      );
    }

    const accidentType = normalizeAccidentType(readJsonString(parsed, 'accidentType'));
    const riskLevel = normalizeRiskLevel(readJsonString(parsed, 'riskLevel'));
    const causativeAgentKey = normalizeCausativeKey(readJsonString(parsed, 'causativeAgentKey'));
    const location = normalizeLocation(readJsonString(parsed, 'location'));
    const hazardDescription = normalizeHazardDescription(
      readJsonString(parsed, 'hazardDescription'),
      accidentType,
    );
    const improvementRequest = normalizeImprovementRequest(
      readJsonString(parsed, 'improvementRequest'),
      accidentType,
    );

    return NextResponse.json({
      location,
      accidentType,
      riskLevel,
      causativeAgentKey,
      hazardDescription,
      improvementRequest,
    } satisfies Doc7FindingResponse);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '문서7 AI 생성 중 알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}
