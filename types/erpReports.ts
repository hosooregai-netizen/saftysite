import type { SafetyContentType } from '@/types/backend';
import type { AdminSiteSnapshot, FutureProcessRiskPlan } from '@/types/inspectionSession';
import type { CausativeAgentKey } from '@/types/siteOverview';

export type StoredReportKind =
  | 'technical_guidance'
  | 'quarterly_summary'
  | 'bad_workplace';

export type OperationalReportStatus = 'draft' | 'completed';

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
}

export interface QuarterlySummaryReport {
  id: string;
  siteId: string;
  title: string;
  reportKind: 'quarterly_summary';
  quarterKey: string;
  year: number;
  quarter: number;
  status: OperationalReportStatus;
  drafter: string;
  siteSnapshot: AdminSiteSnapshot;
  generatedFromSessionIds: string[];
  lastCalculatedAt: string;
  overallComment: string;
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
  confirmationDate: string;
  accidentType: string;
  causativeAgentKey: CausativeAgentKey | '';
}

export interface BadWorkplaceReport {
  id: string;
  siteId: string;
  title: string;
  reportKind: 'bad_workplace';
  reportMonth: string;
  status: OperationalReportStatus;
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
  sourceSessionId: string;
  sourceFindingIds: string[];
  violations: BadWorkplaceViolation[];
  note: string;
  createdAt: string;
  updatedAt: string;
}
