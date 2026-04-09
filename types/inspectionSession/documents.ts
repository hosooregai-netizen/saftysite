import type { CausativeAgentKey } from '@/types/siteOverview';
import type {
  AccidentOccurrence,
  ChecklistRating,
  NotificationMethod,
  PreviousImplementationStatus,
  WorkPlanCheckKey,
  WorkPlanCheckStatus,
} from './base';

export interface TechnicalGuidanceOverview {
  guidanceAgencyName: string;
  guidanceDate: string;
  constructionType: string;
  progressRate: string;
  visitCount: string;
  totalVisitCount: string;
  assignee: string;
  previousImplementationStatus: PreviousImplementationStatus;
  contact: string;
  notificationMethod: NotificationMethod;
  notificationRecipientName: string;
  notificationRecipientSignature: string;
  otherNotificationMethod: string;
  workPlanChecks: Record<WorkPlanCheckKey, WorkPlanCheckStatus>;
  accidentOccurred: AccidentOccurrence;
  recentAccidentDate: string;
  accidentType: string;
  accidentSummary: string;
  processWorkerCount: string;
  processEquipment: string;
  processTools: string;
  processHazardousMaterials: string;
  processWorkContent: string;
  processWorkLocation: string;
  processSurroundings: string;
  processAndNotes: string;
}

export interface SiteScenePhoto {
  id: string;
  title: string;
  photoUrl: string;
  description: string;
}

export interface PreviousGuidanceFollowUpItem {
  id: string;
  sourceSessionId?: string;
  sourceFindingId?: string;
  location: string;
  guidanceDate: string;
  confirmationDate: string;
  beforePhotoUrl: string;
  afterPhotoUrl: string;
  result: string;
}

export interface CurrentHazardSummaryDocument {
  summaryText: string;
}

export interface FatalAccidentMeasureItem {
  key: CausativeAgentKey;
  number: number;
  label: string;
  guidance: string;
  checked: boolean;
}

export interface CurrentHazardFinding {
  id: string;
  /** 현장 사진 1 */
  photoUrl: string;
  /** 현장 사진 2 */
  photoUrl2: string;
  location: string;
  hazardDescription?: string;
  likelihood: string;
  severity: string;
  riskLevel: string;
  accidentType: string;
  causativeAgentKey: CausativeAgentKey | '';
  inspector: string;
  emphasis: string;
  improvementPlan: string;
  improvementRequest?: string;
  legalReferenceId: string;
  legalReferenceTitle: string;
  referenceLawTitles?: string[];
  referenceMaterial1: string;
  referenceMaterial2: string;
  referenceMaterialImage?: string;
  referenceMaterialDescription?: string;
  /** 참고자료 매칭용(콘텐츠 CRUD doc7). 비어 있으면 accidentType/causativeAgentKey로 폴백 */
  referenceCatalogAccidentType: string;
  referenceCatalogCausativeAgentKey: string;
  carryForward: boolean;
  metadata?: string;
}

export interface FutureProcessRiskPlan {
  id: string;
  processName: string;
  hazard: string;
  countermeasure: string;
  note: string;
  source: 'manual' | 'api';
}

export interface ChecklistQuestion {
  id: string;
  prompt: string;
  rating: ChecklistRating;
  note: string;
}

export interface SafetyCheckDocument {
  tbm: ChecklistQuestion[];
  riskAssessment: ChecklistQuestion[];
}

export interface MeasurementCheckItem {
  id: string;
  instrumentType: string;
  measurementLocation: string;
  photoUrl: string;
  measuredValue: string;
  safetyCriteria: string;
  actionTaken: string;
}

export interface SafetyEducationRecord {
  id: string;
  photoUrl: string;
  materialUrl: string;
  materialName: string;
  attendeeCount: string;
  /** 교육 주제 */
  topic: string;
  content: string;
}

export interface ActivityRecord {
  id: string;
  photoUrl: string;
  /** 보조 활동 사진(doc11 교육 자료 슬롯과 동일한 2열 배치) */
  photoUrl2: string;
  activityType: string;
  content: string;
}

export interface CaseFeedItem {
  id: string;
  title: string;
  summary: string;
  imageUrl: string;
}

export interface SafetyInfoItem {
  id: string;
  title: string;
  body: string;
  imageUrl: string;
}
