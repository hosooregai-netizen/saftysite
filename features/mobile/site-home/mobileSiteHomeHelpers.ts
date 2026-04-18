import {
  getSessionGuidanceDate,
  getSessionProgress,
  getSessionSortTime,
  getSessionTitle,
} from '@/constants/inspectionSession';
import type { InspectionSession } from '@/types/inspectionSession';
import type { InspectionReportListItem, InspectionSite } from '@/types/inspectionSession';

export function clampProgress(value: number | null | undefined) {
  return Math.max(0, Math.min(100, Math.round(value ?? 0)));
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

export function formatTelHref(value: string | null | undefined) {
  if (!value?.trim()) {
    return null;
  }

  const digits = value.replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : null;
}

export function formatMailHref(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed || !trimmed.includes('@')) {
    return null;
  }

  return `mailto:${trimmed}`;
}

export function getDisplayValue(value: string | null | undefined) {
  return value?.trim() || '-';
}

function getReportSortTime(value: {
  createdAt: string;
  lastAutosavedAt: string | null;
  updatedAt: string;
  visitDate: string | null;
}) {
  return Math.max(
    value.lastAutosavedAt ? new Date(value.lastAutosavedAt).getTime() : 0,
    value.updatedAt ? new Date(value.updatedAt).getTime() : 0,
    value.createdAt ? new Date(value.createdAt).getTime() : 0,
    value.visitDate ? new Date(value.visitDate).getTime() : 0,
  );
}

export function getLatestSiteReport({
  reportItems,
  siteSessions,
}: {
  reportItems: InspectionReportListItem[];
  siteSessions: InspectionSession[];
}) {
  const latestSession =
    siteSessions.length > 0
      ? [...siteSessions].sort((left, right) => getSessionSortTime(right) - getSessionSortTime(left))[0]
      : null;
  const latestRemoteReport =
    reportItems.length > 0
      ? [...reportItems].sort((left, right) => getReportSortTime(right) - getReportSortTime(left))[0]
      : null;

  return {
    latestGuidanceDate: latestSession
      ? getSessionGuidanceDate(latestSession)
      : latestRemoteReport?.visitDate || '',
    latestReportKey: latestSession?.id || latestRemoteReport?.reportKey || '',
    latestReportRound:
      latestSession?.reportNumber ||
      latestRemoteReport?.visitRound ||
      1,
    latestReportProgress: latestSession
      ? getSessionProgress(latestSession).percentage
      : clampProgress(latestRemoteReport?.progressRate),
    latestReportTitle: latestSession
      ? getSessionTitle(latestSession)
      : latestRemoteReport?.reportTitle || '',
  };
}

export function buildCurrentQuarterStatusLabel(quarterlyReports: Array<{ year: number; quarter: number }>) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentQuarter = Math.floor(today.getMonth() / 3) + 1;
  const isCurrentQuarterReportCompleted = quarterlyReports.some(
    (report) => report.year === currentYear && report.quarter === currentQuarter,
  );

  return `${currentQuarter}분기 ${isCurrentQuarterReportCompleted ? '작성 완료' : '작성 전'}`;
}

export function buildSiteContactModel(site: InspectionSite) {
  const snapshot = site.adminSiteSnapshot;
  const managerPhone = snapshot.siteManagerPhone.trim();
  const managerPhoneHref = formatTelHref(managerPhone);
  const siteContact = snapshot.siteContactEmail.trim();
  const siteContactHref = formatMailHref(siteContact) ?? formatTelHref(siteContact);
  const headquartersContact = snapshot.headquartersContact.trim();
  const headquartersContactHref = formatTelHref(headquartersContact);
  const showSiteContact = siteContact.length > 0 && siteContact !== managerPhone;

  return {
    headquartersContact,
    headquartersContactHref,
    managerPhone,
    managerPhoneHref,
    showSiteContact,
    siteContact,
    siteContactHref,
    snapshot,
  };
}
