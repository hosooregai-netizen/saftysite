import type { BadWorkplaceReport } from '@/types/erpReports';
import type { InspectionSession } from '@/types/inspectionSession';

export interface BadWorkplaceReportPageScreenProps {
  reportMonth: string;
  siteKey: string;
}

export interface BadWorkplaceReportEditorProps {
  error: string | null;
  initialDraft: BadWorkplaceReport;
  isSaving: boolean;
  onSave: (report: BadWorkplaceReport) => Promise<void>;
  siteSessions: InspectionSession[];
}
