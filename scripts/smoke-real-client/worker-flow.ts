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
  await page.getByRole('tab', { name: '달력으로 보기' }).waitFor();
  await page.getByRole('tab', { name: '목록으로 보기' }).waitFor();
  await page.getByText('회차별 일정 선택').first().waitFor();
  await dismissImportantModalIfPresent(page);
  const dialogOpenButton = page.getByRole('button', { name: '일정 지정' }).first();
  await dialogOpenButton.waitFor();
  await dialogOpenButton.click();
  const scheduleDialog = page.getByRole('dialog', { name: '방문 일정 선택' });
  await scheduleDialog.waitFor({ state: 'visible' });
  await scheduleDialog.getByLabel('방문 날짜').fill('2026-04-08');
  await scheduleDialog.getByLabel('변경 사유 기록').check();
  await scheduleDialog.getByLabel('사유 분류').fill('현장 요청');
  await scheduleDialog.getByLabel('상세 메모').fill('현장소장과 통화 후 방문일 확정');
  await scheduleDialog.getByRole('button', { name: '방문 일정 저장' }).click();
  await page.getByText(/회차 방문 일정과 사유를 저장했습니다\./).first().waitFor({ timeout: 30_000 });

  await page.getByRole('tab', { name: '목록으로 보기' }).click();
  await page.getByRole('heading', { name: '기술지도 일정 목록' }).waitFor();
  await page.getByRole('button', { name: '일정 수정' }).first().waitFor();

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
