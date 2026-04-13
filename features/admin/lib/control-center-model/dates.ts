const DAY_IN_MS = 1000 * 60 * 60 * 24;

export function parseDateValue(value: string | null | undefined): Date | null {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized) return null;

  const dateOnlyMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const parsed = new Date(
      Number(dateOnlyMatch[1]),
      Number(dateOnlyMatch[2]) - 1,
      Number(dateOnlyMatch[3]),
    );
    parsed.setHours(0, 0, 0, 0);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDateValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

export function addDays(value: string | null | undefined, days: number): string {
  const parsed = parseDateValue(value);
  if (!parsed) return '';
  parsed.setDate(parsed.getDate() + days);
  return formatDateValue(parsed);
}

export function addDaysToDate(date: Date, days: number): string {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return formatDateValue(next);
}

export function startOfToday(today: Date): Date {
  const normalized = new Date(today);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

export function getDaysDiff(from: string | null | undefined, to: Date): number | null {
  const fromDate = parseDateValue(from);
  if (!fromDate) return null;
  return Math.floor((startOfToday(to).getTime() - startOfToday(fromDate).getTime()) / DAY_IN_MS);
}

export function getDaysUntil(from: Date, to: string | null | undefined): number | null {
  const toDate = parseDateValue(to);
  if (!toDate) return null;
  return Math.floor((startOfToday(toDate).getTime() - startOfToday(from).getTime()) / DAY_IN_MS);
}

export function formatDateOnly(value: string): string {
  const parsed = parseDateValue(value);
  return parsed ? formatDateValue(parsed) : '-';
}

export function formatDateTime(value: string): string {
  const parsed = parseDateValue(value);
  if (!parsed) return '-';
  return parsed.toLocaleString('ko-KR', {
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: '2-digit',
  });
}

export function startOfMonth(today: Date) {
  return new Date(today.getFullYear(), today.getMonth(), 1);
}

export function startOfQuarter(today: Date) {
  return new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
}

export function startOfYear(today: Date) {
  return new Date(today.getFullYear(), 0, 1);
}

export function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function formatMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function formatMonthLabel(date: Date) {
  return `${String(date.getFullYear()).slice(-2)}.${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function formatQuarterKey(today: Date) {
  return `${today.getFullYear()}-Q${Math.floor(today.getMonth() / 3) + 1}`;
}

export function formatQuarterLabel(today: Date) {
  return `${today.getFullYear()}년 ${Math.floor(today.getMonth() / 3) + 1}분기`;
}

export function extractCurrentQuarterKey(value: string | null | undefined) {
  const parsed = parseDateValue(value);
  if (!parsed) return '';
  return `${parsed.getFullYear()}-Q${Math.floor(parsed.getMonth() / 3) + 1}`;
}

export function isWithinDateRange(
  value: string,
  range: { end: Date; start: Date } | null,
) {
  if (!range) return false;
  const parsed = parseDateValue(value);
  if (!parsed) return false;
  return parsed.getTime() >= range.start.getTime() && parsed.getTime() <= range.end.getTime();
}
