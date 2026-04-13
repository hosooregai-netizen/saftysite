'use client';

import { useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import type { MailboxPanelProps } from './mailboxPanelTypes';
import { MailboxPanelLayout } from './MailboxPanelLayout';
import { useMailboxAccountState } from './useMailboxAccountState';
import { useMailboxComposeState } from './useMailboxComposeState';
import { useMailboxRecipientSuggestions } from './useMailboxRecipientSuggestions';
import { useMailboxPanelLayoutProps } from './useMailboxPanelLayoutProps';
import { useMailboxPanelUiState } from './useMailboxPanelUiState';
import { useMailboxReportState } from './useMailboxReportState';
import { useMailboxRoutingState } from './useMailboxRoutingState';
import { useMailboxThreadState } from './useMailboxThreadState';
import { useMailboxPanelActions } from './useMailboxPanelActions';

export function MailboxPanel({
  mode,
  adminReports = [],
  adminSites = [],
}: MailboxPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, isReady, sites: workerSites } = useInspectionSessions();
  const composerRef = useRef<HTMLDivElement | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const reportKey = searchParams.get('reportKey') || '';
  const siteId = searchParams.get('siteId') || '';
  const headquarterId = searchParams.get('headquarterId') || '';
  const uiState = useMailboxPanelUiState(searchParams);

  const routing = useMailboxRoutingState({
    headquarterId,
    pathname,
    reportKey,
    router,
    searchParams,
    siteId,
  });
  const accountState = useMailboxAccountState({
    isDemoMode: uiState.isDemoMode,
    setError: uiState.setError,
  });
  const showMailboxConnectGate = !uiState.isDemoMode && accountState.accounts.length === 0;
  const currentView = showMailboxConnectGate ? 'list' : routing.view;
  const reportState = useMailboxReportState({
    adminReports,
    adminSites,
    headquarterId,
    isAuthenticated,
    isDemoMode: uiState.isDemoMode,
    isReady,
    mode,
    reportKey,
    reportPickerOpen: uiState.reportPickerOpen,
    siteId,
    workerSites,
  });
  const composeState = useMailboxComposeState({
    composeMode: routing.composeMode,
    composerRef,
    selectedReport: reportState.selectedReport,
  });
  const threadState = useMailboxThreadState({
    headquarterId,
    isDemoMode: uiState.isDemoMode,
    query: uiState.query,
    requestedThreadId: routing.requestedThreadId,
    selectedAccount: accountState.selectedAccount,
    selectedAccountId: accountState.selectedAccountId,
    setError: uiState.setError,
    siteId,
    tab: routing.tab,
    view: currentView,
  });
  const recipientSuggestionState = useMailboxRecipientSuggestions({
    compose: composeState.effectiveCompose,
    isDemoMode: uiState.isDemoMode,
    selectedAccountId: accountState.selectedAccountId,
    view: currentView,
  });
  const actions = useMailboxPanelActions({
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
  });
  const layoutProps = useMailboxPanelLayoutProps({
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
  });

  return (
    <MailboxPanelLayout
      activeError={uiState.activeError}
      activeNotice={uiState.activeNotice}
      adminSites={layoutProps.adminSites}
      filteredReportOptions={reportState.filteredReportOptions}
      filteredReportOptionsByKey={reportState.filteredReportOptionsByKey}
      headerProps={layoutProps.headerProps}
      mode={mode}
      reportPickerLoading={reportState.reportPickerLoading}
      reportPickerOpen={uiState.reportPickerOpen}
      reportSearch={reportState.reportSearch}
      reportSiteFilter={reportState.reportSiteFilter}
      setReportPickerOpen={uiState.setReportPickerOpen}
      setReportSearch={reportState.setReportSearch}
      setReportSiteFilter={reportState.setReportSiteFilter}
      workspaceProps={layoutProps.workspaceProps}
      onSelectReport={(selectedReportKey) => {
        const option = reportState.filteredReportOptionsByKey.get(selectedReportKey);
        if (option) {
          actions.handleSelectReport(option);
        }
      }}
    />
  );
}

export default MailboxPanel;
