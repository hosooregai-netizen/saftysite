import { getSessionGuidanceDate, getSessionTitle } from '@/constants/inspectionSession';
import {
  countDocument7FindingsForDisplay,
  formatSessionProgressRateDisplay,
} from '@/lib/erpReports/badWorkplace';
import type { InspectionSession } from '@/types/inspectionSession';

export function getMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function formatDateTimeLabel(value: string | null | undefined) {
  if (!value?.trim()) return '-';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(parsed);
}

export function formatMobileBadWorkplaceMonth(reportMonth: string) {
  const matched = reportMonth.match(/^(\d{4})-(\d{2})$/);
  if (!matched) return reportMonth;

  return `${matched[1].slice(-2)}년 ${matched[2]}월`;
}

export function getSourceSessionDisplay(session: InspectionSession | null) {
  return session ? getSessionTitle(session) : '-';
}

export function buildBadWorkplaceSourceSessionMeta(session: InspectionSession) {
  return [
    `지도일 ${getSessionGuidanceDate(session) || '-'}`,
    `작성자 ${session.meta.drafter || '-'}`,
    `지적사항 ${countDocument7FindingsForDisplay(session)}건`,
    `진행률 ${formatSessionProgressRateDisplay(session)}`,
  ];
}
