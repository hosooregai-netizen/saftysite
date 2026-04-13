import type { InspectionReportListItem } from '@/types/inspectionSession';
import type { MobileReportCardModel } from './types';

export function clampReportProgress(value: number | null | undefined) {
  return Math.max(0, Math.min(100, Math.round(value ?? 0)));
}

export function formatCompactDate(value: string | null | undefined) {
  if (!value?.trim()) {
    return '미기록';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
  }).format(parsed);
}

export function getProgressLabel(progressRate: number) {
  if (progressRate >= 100) {
    return '완료';
  }
  if (progressRate > 0) {
    return '작성중';
  }
  return '미작성';
}

export function getDrafterDisplay(
  item: InspectionReportListItem,
  assignedUserDisplay: string | undefined,
  fallbackAssignee: string,
) {
  return (
    (typeof item.meta.drafter === 'string' && item.meta.drafter.trim()) ||
    assignedUserDisplay ||
    fallbackAssignee ||
    '미지정'
  );
}

export function buildMobileReportCardModel(
  item: InspectionReportListItem,
  assignedUserDisplay: string | undefined,
  fallbackAssignee: string,
): MobileReportCardModel {
  const progressRate = clampReportProgress(item.progressRate);

  return {
    progressLabel: getProgressLabel(progressRate),
    progressRate,
    visitDateLabel: formatCompactDate(item.visitDate),
    drafterDisplay: getDrafterDisplay(item, assignedUserDisplay, fallbackAssignee),
    item,
  };
}
