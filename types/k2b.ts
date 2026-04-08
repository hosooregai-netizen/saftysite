export type K2bRowActionType = 'create' | 'update_headquarter' | 'update_site';
export type K2bScopeSourceSection = 'headquarters' | 'sites';
export type K2bRowExclusionReasonCode =
  | 'different_headquarter'
  | 'different_site'
  | 'scope_unresolved'
  | 'scope_ambiguous';

export interface K2bImportScope {
  sourceSection: K2bScopeSourceSection;
  headquarterId?: string | null;
  siteId?: string | null;
}

export interface K2bImportScopeSummary extends K2bImportScope {
  label: string;
}

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
  exclusionReasonCode?: K2bRowExclusionReasonCode | null;
  exclusionReason?: string | null;
  inScope?: boolean;
}

export interface K2bImportSheetSummary {
  createCount: number;
  updateHeadquarterCount: number;
  updateSiteCount: number;
  ambiguousCreateCount: number;
}

export interface K2bImportSheetPreview {
  name: string;
  headers: string[];
  rowCount: number;
  includedRowCount: number;
  excludedRowCount: number;
  sampleRows: Record<string, string>[];
  suggestedMapping: Record<string, string>;
  includedRows: K2bImportPreviewRow[];
  excludedRows: K2bImportPreviewRow[];
  summary: K2bImportSheetSummary;
}

export interface K2bImportPreview {
  jobId: string;
  fileName: string;
  createdAt: string;
  sheetNames: string[];
  scope: K2bImportScopeSummary;
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
