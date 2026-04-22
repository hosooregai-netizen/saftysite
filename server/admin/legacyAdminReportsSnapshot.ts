import { promises as fs } from 'node:fs';
import path from 'node:path';
import { applyControllerReportRowStatus } from '@/lib/admin/lifecycleStatus';
import type {
  SafetyReportWorkflowStatus,
  SafetySite,
  SafetyUser,
} from '@/types/backend';

const LEGACY_ADMIN_REPORTS_SNAPSHOT_PATH = path.join(
  process.cwd(),
  'data',
  'legacy-admin-reports.snapshot.jsonl',
);
const LEGACY_ADMIN_REPORTS_CACHE_KEY = '__SAFETY_LEGACY_ADMIN_REPORTS_SNAPSHOT__';
const LEGACY_ADMIN_REPORTS_IN_FLIGHT_KEY = '__SAFETY_LEGACY_ADMIN_REPORTS_SNAPSHOT_IN_FLIGHT__';

type LegacyAdminReportPdfEntry = {
  archivePath: string;
  fileName: string;
  legacyReportId: string;
  visitDate: string;
};

export type LegacyAdminReportSnapshotRow = {
  assigneeName: string;
  headquarterName: string;
  legacyReportId: string;
  legacySiteId: string;
  pdfFileName: string;
  roundNo: number;
  siteName: string;
  status: string;
  visitDate: string;
};

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function removeExt(value: string) {
  return value.replace(/\.[^.]+$/, '');
}

function readJsonlLines<T>(text: string): T[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as T);
}

function parseLegacySiteId(memo: unknown) {
  const matched = normalizeText(memo).match(/legacy_insafed_site_id:([^\s]+)/);
  return matched?.[1]?.trim() || '';
}

function buildSiteMatchKey(headquarterName: string, siteName: string) {
  return `${normalizeText(headquarterName)}::${normalizeText(siteName)}`;
}

function buildLegacyReportKey(legacyReportId: string) {
  return `legacy:technical_guidance:${legacyReportId}`;
}

function buildReportTitle(row: LegacyAdminReportSnapshotRow) {
  const pdfTitle = removeExt(normalizeText(row.pdfFileName));
  if (pdfTitle && pdfTitle !== normalizeText(row.legacyReportId)) {
    return pdfTitle;
  }

  return [
    normalizeText(row.siteName) || '현장',
    normalizeText(row.visitDate),
    row.roundNo > 0 ? `${row.roundNo}차` : '',
    '기술지도 보고서',
  ]
    .filter(Boolean)
    .join(' ');
}

function addDays(value: string, days: number) {
  const matched = normalizeText(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!matched) {
    return '';
  }

  const parsed = new Date(
    Number(matched[1]),
    Number(matched[2]) - 1,
    Number(matched[3]),
  );
  parsed.setHours(0, 0, 0, 0);
  parsed.setDate(parsed.getDate() + days);

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildUpdatedAt(visitDate: string) {
  return visitDate ? `${visitDate}T09:00:00+09:00` : '';
}

function normalizeLegacyWorkflowStatus(value: string): SafetyReportWorkflowStatus {
  return normalizeText(value) === '완료' ? 'submitted' : 'draft';
}

function getLegacyAdminReportsCache() {
  const globalRecord = globalThis as typeof globalThis & {
    [LEGACY_ADMIN_REPORTS_CACHE_KEY]?: LegacyAdminReportSnapshotRow[];
  };
  if (!(LEGACY_ADMIN_REPORTS_CACHE_KEY in globalRecord)) {
    globalRecord[LEGACY_ADMIN_REPORTS_CACHE_KEY] = undefined;
  }
  return globalRecord;
}

function getLegacyAdminReportsInFlight() {
  const globalRecord = globalThis as typeof globalThis & {
    [LEGACY_ADMIN_REPORTS_IN_FLIGHT_KEY]?: Promise<LegacyAdminReportSnapshotRow[]>;
  };
  if (!(LEGACY_ADMIN_REPORTS_IN_FLIGHT_KEY in globalRecord)) {
    globalRecord[LEGACY_ADMIN_REPORTS_IN_FLIGHT_KEY] = undefined;
  }
  return globalRecord;
}

export async function getLegacyAdminReportsSnapshot() {
  const cacheRecord = getLegacyAdminReportsCache();
  if (cacheRecord[LEGACY_ADMIN_REPORTS_CACHE_KEY]) {
    return cacheRecord[LEGACY_ADMIN_REPORTS_CACHE_KEY]!;
  }

  const inFlightRecord = getLegacyAdminReportsInFlight();
  if (inFlightRecord[LEGACY_ADMIN_REPORTS_IN_FLIGHT_KEY]) {
    return inFlightRecord[LEGACY_ADMIN_REPORTS_IN_FLIGHT_KEY]!;
  }

  const nextRequest = fs
    .readFile(LEGACY_ADMIN_REPORTS_SNAPSHOT_PATH, 'utf8')
    .then((text) => readJsonlLines<LegacyAdminReportSnapshotRow>(text))
    .then((rows) => {
      cacheRecord[LEGACY_ADMIN_REPORTS_CACHE_KEY] = rows;
      return rows;
    })
    .finally(() => {
      inFlightRecord[LEGACY_ADMIN_REPORTS_IN_FLIGHT_KEY] = undefined;
    });
  inFlightRecord[LEGACY_ADMIN_REPORTS_IN_FLIGHT_KEY] = nextRequest;
  return nextRequest;
}

export function buildLegacyAdminReportRows(input: {
  legacyRows: LegacyAdminReportSnapshotRow[];
  pdfManifest: Map<string, LegacyAdminReportPdfEntry>;
  sites: SafetySite[];
  users: SafetyUser[];
}) {
  const siteByLegacyId = new Map<string, SafetySite>();
  const siteByMatchKey = new Map<string, SafetySite>();
  const userByName = new Map<string, SafetyUser>();

  input.users.forEach((user) => {
    const userName = normalizeText(user.name);
    if (userName && !userByName.has(userName)) {
      userByName.set(userName, user);
    }
  });

  input.sites.forEach((site) => {
    const siteName = normalizeText(site.site_name);
    const headquarterName =
      normalizeText(site.headquarter_detail?.name) ||
      normalizeText(site.headquarter?.name);
    const siteMatchKey = buildSiteMatchKey(headquarterName, siteName);
    if (siteName && headquarterName && !siteByMatchKey.has(siteMatchKey)) {
      siteByMatchKey.set(siteMatchKey, site);
    }

    const legacySiteId = parseLegacySiteId(site.memo);
    if (legacySiteId && !siteByLegacyId.has(legacySiteId)) {
      siteByLegacyId.set(legacySiteId, site);
    }
  });

  return input.legacyRows.map((row) => {
    const reportKey = buildLegacyReportKey(row.legacyReportId);
    const matchedSite =
      siteByLegacyId.get(normalizeText(row.legacySiteId)) ||
      siteByMatchKey.get(buildSiteMatchKey(row.headquarterName, row.siteName)) ||
      null;
    const matchedUser = userByName.get(normalizeText(row.assigneeName)) ?? null;
    const siteName = normalizeText(matchedSite?.site_name) || normalizeText(row.siteName) || '현장 미상';
    const headquarterName =
      normalizeText(matchedSite?.headquarter_detail?.name) ||
      normalizeText(matchedSite?.headquarter?.name) ||
      normalizeText(row.headquarterName);
    const reportTitle = buildReportTitle(row);
    const manifestEntry = input.pdfManifest.get(reportKey) ?? null;
    const workflowStatus = normalizeLegacyWorkflowStatus(row.status);
    const emptyDispatchStatus = '' as const;
    const qualityStatus = 'unchecked' as const;
    const reportType = 'technical_guidance' as const;

    return applyControllerReportRowStatus({
      assigneeName: normalizeText(row.assigneeName),
      assigneeUserId: normalizeText(matchedUser?.id),
      checkerUserId: '',
      controllerReview: null,
      deadlineDate: addDays(row.visitDate, 7),
      dispatch: null,
      dispatchSignal: emptyDispatchStatus,
      dispatchStatus: emptyDispatchStatus,
      headquarterId: normalizeText(matchedSite?.headquarter_id),
      headquarterName,
      lifecycleStatus: 'active',
      originalPdfAvailable: Boolean(manifestEntry),
      originalPdfDownloadPath: manifestEntry
        ? `/api/admin/reports/${encodeURIComponent(reportKey)}/original-pdf`
        : '',
      periodLabel: '',
      progressRate: workflowStatus === 'submitted' ? 100 : 10,
      qualityStatus,
      reportKey,
      reportMonth: '',
      reportTitle,
      reportType,
      routeParam: reportKey,
      siteId: normalizeText(matchedSite?.id),
      siteName,
      sortLabel: `${siteName} ${reportTitle}`.trim(),
      status: workflowStatus,
      updatedAt: buildUpdatedAt(row.visitDate),
      visitDate: normalizeText(row.visitDate),
      workflowStatus,
    });
  });
}
