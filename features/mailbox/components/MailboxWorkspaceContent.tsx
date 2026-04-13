'use client';

import { MailboxConnectWorkspace } from './MailboxConnectWorkspace';
import { MailboxComposeWorkspace } from './MailboxComposeWorkspace';
import { MailboxThreadWorkspace } from './MailboxThreadWorkspace';
import type { MailboxWorkspaceContentProps } from './mailboxWorkspaceContentTypes';

export function MailboxWorkspaceContent({
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
  hasPersonalAccount,
  hasMultipleAccounts,
  isDemoMode,
  isSendingMail,
  mailSendProgress,
  naverProviderStatusDetail,
  naverProviderStatusLabel,
  oauthProvider,
  recipientSuggestionIndex,
  recipientSuggestions,
  recipientSuggestionsLoading,
  recipientSuggestionsOpen,
  selectedAccount,
  selectedAccountId,
  selectedReport,
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
  onConnectNaver,
  onFocusRecipient,
  onMoveThreadPage,
  onOpenReportPicker,
  onOpenThread,
  onRecipientKeyDown,
  onRefreshAccountState,
  onRemoveAttachment,
  onRemoveRecipient,
  onReply,
  onSelectRecipientSuggestion,
  onSend,
}: MailboxWorkspaceContentProps) {
  const showMailboxConnectPrompt = !showMailboxConnectGate && !hasPersonalAccount;

  if (showMailboxConnectPrompt || showMailboxConnectGate) {
    return (
      <MailboxConnectWorkspace
        accountStateLoading={accountStateLoading}
        googleProviderStatusDetail={googleProviderStatusDetail}
        googleProviderStatusLabel={googleProviderStatusLabel}
        mode={showMailboxConnectGate ? 'gate' : 'prompt'}
        naverProviderStatusDetail={naverProviderStatusDetail}
        naverProviderStatusLabel={naverProviderStatusLabel}
        oauthProvider={oauthProvider}
        onConnectGoogle={onConnectGoogle}
        onConnectNaver={onConnectNaver}
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
        selectableAccounts={selectableAccounts}
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

  if (view === 'thread') {
    return (
      <MailboxThreadWorkspace
        canGoNextThreadPage={canGoNextThreadPage}
        canGoPrevThreadPage={canGoPrevThreadPage}
        selectedAccountEmail={selectedAccount?.email || ''}
        tab={tab}
        threadDetail={threadDetail}
        threadLoading={threadLoading}
        threadPage={threadPage}
        threadPageCount={threadPageCount}
        threadRangeEnd={threadRangeEnd}
        threadRangeStart={threadRangeStart}
        threadTotal={threadTotal}
        threads={threads}
        view={view}
        onBackToList={onBackToList}
        onMoveThreadPage={onMoveThreadPage}
        onOpenThread={onOpenThread}
        onReply={onReply}
      />
    );
  }

  return (
    <MailboxThreadWorkspace
      canGoNextThreadPage={canGoNextThreadPage}
      canGoPrevThreadPage={canGoPrevThreadPage}
      selectedAccountEmail={selectedAccount?.email || ''}
      tab={tab}
      threadDetail={threadDetail}
      threadLoading={threadLoading}
      threadPage={threadPage}
      threadPageCount={threadPageCount}
      threadRangeEnd={threadRangeEnd}
      threadRangeStart={threadRangeStart}
      threadTotal={threadTotal}
      threads={threads}
      view="list"
      onBackToList={onBackToList}
      onMoveThreadPage={onMoveThreadPage}
      onOpenThread={onOpenThread}
      onReply={onReply}
    />
  );
}
