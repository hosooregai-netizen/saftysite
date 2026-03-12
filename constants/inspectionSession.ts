import { createEmptyReport } from '@/constants/hazard';
import { createEmptyCausativeAgentMap } from '@/constants/siteOverview';
import type {
  FutureProcessRiskItem,
  InspectionCover,
  InspectionHazardItem,
  InspectionSectionKey,
  InspectionSectionMeta,
  InspectionSession,
  PreviousGuidanceItem,
} from '@/types/inspectionSession';

export const INSPECTION_SECTIONS: InspectionSectionMeta[] = [
  {
    key: 'cover',
    label: '1. 표지',
    shortLabel: '표지',
    description: '사업장과 공정의 기본 정보를 먼저 입력합니다.',
  },
  {
    key: 'siteOverview',
    label: '2. 전경',
    shortLabel: '전경',
    description: '현장 전경 사진과 기인물 체크 결과를 작성합니다.',
  },
  {
    key: 'previousGuidance',
    label: '3. 이전 기술지도 사항 이행 여부',
    shortLabel: '이전 지도',
    description: '과거 지도사항과 현재 상태를 비교해 이행 여부를 정리합니다.',
  },
  {
    key: 'currentHazards',
    label: '4. 현재 공정 위험요인',
    shortLabel: '현재 위험',
    description: '현장 사진 기반으로 현재 위험요인 항목을 작성합니다.',
  },
  {
    key: 'futureRisks',
    label: '5. 추후 진행공정 위험요인 및 대책',
    shortLabel: '추후 공정',
    description: '다음 공정에서 예상되는 위험과 대책 초안을 정리합니다.',
  },
  {
    key: 'support',
    label: '6. 지원사항 및 기타 사항',
    shortLabel: '기타 사항',
    description: '교육, 장비 점검, 기술지원 등 기타 기록을 종합합니다.',
  },
];

const UNTITLED_SITE_KEY = '__untitled_site__';

function normalizeText(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

function generateId(prefix: string): string {
  const randomPart =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${randomPart}`;
}

function createTimestamp(): string {
  return new Date().toISOString();
}

export function createPreviousGuidanceItem(): PreviousGuidanceItem {
  const timestamp = createTimestamp();
  return {
    id: generateId('guidance'),
    title: '',
    description: '',
    status: 'pending',
    previousPhotoUrl: '',
    currentPhotoUrl: '',
    note: '',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createInspectionHazardItem(): InspectionHazardItem {
  const timestamp = createTimestamp();
  return {
    id: generateId('hazard'),
    status: 'draft',
    createdAt: timestamp,
    updatedAt: timestamp,
    ...createEmptyReport(),
  };
}

export function createFutureProcessRiskItem(): FutureProcessRiskItem {
  const timestamp = createTimestamp();
  return {
    id: generateId('future-risk'),
    processName: '',
    expectedHazard: '',
    countermeasure: '',
    note: '',
    status: 'draft',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createInspectionSession(
  initialCover: Partial<InspectionCover> = {}
): InspectionSession {
  const timestamp = createTimestamp();
  return {
    id: generateId('session'),
    currentSection: 'cover',
    cover: {
      businessName: '',
      projectName: '',
      inspectionDate: new Date().toISOString().slice(0, 10),
      consultantName: '',
      processSummary: '',
      siteAddress: '',
      contractorName: '',
      notes: '',
      ...initialCover,
    },
    siteOverview: {
      agents: createEmptyCausativeAgentMap(),
      reasoning: '',
      photoUrl: '',
    },
    siteOverviewStatus: 'draft',
    previousGuidanceItems: [createPreviousGuidanceItem()],
    currentHazards: [],
    futureProcessRisks: [createFutureProcessRiskItem()],
    supportItems: {
      technicalMaterials: '',
      educationResults: '',
      equipmentInspection: '',
      otherSupport: '',
      accidentOccurred: false,
      accidentNotes: '',
    },
    supportStatus: 'draft',
    createdAt: timestamp,
    updatedAt: timestamp,
    lastSavedAt: null,
  };
}

export function touchUpdatedAt<T extends { updatedAt: string }>(item: T): T {
  return {
    ...item,
    updatedAt: createTimestamp(),
  };
}

export function getSessionSiteKey(session: Pick<InspectionSession, 'cover'>): string {
  const businessName = normalizeText(session.cover.businessName);
  const projectName = normalizeText(session.cover.projectName);

  if (!businessName && !projectName) return UNTITLED_SITE_KEY;
  return `${businessName}::${projectName}`;
}

export function getSessionSiteTitle(session: Pick<InspectionSession, 'cover'>): string {
  return (
    normalizeText(session.cover.businessName) ||
    normalizeText(session.cover.projectName) ||
    '이름 없는 현장'
  );
}

export function getSessionSiteSubtitle(
  session: Pick<InspectionSession, 'cover'>
): string {
  const businessName = normalizeText(session.cover.businessName);
  const projectName = normalizeText(session.cover.projectName);
  const siteAddress = normalizeText(session.cover.siteAddress);

  if (businessName && projectName && businessName !== projectName) return projectName;
  return siteAddress;
}

export function getSessionTitle(session: InspectionSession): string {
  const inspectionDate = normalizeText(session.cover.inspectionDate);
  const projectName = normalizeText(session.cover.projectName);

  if (inspectionDate && projectName) {
    return `${inspectionDate} · ${projectName}`;
  }

  if (inspectionDate) return `${inspectionDate} 보고서`;
  if (projectName) return projectName;

  return '현장 보고서';
}

export function getSectionCompletion(
  session: InspectionSession,
  section: InspectionSectionKey
): boolean {
  switch (section) {
    case 'cover':
      return Boolean(
        session.cover.businessName &&
          session.cover.projectName &&
          session.cover.inspectionDate
      );
    case 'siteOverview':
      return Boolean(session.siteOverview.photoUrl);
    case 'previousGuidance':
      return session.previousGuidanceItems.some(
        (item) => item.title || item.currentPhotoUrl || item.status !== 'pending'
      );
    case 'currentHazards':
      return session.currentHazards.length > 0;
    case 'futureRisks':
      return session.futureProcessRisks.some(
        (item) => item.processName || item.expectedHazard || item.countermeasure
      );
    case 'support':
      return Boolean(
        session.supportItems.technicalMaterials ||
          session.supportItems.educationResults ||
          session.supportItems.equipmentInspection ||
          session.supportItems.otherSupport ||
          session.supportItems.accidentOccurred ||
          session.supportItems.accidentNotes
      );
    default:
      return false;
  }
}

export function getSessionProgress(session: InspectionSession): {
  completed: number;
  total: number;
  percentage: number;
} {
  const total = INSPECTION_SECTIONS.length;
  const completed = INSPECTION_SECTIONS.filter((section) =>
    getSectionCompletion(session, section.key)
  ).length;

  return {
    completed,
    total,
    percentage: Math.round((completed / total) * 100),
  };
}

export function getSessionSortTime(session: InspectionSession): number {
  return new Date(
    session.lastSavedAt ?? session.updatedAt ?? session.createdAt
  ).getTime();
}

export interface InspectionSiteSummary {
  key: string;
  title: string;
  subtitle: string;
  sessionCount: number;
  latestSession: InspectionSession;
}

export function groupSessionsBySite(
  sessions: InspectionSession[]
): InspectionSiteSummary[] {
  const grouped = new Map<string, InspectionSiteSummary>();

  for (const session of sessions) {
    const key = getSessionSiteKey(session);
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, {
        key,
        title: getSessionSiteTitle(session),
        subtitle: getSessionSiteSubtitle(session),
        sessionCount: 1,
        latestSession: session,
      });
      continue;
    }

    const latestSession =
      getSessionSortTime(session) > getSessionSortTime(existing.latestSession)
        ? session
        : existing.latestSession;

    grouped.set(key, {
      ...existing,
      title: getSessionSiteTitle(latestSession),
      subtitle: getSessionSiteSubtitle(latestSession),
      sessionCount: existing.sessionCount + 1,
      latestSession,
    });
  }

  return Array.from(grouped.values()).sort(
    (left, right) =>
      getSessionSortTime(right.latestSession) - getSessionSortTime(left.latestSession)
  );
}
