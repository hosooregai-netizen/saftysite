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

function sanitizeSceneTitle(text: string) {
  const normalized = text
    .trim()
    .replace(/^["'`\s]+|["'`\s]+$/g, '')
    .replace(/^공정명\s*[:：-]?\s*/i, '')
    .replace(/^주요\s*공정\s*[:：-]?\s*/i, '')
    .split(/\r?\n/)[0]
    .trim();

  const directMatch = normalized.match(
    /[가-힣A-Za-z0-9()]+(?:\s*[·,/]\s*[가-힣A-Za-z0-9()]+)?\s*작업/,
  );
  if (directMatch) {
    return directMatch[0].replace(/\s+/g, '');
  }

  return normalized.replace(/\s+/g, '').slice(0, 24);
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

const SCENE_TITLE_SYSTEM_PROMPT = `
너는 건설현장 기술지도 보고서의 "주요 진행공정" 칸에 들어갈 공정명 하나만 고르는 한국어 도우미다.

목표:
- 사진을 보고 가장 대표적인 공정명 1개만 반환한다.
- 설명문이 아니라 공정명 라벨만 반환한다.

반드시 지킬 규칙:
- 한국어 공정명 1개만 출력한다.
- 가능하면 반드시 "작업"으로 끝낸다.
- 문장, 설명, 번호, 부연설명, 따옴표, 마침표를 쓰지 않는다.
- 여러 공정이 보여도 가장 대표적인 1개만 고른다.
- 애매하더라도 사진에서 가장 직접적으로 보이는 행위를 기준으로 고른다.

중요:
- "설치작업"은 패널, 배관, 덕트, 설비, 자재를 실제로 조립·부착·고정하는 장면이 명확할 때만 사용한다.
- 공정이 애매하다는 이유로 설치작업을 기본값처럼 사용하면 안 된다.
- 철거, 도장, 굴착, 금속, 용접, 방수, 청소, 정리, 미장, 창호, 철근배근, 포장, 벌목, 보수처럼 더 직접적인 공정이 보이면 그 공정을 우선 선택한다.

우선 선택 후보:
- 철거작업
- 굴착작업
- 도장작업
- 방수작업
- 금속작업
- 용접작업
- 창호작업
- 미장작업
- 철근배근작업
- 콘크리트타설작업
- 비계작업
- 포장작업
- 벌목작업
- 청소작업
- 정리작업
- 보수작업
- 전기작업
- 배관작업
- 설비작업
- 설치작업

선택 힌트:
- 벽체 해체, 바닥 철거, 폐기물 반출, 브레이커 사용이 보이면 철거작업
- 굴착기, 토사, 되메우기, 터파기, 덤프트럭이 보이면 굴착작업
- 롤러, 다짐, 아스팔트, 포장면 정비가 보이면 포장작업
- 페인트, 롤러, 스프레이, 도색면 작업이 보이면 도장작업
- 토치, 용접 불꽃, 용접면, 절단 불티가 보이면 용접작업 또는 금속작업
- 금속 프레임, 철제 가공, 연삭, 절단이 중심이면 금속작업
- 방수시트, 우레탄, 도막, 방수재가 중심이면 방수작업
- 창틀, 유리, 샷시 시공이 보이면 창호작업
- 몰탈, 미장흙, 벽면 바름이 중심이면 미장작업
- 철근 배치, 철근 결속, 배근이 보이면 철근배근작업
- 청소도구, 폐기물 정리, 마감 정돈이 중심이면 청소작업 또는 정리작업
- 균열보수, 시설보수, 보강이 중심이면 보수작업
- 전선, 분전함, 케이블 결선이 중심이면 전기작업
- 배관 연결, 배관 설치, 용접 배관이 중심이면 배관작업
- 기계, 덕트, 설비 부착과 조립이 중심이면 설비작업 또는 설치작업

좋은 출력 예시:
- 철거작업
- 굴착작업
- 도장작업
- 금속작업
- 용접작업
- 방수작업
- 창호작업
- 청소작업

나쁜 출력 예시:
- 이 사진은 철거작업으로 보입니다
- 주요 공정: 설치작업
- 작업자들이 설치작업을 하고 있음
`.trim();

export async function POST(request: Request): Promise<Response> {
  try {
    const apiKey = resolveOpenAiApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API 키가 설정되지 않아 공정명을 생성할 수 없습니다.' },
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
        temperature: 0.1,
        max_tokens: 60,
        messages: [
          {
            role: 'system',
            content: SCENE_TITLE_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: '사진에서 가장 대표적인 공정명 1개만 골라서 답해줘.',
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
    const title = sanitizeSceneTitle(content);

    if (!title) {
      return NextResponse.json(
        { error: 'AI가 공정명을 생성하지 못했습니다.' },
        { status: 502 },
      );
    }

    return NextResponse.json({ title });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '공정명 AI 생성 중 알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}
