import { DEFAULT_OPENAI_CHAT_MODEL, OPENAI_CHAT_COMPLETIONS_URL } from '@/lib/openai/constants';

export type OpenAiChatRole = 'system' | 'user' | 'assistant';

export type OpenAiChatMessage = {
  role: OpenAiChatRole;
  content: string;
};

export type OpenAiChatOptions = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
};

type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
  error?: { message?: string; type?: string };
};

/**
 * 브라우저에서는 `NEXT_PUBLIC_OPENAI_API_KEY`만 번들에 포함됩니다.
 * 서버(SSR/API Route)에서 같은 모듈을 쓰면 `OPENAI_API_KEY`도 사용 가능합니다.
 * 나중에 백엔드 프록시로 옮기면 이 함수 대신 서버 전용 키만 쓰면 됩니다.
 */
export function resolveOpenAiApiKey(): string {
  const fromPublic = process.env.NEXT_PUBLIC_OPENAI_API_KEY?.trim();
  if (fromPublic) return fromPublic;
  if (typeof window === 'undefined') {
    return process.env.OPENAI_API_KEY?.trim() ?? '';
  }
  return '';
}

function parseAssistantText(data: ChatCompletionResponse): string {
  const content = data.choices?.[0]?.message?.content;
  if (typeof content === 'string' && content.length > 0) {
    return content;
  }
  if (data.error?.message) {
    throw new Error(data.error.message);
  }
  throw new Error('OpenAI 응답에 assistant 텍스트가 없습니다.');
}

/**
 * Chat Completions API 호출. 브라우저·서버 공용(fetch).
 *
 * @example
 * ```ts
 * const text = await openAiChat([
 *   { role: 'system', content: 'You are a helpful assistant.' },
 *   { role: 'user', content: '안녕' },
 * ]);
 * ```
 */
export async function openAiChat(messages: OpenAiChatMessage[], options: OpenAiChatOptions = {}): Promise<string> {
  const apiKey = resolveOpenAiApiKey();
  if (!apiKey) {
    throw new Error(
      'OpenAI API 키가 없습니다. 클라이언트에서는 .env에 NEXT_PUBLIC_OPENAI_API_KEY를 설정하세요.',
    );
  }

  const { model = DEFAULT_OPENAI_CHAT_MODEL, temperature, maxTokens, signal } = options;

  const body: Record<string, unknown> = {
    model,
    messages,
  };
  if (typeof temperature === 'number') body.temperature = temperature;
  if (typeof maxTokens === 'number') body.max_tokens = maxTokens;

  const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal,
  });

  const raw = await response.text();
  let data: ChatCompletionResponse;
  try {
    data = JSON.parse(raw) as ChatCompletionResponse;
  } catch {
    throw new Error(`OpenAI 응답 파싱 실패 (${response.status}): ${raw.slice(0, 500)}`);
  }

  if (!response.ok) {
    const msg = data.error?.message || raw.slice(0, 500);
    throw new Error(`OpenAI 요청 실패 (${response.status}): ${msg}`);
  }

  return parseAssistantText(data);
}

/** 단일 사용자 메시지에 대한 답변만 필요할 때 */
export async function openAiComplete(userPrompt: string, options: OpenAiChatOptions & { systemPrompt?: string } = {}): Promise<string> {
  const { systemPrompt, ...rest } = options;
  const messages: OpenAiChatMessage[] = [];
  if (systemPrompt?.trim()) {
    messages.push({ role: 'system', content: systemPrompt.trim() });
  }
  messages.push({ role: 'user', content: userPrompt });
  return openAiChat(messages, rest);
}
