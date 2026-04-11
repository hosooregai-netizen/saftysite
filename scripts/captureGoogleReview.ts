import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { chromium } from 'playwright';
import { login } from './smoke-real-client/helpers';
import { ensureOutputDir, readGoogleReviewConfig } from './google-review/helpers';

async function waitForEnter(message: string) {
  const rl = createInterface({ input, output });
  try {
    await rl.question(`${message}\n완료 후 Enter를 눌러주세요: `);
  } finally {
    rl.close();
  }
}

async function capturePublicPages(publicBaseUrl: string, outputDir: string) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } });
  const pages = [
    { name: '01-homepage.png', url: `${publicBaseUrl}/service-intro`, heading: '한국종합안전 업무시스템' },
    { name: '02-privacy.png', url: `${publicBaseUrl}/privacy`, heading: '개인정보처리방침' },
    { name: '03-terms.png', url: `${publicBaseUrl}/terms`, heading: '이용약관' },
  ];

  for (const item of pages) {
    await page.goto(item.url, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: item.heading }).first().waitFor();
    await page.screenshot({ fullPage: true, path: join(outputDir, item.name) });
  }

  await browser.close();
}

async function captureGoogleFlow(config: ReturnType<typeof readGoogleReviewConfig>) {
  if (!config.serviceEmail || !config.password) {
    throw new Error('GOOGLE_REVIEW_SERVICE_EMAIL / GOOGLE_REVIEW_SERVICE_PASSWORD 가 필요합니다.');
  }

  const browser = await chromium.launch({ headless: config.headless });
  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1440, height: 1000 },
    recordVideo: { dir: config.outputDir, size: { width: 1440, height: 1000 } },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30_000);

  try {
    await login(page, context, {
      baseUrl: config.appBaseUrl,
      email: config.serviceEmail,
      entryPath: '/admin?section=mailbox&box=inbox',
      password: config.password,
    });

    await page.goto(`${config.appBaseUrl}/admin?section=mailbox&box=inbox`, {
      waitUntil: 'networkidle',
    });
    await page.getByRole('heading', { name: '메일함' }).first().waitFor();
    await page.screenshot({ fullPage: true, path: join(config.outputDir, '04-mailbox.png') });

    const googleButton = page.getByRole('button', { name: /지메일 로그인/ }).first();
    await googleButton.waitFor({ state: 'visible' });
    await page.screenshot({ fullPage: true, path: join(config.outputDir, '05-google-login-button.png') });

    await Promise.all([
      page.waitForURL(/accounts\.google\.com/, { timeout: 30_000 }),
      googleButton.click(),
    ]);
    await page.screenshot({ fullPage: true, path: join(config.outputDir, '06-google-consent-start.png') });

    if (!config.headless) {
      await waitForEnter('Google OAuth 화면에서 계정 선택과 동의를 직접 완료해 주세요.');
      await page.goto(`${config.appBaseUrl}/admin?section=mailbox&box=inbox`, {
        waitUntil: 'networkidle',
      });
      await page.screenshot({ fullPage: true, path: join(config.outputDir, '07-mailbox-after-connect.png') });

      const threadRows = page.locator('[data-mailbox-thread-row]');
      if ((await threadRows.count()) > 0) {
        await threadRows.first().click().catch(() => undefined);
        await page.waitForTimeout(800);
        await page.screenshot({ fullPage: true, path: join(config.outputDir, '08-mail-thread-detail.png') });
      }
    }

    await context.close();
    const videoPath = await page.video()?.path();
    return videoPath || null;
  } finally {
    await browser.close();
  }
}

async function writeGuide(outputDir: string, videoPath: string | null) {
  const notePath = join(outputDir, 'google-review-note.txt');
  const lines = [
    'Google OAuth Verification Capture',
    '',
    'Console URLs:',
    '- Home: https://saftysite-seven.vercel.app/service-intro',
    '- Privacy: https://saftysite-seven.vercel.app/privacy',
    '- Terms: https://saftysite-seven.vercel.app/terms',
    '- Redirect: https://saftysite-seven.vercel.app/mail/connect/google',
    '',
    'Generated files:',
    '- 01-homepage.png',
    '- 02-privacy.png',
    '- 03-terms.png',
    '- 04-mailbox.png',
    '- 05-google-login-button.png',
    '- 06-google-consent-start.png',
    '- 07-mailbox-after-connect.png (if manual OAuth completed)',
    '- 08-mail-thread-detail.png (if inbox rows exist)',
    `- video: ${videoPath || 'not captured'}`,
    '',
    'Recommended upload target: YouTube unlisted or Google Drive accessible link.',
  ];
  await writeFile(notePath, `${lines.join('\n')}\n`, 'utf8');
}

async function main() {
  const config = readGoogleReviewConfig();
  await ensureOutputDir(config.outputDir);
  await capturePublicPages(config.publicBaseUrl, config.outputDir);
  const videoPath = await captureGoogleFlow(config);
  await writeGuide(config.outputDir, videoPath);
  console.log(JSON.stringify({ outputDir: config.outputDir, status: 'ok', videoPath }, null, 2));
}

void main();
