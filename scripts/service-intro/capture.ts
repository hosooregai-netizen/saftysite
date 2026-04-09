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
        filter: blur(4px);
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
    {
      id: 'overview',
      title: '운영 대시보드',
      description: '실시간 운영 현황과 핵심 지표를 한 화면에서 확인합니다.',
      route: '/admin?section=overview',
      headline: '여러 현장과 보고서 현황을 한 화면에서 파악',
      subhead: '관리자와 의사결정자가 운영 상태를 빠르게 이해하고 다음 조치를 정할 수 있도록 구성한 메인 대시보드입니다.',
      highlights: ['전체 운영 현황 통합', '보고서 진행 상태 확인', '우선 대응 이슈 가시화'],
      impactSummary: '운영 현황 공유와 의사결정 속도를 높입니다.',
      layoutVariant: 'split',
    },
    {
      id: 'headquarters',
      title: '사업장·현장 관리',
      description: '사업장과 현장 상태를 같은 흐름에서 관리합니다.',
      route: '/admin?section=headquarters',
      headline: '분산된 사업장·현장 정보를 하나의 구조로 정리',
      subhead: '현장 운영, 담당자, 상태 정보를 연결해 데이터 정합성과 관리 일관성을 높이는 화면입니다.',
      highlights: ['사업장-현장 연결 관리', '현장 상태 및 기본정보 정리', '운영 대상 빠른 탐색'],
      impactSummary: '현장 데이터 정리와 변경 반영이 쉬워집니다.',
      layoutVariant: 'split',
    },
    {
      id: 'excel-upload',
      title: '엑셀 업로드',
      description: '현재 화면 컨텍스트 기준으로 업로드를 시작할 수 있습니다.',
      route: '/admin?section=headquarters&excelUpload=excel',
      headline: '기존 엑셀 자산을 안전하게 미리보기 후 반영',
      subhead: '업로드 전에 어떤 데이터가 포함되는지 확인하고, 필요한 범위만 검토해 반영할 수 있게 설계했습니다.',
      highlights: ['업로드 전 미리보기', '사업장/현장 컨텍스트 반영', '기존 운영 자산 재활용'],
      impactSummary: '반복 입력을 줄이고 데이터 반영 실수를 예방합니다.',
      layoutVariant: 'wide',
    },
    {
      id: 'reports',
      title: '기술지도 보고서',
      description: '현장별 보고서와 문서 출력을 빠르게 확인합니다.',
      route: siteId ? `/sites/${encodeURIComponent(siteId)}/reports` : '/admin?section=reports',
      headline: '현장 보고서 작성부터 출력까지 한 흐름으로 관리',
      subhead: '기술지도 보고서를 기준으로 작성, 저장, 출력, 품질 확인 흐름을 연결해 문서 표준화를 돕습니다.',
      highlights: ['보고서 작성/저장 일원화', 'HWPX/PDF 출력 지원', '리뷰·품질 체크 흐름 연결'],
      impactSummary: '문서 누락을 줄이고 산출물 품질을 일정하게 유지합니다.',
      layoutVariant: 'wide',
    },
    {
      id: 'quarterly',
      title: '분기 보고서',
      description: '분기 자료와 출력 흐름을 현장 단위로 관리합니다.',
      route: siteId ? `/sites/${encodeURIComponent(siteId)}/quarterly` : '/admin?section=reports',
      headline: '분기 단위 집계와 문서 생성 흐름을 표준화',
      subhead: '여러 회차 자료를 모아 분기 보고서로 연결하고, 출력과 발송 준비까지 한 화면에서 이어집니다.',
      highlights: ['분기 데이터 집계', '보고서 생성/출력 흐름', '발송 전 검토 준비'],
      impactSummary: '분기 보고서 작성과 공유에 드는 시간을 줄입니다.',
      layoutVariant: 'wide',
    },
    {
      id: 'mailbox',
      title: '메일·알림',
      description: '발송 계정과 메시지 흐름을 같은 화면에서 운영합니다.',
      route: '/admin?section=mailbox&box=inbox',
      headline: '발송 계정과 메시지 이력을 같은 화면에서 관리',
      subhead: '메일 연결, 수신/발신 확인, 보고서 관련 커뮤니케이션을 한 흐름으로 모아 운영 부담을 줄입니다.',
      highlights: ['메일 계정 연결 상태 확인', '수신·발신 이력 관리', '보고서 발송 흐름 연결'],
      impactSummary: '대외 커뮤니케이션 이력과 실행 상태를 더 쉽게 추적합니다.',
      layoutVariant: 'split',
    },
    {
      id: 'site-hub',
      title: '모바일·현장 흐름',
      description: '현장 허브에서 보고서와 현장 동선을 연결합니다.',
      route: siteId ? `/sites/${encodeURIComponent(siteId)}` : '/calendar',
      headline: '현장 실행과 본사 관리를 끊기지 않게 연결',
      subhead: '현장 허브를 중심으로 일정, 보고서, 사진, 보조 기능을 이어 현장 업무와 본사 확인을 하나로 묶습니다.',
      highlights: ['현장 허브 중심 동선', '모바일/현장 작업 연결', '본사-현장 협업 일관화'],
      impactSummary: '현장 입력과 본사 확인의 시간차를 줄입니다.',
      layoutVariant: 'split',
    },
  ];
  return items;
}

async function waitForPageReady(page: Page, id: string) {
  if (id === 'overview') await waitHeading(page, '관리 대시보드');
  if (id === 'headquarters') await waitHeading(page, '사업장/현장');
  if (id === 'excel-upload') await page.getByText('엑셀 업로드').first().waitFor();
  if (id === 'mailbox') await waitHeading(page, '메일함');
  if (id === 'reports') await page.waitForURL(/reports/);
  if (id === 'quarterly') await page.waitForURL(/quarterly|admin\?section=reports/);
  if (id === 'site-hub') await page.waitForLoadState('load');
  await dismissImportantModalIfPresent(page);
  await page.waitForLoadState('networkidle').catch(() => undefined);
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
