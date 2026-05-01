'use client';

import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import { MailboxConnectWorkspace } from './MailboxConnectWorkspace';
import { MailboxComposeWorkspace } from './MailboxComposeWorkspace';
import { MailboxThreadWorkspace } from './MailboxThreadWorkspace';
import type { MailboxWorkspaceContentProps } from './mailboxWorkspaceContentTypes';

export function MailboxWorkspaceContent({
  accountStateReady,
  accountStateLoading,
  attachments,
  attachmentInputRef,
  canGoNextThreadPage,
  canGoPrevThreadPage,
  compose,
  composeMode,
  composerRef,
  googleProviderStatusDetail,
  googleProviderStatusLabel,
  googleProviderStatusTone,
  hasPersonalAccount,
  hasMultipleAccounts,
  isDemoMode,
  isSendingMail,
  mailSendProgress,
  naverWorksProviderStatusDetail,
  naverWorksProviderStatusLabel,
  naverWorksProviderStatusTone,
  oauthProvider,
  recipientSuggestionIndex,
  recipientSuggestions,
  recipientSuggestionsLoading,
  recipientSuggestionsOpen,
  selectedAccount,
  selectedAccountId,
  selectedReport,
  selectedReports,
  selectedTemplateId,
  selectableAccounts,
  showMailboxConnectGate,
  tab,
  threadDetail,
  threadLoading,
  threadPage,
  threadPageCount,
  threadRangeEnd,
  threadRangeStart,
  threadTotal,
  threads,
  view,
  onApplyTemplate,
  onAttachmentSelect,
  onBackToList,
  onBlurRecipient,
  onChangeAccountId,
  onChangeRecipientInput,
  onChangeSubject,
  onClearSelectedReport,
  onComposerCommand,
  onComposerInput,
  onComposerLink,
  onConnectGoogle,
  onConnectNaverWorks,
  onFocusRecipient,
  onForward,
  onMoveThreadPage,
  onOpenReportPicker,
  onOpenThread,
  onRecipientKeyDown,
  onRefreshAccountState,
  onRemoveAttachment,
  onRemoveRecipient,
  onReply,
  onResend,
  onSelectRecipientSuggestion,
  onSend,
}: MailboxWorkspaceContentProps) {
  if (!isDemoMode && !accountStateReady) {
    return (
      <div className={styles.tableShell}>
        <div className={styles.tableEmpty}>메일함을 불러오는 중입니다.</div>
      </div>
    );
  }

  const showMailboxConnectPrompt = !showMailboxConnectGate && !hasPersonalAccount;

  if (showMailboxConnectPrompt || showMailboxConnectGate) {
    return (
      <MailboxConnectWorkspace
        accountStateLoading={accountStateLoading}
        googleProviderStatusDetail={googleProviderStatusDetail}
        googleProviderStatusLabel={googleProviderStatusLabel}
        googleProviderStatusTone={googleProviderStatusTone}
        mode={showMailboxConnectGate ? 'gate' : 'prompt'}
        naverWorksProviderStatusDetail={naverWorksProviderStatusDetail}
        naverWorksProviderStatusLabel={naverWorksProviderStatusLabel}
        naverWorksProviderStatusTone={naverWorksProviderStatusTone}
        oauthProvider={oauthProvider}
        onConnectGoogle={onConnectGoogle}
        onConnectNaverWorks={onConnectNaverWorks}
        onRefreshAccountState={onRefreshAccountState}
      />
    );
  }

  if (view === 'compose') {
    return (
      <MailboxComposeWorkspace
        attachmentInputRef={attachmentInputRef}
        attachments={attachments}
        compose={compose}
        composeMode={composeMode}
        composerRef={composerRef}
        hasMultipleAccounts={hasMultipleAccounts}
        isDemoMode={isDemoMode}
        isSendingMail={isSendingMail}
        mailSendProgress={mailSendProgress}
        recipientSuggestionIndex={recipientSuggestionIndex}
        recipientSuggestions={recipientSuggestions}
        recipientSuggestionsLoading={recipientSuggestionsLoading}
        recipientSuggestionsOpen={recipientSuggestionsOpen}
        selectedAccount={selectedAccount}
        selectedAccountId={selectedAccountId}
        selectedReport={selectedReport}
        selectedReports={selectedReports}
        selectableAccounts={selectableAccounts}
        selectedTemplateId={selectedTemplateId}
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

  const threadWorkspaceProps = {
    canGoNextThreadPage,
    canGoPrevThreadPage,
    selectedAccountEmail: selectedAccount?.email || '',
    tab,
    threadDetail,
    threadLoading,
    threadPage,
    threadPageCount,
    threadRangeEnd,
    threadRangeStart,
    threadTotal,
    threads,
    onBackToList,
    onForward,
    onMoveThreadPage,
    onOpenThread,
    onReply,
    onResend,
  };

  if (view === 'thread') {
    return <MailboxThreadWorkspace {...threadWorkspaceProps} view={view} />;
  }

  return <MailboxThreadWorkspace {...threadWorkspaceProps} view="list" />;
}
