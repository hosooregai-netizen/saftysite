import { createEmptyReport } from '@/constants/hazard';
import { createEmptyCausativeAgentMap } from '@/constants/siteOverview';
import type {
  AccidentSummary,
  DraftState,
  EducationSupportItem,
  EquipmentCheckItem,
  FutureProcessRiskItem,
  GuidanceStatus,
  InspectionCover,
  InspectionHazardItem,
  InspectionSectionKey,
  InspectionSectionMeta,
  InspectionSite,
  InspectionSession,
  OtherSupportItem,
  PreviousGuidanceItem,
  SupportItems,
  TechnicalMaterialItem,
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

export const DEFAULT_PREVIOUS_GUIDANCE_RESULT = '미이행';
export const PREVIOUS_GUIDANCE_RESULT_OPTIONS = [
  { value: '이행완료', label: '이행완료' },
  { value: '미이행', label: '미이행' },
] as const;

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

function normalizeReportNumber(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : 0;
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

export function normalizePreviousGuidanceResult(
  value: string | null | undefined
): string {
  const normalized = value?.trim() ?? '';

  if (!normalized) {
    return DEFAULT_PREVIOUS_GUIDANCE_RESULT;
  }

  if (normalized === '이행완료' || normalized === '미이행') {
    return normalized;
  }

  if (
    normalized.includes('미이행') ||
    normalized.includes('부분 이행') ||
    normalized.includes('검토중') ||
    normalized.includes('검토 중') ||
    normalized.includes('보완') ||
    normalized.includes('예정') ||
    normalized.includes('대기')
  ) {
    return '미이행';
  }

  if (
    normalized.includes('이행완료') ||
    normalized.includes('이행 완료') ||
    normalized.includes('조치완료') ||
    normalized.includes('조치 완료') ||
    normalized === '이행' ||
    normalized.includes('완료')
  ) {
    return '이행완료';
  }

  return '미이행';
}

function normalizeObjects(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const objects = value.filter((item): item is string => typeof item === 'string');
  return objects.length > 0 ? objects : undefined;
}

function buildLegacyImplementationResult(raw: Record<string, unknown>): string {
  const explicitResult = normalizePreviousGuidanceResult(
    typeof raw.implementationResult === 'string' ? raw.implementationResult : ''
  );
  if (typeof raw.implementationResult === 'string' && raw.implementationResult.trim()) {
    return explicitResult;
  }

  const status = normalizeGuidanceStatus(raw.status);
  const note = normalizeText(typeof raw.note === 'string' ? raw.note : '');
  const statusLabel =
    status !== 'pending' ? LEGACY_GUIDANCE_STATUS_LABELS[status] : '';

  return normalizePreviousGuidanceResult(statusLabel || note);
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

type LegacySupportItems = {
  technicalMaterials?: unknown;
  educationResults?: unknown;
  equipmentInspection?: unknown;
  otherSupport?: unknown;
  accidentOccurred?: unknown;
  accidentNotes?: unknown;
};

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
    implementationPeriod: '',
  };
}

export function createTechnicalMaterialItem(
  initial: Partial<TechnicalMaterialItem> = {}
): TechnicalMaterialItem {
  return {
    id: generateId('support-technical'),
    photoUrl: '',
    materialName: '',
    providedKinds: '',
    participantCount: '',
    educationContent: '',
    note: '',
    ...initial,
  };
}

export function createEquipmentCheckItem(
  initial: Partial<EquipmentCheckItem> = {}
): EquipmentCheckItem {
  return {
    id: generateId('support-equipment'),
    photoUrl: '',
    equipmentName: '',
    measurementLocation: '',
    measurementCriteria: '',
    measuredValue: '',
    suitability: '',
    note: '',
    ...initial,
  };
}

export function createEducationSupportItem(
  initial: Partial<EducationSupportItem> = {}
): EducationSupportItem {
  return {
    id: generateId('support-education'),
    photoUrl: '',
    supportItem: '',
    details: '',
    note: '',
    ...initial,
  };
}

export function createOtherSupportItem(
  initial: Partial<OtherSupportItem> = {}
): OtherSupportItem {
  return {
    id: generateId('support-other'),
    photoUrl: '',
    supportItem: '',
    details: '',
    note: '',
    ...initial,
  };
}

export function createAccidentSummary(
  initial: Partial<AccidentSummary> = {}
): AccidentSummary {
  return {
    periodStart: '',
    periodEnd: '',
    accidentDescription: '',
    occurred: false,
    ...initial,
  };
}

export function createSupportItems(
  initial: Partial<SupportItems> = {}
): SupportItems {
  return {
    technicalMaterials:
      initial.technicalMaterials?.length
        ? initial.technicalMaterials.map((item) => createTechnicalMaterialItem(item))
        : [createTechnicalMaterialItem()],
    equipmentChecks:
      initial.equipmentChecks?.length
        ? initial.equipmentChecks.map((item) => createEquipmentCheckItem(item))
        : [createEquipmentCheckItem()],
    educationSupports:
      initial.educationSupports?.length
        ? initial.educationSupports.map((item) => createEducationSupportItem(item))
        : [createEducationSupportItem()],
    otherSupports:
      initial.otherSupports?.length
        ? initial.otherSupports.map((item) => createOtherSupportItem(item))
        : [createOtherSupportItem()],
    accidentSummary: createAccidentSummary(initial.accidentSummary),
  };
}

function normalizeSupportItemId(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function normalizeTechnicalMaterialItem(raw: unknown): TechnicalMaterialItem {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return createTechnicalMaterialItem({
    id: normalizeSupportItemId(source.id, generateId('support-technical')),
    photoUrl: normalizeText(typeof source.photoUrl === 'string' ? source.photoUrl : ''),
    materialName: normalizeText(
      typeof source.materialName === 'string' ? source.materialName : ''
    ),
    providedKinds: normalizeText(
      typeof source.providedKinds === 'string' ? source.providedKinds : ''
    ),
    participantCount: normalizeText(
      typeof source.participantCount === 'string' ? source.participantCount : ''
    ),
    educationContent: normalizeText(
      typeof source.educationContent === 'string' ? source.educationContent : ''
    ),
    note: normalizeText(typeof source.note === 'string' ? source.note : ''),
  });
}

function normalizeEquipmentCheckItem(raw: unknown): EquipmentCheckItem {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return createEquipmentCheckItem({
    id: normalizeSupportItemId(source.id, generateId('support-equipment')),
    photoUrl: normalizeText(typeof source.photoUrl === 'string' ? source.photoUrl : ''),
    equipmentName: normalizeText(
      typeof source.equipmentName === 'string' ? source.equipmentName : ''
    ),
    measurementLocation: normalizeText(
      typeof source.measurementLocation === 'string'
        ? source.measurementLocation
        : ''
    ),
    measurementCriteria: normalizeText(
      typeof source.measurementCriteria === 'string'
        ? source.measurementCriteria
        : ''
    ),
    measuredValue: normalizeText(
      typeof source.measuredValue === 'string' ? source.measuredValue : ''
    ),
    suitability: normalizeText(
      typeof source.suitability === 'string' ? source.suitability : ''
    ),
    note: normalizeText(typeof source.note === 'string' ? source.note : ''),
  });
}

function normalizeEducationSupportItem(raw: unknown): EducationSupportItem {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return createEducationSupportItem({
    id: normalizeSupportItemId(source.id, generateId('support-education')),
    photoUrl: normalizeText(typeof source.photoUrl === 'string' ? source.photoUrl : ''),
    supportItem: normalizeText(
      typeof source.supportItem === 'string' ? source.supportItem : ''
    ),
    details: normalizeText(typeof source.details === 'string' ? source.details : ''),
    note: normalizeText(typeof source.note === 'string' ? source.note : ''),
  });
}

function normalizeOtherSupportItem(raw: unknown): OtherSupportItem {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return createOtherSupportItem({
    id: normalizeSupportItemId(source.id, generateId('support-other')),
    photoUrl: normalizeText(typeof source.photoUrl === 'string' ? source.photoUrl : ''),
    supportItem: normalizeText(
      typeof source.supportItem === 'string' ? source.supportItem : ''
    ),
    details: normalizeText(typeof source.details === 'string' ? source.details : ''),
    note: normalizeText(typeof source.note === 'string' ? source.note : ''),
  });
}

function normalizeAccidentSummary(raw: unknown): AccidentSummary {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return createAccidentSummary({
    periodStart: normalizeText(
      typeof source.periodStart === 'string' ? source.periodStart : ''
    ),
    periodEnd: normalizeText(typeof source.periodEnd === 'string' ? source.periodEnd : ''),
    accidentDescription: normalizeText(
      typeof source.accidentDescription === 'string' ? source.accidentDescription : ''
    ),
    occurred: Boolean(source.occurred),
  });
}

function migrateLegacySupportItems(raw: LegacySupportItems): SupportItems {
  return createSupportItems({
    technicalMaterials: [
      createTechnicalMaterialItem({
        materialName: normalizeText(
          typeof raw.technicalMaterials === 'string' ? raw.technicalMaterials : ''
        ),
        educationContent: normalizeText(
          typeof raw.educationResults === 'string' ? raw.educationResults : ''
        ),
      }),
    ],
    equipmentChecks: [
      createEquipmentCheckItem({
        note: normalizeText(
          typeof raw.equipmentInspection === 'string' ? raw.equipmentInspection : ''
        ),
      }),
    ],
    educationSupports: [createEducationSupportItem()],
    otherSupports: [
      createOtherSupportItem({
        details: normalizeText(typeof raw.otherSupport === 'string' ? raw.otherSupport : ''),
      }),
    ],
    accidentSummary: createAccidentSummary({
      occurred: Boolean(raw.accidentOccurred),
      accidentDescription: normalizeText(
        typeof raw.accidentNotes === 'string' ? raw.accidentNotes : ''
      ),
    }),
  });
}

export function normalizeSupportItems(raw: unknown): SupportItems {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

  const hasNewShape =
    Array.isArray(source.technicalMaterials) ||
    Array.isArray(source.equipmentChecks) ||
    Array.isArray(source.educationSupports) ||
    Array.isArray(source.otherSupports) ||
    (source.accidentSummary && typeof source.accidentSummary === 'object');

  if (!hasNewShape) {
    return migrateLegacySupportItems(source as LegacySupportItems);
  }

  return createSupportItems({
    technicalMaterials: Array.isArray(source.technicalMaterials)
      ? source.technicalMaterials.map((item) => normalizeTechnicalMaterialItem(item))
      : undefined,
    equipmentChecks: Array.isArray(source.equipmentChecks)
      ? source.equipmentChecks.map((item) => normalizeEquipmentCheckItem(item))
      : undefined,
    educationSupports: Array.isArray(source.educationSupports)
      ? source.educationSupports.map((item) => normalizeEducationSupportItem(item))
      : undefined,
    otherSupports: Array.isArray(source.otherSupports)
      ? source.otherSupports.map((item) => normalizeOtherSupportItem(item))
      : undefined,
    accidentSummary: normalizeAccidentSummary(source.accidentSummary),
  });
}

function supportArrayHasContent<T extends object>(items: T[]): boolean {
  return items.some((item) =>
    Object.entries(item as Record<string, unknown>).some(([key, value]) => {
      if (key === 'id') return false;
      return typeof value === 'string' ? Boolean(normalizeText(value)) : Boolean(value);
    })
  );
}

function accidentSummaryHasContent(summary: AccidentSummary): boolean {
  return Boolean(
    summary.periodStart ||
      summary.periodEnd ||
      summary.accidentDescription ||
      summary.occurred
  );
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

export function normalizePreviousGuidanceItem(
  raw: unknown,
  fallbackConfirmationDate = ''
): PreviousGuidanceItem {
  const fallback = createInspectionHazardItem();
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const normalized = normalizeHazardFields(source, fallback);

  return {
    ...normalized,
    guidanceDate: normalizeText(
      typeof source.guidanceDate === 'string' ? source.guidanceDate : ''
    ),
    confirmationDate:
      normalizeText(
        typeof source.confirmationDate === 'string' ? source.confirmationDate : ''
      ) || normalizeText(fallbackConfirmationDate),
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
    implementationResult: normalizePreviousGuidanceResult(
      buildLegacyImplementationResult(source)
    ),
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
    reportNumber: normalizeReportNumber(session.reportNumber),
    previousGuidanceItems: Array.isArray(session.previousGuidanceItems)
      ? session.previousGuidanceItems.map((item) =>
          normalizePreviousGuidanceItem(item, session.cover.inspectionDate)
        )
      : [],
    currentHazards: Array.isArray(session.currentHazards)
      ? session.currentHazards.map((item) => normalizeInspectionHazardItem(item))
      : [createInspectionHazardItem()],
    futureProcessRisks: Array.isArray(session.futureProcessRisks)
      ? session.futureProcessRisks.map((item) => normalizeFutureProcessRiskItem(item))
      : [createFutureProcessRiskItem()],
    supportItems: normalizeSupportItems(
      (session as unknown as Record<string, unknown>).supportItems
    ),
  };
}

export function createInspectionSession(
  initialCover: Partial<InspectionCover> = {},
  siteKey = UNTITLED_SITE_KEY,
  reportNumber = 1
): InspectionSession {
  const timestamp = createTimestamp();
  return {
    id: generateId('session'),
    siteKey,
    reportNumber,
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
    supportItems: createSupportItems(),
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

export function ensureSessionReportNumbers(
  sessions: InspectionSession[]
): InspectionSession[] {
  const sessionsBySite = new Map<string, InspectionSession[]>();

  for (const session of sessions) {
    const siteKey = getSessionSiteKey(session);
    const group = sessionsBySite.get(siteKey) ?? [];
    group.push(session);
    sessionsBySite.set(siteKey, group);
  }

  const nextNumberBySessionId = new Map<string, number>();

  for (const group of sessionsBySite.values()) {
    const ordered = [...group].sort((left, right) => {
      const primary = new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
      if (primary !== 0) return primary;

      return new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime();
    });

    ordered.forEach((item, index) => {
      nextNumberBySessionId.set(item.id, index + 1);
    });
  }

  return sessions.map((session) => ({
    ...session,
    reportNumber: nextNumberBySessionId.get(session.id) ?? session.reportNumber ?? 0,
  }));
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
      if (session.previousGuidanceItems.length === 0) {
        return true;
      }

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
        supportArrayHasContent(session.supportItems.technicalMaterials) ||
          supportArrayHasContent(session.supportItems.equipmentChecks) ||
          supportArrayHasContent(session.supportItems.educationSupports) ||
          supportArrayHasContent(session.supportItems.otherSupports) ||
          accidentSummaryHasContent(session.supportItems.accidentSummary)
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
