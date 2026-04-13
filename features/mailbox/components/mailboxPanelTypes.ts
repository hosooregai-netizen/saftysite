import type { SafetyReportListItem, SafetySite } from '@/types/backend';
import type { MailRecipientSuggestion } from '@/types/mail';

export type MailboxTab = 'all' | 'inbox' | 'sent';
export type MailboxView = 'list' | 'thread' | 'compose';
export type ComposeMode = 'new' | 'reply' | 'report';

export interface MailboxPanelProps {
  mode: 'admin' | 'worker';
  adminReports?: SafetyReportListItem[];
  adminSites?: SafetySite[];
}

export interface MailboxReportOption {
  documentKind: SafetyReportListItem['document_kind'] | null;
  headquarterId: string;
  headquarterName: string;
  meta: Record<string, unknown>;
  recipientEmail: string;
  reportKey: string;
  reportType: SafetyReportListItem['report_type'] | null;
  reportTitle: string;
  siteId: string;
  siteName: string;
  updatedAt: string | null;
  visitDate: string | null;
}

export type SelectedReportContext = MailboxReportOption;

export interface ComposeAttachment {
  file: File;
  id: string;
}

export interface ComposeState {
  body: string;
  subject: string;
  toInput: string;
  toRecipients: string[];
}

export interface MailSendProgressState {
  detail: string;
  percent: number;
  title: string;
}

export interface RecipientSuggestionItem extends MailRecipientSuggestion {
  label: string;
}

export interface MailboxSyncStatusSummary {
  description: string;
  title: string;
  tone: 'error' | 'progress' | 'ready';
}

export const THREAD_PAGE_SIZE = 50;
export const DEFAULT_SHARED_MAILBOX_EMAIL = 'safety-control@naverworks.local';
export const DEFAULT_SHARED_MAILBOX_NAME = '관제 공용 메일함';

export const MAILBOX_TAB_META: Record<MailboxTab, { empty: string; title: string }> = {
  all: {
    title: '전체 메일함',
    empty: '연결된 계정이나 검색 조건에 맞는 메일이 없습니다.',
  },
  inbox: {
    title: '받은편지함',
    empty: '연결된 계정이나 검색 조건에 맞는 받은 메일이 없습니다.',
  },
  sent: {
    title: '보낸편지함',
    empty: '연결된 계정이나 검색 조건에 맞는 발송 메일이 없습니다.',
  },
};
