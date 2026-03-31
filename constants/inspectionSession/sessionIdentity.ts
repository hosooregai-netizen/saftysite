import { INSPECTION_SECTIONS, UNTITLED_SITE_KEY } from '@/constants/inspectionSession/catalog';
import { normalizeText } from '@/constants/inspectionSession/shared';
import type { InspectionSession, InspectionSite } from '@/types/inspectionSession';
import { finalizeInspectionSession } from './sessionState';

export function getSessionSiteKey(
  session: Pick<InspectionSession, 'siteKey' | 'adminSiteSnapshot' | 'meta'>,
): string {
  const explicitSiteKey = normalizeText(session.siteKey);
  if (explicitSiteKey) return explicitSiteKey;

  const customerName = normalizeText(session.adminSiteSnapshot.customerName);
  const siteName =
    normalizeText(session.adminSiteSnapshot.siteName) ||
    normalizeText(session.meta.siteName);

  if (!customerName && !siteName) return UNTITLED_SITE_KEY;
  return `${customerName}::${siteName}`;
}

export function getSessionSiteTitle(
  session: Pick<InspectionSession, 'adminSiteSnapshot' | 'meta'>,
): string {
  return (
    normalizeText(session.adminSiteSnapshot.siteName) ||
    normalizeText(session.meta.siteName) ||
    '미등록 현장'
  );
}

export function getSiteDisplayTitle(
  site: Pick<InspectionSite, 'customerName' | 'siteName'>,
): string {
  const customerName = normalizeText(site.customerName);
  const siteName = normalizeText(site.siteName);
  if (customerName && siteName) return `${customerName} / ${siteName}`;
  return siteName || customerName || '미등록 현장';
}

export function getSessionGuidanceDate(
  session: Pick<InspectionSession, 'document2Overview' | 'meta'>,
): string {
  return (
    normalizeText(session.document2Overview.guidanceDate) ||
    normalizeText(session.meta.reportDate)
  );
}

export function ensureSessionReportNumbers(
  sessions: InspectionSession[],
): InspectionSession[] {
  const sessionsBySite = new Map<string, InspectionSession[]>();
  sessions.forEach((session) => {
    const siteKey = getSessionSiteKey(session);
    const group = sessionsBySite.get(siteKey) ?? [];
    group.push(session);
    sessionsBySite.set(siteKey, group);
  });

  const fallbackNumberBySessionId = new Map<string, number>();
  sessionsBySite.forEach((group) => {
    [...group]
      .sort((left, right) => {
        const created =
          new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
        return created !== 0
          ? created
          : new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime();
      })
      .forEach((session, index) => {
        fallbackNumberBySessionId.set(session.id, index + 1);
      });
  });

  return sessions.map((session) =>
    finalizeInspectionSession({
      ...session,
      reportNumber:
        Number.isInteger(session.reportNumber) && session.reportNumber > 0
          ? session.reportNumber
          : fallbackNumberBySessionId.get(session.id) ?? session.reportNumber ?? 0,
    }),
  );
}

export function getSessionTitle(session: InspectionSession): string {
  const customTitle = normalizeText(session.meta.reportTitle);
  if (customTitle) {
    return customTitle;
  }

  const guidanceDate = getSessionGuidanceDate(session);
  return guidanceDate
    ? `${guidanceDate} 보고서 ${session.reportNumber}`
    : `${getSessionSiteTitle(session)} 보고서 ${session.reportNumber}`;
}

export function getSessionSortTime(session: InspectionSession): number {
  return new Date(
    session.lastSavedAt ?? session.updatedAt ?? session.createdAt,
  ).getTime();
}

export function getSessionProgress(session: InspectionSession): {
  completed: number;
  total: number;
  percentage: number;
} {
  const total = INSPECTION_SECTIONS.length;
  const completed = INSPECTION_SECTIONS.filter(
    (section) =>
      section.key in session.documentsMeta &&
      session.documentsMeta[section.key].status === 'completed',
  ).length;

  return { completed, total, percentage: Math.round((completed / total) * 100) };
}
