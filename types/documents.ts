import type { QuarterlySummaryReport } from '@/types/erpReports';
import type { InspectionSite } from '@/types/inspectionSession';

export interface GenerateQuarterlyHwpxRequest {
  report: QuarterlySummaryReport;
  site: InspectionSite;
}
