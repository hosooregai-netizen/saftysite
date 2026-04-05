import type { BrowserContext, Page } from 'playwright';

export interface LoginInput {
  baseUrl: string;
  email: string;
  entryPath: string;
  password: string;
}

export interface PageDiagnostics {
  consoleErrors: string[];
  failedResponses: string[];
  pageErrors: string[];
}

export function attachPageDiagnostics(page: Page): PageDiagnostics {
  const diagnostics: PageDiagnostics = {
    consoleErrors: [],
    failedResponses: [],
    pageErrors: [],
  };

  page.on('pageerror', (error) => diagnostics.pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      const text = message.text();
      if (!text.includes('favicon')) diagnostics.consoleErrors.push(text);
    }
  });
  page.on('response', (response) => {
    const url = response.url();
    const status = response.status();
    const relevant = url.includes('/api/') || url.includes('/photo-assets/') || url.includes(':8011/api/v1');
    if (!relevant || status < 400 || url.includes('favicon')) return;
    diagnostics.failedResponses.push(`${status} ${response.request().method()} ${url}`);
  });

  return diagnostics;
}

export function ensureNoDiagnostics(diagnostics: PageDiagnostics) {
  if (!diagnostics.pageErrors.length && !diagnostics.consoleErrors.length && !diagnostics.failedResponses.length) {
    return;
  }
  throw new Error(JSON.stringify(diagnostics, null, 2));
}

export async function login(page: Page, context: BrowserContext, input: LoginInput) {
  const { baseUrl, email, entryPath, password } = input;
  await page.goto(`${baseUrl}${entryPath}`, { waitUntil: 'load' });

  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');
  const logoutButton = page.getByRole('button', { name: '로그아웃' });

  try {
    await emailInput.waitFor({ state: 'visible', timeout: 3_000 });
  } catch {
    if ((await logoutButton.count()) > 0) {
      await logout(page, context);
      await page.goto(`${baseUrl}${entryPath}`, { waitUntil: 'load' });
    }
  }

  await emailInput.waitFor({ state: 'visible', timeout: 10_000 });
  await emailInput.fill(email);
  await passwordInput.fill(password);
  await page.getByRole('button', { name: /^로그인$/ }).click();
  await page.waitForFunction(() => Boolean(window.localStorage.getItem('safety-api-access-token')));
  await page.waitForTimeout(500);
}

export async function logout(page: Page, context: BrowserContext) {
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

export async function waitHeading(page: Page, name: string) {
  await page.getByRole('heading', { name }).first().waitFor();
}

export async function dismissImportantModalIfPresent(page: Page) {
  const modal = page.getByRole('dialog', { name: '중요 알림' });
  if ((await modal.count()) === 0) return;
  const closeButton = modal.getByRole('button', { name: '닫기' });
  if ((await closeButton.count()) === 0) return;
  await closeButton.click();
  await modal.waitFor({ state: 'hidden' });
}
