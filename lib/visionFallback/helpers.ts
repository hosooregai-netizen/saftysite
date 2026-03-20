import {
  AGENT_KEYS,
  DEFAULT_OPENAI_MODEL,
  OPENAI_API_URL,
} from '@/lib/visionFallback/constants';

function getOpenAiKey(): string {
  return process.env.OPENAI_API_KEY?.trim() ?? '';
}

function getOpenAiModel(): string {
  return process.env.OPENAI_VISION_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
}

async function fileToDataUrl(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = file.type || 'image/jpeg';
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

export function buildHazardFallbackPayload(fileCount: number) {
  return Array.from({ length: Math.max(fileCount, 1) }, () => ({
    metadata: '현장 사진 자동 분석 백엔드에 연결하지 못해 상세 분석을 생성하지 못함.',
    objects: [],
    risk_factor: ['위험요인 자동 분석 실패'],
    improvements: ['- 백엔드 연결 상태 확인 필요'],
    laws: [],
    likelihood: 1,
    severity: 1,
  }));
}

export function buildAgentFallbackPayload() {
  return {
    agents: Object.fromEntries(AGENT_KEYS.map((key) => [key, false])),
    reasoning: '자동 분석 백엔드에 연결하지 못해 12대 기인물 판별을 수행하지 못함.',
  };
}

export async function requestOpenAiJson<T>(
  prompt: string,
  schemaName: string,
  schema: Record<string, unknown>,
  file: File
): Promise<T> {
  const apiKey = getOpenAiKey();
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  const imageUrl = await fileToDataUrl(file);
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: getOpenAiModel(),
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: prompt },
            { type: 'input_image', image_url: imageUrl, detail: 'auto' },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: schemaName,
          strict: true,
          schema,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI fallback request failed (${response.status}): ${errorText}`);
  }

  const json = (await response.json()) as { output_text?: string };
  if (!json.output_text) {
    throw new Error('OpenAI fallback returned no output_text.');
  }

  return JSON.parse(json.output_text) as T;
}
