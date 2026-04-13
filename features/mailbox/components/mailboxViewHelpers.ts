import type { MailThread } from '@/types/mail';
import { MAILBOX_DEMO_SESSION_KEY } from './demoMailboxData';
import type { MailboxTab } from './mailboxPanelTypes';

export function buildThreadCounterparty(thread: MailThread, accountEmail: string) {
  const others = thread.participants.filter((item) => item.email !== accountEmail);
  if (others.length === 0) {
    return thread.accountDisplayName || thread.accountEmail || '-';
  }
  const first = others[0];
  const firstLabel = first.name?.trim() || first.email;
  return others.length > 1 ? `${firstLabel} 외 ${others.length - 1}` : firstLabel;
}

export function deriveMailboxTab(rawBox: string | null): MailboxTab {
  if (rawBox === 'all') return 'all';
  if (rawBox === 'sent') return 'sent';
  return rawBox === 'inbox' ? 'inbox' : 'all';
}

export function deriveInitialComposeMode(input: {
  box: string | null;
  headquarterId: string;
  reportKey: string;
  siteId: string;
}) {
  return input.box === 'reports' || Boolean(input.reportKey || input.siteId || input.headquarterId)
    ? 'report'
    : 'new';
}

export function deriveInitialView(input: { box: string | null; threadId: string }) {
  if (input.box === 'reports') return 'compose' as const;
  if (input.threadId) return 'thread' as const;
  return 'list' as const;
}

export function persistDemoMailboxMode(nextValue: boolean) {
  if (typeof window === 'undefined') return;
  if (nextValue) {
    window.sessionStorage.setItem(MAILBOX_DEMO_SESSION_KEY, 'true');
    return;
  }
  window.sessionStorage.removeItem(MAILBOX_DEMO_SESSION_KEY);
}
