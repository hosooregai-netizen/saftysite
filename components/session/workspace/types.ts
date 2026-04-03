import type {
  ChecklistQuestion,
  InspectionDocumentSource,
  InspectionSectionKey,
  InspectionSession,
  ReportIndexStatus,
} from '@/types/inspectionSession';
import type {
  SafetyDoc7ReferenceMaterialCatalogItem,
  SafetyMeasurementTemplate,
} from '@/types/backend';
import type { ChartEntry } from './utils';

export type ApplyDocumentUpdate = (
  key: InspectionSectionKey,
  source: InspectionDocumentSource,
  updater: (current: InspectionSession) => InspectionSession,
  options?: { touch?: boolean }
) => void;

export type WithFileData = (
  file: File,
  onLoaded?: (value: string, selectedFile: File) => void
) => Promise<string | null>;

export interface OverviewSectionProps {
  applyDocumentUpdate: ApplyDocumentUpdate;
  isRelationHydrating: boolean;
  isRelationReady: boolean;
  relationStatus: ReportIndexStatus;
  session: InspectionSession;
  withFileData: WithFileData;
}

export interface HazardStatsSectionProps {
  applyDocumentUpdate: ApplyDocumentUpdate;
  currentAccidentEntries: ChartEntry[];
  currentAgentEntries: ChartEntry[];
  cumulativeAccidentEntries: ChartEntry[];
  cumulativeAgentEntries: ChartEntry[];
  doc7ReferenceMaterials: SafetyDoc7ReferenceMaterialCatalogItem[];
  isRelationHydrating: boolean;
  isRelationReady: boolean;
  relationStatus: ReportIndexStatus;
  measurementTemplates: SafetyMeasurementTemplate[];
  session: InspectionSession;
  withFileData: WithFileData;
}

export interface SupportSectionProps {
  applyDocumentUpdate: ApplyDocumentUpdate;
  session: InspectionSession;
  withFileData: WithFileData;
}

export interface ChecklistSectionProps {
  items: ChecklistQuestion[];
  onChange: (itemId: string, patch: Partial<ChecklistQuestion>) => void;
}

