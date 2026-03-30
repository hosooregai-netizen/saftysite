import type {
  AdminSiteSnapshot,
  InspectionDocumentMeta,
  InspectionReportMeta,
  InspectionSectionKey,
} from './base';
import type {
  ActivityRecord,
  CaseFeedItem,
  CurrentHazardFinding,
  CurrentHazardSummaryDocument,
  FatalAccidentMeasureItem,
  FutureProcessRiskPlan,
  MeasurementCheckItem,
  PreviousGuidanceFollowUpItem,
  SafetyCheckDocument,
  SafetyEducationRecord,
  SafetyInfoItem,
  SiteScenePhoto,
  TechnicalGuidanceOverview,
} from './documents';

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
  headquarterId?: string;
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

