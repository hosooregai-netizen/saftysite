import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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
const k2bSuffix = `${Date.now()}`;
const k2bHeadquarterName = `테스트 본사 ${k2bSuffix}`;
const k2bSiteName = `테스트 현장 ${k2bSuffix}`;
const k2bManagementNumber = `SMOKE-K2B-${k2bSuffix}`;
const k2bBusinessNumber = `111-22-${k2bSuffix.slice(-5)}`;
const uploadBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAIAAACQKrqGAAAAGElEQVR42mP8z/CfAQgwYKShoYGJAQoA0CIAjF7Q4x8AAAAASUVORK5CYII=',
  'base64',
);

function buildK2bWorkbookBuffer() {
  const pythonPath =
    process.env.SMOKE_PYTHON_PATH ||
    '/Users/mac_mini/Documents/GitHub/safety-server/.venv/bin/python';
  const workbookPath = path.join(os.tmpdir(), `k2b-smoke-${k2bSuffix}.xlsx`);
  const workbookScript = `
from openpyxl import Workbook

path = ${JSON.stringify(workbookPath)}
workbook = Workbook()
sheet = workbook.active
sheet.title = "K2B"
sheet.append([
    "사업장명",
    "사업자등록번호",
    "현장명",
    "관리번호",
    "착공일",
    "준공일",
    "계약일",
    "총회차",
    "회차당 금액",
    "총 계약금액",
])
sheet.append([
    ${JSON.stringify(k2bHeadquarterName)},
    ${JSON.stringify(k2bBusinessNumber)},
    ${JSON.stringify(k2bSiteName)},
    ${JSON.stringify(k2bManagementNumber)},
    "2026-04-01",
    "2026-04-30",
    "2026-04-01",
    3,
    250000,
    750000,
])
workbook.save(path)
print(path)
`;

  execFileSync(pythonPath, ['-c', workbookScript], {
    stdio: 'inherit',
  });
  return fs.readFileSync(workbookPath);
}

const k2bWorkbookBuffer = buildK2bWorkbookBuffer();

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

  async function login(email: string, password: string, entryPath: string) {
    await page.goto(`${baseUrl}${entryPath}`, { waitUntil: 'load' });

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
      await page.goto(`${baseUrl}${entryPath}`, { waitUntil: 'load' });
    }

    await emailInput.waitFor({ state: 'visible', timeout: 10_000 });

    await emailInput.fill(email);
    await passwordInput.fill(password);
    await page.getByRole('button', { name: /^로그인$/ }).click();
    await page.waitForFunction(
      () => Boolean(window.localStorage.getItem('safety-api-access-token')),
    );
    await page.waitForTimeout(500);
  }

  async function logout() {
    const logoutButton = page.getByRole('button', { name: '로그아웃' });
    if ((await logoutButton.count()) > 0) {
      await logoutButton.first().click();
      await page.waitForTimeout(500);
    }
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

  await login(seed.adminEmail, seed.adminPassword, '/admin?section=overview');

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
  await page.getByRole('button', { name: '상태 새로고침' }).click();
  await page.getByText('메일 계정과 공급자 상태를 새로고침했습니다.').first().waitFor();

  await page.goto(`${baseUrl}/admin?section=k2b`, { waitUntil: 'load' });
  let k2bDialog = page.getByRole('dialog', { name: '엑셀 업로드' });
  await k2bDialog.waitFor();
  await k2bDialog.getByRole('button', { name: '닫기' }).click();
  await k2bDialog.waitFor({ state: 'hidden' });
  await page.waitForURL(/section=headquarters/);
  await waitHeading('사업장 목록');

  await page.getByRole('button', { name: '엑셀 업로드' }).first().click();
  k2bDialog = page.getByRole('dialog', { name: '엑셀 업로드' });
  await k2bDialog.waitFor();
  await k2bDialog.locator('input[type="file"]').first().setInputFiles({
    buffer: k2bWorkbookBuffer,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    name: 'k2b-smoke.xlsx',
  });
  await k2bDialog.getByRole('button', { name: '파일 파싱' }).click();
  await k2bDialog
    .getByText('K2B 업로드 파일을 파싱했습니다. 매핑과 중복 후보를 확인해 주세요.')
    .first()
    .waitFor({ timeout: 30_000 });
  await k2bDialog.getByText('중복 판정').first().waitFor();
  await k2bDialog.getByRole('button', { name: 'DB에 반영' }).click();
  await k2bDialog.getByText('K2B 데이터를 사업장/현장에 반영했습니다.').first().waitFor({
    timeout: 30_000,
  });
  await k2bDialog.getByText('보완 필요').first().waitFor();
  await k2bDialog.getByRole('button', { name: '닫기' }).click();
  await k2bDialog.waitFor({ state: 'hidden' });

  await page.goto(`${baseUrl}/admin?section=headquarters`, { waitUntil: 'load' });
  await page.getByPlaceholder('사업장명, 연락처, 주소로 검색').fill(k2bHeadquarterName);
  await page.locator('tbody tr', { hasText: k2bHeadquarterName }).first().click();
  await page.getByText('현장 목록').first().waitFor();
  await page.getByPlaceholder('현장명, 사업장명, 책임자, 배정 요원으로 검색').fill(k2bManagementNumber);
  await page.getByText(k2bSiteName).first().waitFor({ timeout: 30_000 });
  await page.getByText('보완 필요').first().waitFor({ timeout: 30_000 });

  await page.goto(`${baseUrl}/admin?section=reports`, { waitUntil: 'load' });
  await waitHeading('전체 보고서');
  await page.getByRole('button', { name: '엑셀 업로드' }).first().click();
  k2bDialog = page.getByRole('dialog', { name: '엑셀 업로드' });
  await k2bDialog.waitFor();
  await k2bDialog.getByRole('button', { name: '닫기' }).click();
  await k2bDialog.waitFor({ state: 'hidden' });
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
  await login(seed.workerEmail, seed.workerPassword, '/calendar');

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
  await page.getByRole('link', { name: '내 일정으로 돌아가기' }).first().waitFor();
  await page.getByText('허용 구간').first().waitFor();
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
  await login(seed.adminEmail, seed.adminPassword, '/admin?section=photos');
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
