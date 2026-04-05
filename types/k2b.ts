export type K2bRowActionType = 'create' | 'update_headquarter' | 'update_site';

export interface K2bMatchCandidate {
  id: string;
  kind: 'headquarter' | 'site';
  label: string;
  reason: string;
  headquarterId: string | null;
  siteId: string | null;
}

export interface K2bImportPreviewRow {
  rowIndex: number;
  values: Record<string, string>;
  summary: string;
  suggestedAction: string;
  duplicateCandidates: K2bMatchCandidate[];
}

export interface K2bImportSheetPreview {
  name: string;
  headers: string[];
  rowCount: number;
  sampleRows: Record<string, string>[];
  suggestedMapping: Record<string, string>;
  rowPreviews: K2bImportPreviewRow[];
}

export interface K2bImportPreview {
  jobId: string;
  fileName: string;
  createdAt: string;
  sheetNames: string[];
  sheets: K2bImportSheetPreview[];
}

export interface K2bColumnMapping {
  [field: string]: string;
}

export interface K2bRowAction {
  rowIndex: number;
  action: K2bRowActionType;
  headquarterId?: string | null;
  siteId?: string | null;
}

export interface K2bApplyResultRow {
  rowIndex: number;
  action: K2bRowActionType;
  headquarterId: string;
  headquarterName: string;
  siteId: string;
  siteName: string;
  requiredCompletionFields: string[];
  message: string;
}

export interface K2bApplyResult {
  summary: {
    createdHeadquarterCount: number;
    updatedHeadquarterCount: number;
    createdSiteCount: number;
    updatedSiteCount: number;
    completionRequiredCount: number;
  };
  rows: K2bApplyResultRow[];
}
