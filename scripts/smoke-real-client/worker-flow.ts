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
  await page.getByRole('button', { name: '이 일정으로 확정' }).first().waitFor();

  const unselectedCard = page
    .locator('section', { hasText: '미선택 회차' })
    .locator('article')
    .first();
  const dateInput = unselectedCard.locator('input[type="date"]').first();
  const visitDate = (await dateInput.getAttribute('min')) || '2026-04-03';
  await dateInput.fill(visitDate);
  await unselectedCard.getByPlaceholder('예: 현장 요청, 비상 작업').fill('현장 요청');
  await unselectedCard
    .getByPlaceholder('방문일을 정한 배경이나 협의 내용을 남겨 주세요.')
    .fill('현장소장과 통화 후 방문일 확정');
  await unselectedCard.getByRole('button', { name: '이 일정으로 확정' }).click();
  await page.getByText('회차 일정을 저장했습니다.').first().waitFor({ timeout: 30_000 });
  await page.goto(`${baseUrl}/mailbox`, { waitUntil: 'load' });
  await waitHeading(page, '메일함');
  const mailboxGate = page.locator('[data-mailbox-connect-gate]');
  const mailboxWorkspace = page.locator('[data-mailbox-workspace]');
  await Promise.race([
    mailboxGate.waitFor({ state: 'visible', timeout: 15_000 }),
    mailboxWorkspace.waitFor({ state: 'visible', timeout: 15_000 }),
  ]);
  if (await mailboxGate.isVisible()) {
    await page.getByRole('button', { name: '지메일 로그인' }).first().waitFor();
    await page.getByRole('button', { name: '네이버 로그인' }).first().waitFor();
  } else {
    await page.getByRole('button', { name: '새 메일 작성' }).first().waitFor();
  }

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
