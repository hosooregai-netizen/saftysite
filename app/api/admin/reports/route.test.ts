import assert from 'node:assert/strict';
import test from 'node:test';

import type { ControllerReportRow } from '@/types/admin';
import { matchesReportRow } from './reportRowFilters';

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
    headquarterId: 'hq-1',
    headquarterName: 'HQ',
    lifecycleStatus: 'active',
    originalPdfAvailable: false,
    originalPdfDownloadPath: '',
    periodLabel: '',
    progressRate: null,
    qualityStatus: 'unchecked',
    reportKey: 'report-1',
    reportMonth: '',
    reportTitle: 'Report 1',
    reportType: 'technical_guidance',
    routeParam: 'report-1',
    siteId: 'site-1',
    siteName: 'Site 1',
    sortLabel: '',
    status: 'draft',
    updatedAt: '2026-04-24T09:00:00+09:00',
    visitDate: '2026-04-24',
    workflowStatus: 'draft',
    ...overrides,
  };
}

function buildFilters() {
  return {
    assigneeUserId: '',
    dateFrom: '',
    dateTo: '',
    dispatchStatus: '',
    headquarterId: '',
    mailAttachableOnly: true,
    qualityStatus: '',
    query: '',
    reportKey: '',
    reportType: '',
    siteId: '',
    status: '',
  };
}

test('mailAttachableOnly keeps non-legacy draft reports that use generated PDFs', () => {
  const row = buildReportRow({
    originalPdfAvailable: false,
    reportKey: 'report-current-draft-1',
    routeParam: 'report-current-draft-1',
  });

  assert.equal(matchesReportRow(row, buildFilters()), true);
});

test('mailAttachableOnly excludes legacy reports without original PDFs', () => {
  const row = buildReportRow({
    originalPdfAvailable: false,
    reportKey: 'legacy:technical_guidance:641788',
    routeParam: 'legacy:technical_guidance:641788',
  });

  assert.equal(matchesReportRow(row, buildFilters()), false);
});
