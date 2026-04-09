'use client';

import { readSafetyAuthToken, SafetyApiError } from '@/lib/safetyApi';
import { buildPublicSafetyApiUpstreamUrl } from '@/lib/safetyApi/upstream';
import type {
  ExcelApplyResult,
  ExcelImportPreview,
  ExcelImportScope,
} from '@/types/excelImport';

function toText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function mapExcelImportPreview(payload: unknown): ExcelImportPreview {
  const preview = (payload ?? {}) as Record<string, unknown>;
  const scope = (preview.scope ?? {}) as Record<string, unknown>;
  return {
    jobId: toText(preview.jobId ?? preview.job_id),
    fileName: toText(preview.fileName ?? preview.file_name),
    createdAt: toText(preview.createdAt ?? preview.created_at),
    sheetNames: Array.isArray(preview.sheetNames ?? preview.sheet_names)
      ? ((preview.sheetNames ?? preview.sheet_names) as unknown[]).map((item) => toText(item)).filter(Boolean)
      : [],
    scope: {
      sourceSection: toText(scope.sourceSection ?? scope.source_section) === 'sites' ? 'sites' : 'headquarters',
      headquarterId: toText(scope.headquarterId ?? scope.headquarter_id) || null,
      siteId: toText(scope.siteId ?? scope.site_id) || null,
      label: toText(scope.label) || '전체',
    },
    sheets: Array.isArray(preview.sheets)
      ? preview.sheets.map((sheetItem) => {
          const sheet = (sheetItem ?? {}) as Record<string, unknown>;
          const suggestedMappingSource = (sheet.suggestedMapping ?? sheet.suggested_mapping ?? {}) as Record<string, unknown>;
          const toRows = (rows: unknown) =>
            Array.isArray(rows)
              ? rows.map((rowItem) => {
                  const row = (rowItem ?? {}) as Record<string, unknown>;
                  return {
                    rowIndex: typeof (row.rowIndex ?? row.row_index) === 'number' ? Number(row.rowIndex ?? row.row_index) : 0,
                    values:
                      row.values && typeof row.values === 'object'
                        ? Object.fromEntries(
                            Object.entries(row.values as Record<string, unknown>).map(([key, value]) => [toText(key), toText(value)]),
                          )
                        : {},
                    summary: toText(row.summary),
                    suggestedAction: toText(row.suggestedAction ?? row.suggested_action),
                    exclusionReasonCode: toText(row.exclusionReasonCode ?? row.exclusion_reason_code) || null,
                    exclusionReason: toText(row.exclusionReason ?? row.exclusion_reason) || null,
                    inScope:
                      typeof (row.inScope ?? row.in_scope) === 'boolean'
                        ? Boolean(row.inScope ?? row.in_scope)
                        : undefined,
                    duplicateCandidates: Array.isArray(row.duplicateCandidates ?? row.duplicate_candidates)
                      ? (row.duplicateCandidates ?? row.duplicate_candidates).map((candidateItem) => {
                          const candidate = (candidateItem ?? {}) as Record<string, unknown>;
                          return {
                            id: toText(candidate.id),
                            kind: toText(candidate.kind) === 'headquarter' ? 'headquarter' : 'site',
                            label: toText(candidate.label),
                            reason: toText(candidate.reason),
                            headquarterId: toText(candidate.headquarterId ?? candidate.headquarter_id) || null,
                            siteId: toText(candidate.siteId ?? candidate.site_id) || null,
                          };
                        })
                      : [],
                  };
                })
              : [];

          return {
            name: toText(sheet.name),
            headers: Array.isArray(sheet.headers) ? sheet.headers.map((item) => toText(item)).filter(Boolean) : [],
            rowCount: typeof (sheet.rowCount ?? sheet.row_count) === 'number' ? Number(sheet.rowCount ?? sheet.row_count) : 0,
            includedRowCount:
              typeof (sheet.includedRowCount ?? sheet.included_row_count) === 'number'
                ? Number(sheet.includedRowCount ?? sheet.included_row_count)
                : 0,
            excludedRowCount:
              typeof (sheet.excludedRowCount ?? sheet.excluded_row_count) === 'number'
                ? Number(sheet.excludedRowCount ?? sheet.excluded_row_count)
                : 0,
            sampleRows: Array.isArray(sheet.sampleRows ?? sheet.sample_rows)
              ? (sheet.sampleRows ?? sheet.sample_rows).map((row) =>
                  Object.fromEntries(
                    Object.entries((row ?? {}) as Record<string, unknown>).map(([key, value]) => [toText(key), toText(value)]),
                  ),
                )
              : [],
            suggestedMapping: Object.fromEntries(
              Object.entries(suggestedMappingSource).map(([key, value]) => [toText(key), toText(value)]),
            ),
            detectedMappings: Array.isArray(sheet.detectedMappings ?? sheet.detected_mappings)
              ? (sheet.detectedMappings ?? sheet.detected_mappings).map((mappingItem) => {
                  const mapping = (mappingItem ?? {}) as Record<string, unknown>;
                  return {
                    field: toText(mapping.field),
                    header: toText(mapping.header),
                    note: toText(mapping.note) || null,
                  };
                })
              : [],
            ignoredHeaders: Array.isArray(sheet.ignoredHeaders ?? sheet.ignored_headers)
              ? (sheet.ignoredHeaders ?? sheet.ignored_headers).map((ignoredItem) => {
                  const ignored = (ignoredItem ?? {}) as Record<string, unknown>;
                  return {
                    header: toText(ignored.header),
                    reason: toText(ignored.reason),
                  };
                })
              : [],
            mappingWarnings: Array.isArray(sheet.mappingWarnings ?? sheet.mapping_warnings)
              ? (sheet.mappingWarnings ?? sheet.mapping_warnings).map((item) => toText(item)).filter(Boolean)
              : [],
            hasRiskyMapping:
              typeof (sheet.hasRiskyMapping ?? sheet.has_risky_mapping) === 'boolean'
                ? Boolean(sheet.hasRiskyMapping ?? sheet.has_risky_mapping)
                : false,
            includedRows: toRows(sheet.includedRows ?? sheet.included_rows),
            excludedRows: toRows(sheet.excludedRows ?? sheet.excluded_rows),
            summary: {
              createCount: Number(((sheet.summary ?? {}) as Record<string, unknown>).createCount ?? ((sheet.summary ?? {}) as Record<string, unknown>).create_count ?? 0),
              updateHeadquarterCount: Number(((sheet.summary ?? {}) as Record<string, unknown>).updateHeadquarterCount ?? ((sheet.summary ?? {}) as Record<string, unknown>).update_headquarter_count ?? 0),
              updateSiteCount: Number(((sheet.summary ?? {}) as Record<string, unknown>).updateSiteCount ?? ((sheet.summary ?? {}) as Record<string, unknown>).update_site_count ?? 0),
              ambiguousCreateCount: Number(((sheet.summary ?? {}) as Record<string, unknown>).ambiguousCreateCount ?? ((sheet.summary ?? {}) as Record<string, unknown>).ambiguous_create_count ?? 0),
            },
          };
        })
      : [],
  };
}

function mapExcelApplyResult(payload: unknown): ExcelApplyResult {
  const response = (payload ?? {}) as Record<string, unknown>;
  const summary = (response.summary ?? {}) as Record<string, unknown>;
  return {
    summary: {
      createdHeadquarterCount: Number(summary.createdHeadquarterCount ?? summary.created_headquarter_count ?? 0),
      updatedHeadquarterCount: Number(summary.updatedHeadquarterCount ?? summary.updated_headquarter_count ?? 0),
      createdSiteCount: Number(summary.createdSiteCount ?? summary.created_site_count ?? 0),
      updatedSiteCount: Number(summary.updatedSiteCount ?? summary.updated_site_count ?? 0),
      completionRequiredCount: Number(summary.completionRequiredCount ?? summary.completion_required_count ?? 0),
    },
    rows: Array.isArray(response.rows)
      ? response.rows.map((rowItem) => {
          const row = (rowItem ?? {}) as Record<string, unknown>;
          return {
            rowIndex: Number(row.rowIndex ?? row.row_index ?? 0),
            action: toText(row.action) as 'create' | 'update_headquarter' | 'update_site',
            headquarterId: toText(row.headquarterId ?? row.headquarter_id),
            headquarterName: toText(row.headquarterName ?? row.headquarter_name),
            siteId: toText(row.siteId ?? row.site_id),
            siteName: toText(row.siteName ?? row.site_name),
            requiredCompletionFields: Array.isArray(row.requiredCompletionFields ?? row.required_completion_fields)
              ? (row.requiredCompletionFields ?? row.required_completion_fields).map((item) => toText(item)).filter(Boolean)
              : [],
            message: toText(row.message),
          };
        })
      : [],
  };
}

async function parseErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as Record<string, unknown>;
    if (typeof payload.error === 'string' && payload.error.trim()) return payload.error;
    if (typeof payload.detail === 'string' && payload.detail.trim()) return payload.detail;
  } catch {
    // ignore
  }
  return response.statusText || '요청 처리 중 오류가 발생했습니다.';
}

function createAuthHeaders(options?: { json?: boolean }) {
  const token = readSafetyAuthToken();
  if (!token) {
    throw new SafetyApiError('로그인이 만료되었습니다. 다시 로그인해 주세요.', 401);
  }
  const headers = new Headers();
  headers.set('Authorization', `Bearer ${token}`);
  if (options?.json) {
    headers.set('Content-Type', 'application/json');
  }
  return headers;
}

function appendScope(body: FormData, scope?: ExcelImportScope) {
  if (!scope) return;
  body.set('sourceSection', scope.sourceSection);
  body.set('source_section', scope.sourceSection);
  if (scope.headquarterId?.trim()) {
    body.set('headquarterId', scope.headquarterId);
    body.set('headquarter_id', scope.headquarterId);
  }
  if (scope.siteId?.trim()) {
    body.set('siteId', scope.siteId);
    body.set('site_id', scope.siteId);
  }
}

function buildDirectExcelImportUrl(path: string) {
  return buildPublicSafetyApiUpstreamUrl(`/excel-imports${path}`);
}

async function requestExcelImport<T>(
  path: string,
  init: RequestInit,
  options?: {
    fallbackPath?: string;
    mapResponse?: (payload: unknown) => T;
  },
): Promise<T> {
  const directUrl = buildDirectExcelImportUrl(path);
  const response = await fetch(directUrl ?? options?.fallbackPath ?? path, {
    ...init,
    headers: init.headers,
  });
  if (!response.ok) {
    throw new SafetyApiError(await parseErrorMessage(response), response.status);
  }
  const payload = (await response.json()) as unknown;
  return options?.mapResponse ? options.mapResponse(payload) : (payload as T);
}

export async function parseExcelWorkbook(
  file: File,
  scope?: ExcelImportScope,
): Promise<ExcelImportPreview> {
  const headers = createAuthHeaders();
  const body = new FormData();
  body.set('file', file, file.name);
  appendScope(body, scope);
  return requestExcelImport<ExcelImportPreview>('/parse', {
    method: 'POST',
    body,
    headers,
  }, {
    fallbackPath: '/api/excel-imports/parse',
    mapResponse: mapExcelImportPreview,
  });
}

export async function fetchExcelImportPreview(jobId: string): Promise<ExcelImportPreview> {
  const headers = createAuthHeaders();
  return requestExcelImport<ExcelImportPreview>(`/${encodeURIComponent(jobId)}`, {
    cache: 'no-store',
    headers,
  }, {
    fallbackPath: `/api/excel-imports/${encodeURIComponent(jobId)}`,
    mapResponse: mapExcelImportPreview,
  });
}

export async function applyExcelWorkbook(input: {
  jobId: string;
  sheetName: string;
  scope?: ExcelImportScope;
}): Promise<ExcelApplyResult> {
  const headers = createAuthHeaders({ json: true });
  return requestExcelImport<ExcelApplyResult>('/apply', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      job_id: input.jobId,
      sheet_name: input.sheetName,
      scope: input.scope
        ? {
            source_section: input.scope.sourceSection,
            headquarter_id: input.scope.headquarterId ?? null,
            site_id: input.scope.siteId ?? null,
          }
        : undefined,
      source_section: input.scope?.sourceSection,
      headquarter_id: input.scope?.headquarterId ?? null,
      site_id: input.scope?.siteId ?? null,
      sourceSection: input.scope?.sourceSection,
    }),
  }, {
    fallbackPath: '/api/excel-imports/apply',
    mapResponse: mapExcelApplyResult,
  });
}
