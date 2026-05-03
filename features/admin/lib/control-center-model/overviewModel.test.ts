import assert from 'node:assert/strict';
import test from 'node:test';

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
    } as any,
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
    ] as any,
  );

  const row = (overview.priorityQuarterlyManagementRows ?? []).find((item) => item.siteId === 'site-1');

  assert.equal(row?.currentQuarterKey, quarterKey);
  assert.equal(row?.quarterlyReflectionStatus, 'created');
  assert.equal(row?.quarterlyDispatchStatus, 'sent');
  assert.equal(row?.quarterlyReportKey, 'quarterly-title-only');
});
