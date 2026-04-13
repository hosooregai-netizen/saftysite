'use client';

import { useMemo } from 'react';
import type { MailboxPanelProps } from './mailboxPanelTypes';
import { useMailboxAccountState } from './useMailboxAccountState';
import { useMailboxComposeState } from './useMailboxComposeState';
import { useMailboxPanelActions } from './useMailboxPanelActions';
import { useMailboxPanelUiState } from './useMailboxPanelUiState';
import { useMailboxRecipientSuggestions } from './useMailboxRecipientSuggestions';
import { useMailboxReportState } from './useMailboxReportState';
import { useMailboxRoutingState } from './useMailboxRoutingState';
import { useMailboxThreadState } from './useMailboxThreadState';

type AccountState = ReturnType<typeof useMailboxAccountState>;
type Actions = ReturnType<typeof useMailboxPanelActions>;
type ComposeState = ReturnType<typeof useMailboxComposeState>;
type PanelUiState = ReturnType<typeof useMailboxPanelUiState>;
type RecipientSuggestionState = ReturnType<typeof useMailboxRecipientSuggestions>;
type ReportState = ReturnType<typeof useMailboxReportState>;
type RoutingState = ReturnType<typeof useMailboxRoutingState>;
type ThreadState = ReturnType<typeof useMailboxThreadState>;

interface UseMailboxPanelLayoutPropsParams {
  accountState: AccountState;
  actions: Actions;
  adminSites: MailboxPanelProps['adminSites'];
  composeState: ComposeState;
  currentView: 'list' | 'thread' | 'compose';
  mode: 'admin' | 'worker';
  recipientSuggestionState: RecipientSuggestionState;
  reportState: ReportState;
  routing: RoutingState;
  showMailboxConnectGate: boolean;
  threadState: ThreadState;
  uiState: PanelUiState;
}

export function useMailboxPanelLayoutProps({
  accountState,
  actions,
  adminSites,
  composeState,
  currentView,
  mode,
  recipientSuggestionState,
  reportState,
  routing,
  showMailboxConnectGate,
  threadState,
  uiState,
}: UseMailboxPanelLayoutPropsParams) {
  const mailboxLead =
    mode === 'admin'
      ? '보고서 발송, 실제 수신 메일 확인, 연결 계정 관리를 한 화면에서 이어서 처리합니다.'
      : '개인 메일 계정으로 보고서 발송과 메일 확인을 같은 흐름에서 처리할 수 있습니다.';
  const listScopeMeta = useMemo(
    () =>
      [
        accountState.hasMultipleAccounts && accountState.selectedAccount
          ? accountState.selectedAccount.mailboxLabel
          : '',
      ].filter(Boolean),
    [accountState.hasMultipleAccounts, accountState.selectedAccount],
  );

  return {
    adminSites,
    headerProps: {
      accountStateLoading: accountState.accountStateLoading,
      disconnectableAccount: accountState.disconnectableAccount,
      hasMultipleAccounts: accountState.hasMultipleAccounts,
      listScopeMeta,
      mailboxLead,
      query: uiState.query,
      selectedAccountId: accountState.selectedAccountId,
      selectableAccounts: accountState.selectableAccounts,
      showMailboxConnectGate,
      syncStatusSummary: accountState.syncStatusSummary,
      tab: routing.tab,
      view: currentView,
      onChangeAccountId: accountState.setSelectedAccountId,
      onChangeMailboxTab: actions.handleChangeMailboxTab,
      onChangeQuery: uiState.setQuery,
      onDisconnectSelectedAccount: () => void actions.handleDisconnectSelectedAccount(),
      onOpenCompose: () => actions.handleOpenCompose(),
      onSync: () => void actions.handleSync(),
    },
    workspaceProps: {
      accountStateLoading: accountState.accountStateLoading,
      attachmentInputRef: actions.attachmentInputRef,
      attachments: composeState.attachments,
      canGoNextThreadPage: threadState.canGoNextThreadPage,
      canGoPrevThreadPage: threadState.canGoPrevThreadPage,
      compose: composeState.effectiveCompose,
      composeMode: routing.composeMode,
      composerRef: actions.composerRef,
      googleProviderStatusDetail: accountState.googleProviderStatusDetail,
      googleProviderStatusLabel: accountState.googleProviderStatusLabel,
      hasMultipleAccounts: accountState.hasMultipleAccounts,
      hasPersonalAccount: accountState.hasPersonalAccount,
      isDemoMode: uiState.isDemoMode,
      isSendingMail: Boolean(composeState.mailSendProgress),
      mailSendProgress: composeState.mailSendProgress,
      naverProviderStatusDetail: accountState.naverProviderStatusDetail,
      naverProviderStatusLabel: accountState.naverProviderStatusLabel,
      oauthProvider: uiState.oauthProvider,
      recipientSuggestionIndex: recipientSuggestionState.recipientSuggestionIndex,
      recipientSuggestions: recipientSuggestionState.visibleRecipientSuggestions,
      recipientSuggestionsLoading: recipientSuggestionState.recipientSuggestionsLoading,
      recipientSuggestionsOpen: recipientSuggestionState.recipientSuggestionsOpen,
      selectedAccount: accountState.selectedAccount,
      selectedAccountId: accountState.selectedAccountId,
      selectedReport: reportState.selectedReport,
      selectableAccounts: accountState.selectableAccounts,
      showMailboxConnectGate,
      tab: routing.tab,
      threadDetail: threadState.threadDetail,
      threadLoading: threadState.threadLoading,
      threadOffset: threadState.threadOffset,
      threadPage: threadState.threadPage,
      threadPageCount: threadState.threadPageCount,
      threadRangeEnd: threadState.threadRangeEnd,
      threadRangeStart: threadState.threadRangeStart,
      threadTotal: threadState.threadTotal,
      threads: threadState.threads,
      view: currentView,
      onAttachmentSelect: actions.handleAttachmentSelect,
      onBackToList: () => routing.setView('list'),
      onBlurRecipient: actions.handleRecipientBlur,
      onChangeAccountId: accountState.setSelectedAccountId,
      onChangeRecipientInput: actions.handleRecipientInputChange,
      onChangeSubject: (subject: string) =>
        composeState.setCompose((current) => ({ ...current, subject })),
      onClearSelectedReport: actions.handleClearSelectedReport,
      onComposerCommand: actions.handleComposerCommand,
      onComposerInput: actions.handleComposerInput,
      onComposerLink: actions.handleComposerLink,
      onConnectGoogle: () => void actions.handleConnectGoogle(),
      onConnectNaver: () => void actions.handleConnectNaverOauth(),
      onFocusRecipient: () => recipientSuggestionState.setRecipientSuggestionsOpen(true),
      onMoveThreadPage: threadState.moveThreadPage,
      onOpenReportPicker: actions.handleOpenReportPicker,
      onOpenThread: actions.handleOpenThread,
      onRecipientKeyDown: actions.handleRecipientKeyDown,
      onRefreshAccountState: () => void actions.handleRefreshAccountState(),
      onRemoveAttachment: actions.handleRemoveAttachment,
      onRemoveRecipient: actions.handleRemoveRecipient,
      onReply: actions.handleReply,
      onSelectRecipientSuggestion: actions.handleRecipientSuggestionSelect,
      onSend: () => void actions.handleSend(),
    },
  };
}
