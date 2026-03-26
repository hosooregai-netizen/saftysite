import {
  AGENT_CHECK_PROMPT,
  AGENT_KEYS,
  VISION_PROMPT,
} from '@/lib/visionFallback/constants';
import {
  buildAgentFallbackPayload,
  buildHazardFallbackPayload,
  requestOpenAiJson,
} from '@/lib/visionFallback/helpers';

export async function analyzeHazardFiles(files: File[]): Promise<unknown> {
  const schema = {
    type: 'object',
    additionalProperties: false,
    required: [
      'metadata',
      'objects',
      'risk_factor',
      'improvements',
      'laws',
      'likelihood',
      'severity',
    ],
    properties: {
      metadata: { type: 'string' },
      objects: { type: 'array', items: { type: 'string' } },
      risk_factor: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 1 },
      improvements: { type: 'array', items: { type: 'string' } },
      laws: { type: 'array', items: { type: 'string' } },
      likelihood: { type: 'integer', minimum: 1, maximum: 3 },
      severity: { type: 'integer', minimum: 1, maximum: 3 },
    },
  };

  try {
    return await Promise.all(
      files.map((file) =>
        requestOpenAiJson<Record<string, unknown>>(
          VISION_PROMPT,
          'hazard_analysis',
          schema,
          file
        )
      )
    );
  } catch {
    return buildHazardFallbackPayload(files.length);
  }
}

export async function analyzeAgentFile(file: File): Promise<unknown> {
  const schema = {
    type: 'object',
    additionalProperties: false,
    required: ['agents', 'reasoning'],
    properties: {
      agents: {
        type: 'object',
        additionalProperties: false,
        required: [...AGENT_KEYS],
        properties: Object.fromEntries(AGENT_KEYS.map((key) => [key, { type: 'boolean' }])),
      },
      reasoning: { type: 'string' },
    },
  };

  try {
    return await requestOpenAiJson<Record<string, unknown>>(
      AGENT_CHECK_PROMPT,
      'agent_check',
      schema,
      file
    );
  } catch {
    return buildAgentFallbackPayload();
  }
}

