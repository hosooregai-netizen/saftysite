import type { MailAccount, MailMessage, MailThread, MailThreadDetail } from '@/types/mail';

export type DemoMailboxTab = 'all' | 'inbox' | 'sent';

export const MAILBOX_DEMO_SESSION_KEY = 'mailbox-demo-mode';

const DEMO_ACCOUNT: MailAccount = {
  id: 'demo-mailbox-account',
  provider: 'naver_mail',
  scope: 'personal',
  connectionStatus: 'connected',
  email: 'demo@ksri-reg.ai',
  displayName: '대한안전산업연구원 데모',
  mailboxLabel: '대한안전산업연구원 데모 메일함',
  isActive: true,
  isDefault: true,
  userId: null,
  lastSyncedAt: '2026-04-09T09:30:00+09:00',
  metadata: {
    demo: true,
  },
  createdAt: '2026-04-01T09:00:00+09:00',
  updatedAt: '2026-04-09T09:30:00+09:00',
};

function buildMessage(input: {
  id: string;
  direction: MailMessage['direction'];
  subject: string;
  body: string;
  fromEmail: string;
  fromName?: string | null;
  to: MailMessage['to'];
  sentAt: string;
  reportKey?: string | null;
  siteId?: string | null;
  headquarterId?: string | null;
}): MailMessage {
  return {
    id: input.id,
    threadId: input.id.split(':')[0],
    accountId: DEMO_ACCOUNT.id,
    body: input.body,
    bodyPreview: input.body.replace(/<[^>]+>/g, ' ').trim(),
    createdAt: input.sentAt,
    deliveredAt: input.sentAt,
    direction: input.direction,
    fromEmail: input.fromEmail,
    fromName: input.fromName ?? null,
    headquarterId: input.headquarterId ?? null,
    readAt: input.sentAt,
    reportKey: input.reportKey ?? null,
    sentAt: input.sentAt,
    siteId: input.siteId ?? null,
    subject: input.subject,
    to: input.to,
    updatedAt: input.sentAt,
  };
}

function buildThread(input: {
  id: string;
  subject: string;
  snippet: string;
  participants: MailThread['participants'];
  reportKey?: string | null;
  siteId?: string | null;
  headquarterId?: string | null;
  lastMessageAt: string;
  unreadCount?: number;
  status?: MailThread['status'];
  lastDirection: MailThread['lastDirection'];
}): MailThread {
  return {
    id: input.id,
    accountDisplayName: DEMO_ACCOUNT.displayName,
    accountEmail: DEMO_ACCOUNT.email,
    accountId: DEMO_ACCOUNT.id,
    headquarterId: input.headquarterId ?? null,
    lastDirection: input.lastDirection,
    lastMessageAt: input.lastMessageAt,
    messageCount: 2,
    participants: input.participants,
    provider: DEMO_ACCOUNT.provider,
    reportKey: input.reportKey ?? null,
    scope: DEMO_ACCOUNT.scope,
    siteId: input.siteId ?? null,
    snippet: input.snippet,
    status: input.status ?? 'replied',
    subject: input.subject,
    unreadCount: input.unreadCount ?? 0,
  };
}

const inboxThreads: MailThread[] = [
  buildThread({
    id: 'demo-thread-1',
    subject: '[기술지도] 4월 1주차 점검 일정 확인',
    snippet: '4월 12일 오전 방문 일정으로 가능 여부를 확인 부탁드립니다.',
    participants: [
      { email: 'manager@demo-site.co.kr', name: '현장소장' },
      { email: DEMO_ACCOUNT.email, name: DEMO_ACCOUNT.displayName },
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
      { email: DEMO_ACCOUNT.email, name: DEMO_ACCOUNT.displayName },
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
      { email: DEMO_ACCOUNT.email, name: DEMO_ACCOUNT.displayName },
    ],
    siteId: 'site-demo-3',
    headquarterId: 'hq-demo-1',
    lastMessageAt: '2026-04-07T11:15:00+09:00',
    unreadCount: 2,
    lastDirection: 'incoming',
  }),
];

const sentThreads: MailThread[] = [
  buildThread({
    id: 'demo-thread-4',
    subject: '[발송 완료] 4월 기술지도 결과 보고',
    snippet: '첨부된 보고서를 확인 부탁드립니다.',
    participants: [
      { email: DEMO_ACCOUNT.email, name: DEMO_ACCOUNT.displayName },
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
      { email: DEMO_ACCOUNT.email, name: DEMO_ACCOUNT.displayName },
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

const threadDetails: Record<string, MailThreadDetail> = {
  'demo-thread-1': {
    thread: inboxThreads[0],
    messages: [
      buildMessage({
        id: 'demo-thread-1:msg-1',
        direction: 'incoming',
        subject: inboxThreads[0].subject,
        body: '<p>4월 12일 오전 방문 일정으로 가능 여부를 확인 부탁드립니다.</p>',
        fromEmail: 'manager@demo-site.co.kr',
        fromName: '현장소장',
        to: [{ email: DEMO_ACCOUNT.email, name: DEMO_ACCOUNT.displayName }],
        sentAt: '2026-04-09T08:40:00+09:00',
        reportKey: 'TG-2026-0409-01',
        siteId: 'site-demo-1',
        headquarterId: 'hq-demo-1',
      }),
      buildMessage({
        id: 'demo-thread-1:msg-2',
        direction: 'outgoing',
        subject: 'Re: [기술지도] 4월 1주차 점검 일정 확인',
        body: '<p>확인했습니다. 방문 일정과 세부 사유를 오늘 중 다시 공유드리겠습니다.</p>',
        fromEmail: DEMO_ACCOUNT.email,
        fromName: DEMO_ACCOUNT.displayName,
        to: [{ email: 'manager@demo-site.co.kr', name: '현장소장' }],
        sentAt: '2026-04-09T08:52:00+09:00',
        reportKey: 'TG-2026-0409-01',
        siteId: 'site-demo-1',
        headquarterId: 'hq-demo-1',
      }),
    ],
  },
  'demo-thread-2': {
    thread: inboxThreads[1],
    messages: [
      buildMessage({
        id: 'demo-thread-2:msg-1',
        direction: 'outgoing',
        subject: '[분기 보고서] 2026년 1분기 보고서 발송',
        body: '<p>2026년 1분기 보고서를 전달드립니다. 확인 부탁드립니다.</p>',
        fromEmail: DEMO_ACCOUNT.email,
        fromName: DEMO_ACCOUNT.displayName,
        to: [{ email: 'client@partner.co.kr', name: '발주처 담당자' }],
        sentAt: '2026-04-08T15:30:00+09:00',
        reportKey: 'QR-2026-Q1-03',
        siteId: 'site-demo-2',
        headquarterId: 'hq-demo-2',
      }),
      buildMessage({
        id: 'demo-thread-2:msg-2',
        direction: 'incoming',
        subject: '[보고서 수신 확인] 분기 보고서 전달',
        body: '<p>보고서 수신 확인드립니다. 추가 보완 요청 사항은 없습니다.</p>',
        fromEmail: 'client@partner.co.kr',
        fromName: '발주처 담당자',
        to: [{ email: DEMO_ACCOUNT.email, name: DEMO_ACCOUNT.displayName }],
        sentAt: '2026-04-08T16:10:00+09:00',
        reportKey: 'QR-2026-Q1-03',
        siteId: 'site-demo-2',
        headquarterId: 'hq-demo-2',
      }),
    ],
  },
  'demo-thread-3': {
    thread: inboxThreads[2],
    messages: [
      buildMessage({
        id: 'demo-thread-3:msg-1',
        direction: 'incoming',
        subject: inboxThreads[2].subject,
        body: '<p>야간 작업 일정으로 인해 교육 시간을 오후로 조정 요청드립니다.</p>',
        fromEmail: 'field@demo-site.co.kr',
        fromName: '현장 관리자',
        to: [{ email: DEMO_ACCOUNT.email, name: DEMO_ACCOUNT.displayName }],
        sentAt: '2026-04-07T11:15:00+09:00',
        siteId: 'site-demo-3',
        headquarterId: 'hq-demo-1',
      }),
    ],
  },
  'demo-thread-4': {
    thread: sentThreads[0],
    messages: [
      buildMessage({
        id: 'demo-thread-4:msg-1',
        direction: 'outgoing',
        subject: sentThreads[0].subject,
        body: '<p>첨부된 보고서를 확인 부탁드립니다. 현장 조치사항도 함께 정리했습니다.</p>',
        fromEmail: DEMO_ACCOUNT.email,
        fromName: DEMO_ACCOUNT.displayName,
        to: [{ email: 'partner@client.co.kr', name: '고객사 담당자' }],
        sentAt: '2026-04-06T17:30:00+09:00',
        reportKey: 'TG-2026-0402-07',
        siteId: 'site-demo-4',
        headquarterId: 'hq-demo-3',
      }),
    ],
  },
  'demo-thread-5': {
    thread: sentThreads[1],
    messages: [
      buildMessage({
        id: 'demo-thread-5:msg-1',
        direction: 'outgoing',
        subject: sentThreads[1].subject,
        body: '<p>주간 작업 구간과 야간 작업 구간 분리 기준을 전달드립니다.</p>',
        fromEmail: DEMO_ACCOUNT.email,
        fromName: DEMO_ACCOUNT.displayName,
        to: [{ email: 'planner@contract.co.kr', name: '공무 담당자' }],
        sentAt: '2026-04-05T09:00:00+09:00',
        siteId: 'site-demo-5',
        headquarterId: 'hq-demo-2',
      }),
    ],
  },
};

export function getDemoMailboxAccounts() {
  return [DEMO_ACCOUNT];
}

export function getDemoMailboxThreads(tab: DemoMailboxTab, query = '') {
  const normalizedQuery = query.trim().toLowerCase();
  const source =
    tab === 'sent' ? sentThreads : tab === 'inbox' ? inboxThreads : [...inboxThreads, ...sentThreads];
  if (!normalizedQuery) {
    return source;
  }
  return source.filter((thread) =>
    [
      thread.subject,
      thread.snippet,
      thread.reportKey || '',
      ...thread.participants.map((participant) => `${participant.name || ''} ${participant.email}`),
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery),
  );
}

export function getDemoMailboxThreadDetail(threadId: string) {
  return threadDetails[threadId] ?? null;
}
