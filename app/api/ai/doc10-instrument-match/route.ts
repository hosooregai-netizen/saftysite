import { NextResponse } from 'next/server';
import { resolveOpenAiApiKey } from '@/lib/openai';

const OPENAI_CHAT_COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_OPENAI_CHAT_MODEL = 'gpt-4o-mini';

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

function normalizeLooseText(value: string) {
  return value.replace(/[\s"'`()[\]{}:;,.!?/\\_-]+/g, '').toLowerCase();
}

function matchAllowedInstrument(
  value: string,
  allowedInstrumentNames: string[],
) {
  const normalized = normalizeLooseText(value);
  if (!normalized) {
    return '';
  }

  const exactMatch =
    allowedInstrumentNames.find(
      (candidate) => normalizeLooseText(candidate) === normalized,
    ) ?? '';
  if (exactMatch) {
    return exactMatch;
  }

  const includeMatch =
    allowedInstrumentNames.find((candidate) => {
      const normalizedCandidate = normalizeLooseText(candidate);
      return (
        normalizedCandidate.includes(normalized) || normalized.includes(normalizedCandidate)
      );
    }) ?? '';

  return includeMatch;
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
        { error: 'OpenAI API 키가 설정되지 않아 계측장비 AI 매칭을 진행할 수 없습니다.' },
        { status: 503 },
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const allowedInstrumentNamesRaw = formData.get('allowedInstrumentNames');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: '이미지 파일이 필요합니다.' }, { status: 400 });
    }

    const allowedInstrumentNames = (() => {
      if (typeof allowedInstrumentNamesRaw !== 'string') {
        return [] as string[];
      }

      try {
        const parsed = JSON.parse(allowedInstrumentNamesRaw) as unknown;
        return Array.isArray(parsed)
          ? parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
          : [];
      } catch {
        return [] as string[];
      }
    })();

    if (allowedInstrumentNames.length === 0) {
      return NextResponse.json({ error: '매칭할 계측장비 목록이 없습니다.' }, { status: 400 });
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
        temperature: 0.1,
        max_tokens: 120,
        messages: [
          {
            role: 'system',
            content: `
너는 건설현장 기술지도 보고서의 계측점검 사진을 보고 계측장비명을 고르는 한국어 도우미다.

목표:
- 사진에 보이는 계측장비를 allowedInstrumentNames 중 하나로 매칭한다.

규칙:
- 반드시 JSON만 반환한다.
- instrumentName은 반드시 allowedInstrumentNames 중 정확히 하나를 선택한다.
- 설명문, 이유, 번호, 마크다운은 쓰지 않는다.
- allowedInstrumentNames 밖의 새 장비명을 만들어내지 않는다.
- 애매해도 가장 가까운 allowedInstrumentNames 하나를 고른다.
- 일반 스마트폰, 현장 전경, 장비가 불명확한 사진이어도 가장 근접한 계측장비 하나를 고른다.
- 조도 측정기기처럼 화면에 수치가 보이면 조도계 계열 우선 검토
- 소음 측정기기처럼 마이크형/소음계 형태면 소음계 계열 우선 검토
- 가스 측정기기처럼 휴대형 검지기 형태면 가스/산소농도/복합가스 계열 우선 검토

출력 형식:
{
  "instrumentName": "allowedInstrumentNames 중 하나"
}
            `.trim(),
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: [
                  '사진을 보고 아래 목록 중 가장 가까운 계측장비명을 하나만 골라줘.',
                  `allowedInstrumentNames:\n- ${allowedInstrumentNames.join('\n- ')}`,
                  '반드시 JSON만 반환해줘.',
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

    const rawInstrumentName =
      typeof parsed.instrumentName === 'string' ? parsed.instrumentName.trim() : '';
    const instrumentName = matchAllowedInstrument(rawInstrumentName, allowedInstrumentNames);

    if (!instrumentName) {
      return NextResponse.json(
        { error: '허용된 계측장비 목록과 매칭되지 않았습니다.' },
        { status: 502 },
      );
    }

    return NextResponse.json({ instrumentName });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '계측장비 AI 매칭 중 알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}
