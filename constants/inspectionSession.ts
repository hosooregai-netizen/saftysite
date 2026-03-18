import { CAUSATIVE_AGENT_SECTIONS } from '@/constants/siteOverview';
import { calculateRiskAssessmentResult } from '@/lib/riskAssessment';
import type { CausativeAgentKey } from '@/types/siteOverview';
import type {
  ActivityRecord,
  AdminSiteSnapshot,
  CaseFeedItem,
  ChecklistQuestion,
  CurrentHazardFinding,
  CurrentHazardSummaryDocument,
  FatalAccidentMeasureItem,
  FutureProcessRiskPlan,
  InspectionDocumentMeta,
  InspectionDocumentSource,
  InspectionReportMeta,
  InspectionSectionKey,
  InspectionSectionMeta,
  InspectionSession,
  InspectionSite,
  MeasurementCheckItem,
  NotificationMethod,
  PreviousGuidanceFollowUpItem,
  SafetyCheckDocument,
  SafetyEducationRecord,
  SafetyInfoItem,
  SiteScenePhoto,
  TechnicalGuidanceOverview,
  WorkPlanCheckKey,
  WorkPlanCheckStatus,
} from '@/types/inspectionSession';

type UnknownRecord = Record<string, unknown>;

const UNTITLED_SITE_KEY = '__untitled_site__';
const DEFAULT_GUIDANCE_AGENCY = '한국종합안전주식회사';
const DEFAULT_CONSTRUCTION_TYPE = '건설공사';
const DEFAULT_MEASUREMENT_CRITERIA = [
  '1. 초정밀작업 : 750 Lux 이상',
  '2. 정밀작업 : 300 Lux 이상',
  '3. 보통작업 : 150 Lux 이상',
  '4. 그 밖의 작업 : 75 Lux 이상',
].join('\n');

export const INSPECTION_SECTIONS: InspectionSectionMeta[] = [
  { key: 'doc1', label: '1. 기술지도 대상사업장', shortLabel: '대상사업장', compactLabel: '1' },
  { key: 'doc2', label: '2. 기술지도 개요', shortLabel: '기술지도 개요', compactLabel: '2' },
  { key: 'doc3', label: '3. 현장 전경 및 주요 진행공정', shortLabel: '현장 전경', compactLabel: '3' },
  { key: 'doc4', label: '4. 이전 기술지도 사항 이해여부', shortLabel: '이전 지도 사항', compactLabel: '4' },
  { key: 'doc5', label: '5. 현존 유해·위험요인 분류', shortLabel: '현존 요인 통계', compactLabel: '5' },
  { key: 'doc6', label: '6. 12대 사망사고 기인물', shortLabel: '사망사고 기인물', compactLabel: '6' },
  { key: 'doc7', label: '7. 현존 유해·위험요인 세부 지적', shortLabel: '세부 지적', compactLabel: '7' },
  { key: 'doc8', label: '8. 향후 진행공정 위험요인 및 안전대책', shortLabel: '향후 진행공정', compactLabel: '8' },
  { key: 'doc9', label: '9. 위험성평가 / TBM 체크', shortLabel: '위험성평가 / TBM', compactLabel: '9' },
  { key: 'doc10', label: '10. 계측점검', shortLabel: '계측점검', compactLabel: '10' },
  { key: 'doc11', label: '11. 안전교육', shortLabel: '안전교육', compactLabel: '11' },
  { key: 'doc12', label: '12. 활동 실적', shortLabel: '활동 실적', compactLabel: '12' },
  { key: 'doc13', label: '13. 재해 사례', shortLabel: '재해 사례', compactLabel: '13' },
  { key: 'doc14', label: '14. 안전 정보', shortLabel: '안전 정보', compactLabel: '14' },
];

export const SITE_FORM_FIELDS: Array<{
  key: keyof AdminSiteSnapshot;
  label: string;
  placeholder: string;
}> = [
  { key: 'customerName', label: '고객사명', placeholder: '예: 한국종합안전' },
  { key: 'siteName', label: '현장명', placeholder: '예: 성수 신축 공사 현장' },
  { key: 'assigneeName', label: '현장 담당자', placeholder: '예: 홍길동' },
  { key: 'siteManagementNumber', label: '사업장관리번호', placeholder: '예: 2026-001' },
  { key: 'businessStartNumber', label: '사업개시번호', placeholder: '예: 240318-01' },
  { key: 'constructionPeriod', label: '공사기간', placeholder: '예: 2026.03.01 ~ 2026.07.30' },
  { key: 'constructionAmount', label: '공사금액', placeholder: '예: 1,200,000,000원' },
  { key: 'siteManagerName', label: '현장 책임자', placeholder: '예: 현장소장 김안전' },
  { key: 'siteContactEmail', label: '현장 연락처(이메일)', placeholder: '예: 010-0000-0000 / site@example.com' },
  { key: 'siteAddress', label: '현장 주소', placeholder: '예: 서울시 광진구 ...' },
  { key: 'companyName', label: '회사명', placeholder: '예: 한국종합안전주식회사' },
  { key: 'corporationRegistrationNumber', label: '법인등록번호', placeholder: '예: 110111-0000000' },
  { key: 'businessRegistrationNumber', label: '사업자등록번호', placeholder: '예: 123-45-67890' },
  { key: 'licenseNumber', label: '면허번호', placeholder: '예: 건설업 제2026-01호' },
  { key: 'headquartersContact', label: '본사 연락처', placeholder: '예: 02-0000-0000' },
  { key: 'headquartersAddress', label: '본사 주소', placeholder: '예: 서울시 중구 ...' },
];

export const WORK_PLAN_ITEMS: Array<{ key: WorkPlanCheckKey; label: string }> = [
  { key: 'towerCrane', label: '타워크레인 설치·조립·해체' },
  { key: 'tunnelExcavation', label: '터널굴착작업' },
  { key: 'vehicleLoadingMachine', label: '차량계 하역운반기계 사용' },
  { key: 'bridgeWork', label: '교량작업' },
  { key: 'constructionMachine', label: '차량계 건설기계 사용' },
  { key: 'quarryWork', label: '채석작업' },
  { key: 'chemicalFacility', label: '화학설비 외 부속설비 사용' },
  { key: 'buildingDemolition', label: '건물 등의 해체작업' },
  { key: 'electricalWork', label: '전기작업' },
  { key: 'heavyMaterialHandling', label: '중량물 취급작업' },
  { key: 'earthwork', label: '굴착작업' },
  { key: 'railwayFacilityMaintenance', label: '궤도와 그 밖의 설비보수 작업' },
  { key: 'otherHighRiskWork', label: '그 밖의 고위험 작업' },
];

export const WORK_PLAN_STATUS_OPTIONS: Array<{
  value: WorkPlanCheckStatus;
  label: string;
}> = [
  { value: 'written', label: '작성' },
  { value: 'not_written', label: '미작성' },
  { value: 'not_applicable', label: '해당없음' },
];

export const NOTIFICATION_METHOD_OPTIONS: Array<{
  value: NotificationMethod;
  label: string;
}> = [
  { value: 'direct', label: '직접전달' },
  { value: 'registered_mail', label: '등기우편' },
  { value: 'email', label: '전자우편' },
  { value: 'mobile', label: '모바일' },
  { value: 'other', label: '기타' },
];

export const ACCIDENT_TYPE_OPTIONS = [
  '추락',
  '낙하',
  '충돌',
  '감전',
  '끼임',
  '전도',
  '화재·폭발',
  '붕괴',
  '기타',
] as const;

export const LEGAL_REFERENCE_LIBRARY = [
  {
    id: 'rule-386',
    title: '산업안전보건기준에 관한 규칙 제386조',
    body:
      '제386조(중량물의 구름 위험방지) 사업주는 드럼통 등 구를 위험이 있는 중량물을 취급하는 경우 구름멈춤대, 쐐기 등을 이용하여 중량물의 움직임을 방지해야 한다.',
    referenceMaterial1: '참고자료 예시 1',
    referenceMaterial2: '참고자료 예시 2',
  },
  {
    id: 'rule-43',
    title: '산업안전보건기준에 관한 규칙 제43조',
    body:
      '단부·개구부에는 안전난간, 울타리, 덮개 등 추락 방호조치를 적정하게 설치해야 한다.',
    referenceMaterial1: '단부 안전난간 설치 가이드',
    referenceMaterial2: '개구부 덮개 고정 점검표',
  },
  {
    id: 'act-36',
    title: '산업안전보건법 제36조',
    body:
      '사업주는 유해·위험 요인을 찾아내어 위험성을 평가하고, 그 결과에 따라 필요한 조치를 하여야 한다.',
    referenceMaterial1: '위험성평가 절차 체크리스트',
    referenceMaterial2: '근로자 참여형 위험성평가 사례',
  },
];

export const FUTURE_PROCESS_LIBRARY = [
  {
    processName: '철골 자재 가공 및 반입 작업',
    hazard: '중량물 낙하, 반입 동선 내 충돌, 자재 적치 불량에 따른 전도 위험',
    countermeasure: '적재 기준 준수, 작업구역 출입통제, 유도자 배치 및 양중 전 점검 실시',
  },
  {
    processName: '외부 비계 해체 작업',
    hazard: '해체 중 추락, 낙하물 발생, 비계 부재 이동 중 협착 위험',
    countermeasure: '해체 순서 준수, 안전대 체결, 하부 출입통제 및 낙하물 방지망 설치',
  },
  {
    processName: '전기 판넬 시공 작업',
    hazard: '감전, 임시배선 훼손, 협소 공간 내 충돌 위험',
    countermeasure: '잠금표지 실시, 절연 보호구 착용, 임시배선 정리 및 작업 전 점검',
  },
  {
    processName: '콘크리트 타설 준비 작업',
    hazard: '거푸집 붕괴, 작업발판 추락, 장비와 근로자 간 충돌 위험',
    countermeasure: '거푸집 점검, 작업발판 고정, 장비 작업반경 통제 및 신호수 배치',
  },
];

export const ACTIVITY_TYPE_OPTIONS = [
  '안전보건 캠페인',
  '안전보건 포스터·현수막 제공',
  '안전점검 보조',
  '작업 전 안전미팅 지원',
];

export const TBM_QUESTION_PROMPTS = [
  '작업 전 TBM(안전점검 회의) 실시 여부',
  '금일 작업내용 / 사용장비 현황 전파 여부',
  '금일 작업의 위험요인과 안전대책 공유 여부',
  '개인보호구 착용 상태 및 근로자 건강상태 확인 여부',
  '작업 전 TBM 관련 기록 유지 여부',
] as const;

export const RISK_ASSESSMENT_QUESTION_PROMPTS = [
  '위험성평가 실시 여부(최초, 상시 등)',
  '위험성평가 시 근로자 참여 여부',
  '위험성평가 실시 시기 준수',
  '위험성평가의 위험요인, 대책 이행결과 확인',
  '위험성평가 관련 기록관리 여부',
] as const;

export const DEFAULT_CASE_FEED: CaseFeedItem[] = [
  {
    id: 'case-fall-object',
    title: '낙하물 사고',
    summary: '상부 작업 중 공구가 낙하하여 하부 작업자가 부상을 입은 사례입니다.',
    imageUrl: '',
  },
  {
    id: 'case-electric-shock',
    title: '감전 사고',
    summary: '임시배선 손상 상태에서 작업하던 중 감전이 발생한 사례입니다.',
    imageUrl: '',
  },
  {
    id: 'case-fall',
    title: '추락 사고',
    summary: '개구부 보호조치 미흡 상태에서 근로자가 추락한 사례입니다.',
    imageUrl: '',
  },
  {
    id: 'case-collapse',
    title: '붕괴 사고',
    summary: '가설 구조물 고정 불량으로 작업구간이 붕괴된 사례입니다.',
    imageUrl: '',
  },
];

export const DEFAULT_SAFETY_INFOS: SafetyInfoItem[] = [
  {
    id: 'safety-info-1',
    title: '이번 주 안전정보',
    body:
      '기상 변화가 큰 시기에는 자재 적치와 이동 통로 상태를 먼저 점검하고, 고소작업 전 보호구 착용 상태를 반드시 재확인합니다.',
    imageUrl: '',
  },
];

const DEFAULT_DOCUMENT_SOURCES: Record<InspectionSectionKey, InspectionDocumentSource> = {
  doc1: 'admin',
  doc2: 'manual',
  doc3: 'manual',
  doc4: 'derived',
  doc5: 'derived',
  doc6: 'derived',
  doc7: 'manual',
  doc8: 'api',
  doc9: 'manual',
  doc10: 'manual',
  doc11: 'manual',
  doc12: 'manual',
  doc13: 'readonly',
  doc14: 'readonly',
};

const FATAL_ACCIDENT_MEASURE_LIBRARY = CAUSATIVE_AGENT_SECTIONS.flatMap((section) =>
  section.rows.flatMap((row) => [row.left, row.right])
);

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' ? (value as UnknownRecord) : {};
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeTimestamp(value: unknown, fallback: string): string {
  const normalized = normalizeText(value);
  return normalized || fallback;
}

function normalizeBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    return ['true', '1', 'yes', 'y', 'checked'].includes(value.trim().toLowerCase());
  }

  return false;
}

function normalizeSectionKey(value: unknown): InspectionSectionKey {
  const normalized = normalizeText(value);
  if (INSPECTION_SECTIONS.some((section) => section.key === normalized)) {
    return normalized as InspectionSectionKey;
  }

  switch (normalized) {
    case 'cover':
      return 'doc2';
    case 'siteOverview':
      return 'doc3';
    case 'previousGuidance':
      return 'doc4';
    case 'currentHazards':
      return 'doc7';
    case 'futureRisks':
      return 'doc8';
    case 'support':
      return 'doc10';
    default:
      return 'doc1';
  }
}

function normalizeReportNumber(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : 0;
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

function createDocumentMeta(source: InspectionDocumentSource): InspectionDocumentMeta {
  return {
    status: source === 'readonly' ? 'completed' : 'not_started',
    lastEditedAt: null,
    source,
  };
}

function createDocumentMetaMap(): Record<InspectionSectionKey, InspectionDocumentMeta> {
  return {
    doc1: createDocumentMeta(DEFAULT_DOCUMENT_SOURCES.doc1),
    doc2: createDocumentMeta(DEFAULT_DOCUMENT_SOURCES.doc2),
    doc3: createDocumentMeta(DEFAULT_DOCUMENT_SOURCES.doc3),
    doc4: createDocumentMeta(DEFAULT_DOCUMENT_SOURCES.doc4),
    doc5: createDocumentMeta(DEFAULT_DOCUMENT_SOURCES.doc5),
    doc6: createDocumentMeta(DEFAULT_DOCUMENT_SOURCES.doc6),
    doc7: createDocumentMeta(DEFAULT_DOCUMENT_SOURCES.doc7),
    doc8: createDocumentMeta(DEFAULT_DOCUMENT_SOURCES.doc8),
    doc9: createDocumentMeta(DEFAULT_DOCUMENT_SOURCES.doc9),
    doc10: createDocumentMeta(DEFAULT_DOCUMENT_SOURCES.doc10),
    doc11: createDocumentMeta(DEFAULT_DOCUMENT_SOURCES.doc11),
    doc12: createDocumentMeta(DEFAULT_DOCUMENT_SOURCES.doc12),
    doc13: createDocumentMeta(DEFAULT_DOCUMENT_SOURCES.doc13),
    doc14: createDocumentMeta(DEFAULT_DOCUMENT_SOURCES.doc14),
  };
}

function createEmptyAdminSiteSnapshot(
  initial: Partial<AdminSiteSnapshot> = {}
): AdminSiteSnapshot {
  return {
    customerName: '',
    siteName: '',
    assigneeName: '',
    siteManagementNumber: '',
    businessStartNumber: '',
    constructionPeriod: '',
    constructionAmount: '',
    siteManagerName: '',
    siteContactEmail: '',
    siteAddress: '',
    companyName: '',
    corporationRegistrationNumber: '',
    businessRegistrationNumber: '',
    licenseNumber: '',
    headquartersContact: '',
    headquartersAddress: '',
    ...initial,
  };
}

function createWorkPlanChecks(
  initial: Partial<Record<WorkPlanCheckKey, WorkPlanCheckStatus>> = {}
): Record<WorkPlanCheckKey, WorkPlanCheckStatus> {
  return WORK_PLAN_ITEMS.reduce<Record<WorkPlanCheckKey, WorkPlanCheckStatus>>(
    (accumulator, item) => {
      accumulator[item.key] = initial[item.key] ?? 'not_applicable';
      return accumulator;
    },
    {} as Record<WorkPlanCheckKey, WorkPlanCheckStatus>
  );
}

function createChecklistQuestions(
  prompts: readonly string[],
  prefix: string,
  initial: Partial<ChecklistQuestion>[] = []
): ChecklistQuestion[] {
  return prompts.map((prompt, index) => ({
    id: initial[index]?.id ?? generateId(`${prefix}-${index + 1}`),
    prompt,
    rating: initial[index]?.rating ?? '',
    note: initial[index]?.note ?? '',
  }));
}

export function createSiteScenePhoto(
  title: string,
  initial: Partial<SiteScenePhoto> = {}
): SiteScenePhoto {
  return {
    id: initial.id ?? generateId('scene'),
    title,
    photoUrl: '',
    description: '',
    ...initial,
  };
}

export function createPreviousGuidanceFollowUpItem(
  initial: Partial<PreviousGuidanceFollowUpItem> = {}
): PreviousGuidanceFollowUpItem {
  return {
    id: initial.id ?? generateId('follow-up'),
    sourceSessionId: initial.sourceSessionId,
    sourceFindingId: initial.sourceFindingId,
    location: '',
    guidanceDate: '',
    confirmationDate: '',
    beforePhotoUrl: '',
    afterPhotoUrl: '',
    result: '',
    ...initial,
  };
}

export function createFatalAccidentMeasureItem(
  key: CausativeAgentKey,
  checked = false
): FatalAccidentMeasureItem {
  const matched = FATAL_ACCIDENT_MEASURE_LIBRARY.find((item) => item.key === key);

  return {
    key,
    number: matched?.number ?? 0,
    label: matched?.label ?? key,
    guidance: matched?.guidance ?? '',
    checked,
  };
}

export function createCurrentHazardFinding(
  initial: Partial<CurrentHazardFinding> = {}
): CurrentHazardFinding {
  return {
    id: initial.id ?? generateId('finding'),
    photoUrl: '',
    location: '',
    likelihood: '',
    severity: '',
    riskLevel: '',
    accidentType: '',
    causativeAgentKey: '',
    inspector: '',
    emphasis: '',
    improvementPlan: '',
    legalReferenceId: '',
    legalReferenceTitle: '',
    referenceMaterial1: '',
    referenceMaterial2: '',
    carryForward: false,
    metadata: undefined,
    ...initial,
  };
}

export function createFutureProcessRiskPlan(
  initial: Partial<FutureProcessRiskPlan> = {}
): FutureProcessRiskPlan {
  return {
    id: initial.id ?? generateId('future-plan'),
    processName: '',
    hazard: '',
    countermeasure: '',
    note: '',
    source: 'manual',
    ...initial,
  };
}

export function createMeasurementCheckItem(
  initial: Partial<MeasurementCheckItem> = {}
): MeasurementCheckItem {
  return {
    id: initial.id ?? generateId('measurement'),
    instrumentType: '조도계',
    measurementLocation: '',
    measuredValue: '',
    safetyCriteria: DEFAULT_MEASUREMENT_CRITERIA,
    actionTaken: '',
    ...initial,
  };
}

export function createSafetyEducationRecord(
  initial: Partial<SafetyEducationRecord> = {}
): SafetyEducationRecord {
  return {
    id: initial.id ?? generateId('education'),
    photoUrl: '',
    materialUrl: '',
    materialName: '',
    attendeeCount: '',
    content: '',
    ...initial,
  };
}

export function createActivityRecord(
  initial: Partial<ActivityRecord> = {}
): ActivityRecord {
  return {
    id: initial.id ?? generateId('activity'),
    photoUrl: '',
    activityType: '',
    content: '',
    ...initial,
  };
}

function createTechnicalGuidanceOverview(
  initial: Partial<TechnicalGuidanceOverview> = {},
  snapshot: AdminSiteSnapshot = createEmptyAdminSiteSnapshot()
): TechnicalGuidanceOverview {
  const base: Omit<TechnicalGuidanceOverview, 'workPlanChecks'> = {
    guidanceAgencyName: DEFAULT_GUIDANCE_AGENCY,
    guidanceDate: '',
    constructionType: DEFAULT_CONSTRUCTION_TYPE,
    progressRate: '',
    visitCount: '',
    totalVisitCount: '',
    assignee: snapshot.assigneeName,
    previousImplementationStatus: '',
    contact: snapshot.siteContactEmail,
    notificationMethod: '',
    notificationRecipientName: '',
    notificationRecipientSignature: '',
    otherNotificationMethod: '',
    accidentOccurred: '',
    recentAccidentDate: '',
    accidentType: '',
    accidentSummary: '',
    processAndNotes: '',
  };

  return {
    ...base,
    ...initial,
    workPlanChecks: createWorkPlanChecks(initial.workPlanChecks),
  };
}

function createHazardSummaryDocument(
  initial: Partial<CurrentHazardSummaryDocument> = {}
): CurrentHazardSummaryDocument {
  return {
    summaryText: '',
    ...initial,
  };
}

function createSafetyCheckDocument(
  initial: Partial<SafetyCheckDocument> = {}
): SafetyCheckDocument {
  return {
    tbm: createChecklistQuestions(TBM_QUESTION_PROMPTS, 'tbm', initial.tbm),
    riskAssessment: createChecklistQuestions(
      RISK_ASSESSMENT_QUESTION_PROMPTS,
      'risk-assessment',
      initial.riskAssessment
    ),
  };
}

function normalizeRiskLevel(likelihood: string, severity: string, existing: string): string {
  return calculateRiskAssessmentResult(likelihood, severity) || normalizeText(existing);
}

export function createInspectionSite(
  input: string | Partial<AdminSiteSnapshot> = {}
): InspectionSite {
  const snapshot =
    typeof input === 'string'
      ? createEmptyAdminSiteSnapshot({ siteName: input })
      : createEmptyAdminSiteSnapshot(input);
  const timestamp = createTimestamp();

  return {
    id: generateId('site'),
    title: snapshot.siteName || snapshot.customerName || '현장',
    customerName: snapshot.customerName,
    siteName: snapshot.siteName,
    assigneeName: snapshot.assigneeName,
    adminSiteSnapshot: snapshot,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function normalizeInspectionSite(raw: unknown): InspectionSite {
  const source = asRecord(raw);
  const snapshotSource =
    'adminSiteSnapshot' in source ? asRecord(source.adminSiteSnapshot) : source;
  const snapshot = createEmptyAdminSiteSnapshot({
    customerName: normalizeText(snapshotSource.customerName) || normalizeText(source.customerName),
    siteName:
      normalizeText(snapshotSource.siteName) ||
      normalizeText(source.siteName) ||
      normalizeText(source.title),
    assigneeName: normalizeText(snapshotSource.assigneeName) || normalizeText(source.assigneeName),
    siteManagementNumber: normalizeText(snapshotSource.siteManagementNumber),
    businessStartNumber: normalizeText(snapshotSource.businessStartNumber),
    constructionPeriod: normalizeText(snapshotSource.constructionPeriod),
    constructionAmount: normalizeText(snapshotSource.constructionAmount),
    siteManagerName: normalizeText(snapshotSource.siteManagerName),
    siteContactEmail: normalizeText(snapshotSource.siteContactEmail),
    siteAddress: normalizeText(snapshotSource.siteAddress),
    companyName: normalizeText(snapshotSource.companyName),
    corporationRegistrationNumber: normalizeText(snapshotSource.corporationRegistrationNumber),
    businessRegistrationNumber: normalizeText(snapshotSource.businessRegistrationNumber),
    licenseNumber: normalizeText(snapshotSource.licenseNumber),
    headquartersContact: normalizeText(snapshotSource.headquartersContact),
    headquartersAddress: normalizeText(snapshotSource.headquartersAddress),
  });
  const timestamp = createTimestamp();

  return {
    id: normalizeText(source.id) || generateId('site'),
    title: normalizeText(source.title) || snapshot.siteName || snapshot.customerName || '현장',
    customerName: snapshot.customerName,
    siteName: snapshot.siteName,
    assigneeName: snapshot.assigneeName,
    adminSiteSnapshot: snapshot,
    createdAt: normalizeTimestamp(source.createdAt, timestamp),
    updatedAt: normalizeTimestamp(source.updatedAt, timestamp),
  };
}

export function createInspectionSession(
  options: {
    meta?: Partial<InspectionReportMeta>;
    adminSiteSnapshot?: Partial<AdminSiteSnapshot>;
    document13Cases?: CaseFeedItem[];
    document14SafetyInfos?: SafetyInfoItem[];
  } = {},
  siteKey = UNTITLED_SITE_KEY,
  reportNumber = 1
): InspectionSession {
  const timestamp = createTimestamp();
  const adminSiteSnapshot = createEmptyAdminSiteSnapshot(options.adminSiteSnapshot);
  const meta: InspectionReportMeta = {
    siteName: options.meta?.siteName ?? adminSiteSnapshot.siteName,
    reportDate: options.meta?.reportDate ?? new Date().toISOString().slice(0, 10),
    drafter: options.meta?.drafter ?? adminSiteSnapshot.assigneeName,
    reviewer: options.meta?.reviewer ?? '',
    approver: options.meta?.approver ?? '',
  };

  const session: InspectionSession = {
    id: generateId('session'),
    siteKey,
    reportNumber,
    currentSection: 'doc1',
    meta,
    adminSiteSnapshot,
    documentsMeta: createDocumentMetaMap(),
    document2Overview: createTechnicalGuidanceOverview(
      {
        guidanceDate: meta.reportDate,
        assignee: meta.drafter,
      },
      adminSiteSnapshot
    ),
    document3Scenes: [
      createSiteScenePhoto('현장 전경 1'),
      createSiteScenePhoto('현장 전경 2'),
    ],
    document4FollowUps: [
      createPreviousGuidanceFollowUpItem({ confirmationDate: meta.reportDate }),
      createPreviousGuidanceFollowUpItem({ confirmationDate: meta.reportDate }),
      createPreviousGuidanceFollowUpItem({ confirmationDate: meta.reportDate }),
    ],
    document5Summary: createHazardSummaryDocument(),
    document6Measures: FATAL_ACCIDENT_MEASURE_LIBRARY.map((item) =>
      createFatalAccidentMeasureItem(item.key)
    ),
    document7Findings: [createCurrentHazardFinding({ inspector: meta.drafter })],
    document8Plans: [createFutureProcessRiskPlan()],
    document9SafetyChecks: createSafetyCheckDocument(),
    document10Measurements: [
      createMeasurementCheckItem(),
      createMeasurementCheckItem(),
      createMeasurementCheckItem(),
    ],
    document11EducationRecords: [createSafetyEducationRecord()],
    document12Activities: [createActivityRecord()],
    document13Cases: (options.document13Cases ?? DEFAULT_CASE_FEED).map((item) => ({ ...item })),
    document14SafetyInfos: (options.document14SafetyInfos ?? DEFAULT_SAFETY_INFOS).map((item) => ({
      ...item,
    })),
    createdAt: timestamp,
    updatedAt: timestamp,
    lastSavedAt: null,
  };

  return finalizeInspectionSession(session);
}

function normalizeScenePhoto(raw: unknown, index: number): SiteScenePhoto {
  const source = asRecord(raw);
  return createSiteScenePhoto(`현장 전경 ${index + 1}`, {
    id: normalizeText(source.id) || generateId('scene'),
    title: normalizeText(source.title) || `현장 전경 ${index + 1}`,
    photoUrl: normalizeText(source.photoUrl),
    description: normalizeText(source.description),
  });
}

function normalizeFollowUpItem(
  raw: unknown,
  fallbackDate: string
): PreviousGuidanceFollowUpItem {
  const source = asRecord(raw);
  return createPreviousGuidanceFollowUpItem({
    id: normalizeText(source.id) || generateId('follow-up'),
    sourceSessionId: normalizeText(source.sourceSessionId) || undefined,
    sourceFindingId:
      normalizeText(source.sourceFindingId || source.sourceHazardId) || undefined,
    location:
      normalizeText(source.location) ||
      normalizeText(source.locationDetail) ||
      normalizeText(source.title),
    guidanceDate:
      normalizeText(source.guidanceDate) ||
      normalizeText(source.inspectionDate) ||
      '',
    confirmationDate:
      normalizeText(source.confirmationDate) || normalizeText(fallbackDate),
    beforePhotoUrl:
      normalizeText(source.beforePhotoUrl) ||
      normalizeText(source.photoUrl) ||
      normalizeText(source.previousPhotoUrl),
    afterPhotoUrl:
      normalizeText(source.afterPhotoUrl) ||
      normalizeText(source.currentPhotoUrl),
    result:
      normalizeText(source.result) ||
      normalizeText(source.implementationResult),
  });
}

function normalizeHazardFinding(
  raw: unknown,
  fallbackInspector: string
): CurrentHazardFinding {
  const source = asRecord(raw);
  const likelihood = normalizeText(source.likelihood);
  const severity = normalizeText(source.severity);
  const legalReferenceId = normalizeText(source.legalReferenceId);
  const matchedReference = LEGAL_REFERENCE_LIBRARY.find(
    (item) => item.id === legalReferenceId
  );

  return createCurrentHazardFinding({
    id: normalizeText(source.id) || generateId('finding'),
    photoUrl: normalizeText(source.photoUrl),
    location:
      normalizeText(source.location) ||
      normalizeText(source.locationDetail) ||
      normalizeText(source.title),
    likelihood,
    severity,
    riskLevel: normalizeRiskLevel(
      likelihood,
      severity,
      normalizeText(source.riskLevel || source.riskAssessmentResult)
    ),
    accidentType:
      normalizeText(source.accidentType) || normalizeText(source.location),
    causativeAgentKey:
      (normalizeText(source.causativeAgentKey) as CausativeAgentKey) || '',
    inspector: normalizeText(source.inspector) || fallbackInspector,
    emphasis:
      normalizeText(source.emphasis) || normalizeText(source.hazardFactors),
    improvementPlan:
      normalizeText(source.improvementPlan) ||
      normalizeText(source.improvementItems),
    legalReferenceId,
    legalReferenceTitle:
      normalizeText(source.legalReferenceTitle) ||
      normalizeText(source.legalInfo) ||
      matchedReference?.title ||
      '',
    referenceMaterial1:
      normalizeText(source.referenceMaterial1) ||
      matchedReference?.referenceMaterial1 ||
      '',
    referenceMaterial2:
      normalizeText(source.referenceMaterial2) ||
      matchedReference?.referenceMaterial2 ||
      '',
    carryForward: normalizeBoolean(source.carryForward),
    metadata: normalizeText(source.metadata) || undefined,
  });
}

function normalizeFuturePlan(raw: unknown): FutureProcessRiskPlan {
  const source = asRecord(raw);
  return createFutureProcessRiskPlan({
    id: normalizeText(source.id) || generateId('future-plan'),
    processName:
      normalizeText(source.processName) || normalizeText(source.locationDetail),
    hazard:
      normalizeText(source.hazard) || normalizeText(source.hazardFactors),
    countermeasure:
      normalizeText(source.countermeasure) ||
      normalizeText(source.improvementItems),
    note: normalizeText(source.note) || normalizeText(source.legalInfo),
    source: normalizeText(source.source) === 'api' ? 'api' : 'manual',
  });
}

function normalizeQuestion(
  raw: unknown,
  prompt: string,
  prefix: string,
  index: number
): ChecklistQuestion {
  const source = asRecord(raw);
  const rating = normalizeText(source.rating);

  return {
    id: normalizeText(source.id) || generateId(`${prefix}-${index + 1}`),
    prompt: normalizeText(source.prompt) || prompt,
    rating:
      rating === 'good' || rating === 'average' || rating === 'poor' ? rating : '',
    note: normalizeText(source.note || source.remark),
  };
}

function normalizeSafetyCheckDocument(raw: unknown): SafetyCheckDocument {
  const source = asRecord(raw);
  const tbm = Array.isArray(source.tbm) ? source.tbm : [];
  const riskAssessment = Array.isArray(source.riskAssessment)
    ? source.riskAssessment
    : [];

  return {
    tbm: TBM_QUESTION_PROMPTS.map((prompt, index) =>
      normalizeQuestion(tbm[index], prompt, 'tbm', index)
    ),
    riskAssessment: RISK_ASSESSMENT_QUESTION_PROMPTS.map((prompt, index) =>
      normalizeQuestion(riskAssessment[index], prompt, 'risk-assessment', index)
    ),
  };
}

function normalizeMeasurement(raw: unknown): MeasurementCheckItem {
  const source = asRecord(raw);

  return createMeasurementCheckItem({
    id: normalizeText(source.id) || generateId('measurement'),
    instrumentType: normalizeText(source.instrumentType) || '조도계',
    measurementLocation:
      normalizeText(source.measurementLocation) ||
      normalizeText(source.measurementLocationDetail) ||
      normalizeText(source.measurementLocationValue) ||
      normalizeText(source.measurementLocationName),
    measuredValue:
      normalizeText(source.measuredValue) || normalizeText(source.measurementValue),
    safetyCriteria:
      normalizeText(source.safetyCriteria) ||
      normalizeText(source.measurementCriteria) ||
      DEFAULT_MEASUREMENT_CRITERIA,
    actionTaken:
      normalizeText(source.actionTaken) ||
      normalizeText(source.actionStatus) ||
      normalizeText(source.suitability),
  });
}

function normalizeEducationRecord(raw: unknown): SafetyEducationRecord {
  const source = asRecord(raw);

  return createSafetyEducationRecord({
    id: normalizeText(source.id) || generateId('education'),
    photoUrl: normalizeText(source.photoUrl),
    materialUrl: normalizeText(source.materialUrl),
    materialName:
      normalizeText(source.materialName) ||
      normalizeText(source.providedKinds) ||
      normalizeText(source.supportItem),
    attendeeCount:
      normalizeText(source.attendeeCount) ||
      normalizeText(source.participantCount),
    content:
      normalizeText(source.content) ||
      normalizeText(source.educationContent) ||
      normalizeText(source.details),
  });
}

function normalizeActivity(raw: unknown): ActivityRecord {
  const source = asRecord(raw);

  return createActivityRecord({
    id: normalizeText(source.id) || generateId('activity'),
    photoUrl: normalizeText(source.photoUrl),
    activityType:
      normalizeText(source.activityType) ||
      normalizeText(source.supportItem) ||
      ACTIVITY_TYPE_OPTIONS[0],
    content: normalizeText(source.content) || normalizeText(source.details),
  });
}

function normalizeCaseFeedItem(raw: unknown, fallback: CaseFeedItem): CaseFeedItem {
  const source = asRecord(raw);

  return {
    id: normalizeText(source.id) || fallback.id,
    title: normalizeText(source.title) || fallback.title,
    summary: normalizeText(source.summary) || fallback.summary,
    imageUrl: normalizeText(source.imageUrl) || fallback.imageUrl,
  };
}

function normalizeSafetyInfoItem(raw: unknown, fallback: SafetyInfoItem): SafetyInfoItem {
  const source = asRecord(raw);

  return {
    id: normalizeText(source.id) || fallback.id,
    title: normalizeText(source.title) || fallback.title,
    body: normalizeText(source.body) || fallback.body,
    imageUrl: normalizeText(source.imageUrl) || fallback.imageUrl,
  };
}

function normalizeDocumentMetaMap(
  raw: unknown
): Record<InspectionSectionKey, InspectionDocumentMeta> {
  const defaults = createDocumentMetaMap();
  const source = asRecord(raw);

  return INSPECTION_SECTIONS.reduce<Record<InspectionSectionKey, InspectionDocumentMeta>>(
    (accumulator, section) => {
      const item = asRecord(source[section.key]);
      const status = normalizeText(item.status);

      accumulator[section.key] = {
        status:
          status === 'completed' ||
          status === 'in_progress' ||
          status === 'not_started'
            ? status
            : defaults[section.key].status,
        lastEditedAt: normalizeText(item.lastEditedAt) || null,
        source:
          (normalizeText(item.source) as InspectionDocumentSource) ||
          defaults[section.key].source,
      };

      return accumulator;
    },
    defaults
  );
}

function buildAdminSiteSnapshotFromLegacy(raw: UnknownRecord): AdminSiteSnapshot {
  const cover = asRecord(raw.cover);

  return createEmptyAdminSiteSnapshot({
    customerName: normalizeText(cover.businessName),
    siteName:
      normalizeText(cover.projectName) ||
      normalizeText(cover.businessName) ||
      normalizeText(raw.title),
    assigneeName: normalizeText(cover.consultantName),
    siteAddress: normalizeText(cover.siteAddress),
    companyName: normalizeText(cover.contractorName),
  });
}

function createMeasuresFromKeys(keys: Iterable<CausativeAgentKey>): FatalAccidentMeasureItem[] {
  const selected = new Set(keys);
  return FATAL_ACCIDENT_MEASURE_LIBRARY.map((item) =>
    createFatalAccidentMeasureItem(item.key, selected.has(item.key))
  );
}

function deriveCausativeKeysFromLegacy(raw: UnknownRecord): Set<CausativeAgentKey> {
  const selected = new Set<CausativeAgentKey>();
  const siteOverview = asRecord(raw.siteOverview);
  const legacyAgents = asRecord(siteOverview.agents);

  FATAL_ACCIDENT_MEASURE_LIBRARY.forEach((item) => {
    if (normalizeBoolean(legacyAgents[item.key])) {
      selected.add(item.key);
    }
  });

  return selected;
}

function migrateLegacyInspectionSession(raw: unknown): InspectionSession {
  const source = asRecord(raw);
  const timestamp = createTimestamp();
  const adminSiteSnapshot = buildAdminSiteSnapshotFromLegacy(source);
  const cover = asRecord(source.cover);
  const supportItems = asRecord(source.supportItems);
  const technicalMaterials = Array.isArray(supportItems.technicalMaterials)
    ? supportItems.technicalMaterials
    : [];
  const equipmentChecks = Array.isArray(supportItems.equipmentChecks)
    ? supportItems.equipmentChecks
    : [];
  const educationSupports = Array.isArray(supportItems.educationSupports)
    ? supportItems.educationSupports
    : [];
  const otherSupports = Array.isArray(supportItems.otherSupports)
    ? supportItems.otherSupports
    : [];

  const session = createInspectionSession(
    {
      meta: {
        siteName: adminSiteSnapshot.siteName || adminSiteSnapshot.customerName,
        reportDate:
          normalizeText(cover.inspectionDate) ||
          new Date().toISOString().slice(0, 10),
        drafter:
          normalizeText(cover.consultantName) || adminSiteSnapshot.assigneeName,
      },
      adminSiteSnapshot,
    },
    normalizeText(source.siteKey) || UNTITLED_SITE_KEY,
    normalizeReportNumber(source.reportNumber) || 1
  );

  return {
    ...session,
    id: normalizeText(source.id) || session.id,
    currentSection: normalizeSectionKey(source.currentSection),
    document2Overview: createTechnicalGuidanceOverview(
      {
        guidanceDate: normalizeText(cover.inspectionDate) || session.meta.reportDate,
        assignee: normalizeText(cover.consultantName) || session.meta.drafter,
        processAndNotes:
          normalizeText(cover.processSummary) || normalizeText(cover.notes),
      },
      adminSiteSnapshot
    ),
    document3Scenes: [
      normalizeScenePhoto(
        asRecord(source.siteOverview).photoUrl
          ? {
              photoUrl: asRecord(source.siteOverview).photoUrl,
              description: normalizeText(cover.processSummary),
            }
          : {},
        0
      ),
      createSiteScenePhoto('현장 전경 2'),
    ],
    document4FollowUps: Array.isArray(source.previousGuidanceItems)
      ? source.previousGuidanceItems.map((item) =>
          normalizeFollowUpItem(item, session.meta.reportDate)
        )
      : session.document4FollowUps,
    document5Summary: createHazardSummaryDocument({
      summaryText: normalizeText(cover.notes),
    }),
    document6Measures: createMeasuresFromKeys(deriveCausativeKeysFromLegacy(source)),
    document7Findings:
      Array.isArray(source.currentHazards) && source.currentHazards.length > 0
        ? source.currentHazards.map((item) =>
            normalizeHazardFinding(item, session.meta.drafter)
          )
        : session.document7Findings,
    document8Plans:
      Array.isArray(source.futureProcessRisks) && source.futureProcessRisks.length > 0
        ? source.futureProcessRisks.map((item) => normalizeFuturePlan(item))
        : session.document8Plans,
    document9SafetyChecks: createSafetyCheckDocument(),
    document10Measurements:
      equipmentChecks.length > 0
        ? equipmentChecks.map((item) => normalizeMeasurement(item))
        : session.document10Measurements,
    document11EducationRecords:
      technicalMaterials.length > 0
        ? technicalMaterials.map((item) => normalizeEducationRecord(item))
        : session.document11EducationRecords,
    document12Activities:
      [...educationSupports, ...otherSupports].length > 0
        ? [...educationSupports, ...otherSupports].map((item) =>
            normalizeActivity(item)
          )
        : session.document12Activities,
    document13Cases: DEFAULT_CASE_FEED.map((item) => ({ ...item })),
    document14SafetyInfos: DEFAULT_SAFETY_INFOS.map((item) => ({ ...item })),
    createdAt: normalizeTimestamp(source.createdAt, timestamp),
    updatedAt: normalizeTimestamp(source.updatedAt, timestamp),
    lastSavedAt: normalizeText(source.lastSavedAt) || null,
  };
}

export function normalizeInspectionSession(raw: unknown): InspectionSession {
  const source = asRecord(raw);

  if (!('meta' in source) || !('adminSiteSnapshot' in source)) {
    return finalizeInspectionSession(migrateLegacyInspectionSession(raw));
  }

  const timestamp = createTimestamp();
  const adminSiteSnapshot = createEmptyAdminSiteSnapshot(
    asRecord(source.adminSiteSnapshot) as Partial<AdminSiteSnapshot>
  );
  const session = createInspectionSession(
    {
      meta: asRecord(source.meta) as Partial<InspectionReportMeta>,
      adminSiteSnapshot,
      document13Cases: DEFAULT_CASE_FEED,
      document14SafetyInfos: DEFAULT_SAFETY_INFOS,
    },
    normalizeText(source.siteKey) || UNTITLED_SITE_KEY,
    normalizeReportNumber(source.reportNumber) || 1
  );

  const document3Scenes = Array.isArray(source.document3Scenes)
    ? source.document3Scenes.map((item, index) => normalizeScenePhoto(item, index))
    : session.document3Scenes;
  const document13CasesSource = Array.isArray(source.document13Cases)
    ? source.document13Cases
    : [];
  const document14SafetyInfosSource = Array.isArray(source.document14SafetyInfos)
    ? source.document14SafetyInfos
    : [];
  while (document3Scenes.length < 2) {
    document3Scenes.push(
      createSiteScenePhoto(`현장 전경 ${document3Scenes.length + 1}`)
    );
  }

  const normalizedSession: InspectionSession = {
    ...session,
    id: normalizeText(source.id) || session.id,
    currentSection: normalizeSectionKey(source.currentSection),
    meta: {
      siteName: normalizeText(asRecord(source.meta).siteName) || session.meta.siteName,
      reportDate:
        normalizeText(asRecord(source.meta).reportDate) || session.meta.reportDate,
      drafter: normalizeText(asRecord(source.meta).drafter) || session.meta.drafter,
      reviewer: normalizeText(asRecord(source.meta).reviewer) || '',
      approver: normalizeText(asRecord(source.meta).approver) || '',
    },
    adminSiteSnapshot,
    documentsMeta: normalizeDocumentMetaMap(source.documentsMeta),
    document2Overview: createTechnicalGuidanceOverview(
      asRecord(source.document2Overview) as Partial<TechnicalGuidanceOverview>,
      adminSiteSnapshot
    ),
    document3Scenes,
    document4FollowUps:
      Array.isArray(source.document4FollowUps) && source.document4FollowUps.length > 0
        ? source.document4FollowUps.map((item) =>
            normalizeFollowUpItem(item, session.meta.reportDate)
          )
        : session.document4FollowUps,
    document5Summary: createHazardSummaryDocument(
      asRecord(source.document5Summary) as Partial<CurrentHazardSummaryDocument>
    ),
    document6Measures:
      Array.isArray(source.document6Measures) && source.document6Measures.length > 0
        ? source.document6Measures.map((item) => {
            const normalized = asRecord(item);
            const key = normalizeText(normalized.key) as CausativeAgentKey;
            return createFatalAccidentMeasureItem(
              key,
              normalizeBoolean(normalized.checked)
            );
          })
        : session.document6Measures,
    document7Findings:
      Array.isArray(source.document7Findings) && source.document7Findings.length > 0
        ? source.document7Findings.map((item) =>
            normalizeHazardFinding(item, normalizeText(asRecord(source.meta).drafter))
          )
        : session.document7Findings,
    document8Plans:
      Array.isArray(source.document8Plans) && source.document8Plans.length > 0
        ? source.document8Plans.map((item) => normalizeFuturePlan(item))
        : session.document8Plans,
    document9SafetyChecks: normalizeSafetyCheckDocument(source.document9SafetyChecks),
    document10Measurements:
      Array.isArray(source.document10Measurements) &&
      source.document10Measurements.length > 0
        ? source.document10Measurements.map((item) => normalizeMeasurement(item))
        : session.document10Measurements,
    document11EducationRecords:
      Array.isArray(source.document11EducationRecords) &&
      source.document11EducationRecords.length > 0
        ? source.document11EducationRecords.map((item) =>
            normalizeEducationRecord(item)
          )
        : session.document11EducationRecords,
    document12Activities:
      Array.isArray(source.document12Activities) &&
      source.document12Activities.length > 0
        ? source.document12Activities.map((item) => normalizeActivity(item))
        : session.document12Activities,
    document13Cases:
      document13CasesSource.length > 0
        ? DEFAULT_CASE_FEED.map((fallback, index) =>
            normalizeCaseFeedItem(document13CasesSource[index], fallback)
          )
        : DEFAULT_CASE_FEED.map((item) => ({ ...item })),
    document14SafetyInfos:
      document14SafetyInfosSource.length > 0
        ? DEFAULT_SAFETY_INFOS.map((fallback, index) =>
            normalizeSafetyInfoItem(document14SafetyInfosSource[index], fallback)
          )
        : DEFAULT_SAFETY_INFOS.map((item) => ({ ...item })),
    createdAt: normalizeTimestamp(source.createdAt, timestamp),
    updatedAt: normalizeTimestamp(source.updatedAt, timestamp),
    lastSavedAt: normalizeText(source.lastSavedAt) || null,
  };

  return finalizeInspectionSession(normalizedSession);
}

function hasFindingContent(item: CurrentHazardFinding): boolean {
  return Boolean(
    normalizeText(item.photoUrl) ||
      normalizeText(item.location) ||
      normalizeText(item.likelihood) ||
      normalizeText(item.severity) ||
      normalizeText(item.accidentType) ||
      normalizeText(item.causativeAgentKey) ||
      normalizeText(item.inspector) ||
      normalizeText(item.emphasis) ||
      normalizeText(item.improvementPlan) ||
      normalizeText(item.legalReferenceTitle)
  );
}

function hasFuturePlanContent(item: FutureProcessRiskPlan): boolean {
  return Boolean(
    normalizeText(item.processName) ||
      normalizeText(item.hazard) ||
      normalizeText(item.countermeasure) ||
      normalizeText(item.note)
  );
}

function hasMeasurementContent(item: MeasurementCheckItem): boolean {
  return Boolean(
    normalizeText(item.measurementLocation) ||
      normalizeText(item.measuredValue) ||
      normalizeText(item.actionTaken)
  );
}

function hasEducationContent(item: SafetyEducationRecord): boolean {
  return Boolean(
    normalizeText(item.photoUrl) ||
      normalizeText(item.materialUrl) ||
      normalizeText(item.materialName) ||
      normalizeText(item.attendeeCount) ||
      normalizeText(item.content)
  );
}

function hasActivityContent(item: ActivityRecord): boolean {
  return Boolean(
    normalizeText(item.photoUrl) ||
      normalizeText(item.activityType) ||
      normalizeText(item.content)
  );
}

function computeSectionStatus(
  session: InspectionSession,
  key: InspectionSectionKey,
  current: InspectionDocumentMeta
): InspectionDocumentMeta['status'] {
  if (key === 'doc13' || key === 'doc14') return 'completed';
  if (getSectionCompletion(session, key)) return 'completed';
  if (current.lastEditedAt) return 'in_progress';
  return 'not_started';
}

export function finalizeInspectionSession(session: InspectionSession): InspectionSession {
  const siteName =
    normalizeText(session.meta.siteName) || session.adminSiteSnapshot.siteName;

  return {
    ...session,
    meta: {
      ...session.meta,
      siteName,
    },
    documentsMeta: INSPECTION_SECTIONS.reduce<
      Record<InspectionSectionKey, InspectionDocumentMeta>
    >((accumulator, section) => {
      const current =
        session.documentsMeta[section.key] ??
        createDocumentMeta(DEFAULT_DOCUMENT_SOURCES[section.key]);

      accumulator[section.key] = {
        ...current,
        status: computeSectionStatus(session, section.key, current),
      };

      return accumulator;
    }, createDocumentMetaMap()),
  };
}

export function touchDocumentMeta(
  session: InspectionSession,
  key: InspectionSectionKey,
  source: InspectionDocumentSource
): InspectionSession {
  return finalizeInspectionSession({
    ...session,
    documentsMeta: {
      ...session.documentsMeta,
      [key]: {
        ...session.documentsMeta[key],
        source,
        lastEditedAt: createTimestamp(),
      },
    },
  });
}

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
    [...group]
      .sort((left, right) => {
        const created =
          new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
        if (created !== 0) return created;

        return new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime();
      })
      .forEach((session, index) => {
        nextNumberBySessionId.set(session.id, index + 1);
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
  if (reportDate) {
    return `${reportDate} 보고서 ${session.reportNumber}`;
  }

  return `${getSessionSiteTitle(session)} 보고서 ${session.reportNumber}`;
}

function hasChecklistProgress(questions: ChecklistQuestion[]): boolean {
  return questions.some((question) => Boolean(question.rating || question.note));
}

function getRequiredFollowUps(session: InspectionSession): PreviousGuidanceFollowUpItem[] {
  return session.document4FollowUps.filter(
    (item) => Boolean(item.sourceSessionId && item.sourceFindingId)
  );
}

export function getSectionCompletion(
  session: InspectionSession,
  section: InspectionSectionKey
): boolean {
  switch (section) {
    case 'doc1':
      return Boolean(
        session.adminSiteSnapshot.siteName || session.adminSiteSnapshot.companyName
      );
    case 'doc2':
      return Boolean(
        session.document2Overview.guidanceDate &&
          session.document2Overview.assignee &&
          session.document2Overview.processAndNotes
      );
    case 'doc3':
      return session.document3Scenes.every((item) => Boolean(item.photoUrl));
    case 'doc4': {
      const requiredItems = getRequiredFollowUps(session);
      if (requiredItems.length === 0) {
        return true;
      }

      return requiredItems.every((item) => Boolean(item.afterPhotoUrl || item.result));
    }
    case 'doc5':
      return Boolean(
        session.document7Findings.some((item) => hasFindingContent(item)) ||
          session.document5Summary.summaryText
      );
    case 'doc6':
      return session.document6Measures.some((item) => item.checked);
    case 'doc7':
      return session.document7Findings.some((item) => hasFindingContent(item));
    case 'doc8':
      return session.document8Plans.some((item) => hasFuturePlanContent(item));
    case 'doc9':
      return (
        hasChecklistProgress(session.document9SafetyChecks.tbm) &&
        hasChecklistProgress(session.document9SafetyChecks.riskAssessment)
      );
    case 'doc10':
      return session.document10Measurements.some((item) => hasMeasurementContent(item));
    case 'doc11':
      return session.document11EducationRecords.some((item) => hasEducationContent(item));
    case 'doc12':
      return session.document12Activities.some((item) => hasActivityContent(item));
    case 'doc13':
    case 'doc14':
      return true;
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

function createDerivedFollowUpKey(
  sourceSessionId: string,
  sourceFindingId: string
): string {
  return `${sourceSessionId}::${sourceFindingId}`;
}

export function buildDerivedFollowUpItems(
  session: InspectionSession,
  sessions: InspectionSession[]
): PreviousGuidanceFollowUpItem[] {
  const previousSession = sessions
    .filter(
      (item) =>
        item.id !== session.id &&
        getSessionSiteKey(item) === getSessionSiteKey(session) &&
        item.reportNumber < session.reportNumber
    )
    .sort((left, right) => right.reportNumber - left.reportNumber)[0];

  const manualItems = session.document4FollowUps.filter(
    (item) => !item.sourceSessionId || !item.sourceFindingId
  );

  if (!previousSession) {
    const nextItems = [...manualItems];
    while (nextItems.length < 3) {
      nextItems.push(
        createPreviousGuidanceFollowUpItem({
          confirmationDate: session.meta.reportDate,
        })
      );
    }
    return nextItems;
  }

  const existingByKey = new Map(
    session.document4FollowUps
      .filter((item) => item.sourceSessionId && item.sourceFindingId)
      .map((item) => [
        createDerivedFollowUpKey(item.sourceSessionId!, item.sourceFindingId!),
        item,
      ])
  );

  const derivedItems = previousSession.document7Findings
    .filter((item) => hasFindingContent(item) && item.carryForward)
    .map((item) => {
      const key = createDerivedFollowUpKey(previousSession.id, item.id);
      const existing = existingByKey.get(key);

      return createPreviousGuidanceFollowUpItem({
        id: existing?.id ?? generateId('follow-up'),
        sourceSessionId: previousSession.id,
        sourceFindingId: item.id,
        location: item.location,
        guidanceDate: previousSession.meta.reportDate,
        confirmationDate: existing?.confirmationDate || session.meta.reportDate,
        beforePhotoUrl: item.photoUrl,
        afterPhotoUrl: existing?.afterPhotoUrl || '',
        result: existing?.result || '',
      });
    });

  const nextItems = [
    ...derivedItems,
    ...manualItems,
  ];

  while (nextItems.length < 3) {
    nextItems.push(
      createPreviousGuidanceFollowUpItem({
        confirmationDate: session.meta.reportDate,
      })
    );
  }

  return nextItems;
}

export function areFollowUpItemsEqual(
  left: PreviousGuidanceFollowUpItem[],
  right: PreviousGuidanceFollowUpItem[]
): boolean {
  if (left.length !== right.length) return false;

  return left.every((item, index) => {
    const other = right[index];
    if (!other) return false;

    return (
      item.id === other.id &&
      item.sourceSessionId === other.sourceSessionId &&
      item.sourceFindingId === other.sourceFindingId &&
      item.location === other.location &&
      item.guidanceDate === other.guidanceDate &&
      item.confirmationDate === other.confirmationDate &&
      item.beforePhotoUrl === other.beforePhotoUrl &&
      item.afterPhotoUrl === other.afterPhotoUrl &&
      item.result === other.result
    );
  });
}

export function getRecommendedCausativeAgentKeys(
  findings: CurrentHazardFinding[]
): Set<CausativeAgentKey> {
  return new Set(
    findings
      .map((item) => item.causativeAgentKey)
      .filter((item): item is CausativeAgentKey => Boolean(item))
  );
}
