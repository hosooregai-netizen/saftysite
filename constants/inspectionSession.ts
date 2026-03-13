import { createEmptyReport } from '@/constants/hazard';
import { createEmptyCausativeAgentMap } from '@/constants/siteOverview';
import type {
  DraftState,
  FutureProcessRiskItem,
  GuidanceStatus,
  InspectionCover,
  InspectionHazardItem,
  InspectionSectionKey,
  InspectionSectionMeta,
  InspectionSite,
  InspectionSession,
  PreviousGuidanceItem,
} from '@/types/inspectionSession';

export const INSPECTION_SECTIONS: InspectionSectionMeta[] = [
  {
    key: 'cover',
    label: '1. 표지',
    shortLabel: '표지',
    compactLabel: '표지',
  },
  {
    key: 'siteOverview',
    label: '2. 개요',
    shortLabel: '개요',
    compactLabel: '개요',
  },
  {
    key: 'previousGuidance',
    label: '3. 이전 지도 사항',
    shortLabel: '이전 지도 사항',
    compactLabel: '이전',
  },
  {
    key: 'currentHazards',
    label: '4. 현재 위험',
    shortLabel: '현재 위험',
    compactLabel: '현재',
  },
  {
    key: 'futureRisks',
    label: '5. 향후 공정',
    shortLabel: '향후 공정',
    compactLabel: '향후',
  },
  {
    key: 'support',
    label: '6. 기타 사항',
    shortLabel: '기타 사항',
    compactLabel: '기타',
  },
];

const UNTITLED_SITE_KEY = '__untitled_site__';
const LEGACY_GUIDANCE_STATUS_LABELS: Record<GuidanceStatus, string> = {
  implemented: '이행',
  partial: '부분 이행',
  notImplemented: '미이행',
  pending: '검토중',
};

function normalizeText(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

function normalizeTimestamp(value: unknown, fallback: string): string {
  return typeof value === 'string' && value ? value : fallback;
}

function normalizeDraftState(value: unknown): DraftState {
  return value === 'reviewed' ? 'reviewed' : 'draft';
}

function normalizeGuidanceStatus(value: unknown): GuidanceStatus {
  switch (value) {
    case 'implemented':
    case 'partial':
    case 'notImplemented':
    case 'pending':
      return value;
    default:
      return 'pending';
  }
}

function normalizeObjects(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const objects = value.filter((item): item is string => typeof item === 'string');
  return objects.length > 0 ? objects : undefined;
}

function buildLegacyImplementationResult(raw: Record<string, unknown>): string {
  const explicitResult = normalizeText(
    typeof raw.implementationResult === 'string' ? raw.implementationResult : ''
  );
  if (explicitResult) return explicitResult;

  const status = normalizeGuidanceStatus(raw.status);
  const note = normalizeText(typeof raw.note === 'string' ? raw.note : '');
  const statusLabel =
    status !== 'pending' ? LEGACY_GUIDANCE_STATUS_LABELS[status] : '';

  if (statusLabel && note) {
    return `${statusLabel}\n${note}`;
  }

  return statusLabel || note;
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

export function createInspectionSite(title: string): InspectionSite {
  const timestamp = createTimestamp();

  return {
    id: generateId('site'),
    title: title.trim(),
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
  return {
    ...createInspectionHazardItem(),
    id: generateId('future-risk'),
  };
}

function normalizeHazardFields(
  raw: Record<string, unknown>,
  fallback: InspectionHazardItem
): InspectionHazardItem {
  return {
    ...fallback,
    id: normalizeText(typeof raw.id === 'string' ? raw.id : '') || fallback.id,
    status: normalizeDraftState(raw.status),
    createdAt: normalizeTimestamp(raw.createdAt, fallback.createdAt),
    updatedAt: normalizeTimestamp(raw.updatedAt, fallback.updatedAt),
    location:
      normalizeText(typeof raw.location === 'string' ? raw.location : '') ||
      fallback.location,
    locationDetail: normalizeText(
      typeof raw.locationDetail === 'string' ? raw.locationDetail : ''
    ),
    likelihood: normalizeText(typeof raw.likelihood === 'string' ? raw.likelihood : ''),
    severity: normalizeText(typeof raw.severity === 'string' ? raw.severity : ''),
    riskAssessmentResult: normalizeText(
      typeof raw.riskAssessmentResult === 'string' ? raw.riskAssessmentResult : ''
    ),
    hazardFactors: normalizeText(
      typeof raw.hazardFactors === 'string' ? raw.hazardFactors : ''
    ),
    improvementItems: normalizeText(
      typeof raw.improvementItems === 'string' ? raw.improvementItems : ''
    ),
    photoUrl: normalizeText(typeof raw.photoUrl === 'string' ? raw.photoUrl : ''),
    legalInfo: normalizeText(typeof raw.legalInfo === 'string' ? raw.legalInfo : ''),
    implementationPeriod: normalizeText(
      typeof raw.implementationPeriod === 'string' ? raw.implementationPeriod : ''
    ),
    metadata: typeof raw.metadata === 'string' ? raw.metadata : undefined,
    objects: normalizeObjects(raw.objects),
  };
}

export function normalizeInspectionHazardItem(raw: unknown): InspectionHazardItem {
  const fallback = createInspectionHazardItem();
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return normalizeHazardFields(source, fallback);
}

export function normalizePreviousGuidanceItem(raw: unknown): PreviousGuidanceItem {
  const fallback = createInspectionHazardItem();
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const normalized = normalizeHazardFields(source, fallback);

  return {
    ...normalized,
    status:
      typeof source.status === 'string'
        ? normalizeGuidanceStatus(source.status)
        : undefined,
    sourceSessionId:
      typeof source.sourceSessionId === 'string' ? source.sourceSessionId : undefined,
    sourceHazardId:
      typeof source.sourceHazardId === 'string' ? source.sourceHazardId : undefined,
    photoUrl:
      normalized.photoUrl ||
      normalizeText(typeof source.previousPhotoUrl === 'string' ? source.previousPhotoUrl : ''),
    currentPhotoUrl: normalizeText(
      typeof source.currentPhotoUrl === 'string' ? source.currentPhotoUrl : ''
    ),
    implementationResult: buildLegacyImplementationResult(source),
  };
}

export function normalizeFutureProcessRiskItem(raw: unknown): FutureProcessRiskItem {
  const fallback = createFutureProcessRiskItem();
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const normalized = normalizeHazardFields(source, fallback);

  return {
    ...normalized,
    locationDetail:
      normalized.locationDetail ||
      normalizeText(typeof source.processName === 'string' ? source.processName : ''),
    hazardFactors:
      normalized.hazardFactors ||
      normalizeText(typeof source.expectedHazard === 'string' ? source.expectedHazard : ''),
    improvementItems:
      normalized.improvementItems ||
      normalizeText(typeof source.countermeasure === 'string' ? source.countermeasure : ''),
    legalInfo:
      normalized.legalInfo || normalizeText(typeof source.note === 'string' ? source.note : ''),
  };
}

export function normalizeInspectionSession(session: InspectionSession): InspectionSession {
  return {
    ...session,
    previousGuidanceItems: Array.isArray(session.previousGuidanceItems)
      ? session.previousGuidanceItems.map((item) => normalizePreviousGuidanceItem(item))
      : [],
    currentHazards: Array.isArray(session.currentHazards)
      ? session.currentHazards.map((item) => normalizeInspectionHazardItem(item))
      : [createInspectionHazardItem()],
    futureProcessRisks: Array.isArray(session.futureProcessRisks)
      ? session.futureProcessRisks.map((item) => normalizeFutureProcessRiskItem(item))
      : [createFutureProcessRiskItem()],
  };
}

export function createInspectionSession(
  initialCover: Partial<InspectionCover> = {},
  siteKey = UNTITLED_SITE_KEY
): InspectionSession {
  const timestamp = createTimestamp();
  return {
    id: generateId('session'),
    siteKey,
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
    previousGuidanceItems: [],
    currentHazards: [createInspectionHazardItem()],
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

export function getSessionSiteKey(
  session: Pick<InspectionSession, 'cover' | 'siteKey'>
): string {
  const explicitSiteKey =
    'siteKey' in session && typeof session.siteKey === 'string'
      ? normalizeText(session.siteKey)
      : '';
  const businessName = normalizeText(session.cover.businessName);
  const projectName = normalizeText(session.cover.projectName);

  if (explicitSiteKey) return explicitSiteKey;
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
        (item) => item.currentPhotoUrl || item.implementationResult
      );
    case 'currentHazards':
      return session.currentHazards.length > 0;
    case 'futureRisks':
      return session.futureProcessRisks.some(
        (item) =>
          item.locationDetail ||
          item.hazardFactors ||
          item.improvementItems ||
          item.photoUrl ||
          item.legalInfo ||
          item.implementationPeriod
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
