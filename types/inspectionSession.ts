import type { CausativeAgentKey } from '@/types/siteOverview';

export type InspectionSectionKey =
  | 'doc1'
  | 'doc2'
  | 'doc3'
  | 'doc4'
  | 'doc5'
  | 'doc6'
  | 'doc7'
  | 'doc8'
  | 'doc9'
  | 'doc10'
  | 'doc11'
  | 'doc12'
  | 'doc13'
  | 'doc14';

export type InspectionDocumentStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed';

export type InspectionDocumentSource =
  | 'manual'
  | 'api'
  | 'admin'
  | 'derived'
  | 'readonly';

export interface InspectionDocumentMeta {
  status: InspectionDocumentStatus;
  lastEditedAt: string | null;
  source: InspectionDocumentSource;
}

export interface InspectionReportMeta {
  siteName: string;
  reportDate: string;
  drafter: string;
  reviewer: string;
  approver: string;
}

export interface AdminSiteSnapshot {
  customerName: string;
  siteName: string;
  assigneeName: string;
  siteManagementNumber: string;
  businessStartNumber: string;
  constructionPeriod: string;
  constructionAmount: string;
  siteManagerName: string;
  siteContactEmail: string;
  siteAddress: string;
  companyName: string;
  corporationRegistrationNumber: string;
  businessRegistrationNumber: string;
  licenseNumber: string;
  headquartersContact: string;
  headquartersAddress: string;
}

export type WorkPlanCheckKey =
  | 'towerCrane'
  | 'tunnelExcavation'
  | 'vehicleLoadingMachine'
  | 'bridgeWork'
  | 'constructionMachine'
  | 'quarryWork'
  | 'chemicalFacility'
  | 'buildingDemolition'
  | 'electricalWork'
  | 'heavyMaterialHandling'
  | 'earthwork'
  | 'railwayFacilityMaintenance'
  | 'otherHighRiskWork';

export type WorkPlanCheckStatus = 'written' | 'not_written' | 'not_applicable';
export type PreviousImplementationStatus =
  | 'implemented'
  | 'partial'
  | 'not_implemented'
  | '';
export type NotificationMethod =
  | 'direct'
  | 'registered_mail'
  | 'email'
  | 'mobile'
  | 'other'
  | '';
export type AccidentOccurrence = 'yes' | 'no' | '';

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
  photoUrl: string;
  location: string;
  likelihood: string;
  severity: string;
  riskLevel: string;
  accidentType: string;
  causativeAgentKey: CausativeAgentKey | '';
  inspector: string;
  emphasis: string;
  improvementPlan: string;
  legalReferenceId: string;
  legalReferenceTitle: string;
  referenceMaterial1: string;
  referenceMaterial2: string;
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

export type ChecklistRating = 'good' | 'average' | 'poor' | '';

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
  content: string;
}

export interface ActivityRecord {
  id: string;
  photoUrl: string;
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

export interface InspectionSession {
  id: string;
  siteKey: string;
  reportNumber: number;
  currentSection: InspectionSectionKey;
  meta: InspectionReportMeta;
  adminSiteSnapshot: AdminSiteSnapshot;
  documentsMeta: Record<InspectionSectionKey, InspectionDocumentMeta>;
  document2Overview: TechnicalGuidanceOverview;
  document3Scenes: SiteScenePhoto[];
  document4FollowUps: PreviousGuidanceFollowUpItem[];
  document5Summary: CurrentHazardSummaryDocument;
  document6Measures: FatalAccidentMeasureItem[];
  document7Findings: CurrentHazardFinding[];
  document8Plans: FutureProcessRiskPlan[];
  document9SafetyChecks: SafetyCheckDocument;
  document10Measurements: MeasurementCheckItem[];
  document11EducationRecords: SafetyEducationRecord[];
  document12Activities: ActivityRecord[];
  document13Cases: CaseFeedItem[];
  document14SafetyInfos: SafetyInfoItem[];
  createdAt: string;
  updatedAt: string;
  lastSavedAt: string | null;
}

export interface InspectionSite {
  id: string;
  title: string;
  customerName: string;
  siteName: string;
  assigneeName: string;
  adminSiteSnapshot: AdminSiteSnapshot;
  createdAt: string;
  updatedAt: string;
}

export interface InspectionSectionMeta {
  key: InspectionSectionKey;
  label: string;
  shortLabel: string;
  compactLabel: string;
  description?: string;
}
