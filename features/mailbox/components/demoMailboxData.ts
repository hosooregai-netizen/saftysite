import { DEMO_MAILBOX_ACCOUNT } from './demoMailboxFixtures';
import { DEMO_THREAD_DETAILS } from './demoMailboxThreadDetails';
import { DEMO_INBOX_THREADS, DEMO_SENT_THREADS } from './demoMailboxThreadFixtures';

export type DemoMailboxTab = 'all' | 'inbox' | 'sent';

export const MAILBOX_DEMO_SESSION_KEY = 'mailbox-demo-mode';

export function getDemoMailboxAccounts() {
  return [DEMO_MAILBOX_ACCOUNT];
}

export function getDemoMailboxThreads(tab: DemoMailboxTab, query = '') {
  const normalizedQuery = query.trim().toLowerCase();
  const source =
    tab === 'sent'
      ? DEMO_SENT_THREADS
      : tab === 'inbox'
        ? DEMO_INBOX_THREADS
        : [...DEMO_INBOX_THREADS, ...DEMO_SENT_THREADS];
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
  return DEMO_THREAD_DETAILS[threadId] ?? null;
}
