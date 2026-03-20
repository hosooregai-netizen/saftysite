import {
  DEFAULT_MEASUREMENT_CRITERIA,
  FATAL_ACCIDENT_MEASURE_LIBRARY,
} from '@/constants/inspectionSession/catalog';
import { generateId } from '@/constants/inspectionSession/shared';
import type { CausativeAgentKey } from '@/types/siteOverview';
import type {
  ActivityRecord,
  CurrentHazardFinding,
  FatalAccidentMeasureItem,
  FutureProcessRiskPlan,
  MeasurementCheckItem,
  PreviousGuidanceFollowUpItem,
  SafetyEducationRecord,
  SiteScenePhoto,
} from '@/types/inspectionSession';

export function createSiteScenePhoto(
  title: string,
  initial: Partial<SiteScenePhoto> = {}
): SiteScenePhoto {
  return { id: initial.id ?? generateId('scene'), title, photoUrl: '', description: '', ...initial };
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
