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
    const nested =
      obj.data ??
      obj.result ??
      obj.response ??
      obj.item ??
      obj.payload;
    if (nested && nested !== raw) {
      return extractObject(nested);
    }
    return obj;
  }

  return {};
}

function normalizeKey(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/[\s_\-.,·/()[\]]+/g, '')
    .toLowerCase();
}

function coerceBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'y', 'yes', 'checked'].includes(normalized)) return true;
    if (['false', '0', 'n', 'no', 'unchecked', ''].includes(normalized)) {
      return false;
    }
  }

  return Boolean(value);
}

function normalizeAgents(value: unknown): CausativeAgentMap {
  const normalized = createEmptyCausativeAgentMap();
  if (!value || typeof value !== 'object') return normalized;

  const input = value as UnknownRecord;
  const keyMap = new Map<string, CausativeAgentKey>();

  (Object.keys(normalized) as CausativeAgentKey[]).forEach((key) => {
    keyMap.set(normalizeKey(key), key);
  });

  Object.entries(input).forEach(([rawKey, rawValue]) => {
    const matchedKey = keyMap.get(normalizeKey(rawKey));
    if (!matchedKey) return;
    normalized[matchedKey] = coerceBoolean(rawValue);
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
  const agentsSource =
    payload.agents_checked ??
    payload.agents ??
    payload.checked_agents ??
    payload.causative_agents ??
    payload;

  return {
    agents: normalizeAgents(agentsSource),
    reasoning:
      typeof payload.reasoning === 'string' ? payload.reasoning.trim() : '',
    photoUrl: uploadedFile ? await fileToDataUrl(uploadedFile) : '',
  };
}
