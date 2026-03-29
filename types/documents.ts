import type { BadWorkplaceReport, QuarterlySummaryReport } from '@/types/erpReports';
import type { InspectionSession, InspectionSite } from '@/types/inspectionSession';

export type InspectionWordTemplateId = 'default-inspection';

export interface GenerateInspectionWordRequest {
  session: InspectionSession;
  siteSessions?: InspectionSession[];
  templateId?: InspectionWordTemplateId;
}

export interface GenerateQuarterlyWordRequest {
  report: QuarterlySummaryReport;
  site: InspectionSite;
}

export interface GenerateBadWorkplaceWordRequest {
  report: BadWorkplaceReport;
  site: InspectionSite;
}
