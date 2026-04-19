import type { Page } from 'playwright';

import { baseUrl } from '../config';
import { dismissImportantModalIfPresent, waitHeading } from '../helpers';

type OverviewCounts = {
  dispatchQueueCount: number;
  priorityCount: number;
  siteStatusEntryCount: number;
  totalSiteCount: number;
  unsentCount: number;
};

type ContentSummaryMetrics = {
  bodyIncluded: boolean;
  rows: number;
};

function hasArray(value: unknown) {
  return Array.isArray(value);
}

export async function runAdminControlCenterSection(page: Page) {
  let latestOverviewCounts: OverviewCounts | null = null;
  let latestContentSummaryMetrics: ContentSummaryMetrics | null = null;
  page.on('response', async (response) => {
    if (!response.url().includes('/api/admin/dashboard/overview') || !response.ok()) return;

    try {
      const payload = await response.json();
      latestOverviewCounts = {
        dispatchQueueCount: hasArray(payload.dispatchQueueRows) ? payload.dispatchQueueRows.length : -1,
        priorityCount: hasArray(payload.priorityQuarterlyManagementRows)
          ? payload.priorityQuarterlyManagementRows.length
          : -1,
        siteStatusEntryCount: hasArray(payload.siteStatusSummary?.entries)
          ? payload.siteStatusSummary.entries.length
          : -1,
        totalSiteCount:
          typeof payload.siteStatusSummary?.totalSiteCount === 'number'
            ? payload.siteStatusSummary.totalSiteCount
            : -1,
        unsentCount: hasArray(payload.unsentReportRows) ? payload.unsentReportRows.length : -1,
      };
    } catch {
      latestOverviewCounts = {
        dispatchQueueCount: -1,
        priorityCount: -1,
        siteStatusEntryCount: -1,
        totalSiteCount: -1,
        unsentCount: -1,
      };
    }
  });
  page.on('response', async (response) => {
    if (!response.url().includes('/api/safety/content-items') || !response.ok()) return;
    if (!response.url().includes('include_body=false')) return;

    try {
      const payload = await response.json();
      const rows = Array.isArray(payload) ? payload : [];
      latestContentSummaryMetrics = {
        bodyIncluded: rows.some((row) => row && typeof row === 'object' && row.body_included !== false),
        rows: rows.length,
      };
    } catch {
      latestContentSummaryMetrics = {
        bodyIncluded: true,
        rows: -1,
      };
    }
  });

  await page.goto(`${baseUrl}/admin?section=overview`, { waitUntil: 'load' });
  await page.waitForResponse((response) => {
    return response.url().includes('/api/admin/dashboard/overview') && response.ok();
  });
  await waitHeading(page, '운영 개요');
  if (!latestOverviewCounts) {
    throw new Error('Admin overview smoke did not observe /api/admin/dashboard/overview.');
  }
  const overviewCounts: OverviewCounts = latestOverviewCounts ?? {
    dispatchQueueCount: -1,
    priorityCount: -1,
    siteStatusEntryCount: -1,
    totalSiteCount: -1,
    unsentCount: -1,
  };
  if (
    overviewCounts.dispatchQueueCount < 0 ||
    overviewCounts.priorityCount < 0 ||
    overviewCounts.siteStatusEntryCount < 0 ||
    overviewCounts.totalSiteCount < 0 ||
    overviewCounts.unsentCount < 0
  ) {
    throw new Error(
      `Admin overview smoke received an unexpected overview payload shape: ${JSON.stringify(overviewCounts)}`,
    );
  }
  await page.getByText('미발송 경과 현황').first().waitFor();
  await page.getByText('현장 상태').first().waitFor();
  await page.getByText('발송 관리 대상').first().waitFor();
  await page.getByText('20억 이상 분기보고서 관리').first().waitFor();
  await page.getByRole('button', { name: '엑셀 내보내기' }).waitFor();
  await dismissImportantModalIfPresent(page);
  await page.waitForTimeout(2_000);
  await dismissImportantModalIfPresent(page);
  await page.locator('button[aria-label^="알림 열기"]').first().click();
  await page.getByText('중요 알림').first().waitFor();
  await dismissImportantModalIfPresent(page);

  await page.goto(`${baseUrl}/admin?section=analytics`, { waitUntil: 'load' });
  await Promise.all([
    page.waitForResponse((response) => {
      return response.url().includes('/api/admin/dashboard/analytics') && response.ok();
    }),
    page.waitForResponse((response) => {
      return response.url().includes('/api/admin/dashboard/analytics/detail') && response.ok();
    }),
  ]);
  await page.getByText('매출/실적 집계').first().waitFor();
  await page.getByText('수행 실적').first().waitFor();
  await page.getByText('예상 실적').first().waitFor();
  await page.getByText('월별 매출 추이').first().waitFor();
  await page.getByText('상세 표').first().waitFor();
  await page.locator('input[type="month"]').first().waitFor();
  await page.getByRole('button', { name: '엑셀 내보내기' }).waitFor();
  await page.getByRole('button', { name: '필터' }).click();
  await Promise.all([
    page.waitForResponse((response) => {
      return response.url().includes('/api/admin/dashboard/analytics') && response.ok();
    }),
    page.waitForResponse((response) => {
      return response.url().includes('/api/admin/dashboard/analytics/detail') && response.ok();
    }),
    page.locator('#analytics-filter-period').selectOption('year'),
  ]);
  await page.getByText('수행 실적').first().waitFor();

  await page.goto(`${baseUrl}/admin?section=content`, { waitUntil: 'load' });
  await page.waitForResponse((response) => {
    return response.url().includes('/api/safety/content-items') && response.ok();
  });
  await waitHeading(page, '콘텐츠 데이터');
  if (!latestContentSummaryMetrics) {
    throw new Error('Admin content smoke did not observe /api/safety/content-items summary request.');
  }
  const contentSummaryMetrics: ContentSummaryMetrics = latestContentSummaryMetrics ?? {
    bodyIncluded: true,
    rows: -1,
  };
  if (contentSummaryMetrics.rows < 0 || contentSummaryMetrics.bodyIncluded) {
    throw new Error(
      `Admin content smoke expected summary-only content items payload: ${JSON.stringify(contentSummaryMetrics)}`,
    );
  }
}
