'use client';

import type {
  ChecklistQuestion,
  InspectionDocumentSource,
  InspectionSectionKey,
  InspectionSession,
} from '@/types/inspectionSession';
import type { ChartEntry } from './utils';

export type ApplyDocumentUpdate = (
  key: InspectionSectionKey,
  source: InspectionDocumentSource,
  updater: (current: InspectionSession) => InspectionSession,
  options?: { touch?: boolean }
) => void;

export type WithFileData = (
  file: File,
  onLoaded?: (dataUrl: string, selectedFile: File) => void
) => Promise<string | null>;

export interface OverviewSectionProps {
  applyDocumentUpdate: ApplyDocumentUpdate;
  correctionResultOptions: string[];
  session: InspectionSession;
  withFileData: WithFileData;
}

export interface HazardStatsSectionProps {
  applyDocumentUpdate: ApplyDocumentUpdate;
  currentAccidentEntries: ChartEntry[];
  currentAgentEntries: ChartEntry[];
  cumulativeAccidentEntries: ChartEntry[];
  cumulativeAgentEntries: ChartEntry[];
  session: InspectionSession;
  withFileData: WithFileData;
  legalReferenceLibrary: Array<{
    id: string;
    title: string;
    body: string;
    referenceMaterial1: string;
    referenceMaterial2: string;
  }>;
}

export interface SupportSectionProps {
  applyDocumentUpdate: ApplyDocumentUpdate;
  legalReferenceLibrary: Array<{ id: string; title: string; body: string }>;
  session: InspectionSession;
  withFileData: WithFileData;
}

export interface ChecklistSectionProps {
  items: ChecklistQuestion[];
  onChange: (itemId: string, patch: Partial<ChecklistQuestion>) => void;
}
