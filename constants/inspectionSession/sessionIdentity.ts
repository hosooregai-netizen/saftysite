import { INSPECTION_SECTIONS, UNTITLED_SITE_KEY } from '@/constants/inspectionSession/catalog';
import { normalizeText } from '@/constants/inspectionSession/shared';
import type {
  ChecklistQuestion,
  CurrentHazardFinding,
  InspectionSectionKey,
  InspectionSession,
  InspectionSite,
  PreviousGuidanceFollowUpItem,
} from '@/types/inspectionSession';
import { finalizeInspectionSession } from './sessionState';

const DEFAULT_CHECKLIST_RATING = 'good';
const EXCLUDED_PROGRESS_SECTION_KEYS = new Set<InspectionSectionKey>(['doc13', 'doc14']);

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

function hasChecklistResponse(questions: ChecklistQuestion[]): boolean {
  return questions.some(
    (question) =>
      normalizeText(question.note) ||
      normalizeText(question.rating) !== DEFAULT_CHECKLIST_RATING,
  );
}

function hasMeaningfulFindingContent(
  item: CurrentHazardFinding,
  defaultInspector: string,
): boolean {
  const inspector = normalizeText(item.inspector);

  return Boolean(
    normalizeText(item.photoUrl) ||
      normalizeText(item.photoUrl2) ||
      normalizeText(item.location) ||
      normalizeText(item.likelihood) ||
      normalizeText(item.severity) ||
      normalizeText(item.accidentType) ||
      normalizeText(item.causativeAgentKey) ||
      (inspector && inspector !== defaultInspector) ||
      normalizeText(item.emphasis) ||
      normalizeText(item.improvementPlan) ||
      normalizeText(item.legalReferenceTitle),
  );
}

function hasFuturePlanContent(session: InspectionSession): boolean {
  return session.document8Plans.some((item) =>
    Boolean(
      normalizeText(item.processName) ||
        normalizeText(item.hazard) ||
        normalizeText(item.countermeasure) ||
        normalizeText(item.note),
    ),
  );
}

function hasMeasurementContent(session: InspectionSession): boolean {
  return session.document10Measurements.some((item) =>
    Boolean(
      normalizeText(item.photoUrl) ||
        normalizeText(item.measurementLocation) ||
        normalizeText(item.measuredValue) ||
        normalizeText(item.actionTaken),
    ),
  );
}

function hasEducationContent(session: InspectionSession): boolean {
  return session.document11EducationRecords.some((item) =>
    Boolean(
      normalizeText(item.photoUrl) ||
        normalizeText(item.materialUrl) ||
        normalizeText(item.materialName) ||
        normalizeText(item.attendeeCount) ||
        normalizeText(item.topic) ||
        normalizeText(item.content),
    ),
  );
}

function hasActivityContent(session: InspectionSession): boolean {
  return session.document12Activities.some((item) =>
    Boolean(
      normalizeText(item.photoUrl) ||
        normalizeText(item.photoUrl2) ||
        normalizeText(item.activityType) ||
        normalizeText(item.content),
    ),
  );
}

function hasMeaningfulFollowUpChange(item: PreviousGuidanceFollowUpItem): boolean {
  const normalizedResult = normalizeText(item.result);
  const defaultResult =
    item.sourceSessionId && item.sourceFindingId ? '미이행' : '이행';

  return Boolean(
    normalizeText(item.afterPhotoUrl) ||
      (!item.sourceSessionId && normalizeText(item.beforePhotoUrl)) ||
      (!item.sourceSessionId && normalizeText(item.location)) ||
      (normalizedResult && normalizedResult !== defaultResult),
  );
}

function hasFollowUpProgress(session: InspectionSession): boolean {
  return session.document4FollowUps.some((item) => hasMeaningfulFollowUpChange(item));
}

function isProgressTrackedSection(
  session: InspectionSession,
  key: InspectionSectionKey,
): boolean {
  if (EXCLUDED_PROGRESS_SECTION_KEYS.has(key)) {
    return false;
  }

  if (key === 'doc4') {
    return hasFollowUpProgress(session);
  }

  if (key === 'doc9') {
    return (
      hasChecklistResponse(session.document9SafetyChecks.tbm) ||
      hasChecklistResponse(session.document9SafetyChecks.riskAssessment)
    );
  }

  return true;
}

function isProgressCompletedSection(
  session: InspectionSession,
  key: InspectionSectionKey,
): boolean {
  switch (key) {
    case 'doc1': {
      const siteName = normalizeText(session.adminSiteSnapshot.siteName);
      const companyName =
        normalizeText(session.adminSiteSnapshot.companyName) ||
        normalizeText(session.adminSiteSnapshot.customerName);
      return Boolean(siteName && companyName);
    }
    case 'doc2':
      return Boolean(
        normalizeText(session.document2Overview.guidanceDate) &&
          normalizeText(session.document2Overview.assignee) &&
          normalizeText(session.document2Overview.processAndNotes),
      );
    case 'doc3':
      return session.document3Scenes.every((item) => Boolean(normalizeText(item.photoUrl)));
    case 'doc4':
      return hasFollowUpProgress(session);
    case 'doc5':
      return Boolean(normalizeText(session.document5Summary.summaryText));
    case 'doc6':
      return (
        Boolean(session.documentsMeta.doc6.lastEditedAt) ||
        session.document6Measures.some((item) => item.checked)
      );
    case 'doc7': {
      const defaultInspector = normalizeText(session.meta.drafter);
      return session.document7Findings.some((item) =>
        hasMeaningfulFindingContent(item, defaultInspector),
      );
    }
    case 'doc8':
      return hasFuturePlanContent(session);
    case 'doc9':
      return (
        hasChecklistResponse(session.document9SafetyChecks.tbm) &&
        hasChecklistResponse(session.document9SafetyChecks.riskAssessment)
      );
    case 'doc10':
      return hasMeasurementContent(session);
    case 'doc11':
      return hasEducationContent(session);
    case 'doc12':
      return hasActivityContent(session);
    case 'doc13':
    case 'doc14':
      return false;
    default:
      return false;
  }
}

export function getSessionProgress(session: InspectionSession): {
  completed: number;
  total: number;
  percentage: number;
} {
  const trackedSections = INSPECTION_SECTIONS.filter((section) =>
    isProgressTrackedSection(session, section.key),
  );
  const total = trackedSections.length;
  const completed = trackedSections.filter((section) =>
    isProgressCompletedSection(session, section.key),
  ).length;

  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}
