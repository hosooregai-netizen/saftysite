import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { login } from './smoke-real-client/helpers';
import {
  ensureOutputDir,
  ensureParentDir,
  readNaverReviewConfig,
} from './naver-review/helpers';

async function capturePublicIntro(publicBaseUrl: string, outputDir: string) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1600 } });
  const introUrl = `${publicBaseUrl}/service-intro`;
  const pdfPath = join(outputDir, 'service-intro-review.pdf');
  const pngPath = join(outputDir, 'service-intro-review.png');

  await page.goto(introUrl, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: '대한안전산업연구원 RegAI' }).waitFor();
  await page.screenshot({ fullPage: true, path: pngPath });
  await ensureParentDir(pdfPath);
  await page.pdf({
    displayHeaderFooter: false,
    format: 'A4',
    margin: { top: '12mm', right: '12mm', bottom: '12mm', left: '12mm' },
    path: pdfPath,
    printBackground: true,
  });

  await browser.close();
  return { introUrl, pdfPath, pngPath };
}

async function captureNaverFlow(appBaseUrl: string, outputDir: string, email: string, password: string) {
  if (!email || !password) {
    return null;
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1440, height: 1200 },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30_000);

  await login(page, context, {
    baseUrl: appBaseUrl,
    email,
    entryPath: '/admin?section=mailbox&box=inbox',
    password,
  });

  await page.goto(`${appBaseUrl}/admin?section=mailbox&box=inbox`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => {
    return Boolean(
      document.querySelector('[data-mailbox-connect-gate="true"]') ||
        document.querySelector('[data-mailbox-connect-prompt="true"]'),
    );
  });
  const naverLoginButton = page.getByRole('button', { name: /네이버 로그인/ }).first();
  await naverLoginButton.waitFor({ timeout: 30_000, state: 'visible' });

  const buttonCapturePath = join(outputDir, '01-service-naver-button.png');
  await page.screenshot({ fullPage: true, path: buttonCapturePath });

  const authCapturePath = join(outputDir, '02-naver-auth-screen.png');
  try {
    await Promise.all([
      page.waitForURL(/nid\.naver\.com|auth\.naver\.com/, { timeout: 30_000 }),
      naverLoginButton.click(),
    ]);
    await page.screenshot({ fullPage: true, path: authCapturePath });
  } catch (error) {
    await page.screenshot({ fullPage: true, path: authCapturePath });
    await browser.close();
    return {
      authCapturePath,
      buttonCapturePath,
      loginError: error instanceof Error ? error.message : '네이버 로그인 화면으로 이동하지 못했습니다.',
    };
  }
  await browser.close();

  return { authCapturePath, buttonCapturePath, loginError: null };
}

async function writeSubmissionNote(outputDir: string, input: {
  introUrl: string;
  hasLoginCaptures: boolean;
  loginError?: string | null;
}) {
  const notePath = join(outputDir, 'submission-note.txt');
  const lines = [
    '대한안전산업연구원 RegAI 네이버 로그인 재검수 제출 메모',
    '',
    `공개 소개 URL: ${input.introUrl}`,
    '첨부 자료:',
    '- service-intro-review.pdf',
    '- service-intro-review.png',
  ];

  if (input.hasLoginCaptures) {
    lines.push('- 01-service-naver-button.png');
    lines.push('- 02-naver-auth-screen.png');
  } else {
    lines.push('- 네이버 로그인 캡처는 일부 또는 전체를 생성하지 못했습니다.');
  }

  if (input.loginError) {
    lines.push('');
    lines.push(`로그인 캡처 생성 중 확인된 오류: ${input.loginError}`);
  }

  lines.push('');
  lines.push('주의: 네이버 로그인 완료 이후 추가 단계(동의 완료, 서비스 복귀, 연결 완료 화면)는');
  lines.push('테스터 네이버 계정이 준비된 상태에서 추가 캡처해 제출해 주세요.');

  await writeFile(notePath, `${lines.join('\n')}\n`, 'utf8');
}

async function main() {
  const config = readNaverReviewConfig();
  await ensureOutputDir(config.outputDir);

  const publicResult = await capturePublicIntro(config.publicBaseUrl, config.outputDir);
  let loginError: string | null = null;
  let naverResult: Awaited<ReturnType<typeof captureNaverFlow>> = null;

  try {
    naverResult = await captureNaverFlow(
      config.appBaseUrl,
      config.outputDir,
      config.serviceEmail,
      config.password,
    );
  } catch (error) {
    loginError = error instanceof Error ? error.message : '네이버 로그인 캡처를 생성하지 못했습니다.';
  }
  loginError = loginError || naverResult?.loginError || null;

  await writeSubmissionNote(config.outputDir, {
    hasLoginCaptures: Boolean(naverResult?.buttonCapturePath),
    introUrl: publicResult.introUrl,
    loginError,
  });

  console.log(
    JSON.stringify(
      {
        captures: {
        auth: naverResult?.authCapturePath || null,
        button: naverResult?.buttonCapturePath || null,
        introPdf: publicResult.pdfPath,
        introPng: publicResult.pngPath,
        loginError,
      },
        outputDir: config.outputDir,
        status: 'ok',
      },
      null,
      2,
    ),
  );
}

void main();
