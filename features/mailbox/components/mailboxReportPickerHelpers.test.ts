import assert from 'node:assert/strict';
import test from 'node:test';
import type { ControllerReportRow } from '@/types/admin';
import type { SafetySite } from '@/types/backend';
import {
  doesReportOptionMatchSiteFilter,
  getReportAttachmentUnavailableReason,
  isReportAttachmentReady,
  mapAdminReportRowToMailboxReportOption,
  mergeMailboxReportOptions,
} from './mailboxReportPickerHelpers';

function buildSite(): SafetySite {
  return {
    id: 'site-live',
    site_name: '레거시 매칭 현장',
    headquarter_id: 'hq-live',
    headquarter: { id: 'hq-live', name: '레거시 본부' },
    headquarter_detail: { id: 'hq-live', name: '레거시 본부' },
    site_contact_email: 'site@example.com',
  } as SafetySite;
}

function buildReportRow(overrides: Partial<ControllerReportRow> = {}): ControllerReportRow {
  return {
    assigneeName: '',
    assigneeUserId: '',
    checkerUserId: '',
    controllerReview: null,
    deadlineDate: '',
    dispatch: null,
    dispatchSignal: '',
    dispatchStatus: '',
    headquarterId: '',
    headquarterName: '레거시 본부',
    lifecycleStatus: 'active',
    originalPdfAvailable: true,
    originalPdfDownloadPath: '',
    periodLabel: '',
    progressRate: null,
    qualityStatus: 'unchecked',
    reportKey: 'legacy:technical_guidance:9001',
    reportMonth: '',
    reportTitle: '레거시 보고서',
    reportType: 'technical_guidance',
    routeParam: 'legacy:technical_guidance:9001',
    siteId: '',
    siteName: '레거시 매칭 현장',
    sortLabel: '',
    status: 'submitted',
    updatedAt: '2026-04-20T09:00:00+09:00',
    visitDate: '2026-04-20',
    workflowStatus: 'submitted',
    ...overrides,
  };
}

test('legacy report options can match the selected site by site and headquarter names', () => {
  const site = buildSite();
  const option = mapAdminReportRowToMailboxReportOption(
    buildReportRow(),
    new Map(),
    site,
  );

  assert.equal(option.siteId, 'site-live');
  assert.equal(option.recipientEmail, 'site@example.com');
  assert.equal(doesReportOptionMatchSiteFilter(option, 'site-live', site), true);
});

test('legacy report options tolerate headquarter company suffix differences', () => {
  const site = {
    ...buildSite(),
    headquarter: { id: 'hq-live', name: '주식회사은화종합건설' },
    headquarter_detail: { id: 'hq-live', name: '주식회사은화종합건설' },
    site_name: '하왕십리동 890-93 다세대 신축공사',
  } as SafetySite;
  const option = mapAdminReportRowToMailboxReportOption(
    buildReportRow({
      headquarterName: '(주)은화종합건설',
      siteName: '하왕십리동 890-93 다세대 신축공사',
    }),
    new Map(),
    site,
  );

  assert.equal(option.siteId, 'site-live');
  assert.equal(doesReportOptionMatchSiteFilter(option, 'site-live', site), true);
});

test('legacy report options tolerate punctuation differences in site names', () => {
  const site = {
    ...buildSite(),
    site_name: '노량진동 218-75 76번지 다세대 신축공사',
  } as SafetySite;
  const option = mapAdminReportRowToMailboxReportOption(
    buildReportRow({
      siteName: '노량진동 218-75,76번지 다세대 신축공사',
    }),
    new Map(),
    site,
  );

  assert.equal(option.siteId, 'site-live');
  assert.equal(doesReportOptionMatchSiteFilter(option, 'site-live', site), true);
});


test('non-legacy report options still require an exact site id match', () => {
  const site = buildSite();
  const option = mapAdminReportRowToMailboxReportOption(
    buildReportRow({
      reportKey: 'current-report-1',
      routeParam: 'current-report-1',
      siteId: '',
    }),
    new Map(),
    site,
  );

  assert.equal(option.siteId, '');
  assert.equal(doesReportOptionMatchSiteFilter(option, 'site-live', site), false);
});

test('legacy report options without original PDFs are marked unavailable for mail attachment', () => {
  const option = mapAdminReportRowToMailboxReportOption(
    buildReportRow({
      originalPdfAvailable: false,
      reportKey: 'legacy:technical_guidance:641788',
      routeParam: 'legacy:technical_guidance:641788',
      status: 'draft',
      updatedAt: '2026-04-30T09:00:00+09:00',
      visitDate: '2026-04-30',
    }),
    new Map(),
  );

  assert.equal(isReportAttachmentReady(option), false);
  assert.match(
    getReportAttachmentUnavailableReason(option),
    /등록된 원본 PDF가 없는 레거시 보고서/,
  );
  assert.equal(option.attachmentReady, false);
});

test('merged report options preserve site-specific legacy fallback metadata', () => {
  const site = buildSite();
  const fallback = mapAdminReportRowToMailboxReportOption(buildReportRow(), new Map(), site);
  const exact = mapAdminReportRowToMailboxReportOption(
    buildReportRow({
      originalPdfAvailable: false,
      siteId: '',
      siteName: '',
      updatedAt: '',
    }),
    new Map(),
  );

  const merged = mergeMailboxReportOptions([exact, fallback]);

  assert.equal(merged.length, 1);
  assert.equal(merged[0]?.siteId, 'site-live');
  assert.equal(merged[0]?.originalPdfAvailable, true);
  assert.equal(merged[0]?.siteName, '레거시 매칭 현장');
});
