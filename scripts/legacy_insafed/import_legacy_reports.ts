import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createInspectionSession } from '@/constants/inspectionSession/sessionFactory';
import { createQuarterlySummaryDraft } from '@/lib/erpReports/quarterly';
import { buildQuarterlySummaryUpsertInput } from '@/lib/erpReports/mappers';
import { mapSafetySiteToInspectionSite } from '@/lib/safetyApiMappers/sites';
import { buildSafetyReportUpsertInput } from '@/lib/safetyApiMappers/reports';
import { parseSiteInspectionSchedules } from '@/lib/admin/siteContractProfile';
import type {
  SafetyReportStatus,
  SafetyReportListItem,
  SafetySite,
  SafetyUpsertReportInput,
  SafetyUser,
} from '@/types/backend';

type LegacyAdminReportRow = {
  legacy_report_id?: string;
  legacy_site_ref?: string | number | null;
  legacy_site_id?: string | null;
  site_name?: string | null;
  headquarter_name?: string | null;
  round_no?: number | null;
  total_rounds?: number | null;
  visit_date?: string | null;
  status?: string | null;
  assigned_worker_name?: string | null;
  pdf_filename?: string | null;
  archive_status?: string | null;
  original_pdf_archive_path?: string | null;
  report_kind?: string | null;
};

type SafetyTokenResponse = {
  access_token: string;
  token_type?: string;
};

type ImportSummary = {
  archiveOnlyCount: number;
  failedCount: number;
  importedQuarterlyCount: number;
  importedTechnicalGuidanceCount: number;
  photoAugmentedCount: number;
  processedCount: number;
  skippedExistingCount: number;
  skippedMissingSiteCount: number;
};

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function asRecord(value: unknown) {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function readJsonl<T>(text: string): T[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as T);
}

function removeExt(value: string) {
  return value.replace(/\.[^.]+$/, '');
}

function getSetCookies(headers: Headers) {
  const getter = (headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  if (typeof getter === 'function') {
    return getter.call(headers);
  }
  const cookie = headers.get('set-cookie');
  return cookie ? [cookie] : [];
}

class LegacyPopupSession {
  private cookieHeader = '';
  private readonly baseUrl: string;
  private readonly password: string;
  private readonly username: string;

  constructor(baseUrl: string, username: string, password: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.username = username;
    this.password = password;
  }

  private mergeCookies(headers: Headers) {
    const next = new Map<string, string>();
    this.cookieHeader
      .split(';')
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => {
        const [name, value] = item.split('=');
        if (name && value) next.set(name, value);
      });
    getSetCookies(headers).forEach((item) => {
      const [pair] = item.split(';', 1);
      const [name, value] = pair.split('=');
      if (name && value) next.set(name.trim(), value.trim());
    });
    this.cookieHeader = [...next.entries()].map(([name, value]) => `${name}=${value}`).join('; ');
  }

  async login() {
    const loginPage = await fetch(`${this.baseUrl}/login`, { redirect: 'manual' });
    this.mergeCookies(loginPage.headers);
    const loginHtml = await loginPage.text();
    const tokenMatch = loginHtml.match(/name=\"_token\"\s+value=\"([^\"]+)\"/);
    if (!tokenMatch?.[1]) {
      throw new Error('Legacy login CSRF token not found.');
    }
    const body = new URLSearchParams();
    body.set('_token', tokenMatch[1]);
    body.set('email', this.username);
    body.set('password', this.password);
    const loginResponse = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      body,
      headers: {
        Cookie: this.cookieHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'manual',
    });
    this.mergeCookies(loginResponse.headers);
    if (!loginResponse.ok && loginResponse.status !== 302) {
      throw new Error(`Legacy login failed with status ${loginResponse.status}.`);
    }
  }

  async fetchPopupPhotoUrls(reportId: string): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/report/popup/${encodeURIComponent(reportId)}`, {
      headers: {
        Cookie: this.cookieHeader,
      },
    });
    if (!response.ok) {
      throw new Error(`Legacy popup fetch failed for ${reportId}: ${response.status}`);
    }
    const html = await response.text();
    const matches = [...html.matchAll(/<img[^>]+src=['"]([^'"]+)['"]/gi)]
      .map((match) => normalizeText(match[1]))
      .filter(Boolean);
    return [...new Set(matches)].filter((url) => {
      const lowered = url.toLowerCase();
      return (
        !url.includes('${') &&
        !lowered.includes('loading.gif') &&
        !lowered.includes('/images/common/check_') &&
        !lowered.includes('/sign/')
      );
    });
  }
}

async function loginTarget(baseUrl: string, email: string, password: string) {
  const body = new URLSearchParams();
  body.set('username', email.trim());
  body.set('password', password);
  const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  if (!response.ok) {
    throw new Error(`Target login failed with status ${response.status}`);
  }
  const payload = (await response.json()) as SafetyTokenResponse;
  return normalizeText(payload.access_token);
}

async function fetchAll<T>(
  baseUrl: string,
  token: string,
  endpoint: string,
  params: Record<string, string> = {},
  limit = 500,
) {
  const rows: T[] = [];
  let offset = 0;
  while (true) {
    const url = new URL(`${baseUrl.replace(/\/+$/, '')}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('offset', String(offset));
    url.searchParams.set('active_only', 'true');
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error(`Fetch failed for ${endpoint}: ${response.status}`);
    }
    const page = (await response.json()) as T[];
    rows.push(...page);
    console.log(`[legacy-reports] fetched ${endpoint} ${rows.length}`);
    if (page.length < limit) {
      return rows;
    }
    offset += page.length;
  }
}

async function upsertReport(
  baseUrl: string,
  token: string,
  payload: SafetyUpsertReportInput,
) {
  const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/reports/upsert`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Report upsert failed (${payload.report_key}): ${response.status} ${await response.text()}`);
  }
  return response.json();
}

function parseLegacySiteId(memo: unknown) {
  const matched = normalizeText(memo).match(/legacy_insafed_site_id:([^\s]+)/);
  return matched?.[1]?.trim() || '';
}

function inferLegacyReportKind(row: LegacyAdminReportRow) {
  const explicit = normalizeText(row.report_kind);
  if (explicit === 'quarterly_summary') return 'quarterly_summary' as const;
  return 'technical_guidance' as const;
}

function buildLegacyReportKey(kind: 'technical_guidance' | 'quarterly_summary', legacyReportId: string) {
  return `legacy:${kind}:${legacyReportId}`;
}

function buildLegacyReportTitle(row: LegacyAdminReportRow, kind: 'technical_guidance' | 'quarterly_summary') {
  const pdfTitle = removeExt(normalizeText(row.pdf_filename));
  if (pdfTitle && pdfTitle !== `${normalizeText(row.legacy_report_id)}`
  ) {
    return pdfTitle;
  }
  const siteName = normalizeText(row.site_name) || '현장';
  const visitDate = normalizeText(row.visit_date);
  const roundNo = typeof row.round_no === 'number' && row.round_no > 0 ? `${row.round_no}차` : '';
  if (kind === 'quarterly_summary') {
    return visitDate ? `${siteName} ${visitDate.slice(0, 7)} 분기 요약` : `${siteName} 분기 요약`;
  }
  return [siteName, visitDate, roundNo, '기술지도 보고서'].filter(Boolean).join(' ');
}

function normalizeReportStatus(value: string): SafetyReportStatus {
  return value === '완료' ? 'submitted' : 'draft';
}

function buildPhotoSlotAssignments(photoUrls: string[]) {
  const slots: Array<(value: string) => void> = [];
  const assignments: { consume: (session: ReturnType<typeof createInspectionSession>) => void } = {
    consume(session) {
      session.document3Scenes.forEach((item) => {
        slots.push((value) => {
          item.photoUrl = value;
          if (!item.title) item.title = 'Legacy 현장 사진';
        });
      });
      session.document7Findings.forEach((item) => {
        slots.push((value) => {
          item.photoUrl = value;
          if (!item.location) item.location = 'Legacy 지적 사항';
        });
        slots.push((value) => {
          item.photoUrl2 = value;
        });
      });
      session.document10Measurements.forEach((item) => {
        slots.push((value) => {
          item.photoUrl = value;
        });
      });
      session.document11EducationRecords.forEach((item) => {
        slots.push((value) => {
          item.photoUrl = value;
        });
      });
      session.document12Activities.forEach((item) => {
        slots.push((value) => {
          item.photoUrl = value;
        });
        slots.push((value) => {
          item.photoUrl2 = value;
        });
      });
      photoUrls.slice(0, slots.length).forEach((value, index) => {
        slots[index]?.(value);
      });
    },
  };
  return assignments;
}

function resolveScheduleId(site: SafetySite, row: LegacyAdminReportRow) {
  const roundNo = typeof row.round_no === 'number' ? row.round_no : 0;
  const visitDate = normalizeText(row.visit_date);
  const schedules = parseSiteInspectionSchedules(site);
  const exact = schedules.find(
    (item) =>
      item.roundNo === roundNo &&
      (normalizeText(item.plannedDate) === visitDate || !visitDate),
  );
  if (exact) return exact.id;
  return schedules.find((item) => item.roundNo === roundNo)?.id || null;
}

function buildLegacyMeta(
  row: LegacyAdminReportRow,
  reportKey: string,
  photoUrls: string[],
) {
  const archivePath = normalizeText(row.original_pdf_archive_path);
  const pdfFilename = normalizeText(row.pdf_filename);
  return {
    legacy_report_id: normalizeText(row.legacy_report_id),
    legacy_source: 'insafed',
    legacy_site_id: normalizeText(row.legacy_site_id),
    original_pdf_filename: pdfFilename || null,
    original_pdf_archive_path: archivePath || null,
    original_pdf_download_path: archivePath
      ? `/api/admin/reports/${encodeURIComponent(reportKey)}/original-pdf`
      : null,
    original_pdf_available: normalizeText(row.archive_status) === 'pdf_archived',
    legacy_photo_urls: photoUrls,
  };
}

function toQuarterTarget(dateValue: string) {
  const basis = dateValue ? new Date(`${dateValue}T00:00:00`) : new Date();
  const year = basis.getFullYear();
  const quarter = Math.floor(basis.getMonth() / 3) + 1;
  const startMonth = (quarter - 1) * 3;
  const start = new Date(year, startMonth, 1);
  const end = new Date(year, startMonth + 3, 0);
  const format = (value: Date) => {
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${value.getFullYear()}-${month}-${day}`;
  };
  return {
    endDate: format(end),
    quarter,
    quarterKey: `${year}-Q${quarter}`,
    startDate: format(start),
    year,
  };
}

function buildQuarterlyInput(
  row: LegacyAdminReportRow,
  site: SafetySite,
  drafter: string,
  photoUrls: string[],
) {
  const inspectionSite = mapSafetySiteToInspectionSite(site);
  const target = toQuarterTarget(normalizeText(row.visit_date));
  const reportKey = buildLegacyReportKey('quarterly_summary', normalizeText(row.legacy_report_id));
  const draft = createQuarterlySummaryDraft(inspectionSite, drafter, target.startDate);
  draft.id = reportKey;
  draft.title = buildLegacyReportTitle(row, 'quarterly_summary');
  draft.periodStartDate = target.startDate;
  draft.periodEndDate = target.endDate;
  draft.quarterKey = target.quarterKey;
  draft.year = target.year;
  draft.quarter = target.quarter;
  draft.status = normalizeText(row.status) === '완료' ? 'completed' : 'draft';
  draft.opsAssetDescription = 'Legacy InSEF imported quarterly record';
  draft.majorMeasures = photoUrls.length > 0 ? [`legacy-photo-count:${photoUrls.length}`] : [];

  const input = buildQuarterlySummaryUpsertInput(draft, inspectionSite);
  input.headquarter_id = site.headquarter_id || null;
  input.assigned_user_id = site.assigned_user?.id || null;
  input.meta = {
    ...(input.meta || {}),
    ...buildLegacyMeta(row, reportKey, photoUrls),
  };
  return input;
}

function buildTechnicalGuidanceInput(
  row: LegacyAdminReportRow,
  site: SafetySite,
  assignedUser: SafetyUser | null,
  photoUrls: string[],
) {
  const visitRound = typeof row.round_no === 'number' && row.round_no > 0 ? row.round_no : 1;
  const reportKey = buildLegacyReportKey('technical_guidance', normalizeText(row.legacy_report_id));
  const inspectionSite = mapSafetySiteToInspectionSite(site);
  const drafter =
    normalizeText(row.assigned_worker_name) ||
    normalizeText(assignedUser?.name) ||
    inspectionSite.assigneeName ||
    'Legacy InSEF';
  const visitDate = normalizeText(row.visit_date) || new Date().toISOString().slice(0, 10);
  const session = createInspectionSession(
    {
      adminSiteSnapshot: inspectionSite.adminSiteSnapshot,
      meta: {
        drafter,
        reportDate: visitDate,
        reportTitle: buildLegacyReportTitle(row, 'technical_guidance'),
        siteName: inspectionSite.siteName,
      },
    },
    inspectionSite.id,
    visitRound,
  );
  session.id = reportKey;
  session.reportNumber = visitRound;
  session.meta.drafter = drafter;
  session.meta.reportDate = visitDate;
  session.meta.reportTitle = buildLegacyReportTitle(row, 'technical_guidance');
  session.document2Overview.guidanceDate = visitDate;
  session.document2Overview.visitCount = String(visitRound);
  session.document2Overview.totalVisitCount =
    typeof row.total_rounds === 'number' && row.total_rounds > 0
      ? String(row.total_rounds)
      : session.document2Overview.totalVisitCount;
  session.document2Overview.assignee = drafter;
  session.document2Overview.processAndNotes = 'Legacy InSEF imported report';
  session.updatedAt = new Date().toISOString();
  buildPhotoSlotAssignments(photoUrls).consume(session);

  const input = buildSafetyReportUpsertInput(session, inspectionSite);
  input.report_title = session.meta.reportTitle;
  input.headquarter_id = site.headquarter_id || null;
  input.schedule_id = resolveScheduleId(site, row);
  input.assigned_user_id = assignedUser?.id || null;
  input.visit_date = visitDate;
  input.visit_round = visitRound;
  input.total_round =
    typeof row.total_rounds === 'number' && row.total_rounds > 0 ? row.total_rounds : null;
  input.status = normalizeReportStatus(normalizeText(row.status));
  input.progress_rate = normalizeText(row.status) === '완료' ? 100 : 10;
  input.meta = {
    ...(input.meta || {}),
    ...buildLegacyMeta(row, reportKey, photoUrls),
  };
  return input;
}

async function main() {
  const args = new Map<string, string>();
  for (let index = 2; index < process.argv.length; index += 1) {
    const key = process.argv[index];
    const value = process.argv[index + 1];
    if (key.startsWith('--') && value && !value.startsWith('--')) {
      args.set(key, value);
    }
  }
  const exportRoot = args.get('--export-root');
  const targetBaseUrl = args.get('--target-base-url');
  const targetEmail = args.get('--target-email');
  const targetPassword = args.get('--target-password');
  const legacyBaseUrl = args.get('--legacy-base-url') || 'http://console.insafed.com/insef/public';
  const legacyEmail = args.get('--legacy-email');
  const legacyPassword = args.get('--legacy-password');
  const offset = Number(args.get('--offset') || '0');
  const limit = Number(args.get('--limit') || '0');
  const skipExisting = process.argv.includes('--skip-existing');

  if (!exportRoot || !targetBaseUrl || !targetEmail || !targetPassword) {
    throw new Error('Missing required args: --export-root --target-base-url --target-email --target-password');
  }

  const [metadataText, sitesText, usersToken] = await Promise.all([
    fs.readFile(path.join(exportRoot, 'admin', 'reports', 'metadata.jsonl'), 'utf-8'),
    fs.readFile(path.join(exportRoot, 'sites.jsonl'), 'utf-8'),
    loginTarget(targetBaseUrl, targetEmail, targetPassword),
  ]);
  console.log('[legacy-reports] target login ok');
  const [sites, users] = await Promise.all([
    fetchAll<SafetySite>(
      targetBaseUrl,
      usersToken,
      '/sites',
      { include_assigned_user: 'true', include_headquarter_detail: 'true' },
      500,
    ),
    fetchAll<SafetyUser>(targetBaseUrl, usersToken, '/users', {}, 500),
  ]);
  console.log(`[legacy-reports] loaded target snapshots sites=${sites.length} users=${users.length}`);
  const existingLegacyReportKeys = skipExisting
    ? new Set(
        (await fetchAll<SafetyReportListItem>(targetBaseUrl, usersToken, '/reports', {}, 500))
          .map((row) => normalizeText(row.report_key))
          .filter((reportKey) => reportKey.startsWith('legacy:')),
      )
    : null;
  if (existingLegacyReportKeys) {
    console.log(`[legacy-reports] loaded existing legacy reports ${existingLegacyReportKeys.size}`);
  }

  const popupSession =
    legacyEmail && legacyPassword
      ? new LegacyPopupSession(legacyBaseUrl, legacyEmail, legacyPassword)
      : null;
  if (popupSession) {
    await popupSession.login();
    console.log('[legacy-reports] legacy popup session ready');
  }

  const allLegacyMetadata = readJsonl<LegacyAdminReportRow>(metadataText);
  const legacyMetadata =
    limit > 0
      ? allLegacyMetadata.slice(Math.max(0, offset), Math.max(0, offset) + limit)
      : allLegacyMetadata.slice(Math.max(0, offset));
  console.log(`[legacy-reports] processing ${legacyMetadata.length} rows`);
  const legacySites = readJsonl<Record<string, unknown>>(sitesText);
  const siteByLegacyId = new Map<string, SafetySite>();
  const targetSiteByName = new Map<string, SafetySite>();
  const userByName = new Map<string, SafetyUser>();
  users.forEach((user) => {
    const name = normalizeText(user.name);
    if (name && !userByName.has(name)) {
      userByName.set(name, user);
    }
  });
  const siteByName = new Map<string, string>();
  legacySites.forEach((site) => {
    const legacySiteId = normalizeText(site.legacy_site_id);
    const siteName = normalizeText(site.site_name);
    const headquarterName = normalizeText(site.headquarter_name);
    if (legacySiteId) {
      siteByName.set(`${headquarterName}::${siteName}`, legacySiteId);
    }
  });
  sites.forEach((site) => {
    const legacySiteId = parseLegacySiteId(site.memo);
    const siteRecord = asRecord(site as unknown);
    const headquarterDetail = asRecord(siteRecord.headquarter_detail);
    const headquarterName =
      normalizeText(headquarterDetail.name) ||
      normalizeText(siteRecord.headquarter_name) ||
      normalizeText(siteRecord.headquarterName);
    const siteKey = `${headquarterName}::${normalizeText(site.site_name)}`;
    if (headquarterName && normalizeText(site.site_name) && !targetSiteByName.has(siteKey)) {
      targetSiteByName.set(siteKey, site);
    }
    if (legacySiteId) {
      siteByLegacyId.set(legacySiteId, site);
    }
  });

  const summary: ImportSummary = {
    archiveOnlyCount: 0,
    failedCount: 0,
    importedQuarterlyCount: 0,
    importedTechnicalGuidanceCount: 0,
    photoAugmentedCount: 0,
    processedCount: 0,
    skippedExistingCount: 0,
    skippedMissingSiteCount: 0,
  };
  const archiveOnlyRows: Record<string, unknown>[] = [];
  const failedRows: Record<string, unknown>[] = [];

  for (const row of legacyMetadata) {
    summary.processedCount += 1;
    const reportKind = inferLegacyReportKind(row);
    const reportKey = buildLegacyReportKey(reportKind, normalizeText(row.legacy_report_id));
    if (existingLegacyReportKeys?.has(reportKey)) {
      summary.skippedExistingCount += 1;
      continue;
    }

    const legacySiteId =
      normalizeText(row.legacy_site_id) ||
      normalizeText(row.legacy_site_ref) ||
      siteByName.get(`${normalizeText(row.headquarter_name)}::${normalizeText(row.site_name)}`) ||
      '';
    const site =
      siteByLegacyId.get(legacySiteId) ||
      targetSiteByName.get(`${normalizeText(row.headquarter_name)}::${normalizeText(row.site_name)}`);
    if (!site) {
      summary.skippedMissingSiteCount += 1;
      failedRows.push({
        legacy_report_id: normalizeText(row.legacy_report_id),
        legacy_site_id: legacySiteId,
        reason: 'missing_site_mapping',
      });
      continue;
    }

    const archiveStatus = normalizeText(row.archive_status);
    const photoUrls =
      popupSession && normalizeText(row.legacy_report_id)
        ? await popupSession.fetchPopupPhotoUrls(normalizeText(row.legacy_report_id)).catch(() => [])
        : [];
    if (photoUrls.length > 0) {
      summary.photoAugmentedCount += 1;
    }

    if (reportKind === 'quarterly_summary' && !normalizeText(row.visit_date)) {
      summary.archiveOnlyCount += 1;
      archiveOnlyRows.push({
        legacy_report_id: normalizeText(row.legacy_report_id),
        legacy_site_id: legacySiteId,
        reason: 'quarterly_without_period',
      });
      continue;
    }

    try {
      let payload: SafetyUpsertReportInput;
      if (reportKind === 'quarterly_summary') {
        payload = buildQuarterlyInput(
          row,
          site,
          normalizeText(row.assigned_worker_name) || site.assigned_user?.name || '',
          photoUrls,
        );
        summary.importedQuarterlyCount += 1;
      } else {
        payload = buildTechnicalGuidanceInput(
          row,
          site,
          userByName.get(normalizeText(row.assigned_worker_name)) || null,
          photoUrls,
        );
        summary.importedTechnicalGuidanceCount += 1;
      }

      if (archiveStatus !== 'pdf_archived') {
        payload.meta = {
          ...(payload.meta || {}),
          original_pdf_available: false,
        } as Record<string, unknown>;
      }
      await upsertReport(targetBaseUrl, usersToken, payload);
      if (summary.processedCount % 100 === 0 || summary.processedCount === legacyMetadata.length) {
        console.log(
          `[legacy-reports] ${summary.processedCount}/${legacyMetadata.length} ` +
            `(technical ${summary.importedTechnicalGuidanceCount}, quarterly ${summary.importedQuarterlyCount}, ` +
            `archive-only ${summary.archiveOnlyCount}, failed ${summary.failedCount})`,
        );
      }
    } catch (error) {
      summary.failedCount += 1;
      failedRows.push({
        legacy_report_id: normalizeText(row.legacy_report_id),
        legacy_site_id: legacySiteId,
        report_kind: reportKind,
        error: error instanceof Error ? error.message : String(error),
      });
      if (summary.processedCount % 100 === 0 || summary.processedCount === legacyMetadata.length) {
        console.log(
          `[legacy-reports] ${summary.processedCount}/${legacyMetadata.length} ` +
            `(technical ${summary.importedTechnicalGuidanceCount}, quarterly ${summary.importedQuarterlyCount}, ` +
            `archive-only ${summary.archiveOnlyCount}, failed ${summary.failedCount})`,
        );
      }
    }
  }

  await fs.writeFile(
    path.join(exportRoot, 'admin', 'reports', 'import-summary.json'),
    JSON.stringify(summary, null, 2),
  );
  await fs.writeFile(
    path.join(exportRoot, 'admin', 'reports', 'archive-only.jsonl'),
    archiveOnlyRows.map((item) => JSON.stringify(item)).join('\n') + (archiveOnlyRows.length ? '\n' : ''),
  );
  await fs.writeFile(
    path.join(exportRoot, 'admin', 'reports', 'import-failures.jsonl'),
    failedRows.map((item) => JSON.stringify(item)).join('\n') + (failedRows.length ? '\n' : ''),
  );
  console.log(summary);
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
