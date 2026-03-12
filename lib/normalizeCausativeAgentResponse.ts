import { createEmptyCausativeAgentMap } from '@/constants/siteOverview';
import type {
  CausativeAgentKey,
  CausativeAgentMap,
  CausativeAgentReport,
} from '@/types/siteOverview';

type UnknownRecord = Record<string, unknown>;

function extractObject(raw: unknown): UnknownRecord {
  if (Array.isArray(raw)) {
    return extractObject(raw[0]);
  }

  if (raw && typeof raw === 'object') {
    const obj = raw as UnknownRecord;
    const nested = obj.data ?? obj.result ?? obj.response;
    if (nested && nested !== raw) {
      return extractObject(nested);
    }
    return obj;
  }

  return {};
}

function normalizeAgents(value: unknown): CausativeAgentMap {
  const normalized = createEmptyCausativeAgentMap();
  if (!value || typeof value !== 'object') return normalized;

  const input = value as UnknownRecord;
  (Object.keys(normalized) as CausativeAgentKey[]).forEach((key) => {
    normalized[key] = Boolean(input[key]);
  });

  return normalized;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function normalizeCausativeAgentResponse(
  raw: unknown,
  uploadedFile?: File
): Promise<CausativeAgentReport> {
  const payload = extractObject(raw);

  return {
    agents: normalizeAgents(payload.agents),
    reasoning:
      typeof payload.reasoning === 'string' ? payload.reasoning.trim() : '',
    photoUrl: uploadedFile ? await fileToDataUrl(uploadedFile) : '',
  };
}
