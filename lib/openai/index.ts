const OPENAI_CHAT_COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_OPENAI_CHAT_MODEL = 'gpt-4o-mini';
const DEFAULT_OPENAI_TIMEOUT_MS = 30000;

type OpenAiChatRole = 'system' | 'user' | 'assistant';

export interface OpenAiChatMessage {
  role: OpenAiChatRole;
  content: string;
}

export interface OpenAiChatOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  timeoutMs?: number;
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

export function resolveOpenAiApiKey(): string {
  return (
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY_CLIENT?.trim() ||
    ''
  );
}

function resolveOpenAiChatModel(): string {
  return process.env.OPENAI_CHAT_MODEL?.trim() || DEFAULT_OPENAI_CHAT_MODEL;
}

function normalizeAssistantMessageContent(
  content: OpenAiAssistantMessageContent,
): string {
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

async function readOpenAiErrorMessage(response: Response): Promise<string> {
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

export async function openAiChat(
  messages: OpenAiChatMessage[],
  options: OpenAiChatOptions = {},
): Promise<string> {
  const apiKey = resolveOpenAiApiKey();
  if (!apiKey) {
    throw new Error('OpenAI API 키가 설정되지 않았습니다.');
  }

  const abortController = new AbortController();
  const timeoutMs = options.timeoutMs ?? DEFAULT_OPENAI_TIMEOUT_MS;
  const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model ?? resolveOpenAiChatModel(),
        messages,
        temperature: options.temperature ?? 0.4,
        max_tokens: options.maxTokens ?? 700,
      }),
      signal: abortController.signal,
    });
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `OpenAI 요청 중 네트워크 오류가 발생했습니다. ${error.message}`
        : 'OpenAI 요청 중 네트워크 오류가 발생했습니다.',
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(await readOpenAiErrorMessage(response));
  }

  const payload = (await response.json()) as OpenAiChatCompletionResponse;
  const content = normalizeAssistantMessageContent(payload.choices?.[0]?.message?.content);
  if (!content) {
    throw new Error('OpenAI 응답에서 텍스트 콘텐츠를 찾지 못했습니다.');
  }

  return content;
}
