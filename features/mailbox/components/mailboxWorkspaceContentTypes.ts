import type { ChangeEvent, KeyboardEvent, RefObject } from 'react';
import type { MailAccount, MailThread, MailThreadDetail } from '@/types/mail';
import type {
  ComposeAttachment,
  ComposeMode,
  ComposeState,
  MailSendProgressState,
  MailboxTab,
  MailboxView,
  RecipientSuggestionItem,
  SelectedReportContext,
} from './mailboxPanelTypes';

export interface MailboxWorkspaceContentProps {
  accountStateLoading: boolean;
  attachmentInputRef: RefObject<HTMLInputElement | null>;
  attachments: ComposeAttachment[];
  canGoNextThreadPage: boolean;
  canGoPrevThreadPage: boolean;
  compose: ComposeState;
  composeMode: ComposeMode;
  composerRef: RefObject<HTMLDivElement | null>;
  googleProviderStatusDetail: string;
  googleProviderStatusLabel: string;
  hasPersonalAccount: boolean;
  hasMultipleAccounts: boolean;
  isDemoMode: boolean;
  isSendingMail: boolean;
  mailSendProgress: MailSendProgressState | null;
  naverProviderStatusDetail: string;
  naverProviderStatusLabel: string;
  oauthProvider: 'google' | 'naver_mail' | null;
  recipientSuggestionIndex: number;
  recipientSuggestions: RecipientSuggestionItem[];
  recipientSuggestionsLoading: boolean;
  recipientSuggestionsOpen: boolean;
  selectedAccount: MailAccount | null;
  selectedAccountId: string;
  selectedReport: SelectedReportContext | null;
  selectableAccounts: MailAccount[];
  showMailboxConnectGate: boolean;
  tab: MailboxTab;
  threadDetail: MailThreadDetail | null;
  threadLoading: boolean;
  threadOffset: number;
  threadPage: number;
  threadPageCount: number;
  threadRangeEnd: number;
  threadRangeStart: number;
  threadTotal: number;
  threads: MailThread[];
  view: MailboxView;
  onAttachmentSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  onBackToList: () => void;
  onBlurRecipient: () => void;
  onChangeAccountId: (accountId: string) => void;
  onChangeRecipientInput: (value: string) => void;
  onChangeSubject: (value: string) => void;
  onClearSelectedReport: () => void;
  onComposerCommand: (command: string, value?: string) => void;
  onComposerInput: () => void;
  onComposerLink: () => void;
  onConnectGoogle: () => void;
  onConnectNaver: () => void;
  onFocusRecipient: () => void;
  onMoveThreadPage: (nextPage: number) => void;
  onOpenReportPicker: () => void;
  onOpenThread: (threadId: string) => void;
  onRecipientKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onRefreshAccountState: () => void;
  onRemoveAttachment: (attachmentId: string) => void;
  onRemoveRecipient: (email: string) => void;
  onReply: () => void;
  onSelectRecipientSuggestion: (suggestion: RecipientSuggestionItem) => void;
  onSend: () => void;
}
