export type MailProvider = 'naver_works' | 'google' | 'naver_mail';
export type MailScope = 'shared' | 'personal';
export type MailConnectionStatus = 'connected' | 'pending' | 'error';
export type MailDirection = 'incoming' | 'outgoing';
export type MailThreadStatus = 'draft' | 'sent' | 'delivered' | 'read' | 'replied';

export interface MailRecipient {
  email: string;
  name: string | null;
}

export interface MailAccount {
  id: string;
  provider: MailProvider;
  scope: MailScope;
  connectionStatus: MailConnectionStatus;
  email: string;
  displayName: string;
  mailboxLabel: string;
  isActive: boolean;
  isDefault: boolean;
  userId: string | null;
  lastSyncedAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface MailThread {
  id: string;
  accountId: string;
  accountEmail: string;
  accountDisplayName: string;
  provider: MailProvider;
  scope: MailScope;
  subject: string;
  snippet: string;
  participants: MailRecipient[];
  reportKey: string | null;
  siteId: string | null;
  headquarterId: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  messageCount: number;
  status: MailThreadStatus;
  lastDirection: MailDirection | null;
}

export interface MailMessage {
  id: string;
  threadId: string;
  accountId: string;
  direction: MailDirection;
  subject: string;
  body: string;
  bodyPreview: string;
  fromEmail: string;
  fromName: string | null;
  to: MailRecipient[];
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  reportKey: string | null;
  siteId: string | null;
  headquarterId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MailThreadDetail {
  thread: MailThread;
  messages: MailMessage[];
}

export interface MailFeed {
  accounts: MailAccount[];
  threads: MailThread[];
}

export interface MailOAuthStartPayload {
  authorizationUrl: string;
  provider: MailProvider;
  state: string;
}

export interface MailProviderStatus {
  provider: MailProvider;
  enabled: boolean;
  defaultRedirectUri: string;
  allowedRedirectUris: string[];
  requestedRedirectUri: string;
  isRedirectAllowed: boolean;
  missingFields: string[];
  message: string;
}
