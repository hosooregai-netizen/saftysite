import type { MailThread } from '@/types/mail';
import { DEMO_MAILBOX_ACCOUNT } from './demoMailboxFixtures';

function buildThread(input: {
  headquarterId?: string | null;
  id: string;
  lastDirection: MailThread['lastDirection'];
  lastMessageAt: string;
  participants: MailThread['participants'];
  reportKey?: string | null;
  siteId?: string | null;
  snippet: string;
  status?: MailThread['status'];
  subject: string;
  unreadCount?: number;
}): MailThread {
  return {
    id: input.id,
    accountDisplayName: DEMO_MAILBOX_ACCOUNT.displayName,
    accountEmail: DEMO_MAILBOX_ACCOUNT.email,
    accountId: DEMO_MAILBOX_ACCOUNT.id,
    headquarterId: input.headquarterId ?? null,
    lastDirection: input.lastDirection,
    lastMessageAt: input.lastMessageAt,
    messageCount: 2,
    participants: input.participants,
    provider: DEMO_MAILBOX_ACCOUNT.provider,
    reportKey: input.reportKey ?? null,
    scope: DEMO_MAILBOX_ACCOUNT.scope,
    siteId: input.siteId ?? null,
    snippet: input.snippet,
    status: input.status ?? 'replied',
    subject: input.subject,
    unreadCount: input.unreadCount ?? 0,
  };
}

export const DEMO_INBOX_THREADS: MailThread[] = [
  buildThread({
    id: 'demo-thread-1',
    subject: '[기술지도] 4월 1주차 점검 일정 확인',
    snippet: '4월 12일 오전 방문 일정으로 가능 여부를 확인 부탁드립니다.',
    participants: [
      { email: 'manager@demo-site.co.kr', name: '현장소장' },
      { email: DEMO_MAILBOX_ACCOUNT.email, name: DEMO_MAILBOX_ACCOUNT.displayName },
    ],
    reportKey: 'TG-2026-0409-01',
    siteId: 'site-demo-1',
    headquarterId: 'hq-demo-1',
    lastMessageAt: '2026-04-09T08:40:00+09:00',
    unreadCount: 1,
    lastDirection: 'incoming',
  }),
  buildThread({
    id: 'demo-thread-2',
    subject: '[보고서 수신 확인] 분기 보고서 전달',
    snippet: '보고서 수신 확인드립니다. 추가 보완 요청 사항은 없습니다.',
    participants: [
      { email: 'client@partner.co.kr', name: '발주처 담당자' },
      { email: DEMO_MAILBOX_ACCOUNT.email, name: DEMO_MAILBOX_ACCOUNT.displayName },
    ],
    reportKey: 'QR-2026-Q1-03',
    siteId: 'site-demo-2',
    headquarterId: 'hq-demo-2',
    lastMessageAt: '2026-04-08T16:10:00+09:00',
    unreadCount: 0,
    lastDirection: 'incoming',
  }),
  buildThread({
    id: 'demo-thread-3',
    subject: '안전교육 일정 조정 요청',
    snippet: '야간 작업 일정으로 인해 교육 시간을 오후로 조정 요청드립니다.',
    participants: [
      { email: 'field@demo-site.co.kr', name: '현장 관리자' },
      { email: DEMO_MAILBOX_ACCOUNT.email, name: DEMO_MAILBOX_ACCOUNT.displayName },
    ],
    siteId: 'site-demo-3',
    headquarterId: 'hq-demo-1',
    lastMessageAt: '2026-04-07T11:15:00+09:00',
    unreadCount: 2,
    lastDirection: 'incoming',
  }),
];

export const DEMO_SENT_THREADS: MailThread[] = [
  buildThread({
    id: 'demo-thread-4',
    subject: '[발송 완료] 4월 기술지도 결과 보고',
    snippet: '첨부된 보고서를 확인 부탁드립니다.',
    participants: [
      { email: DEMO_MAILBOX_ACCOUNT.email, name: DEMO_MAILBOX_ACCOUNT.displayName },
      { email: 'partner@client.co.kr', name: '고객사 담당자' },
    ],
    reportKey: 'TG-2026-0402-07',
    siteId: 'site-demo-4',
    headquarterId: 'hq-demo-3',
    lastMessageAt: '2026-04-06T17:30:00+09:00',
    unreadCount: 0,
    lastDirection: 'outgoing',
    status: 'sent',
  }),
  buildThread({
    id: 'demo-thread-5',
    subject: '[계약 확인] 주간/야간 작업 계획 공유',
    snippet: '주간 작업 구간과 야간 작업 구간 분리 기준을 전달드립니다.',
    participants: [
      { email: DEMO_MAILBOX_ACCOUNT.email, name: DEMO_MAILBOX_ACCOUNT.displayName },
      { email: 'planner@contract.co.kr', name: '공무 담당자' },
    ],
    siteId: 'site-demo-5',
    headquarterId: 'hq-demo-2',
    lastMessageAt: '2026-04-05T09:00:00+09:00',
    unreadCount: 0,
    lastDirection: 'outgoing',
    status: 'delivered',
  }),
];
