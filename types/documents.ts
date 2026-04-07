import type { QuarterlySummaryReport } from '@/types/erpReports';
import type { InspectionSession, InspectionSite } from '@/types/inspectionSession';

export interface GenerateQuarterlyHwpxRequest {
  report: QuarterlySummaryReport;
  site: InspectionSite;
}

export interface GenerateInspectionHwpxRequest {
  session: InspectionSession;
  siteSessions?: InspectionSession[];
}

export interface GenerateInspectionDocumentByReportKeyRequest {
  reportKey: string;
}

export type GenerateInspectionDocumentRequest =
  | GenerateInspectionHwpxRequest
  | GenerateInspectionDocumentByReportKeyRequest;
