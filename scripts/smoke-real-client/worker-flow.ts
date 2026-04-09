import type { Page } from 'playwright';

import { baseUrl, seed, uploadBuffer, uploadName } from './config';
import { dismissImportantModalIfPresent, waitHeading } from './helpers';

export interface WorkerFlowResult {
  afterCount: number;
  beforeCount: number;
  downloadName: string;
  previewSrc: string;
  uploadName: string;
}

export async function runWorkerFlow(page: Page): Promise<WorkerFlowResult> {
  await page.goto(`${baseUrl}/calendar`, { waitUntil: 'load' });
  await page.getByText('내 일정').first().waitFor();
  await page.getByText('회차별 일정 선택').first().waitFor();
  await dismissImportantModalIfPresent(page);
  await page.getByRole('button', { name: '이 날짜로 선택' }).first().waitFor();

  await page.goto(`${baseUrl}/mailbox`, { waitUntil: 'load' });
  await waitHeading(page, '메일함');
  await page.getByRole('button', { name: '연결 계정' }).click();
  await page.getByRole('button', { name: /구글 로그인으로 연결/ }).first().waitFor();

  await Promise.all([
    page.waitForResponse((response) => {
      return (
        response.url().includes('/api/photos') &&
        response.url().includes('all=true') &&
        response.ok()
      );
    }),
    page.goto(`${baseUrl}/sites/${seed.site1Id}/photos`, { waitUntil: 'load' }),
  ]);
  await page.getByText('현장 사진첩 - 테스트 현장 A').first().waitFor();
  const beforeCount = await page.locator('article').count();
  await page.locator('input[type="file"]').setInputFiles({
    buffer: uploadBuffer,
    mimeType: 'image/png',
    name: uploadName,
  });
  await page.getByText('1건의 사진을 업로드했습니다.').first().waitFor({ timeout: 30_000 });
  const uploadArticle = page.locator('article', { hasText: uploadName }).first();
  await uploadArticle.waitFor();
  const afterCount = await page.locator('article').count();
  const previewSrc = await uploadArticle.locator('img').getAttribute('src');
  if (!previewSrc || !/^https?:\/\//.test(previewSrc)) {
    throw new Error(`업로드 사진 미리보기 src가 잘못되었습니다: ${previewSrc}`);
  }

  await uploadArticle.getByRole('button', { name: '다운로드' }).click();
  await page.waitForTimeout(1_000);
  await page.goto(`${baseUrl}/sites/${seed.site2Id}/photos`, { waitUntil: 'load' });
  await page.getByText('해당 현장을 찾을 수 없습니다.').first().waitFor();
  return { afterCount, beforeCount, downloadName: uploadName, previewSrc, uploadName };
}
