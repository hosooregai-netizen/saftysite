import assert from 'node:assert/strict';
import test from 'node:test';

import type { ReportDispatchMeta } from '@/types/admin';
import type { SafetyReport, SafetySiteOperationalReportIndexResponse } from '@/types/backend';
import {
  clearOperationalReportIndexCaches,
  fetchAndCacheOperationalReportIndex,
  getCachedOperationalReportIndex,
  upsertOperationalQuarterlyReportIndexFromReport,
} from './operationalReportIndexCache';

const CREATED_AT = '2026-04-01T00:00:00.000Z';
const UPDATED_AT = '2026-04-02T00:00:00.000Z';

function buildDispatch(dispatchStatus: ReportDispatchMeta['dispatchStatus']): ReportDispatchMeta {
  return {
    actualRecipient: '',
    dispatchStatus,
    dispatchMethod: dispatchStatus === 'manual_checked' ? 'manual' : '',
    dispatchedAt: '',
    dispatchCheckedBy: dispatchStatus === 'manual_checked' ? 'admin-1' : '',
    dispatchCheckedAt: dispatchStatus === 'manual_checked' ? UPDATED_AT : '',
    mailboxAccountId: '',
    mailThreadId: '',
    messageId: '',
    readAt: '',
    recipient: '',
    replyAt: '',
    replySummary: '',
    sentHistory:
      dispatchStatus === 'manual_checked'
        ? [
            {
              id: 'history-1',
              memo: 'manual dispatch',
              sentAt: UPDATED_AT,
              sentByUserId: 'admin-1',
            },
          ]
        : [],
  };
}

function buildReport(
  overrides: Partial<SafetyReport> = {},
  dispatch: ReportDispatchMeta = buildDispatch('none'),
): SafetyReport {
  return {
    id: overrides.id ?? 'quarterly-1',
    report_key: overrides.report_key ?? 'quarterly-1',
    report_title: overrides.report_title ?? 'Quarterly report',
    site_id: overrides.site_id ?? 'site-1',
    headquarter_id: overrides.headquarter_id ?? 'hq-1',
    schedule_id: null,
    assigned_user_id: null,
    visit_date: null,
    visit_round: null,
    total_round: null,
    progress_rate: null,
    status: overrides.status ?? 'draft',
    workflow_status: 'draft',
    lifecycle_status: 'active',
    dispatch_completed: overrides.dispatch_completed ?? false,
    payload_version: 1,
    latest_revision_no: 0,
    submitted_at: null,
    published_at: null,
    last_autosaved_at: null,
    report_type: 'quarterly_report',
    review: null,
    dispatch,
    document_kind: null,
    meta: {
      reportKind: 'quarterly_summary',
      periodStartDate: '2026-04-01',
      periodEndDate: '2026-06-30',
      quarterKey: '2026-Q2',
      year: 2026,
      quarter: 2,
      lastCalculatedAt: UPDATED_AT,
      ...(overrides.meta ?? {}),
    },
    created_at: overrides.created_at ?? CREATED_AT,
    updated_at: overrides.updated_at ?? UPDATED_AT,
    payload: {
      reportKind: 'quarterly_summary',
      selectedReportCount: 2,
      ...(overrides.payload ?? {}),
    },
    ...overrides,
  };
}

function buildOperationalIndexResponse(
  dispatchCompleted: boolean,
): SafetySiteOperationalReportIndexResponse {
  return {
    quarterly_reports: [
      {
        report_key: 'quarterly-1',
        report_title: 'Quarterly report',
        site_id: 'site-1',
        status: 'draft',
        dispatch_completed: dispatchCompleted,
        period_start_date: '2026-04-01',
        period_end_date: '2026-06-30',
        quarter_key: '2026-Q2',
        year: 2026,
        quarter: 2,
        selected_report_count: 2,
        last_calculated_at: UPDATED_AT,
        created_at: CREATED_AT,
        updated_at: UPDATED_AT,
      },
    ],
    bad_workplace_reports: [],
  };
}

test('upsertOperationalQuarterlyReportIndexFromReport replaces same report key and preserves dispatch meta', async () => {
  await clearOperationalReportIndexCaches();

  upsertOperationalQuarterlyReportIndexFromReport(
    'owner-1',
    'site-1',
    buildReport(),
  );
  upsertOperationalQuarterlyReportIndexFromReport(
    'owner-1',
    'site-1',
    buildReport({ dispatch_completed: true }, buildDispatch('manual_checked')),
  );

  const entry = getCachedOperationalReportIndex('owner-1', 'site-1');
  assert.equal(entry?.quarterlyReports.length, 1);
  assert.equal(entry?.quarterlyReports[0]?.id, 'quarterly-1');
  assert.equal(entry?.quarterlyReports[0]?.dispatchCompleted, true);
  assert.equal(entry?.quarterlyReports[0]?.dispatchStatus, 'manual_checked');
  assert.equal(entry?.quarterlyReports[0]?.dispatch?.sentHistory.length, 1);
  assert.deepEqual(entry?.quarterlyReports[0]?.meta?.dispatch, buildDispatch('manual_checked'));
  assert.deepEqual(entry?.badWorkplaceReports, []);

  await clearOperationalReportIndexCaches();
});

test('quarterly upsert only touches the matching owner and site cache', async () => {
  await clearOperationalReportIndexCaches();

  upsertOperationalQuarterlyReportIndexFromReport(
    'owner-1',
    'site-1',
    buildReport({ dispatch_completed: true }, buildDispatch('manual_checked')),
  );
  upsertOperationalQuarterlyReportIndexFromReport(
    'owner-1',
    'site-2',
    buildReport({ site_id: 'site-2', dispatch_completed: false }),
  );
  upsertOperationalQuarterlyReportIndexFromReport(
    'owner-2',
    'site-1',
    buildReport({ dispatch_completed: false }),
  );

  assert.equal(
    getCachedOperationalReportIndex('owner-1', 'site-1')?.quarterlyReports[0]
      ?.dispatchCompleted,
    true,
  );
  assert.equal(
    getCachedOperationalReportIndex('owner-1', 'site-2')?.quarterlyReports[0]
      ?.dispatchCompleted,
    false,
  );
  assert.equal(
    getCachedOperationalReportIndex('owner-2', 'site-1')?.quarterlyReports[0]
      ?.dispatchCompleted,
    false,
  );

  await clearOperationalReportIndexCaches();
});

test('late pre-mutation operational index response does not overwrite dispatch upsert', async () => {
  await clearOperationalReportIndexCaches();

  const originalFetch = globalThis.fetch;
  let releaseResponse = () => {};
  const delayedResponse = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });

  globalThis.fetch = (async () => {
    await delayedResponse;
    return new Response(JSON.stringify(buildOperationalIndexResponse(false)), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;

  try {
    const request = fetchAndCacheOperationalReportIndex('token-stale', 'owner-1', 'site-1');
    upsertOperationalQuarterlyReportIndexFromReport(
      'owner-1',
      'site-1',
      buildReport({ dispatch_completed: true }, buildDispatch('manual_checked')),
    );

    releaseResponse();
    await request;

    assert.equal(
      getCachedOperationalReportIndex('owner-1', 'site-1')?.quarterlyReports[0]
        ?.dispatchCompleted,
      true,
    );
  } finally {
    globalThis.fetch = originalFetch;
    await clearOperationalReportIndexCaches();
  }
});

test('force revalidation after dispatch upsert applies server source of truth', async () => {
  await clearOperationalReportIndexCaches();

  upsertOperationalQuarterlyReportIndexFromReport(
    'owner-1',
    'site-1',
    buildReport({ dispatch_completed: true }, buildDispatch('manual_checked')),
  );

  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(JSON.stringify(buildOperationalIndexResponse(false)), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })) as typeof fetch;

  try {
    await fetchAndCacheOperationalReportIndex('token-force', 'owner-1', 'site-1', {
      force: true,
    });
    assert.equal(
      getCachedOperationalReportIndex('owner-1', 'site-1')?.quarterlyReports[0]
        ?.dispatchCompleted,
      false,
    );
  } finally {
    globalThis.fetch = originalFetch;
    await clearOperationalReportIndexCaches();
  }
});
