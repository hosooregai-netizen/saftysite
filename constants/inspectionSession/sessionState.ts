import {
  DEFAULT_DOCUMENT_SOURCES,
  INSPECTION_SECTIONS,
  TOTAL_SCENE_COUNT,
} from '@/constants/inspectionSession/catalog';
import { padDocument12Activities } from '@/constants/inspectionSession/itemFactory';
import { createDocumentMeta, createDocumentMetaMap, createTimestamp, normalizeText } from '@/constants/inspectionSession/shared';
import type {
  ActivityRecord,
  ChecklistQuestion,
  CurrentHazardFinding,
  FutureProcessRiskPlan,
  InspectionDocumentMeta,
  InspectionDocumentSource,
  InspectionSectionKey,
  InspectionSession,
  MeasurementCheckItem,
  PreviousGuidanceFollowUpItem,
  SafetyEducationRecord,
} from '@/types/inspectionSession';

function hasChecklistProgress(questions: ChecklistQuestion[]): boolean {
  return questions.some((question) => Boolean(question.rating || question.note));
}

function hasFindingContent(item: CurrentHazardFinding): boolean {
  return Boolean(item.photoUrl || item.photoUrl2 || item.location || item.likelihood || item.severity || item.accidentType || item.causativeAgentKey || item.inspector || item.emphasis || item.improvementPlan || item.legalReferenceTitle);
}

function hasFuturePlanContent(item: FutureProcessRiskPlan): boolean {
  return Boolean(item.processName || item.hazard || item.countermeasure || item.note);
}

function hasMeasurementContent(item: MeasurementCheckItem): boolean {
  return Boolean(
    item.photoUrl ||
      item.measurementLocation ||
      item.measuredValue ||
      item.actionTaken,
  );
}

function hasEducationContent(item: SafetyEducationRecord): boolean {
  return Boolean(
    item.photoUrl || item.materialUrl || item.materialName || item.attendeeCount || item.topic || item.content,
  );
}

function hasActivityContent(item: ActivityRecord): boolean {
  return Boolean(item.photoUrl || item.activityType || item.content);
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
      return Boolean(session.adminSiteSnapshot.siteName || session.adminSiteSnapshot.companyName);
    case 'doc2':
      return Boolean(session.document2Overview.guidanceDate && session.document2Overview.assignee && session.document2Overview.processAndNotes);
    case 'doc3':
      return session.document3Scenes.slice(0, TOTAL_SCENE_COUNT).every((item) => Boolean(item.photoUrl));
    case 'doc4': {
      const requiredItems = getRequiredFollowUps(session);
      return requiredItems.length === 0 || requiredItems.every((item) => Boolean(item.afterPhotoUrl || item.result));
    }
    case 'doc5':
      return Boolean(session.document7Findings.some((item) => hasFindingContent(item)) || session.document5Summary.summaryText);
    case 'doc6':
      return session.document6Measures.some((item) => item.checked);
    case 'doc7':
      return session.document7Findings.some((item) => hasFindingContent(item));
    case 'doc8':
      return session.document8Plans.some((item) => hasFuturePlanContent(item));
    case 'doc9':
      return hasChecklistProgress(session.document9SafetyChecks.tbm) && hasChecklistProgress(session.document9SafetyChecks.riskAssessment);
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
  const siteName = normalizeText(session.meta.siteName) || session.adminSiteSnapshot.siteName;
  const normalized: InspectionSession = {
    ...session,
    document12Activities: padDocument12Activities(session.document12Activities),
  };

  return {
    ...normalized,
    meta: { ...normalized.meta, siteName },
    documentsMeta: INSPECTION_SECTIONS.reduce<Record<InspectionSectionKey, InspectionDocumentMeta>>((accumulator, section) => {
      const current = normalized.documentsMeta[section.key] ?? createDocumentMeta(DEFAULT_DOCUMENT_SOURCES[section.key]);
      accumulator[section.key] = { ...current, status: computeSectionStatus(normalized, section.key, current) };
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
