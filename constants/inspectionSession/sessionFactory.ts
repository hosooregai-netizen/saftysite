import {
  DEFAULT_CASE_FEED,
  DEFAULT_CONSTRUCTION_TYPE,
  DEFAULT_GUIDANCE_AGENCY,
  DEFAULT_SAFETY_INFOS,
  RISK_ASSESSMENT_QUESTION_PROMPTS,
  TBM_QUESTION_PROMPTS,
  TOTAL_SCENE_COUNT,
  UNTITLED_SITE_KEY,
} from '@/constants/inspectionSession/catalog';
import {
  createActivityRecord,
  createCurrentHazardFinding,
  createFatalAccidentMeasureItem,
  createFutureProcessRiskPlan,
  createMeasurementCheckItem,
  createSafetyEducationRecord,
  createSiteScenePhoto,
} from '@/constants/inspectionSession/itemFactory';
import {
  createChecklistQuestions,
  createDocumentMetaMap,
  createEmptyAdminSiteSnapshot,
  createTimestamp,
  createWorkPlanChecks,
  generateId,
} from '@/constants/inspectionSession/shared';
import { getSceneSlotTitle } from './scenePhotos';
import { FATAL_ACCIDENT_MEASURE_LIBRARY } from './catalog';
import type {
  AdminSiteSnapshot,
  CaseFeedItem,
  CurrentHazardSummaryDocument,
  InspectionReportMeta,
  InspectionSession,
  InspectionSite,
  SafetyCheckDocument,
  SafetyInfoItem,
  TechnicalGuidanceRelations,
  TechnicalGuidanceOverview,
} from '@/types/inspectionSession';
import { finalizeInspectionSession } from './sessionState';

function createDefaultScenePhotos() {
  return Array.from({ length: TOTAL_SCENE_COUNT }, (_, index) =>
    createSiteScenePhoto(getSceneSlotTitle(index))
  );
}

function createTechnicalGuidanceOverview(
  initial: Partial<TechnicalGuidanceOverview> = {},
  snapshot: AdminSiteSnapshot = createEmptyAdminSiteSnapshot()
): TechnicalGuidanceOverview {
  return {
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
    accidentOccurred: 'no',
    recentAccidentDate: '',
    accidentType: '',
    accidentSummary: '',
    processAndNotes: '',
    ...initial,
    workPlanChecks: createWorkPlanChecks(initial.workPlanChecks),
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

function createHazardSummaryDocument(
  initial: Partial<CurrentHazardSummaryDocument> = {}
): CurrentHazardSummaryDocument {
  return { summaryText: '', ...initial };
}

export function createEmptyTechnicalGuidanceRelations(
  initial: Partial<TechnicalGuidanceRelations> = {},
): TechnicalGuidanceRelations {
  return {
    computedAt: null,
    projectionVersion: 0,
    stale: false,
    recomputeStatus: 'fresh',
    sourceReportKeys: [],
    cumulativeAccidentEntries: [],
    cumulativeAgentEntries: [],
    ...initial,
  };
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
    headquarterId: '',
    title: snapshot.siteName || snapshot.customerName || '현장',
    customerName: snapshot.customerName,
    siteName: snapshot.siteName,
    assigneeName: snapshot.assigneeName,
    adminSiteSnapshot: snapshot,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createInspectionSession(
  options: {
    meta?: Partial<InspectionReportMeta>;
    adminSiteSnapshot?: Partial<AdminSiteSnapshot>;
    document13Cases?: CaseFeedItem[];
    document14SafetyInfos?: SafetyInfoItem[];
    document4FollowUps?: InspectionSession['document4FollowUps'];
    technicalGuidanceRelations?: Partial<TechnicalGuidanceRelations>;
  } = {},
  siteKey = UNTITLED_SITE_KEY,
  reportNumber = 1
): InspectionSession {
  const timestamp = createTimestamp();
  const adminSiteSnapshot = createEmptyAdminSiteSnapshot(options.adminSiteSnapshot);
  const meta: InspectionReportMeta = {
    siteName: options.meta?.siteName ?? adminSiteSnapshot.siteName,
    reportDate: options.meta?.reportDate ?? new Date().toISOString().slice(0, 10),
    reportTitle: options.meta?.reportTitle ?? '',
    drafter: options.meta?.drafter ?? adminSiteSnapshot.assigneeName,
    reviewer: options.meta?.reviewer ?? '',
    approver: options.meta?.approver ?? '',
  };

  return finalizeInspectionSession({
    id: generateId('session'),
    siteKey,
    reportNumber,
    currentSection: 'doc1',
    meta,
    controllerReview: null,
    adminSiteSnapshot,
    documentsMeta: createDocumentMetaMap(),
    document2Overview: createTechnicalGuidanceOverview(
      {
        guidanceDate: meta.reportDate,
        visitCount: String(reportNumber),
        assignee: meta.drafter,
      },
      adminSiteSnapshot
    ),
    document3Scenes: createDefaultScenePhotos(),
    document4FollowUps: options.document4FollowUps?.map((item) => ({ ...item })) ?? [],
    document5Summary: createHazardSummaryDocument(),
    document6Measures: FATAL_ACCIDENT_MEASURE_LIBRARY.map((item) =>
      createFatalAccidentMeasureItem(item.key)
    ),
    document7Findings: [createCurrentHazardFinding({ inspector: meta.drafter })],
    document8Plans: [createFutureProcessRiskPlan()],
    document9SafetyChecks: createSafetyCheckDocument(),
    document10Measurements: Array.from({ length: 3 }, () => createMeasurementCheckItem()),
    document11EducationRecords: [createSafetyEducationRecord()],
    document12Activities: Array.from({ length: 4 }, () => createActivityRecord()),
    document13Cases: (options.document13Cases ?? DEFAULT_CASE_FEED).map((item) => ({ ...item })),
    document14SafetyInfos: (options.document14SafetyInfos ?? DEFAULT_SAFETY_INFOS).map((item) => ({ ...item })),
    technicalGuidanceRelations: createEmptyTechnicalGuidanceRelations(
      options.technicalGuidanceRelations,
    ),
    createdAt: timestamp,
    updatedAt: timestamp,
    lastSavedAt: null,
  });
}
