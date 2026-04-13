import type { MailMessage, MailThreadDetail } from '@/types/mail';
import { DEMO_MAILBOX_ACCOUNT } from './demoMailboxFixtures';
import { DEMO_INBOX_THREADS, DEMO_SENT_THREADS } from './demoMailboxThreadFixtures';

function buildMessage(input: {
  body: string;
  direction: MailMessage['direction'];
  fromEmail: string;
  fromName?: string | null;
  headquarterId?: string | null;
  id: string;
  reportKey?: string | null;
  sentAt: string;
  siteId?: string | null;
  subject: string;
  to: MailMessage['to'];
}): MailMessage {
  return {
    id: input.id,
    threadId: input.id.split(':')[0],
    accountId: DEMO_MAILBOX_ACCOUNT.id,
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

export const DEMO_THREAD_DETAILS: Record<string, MailThreadDetail> = {
  'demo-thread-1': {
    thread: DEMO_INBOX_THREADS[0],
    messages: [
      buildMessage({
        id: 'demo-thread-1:msg-1',
        direction: 'incoming',
        subject: DEMO_INBOX_THREADS[0].subject,
        body: '<p>4월 12일 오전 방문 일정으로 가능 여부를 확인 부탁드립니다.</p>',
        fromEmail: 'manager@demo-site.co.kr',
        fromName: '현장소장',
        to: [{ email: DEMO_MAILBOX_ACCOUNT.email, name: DEMO_MAILBOX_ACCOUNT.displayName }],
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
        fromEmail: DEMO_MAILBOX_ACCOUNT.email,
        fromName: DEMO_MAILBOX_ACCOUNT.displayName,
        to: [{ email: 'manager@demo-site.co.kr', name: '현장소장' }],
        sentAt: '2026-04-09T08:52:00+09:00',
        reportKey: 'TG-2026-0409-01',
        siteId: 'site-demo-1',
        headquarterId: 'hq-demo-1',
      }),
    ],
  },
  'demo-thread-2': {
    thread: DEMO_INBOX_THREADS[1],
    messages: [
      buildMessage({
        id: 'demo-thread-2:msg-1',
        direction: 'outgoing',
        subject: '[분기 보고서] 2026년 1분기 보고서 발송',
        body: '<p>2026년 1분기 보고서를 전달드립니다. 확인 부탁드립니다.</p>',
        fromEmail: DEMO_MAILBOX_ACCOUNT.email,
        fromName: DEMO_MAILBOX_ACCOUNT.displayName,
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
        to: [{ email: DEMO_MAILBOX_ACCOUNT.email, name: DEMO_MAILBOX_ACCOUNT.displayName }],
        sentAt: '2026-04-08T16:10:00+09:00',
        reportKey: 'QR-2026-Q1-03',
        siteId: 'site-demo-2',
        headquarterId: 'hq-demo-2',
      }),
    ],
  },
  'demo-thread-3': {
    thread: DEMO_INBOX_THREADS[2],
    messages: [
      buildMessage({
        id: 'demo-thread-3:msg-1',
        direction: 'incoming',
        subject: DEMO_INBOX_THREADS[2].subject,
        body: '<p>야간 작업 일정으로 인해 교육 시간을 오후로 조정 요청드립니다.</p>',
        fromEmail: 'field@demo-site.co.kr',
        fromName: '현장 관리자',
        to: [{ email: DEMO_MAILBOX_ACCOUNT.email, name: DEMO_MAILBOX_ACCOUNT.displayName }],
        sentAt: '2026-04-07T11:15:00+09:00',
        siteId: 'site-demo-3',
        headquarterId: 'hq-demo-1',
      }),
    ],
  },
  'demo-thread-4': {
    thread: DEMO_SENT_THREADS[0],
    messages: [
      buildMessage({
        id: 'demo-thread-4:msg-1',
        direction: 'outgoing',
        subject: DEMO_SENT_THREADS[0].subject,
        body: '<p>첨부된 보고서를 확인 부탁드립니다. 현장 조치사항도 함께 정리했습니다.</p>',
        fromEmail: DEMO_MAILBOX_ACCOUNT.email,
        fromName: DEMO_MAILBOX_ACCOUNT.displayName,
        to: [{ email: 'partner@client.co.kr', name: '고객사 담당자' }],
        sentAt: '2026-04-06T17:30:00+09:00',
        reportKey: 'TG-2026-0402-07',
        siteId: 'site-demo-4',
        headquarterId: 'hq-demo-3',
      }),
    ],
  },
  'demo-thread-5': {
    thread: DEMO_SENT_THREADS[1],
    messages: [
      buildMessage({
        id: 'demo-thread-5:msg-1',
        direction: 'outgoing',
        subject: DEMO_SENT_THREADS[1].subject,
        body: '<p>주간 작업 구간과 야간 작업 구간 분리 기준을 전달드립니다.</p>',
        fromEmail: DEMO_MAILBOX_ACCOUNT.email,
        fromName: DEMO_MAILBOX_ACCOUNT.displayName,
        to: [{ email: 'planner@contract.co.kr', name: '공무 담당자' }],
        sentAt: '2026-04-05T09:00:00+09:00',
        siteId: 'site-demo-5',
        headquarterId: 'hq-demo-2',
      }),
    ],
  },
};
