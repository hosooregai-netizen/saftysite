import { normalizeRiskNumber } from '@/lib/riskAssessment';

type UnknownRecord = Record<string, unknown>;

export function safeString(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => safeString(item)).filter(Boolean).join('\n');
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return '';
}

export function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => safeString(item)).filter(Boolean);
}

export function pickString(obj: UnknownRecord, ...keys: string[]): string {
  for (const key of keys) {
    const value = obj[key];
    if (value != null && value !== '') return safeString(value);
  }
  return '';
}

export function pickNumber(obj: UnknownRecord, ...keys: string[]): number | null {
  for (const key of keys) {
    const parsed = normalizeRiskNumber(obj[key]);
    if (parsed != null) return parsed;
  }
  return null;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function extractArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;

  if (raw && typeof raw === 'object') {
    const obj = raw as UnknownRecord;
    const candidate =
      obj.results ??
      obj.data ??
      obj.items ??
      obj.analyses ??
      obj.reports ??
      obj.hazards ??
      obj.list ??
      [];

    return Array.isArray(candidate) ? candidate : [candidate];
  }

  return [];
}

export function toUnknownRecord(raw: unknown): UnknownRecord {
  return (raw && typeof raw === 'object' ? raw : {}) as UnknownRecord;
}
