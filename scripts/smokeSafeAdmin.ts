import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { chromium, type BrowserContext, type Page, type Response } from 'playwright';
import { resolveClientSmokePlaywrightConfig } from '../playwright.config';
import { attachPageDiagnostics, login, type PageDiagnostics } from './smoke-real-client/helpers';

type Severity = 'critical' | 'high' | 'medium';

interface Finding {
  severity: Severity;
  title: string;
  location: string;
  actual: string;
  expected: string;
  steps: string;
  evidence: string;
}

interface SectionResult {
  durationMs: number;
  evidence: string[];
  name: string;
  status: 'passed' | 'failed';
}

interface UploadOutcome {
  articleVisible: boolean;
  downloadVerified: boolean;
  filename: string;
  message: string;
  networkEvidence: string[];
  outcome: 'explicit-failure' | 'silent-failure' | 'success';
  previewVerified: boolean;
}

interface RunReport {
  artifactDir: string;
  baseUrl: string;
  checks: SectionResult[];
  findings: Finding[];
  generatedAt: string;
}

const DEFAULT_BASE_URL = 'http://127.0.0.1:3100';
const DEFAULT_ARTIFACT_ROOT = path.join(process.cwd(), '.artifacts', 'admin-live-check');

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'section';
}

function createArtifactDir() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const target = path.join(process.env.ADMIN_SAFE_SMOKE_ARTIFACT_DIR || DEFAULT_ARTIFACT_ROOT, stamp);
  fs.mkdirSync(target, { recursive: true });
  return target;
}

function writeFile(targetPath: string, value: string) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, value, 'utf8');
}

function createBmpBuffer(width: number, height: number, rgb: [number, number, number]) {
  const rowPadding = (4 - ((width * 3) % 4)) % 4;
  const rowSize = width * 3 + rowPadding;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;
  const buffer = Buffer.alloc(fileSize);

  buffer.write('BM', 0, 'ascii');
  buffer.writeUInt32LE(fileSize, 2);
  buffer.writeUInt32LE(54, 10);
  buffer.writeUInt32LE(40, 14);
  buffer.writeInt32LE(width, 18);
  buffer.writeInt32LE(height, 22);
  buffer.writeUInt16LE(1, 26);
  buffer.writeUInt16LE(24, 28);
  buffer.writeUInt32LE(pixelArraySize, 34);

  for (let y = 0; y < height; y += 1) {
    const rowStart = 54 + y * rowSize;
    for (let x = 0; x < width; x += 1) {
      const pixelStart = rowStart + x * 3;
      buffer[pixelStart] = rgb[2];
      buffer[pixelStart + 1] = rgb[1];
      buffer[pixelStart + 2] = rgb[0];
    }
  }

  return buffer;
}

function addFinding(report: RunReport, finding: Finding) {
  report.findings.push(finding);
}

function extractNewDiagnostics(
  diagnostics: PageDiagnostics,
  before: { consoleErrors: number; failedResponses: number; pageErrors: number },
) {
  return {
    consoleErrors: diagnostics.consoleErrors.slice(before.consoleErrors),
    failedResponses: diagnostics.failedResponses.slice(before.failedResponses),
    pageErrors: diagnostics.pageErrors.slice(before.pageErrors),
  };
}

async function captureScreenshot(page: Page, artifactDir: string, label: string) {
  const target = path.join(artifactDir, `${slugify(label)}.png`);
  await page.screenshot({ fullPage: true, path: target, timeout: 15_000 });
  return target;
}

async function withSection(
  report: RunReport,
  page: Page,
  diagnostics: PageDiagnostics,
  artifactDir: string,
  name: string,
  runner: (section: SectionResult) => Promise<void>,
) {
  const startedAt = performance.now();
  const result: SectionResult = {
    durationMs: 0,
    evidence: [],
    name,
    status: 'passed',
  };
  const before = {
    consoleErrors: diagnostics.consoleErrors.length,
    failedResponses: diagnostics.failedResponses.length,
    pageErrors: diagnostics.pageErrors.length,
  };

  try {
    await runner(result);
  } catch (error) {
    result.status = 'failed';
    addFinding(report, {
      severity: 'high',
      title: `${name} check failed`,
      location: name,
      actual: error instanceof Error ? error.message : String(error),
      expected: `${name} section should complete without UI or contract failures.`,
      steps: `Open ${name} from the admin UI and repeat the scripted read-only flow.`,
      evidence: 'Section runner threw before completion.',
    });
  }

  const newDiagnostics = extractNewDiagnostics(diagnostics, before);
  if (newDiagnostics.consoleErrors.length || newDiagnostics.failedResponses.length || newDiagnostics.pageErrors.length) {
    addFinding(report, {
      severity: 'high',
      title: `${name} produced client/runtime errors`,
      location: name,
      actual: [
        ...newDiagnostics.pageErrors.map((item) => `pageerror: ${item}`),
        ...newDiagnostics.consoleErrors.map((item) => `console: ${item}`),
        ...newDiagnostics.failedResponses.map((item) => `network: ${item}`),
      ].join(' | '),
      expected: `${name} should render without new page errors, console errors, or 4xx/5xx API responses.`,
      steps: `Open ${name} and compare the browser console plus network responses during the same flow.`,
      evidence: 'Diagnostics were captured after this section started.',
    });
    result.evidence.push(
      ...newDiagnostics.pageErrors.map((item) => `pageerror: ${item}`),
      ...newDiagnostics.consoleErrors.map((item) => `console: ${item}`),
      ...newDiagnostics.failedResponses.map((item) => `network: ${item}`),
    );
  }

  try {
    const screenshotPath = await captureScreenshot(page, artifactDir, name);
    result.evidence.push(`screenshot=${screenshotPath}`);
  } catch (error) {
    result.evidence.push(
      `screenshot_failed=${error instanceof Error ? error.message : String(error)}`,
    );
  }
  result.durationMs = Math.round(performance.now() - startedAt);
  report.checks.push(result);
}

async function waitForAdminReadResponse(
  page: Page,
  urlIncludes: string,
  action: () => Promise<void>,
) {
  const responsePromise = page.waitForResponse(
    (response) => response.url().includes(urlIncludes) && response.request().method() === 'GET',
    { timeout: 60_000 },
  );
  await action();
  return responsePromise;
}

async function verifyOverviewAnalyticsAndContent(page: Page, baseUrl: string, section: SectionResult) {
  const overviewResponse = await waitForAdminReadResponse(page, '/api/admin/dashboard/overview', async () => {
    await page.goto(`${baseUrl}/admin?section=overview`, { waitUntil: 'load' });
  });
  const overviewPayload = (await overviewResponse.json()) as Record<string, unknown>;
  const dispatchQueueRows = Array.isArray(overviewPayload.dispatchQueueRows)
    ? overviewPayload.dispatchQueueRows.length
    : -1;
  const unsentRows = Array.isArray(overviewPayload.unsentReportRows)
    ? overviewPayload.unsentReportRows.length
    : -1;
  if (dispatchQueueRows < 0 || unsentRows < 0) {
    throw new Error('Overview payload shape regressed.');
  }
  section.evidence.push(`overview dispatch_queue_rows=${dispatchQueueRows}`);
  section.evidence.push(`overview unsent_rows=${unsentRows}`);

  const analyticsSummaryResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/api/admin/dashboard/analytics?') &&
      response.request().method() === 'GET',
    { timeout: 60_000 },
  );
  const analyticsDetailResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/api/admin/dashboard/analytics/detail?') &&
      response.request().method() === 'GET',
    { timeout: 60_000 },
  );
  await page.goto(`${baseUrl}/admin?section=analytics`, {
    waitUntil: 'load',
  });
  const [analyticsSummaryResponse, analyticsDetailResponse] = await Promise.all([
    analyticsSummaryResponsePromise,
    analyticsDetailResponsePromise,
  ]);
  const analyticsSummary = (await analyticsSummaryResponse.json()) as Record<string, unknown>;
  const analyticsDetail = (await analyticsDetailResponse.json()) as Record<string, unknown>;
  const summaryCards = Array.isArray(analyticsSummary.summaryCards)
    ? analyticsSummary.summaryCards.length
    : Array.isArray(analyticsSummary.summary_cards)
      ? analyticsSummary.summary_cards.length
      : -1;
  const detailRows = Array.isArray(analyticsDetail.employeeRows)
    ? analyticsDetail.employeeRows.length
    : Array.isArray(analyticsDetail.employee_rows)
      ? analyticsDetail.employee_rows.length
      : -1;
  if (summaryCards < 0 || detailRows < 0) {
    throw new Error('Analytics payload shape regressed.');
  }
  section.evidence.push(`analytics summary_cards=${summaryCards}`);
  section.evidence.push(`analytics detail_employee_rows=${detailRows}`);

  const contentResult = (await page.evaluate(async () => {
    const response = await fetch('/api/safety/content-items?active_only=true&include_body=false&limit=100', {
      cache: 'no-store',
      credentials: 'include',
    });
    const rows = await response.json();
    return {
      headers: Object.fromEntries(response.headers.entries()),
      ok: response.ok,
      rows,
      status: response.status,
    };
  })) as {
    headers: Record<string, string>;
    ok: boolean;
    rows: Array<Record<string, unknown>>;
    status: number;
  };
  if (!contentResult.ok || !Array.isArray(contentResult.rows)) {
    throw new Error(`Content items summary fetch failed with status ${contentResult.status}.`);
  }
  const bodyIncluded = contentResult.rows.some((row) => row.body_included !== false);
  if (bodyIncluded) {
    throw new Error('Content items summary response unexpectedly included full bodies.');
  }
  section.evidence.push(`content rows=${contentResult.rows.length}`);
  section.evidence.push(`content body_included=${bodyIncluded}`);
  if (contentResult.headers['x-content-items-serialized-bytes']) {
    section.evidence.push(
      `content serialized_bytes=${contentResult.headers['x-content-items-serialized-bytes']}`,
    );
  }
}

async function openFirstReportMenuItem(page: Page, itemName: string) {
  const rows = page.locator('tbody tr');
  const rowCount = await rows.count();
  for (let index = 0; index < Math.min(rowCount, 6); index += 1) {
    const row = rows.nth(index);
    const menuButton = row.locator('button[aria-haspopup="menu"]').first();
    if ((await menuButton.count()) === 0) {
      continue;
    }
    await menuButton.click();
    const menuItem = page.getByRole('menuitem', { name: itemName });
    if (await menuItem.count()) {
      await menuItem.click();
      return true;
    }
    await page.keyboard.press('Escape');
  }
  return false;
}

async function verifyReportsReadOnly(page: Page, baseUrl: string, section: SectionResult) {
  const reportsResponse = await waitForAdminReadResponse(page, '/api/admin/reports', async () => {
    await page.goto(`${baseUrl}/admin?section=reports`, { waitUntil: 'load' });
  });
  const reportsPayload = (await reportsResponse.json()) as Record<string, unknown>;
  const rows = Array.isArray(reportsPayload.rows) ? reportsPayload.rows.length : -1;
  if (rows < 0) {
    throw new Error('Reports payload shape regressed.');
  }
  section.evidence.push(`reports rows=${rows}`);

  const photoMenuOpened = await openFirstReportMenuItem(page, '사진첩 열기');
  if (!photoMenuOpened) {
    throw new Error('Could not find a report row with a "사진첩 열기" action.');
  }
  await page.waitForURL(/section=photos|\/sites\/.+\/photos/, { timeout: 30_000 });
  section.evidence.push(`report photo navigation url=${page.url()}`);
  const currentUrl = new URL(page.url());
  const reportKey = currentUrl.searchParams.get('reportKey');
  if (!reportKey) {
    throw new Error('Photo navigation did not preserve a reportKey for original PDF verification.');
  }
  await page.goto(`${baseUrl}/admin/report-open?reportKey=${encodeURIComponent(reportKey)}`, {
    waitUntil: 'load',
  });

  const pdfDialog = page.getByRole('dialog', { name: '원본 PDF 보기' });
  const pdfDialogVisible = pdfDialog.waitFor({ state: 'visible', timeout: 20_000 }).then(() => true).catch(() => false);
  const reportOpenUrl = page.waitForURL(/\/admin\/report-open/, { timeout: 20_000 }).then(() => true).catch(() => false);
  const outcome = await Promise.race([pdfDialogVisible, reportOpenUrl]);
  if (!outcome) {
    throw new Error('Original PDF view did not open as a dialog or report-open route.');
  }
  if (await pdfDialog.isVisible().catch(() => false)) {
    const iframe = pdfDialog.locator('iframe').first();
    await iframe.waitFor({ state: 'visible', timeout: 20_000 });
    section.evidence.push('report original_pdf=dialog');
    await page.keyboard.press('Escape');
  } else {
    const iframeVisible = await page.locator('iframe').first().waitFor({ state: 'visible', timeout: 20_000 }).then(() => true).catch(() => false);
    if (!iframeVisible) {
      const bodyText = await page.locator('body').innerText();
      if (
        !bodyText.includes('원본 PDF') &&
        !bodyText.includes('등록되지 않았습니다') &&
        !bodyText.includes('불러오는 중')
      ) {
        throw new Error('Report-open page did not expose a visible PDF frame or original-PDF status message.');
      }
    }
    section.evidence.push(`report original_pdf=url=${page.url()}`);
  }
}

async function verifyMailbox(page: Page, baseUrl: string, section: SectionResult) {
  await page.goto(`${baseUrl}/admin?section=mailbox`, { waitUntil: 'load' });
  const connectGate = page.locator('[data-mailbox-connect-gate]');
  const workspace = page.locator('[data-mailbox-workspace]');
  await Promise.race([
    connectGate.waitFor({ state: 'visible', timeout: 30_000 }),
    workspace.waitFor({ state: 'visible', timeout: 30_000 }),
  ]);
  section.evidence.push(`mailbox mode=${(await connectGate.isVisible().catch(() => false)) ? 'connect-gate' : 'workspace'}`);
}

async function verifySchedules(page: Page, baseUrl: string, section: SectionResult) {
  await page.goto(`${baseUrl}/admin?section=schedules`, { waitUntil: 'load' });
  await page.getByRole('heading', { name: '일정/캘린더' }).first().waitFor({ timeout: 30_000 });
  section.evidence.push(`schedules url=${page.url()}`);
}

async function openPhotosSection(page: Page, baseUrl: string, section: SectionResult) {
  const photosResponse = await waitForAdminReadResponse(page, '/api/photos', async () => {
    await page.goto(`${baseUrl}/admin?section=photos`, { waitUntil: 'load' });
  });
  const photosPayload = (await photosResponse.json()) as Record<string, unknown>;
  const total = typeof photosPayload.total === 'number' ? photosPayload.total : -1;
  if (total < 0) {
    throw new Error('Photo album response shape regressed.');
  }
  await page.getByRole('heading', { name: '사진첩' }).first().waitFor({ timeout: 30_000 });
  await page.locator('article').first().waitFor({ timeout: 30_000 });
  section.evidence.push(`photos total=${total}`);
}

async function selectFirstUploadableSite(page: Page) {
  const filterButton = page.getByRole('button', { name: '필터' }).first();
  await filterButton.click();
  const siteSelect = page.locator('#photo-filter-site');
  await siteSelect.waitFor({ state: 'visible', timeout: 30_000 });
  const optionValues = await siteSelect.locator('option').evaluateAll((options) =>
    options.map((option) => {
      const normalizedOption = option as HTMLOptionElement;
      return {
        disabled: normalizedOption.disabled,
        text: normalizedOption.textContent || '',
        value: normalizedOption.getAttribute('value') || '',
      };
    }),
  );
  const firstSelectable = optionValues.find((option) => option.value && !option.disabled);
  if (!firstSelectable) {
    throw new Error('No selectable site option was available for photo uploads.');
  }
  await siteSelect.selectOption(firstSelectable.value);
  await page.waitForTimeout(1_000);

  const roundSelect = page.locator('#photo-upload-round');
  await roundSelect.waitFor({ state: 'visible', timeout: 30_000 });
  const roundValues = await roundSelect.locator('option').evaluateAll((options) =>
    options.map((option) => option.getAttribute('value') || ''),
  );
  const firstRound = roundValues.find((value) => value && value !== '0');
  if (!firstRound) {
    throw new Error(`Selected site "${firstSelectable.text.trim()}" has no uploadable rounds.`);
  }
  await roundSelect.selectOption(firstRound);
  await page.waitForTimeout(500);
  return {
    roundNo: Number(firstRound),
    siteLabel: firstSelectable.text.trim(),
    siteValue: firstSelectable.value,
  };
}

async function waitForUploadNetwork(page: Page, action: () => Promise<void>) {
  const seen: string[] = [];
  const listener = (response: Response) => {
    const url = response.url();
    const method = response.request().method();
    if (
      method === 'POST' &&
      (url.includes('/api/photos/upload') || url.includes('/photo-assets/upload'))
    ) {
      seen.push(`${response.status()} ${method} ${url}`);
    }
  };

  page.on('response', listener);
  try {
    await action();
    await page.waitForTimeout(2_000);
  } finally {
    page.off('response', listener);
  }
  return seen;
}

async function verifyDownloadRequest(
  page: Page,
  context: BrowserContext,
  article: import('playwright').Locator,
) {
  const downloadPromise = page.waitForEvent('download', { timeout: 20_000 }).catch(() => null);
  const responsePromise = page
    .waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes('/api/photos/download'),
      { timeout: 20_000 },
    )
    .catch(() => null);

  await article.getByRole('button', { name: '다운로드' }).first().click();
  const [download, response] = await Promise.all([downloadPromise, responsePromise]);
  if (response && !response.ok()) {
    throw new Error(`Photo download returned ${response.status()} for ${response.url()}`);
  }
  if (!download && !response) {
    throw new Error('Photo download did not trigger a download event or download API response.');
  }
  if (download) {
    await download.delete().catch(() => undefined);
  }
}

async function uploadPhotoAndObserve(
  page: Page,
  context: BrowserContext,
  fileName: string,
  mimeType: string,
  buffer: Buffer,
  timeoutMs: number,
) {
  const fileInput = page.locator('input[type="file"]').first();
  const networkEvidence = await waitForUploadNetwork(page, async () => {
    await fileInput.setInputFiles({
      buffer,
      mimeType,
      name: fileName,
    });
  });
  const article = page.locator('article', { hasText: fileName }).first();
  const articleVisible = await article.waitFor({ state: 'visible', timeout: timeoutMs }).then(() => true).catch(() => false);
  const bodyText = await page.locator('body').innerText();
  const previewVerified =
    articleVisible &&
    Boolean(
      (await article.locator('img').first().getAttribute('src').catch(() => null))?.trim(),
    );

  let downloadVerified = false;
  if (articleVisible) {
    await verifyDownloadRequest(page, context, article);
    downloadVerified = true;
  }

  const explicitFailure = !articleVisible && bodyText.includes(fileName);
  return {
    articleVisible,
    downloadVerified,
    filename: fileName,
    message: explicitFailure
      ? `The page mentioned ${fileName} without rendering a new article.`
      : articleVisible
        ? `${fileName} rendered in the album grid.`
        : `No UI confirmation appeared for ${fileName} within ${timeoutMs}ms.`,
    networkEvidence,
    outcome: articleVisible ? 'success' : explicitFailure ? 'explicit-failure' : 'silent-failure',
    previewVerified,
  } satisfies UploadOutcome;
}

async function deleteUploadedPhoto(page: Page, fileName: string) {
  const article = page.locator('article', { hasText: fileName }).first();
  await article.waitFor({ state: 'visible', timeout: 15_000 });
  const checkbox = article.locator('input[type="checkbox"]').first();
  await checkbox.check();

  const dialogPromise = page.waitForEvent('dialog', { timeout: 10_000 });
  const deleteResponsePromise = page
    .waitForResponse(
      (response) =>
        response.request().method() === 'DELETE' &&
        response.url().includes('/api/photos'),
      { timeout: 20_000 },
    )
    .catch(() => null);
  await page.getByRole('button', { name: '선택 삭제' }).click();
  const dialog = await dialogPromise;
  await dialog.accept();
  const deleteResponse = await deleteResponsePromise;
  if (deleteResponse && !deleteResponse.ok()) {
    throw new Error(`Delete request failed with ${deleteResponse.status()}.`);
  }
  await article.waitFor({ state: 'hidden', timeout: 30_000 });
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(2_000);
  return (await page.locator('article', { hasText: fileName }).count()) === 0;
}

async function verifySafeUploadDelete(page: Page, context: BrowserContext, baseUrl: string, report: RunReport, section: SectionResult) {
  await page.goto(`${baseUrl}/admin?section=photos`, { waitUntil: 'load' });
  const siteSelection = await selectFirstUploadableSite(page);
  section.evidence.push(`photos selected_site=${siteSelection.siteLabel}`);
  section.evidence.push(`photos selected_round=${siteSelection.roundNo}`);

  const smallFileName = `admin-safe-small-${Date.now()}.bmp`;
  const smallUpload = await uploadPhotoAndObserve(
    page,
    context,
    smallFileName,
    'image/bmp',
    createBmpBuffer(64, 64, [32, 120, 220]),
    90_000,
  );

  if (smallUpload.outcome !== 'success') {
    addFinding(report, {
      severity: smallUpload.outcome === 'silent-failure' ? 'critical' : 'high',
      title: 'Small admin photo upload failed',
      location: 'admin > photos',
      actual: smallUpload.message,
      expected: 'A small image upload should appear in the album grid with preview and download support.',
      steps: `Open /admin?section=photos, select site ${siteSelection.siteLabel}, upload ${smallFileName}.`,
      evidence: smallUpload.networkEvidence.join(' | ') || 'No upload response was observed.',
    });
    section.status = 'failed';
  } else {
    if (!smallUpload.previewVerified) {
      addFinding(report, {
        severity: 'high',
        title: 'Uploaded photo preview did not render',
        location: 'admin > photos',
        actual: `${smallFileName} uploaded but no preview image src was observed.`,
        expected: 'Uploaded photo cards should render a preview image.',
        steps: `Upload ${smallFileName} in the admin photo album.`,
        evidence: smallUpload.networkEvidence.join(' | ') || 'Upload network evidence unavailable.',
      });
    }
    if (!smallUpload.downloadVerified) {
      addFinding(report, {
        severity: 'high',
        title: 'Uploaded photo download could not be verified',
        location: 'admin > photos',
        actual: `${smallFileName} rendered but clicking 다운로드 did not trigger a download event or API response.`,
        expected: 'Uploaded photo cards should allow downloading the new asset.',
        steps: `Upload ${smallFileName}, then click its 다운로드 action.`,
        evidence: smallUpload.networkEvidence.join(' | ') || 'Upload network evidence unavailable.',
      });
    }

    const deleted = await deleteUploadedPhoto(page, smallFileName);
    if (!deleted) {
      addFinding(report, {
        severity: 'critical',
        title: 'Uploaded photo delete did not fully remove the item',
        location: 'admin > photos',
        actual: `${smallFileName} remained visible after 선택 삭제 and reload.`,
        expected: 'Session-created uploads should disappear immediately and remain absent after reload.',
        steps: `Upload ${smallFileName}, select it, run 선택 삭제, then reload the page.`,
        evidence: 'Delete response succeeded but the UI still showed the item afterward.',
      });
      section.status = 'failed';
    } else {
      section.evidence.push(`small_upload deleted=${smallFileName}`);
    }
  }

  const largeFileName = `admin-safe-large-${Date.now()}.bmp`;
  const largeUpload = await uploadPhotoAndObserve(
    page,
    context,
    largeFileName,
    'image/bmp',
    createBmpBuffer(1400, 1400, [180, 90, 30]),
    150_000,
  );
  section.evidence.push(`large_upload outcome=${largeUpload.outcome}`);
  section.evidence.push(...largeUpload.networkEvidence.map((item) => `large_upload network=${item}`));

  if (largeUpload.outcome === 'silent-failure') {
    addFinding(report, {
      severity: 'critical',
      title: 'Large photo upload failed without a clear UI outcome',
      location: 'admin > photos',
      actual: largeUpload.message,
      expected: 'Large uploads should either succeed or surface a clear error/limit message.',
      steps: `Upload ${largeFileName} from /admin?section=photos after selecting ${siteSelection.siteLabel}.`,
      evidence: largeUpload.networkEvidence.join(' | ') || 'No upload response was observed.',
    });
    section.status = 'failed';
  }

  if (largeUpload.outcome === 'success') {
    const deletedLarge = await deleteUploadedPhoto(page, largeFileName);
    if (!deletedLarge) {
      addFinding(report, {
        severity: 'critical',
        title: 'Large uploaded photo could not be removed cleanly',
        location: 'admin > photos',
        actual: `${largeFileName} remained after delete and reload.`,
        expected: 'Any large upload created by this session should be removable.',
        steps: `Upload ${largeFileName}, then delete it from the same photo album view.`,
        evidence: largeUpload.networkEvidence.join(' | ') || 'Upload network evidence unavailable.',
      });
      section.status = 'failed';
    } else {
      section.evidence.push(`large_upload deleted=${largeFileName}`);
    }
  }
}

function renderMarkdown(report: RunReport) {
  const lines = [
    '# Admin Live Check Report',
    '',
    `- Generated at: ${report.generatedAt}`,
    `- Base URL: ${report.baseUrl}`,
    `- Artifact dir: ${report.artifactDir}`,
    '',
    '## Checks',
    '',
  ];

  for (const check of report.checks) {
    lines.push(`- ${check.name}: ${check.status} (${check.durationMs}ms)`);
    for (const evidence of check.evidence) {
      lines.push(`  - ${evidence}`);
    }
  }

  lines.push('', '## Findings', '');
  if (!report.findings.length) {
    lines.push('- No findings recorded.');
  } else {
    for (const finding of report.findings) {
      lines.push(`- [${finding.severity}] ${finding.title}`);
      lines.push(`  - location: ${finding.location}`);
      lines.push(`  - actual: ${finding.actual}`);
      lines.push(`  - expected: ${finding.expected}`);
      lines.push(`  - steps: ${finding.steps}`);
      lines.push(`  - evidence: ${finding.evidence}`);
    }
  }

  return `${lines.join('\n')}\n`;
}

async function main() {
  const config = resolveClientSmokePlaywrightConfig({
    baseURL: process.env.SMOKE_BASE_URL || process.env.PLAYWRIGHT_BASE_URL || DEFAULT_BASE_URL,
    headless: process.env.PLAYWRIGHT_HEADLESS !== '0',
  });
  const artifactDir = createArtifactDir();
  const report: RunReport = {
    artifactDir,
    baseUrl: config.baseURL,
    checks: [],
    findings: [],
    generatedAt: new Date().toISOString(),
  };

  const browser = await chromium.launch({
    headless: config.headless,
    slowMo: config.slowMoMs,
  });
  const context = await browser.newContext({
    acceptDownloads: true,
    baseURL: config.baseURL,
    viewport: config.viewport,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(Math.max(config.testTimeoutMs, 60_000));
  page.setDefaultNavigationTimeout(Math.max(config.navigationTimeoutMs, 60_000));
  const diagnostics = attachPageDiagnostics(page);

  try {
    await login(page, context, {
      baseUrl: config.baseURL,
      email: requireEnv('LIVE_SAFETY_EMAIL'),
      entryPath: '/admin?section=overview',
      password: requireEnv('LIVE_SAFETY_PASSWORD'),
    });

  await withSection(report, page, diagnostics, artifactDir, 'overview-analytics-content', async (section) => {
      await verifyOverviewAnalyticsAndContent(page, config.baseURL, section);
    });
    await withSection(report, page, diagnostics, artifactDir, 'reports-read-only', async (section) => {
      await verifyReportsReadOnly(page, config.baseURL, section);
    });
    await withSection(report, page, diagnostics, artifactDir, 'sites-read-only', async (section) => {
      await page.goto(`${config.baseURL}/admin?section=headquarters`, { waitUntil: 'load' });
      await page.getByRole('link', { name: '현장 목록 보기' }).waitFor({ timeout: 30_000 });
      section.evidence.push(`sites url=${page.url()}`);
    });
    await withSection(report, page, diagnostics, artifactDir, 'schedules-read-only', async (section) => {
      await verifySchedules(page, config.baseURL, section);
    });
    await withSection(report, page, diagnostics, artifactDir, 'photos-read-only', async (section) => {
      await openPhotosSection(page, config.baseURL, section);
    });
    await withSection(report, page, diagnostics, artifactDir, 'photos-safe-upload-delete', async (section) => {
      await verifySafeUploadDelete(page, context, config.baseURL, report, section);
    });
    await withSection(report, page, diagnostics, artifactDir, 'mailbox-read-only', async (section) => {
      await verifyMailbox(page, config.baseURL, section);
    });
  } finally {
    await browser.close();
  }

  const reportJsonPath = path.join(artifactDir, 'report.json');
  const reportMarkdownPath = path.join(artifactDir, 'report.md');
  writeFile(reportJsonPath, JSON.stringify(report, null, 2));
  writeFile(reportMarkdownPath, renderMarkdown(report));

  console.log(JSON.stringify({
    artifactDir,
    checks: report.checks,
    findings: report.findings,
    reportJsonPath,
    reportMarkdownPath,
  }, null, 2));

  if (report.findings.length > 0 || report.checks.some((check) => check.status === 'failed')) {
    process.exitCode = 1;
  }
}

void main();
