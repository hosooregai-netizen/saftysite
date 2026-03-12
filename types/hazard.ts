export interface HazardReportItem {
  location: string;
  locationDetail: string;
  riskAssessmentResult: string;
  hazardFactors: string;
  improvementItems: string;
  photoUrl: string;
  legalInfo: string;
  implementationPeriod: string;
  metadata?: string;
  objects?: string[];
}
