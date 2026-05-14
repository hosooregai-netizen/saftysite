import type { Locator, Page } from 'playwright';
import type { ClientSmokePlaywrightConfig } from '../../../playwright.config';
import { createAdminSmokeHarness } from '../fixtures/adminSmokeHarness';

async function assertSiteTableColumnCount(page: Page) {
  await page.locator('table thead th').first().waitFor({ state: 'visible' });
  const columnCount = await page.locator('table thead th').count();
  if (columnCount !== 7) {
    throw new Error(`Expected 7 site table columns, received ${columnCount}.`);
  }
}

function getSiteTableRow(page: Page, siteName: string) {
  return page.locator('tbody tr').filter({ hasText: siteName }).first();
}

async function expandSectionIfCollapsed(dialog: Locator, name: string) {
  const toggle = dialog.getByRole('button', { name });
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') {
    await toggle.click();
  }
}

async function createSite(
  page: Page,
  input: {
    managerEmail: string;
    managerName: string;
    managerPhone: string;
    managementNumber: string;
    siteCode: string;
    siteName: string;
  },
) {
  await page.getByRole('button', { name: '현장 추가' }).click();
  const siteCreateDialog = page.getByRole('dialog', { name: '현장 추가' });
  await siteCreateDialog.getByLabel('현장명').fill(input.siteName);
  await siteCreateDialog.getByRole('button', { name: '추가' }).first().click();
  await siteCreateDialog.getByLabel('이름').first().fill(input.managerName);
  await siteCreateDialog.getByLabel('연락처').first().fill(input.managerPhone);
  await siteCreateDialog.getByLabel('이메일').first().fill(input.managerEmail);
  await expandSectionIfCollapsed(siteCreateDialog, '운영 정보');
  await expandSectionIfCollapsed(siteCreateDialog, '계약 정보');
  await siteCreateDialog.getByLabel('계약 유형').selectOption('private');
  await siteCreateDialog.getByLabel('계약 상태').selectOption('active');
  await siteCreateDialog.getByLabel('기술지도 계약 총액').fill('1200000');
  await siteCreateDialog.getByLabel('기술지도 횟수').fill('12');
  await siteCreateDialog.getByLabel('회차당 단가').fill('100000');
  await siteCreateDialog.getByRole('button', { name: '생성' }).click();
}

async function installDelayedSiteDetailRoute(page: Page, siteId: string, delayMs = 1200) {
  let intercepted = false;

  await page.route('**/api/admin/sites/list**', async (route) => {
    const url = new URL(route.request().url());
    if (intercepted || url.searchParams.get('site_id') !== siteId) {
      await route.fallback();
      return;
    }

    intercepted = true;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.fallback();
  });
}

async function installHeldAdminLegacyReportsRoute(page: Page, siteId: string) {
  let releaseResponse: () => void = () => {};
  let resolveIntercepted: () => void = () => {};
  let intercepted = false;
  const requestIntercepted = new Promise<void>((resolve) => {
    resolveIntercepted = resolve;
  });

  await page.route('**/api/admin/reports**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (
      intercepted ||
      request.method() !== 'GET' ||
      url.searchParams.get('site_id') !== siteId ||
      url.searchParams.get('report_type') !== 'technical_guidance'
    ) {
      await route.fallback();
      return;
    }

    intercepted = true;
    resolveIntercepted();
    await new Promise<void>((release) => {
      releaseResponse = release;
    });
    await route.fallback();
  });

  return {
    release: () => releaseResponse(),
    requestIntercepted,
  };
}

export async function runAdminSitesSmoke(config: ClientSmokePlaywrightConfig) {
  const harness = await createAdminSmokeHarness('admin-sites', config);

  try {
    const { page, requestCounts } = harness;
    const siteListReadsBefore = requestCounts.get('GET /api/admin/sites/list') || 0;
    const lookupReadsBefore = requestCounts.get('GET /api/admin/directory/lookups') || 0;
    const siteCreatesBefore = requestCounts.get('POST /sites') || 0;
    const siteUpdatesBefore = requestCounts.get('PATCH /sites/:id') || 0;
    const siteDeletesBefore = requestCounts.get('DELETE /sites/:id') || 0;
    const assignmentCreatesBefore = requestCounts.get('POST /assignments') || 0;
    const assignmentDeletesBefore = requestCounts.get('DELETE /assignments/:id') || 0;
    let adminSiteReadsBefore = requestCounts.get('GET /api/admin/sites/:id') || 0;
    const siteAName = 'mocked admin site a';
    const siteAId = 'site-mocked-admin-site-a';
    const siteBName = 'mocked admin site b';
    const siteBId = 'site-mocked-admin-site-b';
    const initialReportWritesBefore = requestCounts.get('POST /reports/upsert') || 0;
    const initialReportDispatchWritesBefore = requestCounts.get('PATCH /reports/:id/dispatch') || 0;
    const initialAdminDispatchWritesBefore =
      requestCounts.get('PATCH /api/admin/reports/:id/dispatch') || 0;

    await page.goto(`${harness.baseURL}/admin?section=headquarters&headquarterId=hq-1`, {
      waitUntil: 'load',
    });
    await harness.loginAs('admin@example.com');

    await harness.waitForRequestCount('GET /api/admin/sites/list', siteListReadsBefore + 1);
    await harness.waitForRequestCount('GET /api/admin/directory/lookups', lookupReadsBefore + 1);
    await page.getByRole('button', { name: '건설사 정보 수정' }).waitFor({ state: 'visible' });
    await page.waitForTimeout(250);
    let settledSiteListReads = requestCounts.get('GET /api/admin/sites/list') || 0;

    await page.goto(
      `${harness.baseURL}/admin?section=headquarters&headquarterId=hq-1&siteId=site-1`,
      { waitUntil: 'load' },
    );
    const firstLegacyReportHold = await installHeldAdminLegacyReportsRoute(page, 'site-1');
    await page.locator('a[href="/sites/site-1"]').first().click();
    await page.waitForURL(/\/sites\/site-1$/);
    await firstLegacyReportHold.requestIntercepted;
    await page.waitForTimeout(250);
    if (await page.locator('a[href="/sessions/report-tech-1"]').isVisible().catch(() => false)) {
      throw new Error('Admin site reports exposed a partial normal-only list before legacy reports loaded.');
    }
    if ((await page.locator('article').count()) > 0) {
      throw new Error('Admin site reports rendered rows before the combined list was ready.');
    }
    const adminReportReadsAfterFirstRequest = requestCounts.get('GET /api/admin/reports') || 0;
    firstLegacyReportHold.release();
    await harness.waitForRequestCount(
      'GET /api/admin/reports',
      adminReportReadsAfterFirstRequest + 1,
    );
    const legacyReportLink = page.getByRole('link', {
      exact: true,
      name: '레거시 5차 기술지도 보고서',
    });
    await legacyReportLink.waitFor({ state: 'visible' });

    const cachedLegacyReportHold = await installHeldAdminLegacyReportsRoute(page, 'site-1');
    await page.goto(`${harness.baseURL}/sites/site-1`, {
      waitUntil: 'load',
    });
    await page.waitForURL(/\/sites\/site-1$/);
    await cachedLegacyReportHold.requestIntercepted;
    await legacyReportLink.waitFor({ state: 'visible' });
    if (!(await page.locator('a[href="/sessions/report-tech-1"]').isVisible().catch(() => false))) {
      throw new Error('Cached admin site reports did not keep normal report rows visible during revalidation.');
    }
    const adminReportReadsAfterCachedRequest = requestCounts.get('GET /api/admin/reports') || 0;
    cachedLegacyReportHold.release();
    await harness.waitForRequestCount(
      'GET /api/admin/reports',
      adminReportReadsAfterCachedRequest + 1,
    );
    await legacyReportLink.waitFor({ state: 'visible' });

    if ((requestCounts.get('POST /reports/upsert') || 0) !== initialReportWritesBefore) {
      throw new Error('Rendering legacy admin site report rows must not upsert reports.');
    }
    if ((requestCounts.get('PATCH /reports/:id/dispatch') || 0) !== initialReportDispatchWritesBefore) {
      throw new Error('Rendering legacy admin site report rows must not patch report dispatch.');
    }
    if ((requestCounts.get('PATCH /api/admin/reports/:id/dispatch') || 0) !== initialAdminDispatchWritesBefore) {
      throw new Error('Rendering legacy admin site report rows must not patch admin report dispatch.');
    }

    const legacyReportRow = page.locator('article').filter({ has: legacyReportLink }).first();
    const legacyDispatchStatusCell = legacyReportRow.locator('[class*="dispatchStatusCell"]');
    const legacyPublicDispatchWritesBefore = requestCounts.get('PATCH /reports/:id/dispatch') || 0;
    const legacyAdminDispatchWritesBefore =
      requestCounts.get('PATCH /api/admin/reports/:id/dispatch') || 0;
    await legacyReportRow.locator('button[aria-haspopup="menu"]').click();
    await page.getByRole('menuitem', { name: '발송으로 변경' }).click();
    await harness.waitForRequestCount(
      'PATCH /api/admin/reports/:id/dispatch',
      legacyAdminDispatchWritesBefore + 1,
    );
    if ((requestCounts.get('PATCH /reports/:id/dispatch') || 0) !== legacyPublicDispatchWritesBefore) {
      throw new Error('Legacy site report dispatch toggle must use the admin dispatch API only.');
    }
    await harness.waitForCondition(
      async () => (await legacyDispatchStatusCell.textContent())?.includes('발송완료') === true,
      'Legacy site report row did not update to dispatched after manual toggle.',
    );

    const refreshedLegacyReportHold = await installHeldAdminLegacyReportsRoute(page, 'site-1');
    await page.goto(`${harness.baseURL}/sites/site-1`, {
      waitUntil: 'load',
    });
    await page.waitForURL(/\/sites\/site-1$/);
    await refreshedLegacyReportHold.requestIntercepted;
    const refreshedLegacyReportRow = page.locator('article').filter({
      hasText: '레거시 5차 기술지도 보고서',
    }).first();
    await refreshedLegacyReportRow.waitFor({ state: 'visible' });
    await harness.waitForCondition(
      async () =>
        (await refreshedLegacyReportRow.locator('[class*="dispatchStatusCell"]').textContent())
          ?.includes('발송완료') === true,
      'Legacy site report dispatch cache did not survive a page re-entry before revalidation.',
    );
    const adminReportReadsAfterLegacyDispatchReentry = requestCounts.get('GET /api/admin/reports') || 0;
    refreshedLegacyReportHold.release();
    await harness.waitForRequestCount(
      'GET /api/admin/reports',
      adminReportReadsAfterLegacyDispatchReentry + 1,
    );

    await legacyReportLink.click();
    await page.waitForURL(
      new RegExp(
        `/admin/report-open\\?reportKey=${encodeURIComponent('legacy:technical_guidance:1001')}`,
      ),
    );
    await page.getByRole('heading', { name: '레거시 원본 PDF 보기' }).waitFor({
      state: 'visible',
    });

    await page.goto(`${harness.baseURL}/sites/site-1`, {
      waitUntil: 'load',
    });
    await page.waitForURL(/\/sites\/site-1$/);
    const pdfMissingLegacyTrigger = page.getByRole('button', {
      exact: true,
      name: 'Legacy PDF Missing 6',
    });
    await pdfMissingLegacyTrigger.waitFor({ state: 'visible' });
    const legacySeedResponse = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return (
        response.request().method() === 'GET' &&
        url.pathname.endsWith('/reports/site/site-1/technical-guidance-seed') &&
        url.searchParams.get('target_visit_date') === '2026-04-07' &&
        url.searchParams.get('target_visit_round') === '6'
      );
    });
    const legacySchedulePatchResponse = page.waitForResponse((response) => {
      return (
        response.request().method() === 'PATCH' &&
        response.url().includes('/api/me/schedules/schedule-smoke-6')
      );
    });
    await pdfMissingLegacyTrigger.click();
    await legacySeedResponse;
    const linkedSchedule = (await (await legacySchedulePatchResponse).json()) as {
      linkedReportKey: string;
      plannedDate: string;
      roundNo: number;
    };
    if (
      !linkedSchedule.linkedReportKey ||
      linkedSchedule.linkedReportKey.startsWith('legacy:technical_guidance:')
    ) {
      throw new Error('PDF-less legacy creation did not relink the schedule to a new session key.');
    }
    if (linkedSchedule.plannedDate !== '2026-04-07' || linkedSchedule.roundNo !== 6) {
      throw new Error('PDF-less legacy creation patched the wrong visit date or round.');
    }
    await page.waitForURL(new RegExp(`/sessions/${linkedSchedule.linkedReportKey}$`));
    const generatedLegacyReport = harness.state.reports.find(
      (report) => String(report.report_key) === linkedSchedule.linkedReportKey,
    );
    if (!generatedLegacyReport) {
      throw new Error('PDF-less legacy creation did not save a generated report.');
    }
    if (generatedLegacyReport.visit_date !== '2026-04-07' || generatedLegacyReport.visit_round !== 6) {
      throw new Error('Generated report did not preserve the legacy visit date and round.');
    }
    const generatedMeta = generatedLegacyReport.meta as Record<string, unknown>;
    if (generatedMeta.sourceLegacyReportKey !== 'legacy:technical_guidance:1002') {
      throw new Error('Generated report did not persist sourceLegacyReportKey.');
    }

    await page.goto(`${harness.baseURL}/sites/site-1`, {
      waitUntil: 'load',
    });
    await page.waitForURL(/\/sites\/site-1$/);
    await page.locator(`a[href="/sessions/${linkedSchedule.linkedReportKey}"]`).first().waitFor({
      state: 'visible',
    });
    if (await page.getByText('Legacy PDF Missing 6', { exact: true }).isVisible().catch(() => false)) {
      throw new Error('Generated PDF-less legacy report was shown alongside its legacy placeholder.');
    }

    await page.goto(`${harness.baseURL}/admin?section=headquarters&headquarterId=hq-1`, {
      waitUntil: 'load',
    });
    await page.getByRole('button', { name: '건설사 정보 수정' }).waitFor({ state: 'visible' });
    await page.waitForTimeout(250);
    settledSiteListReads = requestCounts.get('GET /api/admin/sites/list') || 0;
    adminSiteReadsBefore = requestCounts.get('GET /api/admin/sites/:id') || 0;

    const siteSearch = page.locator('[role="search"]').first();
    const siteSearchInput = siteSearch.locator('input');
    await siteSearchInput.fill('ZZ-no-match-123');
    await page.waitForTimeout(250);
    if ((requestCounts.get('GET /api/admin/sites/list') || 0) !== settledSiteListReads) {
      throw new Error('Site search should wait for an explicit submit before refetching.');
    }
    await page.locator('tbody').getByText('기존 현장', { exact: true }).waitFor({ state: 'visible' });
    await Promise.all([
      harness.waitForRequestCount('GET /api/admin/sites/list', settledSiteListReads + 1),
      siteSearch.getByRole('button').click(),
    ]);
    await page.getByText('등록된 현장이 없습니다.', { exact: true }).waitFor({ state: 'visible' });

    await siteSearchInput.fill('김요원');
    await page.waitForTimeout(250);
    if ((requestCounts.get('GET /api/admin/sites/list') || 0) !== settledSiteListReads + 1) {
      throw new Error('Site search should keep the submitted query until the next submit.');
    }
    await Promise.all([
      harness.waitForRequestCount('GET /api/admin/sites/list', settledSiteListReads + 2),
      siteSearch.getByRole('button').click(),
    ]);
    await page.getByText('등록된 현장이 없습니다.', { exact: true }).waitFor({ state: 'hidden' });
    await page.locator('tbody').getByText('기존 현장', { exact: true }).waitFor({ state: 'visible' });

    await siteSearchInput.fill('');
    await siteSearch.getByRole('button').click();
    await page.locator('tbody').getByText('기존 현장', { exact: true }).waitFor({ state: 'visible' });

    const headquarterBackLabelCount = await page.getByText('건설사 목록', { exact: true }).count();
    if (headquarterBackLabelCount !== 1) {
      throw new Error(
        `Expected a single shell back label for the headquarter drilldown, received ${headquarterBackLabelCount}.`,
      );
    }

    await createSite(page, {
      managerEmail: 'hong.manager.a@example.com',
      managerName: 'Test Manager A',
      managerPhone: '010-5555-1111',
      managementNumber: 'M-NEW-001',
      siteCode: 'SITE-NEW-001',
      siteName: siteAName,
    });
    await harness.waitForRequestCount('POST /sites', siteCreatesBefore + 1);
    await createSite(page, {
      managerEmail: 'hong.manager.b@example.com',
      managerName: 'Test Manager B',
      managerPhone: '010-5555-3333',
      managementNumber: 'M-NEW-002',
      siteCode: 'SITE-NEW-002',
      siteName: siteBName,
    });
    await harness.waitForRequestCount('POST /sites', siteCreatesBefore + 2);
    await assertSiteTableColumnCount(page);

    await getSiteTableRow(page, siteAName).click();
    await page.waitForURL(new RegExp(`siteId=${siteAId}`));
    await page
      .locator(`a[href="/admin?section=headquarters&editSiteId=${siteAId}&headquarterId=hq-1"]`)
      .waitFor({ state: 'visible' });
    const siteBackLabelCount = await page.getByText('현장 목록', { exact: true }).count();
    if (siteBackLabelCount !== 1) {
      throw new Error(
        `Expected a single shell back label for the site main view, received ${siteBackLabelCount}.`,
      );
    }

    await page.goto(`${harness.baseURL}/admin?section=headquarters&headquarterId=hq-1`, {
      waitUntil: 'load',
    });
    await getSiteTableRow(page, siteBName).waitFor({ state: 'visible' });
    const siteReadsBeforeDelayedSelection = requestCounts.get('GET /api/admin/sites/list') || 0;
    await installDelayedSiteDetailRoute(page, siteBId);
    await getSiteTableRow(page, siteBName).click();
    await page.waitForURL(new RegExp(`siteId=${siteBId}`));

    const reportLink = page.locator(`a[href="/sites/${siteBId}"]`).first();
    await reportLink.waitFor({ state: 'visible' });
    await page.locator(`a[href="/sites/${siteBId}/quarterly"]`).first().waitFor({ state: 'visible' });
    await page.locator(`a[href="/sites/${siteBId}/photos"]`).first().waitFor({ state: 'visible' });
    await page.locator(`a[href^="/sites/${siteBId}/bad-workplace/"]`).first().waitFor({
      state: 'visible',
    });
    await reportLink.click();
    await page.waitForURL(new RegExp(`/sites/${siteBId}$`));
    await harness.waitForRequestCount('GET /api/admin/sites/:id', adminSiteReadsBefore + 1);
    await harness.waitForRequestCount(
      'GET /api/admin/sites/list',
      siteReadsBeforeDelayedSelection + 1,
    );

    await page.goto(
      `${harness.baseURL}/admin?section=headquarters&headquarterId=hq-1&siteId=${siteAId}`,
      { waitUntil: 'load' },
    );
    await page
      .locator(`a[href="/admin?section=headquarters&editSiteId=${siteAId}&headquarterId=hq-1"]`)
      .click();
    const siteEditDialog = page.getByRole('dialog', { name: '현장 정보 수정' });
    await siteEditDialog.getByLabel('연락처').first().fill('010-5555-2222');
    await siteEditDialog.getByLabel('계약 유형').selectOption('bid');
    await siteEditDialog.getByRole('button', { name: '저장' }).click();
    await harness.waitForRequestCount('PATCH /sites/:id', siteUpdatesBefore + 1);

    await page.goto(`${harness.baseURL}/admin?section=headquarters&headquarterId=hq-1`, {
      waitUntil: 'load',
    });
    await getSiteTableRow(page, siteAName).waitFor({ state: 'visible' });
    await getSiteTableRow(page, siteAName).getByRole('button').click();
    await page.getByRole('menuitem', { name: '지도요원 배정' }).click();
    const assignmentDialog = page.getByRole('dialog', { name: `${siteAName} 지도요원 배정` });
    await assignmentDialog.waitFor({ state: 'visible' });
    await assignmentDialog.getByRole('button', { name: '배정' }).first().click();
    await harness.waitForRequestCount('POST /assignments', assignmentCreatesBefore + 1);
    await assignmentDialog.getByRole('button', { name: '해제' }).first().click();
    await harness.waitForRequestCount('DELETE /assignments/:id', assignmentDeletesBefore + 1);
    await assignmentDialog.getByRole('button', { name: '닫기' }).click();

    page.once('dialog', (dialog) => dialog.accept());
    await getSiteTableRow(page, siteAName).getByRole('button').click();
    await page.getByRole('menuitem', { name: '삭제' }).click();
    await harness.waitForRequestCount('DELETE /sites/:id', siteDeletesBefore + 1);
    await page.getByText(siteAName, { exact: true }).waitFor({ state: 'hidden' });

    harness.assertContractApisObserved();
    harness.assertNoClientErrors();
  } finally {
    await harness.close();
  }
}
