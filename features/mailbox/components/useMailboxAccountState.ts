'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchMailAccounts, fetchMailProviderStatuses } from '@/lib/mail/apiClient';
import type { MailAccount, MailProviderStatus } from '@/types/mail';
import {
  getDemoMailboxAccounts,
  MAILBOX_DEMO_SESSION_KEY,
} from './demoMailboxData';
import {
  buildProviderStatusDetail,
  buildProviderStatusLabel,
  buildSyncStatusSummary,
  normalizeMailAccountUi,
  readMailAccountSyncMetadata,
} from './mailboxPanelHelpers';

interface UseMailboxAccountStateParams {
  isDemoMode: boolean;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useMailboxAccountState({
  isDemoMode,
  setError,
}: UseMailboxAccountStateParams) {
  const [accounts, setAccounts] = useState<MailAccount[]>([]);
  const [providerStatuses, setProviderStatuses] = useState<MailProviderStatus[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [accountStateLoading, setAccountStateLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || isDemoMode) return;
    window.sessionStorage.removeItem(MAILBOX_DEMO_SESSION_KEY);
  }, [isDemoMode]);

  useEffect(() => {
    if (isDemoMode) {
      const demoAccounts = getDemoMailboxAccounts();
      setAccounts(demoAccounts);
      setProviderStatuses([]);
      setSelectedAccountId(demoAccounts[0]?.id || '');
      setAccountStateLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        setAccountStateLoading(true);
        const [response, providerResponse] = await Promise.all([
          fetchMailAccounts(),
          fetchMailProviderStatuses(),
        ]);
        if (cancelled) return;
        const nextAccounts = response.rows.map(normalizeMailAccountUi);
        const nextSelectableAccounts = nextAccounts.filter((account) => account.scope === 'personal');
        setAccounts(nextAccounts);
        setProviderStatuses(providerResponse.rows);
        setSelectedAccountId(
          (current) => current || nextSelectableAccounts[0]?.id || nextAccounts[0]?.id || '',
        );
      } catch (nextError) {
        if (!cancelled) {
          setError(
            nextError instanceof Error
              ? nextError.message
              : '메일 계정을 불러오지 못했습니다.',
          );
        }
      } finally {
        if (!cancelled) {
          setAccountStateLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isDemoMode, setError]);

  const selectableAccounts = useMemo(() => {
    const personalAccounts = accounts.filter((account) => account.scope === 'personal');
    return personalAccounts.length > 0 ? personalAccounts : accounts;
  }, [accounts]);

  useEffect(() => {
    if (accounts.length === 0) {
      setSelectedAccountId('');
      return;
    }
    const selectedStillVisible = selectableAccounts.some(
      (account) => account.id === selectedAccountId,
    );
    if (!selectedStillVisible) {
      setSelectedAccountId(selectableAccounts[0]?.id || '');
    }
  }, [accounts, selectableAccounts, selectedAccountId]);

  const selectedAccount = useMemo(
    () => selectableAccounts.find((item) => item.id === selectedAccountId) ?? null,
    [selectableAccounts, selectedAccountId],
  );
  const disconnectableAccount = useMemo(() => {
    if (accounts.length === 1) {
      return accounts[0]?.scope === 'personal' ? accounts[0] : null;
    }
    if (!selectedAccountId) return null;
    const matched = accounts.find((item) => item.id === selectedAccountId) ?? null;
    return matched?.scope === 'personal' ? matched : null;
  }, [accounts, selectedAccountId]);
  const selectedAccountSyncMeta = useMemo(
    () => readMailAccountSyncMetadata(selectedAccount),
    [selectedAccount],
  );
  const syncStatusSummary = useMemo(
    () => buildSyncStatusSummary(selectedAccountSyncMeta),
    [selectedAccountSyncMeta],
  );
  const providerStatusMap = useMemo(
    () => new Map(providerStatuses.map((provider) => [provider.provider, provider])),
    [providerStatuses],
  );
  const googleProviderStatus = providerStatusMap.get('google');
  const naverProviderStatus = providerStatusMap.get('naver_mail');

  return {
    accountStateLoading,
    accounts,
    disconnectableAccount,
    googleProviderStatusDetail: buildProviderStatusDetail(googleProviderStatus),
    googleProviderStatusLabel: buildProviderStatusLabel(googleProviderStatus),
    hasMultipleAccounts: selectableAccounts.length > 1,
    hasPersonalAccount: accounts.some((account) => account.scope === 'personal'),
    naverProviderStatusDetail: buildProviderStatusDetail(naverProviderStatus),
    naverProviderStatusLabel: buildProviderStatusLabel(naverProviderStatus),
    providerStatuses,
    selectableAccounts,
    selectedAccount,
    selectedAccountId,
    setAccountStateLoading,
    setAccounts,
    setProviderStatuses,
    setSelectedAccountId,
    syncStatusSummary,
  };
}
