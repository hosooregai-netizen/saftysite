import type {
  BadWorkplaceReport,
  QuarterlySummaryReport,
} from '@/types/erpReports';
import type { InspectionSession, InspectionSite } from '@/types/inspectionSession';

export interface GenerateQuarterlyHwpxRequest {
  report: QuarterlySummaryReport;
  site: InspectionSite;
}

export interface GenerateBadWorkplaceHwpxRequest {
  report: BadWorkplaceReport;
  site: InspectionSite;
}

export interface GenerateQuarterlyDocumentByReportKeyRequest {
  reportKey: string;
}

export interface GenerateBadWorkplaceDocumentByReportKeyRequest {
  reportKey: string;
}

export interface GenerateInspectionHwpxRequest {
  session: InspectionSession;
  siteSessions?: InspectionSession[];
}

export interface GenerateInspectionDocumentByReportKeyRequest {
  reportKey: string;
}

export type GenerateQuarterlyDocumentRequest =
  | GenerateQuarterlyHwpxRequest
  | GenerateQuarterlyDocumentByReportKeyRequest;

export type GenerateBadWorkplaceDocumentRequest =
  | GenerateBadWorkplaceHwpxRequest
  | GenerateBadWorkplaceDocumentByReportKeyRequest;

export type GenerateInspectionDocumentRequest =
  | GenerateInspectionHwpxRequest
  | GenerateInspectionDocumentByReportKeyRequest;
