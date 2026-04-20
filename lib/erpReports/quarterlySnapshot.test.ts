import assert from 'node:assert/strict';
import test from 'node:test';

import { createFutureProcessRiskPlan } from '@/constants/inspectionSession/itemFactory';
import { createInspectionSession } from '@/constants/inspectionSession/sessionFactory';
import { createInspectionSite } from '@/constants/inspectionSession/sessionFactory';
import { createEmptyAdminSiteSnapshot } from '@/constants/inspectionSession/shared';
import { mapSafetyReportToQuarterlySummaryReport } from './mappers';
import {
  applyQuarterlySummarySeed,
  buildInitialQuarterlySummaryReport,
  buildLocalQuarterlySummarySeed,
  createQuarterlySummaryDraft,
} from './quarterly';

test('mapSafetyReportToQuarterlySummaryReport normalizes stored site snapshot fields', () => {
  const report = mapSafetyReportToQuarterlySummaryReport({
    report_key: 'quarterly-1',
    site_id: 'site-1',
    report_title: '2026 Q1 Summary',
    status: 'draft',
    dispatch_completed: false,
    created_at: '2026-04-01T00:00:00.000Z',
    updated_at: '2026-04-02T00:00:00.000Z',
    meta: {
      reportKind: 'quarterly_summary',
      quarterKey: '2026-Q1',
      year: 2026,
      quarter: 1,
    },
    payload: {
      reportKind: 'quarterly_summary',
      quarterKey: '2026-Q1',
      year: 2026,
      quarter: 1,
      periodStartDate: '2026-01-01',
      periodEndDate: '2026-03-31',
      siteSnapshot: {
        site_name: 'Site Alpha',
        management_number: 'MG-001',
        company_name: 'Acme Construction',
        contact_phone: '02-1111-2222',
        address: '1 Test-ro, Seoul',
      },
    },
  } as never);

  assert.ok(report);
  assert.equal(report?.siteSnapshot.siteName, 'Site Alpha');
  assert.equal(report?.siteSnapshot.siteManagementNumber, 'MG-001');
  assert.equal(report?.siteSnapshot.companyName, 'Acme Construction');
  assert.equal(report?.siteSnapshot.headquartersContact, '02-1111-2222');
  assert.equal(report?.siteSnapshot.headquartersAddress, '1 Test-ro, Seoul');
});

test('buildInitialQuarterlySummaryReport backfills blank snapshot values from site info', () => {
  const site = createInspectionSite({
    siteName: 'Site Alpha',
    siteManagementNumber: 'MG-100',
    companyName: 'Acme Construction',
    headquartersContact: '02-3333-4444',
    headquartersAddress: '3 Test-ro, Seongnam',
  });
  const existing = {
    ...createQuarterlySummaryDraft(site, 'Inspector', '2026-03-31'),
    siteSnapshot: createEmptyAdminSiteSnapshot({
      siteName: 'Site Alpha',
    }),
  };

  const hydrated = buildInitialQuarterlySummaryReport(site, [], 'Inspector', existing);

  assert.equal(hydrated.siteSnapshot.siteName, 'Site Alpha');
  assert.equal(hydrated.siteSnapshot.siteManagementNumber, 'MG-100');
  assert.equal(hydrated.siteSnapshot.companyName, 'Acme Construction');
  assert.equal(hydrated.siteSnapshot.headquartersContact, '02-3333-4444');
  assert.equal(hydrated.siteSnapshot.headquartersAddress, '3 Test-ro, Seongnam');
});

test('buildInitialQuarterlySummaryReport preserves existing values while filling missing ones', () => {
  const site = createInspectionSite({
    siteName: 'Site Alpha',
    siteManagementNumber: 'MG-100',
    companyName: 'Acme Construction',
    businessRegistrationNumber: '123-45-67890',
    headquartersContact: '02-3333-4444',
    headquartersAddress: '3 Test-ro, Seongnam',
  });
  const existing = {
    ...createQuarterlySummaryDraft(site, 'Inspector', '2026-03-31'),
    siteSnapshot: createEmptyAdminSiteSnapshot({
      siteName: 'Site Alpha',
      companyName: 'Custom Company',
      headquartersContact: '02-9999-8888',
      siteManagementNumber: '',
      businessRegistrationNumber: '',
      headquartersAddress: '',
    }),
  };

  const hydrated = buildInitialQuarterlySummaryReport(site, [], 'Inspector', existing);

  assert.equal(hydrated.siteSnapshot.companyName, 'Custom Company');
  assert.equal(hydrated.siteSnapshot.headquartersContact, '02-9999-8888');
  assert.equal(hydrated.siteSnapshot.siteManagementNumber, 'MG-100');
  assert.equal(hydrated.siteSnapshot.businessRegistrationNumber, '123-45-67890');
  assert.equal(hydrated.siteSnapshot.headquartersAddress, '3 Test-ro, Seongnam');
});

test('buildLocalQuarterlySummarySeed preserves process_name when hazard is present', () => {
  const site = createInspectionSite({
    siteName: 'Site Alpha',
  });
  const report = {
    ...createQuarterlySummaryDraft(site, 'Inspector', '2026-03-31'),
    periodStartDate: '2026-01-01',
    periodEndDate: '2026-03-31',
  };
  const session = createInspectionSession(
    {
      meta: {
        reportDate: '2026-03-10',
        drafter: 'Inspector',
      },
    },
    site.id,
    1,
  );
  session.document8Plans = [
    createFutureProcessRiskPlan({
      processName: '철근 작업',
      hazard: '낙하 위험',
      countermeasure: '안전난간 설치',
      source: 'api',
    }),
  ];

  const seed = buildLocalQuarterlySummarySeed(report, site, [session]);

  assert.equal(seed.future_plans[0]?.process_name, '철근 작업');
  assert.equal(seed.future_plans[0]?.hazard, '낙하 위험');
});

test('applyQuarterlySummarySeed restores process_name alongside hazard text', () => {
  const site = createInspectionSite({
    siteName: 'Site Alpha',
  });
  const report = createQuarterlySummaryDraft(site, 'Inspector', '2026-03-31');

  const applied = applyQuarterlySummarySeed(report, {
    period_start_date: '2026-01-01',
    period_end_date: '2026-03-31',
    selected_report_keys: [],
    source_reports: [],
    last_calculated_at: '2026-04-20T00:00:00.000Z',
    implementation_rows: [],
    accident_stats: [],
    causative_stats: [],
    future_plans: [
      {
        id: 'future-plan-1',
        process_name: '철근 작업',
        hazard: '낙하 위험',
        countermeasure: '안전난간 설치',
        note: '',
        source: 'api',
      },
    ],
    major_measures: [],
  });

  assert.equal(applied.futurePlans[0]?.processName, '철근 작업');
  assert.equal(applied.futurePlans[0]?.hazard, '낙하 위험');
});
