'use client';

import type { RefObject } from 'react';
import { persistDemoMailboxMode } from './mailboxViewHelpers';
import { useMailboxAccountActions } from './useMailboxAccountActions';
import { useMailboxComposeUiActions } from './useMailboxComposeUiActions';
import { useMailboxRecipientActions } from './useMailboxRecipientActions';
import { useMailboxSendAction } from './useMailboxSendAction';
import { useMailboxAccountState } from './useMailboxAccountState';
import { useMailboxComposeState } from './useMailboxComposeState';
import { useMailboxPanelUiState } from './useMailboxPanelUiState';
import { useMailboxRecipientSuggestions } from './useMailboxRecipientSuggestions';
import { useMailboxReportState } from './useMailboxReportState';
import { useMailboxRoutingState } from './useMailboxRoutingState';
import { useMailboxThreadState } from './useMailboxThreadState';

type AccountState = ReturnType<typeof useMailboxAccountState>;
type ComposeState = ReturnType<typeof useMailboxComposeState>;
type PanelUiState = ReturnType<typeof useMailboxPanelUiState>;
type RecipientSuggestionState = ReturnType<typeof useMailboxRecipientSuggestions>;
type ReportState = ReturnType<typeof useMailboxReportState>;
type RoutingState = ReturnType<typeof useMailboxRoutingState>;
type ThreadState = ReturnType<typeof useMailboxThreadState>;

interface RouterLike {
  replace: (href: string, options?: { scroll?: boolean }) => void;
}

interface SearchParamsLike {
  toString: () => string;
}

interface UseMailboxPanelActionsParams {
  accountState: AccountState;
  attachmentInputRef: RefObject<HTMLInputElement | null>;
  composeState: ComposeState;
  composerRef: RefObject<HTMLDivElement | null>;
  headquarterId: string;
  pathname: string;
  recipientSuggestionState: RecipientSuggestionState;
  reportState: ReportState;
  router: RouterLike;
  routing: RoutingState;
  searchParams: SearchParamsLike;
  siteId: string;
  threadState: ThreadState;
  uiState: PanelUiState;
}

export function useMailboxPanelActions({
  accountState,
  attachmentInputRef,
  composeState,
  composerRef,
  headquarterId,
  pathname,
  recipientSuggestionState,
  reportState,
  router,
  routing,
  searchParams,
  siteId,
  threadState,
  uiState,
}: UseMailboxPanelActionsParams) {
  const handleDisableDemoMode = (options?: { silent?: boolean }) => {
    persistDemoMailboxMode(false);
    uiState.setIsDemoMode(false);
    accountState.setAccounts([]);
    threadState.setThreads([]);
    threadState.setThreadTotal(0);
    threadState.setSelectedThreadId('');
    threadState.setThreadDetail(null);
    reportState.setSelectedReport(null);
    composeState.resetCompose('new');
    routing.setView('list');
    if (!options?.silent) {
      uiState.setNotice('데모 메일함을 종료했습니다.');
    }
  };

  const accountActions = useMailboxAccountActions({
    disconnectableAccount: accountState.disconnectableAccount,
    handleDisableDemoMode,
    headquarterId,
    isDemoMode: uiState.isDemoMode,
    query: uiState.query,
    resetCompose: composeState.resetCompose,
    selectedAccount: accountState.selectedAccount,
    setAccountStateLoading: accountState.setAccountStateLoading,
    setAccounts: accountState.setAccounts,
    setError: uiState.setError,
    setNotice: uiState.setNotice,
    setOauthProvider: uiState.setOauthProvider,
    setProviderStatuses: accountState.setProviderStatuses,
    setSelectedAccountId: accountState.setSelectedAccountId,
    setSelectedReport: reportState.setSelectedReport,
    setSelectedThreadId: threadState.setSelectedThreadId,
    setThreadDetail: threadState.setThreadDetail,
    setThreadTotal: threadState.setThreadTotal,
    setThreads: threadState.setThreads,
    setView: routing.setView,
    siteId,
    tab: routing.tab,
    threadOffset: threadState.threadOffset,
  });

  const recipientActions = useMailboxRecipientActions({
    compose: composeState.effectiveCompose,
    recipientSuggestionIndex: recipientSuggestionState.recipientSuggestionIndex,
    recipientSuggestionsOpen: recipientSuggestionState.recipientSuggestionsOpen,
    setCompose: composeState.setCompose,
    setRecipientSuggestionIndex: recipientSuggestionState.setRecipientSuggestionIndex,
    setRecipientSuggestionsOpen: recipientSuggestionState.setRecipientSuggestionsOpen,
    visibleRecipientSuggestions: recipientSuggestionState.visibleRecipientSuggestions,
  });

  const composeUiActions = useMailboxComposeUiActions({
    attachmentInputRef,
    composeMode: routing.composeMode,
    composerRef,
    resetCompose: composeState.resetCompose,
    selectedAccount: accountState.selectedAccount,
    selectedReport: reportState.selectedReport,
    setAttachments: composeState.setAttachments,
    setCompose: composeState.setCompose,
    setComposeMode: routing.setComposeMode,
    setReportPickerOpen: uiState.setReportPickerOpen,
    setReportSearch: reportState.setReportSearch,
    setReportSiteFilter: reportState.setReportSiteFilter,
    setSelectedReport: reportState.setSelectedReport,
    setView: routing.setView,
    siteId,
    threadDetail: threadState.threadDetail,
  });

  const { handleSend } = useMailboxSendAction({
    attachments: composeState.attachments,
    compose: composeState.effectiveCompose,
    composeMode: routing.composeMode,
    isDemoMode: uiState.isDemoMode,
    query: uiState.query,
    resetCompose: composeState.resetCompose,
    selectedAccount: accountState.selectedAccount,
    selectedReport: reportState.selectedReport,
    selectedThreadId: threadState.selectedThreadId,
    setComposeMode: routing.setComposeMode,
    setError: uiState.setError,
    setMailSendProgress: composeState.setMailSendProgress,
    setNotice: uiState.setNotice,
    setSelectedReport: reportState.setSelectedReport,
    setThreadDetail: threadState.setThreadDetail,
    setThreadTotal: threadState.setThreadTotal,
    setThreads: threadState.setThreads,
    setView: routing.setView,
    siteId,
    tab: routing.tab,
    threadDetail: threadState.threadDetail,
    threadOffset: threadState.threadOffset,
  });

  return {
    ...accountActions,
    ...composeUiActions,
    ...recipientActions,
    attachmentInputRef,
    composerRef,
    handleChangeMailboxTab: (nextTab: typeof routing.tab) => {
      threadState.setSelectedThreadId('');
      threadState.setThreadDetail(null);
      routing.setView('list');
      threadState.setThreadOffset(0);
      const nextSearchParams = new URLSearchParams(searchParams.toString());
      nextSearchParams.set('box', nextTab);
      nextSearchParams.delete('threadId');
      router.replace(`${pathname}?${nextSearchParams.toString()}`, { scroll: false });
    },
    handleOpenThread: (threadId: string) => {
      threadState.setSelectedThreadId(threadId);
      threadState.setThreadDetail(null);
      routing.setView('thread');
    },
    handleSend,
  };
}
