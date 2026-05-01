'use client';

import type { ChangeEvent, KeyboardEvent, RefObject } from 'react';
import type { MailAccount } from '@/types/mail';
import { MailboxComposeSection } from './MailboxComposeSection';
import {
  isLikelyEmail,
  stripHtmlToText,
} from './mailboxComposeHelpers';
import type {
  ComposeAttachment,
  ComposeMode,
  ComposeState,
  MailSendProgressState,
  RecipientSuggestionItem,
  SelectedReportContext,
} from './mailboxPanelTypes';

interface MailboxComposeWorkspaceProps {
  attachmentInputRef: RefObject<HTMLInputElement | null>;
  attachments: ComposeAttachment[];
  compose: ComposeState;
  composeMode: ComposeMode;
  composerRef: RefObject<HTMLDivElement | null>;
  hasMultipleAccounts: boolean;
  isDemoMode: boolean;
  isSendingMail: boolean;
  mailSendProgress: MailSendProgressState | null;
  recipientSuggestionIndex: number;
  recipientSuggestions: RecipientSuggestionItem[];
  recipientSuggestionsLoading: boolean;
  recipientSuggestionsOpen: boolean;
  selectedAccount: MailAccount | null;
  selectedAccountId: string;
  selectedReport: SelectedReportContext | null;
  selectedReports: SelectedReportContext[];
  selectableAccounts: MailAccount[];
  selectedTemplateId: string;
  onApplyTemplate: (templateId?: string) => void;
  onAttachmentSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlurRecipient: () => void;
  onChangeAccountId: (accountId: string) => void;
  onChangeRecipientInput: (value: string) => void;
  onChangeSubject: (value: string) => void;
  onClearSelectedReport: () => void;
  onComposerCommand: (command: string, value?: string) => void;
  onComposerInput: () => void;
  onComposerLink: () => void;
  onFocusRecipient: () => void;
  onOpenReportPicker: () => void;
  onRecipientKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onRemoveAttachment: (attachmentId: string) => void;
  onRemoveRecipient: (email: string) => void;
  onSelectRecipientSuggestion: (suggestion: RecipientSuggestionItem) => void;
  onSend: () => void;
}

export function MailboxComposeWorkspace({
  attachmentInputRef,
  attachments,
  compose,
  composeMode,
  composerRef,
  hasMultipleAccounts,
  isDemoMode,
  isSendingMail,
  mailSendProgress,
  recipientSuggestionIndex,
  recipientSuggestions,
  recipientSuggestionsLoading,
  recipientSuggestionsOpen,
  selectedAccount,
  selectedAccountId,
  selectedReport,
  selectedReports,
  selectableAccounts,
  selectedTemplateId,
  onApplyTemplate,
  onAttachmentSelect,
  onBlurRecipient,
  onChangeAccountId,
  onChangeRecipientInput,
  onChangeSubject,
  onClearSelectedReport,
  onComposerCommand,
  onComposerInput,
  onComposerLink,
  onFocusRecipient,
  onOpenReportPicker,
  onRecipientKeyDown,
  onRemoveAttachment,
  onRemoveRecipient,
  onSelectRecipientSuggestion,
  onSend,
}: MailboxComposeWorkspaceProps) {
  const reportItems = selectedReports.length > 0 ? selectedReports : selectedReport ? [selectedReport] : [];
  const composeTitle =
    composeMode === 'reply'
      ? '답장 작성'
      : composeMode === 'report'
        ? '보고서 메일 보내기'
        : '메일 보내기';

  return (
    <MailboxComposeSection
      attachmentInputRef={attachmentInputRef}
      attachments={attachments}
      compose={compose}
      composeMode={composeMode}
      composeTitle={composeTitle}
      composerRef={composerRef}
      hasMultipleAccounts={hasMultipleAccounts}
      isDemoMode={isDemoMode}
      isSendingMail={isSendingMail}
      mailSendProgress={mailSendProgress}
      recipientSuggestionIndex={recipientSuggestionIndex}
      recipientSuggestions={recipientSuggestions}
      recipientSuggestionsLoading={recipientSuggestionsLoading}
      recipientSuggestionsOpen={recipientSuggestionsOpen}
      selectedAccountId={selectedAccountId}
      selectableAccounts={selectableAccounts}
      selectedReport={selectedReport}
      selectedReports={selectedReports}
      selectedTemplateId={selectedTemplateId}
      submitDisabled={
        isDemoMode ||
        isSendingMail ||
        !selectedAccount ||
        (composeMode === 'report' && reportItems.length === 0) ||
        (compose.toRecipients.length === 0 && !isLikelyEmail(compose.toInput.trim())) ||
        !compose.subject.trim() ||
        !stripHtmlToText(compose.body).trim()
      }
      onApplyTemplate={onApplyTemplate}
      onAttachmentSelect={onAttachmentSelect}
      onBlurRecipient={onBlurRecipient}
      onChangeAccountId={onChangeAccountId}
      onChangeRecipientInput={onChangeRecipientInput}
      onChangeSubject={onChangeSubject}
      onClearSelectedReport={onClearSelectedReport}
      onComposerCommand={onComposerCommand}
      onComposerInput={onComposerInput}
      onComposerLink={onComposerLink}
      onFocusRecipient={onFocusRecipient}
      onOpenReportPicker={onOpenReportPicker}
      onRecipientKeyDown={onRecipientKeyDown}
      onRemoveAttachment={onRemoveAttachment}
      onRemoveRecipient={onRemoveRecipient}
      onSelectRecipientSuggestion={onSelectRecipientSuggestion}
      onSend={onSend}
    />
  );
}
