export function formatDateTime(value: string | null, fallback = '기록 없음'): string {
  if (!value) return fallback;

  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

