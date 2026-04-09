import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, type Page } from 'playwright';

import {
  dismissImportantModalIfPresent,
  login,
  waitHeading,
} from '../smoke-real-client/helpers';
import {
  ensureOutputRoot,
  getBaseUrl,
  getIntroCredentials,
  getManifestPath,
  getOutputRoot,
  type IntroCaptureItem,
  type IntroManifest,
} from './config';

async function applyMasking(page: Page) {
  await page.addStyleTag({
    content: `
      tbody td, tbody th,
      [class*="table"] td, [class*="table"] th,
      [class*="detailValue"], [class*="person"], [class*="contact"] {
        filter: blur(7px);
      }
    `,
  });
  await page.evaluate(() => {
    const maskText = (value: string) =>
      value
        .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, 'masked@example.com')
        .replace(/01[0-9][- ]?\d{3,4}[- ]?\d{4}/g, '010-****-****')
        .replace(/\b\d{2,4}[- ]?\d{3,4}[- ]?\d{4}\b/g, '**-****-****');
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    while (walker.nextNode()) {
      const current = walker.currentNode;
      if (current instanceof Text) {
        textNodes.push(current);
      }
    }
    for (const node of textNodes) {
      node.textContent = maskText(node.textContent || '');
    }
  });
}

async function discoverFirstSiteId(page: Page, baseUrl: string): Promise<string | null> {
  return page.evaluate(async ({ targetBaseUrl }) => {
    const token = window.localStorage.getItem('safety-api-access-token');
    if (!token) return null;
    const response = await fetch(new URL('/api/safety/sites?limit=20', targetBaseUrl).toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as Array<{ id?: string }> | { items?: Array<{ id?: string }> };
    const items = Array.isArray(payload) ? payload : Array.isArray(payload.items) ? payload.items : [];
    const first = items.find((item) => typeof item.id === 'string' && item.id.trim());
    return first?.id?.trim() || null;
  }, { targetBaseUrl: baseUrl });
}

function buildCapturePlan(siteId: string | null): Array<Omit<IntroCaptureItem, 'imagePath'>> {
  const items: Array<Omit<IntroCaptureItem, 'imagePath'>> = [
    { id: 'overview', title: '운영 대시보드', description: '실시간 운영 현황과 핵심 지표를 한 화면에서 확인합니다.', route: '/admin?section=overview' },
    { id: 'headquarters', title: '사업장·현장 관리', description: '사업장과 현장 상태를 같은 흐름에서 관리합니다.', route: '/admin?section=headquarters' },
    { id: 'excel-upload', title: '엑셀 업로드', description: '현재 화면 컨텍스트 기준으로 업로드를 시작할 수 있습니다.', route: '/admin?section=headquarters&excelUpload=excel' },
    { id: 'reports', title: '기술지도 보고서', description: '현장별 보고서와 문서 출력을 빠르게 확인합니다.', route: siteId ? `/sites/${encodeURIComponent(siteId)}/reports` : '/admin?section=reports' },
    { id: 'quarterly', title: '분기 보고서', description: '분기 자료와 출력 흐름을 현장 단위로 관리합니다.', route: siteId ? `/sites/${encodeURIComponent(siteId)}/quarterly` : '/admin?section=reports' },
    { id: 'mailbox', title: '메일·알림', description: '발송 계정과 메시지 흐름을 같은 화면에서 운영합니다.', route: '/admin?section=mailbox&box=inbox' },
    { id: 'site-hub', title: '모바일·현장 흐름', description: '현장 허브에서 보고서와 현장 동선을 연결합니다.', route: siteId ? `/sites/${encodeURIComponent(siteId)}` : '/calendar' },
  ];
  return items;
}

async function waitForPageReady(page: Page, id: string) {
  if (id === 'overview') await waitHeading(page, '관리 대시보드');
  if (id === 'headquarters') await waitHeading(page, '사업장/현장');
  if (id === 'excel-upload') await page.getByText('엑셀 업로드').first().waitFor();
  if (id === 'mailbox') await waitHeading(page, '메일함');
  await dismissImportantModalIfPresent(page);
  await page.waitForTimeout(800);
}

export async function captureServiceIntroScreens(): Promise<IntroManifest> {
  await ensureOutputRoot();
  const baseUrl = getBaseUrl();
  const { email, password } = await getIntroCredentials();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await context.newPage();
  page.setDefaultTimeout(30_000);

  try {
    await login(page, context, {
      baseUrl,
      email,
      entryPath: '/admin?section=overview',
      password,
    });

    const siteId = (process.env.LIVE_SAFETY_SITE_ID?.trim() || '') || await discoverFirstSiteId(page, baseUrl);
    const captures: IntroCaptureItem[] = [];

    for (const item of buildCapturePlan(siteId || null)) {
      const imagePath = path.join(getOutputRoot(), `${item.id}.png`);
      await page.goto(new URL(item.route, baseUrl).toString(), { waitUntil: 'load' });
      await waitForPageReady(page, item.id);
      await applyMasking(page);
      await page.screenshot({ path: imagePath, fullPage: false });
      captures.push({ ...item, imagePath });
    }

    const manifest: IntroManifest = {
      generatedAt: new Date().toISOString(),
      baseUrl,
      items: captures,
    };
    await fs.writeFile(getManifestPath(), JSON.stringify(manifest, null, 2), 'utf8');
    return manifest;
  } finally {
    await browser.close();
  }
}
