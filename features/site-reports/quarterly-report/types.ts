import type {
  SafetyContentItem,
  SafetyQuarterlySummarySeedSourceReport,
} from '@/types/backend';
import type { QuarterlySummaryReport } from '@/types/erpReports';
import type { InspectionSite } from '@/types/inspectionSession';

export interface QuarterlyReportEditorProps {
  currentSite: InspectionSite;
  initialDraft: QuarterlySummaryReport;
  isExistingReport: boolean;
  isSaving: boolean;
  error: string | null;
  onSave: (report: QuarterlySummaryReport) => Promise<void>;
}

export interface QuarterlyReportPageScreenProps {
  quarterKey: string;
  siteKey: string;
}

export interface OpsAssetOption {
  id: string;
  title: string;
  description: string;
  previewUrl: string;
  fileUrl: string;
  fileName: string;
  type: SafetyContentItem['content_type'];
  sortOrder: number;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  isActive: boolean;
}

export type QuarterlySourceReport = SafetyQuarterlySummarySeedSourceReport;
