import 'server-only';

import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';
import {
  createAdminHeadquarter,
  createAdminSite,
  fetchAdminCoreData,
  updateAdminHeadquarter,
  updateAdminSite,
} from '@/server/admin/safetyApiServer';
import {
  buildSiteMemoWithContractProfile,
  parseSiteContractProfile,
  parseSiteMemoNote,
} from '@/lib/admin/siteContractProfile';
import type { SafetySite } from '@/types/backend';
import type {
  SafetyHeadquarter,
  SafetyHeadquarterUpdateInput,
  SafetySiteUpdateInput,
} from '@/types/controller';
import type {
  ExcelDetectedMapping,
  ExcelIgnoredHeader,
  ExcelApplyResult,
  ExcelApplyResultRow,
  ExcelImportPreview,
  ExcelImportPreviewRow,
  ExcelImportScope,
  ExcelImportScopeSummary,
  ExcelImportSheetPreview,
  ExcelRowActionType,
} from '@/types/excelImport';
import { mergeImportedSchedules, type ImportedScheduleSeed } from './importedSchedules';
import { provisionExcelWorkerAssignment } from './workerProvisioning';

const JOB_DIR = path.join(os.tmpdir(), 'safetysite-excel-import-jobs');
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const SAMPLE_ROW_COUNT = 5;
const REQUIRED_FIELD_LABELS = {
  contact_phone: '본사 연락처',
  guidance_officer_name: '지도원',
  labor_office: '노동관서',
  manager_name: '현장소장명',
  site_name: '현장명',
  site_address: '현장 주소',
} as const;
const FIELD_ALIASES: Record<string, string[]> = {
  headquarter_name: ['회사명', '사업장명', '본사명', '본점명', '지점명', '업체명'],
  headquarter_management_number: ['사업장관리번호', '관리번호', '관리 번호'],
  headquarter_opening_number: ['사업장개시번호', '사업개시번호'],
  contact_phone: ['전화', '본사연락처', '대표전화', '전화번호', '연락처'],
  site_name: ['현장명', '공사명', '현장'],
  labor_office: ['노동관서'],
  guidance_officer_name: ['지도원', '지도요원'],
  project_start_date: ['착공일', '공사시작일', '시작일'],
  project_end_date: ['준공일', '공사종료일', '종료일'],
  project_amount: ['공사금액', '도급금액', '금액', '계약금액'],
  project_scale: ['공사규모'],
  project_kind: ['공사종류'],
  client_management_number: ['발주자 사업장관리번호'],
  client_business_name: ['발주자 사업자명', '발주자명'],
  client_representative_name: ['발주자 대표자'],
  client_corporate_registration_no: ['발주자법인등록번호', '발주자 법인등록번호'],
  client_business_registration_no: ['발주자 사업자등록번호'],
  order_type_division: ['발주유형구분'],
  technical_guidance_kind: ['기술지도 구분'],
  manager_name: ['현장소장', '현장소장명', '현장담당자', '현장책임자명'],
  manager_phone: ['현장소장연락처', '현장연락처', '담당자연락처', '소장연락처'],
  inspector_name: ['점검자'],
  contract_contact_name: ['계약담당자'],
  site_address: ['소재지', '현장주소', '주소', '사업장주소'],
  contract_start_date: ['계약시작일'],
  contract_end_date: ['계약 종료일', '계약종료일'],
  contract_signed_date: ['계약 체결일', '계약체결일', '계약일'],
  round_no: ['회차'],
  visit_date: ['기술지도일'],
  completion_status: ['완료여부'],
  total_contract_amount: ['총계약금액', '총계약액', '계약총액', '기술지도대가', '기술지도 대가'],
  total_rounds: ['총회차', '총 회차', '회차수', '기술지도횟수', '기술지도 횟수'],
};
const MAPPING_NOTES: Record<string, Record<string, string>> = {
  contract_contact_name: {
    계약담당자: '계약담당자 기준으로 계약담당자명에 반영됩니다.',
  },
  total_contract_amount: {
    '기술지도 대가': '기술지도 대가를 총 계약금액으로 반영합니다.',
    기술지도대가: '기술지도 대가를 총 계약금액으로 반영합니다.',
  },
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
type MappingAnalysis = {
  detectedMappings: ExcelDetectedMapping[];
  hasRiskyMapping: boolean;
  ignoredHeaders: ExcelIgnoredHeader[];
  mappingWarnings: string[];
  suggestedMapping: Record<string, string>;
};

type PreparedApplyRow = {
  action: ExcelRowActionType;
  groupKey: string;
  headquarterMatches: DuplicateCandidate[];
  row: LocalRow;
  rowData: Record<string, string>;
  siteMatches: DuplicateCandidate[];
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

function decodeHtmlEntities(value: string) {
  return value.replace(/&#(x?[0-9a-f]+);/gi, (_, rawCode: string) => {
    const isHex = rawCode.toLowerCase().startsWith('x');
    const codePoint = Number.parseInt(isHex ? rawCode.slice(1) : rawCode, isHex ? 16 : 10);
    if (!Number.isFinite(codePoint)) return '';
    try {
      return String.fromCodePoint(codePoint);
    } catch {
      return '';
    }
  });
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

function isAutoIgnoredHeader(header: string) {
  return normalizeKey(header).startsWith(normalizeKey('발주자'));
}

function findExactHeaderMatch(headers: string[], aliases: string[], usedHeaders: Set<string>) {
  const aliasKeys = aliases.map((alias) => normalizeKey(alias)).filter(Boolean);
  for (const header of headers) {
    if (usedHeaders.has(header)) {
      continue;
    }
    const normalizedHeader = normalizeKey(header);
    if (aliasKeys.some((aliasKey) => aliasKey === normalizedHeader)) {
      return header;
    }
  }
  return null;
}

function buildIgnoredHeaders(headers: string[], suggestedMapping: Record<string, string>): ExcelIgnoredHeader[] {
  const mappedHeaders = new Set(Object.values(suggestedMapping).map((header) => normalizeText(header)));
  return headers
    .filter((header) => !mappedHeaders.has(normalizeText(header)) && isAutoIgnoredHeader(header))
    .map((header) => ({
      header,
      reason: '현재 업로드 필드 세트에 포함되지 않은 발주자 컬럼입니다.',
    }));
}

function buildMappingWarnings(
  suggestedMapping: Record<string, string>,
  ignoredHeaders: ExcelIgnoredHeader[],
) {
  const warnings: string[] = [];
  void ignoredHeaders;
  if (!suggestedMapping.headquarter_management_number) {
    warnings.push('사업장관리번호가 없어 사업장 중복 판정은 사업장개시번호 또는 회사명 기준으로 진행합니다.');
  }
  if (!suggestedMapping.headquarter_opening_number) {
    warnings.push('사업장개시번호가 없어 사업장 식별은 사업장관리번호 또는 회사명 기준으로 진행합니다.');
  }
  if (!suggestedMapping.site_name) {
    warnings.push('현장명이 없어 현장 생성/갱신 정확도가 낮아질 수 있습니다.');
  }

  return warnings;
}

function buildSuggestedMapping(headers: string[]): MappingAnalysis {
  const usedHeaders = new Set<string>();
  const suggestedMapping: Record<string, string> = {};
  const detectedMappings: ExcelDetectedMapping[] = [];

  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    const matchedHeader = findExactHeaderMatch(headers, aliases, usedHeaders);
    if (!matchedHeader) {
      continue;
    }
    usedHeaders.add(matchedHeader);
    suggestedMapping[field] = matchedHeader;
    detectedMappings.push({
      field,
      header: matchedHeader,
      note: MAPPING_NOTES[field]?.[matchedHeader] ?? null,
    });
  }

  const ignoredHeaders = buildIgnoredHeaders(headers, suggestedMapping);
  const mappingWarnings = buildMappingWarnings(suggestedMapping, ignoredHeaders);

  return {
    detectedMappings,
    hasRiskyMapping: false,
    ignoredHeaders,
    mappingWarnings,
    suggestedMapping,
  };
}

function extractMappedRow(values: Record<string, string>, mapping: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(mapping)
      .filter(([, header]) => Boolean(header))
      .map(([field, header]) => [field, normalizeText(values[header])]),
  );
}

function buildHeadquarterLookup(headquarters: SafetyHeadquarter[]) {
  const byManagementNumber = new Map<string, SafetyHeadquarter[]>();
  const byOpeningNumber = new Map<string, SafetyHeadquarter[]>();
  const byName = new Map<string, SafetyHeadquarter[]>();
  for (const headquarter of headquarters) {
    const managementNumber = normalizeKey(headquarter.management_number);
    if (managementNumber) {
      byManagementNumber.set(managementNumber, [...(byManagementNumber.get(managementNumber) || []), headquarter]);
    }
    const openingNumber = normalizeKey(headquarter.opening_number);
    if (openingNumber) {
      byOpeningNumber.set(openingNumber, [...(byOpeningNumber.get(openingNumber) || []), headquarter]);
    }
    const name = normalizeKey(headquarter.name);
    if (name) {
      byName.set(name, [...(byName.get(name) || []), headquarter]);
    }
  }
  return { byManagementNumber, byName, byOpeningNumber };
}

function buildSiteLookup(sites: SafetySite[]) {
  const byHeadquarterAndName = new Map<string, SafetySite[]>();
  const byNameAndDates = new Map<string, SafetySite[]>();
  const byClientManagementAndName = new Map<string, SafetySite[]>();
  for (const site of sites) {
    const siteName = normalizeKey(site.site_name);
    if (site.headquarter_id && siteName) {
      const key = `${site.headquarter_id}::${siteName}`;
      byHeadquarterAndName.set(key, [...(byHeadquarterAndName.get(key) || []), site]);
    }
    const clientManagementNumber = normalizeKey(site.client_management_number);
    if (clientManagementNumber && siteName) {
      const key = `${clientManagementNumber}::${siteName}`;
      byClientManagementAndName.set(key, [...(byClientManagementAndName.get(key) || []), site]);
    }
    const startDate = parseDateValue(site.project_start_date);
    const endDate = parseDateValue(site.project_end_date);
    if (siteName && startDate && endDate) {
      const key = `${siteName}::${startDate}::${endDate}`;
      byNameAndDates.set(key, [...(byNameAndDates.get(key) || []), site]);
    }
  }
  return { byClientManagementAndName, byHeadquarterAndName, byNameAndDates };
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
  const managementNumber = normalizeKey(rowData.headquarter_management_number);
  if (managementNumber && managementNumber === normalizeKey(targetHeadquarter.management_number)) {
    return true;
  }
  const openingNumber = normalizeKey(rowData.headquarter_opening_number);
  if (openingNumber && openingNumber === normalizeKey(targetHeadquarter.opening_number)) {
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
  const clientManagementNumber = normalizeKey(rowData.client_management_number);
  if (
    clientManagementNumber &&
    siteName &&
    clientManagementNumber === normalizeKey(targetSite.client_management_number) &&
    siteName === normalizeKey(targetSite.site_name)
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
  const managementNumber = normalizeKey(rowData.headquarter_management_number);
  if (managementNumber && headquarterLookup.byManagementNumber.has(managementNumber)) {
    return (headquarterLookup.byManagementNumber.get(managementNumber) || []).map((headquarter) => ({
      headquarterId: headquarter.id,
      id: headquarter.id,
      kind: 'headquarter',
      label: headquarter.name || '사업장',
      reason: '사업장관리번호 일치',
      siteId: null,
    }));
  }

  const openingNumber = normalizeKey(rowData.headquarter_opening_number);
  if (openingNumber && headquarterLookup.byOpeningNumber.has(openingNumber)) {
    return (headquarterLookup.byOpeningNumber.get(openingNumber) || []).map((headquarter) => ({
      headquarterId: headquarter.id,
      id: headquarter.id,
      kind: 'headquarter',
      label: headquarter.name || '사업장',
      reason: '사업장개시번호 일치',
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
  const siteName = normalizeKey(rowData.site_name);
  const startDate = parseDateValue(rowData.project_start_date);
  const endDate = parseDateValue(rowData.project_end_date);
  if (siteName && startDate && endDate) {
    const matches = siteLookup.byNameAndDates.get(`${siteName}::${startDate}::${endDate}`) || [];
    if (matches.length > 0) {
      return matches.map((site) => ({
        headquarterId: site.headquarter_id,
        id: site.id,
        kind: 'site',
        label: site.site_name || '현장',
        reason: '현장명 + 공사기간 일치',
        siteId: site.id,
      }));
    }
  }

  const clientManagementNumber = normalizeKey(rowData.client_management_number);
  if (clientManagementNumber && siteName) {
    const matches = siteLookup.byClientManagementAndName.get(`${clientManagementNumber}::${siteName}`) || [];
    if (matches.length > 0) {
      return matches.map((site) => ({
        headquarterId: site.headquarter_id,
        id: site.id,
        kind: 'site',
        label: site.site_name || '현장',
        reason: '발주자 사업장관리번호 + 현장명 일치',
        siteId: site.id,
      }));
    }
  }

  const matchedHeadquarterIds = new Set(
    (headquarterLookup.byManagementNumber.get(normalizeKey(rowData.headquarter_management_number)) || []).map(
      (headquarter) => headquarter.id,
    ),
  );
  if (matchedHeadquarterIds.size === 0) {
    for (const headquarter of headquarterLookup.byOpeningNumber.get(normalizeKey(rowData.headquarter_opening_number)) || []) {
      matchedHeadquarterIds.add(headquarter.id);
    }
  }
  if (matchedHeadquarterIds.size === 0) {
    for (const headquarter of headquarterLookup.byName.get(normalizeKey(rowData.headquarter_name)) || []) {
      matchedHeadquarterIds.add(headquarter.id);
    }
  }
  if (!siteName) return [];
  return Array.from(matchedHeadquarterIds).flatMap((headquarterId) =>
    (siteLookup.byHeadquarterAndName.get(`${headquarterId}::${siteName}`) || []).map((site) => ({
      headquarterId: site.headquarter_id,
      id: site.id,
      kind: 'site',
      label: site.site_name || '현장',
      reason: '사업장 + 현장명 일치',
      siteId: site.id,
    })),
  );
}

function suggestAction(siteMatches: DuplicateCandidate[], headquarterMatches: DuplicateCandidate[]) {
  if (siteMatches.length === 1) return 'update_site';
  if (siteMatches.length > 1) return 'create';
  if (headquarterMatches.length === 1) return 'update_headquarter';
  if (headquarterMatches.length > 1) return 'create';
  return 'create';
}

function buildPreparedApplyRowGroupKey(
  row: LocalRow,
  rowData: Record<string, string>,
  action: ExcelRowActionType,
  siteMatches: DuplicateCandidate[],
  headquarterMatches: DuplicateCandidate[],
) {
  const matchedSiteId =
    row.siteId ??
    (siteMatches.length === 1 ? siteMatches[0].siteId : null);
  if (matchedSiteId) {
    return `site:${matchedSiteId}`;
  }

  const matchedHeadquarterId =
    row.headquarterId ??
    (headquarterMatches.length === 1 ? headquarterMatches[0].headquarterId : null);

  return [
    action,
    matchedHeadquarterId || '',
    normalizeKey(rowData.headquarter_management_number),
    normalizeKey(rowData.headquarter_opening_number),
    normalizeKey(rowData.headquarter_name),
    normalizeKey(rowData.site_name),
    parseDateValue(rowData.project_start_date),
    parseDateValue(rowData.project_end_date),
  ].join('::');
}

function buildWorkerName(rowData: Record<string, string>, site: SafetySite) {
  return (
    normalizeText(rowData.inspector_name) ||
    normalizeText(site.inspector_name) ||
    normalizeText(rowData.guidance_officer_name) ||
    normalizeText(site.guidance_officer_name)
  );
}

function buildImportedScheduleSeeds(
  rows: Array<{
    assigneeName: string;
    assigneeUserId: string;
    completionStatus: string;
    rowData: Record<string, string>;
  }>,
): ImportedScheduleSeed[] {
  return rows
    .map((row) => ({
      assigneeName: row.assigneeName,
      assigneeUserId: row.assigneeUserId,
      completionStatus: row.completionStatus,
      roundNo: parseIntValue(row.rowData.round_no),
      visitDate: parseDateValue(row.rowData.visit_date),
    }))
    .filter((row) => Boolean(row.roundNo && row.visitDate));
}

function buildRowSummary(rowData: Record<string, string>) {
  const parts = [rowData.headquarter_name, rowData.site_name].filter(Boolean);
  if (rowData.headquarter_management_number) {
    parts.push(`관리번호 ${rowData.headquarter_management_number}`);
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
  return decodeHtmlEntities(typeof value === 'string' ? value.trim() : String(value).trim());
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
  const managementNumber = normalizeText(rowData.headquarter_management_number);
  if (managementNumber) payload.management_number = managementNumber;
  const openingNumber = normalizeText(rowData.headquarter_opening_number);
  if (openingNumber) payload.opening_number = openingNumber;
  const contactPhone = normalizeText(rowData.contact_phone);
  if (contactPhone) payload.contact_phone = contactPhone;
  return payload;
}

function buildHeadquarterUpdatePayload(
  rowData: Record<string, string>,
): SafetyHeadquarterUpdateInput & Record<string, unknown> {
  const payload = buildHeadquarterPayload(rowData);
  delete payload.management_number;
  delete payload.opening_number;
  return payload;
}

function buildSitePayload(rowData: Record<string, string>, headquarterId?: string | null): SafetySiteUpdateInput {
  const payload: SafetySiteUpdateInput = {};
  const siteName = normalizeText(rowData.site_name);
  if (siteName) payload.site_name = siteName;
  const laborOffice = normalizeText(rowData.labor_office);
  if (laborOffice) payload.labor_office = laborOffice;
  const guidanceOfficerName = normalizeText(rowData.guidance_officer_name);
  if (guidanceOfficerName) payload.guidance_officer_name = guidanceOfficerName;
  const projectScale = normalizeText(rowData.project_scale);
  if (projectScale) payload.project_scale = projectScale;
  const projectKind = normalizeText(rowData.project_kind);
  if (projectKind) payload.project_kind = projectKind;
  const clientManagementNumber = normalizeText(rowData.client_management_number);
  if (clientManagementNumber) payload.client_management_number = clientManagementNumber;
  const clientBusinessName = normalizeText(rowData.client_business_name);
  if (clientBusinessName) payload.client_business_name = clientBusinessName;
  const clientRepresentativeName = normalizeText(rowData.client_representative_name);
  if (clientRepresentativeName) payload.client_representative_name = clientRepresentativeName;
  const clientCorporateRegistrationNo = normalizeText(rowData.client_corporate_registration_no);
  if (clientCorporateRegistrationNo) payload.client_corporate_registration_no = clientCorporateRegistrationNo;
  const clientBusinessRegistrationNo = normalizeText(rowData.client_business_registration_no);
  if (clientBusinessRegistrationNo) payload.client_business_registration_no = clientBusinessRegistrationNo;
  const orderTypeDivision = normalizeText(rowData.order_type_division);
  if (orderTypeDivision) payload.order_type_division = orderTypeDivision;
  const technicalGuidanceKind = normalizeText(rowData.technical_guidance_kind);
  if (technicalGuidanceKind) payload.technical_guidance_kind = technicalGuidanceKind;
  const managerName = normalizeText(rowData.manager_name);
  if (managerName) payload.manager_name = managerName;
  const inspectorName = normalizeText(rowData.inspector_name);
  if (inspectorName) payload.inspector_name = inspectorName;
  const contractContactName = normalizeText(rowData.contract_contact_name);
  if (contractContactName) payload.contract_contact_name = contractContactName;
  const managerPhone = normalizeText(rowData.manager_phone);
  if (managerPhone) payload.manager_phone = managerPhone;
  const siteAddress = normalizeText(rowData.site_address);
  if (siteAddress) payload.site_address = siteAddress;
  const projectStartDate = parseDateValue(rowData.project_start_date);
  if (projectStartDate) payload.project_start_date = projectStartDate;
  const projectEndDate = parseDateValue(rowData.project_end_date);
  if (projectEndDate) payload.project_end_date = projectEndDate;
  const projectAmount = parseNumberValue(rowData.project_amount);
  if (projectAmount != null) payload.project_amount = projectAmount;
  const contractStartDate = parseDateValue(rowData.contract_start_date);
  if (contractStartDate) payload.contract_start_date = contractStartDate;
  const contractEndDate = parseDateValue(rowData.contract_end_date);
  if (contractEndDate) payload.contract_end_date = contractEndDate;
  const contractSignedDate = parseDateValue(rowData.contract_signed_date);
  if (contractSignedDate) {
    payload.contract_signed_date = contractSignedDate;
    payload.contract_date = contractSignedDate;
  }
  const totalRounds = parseIntValue(rowData.total_rounds);
  if (totalRounds != null) payload.total_rounds = totalRounds;
  const totalContractAmount = parseNumberValue(rowData.total_contract_amount);
  if (totalContractAmount != null) payload.total_contract_amount = totalContractAmount;
  if (headquarterId) payload.headquarter_id = headquarterId;
  return payload;
}

function computeRequiredCompletionFields(headquarter: SafetyHeadquarter, site: SafetySite) {
  const fields: string[] = [];
  if (!normalizeText(site.site_name)) fields.push(REQUIRED_FIELD_LABELS.site_name);
  if (!normalizeText(site.manager_name)) fields.push(REQUIRED_FIELD_LABELS.manager_name);
  if (!normalizeText(headquarter.contact_phone)) fields.push(REQUIRED_FIELD_LABELS.contact_phone);
  if (!normalizeText(site.site_address)) fields.push(REQUIRED_FIELD_LABELS.site_address);
  if (!normalizeText(site.labor_office)) fields.push(REQUIRED_FIELD_LABELS.labor_office);
  if (!normalizeText(site.guidance_officer_name)) fields.push(REQUIRED_FIELD_LABELS.guidance_officer_name);
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
      const { rows: _rows, ...previewSheet } = sheet;
      void _rows;
      return {
        ...previewSheet,
        detectedMappings: previewSheet.detectedMappings ?? [],
        ignoredHeaders: previewSheet.ignoredHeaders ?? [],
        mappingWarnings: previewSheet.mappingWarnings ?? [],
        hasRiskyMapping: previewSheet.hasRiskyMapping ?? false,
      };
    }),
  };
}

export async function parseLocalExcelWorkbook(
  token: string,
  file: File,
  request: Request,
  scope?: ExcelImportScope,
): Promise<ExcelImportPreview> {
  const [dashboardData, parsedSheets] = await Promise.all([
    fetchAdminCoreData(token, request),
    parseWorkbook(file.name, new Uint8Array(await file.arrayBuffer())),
  ]);
  const headquarters = dashboardData.headquarters;
  const sites = dashboardData.sites;

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
      const mappingAnalysis = buildSuggestedMapping(headers);
      const evaluatedRows = dataRows.map((row) => {
        const rowData = extractMappedRow(row.values, mappingAnalysis.suggestedMapping);
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
        detectedMappings: mappingAnalysis.detectedMappings,
        excludedRowCount: excludedRows.length,
        excludedRows,
        hasRiskyMapping: mappingAnalysis.hasRiskyMapping,
        ignoredHeaders: mappingAnalysis.ignoredHeaders,
        includedRowCount: includedRows.length,
        includedRows,
        mappingWarnings: mappingAnalysis.mappingWarnings,
        name: sheet.name,
        rowCount: dataRows.length,
        rows: evaluatedRows.map((row) => row.storedRow),
        sampleRows: includedRows.slice(0, SAMPLE_ROW_COUNT).map((row) => row.values),
        suggestedMapping: mappingAnalysis.suggestedMapping,
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

  const dashboardData = await fetchAdminCoreData(token, request);
  let headquarters = dashboardData.headquarters;
  let sites = dashboardData.sites;
  let users = dashboardData.users;
  let assignments = dashboardData.assignments;
  const resultRows: ExcelApplyResultRow[] = [];
  const summary = {
    ambiguousWorkerMatchCount: 0,
    completionRequiredCount: 0,
    createdAssignmentCount: 0,
    createdHeadquarterCount: 0,
    createdPlaceholderUserCount: 0,
    createdSiteCount: 0,
    matchedExistingUserCount: 0,
    updatedHeadquarterCount: 0,
    updatedSiteCount: 0,
  };

  const preparedRows = selectedSheet.rows
    .filter((row) => row.inScope)
    .map((row) => {
      const rowData = extractMappedRow(row.values, selectedSheet.suggestedMapping);
      if (!Object.values(rowData).some((value) => normalizeText(value))) {
        return null;
      }

      const nextHeadquarterLookup = buildHeadquarterLookup(headquarters);
      const nextSiteLookup = buildSiteLookup(sites);
      const siteMatches = siteCandidates(rowData, nextHeadquarterLookup, nextSiteLookup);
      const headquarterMatches = headquarterCandidates(rowData, nextHeadquarterLookup);
      const action = row.explicitAction ?? suggestAction(siteMatches, headquarterMatches);

      return {
        action,
        groupKey: buildPreparedApplyRowGroupKey(row, rowData, action, siteMatches, headquarterMatches),
        headquarterMatches,
        row,
        rowData,
        siteMatches,
      } satisfies PreparedApplyRow;
    })
    .filter((row): row is PreparedApplyRow => Boolean(row));

  const rowsByGroup = preparedRows.reduce((map, row) => {
    if (!map.has(row.groupKey)) {
      map.set(row.groupKey, []);
    }
    map.get(row.groupKey)?.push(row);
    return map;
  }, new Map<string, PreparedApplyRow[]>());

  for (const groupRows of rowsByGroup.values()) {
    const firstRow = groupRows[0];
    let headquarter: SafetyHeadquarter | null = null;
    let site: SafetySite | null = null;

    if (firstRow.action === 'update_site') {
      const targetSiteId =
        firstRow.row.siteId ??
        (firstRow.siteMatches.length === 1 ? firstRow.siteMatches[0].siteId : null);
      site = sites.find((item) => item.id === targetSiteId) || null;
      if (!site) {
        throw new Error(`${firstRow.row.rowIndex}행의 현장 갱신 대상을 찾을 수 없습니다.`);
      }
      site = await updateAdminSite(token, site.id, buildSitePayload(firstRow.rowData), request);
      headquarter = headquarters.find((item) => item.id === site!.headquarter_id) || null;
      summary.updatedSiteCount += 1;
    } else if (firstRow.action === 'update_headquarter') {
      const targetHeadquarterId =
        firstRow.row.headquarterId ??
        (firstRow.headquarterMatches.length === 1 ? firstRow.headquarterMatches[0].headquarterId : null);
      headquarter = headquarters.find((item) => item.id === targetHeadquarterId) || null;
      if (!headquarter) {
        throw new Error(`${firstRow.row.rowIndex}행의 사업장 갱신 대상을 찾을 수 없습니다.`);
      }
      headquarter = await updateAdminHeadquarter(
        token,
        headquarter.id,
        buildHeadquarterUpdatePayload(firstRow.rowData),
        request,
      );
      summary.updatedHeadquarterCount += 1;
      const targetSiteId =
        firstRow.row.siteId ??
        (firstRow.siteMatches.length === 1 ? firstRow.siteMatches[0].siteId : null);
      if (targetSiteId) {
        site = await updateAdminSite(
          token,
          targetSiteId,
          buildSitePayload(firstRow.rowData, headquarter.id),
          request,
        );
        summary.updatedSiteCount += 1;
      } else {
        site = await createAdminSite(
          token,
          {
            headquarter_id: headquarter.id,
            site_name: normalizeText(firstRow.rowData.site_name) || '엑셀 현장',
            status: 'active',
            ...buildSitePayload(firstRow.rowData, headquarter.id),
          },
          request,
        );
        summary.createdSiteCount += 1;
      }
    } else {
      const existingHeadquarter = firstRow.headquarterMatches.length === 1
        ? headquarters.find((item) => item.id === firstRow.headquarterMatches[0].headquarterId) || null
        : null;
      if (existingHeadquarter) {
        headquarter = await updateAdminHeadquarter(
          token,
          existingHeadquarter.id,
          buildHeadquarterUpdatePayload(firstRow.rowData),
          request,
        );
        summary.updatedHeadquarterCount += 1;
      } else {
        const headquarterPayload = buildHeadquarterPayload(firstRow.rowData);
        headquarter = await createAdminHeadquarter(
          token,
          {
            name:
              normalizeText(firstRow.rowData.headquarter_name) ||
              normalizeText(firstRow.rowData.site_name) ||
              '엑셀 사업장',
            ...headquarterPayload,
          },
          request,
        );
        summary.createdHeadquarterCount += 1;
      }
      site = await createAdminSite(
        token,
        {
          headquarter_id: headquarter.id,
          site_name: normalizeText(firstRow.rowData.site_name) || '엑셀 현장',
          status: 'active',
          ...buildSitePayload(firstRow.rowData, headquarter.id),
        },
        request,
      );
      summary.createdSiteCount += 1;
    }

    if (!headquarter || !site) {
      throw new Error(`${firstRow.row.rowIndex}행의 반영 결과를 확인하지 못했습니다.`);
    }

    const workerProvisionCache = new Map<string, ExcelApplyResultRow & {
      matchedExistingUser: boolean;
      createdAssignment: boolean;
      createdPlaceholderUser: boolean;
    }>();
    const importedScheduleRows: Array<{
      assigneeName: string;
      assigneeUserId: string;
      completionStatus: string;
      rowData: Record<string, string>;
    }> = [];
    const pendingResultRows: ExcelApplyResultRow[] = [];

    for (const preparedRow of groupRows) {
      const workerName = buildWorkerName(preparedRow.rowData, site);
      const workerKey = normalizeKey(workerName) || `row:${preparedRow.row.rowIndex}`;
      let workerResult = workerProvisionCache.get(workerKey);

      if (!workerResult) {
        const workerProvision = await provisionExcelWorkerAssignment(token, request, {
          assignments,
          rowIndex: preparedRow.row.rowIndex,
          site,
          users,
          workerName,
        });

        users = workerProvision.users;
        assignments = workerProvision.assignments;
        if (workerProvision.matchedExistingUser) {
          summary.matchedExistingUserCount += 1;
        }
        if (workerProvision.createdPlaceholderUser) {
          summary.createdPlaceholderUserCount += 1;
        }
        if (workerProvision.createdAssignment) {
          summary.createdAssignmentCount += 1;
        }
        if (workerProvision.status === 'ambiguous') {
          summary.ambiguousWorkerMatchCount += 1;
        }

        workerResult = {
          action: firstRow.action,
          createdAssignment: workerProvision.createdAssignment,
          createdPlaceholderUser: workerProvision.createdPlaceholderUser,
          headquarterId: headquarter.id,
          headquarterName: headquarter.name,
          matchedExistingUser: workerProvision.matchedExistingUser,
          matchedUserEmail: workerProvision.matchedUserEmail,
          matchedUserId: workerProvision.matchedUserId,
          message: workerProvision.message,
          placeholderCreated: workerProvision.createdPlaceholderUser,
          requiredCompletionFields: [],
          rowIndex: preparedRow.row.rowIndex,
          siteId: site.id,
          siteName: site.site_name,
          workerMatchStatus: workerProvision.status,
        };

        if (normalizeKey(workerName)) {
          workerProvisionCache.set(workerKey, workerResult);
        }
      }

      importedScheduleRows.push({
        assigneeName: workerName || site.inspector_name || '',
        assigneeUserId: workerResult.matchedUserId || '',
        completionStatus: preparedRow.rowData.completion_status || '',
        rowData: preparedRow.rowData,
      });

      pendingResultRows.push({
        ...workerResult,
        rowIndex: preparedRow.row.rowIndex,
      });
    }

    const requiredCompletionFields = computeRequiredCompletionFields(headquarter, site);
    const nextSchedules = mergeImportedSchedules(site, buildImportedScheduleSeeds(importedScheduleRows));
    const nextMemo = buildSiteMemoWithContractProfile(
      parseSiteMemoNote(site.memo),
      parseSiteContractProfile(site),
      {
        existingMemo: site.memo,
        requiredCompletionFields,
        schedules: nextSchedules,
      },
    );

    if (nextMemo !== site.memo) {
      site = await updateAdminSite(
        token,
        site.id,
        {
          memo: nextMemo,
        } as SafetySiteUpdateInput,
        request,
      );
    }
    if (requiredCompletionFields.length > 0) {
      summary.completionRequiredCount += 1;
    }

    headquarters = headquarters.some((item) => item.id === headquarter.id)
      ? headquarters.map((item) => (item.id === headquarter.id ? headquarter : item))
      : [...headquarters, headquarter];
    sites = sites.some((item) => item.id === site.id)
      ? sites.map((item) => (item.id === site.id ? site : item))
      : [...sites, site];

    pendingResultRows.forEach((row) => {
      resultRows.push({
        ...row,
        requiredCompletionFields,
      });
    });
  }

  return { rows: resultRows, summary };
}
