import assert from 'node:assert/strict';
import test from 'node:test';

import type { SafetyReport, SafetyReportListItem } from '@/types/backend';
import type { ControllerDashboardData } from '@/types/controller';
import { buildAdminOverviewModel } from './overviewModel';

test('priority quarterly rows recognize current quarter from report title fallback', () => {
  const today = new Date();
  const year = today.getFullYear();
  const quarter = Math.floor(today.getMonth() / 3) + 1;
  const quarterKey = `${year}-Q${quarter}`;
  const quarterTitle = `${year}년 ${quarter}분기 종합 보고서`;

  const overview = buildAdminOverviewModel(
    {
      assignments: [],
      headquarters: [{ id: 'hq-1', is_active: true, name: '테스트 건설사' }],
      sites: [
        {
          id: 'site-1',
          headquarter_id: 'hq-1',
          headquarter: { id: 'hq-1', name: '테스트 건설사' },
          headquarter_detail: { id: 'hq-1', name: '테스트 건설사' },
          project_amount: 3_000_000_000,
          project_start_date: `${year}-01-01`,
          project_end_date: `${year}-12-31`,
          site_name: '테스트 현장',
          status: 'active',
        },
      ],
      users: [],
    } as unknown as ControllerDashboardData,
    [
      {
        report_key: 'quarterly-title-only',
        report_title: quarterTitle,
        report_type: 'quarterly_summary',
        site_id: 'site-1',
        headquarter_id: 'hq-1',
        status: 'submitted',
        workflow_status: 'submitted',
        updated_at: today.toISOString(),
        dispatch: { dispatchStatus: 'sent' },
        meta: { reportKind: 'quarterly_summary' },
      },
    ] as unknown as SafetyReport[],
  );

  const row = (overview.priorityQuarterlyManagementRows ?? []).find((item) => item.siteId === 'site-1');

  assert.equal(row?.currentQuarterKey, quarterKey);
  assert.equal(row?.quarterlyReflectionStatus, 'created');
  assert.equal(row?.quarterlyDispatchStatus, 'sent');
  assert.equal(row?.quarterlyReportKey, 'quarterly-title-only');
});

test('quarterly material summary uses current-quarter active site scope', () => {
  const today = new Date('2026-04-20T00:00:00+09:00');
  const overview = buildAdminOverviewModel(
    {
      assignments: [],
      headquarters: [{ id: 'hq-1', is_active: true, name: 'HQ' }],
      sites: [
        {
          id: 'site-current-quarter',
          headquarter_id: 'hq-1',
          headquarter: { id: 'hq-1', name: 'HQ' },
          headquarter_detail: { id: 'hq-1', name: 'HQ' },
          project_amount: 2_500_000_000,
          project_start_date: '2026-04-01',
          project_end_date: '2026-06-30',
          site_name: 'Current quarter priority site',
          status: 'active',
        },
        {
          id: 'site-previous-quarter',
          headquarter_id: 'hq-1',
          headquarter: { id: 'hq-1', name: 'HQ' },
          headquarter_detail: { id: 'hq-1', name: 'HQ' },
          project_amount: 2_500_000_000,
          project_start_date: '2026-01-01',
          project_end_date: '2026-03-31',
          site_name: 'Previous quarter priority site',
          status: 'active',
        },
        {
          id: 'site-current-quarter-low-value',
          headquarter_id: 'hq-1',
          headquarter: { id: 'hq-1', name: 'HQ' },
          headquarter_detail: { id: 'hq-1', name: 'HQ' },
          project_amount: 1_900_000_000,
          project_start_date: '2026-04-01',
          project_end_date: '2026-06-30',
          site_name: 'Current quarter low value site',
          status: 'active',
        },
      ],
      users: [],
    } as unknown as ControllerDashboardData,
    [],
    [],
    today,
  );

  assert.equal(overview.quarterlyMaterialSummary.totalSiteCount, 2);
  assert.deepEqual(
    overview.quarterlyMaterialSummary.missingSiteRows.map((row) => row.siteId),
    ['site-current-quarter-low-value', 'site-current-quarter'],
  );
  assert.equal(
    overview.quarterlyMaterialSummary.entries.find((entry) => entry.key === 'both_missing')?.count,
    2,
  );
});

test('quarterly material summary counts payload guidance-date records with distinct URLs', () => {
  const today = new Date('2026-04-20T00:00:00+09:00');
  const overview = buildAdminOverviewModel(
    {
      assignments: [],
      headquarters: [{ id: 'hq-1', is_active: true, name: 'HQ' }],
      sites: [
        {
          id: 'site-material',
          headquarter_id: 'hq-1',
          headquarter: { id: 'hq-1', name: 'HQ' },
          headquarter_detail: { id: 'hq-1', name: 'HQ' },
          project_amount: 1_000_000_000,
          project_start_date: '2026-04-01',
          project_end_date: '2026-06-30',
          site_name: 'Material site',
          status: 'active',
        },
      ],
      users: [],
    } as unknown as ControllerDashboardData,
    [],
    [
      {
        report_key: 'guide-material',
        report_type: 'technical_guidance',
        site_id: 'site-material',
        visit_date: null,
        updated_at: '2026-01-01T00:00:00+00:00',
        meta: {},
        payload: {
          document2Overview: { guidanceDate: '2026-04-10' },
          document10Measurements: [
            { id: 'm1', measurementLocation: 'A', photoUrl: '/m/a.jpg' },
            { id: 'm2', measurementLocation: 'B', photoUrl: '/m/b.jpg' },
            { id: 'm3', measurementLocation: 'C', photoUrl: '/m/c.jpg' },
            { id: 'm4', measurementLocation: 'D', photoUrl: '/m/d.jpg' },
          ],
          document11EducationRecords: [
            { id: 'e1', materialName: 'same', materialUrl: '/e/a.pdf' },
            { id: 'e2', materialName: 'same', materialUrl: '/e/b.pdf' },
            { id: 'e3', materialName: 'same', photoUrl: '/e/c.jpg' },
            { id: 'e4', materialName: 'same', photoUrl: '/e/d.jpg' },
          ],
        },
      },
    ] as unknown as SafetyReport[],
    today,
  );

  assert.equal(overview.quarterlyMaterialSummary.totalSiteCount, 1);
  assert.deepEqual(overview.quarterlyMaterialSummary.missingSiteRows, []);
  assert.equal(
    overview.quarterlyMaterialSummary.entries.find((entry) => entry.key === 'complete')?.count,
    1,
  );
});
