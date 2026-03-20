import {
  DEFAULT_CASE_FEED,
  DEFAULT_SAFETY_INFOS,
  FIXED_SCENE_COUNT,
  FATAL_ACCIDENT_MEASURE_LIBRARY,
  UNTITLED_SITE_KEY,
} from '@/constants/inspectionSession/catalog';
import {
  createCurrentHazardFinding,
  createFatalAccidentMeasureItem,
  createSiteScenePhoto,
} from '@/constants/inspectionSession/itemFactory';
import { createInspectionSession } from '@/constants/inspectionSession/sessionFactory';
import {
  asRecord,
  createEmptyAdminSiteSnapshot,
  createTimestamp,
  normalizeBoolean,
  normalizeReportNumber,
  normalizeSectionKey,
  normalizeText,
  normalizeTimestamp,
  type UnknownRecord,
} from '@/constants/inspectionSession/shared';
import type { CausativeAgentKey } from '@/types/siteOverview';
import type { AdminSiteSnapshot, InspectionSession } from '@/types/inspectionSession';
import {
  normalizeActivity,
  normalizeEducationRecord,
  normalizeFollowUpItem,
  normalizeFuturePlan,
  normalizeHazardFinding,
  normalizeMeasurement,
} from './normalizeParts';

function buildAdminSiteSnapshotFromLegacy(raw: UnknownRecord): AdminSiteSnapshot {
  const cover = asRecord(raw.cover);
  return createEmptyAdminSiteSnapshot({
    customerName: normalizeText(cover.businessName),
    siteName: normalizeText(cover.projectName) || normalizeText(cover.businessName) || normalizeText(raw.title),
    assigneeName: normalizeText(cover.consultantName),
    siteAddress: normalizeText(cover.siteAddress),
    companyName: normalizeText(cover.contractorName),
  });
}

function createMeasuresFromKeys(keys: Iterable<CausativeAgentKey>) {
  const selected = new Set(keys);
  return FATAL_ACCIDENT_MEASURE_LIBRARY.map((item) =>
    createFatalAccidentMeasureItem(item.key, selected.has(item.key))
  );
}

function deriveCausativeKeysFromLegacy(raw: UnknownRecord): Set<CausativeAgentKey> {
  const selected = new Set<CausativeAgentKey>();
  const legacyAgents = asRecord(asRecord(raw.siteOverview).agents);
  FATAL_ACCIDENT_MEASURE_LIBRARY.forEach((item) => {
    if (normalizeBoolean(legacyAgents[item.key])) selected.add(item.key);
  });
  return selected;
}

export function migrateLegacyInspectionSession(raw: unknown): InspectionSession {
  const source = asRecord(raw);
  const timestamp = createTimestamp();
  const adminSiteSnapshot = buildAdminSiteSnapshotFromLegacy(source);
  const cover = asRecord(source.cover);
  const supportItems = asRecord(source.supportItems);
  const technicalMaterials = Array.isArray(supportItems.technicalMaterials) ? supportItems.technicalMaterials : [];
  const equipmentChecks = Array.isArray(supportItems.equipmentChecks) ? supportItems.equipmentChecks : [];
  const educationSupports = Array.isArray(supportItems.educationSupports) ? supportItems.educationSupports : [];
  const otherSupports = Array.isArray(supportItems.otherSupports) ? supportItems.otherSupports : [];

  const session = createInspectionSession(
    {
      meta: {
        siteName: adminSiteSnapshot.siteName || adminSiteSnapshot.customerName,
        reportDate: normalizeText(cover.inspectionDate) || new Date().toISOString().slice(0, 10),
        drafter: normalizeText(cover.consultantName) || adminSiteSnapshot.assigneeName,
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
    document2Overview: {
      ...session.document2Overview,
      guidanceDate: normalizeText(cover.inspectionDate) || session.meta.reportDate,
      assignee: normalizeText(cover.consultantName) || session.meta.drafter,
      processAndNotes: normalizeText(cover.processSummary) || normalizeText(cover.notes),
    },
    document3Scenes: [
      ((overview) =>
        overview.photoUrl
          ? createSiteScenePhoto('현장 전경 1', {
              photoUrl: normalizeText(overview.photoUrl),
              description: normalizeText(cover.processSummary),
            })
          : createSiteScenePhoto('현장 전경 1'))(asRecord(source.siteOverview)),
      ...Array.from({ length: FIXED_SCENE_COUNT - 1 }, (_, index) =>
        createSiteScenePhoto(`현장 전경 ${index + 2}`)
      ),
    ],
    document4FollowUps: Array.isArray(source.previousGuidanceItems)
      ? source.previousGuidanceItems.map((item) => normalizeFollowUpItem(item, session.meta.reportDate))
      : session.document4FollowUps,
    document5Summary: { summaryText: normalizeText(cover.notes) },
    document6Measures: createMeasuresFromKeys(deriveCausativeKeysFromLegacy(source)),
    document7Findings: Array.isArray(source.currentHazards) && source.currentHazards.length > 0
      ? source.currentHazards.map((item) => normalizeHazardFinding(item, session.meta.drafter))
      : [createCurrentHazardFinding({ inspector: session.meta.drafter })],
    document8Plans: Array.isArray(source.futureProcessRisks) && source.futureProcessRisks.length > 0
      ? source.futureProcessRisks.map((item) => normalizeFuturePlan(item))
      : session.document8Plans,
    document9SafetyChecks: session.document9SafetyChecks,
    document10Measurements: equipmentChecks.length > 0
      ? equipmentChecks.map((item) => normalizeMeasurement(item))
      : session.document10Measurements,
    document11EducationRecords: technicalMaterials.length > 0
      ? technicalMaterials.map((item) => normalizeEducationRecord(item))
      : session.document11EducationRecords,
    document12Activities: [...educationSupports, ...otherSupports].length > 0
      ? [...educationSupports, ...otherSupports].map((item) => normalizeActivity(item))
      : session.document12Activities,
    document13Cases: DEFAULT_CASE_FEED.map((item) => ({ ...item })),
    document14SafetyInfos: DEFAULT_SAFETY_INFOS.map((item) => ({ ...item })),
    createdAt: normalizeTimestamp(source.createdAt, timestamp),
    updatedAt: normalizeTimestamp(source.updatedAt, timestamp),
    lastSavedAt: normalizeText(source.lastSavedAt) || null,
  };
}
