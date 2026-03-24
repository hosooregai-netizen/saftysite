import {
  ACTIVITY_TYPE_OPTIONS,
  DEFAULT_CASE_FEED,
  DEFAULT_MEASUREMENT_CRITERIA,
  DEFAULT_SAFETY_INFOS,
  INSPECTION_SECTIONS,
  LEGAL_REFERENCE_LIBRARY,
  RISK_ASSESSMENT_QUESTION_PROMPTS,
  TBM_QUESTION_PROMPTS,
} from '@/constants/inspectionSession/catalog';
import {
  createActivityRecord,
  createCurrentHazardFinding,
  createFutureProcessRiskPlan,
  createMeasurementCheckItem,
  createPreviousGuidanceFollowUpItem,
  createSafetyEducationRecord,
  createSiteScenePhoto,
} from '@/constants/inspectionSession/itemFactory';
import {
  asRecord,
  createDocumentMetaMap,
  generateId,
  normalizeBoolean,
  normalizeText,
} from '@/constants/inspectionSession/shared';
import { getSceneSlotTitle, normalizeSceneTitle } from '@/constants/inspectionSession/scenePhotos';
import { calculateRiskAssessmentResult } from '@/lib/riskAssessment';
import type { CausativeAgentKey } from '@/types/siteOverview';
import type {
  CaseFeedItem,
  ChecklistQuestion,
  InspectionDocumentMeta,
  InspectionDocumentSource,
  InspectionSectionKey,
  MeasurementCheckItem,
  PreviousGuidanceFollowUpItem,
  SafetyCheckDocument,
  SafetyEducationRecord,
  SafetyInfoItem,
  SiteScenePhoto,
} from '@/types/inspectionSession';

function normalizeRiskLevel(likelihood: string, severity: string, existing: string) {
  return calculateRiskAssessmentResult(likelihood, severity) || normalizeText(existing);
}

export function normalizeScenePhoto(raw: unknown, index: number): SiteScenePhoto {
  const source = asRecord(raw);
  return createSiteScenePhoto(getSceneSlotTitle(index), {
    id: normalizeText(source.id) || generateId('scene'),
    title: normalizeSceneTitle(index, normalizeText(source.title)),
    photoUrl: normalizeText(source.photoUrl),
    description: normalizeText(source.description),
  });
}
export function normalizeFollowUpItem(raw: unknown, fallbackDate: string): PreviousGuidanceFollowUpItem {
  const source = asRecord(raw);
  return createPreviousGuidanceFollowUpItem({
    id: normalizeText(source.id) || generateId('follow-up'),
    sourceSessionId: normalizeText(source.sourceSessionId) || undefined,
    sourceFindingId: normalizeText(source.sourceFindingId || source.sourceHazardId) || undefined,
    location: normalizeText(source.location) || normalizeText(source.locationDetail) || normalizeText(source.title),
    guidanceDate: normalizeText(source.guidanceDate) || normalizeText(source.inspectionDate) || '',
    confirmationDate: normalizeText(source.confirmationDate) || normalizeText(fallbackDate),
    beforePhotoUrl: normalizeText(source.beforePhotoUrl) || normalizeText(source.photoUrl) || normalizeText(source.previousPhotoUrl),
    afterPhotoUrl: normalizeText(source.afterPhotoUrl) || normalizeText(source.currentPhotoUrl),
    result: normalizeText(source.result) || normalizeText(source.implementationResult),
  });
}
export function normalizeHazardFinding(raw: unknown, fallbackInspector: string) {
  const source = asRecord(raw);
  const likelihood = normalizeText(source.likelihood);
  const severity = normalizeText(source.severity);
  const legalReferenceId = normalizeText(source.legalReferenceId);
  const matchedReference = LEGAL_REFERENCE_LIBRARY.find((item) => item.id === legalReferenceId);

  return createCurrentHazardFinding({
    id: normalizeText(source.id) || generateId('finding'),
    photoUrl: normalizeText(source.photoUrl),
    location: normalizeText(source.location) || normalizeText(source.locationDetail) || normalizeText(source.title),
    likelihood,
    severity,
    riskLevel: normalizeRiskLevel(likelihood, severity, normalizeText(source.riskLevel || source.riskAssessmentResult)),
    accidentType: normalizeText(source.accidentType) || normalizeText(source.location),
    causativeAgentKey: (normalizeText(source.causativeAgentKey) as CausativeAgentKey) || '',
    inspector: normalizeText(source.inspector) || fallbackInspector,
    emphasis: normalizeText(source.emphasis) || normalizeText(source.hazardFactors),
    improvementPlan: normalizeText(source.improvementPlan) || normalizeText(source.improvementItems),
    legalReferenceId,
    legalReferenceTitle: normalizeText(source.legalReferenceTitle) || normalizeText(source.legalInfo) || matchedReference?.title || '',
    referenceMaterial1: normalizeText(source.referenceMaterial1) || matchedReference?.referenceMaterial1 || '',
    referenceMaterial2: normalizeText(source.referenceMaterial2) || matchedReference?.referenceMaterial2 || '',
    carryForward: normalizeBoolean(source.carryForward),
    metadata: normalizeText(source.metadata) || undefined,
  });
}
export function normalizeFuturePlan(raw: unknown) {
  const source = asRecord(raw);
  return createFutureProcessRiskPlan({
    id: normalizeText(source.id) || generateId('future-plan'),
    processName: normalizeText(source.processName) || normalizeText(source.locationDetail),
    hazard: normalizeText(source.hazard) || normalizeText(source.hazardFactors),
    countermeasure: normalizeText(source.countermeasure) || normalizeText(source.improvementItems),
    note: normalizeText(source.note) || normalizeText(source.legalInfo),
    source: normalizeText(source.source) === 'api' ? 'api' : 'manual',
  });
}

function normalizeQuestion(raw: unknown, prompt: string, prefix: string, index: number): ChecklistQuestion {
  const source = asRecord(raw);
  const rating = normalizeText(source.rating);
  return {
    id: normalizeText(source.id) || generateId(`${prefix}-${index + 1}`),
    prompt: normalizeText(source.prompt) || prompt,
    rating: rating === 'good' || rating === 'average' || rating === 'poor' ? rating : '',
    note: normalizeText(source.note || source.remark),
  };
}

export function normalizeSafetyCheckDocument(raw: unknown): SafetyCheckDocument {
  const source = asRecord(raw);
  const tbm = Array.isArray(source.tbm) ? source.tbm : [];
  const riskAssessment = Array.isArray(source.riskAssessment) ? source.riskAssessment : [];
  return {
    tbm: TBM_QUESTION_PROMPTS.map((prompt, index) => normalizeQuestion(tbm[index], prompt, 'tbm', index)),
    riskAssessment: RISK_ASSESSMENT_QUESTION_PROMPTS.map((prompt, index) => normalizeQuestion(riskAssessment[index], prompt, 'risk-assessment', index)),
  };
}

export function normalizeMeasurement(raw: unknown): MeasurementCheckItem {
  const source = asRecord(raw);
  return createMeasurementCheckItem({
    id: normalizeText(source.id) || generateId('measurement'),
    instrumentType: normalizeText(source.instrumentType) || '조도계',
    measurementLocation: normalizeText(source.measurementLocation) || normalizeText(source.measurementLocationDetail) || normalizeText(source.measurementLocationValue) || normalizeText(source.measurementLocationName),
    measuredValue: normalizeText(source.measuredValue) || normalizeText(source.measurementValue),
    safetyCriteria: normalizeText(source.safetyCriteria) || normalizeText(source.measurementCriteria) || DEFAULT_MEASUREMENT_CRITERIA,
    actionTaken: normalizeText(source.actionTaken) || normalizeText(source.actionStatus) || normalizeText(source.suitability),
  });
}

export function normalizeEducationRecord(raw: unknown): SafetyEducationRecord {
  const source = asRecord(raw);
  return createSafetyEducationRecord({
    id: normalizeText(source.id) || generateId('education'),
    photoUrl: normalizeText(source.photoUrl),
    materialUrl: normalizeText(source.materialUrl),
    materialName: normalizeText(source.materialName) || normalizeText(source.providedKinds) || normalizeText(source.supportItem),
    attendeeCount: normalizeText(source.attendeeCount) || normalizeText(source.participantCount),
    content: normalizeText(source.content) || normalizeText(source.educationContent) || normalizeText(source.details),
  });
}

export function normalizeActivity(raw: unknown) {
  const source = asRecord(raw);
  return createActivityRecord({
    id: normalizeText(source.id) || generateId('activity'),
    photoUrl: normalizeText(source.photoUrl),
    activityType: normalizeText(source.activityType) || normalizeText(source.supportItem) || ACTIVITY_TYPE_OPTIONS[0],
    content: normalizeText(source.content) || normalizeText(source.details),
  });
}

export function normalizeCaseFeedItem(raw: unknown, fallback: CaseFeedItem): CaseFeedItem {
  const source = asRecord(raw);
  return { id: normalizeText(source.id) || fallback.id, title: normalizeText(source.title) || fallback.title, summary: normalizeText(source.summary) || fallback.summary, imageUrl: normalizeText(source.imageUrl) || fallback.imageUrl };
}

export function normalizeSafetyInfoItem(raw: unknown, fallback: SafetyInfoItem): SafetyInfoItem {
  const source = asRecord(raw);
  return { id: normalizeText(source.id) || fallback.id, title: normalizeText(source.title) || fallback.title, body: normalizeText(source.body) || fallback.body, imageUrl: normalizeText(source.imageUrl) || fallback.imageUrl };
}

export function normalizeDocumentMetaMap(raw: unknown): Record<InspectionSectionKey, InspectionDocumentMeta> {
  const defaults = createDocumentMetaMap();
  const source = asRecord(raw);
  return INSPECTION_SECTIONS.reduce<Record<InspectionSectionKey, InspectionDocumentMeta>>((accumulator, section) => {
    const item = asRecord(source[section.key]);
    const status = normalizeText(item.status);
    accumulator[section.key] = {
      status: status === 'completed' || status === 'in_progress' || status === 'not_started' ? status : defaults[section.key].status,
      lastEditedAt: normalizeText(item.lastEditedAt) || null,
      source: (normalizeText(item.source) as InspectionDocumentSource) || defaults[section.key].source,
    };
    return accumulator;
  }, defaults);
}

export function normalizeCases(source: unknown[]) {
  return source.length > 0
    ? DEFAULT_CASE_FEED.map((fallback, index) => normalizeCaseFeedItem(source[index], fallback))
    : DEFAULT_CASE_FEED.map((item) => ({ ...item }));
}

export function normalizeSafetyInfos(source: unknown[]) {
  return source.length > 0
    ? DEFAULT_SAFETY_INFOS.map((fallback, index) => normalizeSafetyInfoItem(source[index], fallback))
    : DEFAULT_SAFETY_INFOS.map((item) => ({ ...item }));
}
