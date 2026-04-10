export type ExcelRowActionType = 'create' | 'update_headquarter' | 'update_site';
export type ExcelScopeSourceSection = 'headquarters' | 'sites';
export type ExcelRowExclusionReasonCode =
  | 'different_headquarter'
  | 'different_site'
  | 'scope_unresolved'
  | 'scope_ambiguous';

export interface ExcelImportScope {
  sourceSection: ExcelScopeSourceSection;
  headquarterId?: string | null;
  siteId?: string | null;
}

export interface ExcelImportScopeSummary extends ExcelImportScope {
  label: string;
}

export interface ExcelMatchCandidate {
  id: string;
  kind: 'headquarter' | 'site';
  label: string;
  reason: string;
  headquarterId: string | null;
  siteId: string | null;
}

export interface ExcelDetectedMapping {
  field: string;
  header: string;
  note?: string | null;
}

export interface ExcelIgnoredHeader {
  header: string;
  reason: string;
}

export interface ExcelImportPreviewRow {
  rowIndex: number;
  values: Record<string, string>;
  summary: string;
  suggestedAction: string;
  duplicateCandidates: ExcelMatchCandidate[];
  exclusionReasonCode?: ExcelRowExclusionReasonCode | null;
  exclusionReason?: string | null;
  inScope?: boolean;
}

export interface ExcelImportSheetSummary {
  createCount: number;
  updateHeadquarterCount: number;
  updateSiteCount: number;
  ambiguousCreateCount: number;
}

export interface ExcelImportSheetPreview {
  name: string;
  headers: string[];
  rowCount: number;
  includedRowCount: number;
  excludedRowCount: number;
  sampleRows: Record<string, string>[];
  suggestedMapping: Record<string, string>;
  detectedMappings: ExcelDetectedMapping[];
  ignoredHeaders: ExcelIgnoredHeader[];
  mappingWarnings: string[];
  hasRiskyMapping: boolean;
  includedRows: ExcelImportPreviewRow[];
  excludedRows: ExcelImportPreviewRow[];
  summary: ExcelImportSheetSummary;
}

export interface ExcelImportPreview {
  jobId: string;
  fileName: string;
  createdAt: string;
  sheetNames: string[];
  scope: ExcelImportScopeSummary;
  sheets: ExcelImportSheetPreview[];
}

export interface ExcelColumnMapping {
  [field: string]: string;
}

export interface ExcelRowAction {
  rowIndex: number;
  action: ExcelRowActionType;
  headquarterId?: string | null;
  siteId?: string | null;
}

export interface ExcelApplyResultRow {
  rowIndex: number;
  action: ExcelRowActionType;
  headquarterId: string;
  headquarterName: string;
  siteId: string;
  siteName: string;
  requiredCompletionFields: string[];
  workerMatchStatus?: string;
  matchedUserId?: string;
  matchedUserEmail?: string;
  placeholderCreated?: boolean;
  message: string;
}

export interface ExcelApplyResult {
  summary: {
    createdHeadquarterCount: number;
    updatedHeadquarterCount: number;
    createdSiteCount: number;
    updatedSiteCount: number;
    completionRequiredCount: number;
    matchedExistingUserCount?: number;
    createdPlaceholderUserCount?: number;
    ambiguousWorkerMatchCount?: number;
    createdAssignmentCount?: number;
  };
  rows: ExcelApplyResultRow[];
}
