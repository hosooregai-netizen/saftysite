import assert from 'node:assert/strict';
import test from 'node:test';

import type { ControllerReportRow } from '@/types/admin';
import type { SafetySite } from '@/types/backend';
import {
  fetchCanonicalAdminMailboxReportOptions,
  fetchCanonicalAdminMailboxSelectedReport,
} from './adminMailboxReportData';

function buildSiteMap() {
  const site = {
    id: 'site-1',
    site_name: '2025년 교통안전시설(안전표지) 유지보수공사(연간단가)',
    headquarter_id: 'hq-1',
    headquarter: { id: 'hq-1', name: '대윤환경' },
    headquarter_detail: { id: 'hq-1', name: '대윤환경' },
    site_contact_email: 'site@example.com',
  } as SafetySite;
  return new Map([[site.id, site] as const]);
}

function buildRow(overrides: Partial<ControllerReportRow> = {}): ControllerReportRow {
  return {
    assigneeName: '',
    assigneeUserId: '',
    checkerUserId: '',
    controllerReview: null,
    deadlineDate: '',
    dispatch: null,
    dispatchSignal: '',
    dispatchStatus: '',
    headquarterId: 'hq-1',
    headquarterName: '대윤환경',
    lifecycleStatus: 'active',
    originalPdfAvailable: false,
    originalPdfDownloadPath: '',
    periodLabel: '',
    progressRate: null,
    qualityStatus: 'unchecked',
    reportKey: 'report-current-1',
    reportMonth: '',
    reportTitle: '2025년 교통안전시설(안전표지) 유지보수공사(연간단가) 2025-06-23 3차 기술지도 보고서',
    reportType: 'technical_guidance',
    routeParam: 'report-current-1',
    siteId: 'site-1',
    siteName: '2025년 교통안전시설(안전표지) 유지보수공사(연간단가)',
    sortLabel: '',
    status: 'submitted',
    updatedAt: '2026-04-23T23:00:00+09:00',
    visitDate: '2025-06-23',
    workflowStatus: 'submitted',
    ...overrides,
  };
}

test('canonical admin selected report hydration uses exact report_key rows', async () => {
  const calls: Array<Record<string, unknown>> = [];
  const selected = await fetchCanonicalAdminMailboxSelectedReport({
    adminSiteById: buildSiteMap(),
    fetchReports: async (input) => {
      calls.push(input as Record<string, unknown>);
      return {
        limit: 1,
        offset: 0,
        rows: [
          buildRow({
            originalPdfAvailable: true,
            originalPdfDownloadPath:
              '/api/admin/reports/legacy%3Atechnical_guidance%3A440160/original-pdf',
            reportKey: 'legacy:technical_guidance:440160',
            routeParam: 'legacy:technical_guidance:440160',
          }),
        ],
        total: 1,
      };
    },
    reportKey: 'legacy:technical_guidance:440160',
    siteId: 'site-1',
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.reportKey, 'legacy:technical_guidance:440160');
  assert.equal(selected?.reportKey, 'legacy:technical_guidance:440160');
  assert.equal(selected?.originalPdfAvailable, true);
});

test('canonical admin selected report hydrates site detail when recipient email is missing', async () => {
  const selected = await fetchCanonicalAdminMailboxSelectedReport({
    adminSiteById: new Map([
      [
        'site-1',
        {
          ...buildSiteMap().get('site-1'),
          site_contact_email: '',
        } as SafetySite,
      ],
    ]),
    fetchReports: async () => ({
      limit: 1,
      offset: 0,
      rows: [buildRow()],
      total: 1,
    }),
    fetchSite: async (siteId) => ({
      ...buildSiteMap().get(siteId),
      site_contact_email: 'site-manager@example.com',
    } as SafetySite),
    reportKey: 'report-current-1',
    siteId: 'site-1',
  });

  assert.equal(selected?.recipientEmail, 'site-manager@example.com');
});

test('canonical admin open report picker options hydrate site detail for recipient emails', async () => {
  const fetchSiteCalls: string[] = [];
  const reportCalls: Array<Record<string, unknown>> = [];
  const response = await fetchCanonicalAdminMailboxReportOptions({
    adminSiteById: new Map(),
    fetchReports: async (input) => {
      reportCalls.push(input as Record<string, unknown>);
      return {
        limit: 20,
        offset: 0,
        rows: [buildRow()],
        total: 1,
      };
    },
    fetchSite: async (siteId) => {
      fetchSiteCalls.push(siteId);
      return {
        ...buildSiteMap().get(siteId),
        site_contact_email: 'site-picker@example.com',
      } as SafetySite;
    },
    page: 1,
    reportPickerOpen: true,
    reportSearch: '',
    reportSiteFilter: '',
  });

  assert.equal(reportCalls[0]?.limit, 20);
  assert.deepEqual(fetchSiteCalls, ['site-1']);
  assert.equal(response.options[0]?.recipientEmail, 'site-picker@example.com');
});

test('canonical admin closed report picker options skip site detail hydration', async () => {
  const fetchSiteCalls: string[] = [];
  const adminSiteById = new Map<string, SafetySite>([
    [
      'site-1',
      {
        ...buildSiteMap().get('site-1'),
        site_contact_email: 'cached-site@example.com',
      } as SafetySite,
    ],
    [
      'site-2',
      {
        ...buildSiteMap().get('site-1'),
        id: 'site-2',
        site_contact_email: '',
        site_name: 'Second site',
      } as SafetySite,
    ],
  ]);

  const response = await fetchCanonicalAdminMailboxReportOptions({
    adminSiteById,
    fetchReports: async () => ({
      limit: 500,
      offset: 0,
      rows: [
        buildRow({
          reportKey: 'report-current-cached',
          reportTitle: 'Cached site report',
          routeParam: 'report-current-cached',
          siteId: 'site-1',
        }),
        buildRow({
          reportKey: 'report-current-missing',
          reportTitle: 'Missing recipient report',
          routeParam: 'report-current-missing',
          siteId: 'site-2',
          siteName: 'Second site',
          updatedAt: '2026-04-24T23:00:00+09:00',
          visitDate: '2025-06-24',
        }),
      ],
      total: 2,
    }),
    fetchSite: async (siteId) => {
      fetchSiteCalls.push(siteId);
      return {
        ...buildSiteMap().get('site-1'),
        id: siteId,
        site_contact_email: 'should-not-load@example.com',
      } as SafetySite;
    },
    page: 1,
    reportPickerOpen: false,
    reportSearch: '',
    reportSiteFilter: '',
  });

  const optionsByReportKey = new Map(response.options.map((option) => [option.reportKey, option]));

  assert.deepEqual(fetchSiteCalls, []);
  assert.equal(optionsByReportKey.get('report-current-cached')?.recipientEmail, 'cached-site@example.com');
  assert.equal(optionsByReportKey.get('report-current-missing')?.recipientEmail, '');
});

test('canonical admin initial options prefer original PDF rows for duplicate report identities', async () => {
  const response = await fetchCanonicalAdminMailboxReportOptions({
    adminSiteById: buildSiteMap(),
    fetchReports: async () => ({
      limit: 500,
      offset: 0,
      rows: [
        buildRow(),
        buildRow({
          originalPdfAvailable: true,
          originalPdfDownloadPath:
            '/api/admin/reports/legacy%3Atechnical_guidance%3A440160/original-pdf',
          reportKey: 'legacy:technical_guidance:440160',
          routeParam: 'legacy:technical_guidance:440160',
        }),
      ],
      total: 2,
    }),
    page: 1,
    reportPickerOpen: false,
    reportSearch: '',
    reportSiteFilter: 'site-1',
  });

  assert.equal(response.options.length, 1);
  assert.equal(response.options[0]?.reportKey, 'legacy:technical_guidance:440160');
  assert.equal(response.options[0]?.originalPdfAvailable, true);
});
