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
    getSessionGuidanceDate(session) || '-',
    `작성 ${session.meta.drafter || '-'}`,
    `지적 ${countDocument7FindingsForDisplay(session)}건`,
    `공정률 ${formatSessionProgressRateDisplay(session)}`,
  ];
}

export function buildBadWorkplaceSourceNotice(session: InspectionSession | null) {
  return session
    ? `${getSessionGuidanceDate(session) || '-'} 기술지도 보고서를 원본으로 반영했습니다.`
    : null;
}
