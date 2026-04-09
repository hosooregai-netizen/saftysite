import { NextResponse } from 'next/server';
import { resolveOpenAiApiKey } from '@/lib/openai';

const OPENAI_CHAT_COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_OPENAI_CHAT_MODEL = 'gpt-4o-mini';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface Doc11EducationContentRequestBody {
  topic?: string;
  attendeeCount?: string;
  materialName?: string;
  photoUrl?: string;
}

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

function readJsonString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeCount(value: string) {
  const digits = value.replace(/[^\d]/g, '').trim();
  return digits || value.trim();
}

function normalizeShortLine(value: string, prefix: string) {
  const cleaned = value
    .replace(/\r\n/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(new RegExp(`^${prefix}\\s*[:：-]?\\s*`), '')
    .trim();

  return cleaned;
}

function sanitizeTopicLine(value: string, fallbackTopic: string) {
  const cleaned = normalizeShortLine(value, '-');
  const text = cleaned || fallbackTopic || '안전교육';
  const withoutLeadingDash = text.replace(/^-+/, '').trim();
  return `-${withoutLeadingDash}`;
}

function sanitizeDetailLine(value: string, label: string, fallback: string) {
  const cleaned = normalizeShortLine(value, label);
  return `-${label} : ${cleaned || fallback}`;
}

function normalizePhotoUrl(photoUrl: string, requestUrl: string) {
  const trimmed = photoUrl.trim();
  if (!trimmed) {
    return '';
  }

  if (/^data:image\//i.test(trimmed)) {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    const requestBase = new URL(requestUrl);
    return new URL(trimmed, `${requestBase.protocol}//${requestBase.host}`).toString();
  }

  return '';
}

async function resolvePhotoDataUrl(photoUrl: string, request: Request) {
  if (!photoUrl) {
    return '';
  }

  if (/^data:image\//i.test(photoUrl)) {
    return photoUrl;
  }

  try {
    const headers = new Headers();
    const cookie = request.headers.get('cookie');
    const authorization = request.headers.get('authorization');

    if (cookie) {
      headers.set('cookie', cookie);
    }
    if (authorization) {
      headers.set('authorization', authorization);
    }

    const response = await fetch(photoUrl, {
      cache: 'no-store',
      headers,
    });

    if (!response.ok) {
      return '';
    }

    const contentType = response.headers.get('content-type')?.trim() || 'image/jpeg';
    if (!/^image\//i.test(contentType)) {
      return '';
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    return `data:${contentType};base64,${bytes.toString('base64')}`;
  } catch {
    return '';
  }
}

function buildUserContent(payload: {
  topic: string;
  attendeeCount: string;
  materialName: string;
}) {
  const lines = ['아래 정보를 바탕으로 안전교육 내용을 작성해줘.'];

  if (payload.topic) lines.push(`교육주제: ${payload.topic}`);
  if (payload.attendeeCount) lines.push(`참석인원: ${payload.attendeeCount}`);
  if (payload.materialName) lines.push(`교육자료명: ${payload.materialName}`);

  lines.push('출력은 5줄 구조를 유지하고, 누락된 정보는 자연스럽게 생략해줘.');
  lines.push('"미입력", "자료 없음" 같은 표현은 쓰지 말아줘.');

  return lines.join('\n');
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
        { error: 'OpenAI API 키가 설정되지 않아 교육내용 AI 생성을 진행할 수 없습니다.' },
        { status: 503 },
      );
    }

    const body = (await request.json()) as Doc11EducationContentRequestBody;
    const normalizedPhotoUrl = normalizePhotoUrl(body.photoUrl?.trim() || '', request.url);
    const payload = {
      topic: body.topic?.trim() || '',
      attendeeCount: body.attendeeCount?.trim() || '',
      materialName: body.materialName?.trim() || '',
      photoUrl: await resolvePhotoDataUrl(normalizedPhotoUrl, request),
    };

    const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_CHAT_MODEL?.trim() || DEFAULT_OPENAI_CHAT_MODEL,
        temperature: 0.3,
        max_tokens: 360,
        messages: [
          {
            role: 'system',
            content: `
너는 건설현장 기술지도 보고서의 안전교육 내용을 작성하는 한국어 안전전문가다.

반드시 아래 JSON 형식만 반환한다.
{
  "attendeeLine": "참석인원 : N 명",
  "topicLine": "-교육주제 또는 주의 문구",
  "riskLine": "-주요위험요인 : ...",
  "measureLine": "-안전대책 : ...",
  "caseLine": "-사고사례 및 예방대책 : ..."
}

작성 규칙:
- 참석인원은 "참석인원 : 숫자 명" 형식으로 쓴다.
- topicLine은 반드시 하이픈(-)으로 시작한다.
- riskLine은 주요 위험요인을 쉼표로 구분한 짧은 구문으로 쓴다.
- measureLine은 안전대책을 쉼표로 구분한 짧은 구문으로 쓴다.
- caseLine은 구체적인 사고상황과 예방대책을 1문장으로 같이 쓴다.
- 보고서에 바로 붙일 수 있는 문체로 작성한다.
- "미입력", "자료 없음" 같은 표현을 쓰지 않는다.
- 이미지가 있으면 이미지에 보이는 교육 장면이나 위험요인을 반영한다.
- 교육주제가 추락이면 추락 관련 위험요인과 대책을 우선 반영한다.
- JSON 외 다른 텍스트는 출력하지 않는다.
            `.trim(),
          },
          {
            role: 'user',
            content: payload.photoUrl
              ? [
                  {
                    type: 'text',
                    text: buildUserContent(payload),
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: payload.photoUrl,
                    },
                  },
                ]
              : buildUserContent(payload),
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

    const result = (await response.json()) as OpenAiChatCompletionResponse;
    const content = normalizeAssistantMessageContent(result.choices?.[0]?.message?.content);
    const parsed = extractJsonObject(content);
    if (!parsed) {
      return NextResponse.json(
        { error: 'AI 교육내용 응답을 해석하지 못했습니다. 다시 시도해 주세요.' },
        { status: 502 },
      );
    }

    const attendeeCount = normalizeCount(payload.attendeeCount) || '2';
    const attendeeLine = `참석인원 : ${attendeeCount} 명`;
    const topicLine = sanitizeTopicLine(
      readJsonString(parsed, 'topicLine'),
      payload.topic || '안전교육',
    );
    const riskLine = sanitizeDetailLine(
      readJsonString(parsed, 'riskLine'),
      '주요위험요인',
      '작업 전 위험요인 공유 미흡, 보호구 착용 미흡, 작업환경 점검 부족',
    );
    const measureLine = sanitizeDetailLine(
      readJsonString(parsed, 'measureLine'),
      '안전대책',
      '작업 전 점검, 보호구 착용, 작업구간 안전조치 확인',
    );
    const caseLine = sanitizeDetailLine(
      readJsonString(parsed, 'caseLine'),
      '사고사례 및 예방대책',
      '작업 전 위험요인 공유가 부족한 상태에서 사고가 발생할 수 있으므로, 작업 시작 전 핵심 위험요인과 예방대책을 충분히 전달할 것.',
    );

    return NextResponse.json({
      text: [attendeeLine, topicLine, riskLine, measureLine, caseLine].join('\n'),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '교육내용 AI 생성 중 알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}
