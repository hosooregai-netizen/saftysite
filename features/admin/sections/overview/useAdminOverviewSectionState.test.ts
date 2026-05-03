import assert from 'node:assert/strict';
import test from 'node:test';

import { mergeOverviewResponseWithFallback } from './useAdminOverviewSectionState';
import type { SafetyAdminOverviewResponse } from '@/types/admin';

function buildOverview(): SafetyAdminOverviewResponse {
  return {
    alerts: [],
    completionRows: [],
    coverageRows: [],
    deadlineRows: [],
    deadlineSignalSummary: { entries: [], totalReportCount: 0 },
    dispatchQueueRows: [],
    endingSoonRows: [],
    endingSoonSummary: { entries: [], totalSiteCount: 0 },
    metricCards: [],
    overdueSiteRows: [],
    pendingReviewRows: [],
    priorityQuarterlyManagementRows: [],
    priorityTargetSiteRows: [],
    quarterlyMaterialSummary: {
      entries: [],
      missingSiteRows: [],
      quarterKey: '',
      quarterLabel: '',
      totalSiteCount: 0,
    },
    recipientMissingSiteRows: [],
    scheduleRows: [],
    siteStatusSummary: { entries: [], totalSiteCount: 0 },
    summaryRows: [],
    unsentReportRows: [],
    workerLoadRows: [],
  };
}

function buildEndingSoonRow(
  siteId: string,
): SafetyAdminOverviewResponse['endingSoonRows'][number] {
  return {
    deadlineLabel: 'D-4',
    daysUntilEnd: 4,
    endDate: '2026-05-08',
    endDateSource: 'contract_end_date',
    headquarterName: 'HQ',
    href: `/headquarters?siteId=${siteId}`,
    siteId,
    siteName: `Site ${siteId}`,
  };
}

function buildMaterialRow(
  siteId: string,
): SafetyAdminOverviewResponse['quarterlyMaterialSummary']['missingSiteRows'][number] {
  return {
    education: { filledCount: 1, missingCount: 3, requiredCount: 4 },
    headquarterName: 'HQ',
    href: `/headquarters?siteId=${siteId}`,
    measurement: { filledCount: 2, missingCount: 2, requiredCount: 4 },
    missingLabels: ['education', 'measurement'],
    quarterKey: '2026-Q2',
    quarterLabel: '2026 Q2',
    siteId,
    siteName: `Site ${siteId}`,
  };
}

test('restores material gap rows when upstream summary has counts but no row payload', () => {
  const fallbackOverview = buildOverview();
  fallbackOverview.quarterlyMaterialSummary = {
    entries: [
      { count: 29, href: '/headquarters', key: 'complete', label: 'Complete' },
      { count: 0, href: '/headquarters', key: 'education_missing', label: 'Education missing' },
      { count: 0, href: '/headquarters', key: 'measurement_missing', label: 'Measurement missing' },
      { count: 1, href: '/headquarters', key: 'both_missing', label: 'Both missing' },
    ],
    missingSiteRows: [buildMaterialRow('fallback-1')],
    quarterKey: '2026-Q2',
    quarterLabel: '2026 Q2',
    totalSiteCount: 30,
  };
  const upstreamOverview = {
    ...buildOverview(),
    quarterlyMaterialSummary: {
      ...fallbackOverview.quarterlyMaterialSummary,
      missingSiteRows: [],
    },
  };

  const merged = mergeOverviewResponseWithFallback(upstreamOverview, fallbackOverview);

  assert.deepEqual(
    merged.quarterlyMaterialSummary.missingSiteRows.map((row) => row.siteId),
    ['fallback-1'],
  );
});

test('restores ending-soon rows when upstream summary indicates a partial row payload', () => {
  const fallbackOverview = buildOverview();
  fallbackOverview.endingSoonRows = [buildEndingSoonRow('fallback-1'), buildEndingSoonRow('fallback-2')];
  fallbackOverview.endingSoonSummary = {
    entries: [{ count: 2, href: '/headquarters', key: 'd_0_7', label: 'D-0~7' }],
    totalSiteCount: 2,
  };
  const upstreamOverview = {
    ...buildOverview(),
    endingSoonRows: [buildEndingSoonRow('upstream-1')],
    endingSoonSummary: {
      entries: [{ count: 2, href: '/headquarters', key: 'd_0_7', label: 'D-0~7' }],
      totalSiteCount: 2,
    },
  };

  const merged = mergeOverviewResponseWithFallback(upstreamOverview, fallbackOverview);

  assert.deepEqual(
    merged.endingSoonRows.map((row) => row.siteId),
    ['fallback-1', 'fallback-2'],
  );
  assert.equal(merged.endingSoonSummary.totalSiteCount, 2);
});

test('keeps complete upstream row payloads', () => {
  const fallbackOverview = buildOverview();
  fallbackOverview.endingSoonRows = [buildEndingSoonRow('fallback-1')];
  fallbackOverview.quarterlyMaterialSummary.missingSiteRows = [buildMaterialRow('fallback-1')];
  const upstreamOverview = {
    ...buildOverview(),
    endingSoonRows: [buildEndingSoonRow('upstream-1'), buildEndingSoonRow('upstream-2')],
    endingSoonSummary: {
      entries: [{ count: 2, href: '/headquarters', key: 'd_0_7', label: 'D-0~7' }],
      totalSiteCount: 2,
    },
    quarterlyMaterialSummary: {
      entries: [
        { count: 0, href: '/headquarters', key: 'complete', label: 'Complete' },
        { count: 2, href: '/headquarters', key: 'both_missing', label: 'Both missing' },
      ],
      missingSiteRows: [buildMaterialRow('upstream-1'), buildMaterialRow('upstream-2')],
      quarterKey: '2026-Q2',
      quarterLabel: '2026 Q2',
      totalSiteCount: 2,
    },
  };

  const merged = mergeOverviewResponseWithFallback(upstreamOverview, fallbackOverview);

  assert.deepEqual(
    merged.endingSoonRows.map((row) => row.siteId),
    ['upstream-1', 'upstream-2'],
  );
  assert.deepEqual(
    merged.quarterlyMaterialSummary.missingSiteRows.map((row) => row.siteId),
    ['upstream-1', 'upstream-2'],
  );
});
