'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import {
  connectNaverMail,
  disconnectMailAccount,
  fetchMailAccounts,
  fetchMailProviderStatuses,
  fetchMailThreadDetail,
  fetchMailThreads,
  sendMail,
  startGoogleMailConnect,
  startNaverMailConnect,
  syncMail,
} from '@/lib/mail/apiClient';
import type { MailAccount, MailProviderStatus, MailRecipient, MailThread, MailThreadDetail } from '@/types/mail';
import localStyles from './MailboxPanel.module.css';

type MailboxTab = 'inbox' | 'sent' | 'reports' | 'accounts';

interface MailboxPanelProps {
  currentUserName?: string | null;
  mode: 'admin' | 'worker';
}

const THREAD_PAGE_SIZE = 50;
const DEFAULT_SHARED_MAILBOX_EMAIL = 'safety-control@naverworks.local';
const DEFAULT_SHARED_MAILBOX_NAME = '관제 공용 메일함';
const MAILBOX_TAB_META: Record<MailboxTab, { description: string; empty: string; title: string }> = {
  inbox: {
    title: '받은편지함',
    description: '수신 메일과 회신 흐름을 확인합니다.',
    empty: '연결된 계정이나 검색 조건에 맞는 수신 메일이 없습니다.',
  },
  sent: {
    title: '보낸편지함',
    description: '발송한 메일과 전달 상태를 확인합니다.',
    empty: '연결된 계정이나 검색 조건에 맞는 발송 메일이 없습니다.',
  },
  reports: {
    title: '보고서 발송',
    description: '보고서 범위를 유지한 채 메일을 작성하고 발송합니다.',
    empty: '선택한 보고서 범위에 연결된 메일 스레드가 없습니다.',
  },
  accounts: {
    title: '연결 계정',
    description: '사용 가능한 메일 계정과 공급자 연결 상태를 관리합니다.',
    empty: '연결된 메일 계정이 없습니다.',
  },
};

function countHangulCharacters(value: string) {
  return Array.from(value).filter((char) => char >= '\uac00' && char <= '\ud7a3').length;
}

function repairMojibakeText(value: string | null | undefined) {
  const normalized = value?.trim() || '';
  if (!normalized) return '';
  const bytes = Array.from(normalized, (char) => char.charCodeAt(0));
  if (bytes.some((code) => code > 0xff)) {
    return normalized;
  }
  try {
    const repaired = new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bytes));
    return countHangulCharacters(repaired) > countHangulCharacters(normalized) ? repaired.trim() : normalized;
  } catch {
    return normalized;
  }
}

function isDefaultSharedMailbox(input: {
  email: string;
  provider: MailAccount['provider'] | MailThread['provider'];
  scope: MailAccount['scope'] | MailThread['scope'];
}) {
  return (
    input.scope === 'shared' &&
    input.provider === 'naver_works' &&
    input.email.trim().toLowerCase() === DEFAULT_SHARED_MAILBOX_EMAIL
  );
}

function normalizeMailAccountUi(account: MailAccount): MailAccount {
  const displayName = repairMojibakeText(account.displayName) || account.email;
  const mailboxLabel = repairMojibakeText(account.mailboxLabel) || displayName || account.email;
  if (isDefaultSharedMailbox(account)) {
    return {
      ...account,
      displayName: DEFAULT_SHARED_MAILBOX_NAME,
      mailboxLabel: DEFAULT_SHARED_MAILBOX_NAME,
    };
  }
  return {
    ...account,
    displayName,
    mailboxLabel,
  };
}

function normalizeMailThreadUi(thread: MailThread): MailThread {
  const accountDisplayName = repairMojibakeText(thread.accountDisplayName) || thread.accountEmail;
  if (
    isDefaultSharedMailbox({
      email: thread.accountEmail,
      provider: thread.provider,
      scope: thread.scope,
    })
  ) {
    return {
      ...thread,
      accountDisplayName: DEFAULT_SHARED_MAILBOX_NAME,
    };
  }
  return {
    ...thread,
    accountDisplayName,
  };
}

function normalizeMailThreadDetailUi(detail: MailThreadDetail): MailThreadDetail {
  return {
    ...detail,
    thread: normalizeMailThreadUi(detail.thread),
  };
}

function formatDateTime(value: string | null) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('ko-KR', {
    hour12: false,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function parseRecipients(value: string): MailRecipient[] {
  return value
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((email) => ({ email, name: null }));
}

function buildThreadRecipients(thread: MailThread, accountEmail: string): string {
  return thread.participants
    .filter((item) => item.email !== accountEmail)
    .map((item) => item.email)
    .join(', ');
}

function buildMailboxOwnerLabel(account: MailAccount | null, currentUserName?: string | null) {
  const trimmedUserName = currentUserName?.trim();
  if (trimmedUserName) {
    return trimmedUserName;
  }
  return account?.displayName || account?.mailboxLabel || account?.email || '연결된 계정 없음';
}

function buildMailboxOwnerMeta(account: MailAccount | null, currentUserName?: string | null) {
  if (!account) {
    return '발송 계정을 먼저 연결하세요.';
  }
  const trimmedUserName = currentUserName?.trim();
  if (trimmedUserName) {
    return `발송자 ${trimmedUserName}`;
  }
  return account.displayName || account.email;
}

function buildAccountCardTitle(account: MailAccount, currentUserName?: string | null) {
  const trimmedUserName = currentUserName?.trim();
  if (isDefaultSharedMailbox(account)) {
    return trimmedUserName ? `${trimmedUserName} 메일함` : '공용 메일함';
  }
  return account.displayName || account.mailboxLabel || account.email;
}

function buildProviderStatusLabel(provider: MailProviderStatus | undefined) {
  if (!provider) return '-';
  if (!provider.enabled) return '설정 필요';
  return provider.isRedirectAllowed ? '준비 완료' : '리디렉션 확인';
}

function buildProviderStatusDetail(provider: MailProviderStatus | undefined) {
  if (!provider) return '';
  if (provider.missingFields.length > 0) {
    return `필수값 ${provider.missingFields.join(', ')}`;
  }
  if (!provider.enabled) {
    return '필수값을 확인하세요.';
  }
  if (!provider.isRedirectAllowed) {
    return '리디렉션 주소를 확인하세요.';
  }
  return '연결 가능';
}

function formatProviderLabel(provider: MailAccount['provider'] | MailProviderStatus['provider']) {
  switch (provider) {
    case 'google':
      return '구글';
    case 'naver_mail':
      return '네이버';
    case 'naver_works':
      return '네이버웍스';
    default:
      return provider;
  }
}

export function MailboxPanel({ currentUserName, mode }: MailboxPanelProps) {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<MailboxTab>(() => {
    const value = searchParams.get('box');
    return value === 'sent' || value === 'reports' || value === 'accounts' ? value : 'inbox';
  });
  const [query, setQuery] = useState('');
  const [accounts, setAccounts] = useState<MailAccount[]>([]);
  const [providerStatuses, setProviderStatuses] = useState<MailProviderStatus[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [threads, setThreads] = useState<MailThread[]>([]);
  const [threadOffset, setThreadOffset] = useState(0);
  const [threadTotal, setThreadTotal] = useState(0);
  const [selectedThreadId, setSelectedThreadId] = useState(() => searchParams.get('threadId') || '');
  const [threadDetail, setThreadDetail] = useState<MailThreadDetail | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [accountStateLoading, setAccountStateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [naverForm, setNaverForm] = useState({ appPassword: '', displayName: '', email: '' });
  const [oauthProvider, setOauthProvider] = useState<'google' | 'naver_mail' | null>(null);
  const [compose, setCompose] = useState({
    body: '',
    subject: '',
    to: '',
  });

  const reportKey = searchParams.get('reportKey') || '';
  const siteId = searchParams.get('siteId') || '';
  const headquarterId = searchParams.get('headquarterId') || '';

  useEffect(() => {
    const nextBox = searchParams.get('box');
    if (nextBox === 'sent' || nextBox === 'reports' || nextBox === 'accounts' || nextBox === 'inbox') {
      setTab(nextBox);
    }
    setSelectedThreadId(searchParams.get('threadId') || '');
  }, [searchParams]);

  const selectedAccount = useMemo(
    () => accounts.find((item) => item.id === selectedAccountId) ?? accounts[0] ?? null,
    [accounts, selectedAccountId],
  );
  const mailboxOwnerLabel = useMemo(
    () => buildMailboxOwnerLabel(selectedAccount, currentUserName),
    [currentUserName, selectedAccount],
  );
  const mailboxOwnerMeta = useMemo(
    () => buildMailboxOwnerMeta(selectedAccount, currentUserName),
    [currentUserName, selectedAccount],
  );
  const activeTabMeta = MAILBOX_TAB_META[tab];
  const providerStatusMap = useMemo(
    () => new Map(providerStatuses.map((provider) => [provider.provider, provider])),
    [providerStatuses],
  );
  const googleProviderStatus = providerStatusMap.get('google');
  const naverProviderStatus = providerStatusMap.get('naver_mail');
  const hasMultipleAccounts = accounts.length > 1;
  const scopeMeta = useMemo(
    () =>
      [
        hasMultipleAccounts && selectedAccount ? selectedAccount.mailboxLabel : '',
        reportKey ? `보고서 ${reportKey}` : '',
        siteId ? `현장 ${siteId}` : '',
        headquarterId ? `사업장 ${headquarterId}` : '',
      ].filter(Boolean),
    [hasMultipleAccounts, headquarterId, reportKey, selectedAccount, siteId],
  );

  useEffect(() => {
    if (!selectedAccountId && accounts[0]) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  useEffect(() => {
    const searchNotice = searchParams.get('oauthNotice') || '';
    if (searchNotice) {
      setNotice(searchNotice);
    }
    const searchError = searchParams.get('oauthError') || '';
    if (searchError) {
      setError(searchError);
    }
    const oauthNotice =
      typeof window !== 'undefined' ? window.sessionStorage.getItem('mailbox-oauth-notice') : '';
    if (oauthNotice) {
      setNotice(oauthNotice);
      window.sessionStorage.removeItem('mailbox-oauth-notice');
    }
    const oauthError =
      typeof window !== 'undefined' ? window.sessionStorage.getItem('mailbox-oauth-error') : '';
    if (oauthError) {
      setError(oauthError);
      window.sessionStorage.removeItem('mailbox-oauth-error');
    }
  }, [searchParams]);

  useEffect(() => {
    void (async () => {
      try {
        setAccountStateLoading(true);
        const [response, providerResponse] = await Promise.all([
          fetchMailAccounts(),
          fetchMailProviderStatuses(),
        ]);
        setAccounts(response.rows.map(normalizeMailAccountUi));
        setProviderStatuses(providerResponse.rows);
        setSelectedAccountId((current) => current || response.rows[0]?.id || '');
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : '메일 계정을 불러오지 못했습니다.');
      } finally {
        setAccountStateLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (tab !== 'accounts') return;
    void (async () => {
      try {
        setAccountStateLoading(true);
        const [response, providerResponse] = await Promise.all([
          fetchMailAccounts(),
          fetchMailProviderStatuses(),
        ]);
        setAccounts(response.rows.map(normalizeMailAccountUi));
        setProviderStatuses(providerResponse.rows);
        setSelectedAccountId((current) =>
          current && response.rows.some((item) => item.id === current) ? current : response.rows[0]?.id || '',
        );
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : '메일 계정 상태를 새로고침하지 못했습니다.');
      } finally {
        setAccountStateLoading(false);
      }
    })();
  }, [tab]);

  useEffect(() => {
    setThreadOffset(0);
  }, [headquarterId, query, reportKey, selectedAccountId, siteId, tab]);

  useEffect(() => {
    if (tab === 'accounts') return;
    void (async () => {
      try {
        setThreadLoading(true);
        setError(null);
        const response = await fetchMailThreads({
          accountId: selectedAccountId,
          box: tab,
          headquarterId,
          limit: THREAD_PAGE_SIZE,
          offset: threadOffset,
          query,
          reportKey: tab === 'reports' ? reportKey : '',
          siteId,
        });
        setThreads(response.rows.map(normalizeMailThreadUi));
        setThreadTotal(response.total);
        setSelectedThreadId((current) =>
          current && response.rows.some((item) => item.id === current)
            ? current
            : response.rows[0]?.id || '',
        );
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : '메일 스레드를 불러오지 못했습니다.');
      } finally {
        setThreadLoading(false);
      }
    })();
  }, [headquarterId, query, reportKey, selectedAccountId, siteId, tab, threadOffset]);

  useEffect(() => {
    if (!selectedThreadId || tab === 'accounts') {
      setThreadDetail(null);
      return;
    }
    void (async () => {
      try {
        setThreadLoading(true);
        const detail = normalizeMailThreadDetailUi(await fetchMailThreadDetail(selectedThreadId));
        setThreadDetail(detail);
        if (!compose.subject) {
          setCompose((current) => ({
            ...current,
            subject: detail.thread.subject,
            to: selectedAccount ? buildThreadRecipients(detail.thread, selectedAccount.email) : current.to,
          }));
        }
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : '메일 스레드 상세를 불러오지 못했습니다.');
      } finally {
        setThreadLoading(false);
      }
    })();
  }, [compose.subject, selectedAccount, selectedThreadId, tab]);

  useEffect(() => {
    if (tab !== 'reports') return;
    setCompose((current) => ({
      ...current,
      subject: current.subject || (reportKey ? `[보고서] ${reportKey}` : ''),
    }));
  }, [reportKey, tab]);

  const handleSync = async () => {
    try {
      const synced = await syncMail();
      setNotice(`메일 동기화를 완료했습니다. 계정 ${synced.synced_account_count}개 / 스레드 ${synced.thread_count}건`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '메일 동기화에 실패했습니다.');
    }
  };

  const handleRefreshAccountState = async () => {
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

  const handleSend = async () => {
    if (!selectedAccount) return;

    try {
      await sendMail({
        accountId: selectedAccount.id,
        body: compose.body,
        headquarterId,
        reportKey: tab === 'reports' ? reportKey : threadDetail?.thread.reportKey || '',
        siteId,
        subject: compose.subject,
        threadId: tab === 'reports' ? '' : threadDetail?.thread.id || '',
        to: parseRecipients(compose.to),
      });
      setNotice('메일을 발송했습니다.');
      setCompose((current) => ({ ...current, body: '' }));
      const nextThreads = await fetchMailThreads({
        accountId: selectedAccount.id,
        box: tab,
        headquarterId,
        limit: THREAD_PAGE_SIZE,
        offset: threadOffset,
        query,
        reportKey: tab === 'reports' ? reportKey : '',
        siteId,
      });
      setThreads(nextThreads.rows.map(normalizeMailThreadUi));
      setThreadTotal(nextThreads.total);
      if (selectedThreadId) {
        setThreadDetail(normalizeMailThreadDetailUi(await fetchMailThreadDetail(selectedThreadId)));
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '메일 발송에 실패했습니다.');
    }
  };

  const handleConnectGoogle = async () => {
    try {
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
      setError(null);
      setOauthProvider('naver_mail');
      const response = await startNaverMailConnect();
      window.location.assign(response.authorizationUrl);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '네이버 로그인 연결에 실패했습니다.');
      setOauthProvider(null);
    }
  };

  const handleConnectNaverAppPassword = async () => {
    try {
      setError(null);
      const connected = normalizeMailAccountUi(await connectNaverMail(naverForm));
      setAccounts((current) => [connected, ...current.filter((item) => item.id !== connected.id)]);
      setNaverForm({ appPassword: '', displayName: '', email: '' });
      setNotice('네이버 메일 계정을 앱 비밀번호 방식으로 연결했습니다.');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '네이버 메일 연결에 실패했습니다.');
    }
  };

  const handleDisconnectAccount = async (accountId: string) => {
    try {
      await disconnectMailAccount(accountId);
      setAccounts((current) => current.filter((item) => item.id !== accountId));
      setNotice('메일 계정 연결을 해제했습니다.');
      if (selectedAccountId === accountId) {
        setSelectedAccountId('');
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '메일 계정 연결 해제에 실패했습니다.');
    }
  };

  const threadPage = Math.floor(threadOffset / THREAD_PAGE_SIZE) + 1;
  const threadPageCount = Math.max(1, Math.ceil(threadTotal / THREAD_PAGE_SIZE));
  const threadRangeStart = threadTotal === 0 ? 0 : threadOffset + 1;
  const threadRangeEnd = Math.min(threadOffset + threads.length, threadTotal);
  const composeTitle =
    tab === 'reports' ? '보고서 발송 메일 작성' : threadDetail ? '선택한 스레드에 답장' : '새 메일 작성';
  const threadEmptyMessage = threadLoading ? '메일을 불러오는 중입니다.' : activeTabMeta.empty;
  const detailEmptyMessage =
    tab === 'reports'
      ? '보고서 발송용 메일은 아래 작성 카드에서 바로 시작할 수 있습니다.'
      : '왼쪽에서 메일 스레드를 선택하면 상세 내용을 볼 수 있습니다.';

  return (
    <section className={`${styles.sectionCard} ${styles.listSectionCard}`}>
      <div className={styles.sectionHeader}>
        <div className={localStyles.sectionHeaderMeta}>
          <h2 className={styles.sectionTitle}>{mode === 'admin' ? '통합 메일함' : '개인 메일함'}</h2>
        </div>
        <div className={`${styles.sectionHeaderActions} ${localStyles.headerToolbar}`}>
          <div className={localStyles.tabRail}>
            {([
              ['inbox', '받은편지함'],
              ['sent', '보낸편지함'],
              ['reports', '보고서 발송'],
              ['accounts', '연결 계정'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`${localStyles.tabButton} ${tab === value ? localStyles.tabButtonActive : ''}`}
                onClick={() => setTab(value)}
              >
                {label}
              </button>
            ))}
          </div>
          {tab !== 'accounts' ? (
            <input
              aria-label="메일 검색"
              className={`app-input ${localStyles.searchField}`}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="제목, 본문, 주소 검색"
            />
          ) : null}
          {tab !== 'accounts' && hasMultipleAccounts ? (
            <select
              className={`app-select ${localStyles.accountFilter}`}
              value={selectedAccountId}
              onChange={(event) => setSelectedAccountId(event.target.value)}
            >
              <option value="">전체 계정</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.mailboxLabel}
                </option>
              ))}
            </select>
          ) : null}
          {tab !== 'accounts' && hasMultipleAccounts && scopeMeta.length > 0 ? (
            <span className={localStyles.headerScope}>{scopeMeta.join(' · ')}</span>
          ) : null}
          <button
            type="button"
            className={`app-button app-button-secondary ${localStyles.headerActionButton}`}
            onClick={() => void handleSync()}
          >
            동기화
          </button>
        </div>
      </div>

      <div className={`${styles.sectionBody} ${localStyles.shell}`}>
        {error ? <div className={styles.bannerError}>{error}</div> : null}
        {notice ? <div className={styles.bannerNotice}>{notice}</div> : null}

        {tab !== 'accounts' && scopeMeta.length > 0 ? (
          <div className={localStyles.scopeRow}>
            <span className={localStyles.scopeKicker}>현재 범위</span>
            <strong className={localStyles.scopeValue}>{activeTabMeta.title}</strong>
            <span className={localStyles.scopeText}>{scopeMeta.join(' · ')}</span>
          </div>
        ) : null}

        {tab === 'accounts' ? (
          <div className={localStyles.accountWorkspace}>
            <div className={localStyles.accountColumn}>
              <article className={localStyles.accountCard}>
                <div className={localStyles.panelHeader}>
                  <div className={localStyles.panelHeading}>
                    <strong className={localStyles.accountTitle}>연결된 계정</strong>
                  </div>
                </div>
                {accounts.length === 0 ? (
                  <div className={localStyles.emptyState}>연결된 메일 계정이 없습니다.</div>
                ) : (
                  <div className={localStyles.accountList}>
                    {accounts.map((account) => (
                      <div key={account.id} className={localStyles.accountRecord}>
                        <div className={localStyles.accountTitleRow}>
                          <strong className={localStyles.accountTitle}>
                            {buildAccountCardTitle(account, currentUserName)}
                          </strong>
                          <span className={localStyles.inlineMeta}>
                            {account.scope === 'shared' ? '공용 계정' : '개인 계정'}
                          </span>
                        </div>
                        <div className={localStyles.accountMetaRow}>
                          <span className={localStyles.accountMeta}>{account.email}</span>
                          <span className={localStyles.accountMeta}>{formatProviderLabel(account.provider)}</span>
                        </div>
                        <span className={localStyles.accountMeta}>동기화 {formatDateTime(account.lastSyncedAt)}</span>
                        {account.scope === 'personal' ? (
                          <div className={localStyles.sectionActions}>
                            <button
                              type="button"
                              className={`app-button app-button-secondary ${localStyles.inlineActionButton}`}
                              onClick={() => void handleDisconnectAccount(account.id)}
                            >
                              연결 해제
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </article>

              <article className={localStyles.accountCard}>
                <div className={localStyles.panelHeader}>
                  <div className={localStyles.panelHeading}>
                    <strong className={localStyles.accountTitle}>구글 메일</strong>
                  </div>
                  <span className={localStyles.inlineMeta}>{buildProviderStatusLabel(googleProviderStatus)}</span>
                </div>
                {googleProviderStatus ? (
                  <span className={localStyles.accountMeta}>{buildProviderStatusDetail(googleProviderStatus)}</span>
                ) : null}
                <div className={localStyles.sectionActions}>
                  <button
                    type="button"
                    className={`app-button app-button-primary ${localStyles.primaryActionButton}`}
                    onClick={() => void handleConnectGoogle()}
                    disabled={oauthProvider === 'google'}
                  >
                    {oauthProvider === 'google' ? '이동 중...' : '구글 로그인으로 연결'}
                  </button>
                </div>
              </article>
            </div>

            <div className={localStyles.accountColumn}>
              <article className={localStyles.accountCard}>
                <div className={localStyles.panelHeader}>
                  <div className={localStyles.panelHeading}>
                    <strong className={localStyles.accountTitle}>OAuth 연결 상태</strong>
                  </div>
                  <button
                    type="button"
                    className={`app-button app-button-secondary ${localStyles.inlineActionButton}`}
                    onClick={() => void handleRefreshAccountState()}
                    disabled={accountStateLoading}
                  >
                    상태 새로고침
                  </button>
                </div>
                <div className={localStyles.providerStatusGrid}>
                  {providerStatuses.map((provider) => (
                    <div key={provider.provider} className={localStyles.providerStatusCard}>
                      <div className={localStyles.accountTitleRow}>
                        <strong className={localStyles.accountTitle}>
                          {provider.provider === 'google' ? '구글 메일' : '네이버 메일'}
                        </strong>
                        <span className={localStyles.inlineMeta}>{buildProviderStatusLabel(provider)}</span>
                      </div>
                      <span className={localStyles.accountMeta}>{buildProviderStatusDetail(provider)}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className={localStyles.accountCard}>
                <div className={localStyles.panelHeader}>
                  <div className={localStyles.panelHeading}>
                    <strong className={localStyles.accountTitle}>네이버 메일</strong>
                  </div>
                  <span className={localStyles.inlineMeta}>{buildProviderStatusLabel(naverProviderStatus)}</span>
                </div>
                {naverProviderStatus ? (
                  <span className={localStyles.accountMeta}>{buildProviderStatusDetail(naverProviderStatus)}</span>
                ) : null}
                <div className={localStyles.sectionActions}>
                  <button
                    type="button"
                    className={`app-button app-button-primary ${localStyles.primaryActionButton}`}
                    onClick={() => void handleConnectNaverOauth()}
                    disabled={oauthProvider === 'naver_mail'}
                  >
                    {oauthProvider === 'naver_mail' ? '이동 중...' : '네이버 로그인으로 연결'}
                  </button>
                </div>
                <div className={localStyles.formDivider} />
                <strong className={localStyles.accountTitle}>앱 비밀번호</strong>
                <div className={localStyles.fieldStack}>
                  <label className={localStyles.field}>
                    <span className={localStyles.fieldLabel}>이메일</span>
                    <input
                      className="app-input"
                      value={naverForm.email}
                      onChange={(event) => setNaverForm((current) => ({ ...current, email: event.target.value }))}
                    />
                  </label>
                  <label className={localStyles.field}>
                    <span className={localStyles.fieldLabel}>표시 이름</span>
                    <input
                      className="app-input"
                      value={naverForm.displayName}
                      onChange={(event) =>
                        setNaverForm((current) => ({ ...current, displayName: event.target.value }))
                      }
                    />
                  </label>
                  <label className={localStyles.field}>
                    <span className={localStyles.fieldLabel}>앱 비밀번호</span>
                    <input
                      className="app-input"
                      type="password"
                      value={naverForm.appPassword}
                      onChange={(event) =>
                        setNaverForm((current) => ({ ...current, appPassword: event.target.value }))
                      }
                    />
                  </label>
                </div>
                <div className={localStyles.sectionActions}>
                  <button
                    type="button"
                    className={`app-button app-button-primary ${localStyles.primaryActionButton}`}
                    onClick={() => void handleConnectNaverAppPassword()}
                    disabled={!naverForm.email.trim()}
                  >
                    앱 비밀번호로 연결
                  </button>
                </div>
              </article>
            </div>
          </div>
        ) : (
          <div className={localStyles.workspace}>
            <section className={localStyles.listCard}>
              <div className={localStyles.panelHeader}>
                <div className={localStyles.panelHeading}>
                  <h3 className={localStyles.panelTitle}>{activeTabMeta.title}</h3>
                  <p className={localStyles.panelDescription}>
                    표시 {threadRangeStart}-{threadRangeEnd} / 전체 {threadTotal}건
                  </p>
                </div>
                <div className={localStyles.pagination}>
                  <span className={localStyles.paginationMeta}>
                    {threadPage} / {threadPageCount}
                  </span>
                  <button
                    type="button"
                    className={`app-button app-button-secondary ${localStyles.paginationButton}`}
                    onClick={() => setThreadOffset((current) => Math.max(0, current - THREAD_PAGE_SIZE))}
                    disabled={threadOffset === 0}
                  >
                    이전
                  </button>
                  <button
                    type="button"
                    className={`app-button app-button-secondary ${localStyles.paginationButton}`}
                    onClick={() =>
                      setThreadOffset((current) =>
                        current + THREAD_PAGE_SIZE >= threadTotal ? current : current + THREAD_PAGE_SIZE,
                      )
                    }
                    disabled={threadOffset + THREAD_PAGE_SIZE >= threadTotal}
                  >
                    다음
                  </button>
                </div>
              </div>
              <div className={localStyles.threadList}>
                {threads.length === 0 ? (
                  <div className={localStyles.emptyState}>{threadEmptyMessage}</div>
                ) : (
                  threads.map((thread) => (
                    <button
                      key={thread.id}
                      type="button"
                      className={`${localStyles.threadCard} ${
                        selectedThreadId === thread.id ? localStyles.threadCardActive : ''
                      }`}
                      onClick={() => setSelectedThreadId(thread.id)}
                    >
                      <div className={localStyles.threadTitleRow}>
                        <span className={localStyles.threadSubject}>{thread.subject || '(제목 없음)'}</span>
                        {thread.unreadCount > 0 ? (
                          <span className={localStyles.threadBadge}>{thread.unreadCount}</span>
                        ) : null}
                      </div>
                      <span className={localStyles.threadSnippet}>{thread.snippet || '-'}</span>
                      <span className={localStyles.threadMeta}>
                        {hasMultipleAccounts
                          ? `${thread.accountDisplayName} · ${formatDateTime(thread.lastMessageAt)}`
                          : formatDateTime(thread.lastMessageAt)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </section>

            <div className={localStyles.detailColumn}>
              <section className={localStyles.subCard}>
                <div className={localStyles.panelHeader}>
                  <div className={localStyles.panelHeading}>
                    <h3 className={localStyles.panelTitle}>
                      {threadDetail ? threadDetail.thread.subject || '(제목 없음)' : '대화 보기'}
                    </h3>
                    <p className={localStyles.panelDescription}>
                      {threadDetail
                        ? hasMultipleAccounts
                          ? `${threadDetail.thread.accountDisplayName} · ${formatDateTime(threadDetail.thread.lastMessageAt)}`
                          : formatDateTime(threadDetail.thread.lastMessageAt)
                        : detailEmptyMessage}
                    </p>
                  </div>
                </div>
                {threadDetail ? (
                  <>
                    <div className={localStyles.messageList}>
                      {threadDetail.messages.map((message) => (
                        <article
                          key={message.id}
                          className={`${localStyles.messageCard} ${
                            message.direction === 'incoming'
                              ? localStyles.messageIncoming
                              : localStyles.messageOutgoing
                          }`}
                        >
                          <strong className={localStyles.threadSubject}>
                            {message.direction === 'incoming' ? '수신' : '발신'} · {message.subject}
                          </strong>
                          <span className={localStyles.messageMeta}>
                            {message.fromEmail} · {formatDateTime(message.sentAt || message.createdAt)}
                          </span>
                          <div className={localStyles.messageBody}>{message.body}</div>
                        </article>
                      ))}
                    </div>
                    <p className={localStyles.detailHint}>
                      보고서 연결: {threadDetail.thread.reportKey || '-'} / 읽지 않은 메일 {threadDetail.thread.unreadCount}건
                    </p>
                  </>
                ) : (
                  <div className={localStyles.emptyState}>{detailEmptyMessage}</div>
                )}
              </section>

              <section className={localStyles.subCard}>
                <div className={localStyles.panelHeader}>
                  <div className={localStyles.panelHeading}>
                    <h3 className={localStyles.panelTitle}>{composeTitle}</h3>
                  </div>
                </div>
                <div className={localStyles.composeGrid}>
                  {hasMultipleAccounts ? (
                    <label className={localStyles.field}>
                      <span className={localStyles.fieldLabel}>보내는 계정</span>
                      <select
                        className="app-select"
                        value={selectedAccountId}
                        onChange={(event) => setSelectedAccountId(event.target.value)}
                      >
                        {accounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.mailboxLabel}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <div className={localStyles.field}>
                      <span className={localStyles.fieldLabel}>작성자</span>
                      <div className={localStyles.readonlyValue}>
                        {mailboxOwnerLabel}
                      </div>
                    </div>
                  )}
                  <label className={localStyles.field}>
                    <span className={localStyles.fieldLabel}>받는 사람</span>
                    <input
                      className="app-input"
                      value={compose.to}
                      onChange={(event) => setCompose((current) => ({ ...current, to: event.target.value }))}
                      placeholder="example@domain.com, contact@domain.com"
                    />
                  </label>
                  <label className={localStyles.fieldWide}>
                    <span className={localStyles.fieldLabel}>제목</span>
                    <input
                      className="app-input"
                      value={compose.subject}
                      onChange={(event) => setCompose((current) => ({ ...current, subject: event.target.value }))}
                    />
                  </label>
                  <label className={localStyles.fieldWide}>
                    <span className={localStyles.fieldLabel}>본문</span>
                    <textarea
                      className="app-textarea"
                      rows={8}
                      value={compose.body}
                      onChange={(event) => setCompose((current) => ({ ...current, body: event.target.value }))}
                      placeholder={
                        tab === 'reports'
                          ? '보고서 발송용 안내 문구를 입력하세요.'
                          : '스레드에 답장할 내용을 입력하세요.'
                      }
                    />
                  </label>
                  <div className={localStyles.composeFooter}>
                    {tab === 'reports' ? (
                      <span className={localStyles.inlineMeta}>
                        보고서 {reportKey || '-'} / 현장 {siteId || '-'}
                      </span>
                    ) : (
                      <span className={localStyles.inlineMeta}>
                        {mailboxOwnerMeta}
                      </span>
                    )}
                    <div className={localStyles.composeActions}>
                      <button
                        type="button"
                        className={`app-button app-button-primary ${localStyles.submitButton}`}
                        onClick={() => void handleSend()}
                        disabled={!selectedAccount || !compose.to.trim() || !compose.subject.trim() || !compose.body.trim()}
                      >
                        메일 발송
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default MailboxPanel;
