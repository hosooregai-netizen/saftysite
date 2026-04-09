import type { Page } from 'playwright';

import type { IntroCaptureItem } from './config';

type MailboxCaptureVariant = 'gate' | 'workspace';

export async function applyIntroMasking(page: Page) {
  await page.addStyleTag({
    content: `
      [data-mailbox-sensitive],
      [data-mask-sensitive],
      [class*="contactValue"],
      [class*="personValue"] {
        filter: blur(4px);
      }
    `,
  });
  await page.evaluate(`
    (() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const textNodes = [];
      while (walker.nextNode()) {
        const current = walker.currentNode;
        if (current instanceof Text) {
          textNodes.push(current);
        }
      }
      for (const node of textNodes) {
        const value = node.textContent || '';
        node.textContent = value
          .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}/gi, 'masked@example.com')
          .replace(/01[0-9][- ]?\\d{3,4}[- ]?\\d{4}/g, '010-****-****')
          .replace(/\\b\\d{2,4}[- ]?\\d{3,4}[- ]?\\d{4}\\b/g, '**-****-****');
      }
    })();
  `);
}

export async function prepareMailboxCapture(page: Page): Promise<MailboxCaptureVariant> {
  await page
    .waitForFunction(
      () => Boolean(document.querySelector('[data-mailbox-workspace], [data-mailbox-connect-gate]')),
      undefined,
      { timeout: 15_000 },
    )
    .catch(() => undefined);

  const workspace = page.locator('[data-mailbox-workspace]').first();
  try {
    await workspace.waitFor({ state: 'visible', timeout: 6000 });
    const threadRows = page.locator('[data-mailbox-thread-row]');
    if ((await threadRows.count()) > 0) {
      await threadRows.first().click().catch(() => undefined);
      await page.waitForTimeout(700);
    }
    return 'workspace';
  } catch {
    const gate = page.locator('[data-mailbox-connect-gate]').first();
    await gate.waitFor({ state: 'visible', timeout: 6000 }).catch(() => undefined);
    return 'gate';
  }
}

export function resolveMailboxCaptureItem(
  item: Omit<IntroCaptureItem, 'imagePath'>,
  variant: MailboxCaptureVariant,
): Omit<IntroCaptureItem, 'imagePath'> {
  if (variant === 'workspace') {
    return {
      ...item,
      headline: '수신·발신·보고서 커뮤니케이션을 한 화면에서 운영',
      subhead:
        '메일 리스트, 상세 스레드, 발송 동선을 분리해 실제 운영자가 메일 서비스처럼 빠르게 처리할 수 있도록 정리했습니다.',
      highlights: ['실시간 수신·발신 흐름 확인', '보고서 연결 이력 추적', '메일 작성·답장 워크플로우 일원화'],
      impactSummary: '대외 커뮤니케이션 흐름을 더 빠르고 선명하게 관리합니다.',
    };
  }

  return {
    ...item,
    headline: '메일 계정 연결부터 자연스럽게 시작하는 운영 게이트',
    subhead:
      '메일 계정이 아직 없는 상태에서는 로그인 게이트만 노출해, 불필요한 빈 화면 없이 바로 연결 상태를 점검하고 진입할 수 있습니다.',
    highlights: ['지메일·네이버 로그인 진입', '공급자 상태 즉시 진단', '실사용 전용 화면과 연결 게이트 분리'],
    impactSummary: '초기 계정 연결과 운영 진입 경험을 더 매끄럽게 만듭니다.',
  };
}
