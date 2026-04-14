import type {
  AdminSiteSnapshot,
  InspectionDocumentMeta,
  InspectionReportMeta,
  InspectionSectionKey,
} from './base';
import type { ReportControllerReview } from '@/types/admin';
import type { SafetyReportStatus } from '@/types/backend';
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

export interface TechnicalGuidanceChartEntry {
  label: string;
  count: number;
}

export interface TechnicalGuidanceRelations {
  computedAt: string | null;
  projectionVersion: number;
  stale: boolean;
  recomputeStatus: 'fresh' | 'pending';
  sourceReportKeys: string[];
  cumulativeAccidentEntries: TechnicalGuidanceChartEntry[];
  cumulativeAgentEntries: TechnicalGuidanceChartEntry[];
}

export interface InspectionSession {
  id: string;
  siteKey: string;
  reportNumber: number;
  currentSection: InspectionSectionKey;
  meta: InspectionReportMeta;
  controllerReview: ReportControllerReview | null;
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
  technicalGuidanceRelations: TechnicalGuidanceRelations;
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

export type ReportIndexStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface InspectionReportListItem {
  id: string;
  reportKey: string;
  reportTitle: string;
  siteId: string;
  headquarterId: string | null;
  assignedUserId: string | null;
  visitDate: string | null;
  visitRound: number | null;
  totalRound: number | null;
  progressRate: number | null;
  status: SafetyReportStatus;
  dispatchCompleted: boolean;
  payloadVersion: number;
  latestRevisionNo: number;
  submittedAt: string | null;
  publishedAt: string | null;
  lastAutosavedAt: string | null;
  createdAt: string;
  updatedAt: string;
  meta: Record<string, unknown>;
}

export interface SiteReportIndexState {
  status: ReportIndexStatus;
  items: InspectionReportListItem[];
  fetchedAt: string | null;
  error: string | null;
}
