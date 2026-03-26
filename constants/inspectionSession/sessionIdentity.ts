import { INSPECTION_SECTIONS, UNTITLED_SITE_KEY } from '@/constants/inspectionSession/catalog';
import { normalizeText } from '@/constants/inspectionSession/shared';
import type { InspectionSession, InspectionSite } from '@/types/inspectionSession';
import { finalizeInspectionSession } from './sessionState';

export function getSessionSiteKey(
  session: Pick<InspectionSession, 'siteKey' | 'adminSiteSnapshot' | 'meta'>
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
  session: Pick<InspectionSession, 'adminSiteSnapshot' | 'meta'>
): string {
  return (
    normalizeText(session.adminSiteSnapshot.siteName) ||
    normalizeText(session.meta.siteName) ||
    '미등록 현장'
  );
}

export function getSiteDisplayTitle(
  site: Pick<InspectionSite, 'customerName' | 'siteName'>
): string {
  const customerName = normalizeText(site.customerName);
  const siteName = normalizeText(site.siteName);
  if (customerName && siteName) return `${customerName} / ${siteName}`;
  return siteName || customerName || '미등록 현장';
}

export function ensureSessionReportNumbers(
  sessions: InspectionSession[]
): InspectionSession[] {
  const sessionsBySite = new Map<string, InspectionSession[]>();
  sessions.forEach((session) => {
    const siteKey = getSessionSiteKey(session);
    const group = sessionsBySite.get(siteKey) ?? [];
    group.push(session);
    sessionsBySite.set(siteKey, group);
  });

  const nextNumberBySessionId = new Map<string, number>();
  sessionsBySite.forEach((group) => {
    const usedNumbers = new Set<number>();
    let nextNumber = 1;

    [...group]
      .sort((left, right) => {
        const created = new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
        return created !== 0 ? created : new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime();
      })
      .forEach((session) => {
        if (Number.isInteger(session.reportNumber) && session.reportNumber > 0 && !usedNumbers.has(session.reportNumber)) {
          usedNumbers.add(session.reportNumber);
          nextNumberBySessionId.set(session.id, session.reportNumber);
          return;
        }
        while (usedNumbers.has(nextNumber)) nextNumber += 1;
        usedNumbers.add(nextNumber);
        nextNumberBySessionId.set(session.id, nextNumber);
        nextNumber += 1;
      });
  });

  return sessions.map((session) =>
    finalizeInspectionSession({
      ...session,
      reportNumber: nextNumberBySessionId.get(session.id) ?? session.reportNumber ?? 0,
    })
  );
}

export function getSessionTitle(session: InspectionSession): string {
  const reportDate = normalizeText(session.meta.reportDate);
  return reportDate
    ? `${reportDate} 보고서 ${session.reportNumber}`
    : `${getSessionSiteTitle(session)} 보고서 ${session.reportNumber}`;
}

export function getSessionSortTime(session: InspectionSession): number {
  return new Date(session.lastSavedAt ?? session.updatedAt ?? session.createdAt).getTime();
}

export function getSessionProgress(session: InspectionSession): {
  completed: number;
  total: number;
  percentage: number;
} {
  const total = INSPECTION_SECTIONS.length;
  const completed = INSPECTION_SECTIONS.filter((section) =>
    section.key in session.documentsMeta && session.documentsMeta[section.key].status === 'completed'
  ).length;

  return { completed, total, percentage: Math.round((completed / total) * 100) };
}

