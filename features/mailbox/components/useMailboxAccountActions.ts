import type { Dispatch, SetStateAction } from 'react';
import {
  disconnectMailAccount,
  fetchMailAccounts,
  fetchMailProviderStatuses,
  fetchMailThreads,
  startGoogleMailConnect,
  startNaverMailConnect,
  syncMail,
} from '@/lib/mail/apiClient';
import type { MailAccount, MailProviderStatus, MailThread, MailThreadDetail } from '@/types/mail';
import { normalizeMailAccountUi, normalizeMailThreadUi } from './mailboxPanelHelpers';
import type { ComposeMode, MailboxTab, MailboxView, SelectedReportContext } from './mailboxPanelTypes';
import { THREAD_PAGE_SIZE } from './mailboxPanelTypes';

interface UseMailboxAccountActionsParams {
  disconnectableAccount: MailAccount | null;
  handleDisableDemoMode: (options?: { silent?: boolean }) => void;
  headquarterId: string;
  isDemoMode: boolean;
  query: string;
  resetCompose: (mode: ComposeMode) => void;
  selectedAccount: MailAccount | null;
  setAccountStateLoading: Dispatch<SetStateAction<boolean>>;
  setAccounts: Dispatch<SetStateAction<MailAccount[]>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setNotice: Dispatch<SetStateAction<string | null>>;
  setOauthProvider: Dispatch<SetStateAction<'google' | 'naver_mail' | null>>;
  setProviderStatuses: Dispatch<SetStateAction<MailProviderStatus[]>>;
  setSelectedAccountId: Dispatch<SetStateAction<string>>;
  setSelectedReport: Dispatch<SetStateAction<SelectedReportContext | null>>;
  setSelectedThreadId: Dispatch<SetStateAction<string>>;
  setThreadDetail: Dispatch<SetStateAction<MailThreadDetail | null>>;
  setThreadTotal: Dispatch<SetStateAction<number>>;
  setThreads: Dispatch<SetStateAction<MailThread[]>>;
  setView: Dispatch<SetStateAction<MailboxView>>;
  siteId: string;
  tab: MailboxTab;
  threadOffset: number;
}

export function useMailboxAccountActions({
  disconnectableAccount,
  handleDisableDemoMode,
  headquarterId,
  isDemoMode,
  query,
  resetCompose,
  selectedAccount,
  setAccountStateLoading,
  setAccounts,
  setError,
  setNotice,
  setOauthProvider,
  setProviderStatuses,
  setSelectedAccountId,
  setSelectedReport,
  setSelectedThreadId,
  setThreadDetail,
  setThreadTotal,
  setThreads,
  setView,
  siteId,
  tab,
  threadOffset,
}: UseMailboxAccountActionsParams) {
  const handleSync = async () => {
    if (isDemoMode) {
      setNotice('데모 메일함은 시연용 목록으로 고정되어 있어 실제 동기화를 실행하지 않습니다.');
      return;
    }
    try {
      const synced = await syncMail();
      const [accountsResponse, providerResponse, threadsResponse] = await Promise.all([
        fetchMailAccounts(),
        fetchMailProviderStatuses(),
        fetchMailThreads({
          accountId: selectedAccount?.id || '',
          box: tab,
          headquarterId,
          limit: THREAD_PAGE_SIZE,
          offset: threadOffset,
          query,
          reportKey: '',
          siteId,
        }),
      ]);
      setAccounts(accountsResponse.rows.map(normalizeMailAccountUi));
      setProviderStatuses(providerResponse.rows);
      setThreads(threadsResponse.rows.map(normalizeMailThreadUi));
      setThreadTotal(threadsResponse.total);
      setSelectedThreadId((current) =>
        current && threadsResponse.rows.some((item) => item.id === current)
          ? current
          : threadsResponse.rows[0]?.id || '',
      );
      const summaryParts = [`계정 ${synced.syncedAccountCount}개`, `스레드 ${synced.threadCount}건`];
      if (synced.backfillAccountCount > 0) summaryParts.push(`초기 백필 ${synced.backfillAccountCount}개`);
      if (synced.incrementalAccountCount > 0) summaryParts.push(`증분 동기화 ${synced.incrementalAccountCount}개`);
      if (synced.queuedMessageCount > 0) summaryParts.push(`처리 메일 ${synced.queuedMessageCount}건`);
      setNotice(`메일 새로 고침을 완료했습니다. ${summaryParts.join(' / ')}`);
      if (synced.syncErrors.length > 0) {
        setError(synced.syncErrors.join('\n'));
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '메일 새로 고침에 실패했습니다.');
    }
  };
  const handleRefreshAccountState = async () => {
    if (isDemoMode) {
      setNotice('데모 메일함에서는 계정 상태 새로 고침을 사용하지 않습니다.');
      return;
    }
    try {
      setAccountStateLoading(true);
      setError(null);
      const [response, providerResponse] = await Promise.all([
        fetchMailAccounts(),
        fetchMailProviderStatuses(),
      ]);
      setAccounts(response.rows.map(normalizeMailAccountUi));
      setProviderStatuses(providerResponse.rows);
      setSelectedAccountId((current) =>
        current && response.rows.some((item) => item.id === current) ? current : response.rows[0]?.id || '',
      );
      setNotice('메일 계정과 공급자 상태를 새로고침했습니다.');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '메일 계정 상태를 새로고침하지 못했습니다.');
    } finally {
      setAccountStateLoading(false);
    }
  };
  const handleDisconnectSelectedAccount = async () => {
    if (isDemoMode || !disconnectableAccount) return;
    const confirmed = window.confirm(
      `${disconnectableAccount.mailboxLabel} 연결을 해제할까요?\n연결 해제 후에는 다시 로그인해야 메일을 확인하거나 발송할 수 있습니다.`,
    );
    if (!confirmed) return;
    try {
      setAccountStateLoading(true);
      setError(null);
      await disconnectMailAccount(disconnectableAccount.id);
      const [response, providerResponse] = await Promise.all([
        fetchMailAccounts(),
        fetchMailProviderStatuses(),
      ]);
      const nextAccounts = response.rows.map(normalizeMailAccountUi);
      setAccounts(nextAccounts);
      setProviderStatuses(providerResponse.rows);
      setSelectedAccountId(nextAccounts[0]?.id || '');
      setThreads([]);
      setThreadTotal(0);
      setSelectedThreadId('');
      setThreadDetail(null);
      setSelectedReport(null);
      resetCompose('new');
      setView('list');
      setNotice(`${disconnectableAccount.mailboxLabel} 연결을 해제했습니다.`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '메일 로그아웃에 실패했습니다.');
    } finally {
      setAccountStateLoading(false);
    }
  };
  const handleConnectGoogle = async () => {
    try {
      handleDisableDemoMode({ silent: true });
      setError(null);
      setOauthProvider('google');
      const response = await startGoogleMailConnect();
      window.location.assign(response.authorizationUrl);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '구글 메일 연결에 실패했습니다.');
      setOauthProvider(null);
    }
  };
  const handleConnectNaverOauth = async () => {
    try {
      handleDisableDemoMode({ silent: true });
      setError(null);
      setOauthProvider('naver_mail');
      const response = await startNaverMailConnect();
      window.location.assign(response.authorizationUrl);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '네이버 로그인 연결에 실패했습니다.');
      setOauthProvider(null);
    }
  };

  return {
    handleConnectGoogle,
    handleConnectNaverOauth,
    handleDisconnectSelectedAccount,
    handleRefreshAccountState,
    handleSync,
  };
}
