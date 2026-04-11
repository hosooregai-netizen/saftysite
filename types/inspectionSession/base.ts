export type InspectionSectionKey =
  | 'doc1'
  | 'doc2'
  | 'doc3'
  | 'doc4'
  | 'doc5'
  | 'doc6'
  | 'doc7'
  | 'doc8'
  | 'doc9'
  | 'doc10'
  | 'doc11'
  | 'doc12'
  | 'doc13'
  | 'doc14';

export type InspectionDocumentStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed';

export type InspectionDocumentSource =
  | 'manual'
  | 'api'
  | 'admin'
  | 'derived'
  | 'readonly';

export interface InspectionDocumentMeta {
  status: InspectionDocumentStatus;
  lastEditedAt: string | null;
  source: InspectionDocumentSource;
}

export interface InspectionReportMeta {
  siteName: string;
  reportDate: string;
  reportTitle: string;
  drafter: string;
  reviewer: string;
  approver: string;
}

export interface AdminSiteSnapshot {
  customerName: string;
  clientBusinessName: string;
  siteName: string;
  assigneeName: string;
  siteManagementNumber: string;
  businessStartNumber: string;
  constructionPeriod: string;
  constructionAmount: string;
  isHighRiskSite: boolean;
  siteManagerName: string;
  siteManagerPhone: string;
  siteContactEmail: string;
  siteAddress: string;
  companyName: string;
  corporationRegistrationNumber: string;
  businessRegistrationNumber: string;
  licenseNumber: string;
  headquartersContact: string;
  headquartersAddress: string;
}

export type WorkPlanCheckKey =
  | 'towerCrane'
  | 'tunnelExcavation'
  | 'vehicleLoadingMachine'
  | 'bridgeWork'
  | 'constructionMachine'
  | 'quarryWork'
  | 'chemicalFacility'
  | 'buildingDemolition'
  | 'electricalWork'
  | 'heavyMaterialHandling'
  | 'earthwork'
  | 'railwayFacilityMaintenance';

export type WorkPlanCheckStatus = 'written' | 'not_written' | 'not_applicable';

export type PreviousImplementationStatus =
  | 'implemented'
  | 'partial'
  | 'not_implemented'
  | '';

export type NotificationMethod =
  | 'direct'
  | 'registered_mail'
  | 'email'
  | 'mobile'
  | 'other'
  | '';

export type AccidentOccurrence = 'yes' | 'no' | '';

export type ChecklistRating = 'good' | 'average' | 'poor' | '';
