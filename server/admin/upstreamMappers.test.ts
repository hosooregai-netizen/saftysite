import assert from 'node:assert/strict';
import test from 'node:test';

import { mapBackendAdminReportRow, mapBackendAdminReportsResponse } from './upstreamMappers';
import type { SafetyBackendAdminReportsResponse } from '@/types/backend';

test('mapBackendAdminReportsResponse skips malformed rows instead of throwing', () => {
  const payload = {
    limit: 100,
    offset: 0,
    rows: [
      null,
      {
        assignee_name: 'Assignee',
        assignee_user_id: 'user-1',
        checker_user_id: '',
        controller_review: null,
        deadline_date: '',
        dispatch: null,
        dispatch_signal: null,
        dispatch_status: null,
        headquarter_id: 'hq-1',
        headquarter_name: 'HQ',
        period_label: '',
        progress_rate: 50,
        quality_status: 'unchecked',
        report_key: 'report-1',
        report_month: '',
        report_title: 'Valid report',
        report_type: 'technical_guidance',
        route_param: '',
        site_id: 'site-1',
        site_name: 'Site 1',
        sort_label: 'Site 1 Valid report',
        status: 'draft',
        updated_at: '2026-04-20T09:00:00+09:00',
        visit_date: '',
      },
      {
        assignee_name: 'Missing key',
        assignee_user_id: 'user-2',
        checker_user_id: '',
        controller_review: null,
        deadline_date: '',
        dispatch: null,
        dispatch_signal: null,
        dispatch_status: null,
        headquarter_id: 'hq-2',
        headquarter_name: 'HQ 2',
        period_label: '',
        progress_rate: null,
        quality_status: 'unchecked',
        report_key: '',
        report_month: '',
        report_title: 'Missing key report',
        report_type: 'technical_guidance',
        route_param: '',
        site_id: 'site-2',
        site_name: 'Site 2',
        sort_label: 'Site 2 Missing key report',
        status: 'draft',
        updated_at: '2026-04-20T10:00:00+09:00',
        visit_date: '',
      },
    ],
    total: 2,
  } as unknown as SafetyBackendAdminReportsResponse;

  const result = mapBackendAdminReportsResponse(payload);

  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0]?.reportKey, 'report-1');
  assert.equal(result.total, 2);
});

test('mapBackendAdminReportsResponse tolerates missing row arrays', () => {
  const payload = {
    limit: undefined,
    offset: undefined,
    rows: undefined,
    total: undefined,
  } as unknown as SafetyBackendAdminReportsResponse;

  const result = mapBackendAdminReportsResponse(payload);

  assert.deepEqual(result, {
    limit: 0,
    offset: 0,
    rows: [],
    total: 0,
  });
});

test('mapBackendAdminReportRow treats filename-only original PDF metadata as available', () => {
  const row = mapBackendAdminReportRow({
    assignee_name: '',
    assignee_user_id: '',
    checker_user_id: '',
    controller_review: null,
    deadline_date: '',
    dispatch: null,
    dispatch_signal: null,
    dispatch_status: null,
    headquarter_id: 'hq-1',
    headquarter_name: 'HQ',
    original_pdf_archive_path: '',
    original_pdf_available: false,
    original_pdf_download_path: '',
    original_pdf_filename: 'legacy-guide.pdf',
    period_label: '',
    progress_rate: null,
    quality_status: 'unchecked',
    report_key: 'legacy:technical_guidance:110231',
    report_month: '',
    report_title: 'Legacy Guide',
    report_type: 'technical_guidance',
    route_param: '',
    site_id: 'site-1',
    site_name: 'Site 1',
    sort_label: 'Site 1 Legacy Guide',
    status: 'draft',
    updated_at: '2026-04-23T17:30:00+09:00',
    visit_date: '2026-04-01',
  } as never);

  assert.equal(row.originalPdfAvailable, true);
  assert.equal(
    row.originalPdfDownloadPath,
    '/api/admin/reports/legacy%3Atechnical_guidance%3A110231/original-pdf',
  );
});
