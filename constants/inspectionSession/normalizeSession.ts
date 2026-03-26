import {
  DEFAULT_CASE_FEED,
  DEFAULT_SAFETY_INFOS,
  TOTAL_SCENE_COUNT,
  UNTITLED_SITE_KEY,
} from '@/constants/inspectionSession/catalog';
import { createFatalAccidentMeasureItem, createSiteScenePhoto } from '@/constants/inspectionSession/itemFactory';
import { migrateLegacyInspectionSession } from '@/constants/inspectionSession/legacy';
import {
  normalizeActivity,
  normalizeDocumentMetaMap,
  normalizeEducationRecord,
  normalizeFollowUpItem,
  normalizeFuturePlan,
  normalizeHazardFinding,
  normalizeMeasurement,
  normalizeSafetyCheckDocument,
  normalizeSafetyInfos,
  normalizeCases,
  normalizeScenePhoto,
} from '@/constants/inspectionSession/normalizeParts';
import { getSceneSlotTitle } from '@/constants/inspectionSession/scenePhotos';
import { createInspectionSession } from '@/constants/inspectionSession/sessionFactory';
import { finalizeInspectionSession } from '@/constants/inspectionSession/sessionState';
import {
  asRecord,
  createEmptyAdminSiteSnapshot,
  createTimestamp,
  createWorkPlanChecks,
  normalizeBoolean,
  normalizeReportNumber,
  normalizeSectionKey,
  normalizeText,
  normalizeTimestamp,
} from '@/constants/inspectionSession/shared';
import type { CausativeAgentKey } from '@/types/siteOverview';
import type {
  AdminSiteSnapshot,
  CurrentHazardSummaryDocument,
  InspectionReportMeta,
  InspectionSession,
  TechnicalGuidanceOverview,
} from '@/types/inspectionSession';

function normalizeAccidentOccurred(value: unknown): 'yes' | 'no' {
  return value === 'yes' ? 'yes' : 'no';
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
  while (document3Scenes.length < TOTAL_SCENE_COUNT) {
    document3Scenes.push(createSiteScenePhoto(getSceneSlotTitle(document3Scenes.length)));
  }

  const doc2Partial = asRecord(source.document2Overview) as Partial<TechnicalGuidanceOverview>;

  const normalizedSession: InspectionSession = {
    ...session,
    id: normalizeText(source.id) || session.id,
    currentSection: normalizeSectionKey(source.currentSection),
    meta: {
      siteName: normalizeText(asRecord(source.meta).siteName) || session.meta.siteName,
      reportDate: normalizeText(asRecord(source.meta).reportDate) || session.meta.reportDate,
      drafter: normalizeText(asRecord(source.meta).drafter) || session.meta.drafter,
      reviewer: normalizeText(asRecord(source.meta).reviewer) || '',
      approver: normalizeText(asRecord(source.meta).approver) || '',
    },
    adminSiteSnapshot,
    documentsMeta: normalizeDocumentMetaMap(source.documentsMeta),
    document2Overview: {
      ...session.document2Overview,
      ...doc2Partial,
      accidentOccurred: normalizeAccidentOccurred(
        doc2Partial.accidentOccurred ?? session.document2Overview.accidentOccurred
      ),
      workPlanChecks: createWorkPlanChecks({
        ...session.document2Overview.workPlanChecks,
        ...(doc2Partial.workPlanChecks ?? {}),
      }),
    },
    document3Scenes,
    document4FollowUps: Array.isArray(source.document4FollowUps) && source.document4FollowUps.length > 0
      ? source.document4FollowUps.map((item) => normalizeFollowUpItem(item, session.meta.reportDate))
      : session.document4FollowUps,
    document5Summary: { summaryText: normalizeText(asRecord(source.document5Summary).summaryText) } as CurrentHazardSummaryDocument,
    document6Measures: Array.isArray(source.document6Measures) && source.document6Measures.length > 0
      ? source.document6Measures.map((item) => {
          const normalized = asRecord(item);
          return createFatalAccidentMeasureItem(
            normalizeText(normalized.key) as CausativeAgentKey,
            normalizeBoolean(normalized.checked)
          );
        })
      : session.document6Measures,
    document7Findings: Array.isArray(source.document7Findings) && source.document7Findings.length > 0
      ? source.document7Findings.map((item) => normalizeHazardFinding(item, normalizeText(asRecord(source.meta).drafter)))
      : session.document7Findings,
    document8Plans: Array.isArray(source.document8Plans) && source.document8Plans.length > 0
      ? source.document8Plans.map((item) => normalizeFuturePlan(item))
      : session.document8Plans,
    document9SafetyChecks: normalizeSafetyCheckDocument(source.document9SafetyChecks),
    document10Measurements: Array.isArray(source.document10Measurements) && source.document10Measurements.length > 0
      ? source.document10Measurements.map((item) => normalizeMeasurement(item))
      : session.document10Measurements,
    document11EducationRecords: Array.isArray(source.document11EducationRecords) && source.document11EducationRecords.length > 0
      ? source.document11EducationRecords.map((item) => normalizeEducationRecord(item))
      : session.document11EducationRecords,
    document12Activities: Array.isArray(source.document12Activities) && source.document12Activities.length > 0
      ? source.document12Activities.map((item) => normalizeActivity(item))
      : session.document12Activities,
    document13Cases: normalizeCases(Array.isArray(source.document13Cases) ? source.document13Cases : []),
    document14SafetyInfos: normalizeSafetyInfos(Array.isArray(source.document14SafetyInfos) ? source.document14SafetyInfos : []),
    createdAt: normalizeTimestamp(source.createdAt, timestamp),
    updatedAt: normalizeTimestamp(source.updatedAt, timestamp),
    lastSavedAt: normalizeText(source.lastSavedAt) || null,
  };

  return finalizeInspectionSession(normalizedSession);
}

