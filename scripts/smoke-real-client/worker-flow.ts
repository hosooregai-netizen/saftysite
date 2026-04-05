import type { Page } from 'playwright';

import { assistUploadName, baseUrl, seed, uploadBuffer, uploadName } from './config';
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

  const assistLink = page.locator('section', { hasText: '미선택 회차' }).getByRole('link', { name: '현장 보조' }).first();
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
  if (!signatureBox) throw new Error('현장 사인 캔버스를 찾지 못했습니다.');
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
  if (!previewSrc || !previewSrc.includes('127.0.0.1:8011')) {
    throw new Error(`업로드 사진 미리보기 src가 잘못되었습니다: ${previewSrc}`);
  }

  await uploadArticle.getByRole('button', { name: '다운로드' }).click();
  await page.waitForTimeout(1_000);
  await page.goto(`${baseUrl}/sites/${seed.site2Id}/photos`, { waitUntil: 'load' });
  await page.getByText('해당 현장을 찾을 수 없습니다.').first().waitFor();
  return { afterCount, beforeCount, downloadName: uploadName, previewSrc, uploadName };
}
