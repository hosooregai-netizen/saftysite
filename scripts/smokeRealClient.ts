import fs from 'node:fs';
import { chromium } from 'playwright';

const seedPath = process.env.SMOKE_SEED_PATH || '/tmp/safety-e2e-seed.json';
const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8')) as {
  adminEmail: string;
  adminPassword: string;
  workerEmail: string;
  workerPassword: string;
  site1Id: string;
  site2Id: string;
};

const baseUrl = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3100';
const uploadName = `worker-upload-${Date.now()}.png`;
const assistUploadName = `assist-upload-${Date.now()}.png`;
const uploadBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAIAAACQKrqGAAAAGElEQVR42mP8z/CfAQgwYKShoYGJAQoA0CIAjF7Q4x8AAAAASUVORK5CYII=',
  'base64',
);
const k2bWorkbookBuffer = Buffer.from(
  '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',
  'base64',
);

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1440, height: 1200 },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30_000);

  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const failedResponses: string[] = [];

  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      const text = message.text();
      if (!text.includes('favicon')) consoleErrors.push(text);
    }
  });
  page.on('response', (response) => {
    const url = response.url();
    const status = response.status();
    const isRelevant =
      url.includes('/api/') ||
      url.includes('/photo-assets/') ||
      url.includes(':8011/api/v1');

    if (!isRelevant || status < 400 || url.includes('favicon')) return;
    failedResponses.push(`${status} ${response.request().method()} ${url}`);
  });

  async function login(email: string, password: string) {
    await page.goto(baseUrl, { waitUntil: 'load' });

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const logoutButton = page.getByRole('button', { name: '로그아웃' });

    const hasLoginForm = async () => {
      try {
        await emailInput.waitFor({ state: 'visible', timeout: 3_000 });
        return true;
      } catch {
        return false;
      }
    };

    if (!(await hasLoginForm()) && (await logoutButton.count()) > 0) {
      await logoutButton.first().click();
      await emailInput.waitFor({ state: 'visible', timeout: 10_000 });
    }

    await emailInput.fill(email);
    await passwordInput.fill(password);
    await page.getByRole('button', { name: /^로그인$/ }).click();
    await page.waitForFunction(
      () => Boolean(window.localStorage.getItem('safety-api-access-token')),
    );
    await page.waitForTimeout(500);
  }

  async function logout() {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await context.clearCookies();
  }

  async function waitHeading(name: string) {
    await page.getByRole('heading', { name }).first().waitFor();
  }

  async function dismissImportantModalIfPresent() {
    const modal = page.getByRole('dialog', { name: '중요 알림' });
    if ((await modal.count()) === 0) return;
    const closeButton = modal.getByRole('button', { name: '닫기' });
    if ((await closeButton.count()) === 0) return;
    await closeButton.click();
    await modal.waitFor({ state: 'hidden' });
  }

  await login(seed.adminEmail, seed.adminPassword);

  await page.goto(`${baseUrl}/admin?section=overview`, { waitUntil: 'load' });
  await waitHeading('관제 대시보드');
  await page.getByText('전체 현장 수').first().waitFor();
  await page.getByText('분기 보고 발송 지연').first().waitFor();
  await dismissImportantModalIfPresent();
  await page.waitForTimeout(2_000);
  await dismissImportantModalIfPresent();
  await page.locator('button[aria-label^="알림 열기"]').first().click();
  await page.getByText('중요 알림').first().waitFor();
  await dismissImportantModalIfPresent();

  await page.goto(`${baseUrl}/admin?section=analytics`, { waitUntil: 'load' });
  await page.getByText('실적/매출 요약').first().waitFor();
  await page.getByText('직원별 실적/매출').first().waitFor();

  await page.goto(`${baseUrl}/admin?section=mailbox`, { waitUntil: 'load' });
  await waitHeading('메일함');
  await page.getByRole('button', { name: '연결 계정' }).click();
  await page.getByRole('button', { name: /구글 로그인으로 연결/ }).first().waitFor();
  await page.getByRole('button', { name: /네이버 로그인으로 연결/ }).first().waitFor();

  await page.goto(`${baseUrl}/admin?section=k2b`, { waitUntil: 'load' });
  await waitHeading('K2B 업로드');
  await page.locator('input[type="file"]').first().setInputFiles({
    buffer: k2bWorkbookBuffer,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    name: 'k2b-smoke.xlsx',
  });
  await page.getByRole('button', { name: '파일 파싱' }).click();
  await page
    .getByText('K2B 업로드 파일을 파싱했습니다. 매핑과 중복 후보를 확인해 주세요.')
    .first()
    .waitFor({ timeout: 30_000 });
  await page.getByText('중복 판정').first().waitFor();

  await page.goto(`${baseUrl}/admin?section=reports`, { waitUntil: 'load' });
  await waitHeading('전체 보고서');
  await page.getByText('1차 기술지도 보고서').first().waitFor();
  await page.getByText('2026년 1분기 종합 보고서').first().waitFor();

  await page.getByRole('button', { name: /1차 기술지도 보고서 메뉴 열기/ }).click();
  await page.getByRole('menuitem', { name: '품질 체크' }).click();
  await page.getByRole('dialog').locator('select').first().selectOption('ok');
  await page.getByRole('dialog').locator('textarea').fill('클라이언트 E2E 확인 완료');
  await page.getByRole('dialog').getByRole('button', { name: '저장' }).click();
  await page.getByText('보고서 품질 체크를 저장했습니다.').first().waitFor();

  await page.getByRole('button', { name: /1차 기술지도 보고서 메뉴 열기/ }).click();
  await page.getByRole('menuitem', { name: '사진첩 열기' }).click();
  await page.waitForURL(/section=photos/);
  await page.getByText('보고서 컨텍스트: 1차 기술지도 보고서').first().waitFor();
  await page.getByRole('link', { name: '보고서로 돌아가기' }).click();
  await page.waitForURL(/\/sessions\//);
  await page.getByRole('link', { name: '사진첩 열기' }).first().click();
  await page.waitForURL(/\/sites\/.*\/photos/);
  await page.getByText('보고서 컨텍스트: 1차 기술지도 보고서').first().waitFor();
  await page.getByRole('link', { name: '보고서로 돌아가기' }).first().click();
  await page.waitForURL(/\/sessions\//);
  await page.goto(`${baseUrl}/admin?section=reports`, { waitUntil: 'load' });
  await waitHeading('전체 보고서');

  await page.getByRole('button', { name: /2026년 1분기 종합 보고서 메뉴 열기/ }).click();
  await page.getByRole('menuitem', { name: '발송이력 보기' }).click();
  const dispatchDialog = page.getByRole('dialog');
  await dispatchDialog.waitFor();
  const textarea = dispatchDialog.locator('textarea').first();
  if ((await textarea.count()) > 0) {
    await textarea.fill('클라이언트 E2E 발송');
  }
  const dialogButtons = dispatchDialog.getByRole('button');
  const buttonCount = await dialogButtons.count();
  let clicked = false;
  for (let index = 0; index < buttonCount; index += 1) {
    const label = await dialogButtons.nth(index).innerText();
    if (/(저장|추가|발송완료)/.test(label)) {
      await dialogButtons.nth(index).click();
      clicked = true;
      break;
    }
  }
  if (!clicked) {
    throw new Error('발송 이력 저장 버튼을 찾지 못했습니다.');
  }
  await page.waitForTimeout(1_000);

  await page.goto(`${baseUrl}/admin?section=schedules`, { waitUntil: 'load' });
  await page.getByText('일정/캘린더').first().waitFor();
  await page.getByText('미선택 일정 큐').first().waitFor();

  await page.goto(`${baseUrl}/admin?section=photos`, { waitUntil: 'load' });
  await waitHeading('사진첩');
  await page.getByText(/전체 \d+건/).first().waitFor();
  const legacyCount = await page.locator('article').count();

  await logout();
  await login(seed.workerEmail, seed.workerPassword);

  await page.goto(`${baseUrl}/calendar`, { waitUntil: 'load' });
  await page.getByText('내 일정').first().waitFor();
  await page.getByText('회차별 일정 선택').first().waitFor();
  await dismissImportantModalIfPresent();
  await page.getByRole('button', { name: '이 날짜로 선택' }).first().waitFor();
  const assistLink = page
    .locator('section', { hasText: '미선택 회차' })
    .getByRole('link', { name: '현장 보조' })
    .first();
  await assistLink.click();
  await page.waitForURL(/\/sites\/.*\/assist\?scheduleId=/);
  await page.getByText('현장 보조 - 테스트 현장 A').first().waitFor();
  await page.locator('a[href^="tel:"]').first().waitFor();
  await page.locator('input[type="file"]').first().setInputFiles({
    buffer: uploadBuffer,
    mimeType: 'image/png',
    name: assistUploadName,
  });
  await page.getByText('1건의 현장 사진을 업로드했습니다.').first().waitFor({ timeout: 30_000 });
  const signatureCanvas = page.locator('canvas').first();
  const signatureBox = await signatureCanvas.boundingBox();
  if (!signatureBox) {
    throw new Error('현장 사인 캔버스를 찾지 못했습니다.');
  }
  await signatureCanvas.dispatchEvent('pointerdown', {
    bubbles: true,
    buttons: 1,
    clientX: signatureBox.x + 24,
    clientY: signatureBox.y + 24,
    pointerId: 1,
    pointerType: 'mouse',
  });
  await signatureCanvas.dispatchEvent('pointermove', {
    bubbles: true,
    buttons: 1,
    clientX: signatureBox.x + 120,
    clientY: signatureBox.y + 90,
    pointerId: 1,
    pointerType: 'mouse',
  });
  await signatureCanvas.dispatchEvent('pointerup', {
    bubbles: true,
    buttons: 0,
    clientX: signatureBox.x + 120,
    clientY: signatureBox.y + 90,
    pointerId: 1,
    pointerType: 'mouse',
  });
  await page.waitForFunction(() => {
    const button = Array.from(document.querySelectorAll('button')).find(
      (element) => element.textContent?.trim() === '사인 저장',
    ) as HTMLButtonElement | undefined;
    return Boolean(button && !button.disabled);
  });
  await page.getByRole('button', { name: '사인 저장' }).click();
  await page.getByText('현장 사인을 저장했습니다.').first().waitFor({ timeout: 30_000 });
  await page.getByText('최근 저장된 사인').first().waitFor();
  await page.getByRole('link', { name: '전체 사진첩' }).click();
  await page.waitForURL(/\/sites\/.*\/photos/);
  await page.getByText(assistUploadName).first().waitFor({ timeout: 30_000 });
  await page.goto(`${baseUrl}/calendar`, { waitUntil: 'load' });
  await page.waitForTimeout(1_000);

  await page.goto(`${baseUrl}/mailbox`, { waitUntil: 'load' });
  await waitHeading('메일함');
  await page.getByRole('button', { name: '연결 계정' }).click();
  await page.getByRole('button', { name: /구글 로그인으로 연결/ }).first().waitFor();

  await page.goto(`${baseUrl}/sites/${seed.site1Id}/photos`, { waitUntil: 'load' });
  await page.getByText('현장 사진첩 - 테스트 현장 A').first().waitFor();
  const beforeCount = await page.locator('article').count();
  await page.locator('input[type="file"]').setInputFiles({
    buffer: uploadBuffer,
    mimeType: 'image/png',
    name: uploadName,
  });
  await page.getByText('1건의 사진을 업로드했습니다.').first().waitFor({ timeout: 30_000 });
  const afterCount = await page.locator('article').count();
  if (afterCount <= beforeCount) {
    throw new Error(`작업자 업로드 후 사진 개수가 증가하지 않았습니다: ${beforeCount} -> ${afterCount}`);
  }

  const uploadArticle = page.locator('article', { hasText: uploadName }).first();
  await uploadArticle.waitFor();
  const previewSrc = await uploadArticle.locator('img').getAttribute('src');
  if (!previewSrc || !previewSrc.includes('127.0.0.1:8011')) {
    throw new Error(`업로드 사진 미리보기 src가 잘못되었습니다: ${previewSrc}`);
  }

  await uploadArticle.getByRole('button', { name: '다운로드' }).click();
  await page.waitForTimeout(1_000);
  const downloadName = uploadName;
  if (!downloadName.includes('worker-upload')) {
    throw new Error(`다운로드 파일명이 예상과 다릅니다: ${downloadName}`);
  }

  await page.goto(`${baseUrl}/sites/${seed.site2Id}/photos`, { waitUntil: 'load' });
  await page.getByText('해당 현장을 찾을 수 없습니다.').first().waitFor();

  await logout();
  await login(seed.adminEmail, seed.adminPassword);
  await page.goto(`${baseUrl}/admin?section=photos`, { waitUntil: 'load' });
  await waitHeading('사진첩');
  await page
    .locator('select')
    .filter({ has: page.locator('option[value="album_upload"]') })
    .first()
    .selectOption('album_upload');
  await page.getByText(uploadName).first().waitFor({ timeout: 30_000 });

  await browser.close();

  if (pageErrors.length || consoleErrors.length || failedResponses.length) {
    throw new Error(
      JSON.stringify(
        {
          consoleErrors,
          failedResponses,
          pageErrors,
        },
        null,
        2,
      ),
    );
  }

  console.log(
    JSON.stringify(
      {
        counts: { afterCount, beforeCount, legacyCount },
        downloadName,
        status: 'ok',
        uploadedPreviewSrc: previewSrc,
      },
      null,
      2,
    ),
  );
}

void main();
