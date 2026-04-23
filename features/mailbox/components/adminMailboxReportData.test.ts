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
