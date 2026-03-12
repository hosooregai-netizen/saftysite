import type { HazardReportItem } from '@/types/hazard';
import type { CausativeAgentReport } from '@/types/siteOverview';

export type InspectionSectionKey =
  | 'cover'
  | 'siteOverview'
  | 'previousGuidance'
  | 'currentHazards'
  | 'futureRisks'
  | 'support';

export type DraftState = 'draft' | 'reviewed';
export type GuidanceStatus =
  | 'pending'
  | 'implemented'
  | 'partial'
  | 'notImplemented';
export type SessionSaveState = 'idle' | 'saving' | 'saved' | 'error';

export interface InspectionCover {
  businessName: string;
  projectName: string;
  inspectionDate: string;
  consultantName: string;
  processSummary: string;
  siteAddress: string;
  contractorName: string;
  notes: string;
}

export interface PreviousGuidanceItem {
  id: string;
  title: string;
  description: string;
  status: GuidanceStatus;
  previousPhotoUrl: string;
  currentPhotoUrl: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface InspectionHazardItem extends HazardReportItem {
  id: string;
  status: DraftState;
  createdAt: string;
  updatedAt: string;
}

export interface FutureProcessRiskItem {
  id: string;
  processName: string;
  expectedHazard: string;
  countermeasure: string;
  note: string;
  status: DraftState;
  createdAt: string;
  updatedAt: string;
}

export interface SupportItems {
  technicalMaterials: string;
  educationResults: string;
  equipmentInspection: string;
  otherSupport: string;
  accidentOccurred: boolean;
  accidentNotes: string;
}

export interface InspectionSession {
  id: string;
  siteKey: string;
  currentSection: InspectionSectionKey;
  cover: InspectionCover;
  siteOverview: CausativeAgentReport;
  siteOverviewStatus: DraftState;
  previousGuidanceItems: PreviousGuidanceItem[];
  currentHazards: InspectionHazardItem[];
  futureProcessRisks: FutureProcessRiskItem[];
  supportItems: SupportItems;
  supportStatus: DraftState;
  createdAt: string;
  updatedAt: string;
  lastSavedAt: string | null;
}

export interface InspectionSite {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface InspectionSectionMeta {
  key: InspectionSectionKey;
  label: string;
  shortLabel: string;
  description: string;
}
