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
const uploadBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAIAAACQKrqGAAAAGElEQVR42mP8z/CfAQgwYKShoYGJAQoA0CIAjF7Q4x8AAAAASUVORK5CYII=',
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
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
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
