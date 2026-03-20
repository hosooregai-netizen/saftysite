export function normalizeMapperText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function asMapperRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

export function formatDateRange(start: string | null, end: string | null): string {
  if (start && end) return `${start} ~ ${end}`;
  return start || end || '';
}

export function formatProjectAmount(value: number | null): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '';
  return `${value.toLocaleString('ko-KR')}원`;
}

export function contentBodyToText(body: unknown): string {
  if (typeof body === 'string') return body.trim();

  const record = asMapperRecord(body);
  return (
    normalizeMapperText(record.body) ||
    normalizeMapperText(record.summary) ||
    normalizeMapperText(record.description) ||
    normalizeMapperText(record.content) ||
    normalizeMapperText(record.text)
  );
}

export function contentBodyToImageUrl(body: unknown): string {
  const record = asMapperRecord(body);
  return (
    normalizeMapperText(record.image_url) ||
    normalizeMapperText(record.imageUrl) ||
    normalizeMapperText(record.thumbnail_url) ||
    normalizeMapperText(record.thumbnailUrl)
  );
}

export function parseProgressRate(value: string): number | null {
  const normalized = value.replace(/[%\s]/g, '');
  if (!normalized) return null;

  const parsed = Number(normalized);
  if (Number.isNaN(parsed)) return null;
  return parsed;
}

export function parsePositiveInteger(value: string): number | null {
  const normalized = value.trim();
  if (!normalized) return null;

  const parsed = Number(normalized);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}
