import 'server-only';

import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';
import {
  createAdminHeadquarter,
  createAdminSite,
  fetchSafetyHeadquartersServer,
  fetchSafetySitesServer,
  updateAdminHeadquarter,
  updateAdminSite,
} from '@/server/admin/safetyApiServer';
import { buildSiteMemoWithRequiredCompletionFields } from '@/lib/admin/siteContractProfile';
import type { SafetySite } from '@/types/backend';
import type {
  SafetyHeadquarter,
  SafetyHeadquarterUpdateInput,
  SafetySiteInput,
  SafetySiteUpdateInput,
} from '@/types/controller';
import type {
  ExcelApplyResult,
  ExcelApplyResultRow,
  ExcelImportPreview,
  ExcelImportPreviewRow,
  ExcelImportScope,
  ExcelImportScopeSummary,
  ExcelImportSheetPreview,
  ExcelRowActionType,
} from '@/types/excelImport';

const JOB_DIR = path.join(os.tmpdir(), 'safetysite-excel-import-jobs');
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const SAMPLE_ROW_COUNT = 5;
const REQUIRED_FIELD_LABELS = {
  contact_name: '본사 담당자명',
  contact_phone: '본사 연락처',
  manager_name: '현장소장명',
  manager_phone: '현장소장 연락처',
  site_address: '현장 주소',
} as const;
const FIELD_ALIASES: Record<string, string[]> = {
  business_registration_no: ['사업자등록번호', '사업자 등록번호', '사업자번호'],
  contact_name: ['본사담당자', '담당자', '연락담당자'],
  contact_phone: ['본사연락처', '대표전화', '전화번호', '연락처', '전화'],
  contract_date: ['계약일', '계약체결일'],
  contract_type: ['계약유형', '계약종류'],
  corporate_registration_no: ['법인등록번호', '법인 등록번호'],
  headquarter_name: ['사업장명', '본사명', '회사명', '본점명', '지점명', '업체명'],
  license_no: ['면허번호', '등록번호'],
  management_number: ['사업장관리번호', '관리번호', '관리 번호'],
  manager_name: ['현장소장', '현장소장명', '현장담당자'],
  manager_phone: ['현장소장연락처', '현장연락처', '담당자연락처', '소장연락처'],
  per_visit_amount: ['회당단가', '회차당단가', '1회당단가'],
  project_amount: ['공사금액', '도급금액', '금액', '계약금액'],
  project_end_date: ['준공일', '공사종료일', '종료일'],
  project_start_date: ['착공일', '공사시작일', '시작일'],
  road_address: ['도로명주소'],
  site_address: ['현장주소', '주소', '사업장주소', '소재지'],
  site_code: ['현장코드', '사업개시번호', '사업장개시번호', '현장번호'],
  site_name: ['현장명', '공사명', '현장', '사업장명'],
  total_contract_amount: ['총계약금액', '총계약액', '계약총액'],
  total_rounds: ['총회차', '총 회차', '회차수'],
};
const XML_PARSER = new XMLParser({
  attributeNamePrefix: '',
  ignoreAttributes: false,
  parseTagValue: false,
  trimValues: false,
});

type LocalRow = {
  rowIndex: number;
  values: Record<string, string>;
  explicitAction?: ExcelRowActionType;
  headquarterId?: string | null;
  siteId?: string | null;
  inScope?: boolean;
  exclusionReason?: string | null;
  exclusionReasonCode?:
    | 'different_headquarter'
    | 'different_site'
    | 'scope_ambiguous'
    | 'scope_unresolved'
    | null;
};
type LocalSheet = ExcelImportSheetPreview & { rows: LocalRow[] };
type LocalJob = {
  createdAt: string;
  fileName: string;
  jobId: string;
  scope: ExcelImportScopeSummary;
  sheets: LocalSheet[];
};
type DuplicateCandidate = {
  headquarterId: string | null;
  id: string;
  kind: 'headquarter' | 'site';
  label: string;
  reason: string;
  siteId: string | null;
};
type ScopeDecision = {
  exclusionReason: string | null;
  exclusionReasonCode:
    | 'different_headquarter'
    | 'different_site'
    | 'scope_ambiguous'
    | 'scope_unresolved'
    | null;
  explicitAction?: ExcelRowActionType;
  headquarterId?: string | null;
  siteId?: string | null;
  inScope: boolean;
};

function buildInScopeDecision(
  partial: Omit<ScopeDecision, 'inScope' | 'exclusionReason' | 'exclusionReasonCode'> = {},
): ScopeDecision {
  return {
    exclusionReason: null,
    exclusionReasonCode: null,
    inScope: true,
    ...partial,
  };
}
type ParsedXmlNode = Record<string, unknown>;
type WorkbookSheetNode = {
  name?: unknown;
  'r:id'?: unknown;
};

export class LocalExcelImportError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'LocalExcelImportError';
    this.status = status;
  }
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeKey(value: unknown) {
  return normalizeText(value).toLowerCase().replace(/[^0-9a-z가-힣]+/g, '');
}

function parseDateValue(value: unknown) {
  const normalized = normalizeText(value).replace(/[./]/g, '-');
  if (!normalized) return '';
  if (/^\d{8}$/.test(normalized)) {
    return `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}`;
  }
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
}

function parseNumberValue(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const normalized = normalizeText(value).replace(/,/g, '').replace(/[^0-9.-]+/g, '');
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseIntValue(value: unknown) {
  const parsed = parseNumberValue(value);
  return parsed == null ? null : Math.trunc(parsed);
}

function parseContractType(value: unknown): SafetySiteInput['contract_type'] | null {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  if (normalized.includes('민간')) return 'private';
  if (normalized.includes('수의')) return 'negotiated';
  if (normalized.includes('입찰')) return 'bid';
  if (normalized.includes('유지')) return 'maintenance';
  return 'other';
}

function arrayOf<T>(value: T | T[] | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  return value == null ? [] : [value];
}

function cellRefToIndex(reference: string) {
  const matched = reference.match(/[A-Z]+/i)?.[0] || '';
  return matched.split('').reduce((sum, char) => sum * 26 + char.toUpperCase().charCodeAt(0) - 64, 0) - 1;
}

function extractTextNode(node: unknown): string {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map((item) => extractTextNode(item)).join('');
  if (!node || typeof node !== 'object') return '';
  const record = node as Record<string, unknown>;
  if (typeof record['#text'] === 'string') return record['#text'];
  if ('t' in record) return extractTextNode(record.t);
  if ('r' in record) return extractTextNode(record.r);
  return '';
}

async function ensureJobDir() {
  await fs.mkdir(JOB_DIR, { recursive: true });
}

function getJobPath(jobId: string) {
  return path.join(JOB_DIR, `${jobId}.json`);
}

async function saveJob(job: LocalJob) {
  await ensureJobDir();
  await fs.writeFile(getJobPath(job.jobId), JSON.stringify(job), 'utf8');
}

async function readJob(jobId: string): Promise<LocalJob> {
  try {
    const payload = await fs.readFile(getJobPath(jobId), 'utf8');
    return JSON.parse(payload) as LocalJob;
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      throw new LocalExcelImportError('엑셀 업로드 작업을 찾을 수 없습니다.', 404);
    }
    throw error;
  }
}

function generateJobId() {
  return `excel-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildSuggestedMapping(headers: string[]) {
  const normalizedHeaders = new Map(headers.map((header) => [header, normalizeKey(header)]));
  return Object.fromEntries(
    Object.entries(FIELD_ALIASES)
      .map(([field, aliases]) => {
        const matchedHeader = aliases
          .map((alias) => normalizeKey(alias))
          .flatMap((aliasKey) =>
            headers.filter((header) => {
              const normalizedHeader = normalizedHeaders.get(header) || '';
              return aliasKey && normalizedHeader.includes(aliasKey);
            }),
          )[0];
        return matchedHeader ? [field, matchedHeader] : null;
      })
      .filter((item): item is [string, string] => Boolean(item)),
  );
}

function extractMappedRow(values: Record<string, string>, mapping: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(mapping)
      .filter(([, header]) => Boolean(header))
      .map(([field, header]) => [field, normalizeText(values[header])]),
  );
}

function buildHeadquarterLookup(headquarters: SafetyHeadquarter[]) {
  const byBusinessNumber = new Map<string, SafetyHeadquarter[]>();
  const byName = new Map<string, SafetyHeadquarter[]>();
  for (const headquarter of headquarters) {
    const businessNumber = normalizeKey(headquarter.business_registration_no);
    if (businessNumber) {
      byBusinessNumber.set(businessNumber, [...(byBusinessNumber.get(businessNumber) || []), headquarter]);
    }
    const name = normalizeKey(headquarter.name);
    if (name) {
      byName.set(name, [...(byName.get(name) || []), headquarter]);
    }
  }
  return { byBusinessNumber, byName };
}

function buildSiteLookup(sites: SafetySite[]) {
  const byManagementNumber = new Map<string, SafetySite[]>();
  const byHeadquarterAndName = new Map<string, SafetySite[]>();
  const byNameAndDates = new Map<string, SafetySite[]>();
  for (const site of sites) {
    const managementNumber = normalizeKey(site.management_number);
    if (managementNumber) {
      byManagementNumber.set(managementNumber, [...(byManagementNumber.get(managementNumber) || []), site]);
    }
    const siteName = normalizeKey(site.site_name);
    if (site.headquarter_id && siteName) {
      const key = `${site.headquarter_id}::${siteName}`;
      byHeadquarterAndName.set(key, [...(byHeadquarterAndName.get(key) || []), site]);
    }
    const startDate = parseDateValue(site.project_start_date);
    const endDate = parseDateValue(site.project_end_date);
    if (siteName && startDate && endDate) {
      const key = `${siteName}::${startDate}::${endDate}`;
      byNameAndDates.set(key, [...(byNameAndDates.get(key) || []), site]);
    }
  }
  return { byHeadquarterAndName, byManagementNumber, byNameAndDates };
}

function buildScopeSummary(
  scope: ExcelImportScope | undefined,
  headquartersById: Map<string, SafetyHeadquarter>,
  sitesById: Map<string, SafetySite>,
): ExcelImportScopeSummary {
  const sourceSection = scope?.sourceSection === 'sites' ? 'sites' : 'headquarters';
  const targetSite = scope?.siteId ? sitesById.get(scope.siteId) ?? null : null;
  const headquarterId = targetSite?.headquarter_id ?? scope?.headquarterId ?? null;
  return {
    sourceSection,
    headquarterId,
    label: targetSite ? '현장 1곳' : headquarterId ? '사업장 1곳' : '전체',
    siteId: targetSite?.id ?? scope?.siteId ?? null,
  };
}

function rowMatchesHeadquarter(rowData: Record<string, string>, targetHeadquarter: SafetyHeadquarter | null) {
  if (!targetHeadquarter) return false;
  const businessNumber = normalizeKey(rowData.business_registration_no);
  if (businessNumber && businessNumber === normalizeKey(targetHeadquarter.business_registration_no)) {
    return true;
  }
  const headquarterName = normalizeKey(rowData.headquarter_name);
  return Boolean(headquarterName && headquarterName === normalizeKey(targetHeadquarter.name));
}

function rowMatchesSite(
  rowData: Record<string, string>,
  targetSite: SafetySite | null,
  targetHeadquarter: SafetyHeadquarter | null,
) {
  if (!targetSite) return false;
  const managementNumber = normalizeKey(rowData.management_number);
  if (managementNumber && managementNumber === normalizeKey(targetSite.management_number)) {
    return true;
  }
  const siteCode = normalizeKey(rowData.site_code);
  if (siteCode && siteCode === normalizeKey(targetSite.site_code)) {
    return true;
  }
  const siteName = normalizeKey(rowData.site_name);
  const startDate = parseDateValue(rowData.project_start_date);
  const endDate = parseDateValue(rowData.project_end_date);
  if (
    siteName &&
    startDate &&
    endDate &&
    siteName === normalizeKey(targetSite.site_name) &&
    startDate === parseDateValue(targetSite.project_start_date) &&
    endDate === parseDateValue(targetSite.project_end_date)
  ) {
    return true;
  }
  return Boolean(
    rowMatchesHeadquarter(rowData, targetHeadquarter) &&
      siteName &&
      siteName === normalizeKey(targetSite.site_name),
  );
}

function uniqueHeadquarterIds(candidates: DuplicateCandidate[]) {
  return Array.from(
    new Set(
      candidates
        .map((candidate) => candidate.headquarterId)
        .filter((value): value is string => Boolean(value)),
    ),
  );
}

function resolveScopeDecision(args: {
  headquarterCandidates: DuplicateCandidate[];
  headquarterLookupById: Map<string, SafetyHeadquarter>;
  rowData: Record<string, string>;
  scope: ExcelImportScopeSummary;
  siteCandidates: DuplicateCandidate[];
  siteLookupById: Map<string, SafetySite>;
}) {
  const {
    headquarterCandidates: nextHeadquarterCandidates,
    headquarterLookupById,
    rowData,
    scope,
    siteCandidates: nextSiteCandidates,
    siteLookupById,
  } = args;
  if (!scope.headquarterId && !scope.siteId) {
    return buildInScopeDecision();
  }

  const targetSite = scope.siteId ? siteLookupById.get(scope.siteId) ?? null : null;
  const targetHeadquarter =
    (targetSite && headquarterLookupById.get(targetSite.headquarter_id)) ||
    (scope.headquarterId ? headquarterLookupById.get(scope.headquarterId) ?? null : null);

  if (scope.siteId) {
    if (nextSiteCandidates.length === 1) {
      const siteCandidate = nextSiteCandidates[0];
      if (siteCandidate.siteId === scope.siteId) {
        return {
          ...buildInScopeDecision({
            explicitAction: 'update_site',
            headquarterId: targetHeadquarter?.id ?? null,
          }),
          siteId: scope.siteId,
        } satisfies ScopeDecision;
      }
      return {
        exclusionReason: '다른 현장 데이터',
        exclusionReasonCode: 'different_site',
        inScope: false,
      } satisfies ScopeDecision;
    }

    if (nextSiteCandidates.length > 1) {
      return {
        exclusionReason: '중복 후보가 여러 개라 스코프를 확정할 수 없음',
        exclusionReasonCode: 'scope_ambiguous',
        inScope: false,
      } satisfies ScopeDecision;
    }

    if (rowMatchesSite(rowData, targetSite, targetHeadquarter)) {
      return {
        ...buildInScopeDecision({
          explicitAction: 'update_site',
          headquarterId: targetHeadquarter?.id ?? null,
        }),
        siteId: scope.siteId,
      } satisfies ScopeDecision;
    }

    if (
      rowMatchesHeadquarter(rowData, targetHeadquarter) ||
      uniqueHeadquarterIds(nextHeadquarterCandidates).includes(targetHeadquarter?.id ?? '')
    ) {
      return {
        exclusionReason: '다른 현장 데이터',
        exclusionReasonCode: 'different_site',
        inScope: false,
      } satisfies ScopeDecision;
    }

    return {
      exclusionReason: '현재 스코프와 일치 판단 불가',
      exclusionReasonCode: 'scope_unresolved',
      inScope: false,
    } satisfies ScopeDecision;
  }

  const siteHeadquarterIds = uniqueHeadquarterIds(nextSiteCandidates);
  if (siteHeadquarterIds.length === 1) {
    if (siteHeadquarterIds[0] === scope.headquarterId) {
      return buildInScopeDecision();
    }
    return {
      exclusionReason: '다른 사업장 데이터',
      exclusionReasonCode: 'different_headquarter',
      inScope: false,
    } satisfies ScopeDecision;
  }

  if (siteHeadquarterIds.length > 1) {
    return {
      exclusionReason: '중복 후보가 여러 개라 스코프를 확정할 수 없음',
      exclusionReasonCode: 'scope_ambiguous',
      inScope: false,
    } satisfies ScopeDecision;
  }

  const candidateHeadquarterIds = uniqueHeadquarterIds(nextHeadquarterCandidates);
  if (candidateHeadquarterIds.length === 1) {
    if (candidateHeadquarterIds[0] === scope.headquarterId) {
      return {
        ...buildInScopeDecision({
          explicitAction: 'update_headquarter',
          headquarterId: scope.headquarterId,
        }),
      } satisfies ScopeDecision;
    }
    return {
      exclusionReason: '다른 사업장 데이터',
      exclusionReasonCode: 'different_headquarter',
      inScope: false,
    } satisfies ScopeDecision;
  }

  if (candidateHeadquarterIds.length > 1) {
    return {
      exclusionReason: '중복 후보가 여러 개라 스코프를 확정할 수 없음',
      exclusionReasonCode: 'scope_ambiguous',
      inScope: false,
    } satisfies ScopeDecision;
  }

  if (rowMatchesHeadquarter(rowData, targetHeadquarter)) {
    return {
      ...buildInScopeDecision({
        explicitAction: 'update_headquarter',
        headquarterId: scope.headquarterId,
      }),
    } satisfies ScopeDecision;
  }

  return {
    exclusionReason: '현재 스코프와 일치 판단 불가',
    exclusionReasonCode: 'scope_unresolved',
    inScope: false,
  } satisfies ScopeDecision;
}

function headquarterCandidates(
  rowData: Record<string, string>,
  headquarterLookup: ReturnType<typeof buildHeadquarterLookup>,
): DuplicateCandidate[] {
  const businessNo = normalizeKey(rowData.business_registration_no);
  if (businessNo && headquarterLookup.byBusinessNumber.has(businessNo)) {
    return (headquarterLookup.byBusinessNumber.get(businessNo) || []).map((headquarter) => ({
      headquarterId: headquarter.id,
      id: headquarter.id,
      kind: 'headquarter',
      label: headquarter.name || '사업장',
      reason: '사업자등록번호 일치',
      siteId: null,
    }));
  }

  const headquarterName = normalizeKey(rowData.headquarter_name);
  if (!headquarterName) return [];
  return (headquarterLookup.byName.get(headquarterName) || []).map((headquarter) => ({
    headquarterId: headquarter.id,
    id: headquarter.id,
    kind: 'headquarter',
    label: headquarter.name || '사업장',
    reason: '사업장명 일치',
    siteId: null,
  }));
}

function siteCandidates(
  rowData: Record<string, string>,
  headquarterLookup: ReturnType<typeof buildHeadquarterLookup>,
  siteLookup: ReturnType<typeof buildSiteLookup>,
): DuplicateCandidate[] {
  const managementNumber = normalizeKey(rowData.management_number);
  if (managementNumber && siteLookup.byManagementNumber.has(managementNumber)) {
    return (siteLookup.byManagementNumber.get(managementNumber) || []).map((site) => ({
      headquarterId: site.headquarter_id,
      id: site.id,
      kind: 'site',
      label: site.site_name || '현장',
      reason: '사업장 관리번호 일치',
      siteId: site.id,
    }));
  }

  const businessNo = normalizeKey(rowData.business_registration_no);
  const siteName = normalizeKey(rowData.site_name);
  if (businessNo && siteName) {
    const headquarterIds = new Set(
      (headquarterLookup.byBusinessNumber.get(businessNo) || []).map((headquarter) => headquarter.id),
    );
    const matches = Array.from(headquarterIds).flatMap((headquarterId) =>
      siteLookup.byHeadquarterAndName.get(`${headquarterId}::${siteName}`) || [],
    );
    if (matches.length > 0) {
      return matches.map((site) => ({
        headquarterId: site.headquarter_id,
        id: site.id,
        kind: 'site',
        label: site.site_name || '현장',
        reason: '사업자등록번호 + 현장명 일치',
        siteId: site.id,
      }));
    }
  }

  const startDate = parseDateValue(rowData.project_start_date);
  const endDate = parseDateValue(rowData.project_end_date);
  if (!(siteName && startDate && endDate)) return [];
  return (siteLookup.byNameAndDates.get(`${siteName}::${startDate}::${endDate}`) || []).map((site) => ({
    headquarterId: site.headquarter_id,
    id: site.id,
    kind: 'site',
    label: site.site_name || '현장',
    reason: '현장명 + 공사기간 일치',
    siteId: site.id,
  }));
}

function suggestAction(siteMatches: DuplicateCandidate[], headquarterMatches: DuplicateCandidate[]) {
  if (siteMatches.length === 1) return 'update_site';
  if (siteMatches.length > 1) return 'create';
  if (headquarterMatches.length === 1) return 'update_headquarter';
  if (headquarterMatches.length > 1) return 'create';
  return 'create';
}

function buildRowSummary(rowData: Record<string, string>) {
  const parts = [rowData.headquarter_name, rowData.site_name].filter(Boolean);
  if (rowData.management_number) {
    parts.push(`관리번호 ${rowData.management_number}`);
  }
  return parts.join(' / ') || '요약 불가';
}

function buildSheetSummary(rowPreviews: ExcelImportPreviewRow[]) {
  return rowPreviews.reduce(
    (summary, row) => {
      if (row.suggestedAction === 'update_site') {
        summary.updateSiteCount += 1;
        return summary;
      }
      if (row.suggestedAction === 'update_headquarter') {
        summary.updateHeadquarterCount += 1;
        return summary;
      }
      summary.createCount += 1;
      if (row.duplicateCandidates.length > 1) {
        summary.ambiguousCreateCount += 1;
      }
      return summary;
    },
    { ambiguousCreateCount: 0, createCount: 0, updateHeadquarterCount: 0, updateSiteCount: 0 },
  );
}

function sanitizeCellValue(value: unknown) {
  if (value == null) return '';
  return typeof value === 'string' ? value.trim() : String(value).trim();
}

function extractSharedStrings(parsed: Record<string, unknown>) {
  return arrayOf((parsed.sst as { si?: unknown } | undefined)?.si).map((item) => extractTextNode(item).trim());
}

function readCellValue(cell: Record<string, unknown>, sharedStrings: string[]) {
  const cellType = normalizeText(cell.t);
  if (cellType === 's') {
    const index = Number(extractTextNode(cell.v));
    return sanitizeCellValue(sharedStrings[index] || '');
  }
  if (cellType === 'inlineStr') {
    return sanitizeCellValue(extractTextNode(cell.is));
  }
  return sanitizeCellValue(extractTextNode(cell.v));
}

async function parseWorkbook(fileName: string, fileBytes: Uint8Array) {
  if (!fileName.toLowerCase().endsWith('.xlsx')) {
    throw new LocalExcelImportError('업로드할 .xlsx 파일을 선택해 주세요.');
  }
  if (fileBytes.byteLength === 0) {
    throw new LocalExcelImportError('빈 파일은 업로드할 수 없습니다.');
  }
  if (fileBytes.byteLength > MAX_FILE_BYTES) {
    throw new LocalExcelImportError('엑셀 업로드 파일은 10MB를 초과할 수 없습니다.');
  }

  const zip = await JSZip.loadAsync(fileBytes);
  const workbookXml = await zip.file('xl/workbook.xml')?.async('string');
  const workbookRelsXml = await zip.file('xl/_rels/workbook.xml.rels')?.async('string');
  if (!workbookXml || !workbookRelsXml) {
    throw new LocalExcelImportError('엑셀 파일을 읽지 못했습니다. .xlsx 파일인지 확인해 주세요.');
  }

  const sharedStringsXml = await zip.file('xl/sharedStrings.xml')?.async('string');
  const sharedStrings = sharedStringsXml ? extractSharedStrings(XML_PARSER.parse(sharedStringsXml)) : [];
  const workbook = XML_PARSER.parse(workbookXml) as ParsedXmlNode;
  const workbookRels = XML_PARSER.parse(workbookRelsXml) as ParsedXmlNode;
  const relationMap = new Map(
    arrayOf((workbookRels.Relationships as ParsedXmlNode | undefined)?.Relationship as ParsedXmlNode | ParsedXmlNode[] | undefined).map((relationship) => [
      normalizeText(relationship.Id),
      `xl/${normalizeText(relationship.Target).replace(/^\/+/, '')}`,
    ]),
  );

  return arrayOf(
    (((workbook.workbook as ParsedXmlNode | undefined)?.sheets as ParsedXmlNode | undefined)?.sheet as
      | WorkbookSheetNode
      | WorkbookSheetNode[]
      | undefined),
  ).map(async (sheetNode) => {
    const relationId = normalizeText(sheetNode['r:id']);
    const sheetPath = relationMap.get(relationId);
    const sheetXml = sheetPath ? await zip.file(sheetPath)?.async('string') : null;
    if (!sheetXml) {
      return null;
    }
    const sheet = XML_PARSER.parse(sheetXml) as ParsedXmlNode;
    const rows = arrayOf(
      (((sheet.worksheet as ParsedXmlNode | undefined)?.sheetData as ParsedXmlNode | undefined)?.row as
        | ParsedXmlNode
        | ParsedXmlNode[]
        | undefined),
    );
    const parsedRows: Array<{ rowIndex: number; values: string[] }> = rows.map((row) => {
      const cells = arrayOf<Record<string, unknown>>(
        row.c as Record<string, unknown> | Record<string, unknown>[] | null | undefined,
      );
      const values: string[] = [];
      for (const cell of cells) {
        const columnIndex = cellRefToIndex(normalizeText(cell.r));
        values[columnIndex] = readCellValue(cell, sharedStrings);
      }
      return {
        rowIndex: Number(row.r || 0),
        values: values.map((value) => sanitizeCellValue(value)),
      };
    });
    return {
      name: normalizeText(sheetNode.name),
      rows: parsedRows,
    };
  });
}

function rowArrayToRecord(headers: string[], rowValues: string[]) {
  return Object.fromEntries(headers.map((header, index) => [header, rowValues[index] || '']));
}

function buildHeadquarterPayload(
  rowData: Record<string, string>,
): SafetyHeadquarterUpdateInput & Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  const headquarterName = normalizeText(rowData.headquarter_name);
  if (headquarterName) payload.name = headquarterName;
  for (const key of ['business_registration_no', 'corporate_registration_no', 'license_no', 'contact_name', 'contact_phone'] as const) {
    const value = normalizeText(rowData[key]);
    if (value) payload[key] = value;
  }
  const address = normalizeText(rowData.road_address) || normalizeText(rowData.site_address);
  if (address) payload.address = address;
  return payload;
}

function buildSitePayload(rowData: Record<string, string>, headquarterId?: string | null): SafetySiteUpdateInput {
  const payload: SafetySiteUpdateInput = {};
  const siteName = normalizeText(rowData.site_name);
  if (siteName) payload.site_name = siteName;
  const siteCode = normalizeText(rowData.site_code);
  if (siteCode) payload.site_code = siteCode;
  const managementNumber = normalizeText(rowData.management_number);
  if (managementNumber) payload.management_number = managementNumber;
  const managerName = normalizeText(rowData.manager_name);
  if (managerName) payload.manager_name = managerName;
  const managerPhone = normalizeText(rowData.manager_phone);
  if (managerPhone) payload.manager_phone = managerPhone;
  const siteAddress = normalizeText(rowData.road_address) || normalizeText(rowData.site_address);
  if (siteAddress) payload.site_address = siteAddress;
  const projectStartDate = parseDateValue(rowData.project_start_date);
  if (projectStartDate) payload.project_start_date = projectStartDate;
  const projectEndDate = parseDateValue(rowData.project_end_date);
  if (projectEndDate) payload.project_end_date = projectEndDate;
  const projectAmount = parseNumberValue(rowData.project_amount);
  if (projectAmount != null) payload.project_amount = projectAmount;
  const contractDate = parseDateValue(rowData.contract_date);
  if (contractDate) payload.contract_date = contractDate;
  const totalRounds = parseIntValue(rowData.total_rounds);
  if (totalRounds != null) payload.total_rounds = totalRounds;
  const perVisitAmount = parseNumberValue(rowData.per_visit_amount);
  if (perVisitAmount != null) payload.per_visit_amount = perVisitAmount;
  const totalContractAmount = parseNumberValue(rowData.total_contract_amount);
  if (totalContractAmount != null) payload.total_contract_amount = totalContractAmount;
  const contractType = parseContractType(rowData.contract_type);
  if (contractType) payload.contract_type = contractType;
  if (headquarterId) payload.headquarter_id = headquarterId;
  return payload;
}

function computeRequiredCompletionFields(headquarter: SafetyHeadquarter, site: SafetySite) {
  const fields: string[] = [];
  if (!normalizeText(site.manager_name)) fields.push(REQUIRED_FIELD_LABELS.manager_name);
  if (!normalizeText(site.manager_phone)) fields.push(REQUIRED_FIELD_LABELS.manager_phone);
  if (!normalizeText(headquarter.contact_name)) fields.push(REQUIRED_FIELD_LABELS.contact_name);
  if (!normalizeText(headquarter.contact_phone)) fields.push(REQUIRED_FIELD_LABELS.contact_phone);
  if (!normalizeText(site.site_address)) fields.push(REQUIRED_FIELD_LABELS.site_address);
  return fields;
}

function buildPreviewFromJob(job: LocalJob): ExcelImportPreview {
  return {
    createdAt: job.createdAt,
    fileName: job.fileName,
    jobId: job.jobId,
    sheetNames: job.sheets.map((sheet) => sheet.name),
    scope: job.scope,
    sheets: job.sheets.map((sheet) => {
      const { rows, ...previewSheet } = sheet;
      return rows ? previewSheet : previewSheet;
    }),
  };
}

export async function parseLocalExcelWorkbook(
  token: string,
  file: File,
  request: Request,
  scope?: ExcelImportScope,
): Promise<ExcelImportPreview> {
  const [headquarters, sites, parsedSheets] = await Promise.all([
    fetchSafetyHeadquartersServer(token, request),
    fetchSafetySitesServer(token, request),
    parseWorkbook(file.name, new Uint8Array(await file.arrayBuffer())),
  ]);

  const headquarterLookup = buildHeadquarterLookup(headquarters);
  const siteLookup = buildSiteLookup(sites);
  const headquartersById = new Map(headquarters.map((headquarter) => [headquarter.id, headquarter]));
  const sitesById = new Map(sites.map((site) => [site.id, site]));
  const scopeSummary = buildScopeSummary(scope, headquartersById, sitesById);
  const sheets = (await Promise.all(parsedSheets))
    .filter((sheet): sheet is { name: string; rows: Array<{ rowIndex: number; values: string[] }> } => Boolean(sheet))
    .map((sheet) => {
      let headers: string[] = [];
      let headerIndex = -1;
      for (let index = 0; index < sheet.rows.length; index += 1) {
        if (sheet.rows[index].values.some((value) => normalizeText(value))) {
          headers = sheet.rows[index].values.map((value, valueIndex) => normalizeText(value) || `column_${valueIndex + 1}`);
          headerIndex = index;
          break;
        }
      }
      const dataRows = headerIndex >= 0
        ? sheet.rows.slice(headerIndex + 1).map((row) => ({
            rowIndex: row.rowIndex,
            values: rowArrayToRecord(headers, row.values),
          })).filter((row) => Object.values(row.values).some((value) => normalizeText(value)))
        : [];
      const suggestedMapping = buildSuggestedMapping(headers);
      const evaluatedRows = dataRows.map((row) => {
        const rowData = extractMappedRow(row.values, suggestedMapping);
        const nextSiteCandidates = siteCandidates(rowData, headquarterLookup, siteLookup);
        const nextHeadquarterCandidates = headquarterCandidates(rowData, headquarterLookup);
        const scopeDecision = resolveScopeDecision({
          headquarterCandidates: nextHeadquarterCandidates,
          headquarterLookupById: headquartersById,
          rowData,
          scope: scopeSummary,
          siteCandidates: nextSiteCandidates,
          siteLookupById: sitesById,
        });
        return {
          previewRow: {
            duplicateCandidates: [...nextSiteCandidates, ...nextHeadquarterCandidates],
            exclusionReason: scopeDecision.exclusionReason ?? null,
            exclusionReasonCode: scopeDecision.exclusionReasonCode ?? null,
            inScope: scopeDecision.inScope,
            rowIndex: row.rowIndex,
            suggestedAction:
              scopeDecision.explicitAction ?? suggestAction(nextSiteCandidates, nextHeadquarterCandidates),
            summary: buildRowSummary(rowData),
            values: row.values,
          } satisfies ExcelImportPreviewRow,
          storedRow: {
            ...row,
            exclusionReason: scopeDecision.exclusionReason ?? null,
            exclusionReasonCode: scopeDecision.exclusionReasonCode ?? null,
            explicitAction: scopeDecision.explicitAction,
            headquarterId: scopeDecision.headquarterId ?? null,
            inScope: scopeDecision.inScope,
            siteId: scopeDecision.siteId ?? null,
          } satisfies LocalRow,
        };
      });
      const includedRows = evaluatedRows
        .filter((row) => row.previewRow.inScope)
        .map((row) => row.previewRow);
      const excludedRows = evaluatedRows
        .filter((row) => !row.previewRow.inScope)
        .map((row) => row.previewRow);
      return {
        headers,
        excludedRowCount: excludedRows.length,
        excludedRows,
        includedRowCount: includedRows.length,
        includedRows,
        name: sheet.name,
        rowCount: dataRows.length,
        rows: evaluatedRows.map((row) => row.storedRow),
        sampleRows: includedRows.slice(0, SAMPLE_ROW_COUNT).map((row) => row.values),
        suggestedMapping,
        summary: buildSheetSummary(includedRows),
      } satisfies LocalSheet;
    });

  const job: LocalJob = {
    createdAt: new Date().toISOString(),
    fileName: file.name,
    jobId: generateJobId(),
    scope: scopeSummary,
    sheets,
  };
  await saveJob(job);
  return buildPreviewFromJob(job);
}

export async function fetchLocalExcelImportPreview(jobId: string): Promise<ExcelImportPreview> {
  return buildPreviewFromJob(await readJob(jobId));
}

export async function applyLocalExcelWorkbook(
  token: string,
  request: Request,
  input: { jobId: string; sheetName: string; scope?: ExcelImportScope },
): Promise<ExcelApplyResult> {
  const job = await readJob(input.jobId);
  const selectedSheet = job.sheets.find((sheet) => sheet.name === input.sheetName) || job.sheets[0];
  if (!selectedSheet) {
    throw new LocalExcelImportError('선택한 시트를 찾을 수 없습니다.', 404);
  }
  if (selectedSheet.includedRowCount === 0) {
    throw new LocalExcelImportError('현재 스코프에 반영할 데이터 행이 없습니다.');
  }
  if (
    input.scope &&
    (input.scope.siteId ?? null) !== ((job.scope.siteId ?? null) || null)
  ) {
    throw new LocalExcelImportError('현재 업로드 스코프가 변경되어 다시 미리보기가 필요합니다.');
  }
  if (
    input.scope &&
    (input.scope.headquarterId ?? null) !== ((job.scope.headquarterId ?? null) || null)
  ) {
    throw new LocalExcelImportError('현재 업로드 스코프가 변경되어 다시 미리보기가 필요합니다.');
  }

  let headquarters = await fetchSafetyHeadquartersServer(token, request);
  let sites = await fetchSafetySitesServer(token, request);
  const resultRows: ExcelApplyResultRow[] = [];
  const summary = {
    completionRequiredCount: 0,
    createdHeadquarterCount: 0,
    createdSiteCount: 0,
    updatedHeadquarterCount: 0,
    updatedSiteCount: 0,
  };

  for (const row of selectedSheet.rows) {
    if (!row.inScope) {
      continue;
    }
    const rowData = extractMappedRow(row.values, selectedSheet.suggestedMapping);
    if (!Object.values(rowData).some((value) => normalizeText(value))) {
      continue;
    }

    const nextHeadquarterLookup = buildHeadquarterLookup(headquarters);
    const nextSiteLookup = buildSiteLookup(sites);
    const siteMatches = siteCandidates(rowData, nextHeadquarterLookup, nextSiteLookup);
    const headquarterMatches = headquarterCandidates(rowData, nextHeadquarterLookup);
    const action = row.explicitAction ?? suggestAction(siteMatches, headquarterMatches);

    let headquarter: SafetyHeadquarter | null = null;
    let site: SafetySite | null = null;

    if (action === 'update_site') {
      const targetSiteId =
        row.siteId ??
        (siteMatches.length === 1 ? siteMatches[0].siteId : null);
      site = sites.find((item) => item.id === targetSiteId) || null;
      if (!site) {
        throw new Error(`${row.rowIndex}행의 현장 갱신 대상을 찾을 수 없습니다.`);
      }
      site = await updateAdminSite(token, site.id, buildSitePayload(rowData), request);
      headquarter = headquarters.find((item) => item.id === site!.headquarter_id) || null;
      summary.updatedSiteCount += 1;
    } else if (action === 'update_headquarter') {
      const targetHeadquarterId =
        row.headquarterId ??
        (headquarterMatches.length === 1 ? headquarterMatches[0].headquarterId : null);
      headquarter = headquarters.find((item) => item.id === targetHeadquarterId) || null;
      if (!headquarter) {
        throw new Error(`${row.rowIndex}행의 사업장 갱신 대상을 찾을 수 없습니다.`);
      }
      headquarter = await updateAdminHeadquarter(token, headquarter.id, buildHeadquarterPayload(rowData), request);
      summary.updatedHeadquarterCount += 1;
      const targetSiteId =
        row.siteId ??
        (siteMatches.length === 1 ? siteMatches[0].siteId : null);
      if (targetSiteId) {
        site = await updateAdminSite(
          token,
          targetSiteId,
          buildSitePayload(rowData, headquarter.id),
          request,
        );
        summary.updatedSiteCount += 1;
      } else {
        site = await createAdminSite(
          token,
          {
            headquarter_id: headquarter.id,
            site_name: normalizeText(rowData.site_name) || '엑셀 현장',
            status: 'active',
            ...buildSitePayload(rowData, headquarter.id),
          },
          request,
        );
        summary.createdSiteCount += 1;
      }
    } else {
      const existingHeadquarter = headquarterMatches.length === 1
        ? headquarters.find((item) => item.id === headquarterMatches[0].headquarterId) || null
        : null;
      if (existingHeadquarter) {
        headquarter = await updateAdminHeadquarter(
          token,
          existingHeadquarter.id,
          buildHeadquarterPayload(rowData),
          request,
        );
        summary.updatedHeadquarterCount += 1;
      } else {
        headquarter = await createAdminHeadquarter(
          token,
          {
            address: normalizeText(rowData.road_address) || normalizeText(rowData.site_address) || null,
            business_registration_no: normalizeText(rowData.business_registration_no) || null,
            contact_name: normalizeText(rowData.contact_name) || null,
            contact_phone: normalizeText(rowData.contact_phone) || null,
            corporate_registration_no: normalizeText(rowData.corporate_registration_no) || null,
            license_no: normalizeText(rowData.license_no) || null,
            name: normalizeText(rowData.headquarter_name) || normalizeText(rowData.site_name) || '엑셀 사업장',
          },
          request,
        );
        summary.createdHeadquarterCount += 1;
      }
      site = await createAdminSite(
        token,
        {
          headquarter_id: headquarter.id,
          site_name: normalizeText(rowData.site_name) || '엑셀 현장',
          status: 'active',
          ...buildSitePayload(rowData, headquarter.id),
        },
        request,
      );
      summary.createdSiteCount += 1;
    }

    if (!headquarter || !site) {
      throw new Error(`${row.rowIndex}행의 반영 결과를 확인하지 못했습니다.`);
    }

    const requiredCompletionFields = computeRequiredCompletionFields(headquarter, site);
    if (requiredCompletionFields.length > 0) {
      site = await updateAdminSite(
        token,
        site.id,
        {
          memo: buildSiteMemoWithRequiredCompletionFields(site, requiredCompletionFields),
        } as SafetySiteUpdateInput,
        request,
      );
      summary.completionRequiredCount += 1;
    }

    headquarters = headquarters.some((item) => item.id === headquarter!.id)
      ? headquarters.map((item) => (item.id === headquarter!.id ? headquarter! : item))
      : [...headquarters, headquarter];
    sites = sites.some((item) => item.id === site!.id)
      ? sites.map((item) => (item.id === site!.id ? site! : item))
      : [...sites, site];

    resultRows.push({
      action,
      headquarterId: headquarter.id,
      headquarterName: headquarter.name,
      message: '적용 완료',
      requiredCompletionFields,
      rowIndex: row.rowIndex,
      siteId: site.id,
      siteName: site.site_name,
    });
  }

  return { rows: resultRows, summary };
}
