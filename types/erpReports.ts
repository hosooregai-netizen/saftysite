import type {
  ReportControllerReview,
  ReportDispatchMeta,
} from '@/types/admin';
import type { SafetyContentType } from '@/types/backend';
import type { AdminSiteSnapshot, FutureProcessRiskPlan } from '@/types/inspectionSession';
import type { CausativeAgentKey } from '@/types/siteOverview';

export type StoredReportKind =
  | 'technical_guidance'
  | 'quarterly_summary'
  | 'bad_workplace';

export type OperationalReportStatus = 'draft' | 'completed';

export interface OperationalQuarterlyIndexItem {
  id: string;
  siteId: string;
  title: string;
  reportKind: 'quarterly_summary';
  dispatchCompleted: boolean;
  periodStartDate: string;
  periodEndDate: string;
  quarterKey: string;
  year: number;
  quarter: number;
  status: OperationalReportStatus;
  selectedReportCount: number;
  lastCalculatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface OperationalBadWorkplaceIndexItem {
  id: string;
  siteId: string;
  title: string;
  reportKind: 'bad_workplace';
  dispatchCompleted: boolean;
  reportMonth: string;
  status: OperationalReportStatus;
  reporterUserId: string;
  reporterName: string;
  sourceFindingCount: number;
  violationCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuarterTarget {
  quarterKey: string;
  year: number;
  quarter: number;
  label: string;
  startDate: string;
  endDate: string;
}

export interface QuarterlyCounter {
  label: string;
  count: number;
}

export interface QuarterlyImplementationRow {
  sessionId: string;
  reportTitle: string;
  reportDate: string;
  reportNumber: number;
  drafter: string;
  progressRate: string;
  findingCount: number;
  improvedCount: number;
  note: string;
}

export interface QuarterlySummaryReport {
  id: string;
  siteId: string;
  title: string;
  reportKind: 'quarterly_summary';
  dispatchCompleted: boolean;
  periodStartDate: string;
  periodEndDate: string;
  quarterKey: string;
  year: number;
  quarter: number;
  status: OperationalReportStatus;
  controllerReview: ReportControllerReview | null;
  dispatch: ReportDispatchMeta | null;
  drafter: string;
  reviewer: string;
  approver: string;
  siteSnapshot: AdminSiteSnapshot;
  generatedFromSessionIds: string[];
  lastCalculatedAt: string;
  implementationRows: QuarterlyImplementationRow[];
  accidentStats: QuarterlyCounter[];
  causativeStats: QuarterlyCounter[];
  futurePlans: FutureProcessRiskPlan[];
  majorMeasures: string[];
  opsAssetId: string;
  opsAssetTitle: string;
  opsAssetDescription: string;
  opsAssetPreviewUrl: string;
  opsAssetFileUrl: string;
  opsAssetFileName: string;
  opsAssetType: SafetyContentType | '';
  opsAssignedBy: string;
  opsAssignedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface BadWorkplaceViolation {
  id: string;
  sourceFindingId: string;
  legalReference: string;
  hazardFactor: string;
  improvementMeasure: string;
  nonCompliance: string;
  guidanceDate: string;
  confirmationDate: string;
  accidentType: string;
  causativeAgentKey: CausativeAgentKey | '';
  originKind: 'previous_unresolved' | 'current_new_hazard' | 'manual';
  originKey: string;
  originSessionId: string;
  originFindingId?: string;
}

export interface BadWorkplaceReport {
  id: string;
  siteId: string;
  title: string;
  reportKind: 'bad_workplace';
  dispatchCompleted: boolean;
  reportMonth: string;
  status: OperationalReportStatus;
  sourceMode: 'combined' | 'previous_unresolved' | 'current_new_hazard';
  controllerReview: ReportControllerReview | null;
  siteSnapshot: AdminSiteSnapshot;
  reporterUserId: string;
  reporterName: string;
  receiverName: string;
  progressRate: string;
  implementationCount: string;
  contractPeriod: string;
  agencyName: string;
  agencyRepresentative: string;
  agencyAddress: string;
  agencyContact: string;
  guidanceDate: string;
  confirmationDate: string;
  assigneeContact: string;
  notificationDate: string;
  recipientOfficeName: string;
  attachmentDescription: string;
  sourceSessionId: string;
  sourceFindingIds: string[];
  violations: BadWorkplaceViolation[];
  note: string;
  createdAt: string;
  updatedAt: string;
}
