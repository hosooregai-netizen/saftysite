import type { MailAccount } from '@/types/mail';

export const DEMO_MAILBOX_ACCOUNT: MailAccount = {
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
  metadata: { demo: true },
  createdAt: '2026-04-01T09:00:00+09:00',
  updatedAt: '2026-04-09T09:30:00+09:00',
};
