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
  mode: 'admin' | 'worker';
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

export function MailboxPanel({ mode }: MailboxPanelProps) {
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
  const [selectedThreadId, setSelectedThreadId] = useState(() => searchParams.get('threadId') || '');
  const [threadDetail, setThreadDetail] = useState<MailThreadDetail | null>(null);
  const [loading, setLoading] = useState(false);
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
  const providerStatusMap = useMemo(
    () => new Map(providerStatuses.map((provider) => [provider.provider, provider])),
    [providerStatuses],
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
        setLoading(true);
        const [response, providerResponse] = await Promise.all([
          fetchMailAccounts(),
          fetchMailProviderStatuses(),
        ]);
        setAccounts(response.rows);
        setProviderStatuses(providerResponse.rows);
        setSelectedAccountId((current) => current || response.rows[0]?.id || '');
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : '메일 계정을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (tab === 'accounts') return;
    void (async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchMailThreads({
          accountId: selectedAccountId,
          box: tab,
          headquarterId,
          query,
          reportKey: tab === 'reports' ? reportKey : '',
          siteId,
        });
        setThreads(response.rows);
        setSelectedThreadId((current) => current || response.rows[0]?.id || '');
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : '메일 스레드를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    })();
  }, [headquarterId, query, reportKey, selectedAccountId, siteId, tab]);

  useEffect(() => {
    if (!selectedThreadId || tab === 'accounts') {
      setThreadDetail(null);
      return;
    }
    void (async () => {
      try {
        setLoading(true);
        const detail = await fetchMailThreadDetail(selectedThreadId);
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
        setLoading(false);
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
        query,
        reportKey: tab === 'reports' ? reportKey : '',
        siteId,
      });
      setThreads(nextThreads.rows);
      if (selectedThreadId) {
        setThreadDetail(await fetchMailThreadDetail(selectedThreadId));
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
      const connected = await connectNaverMail(naverForm);
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

  return (
    <section className={`${styles.sectionCard} ${styles.listSectionCard}`}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>{mode === 'admin' ? '통합 메일함' : '개인 메일함'}</h2>
        </div>
        <div className={styles.sectionHeaderActions}>
          <button type="button" className="app-button app-button-secondary" onClick={() => void handleSync()}>
            동기화
          </button>
        </div>
      </div>

      <div className={`${styles.sectionBody} ${localStyles.shell}`}>
        {error ? <div className={styles.bannerError}>{error}</div> : null}
        {notice ? <div className={styles.bannerNotice}>{notice}</div> : null}

        <div className={localStyles.toolbar}>
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
          <select
            className={`app-select ${localStyles.toolbarField}`}
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
          {tab !== 'accounts' ? (
            <input
              className={`app-input ${localStyles.toolbarField}`}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="제목, 본문, 주소 검색"
            />
          ) : null}
        </div>

        {tab === 'accounts' ? (
          <div className={localStyles.accountGrid}>
            <article className={localStyles.accountCard}>
              <div className={localStyles.accountTitleRow}>
                <strong className={localStyles.accountTitle}>연결된 계정</strong>
                <span className="app-chip">{accounts.length}개</span>
              </div>
              {accounts.length === 0 ? (
                <div className={localStyles.emptyState}>연결된 메일 계정이 없습니다.</div>
              ) : (
                accounts.map((account) => (
                  <div key={account.id} className={localStyles.accountCard}>
                    <div className={localStyles.accountTitleRow}>
                      <strong className={localStyles.accountTitle}>{account.mailboxLabel}</strong>
                      <span className="app-chip">
                        {account.scope === 'shared' ? '공용' : '개인'} · {account.provider}
                      </span>
                    </div>
                    <span className={localStyles.accountMeta}>{account.email}</span>
                    <span className={localStyles.accountMeta}>
                      최근 동기화 {formatDateTime(account.lastSyncedAt)}
                    </span>
                    {account.scope === 'personal' ? (
                      <div className={localStyles.sectionActions}>
                        <button
                          type="button"
                          className="app-button app-button-secondary"
                          onClick={() => void handleDisconnectAccount(account.id)}
                        >
                          연결 해제
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </article>

            <article className={localStyles.accountCard}>
              <div className={localStyles.accountTitleRow}>
                <strong className={localStyles.accountTitle}>OAuth 연결 상태</strong>
                <span className="app-chip">{providerStatuses.length}개 공급자</span>
              </div>
              <div className={localStyles.sectionActions}>
                {providerStatuses.map((provider) => (
                  <div key={provider.provider} className={localStyles.accountCard}>
                    <div className={localStyles.accountTitleRow}>
                      <strong className={localStyles.accountTitle}>
                        {provider.provider === 'google' ? '구글 메일' : '네이버 메일'}
                      </strong>
                      <span className="app-chip">
                        {provider.enabled ? (provider.isRedirectAllowed ? '연결 가능' : 'redirect 확인 필요') : '설정 필요'}
                      </span>
                    </div>
                    <span className={localStyles.accountMeta}>{provider.message}</span>
                    <span className={localStyles.accountMeta}>
                      기본 콜백 {provider.defaultRedirectUri || '-'}
                    </span>
                    {provider.allowedRedirectUris.length > 0 ? (
                      <span className={localStyles.accountMeta}>
                        허용 콜백 {provider.allowedRedirectUris.join(', ')}
                      </span>
                    ) : null}
                    {provider.missingFields.length > 0 ? (
                      <span className={localStyles.accountMeta}>
                        누락 설정 {provider.missingFields.join(', ')}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </article>

            <article className={localStyles.accountCard}>
              <strong className={localStyles.accountTitle}>구글 메일 로그인</strong>
              <p className={localStyles.accountMeta}>
                구글 승인 화면으로 이동한 뒤 연결이 완료되면 메일함으로 다시 돌아옵니다.
              </p>
              <button
                type="button"
                className="app-button app-button-primary"
                onClick={() => void handleConnectGoogle()}
                disabled={oauthProvider === 'google'}
              >
                {oauthProvider === 'google' ? '구글 로그인으로 이동 중...' : '구글 로그인으로 연결'}
              </button>
              {providerStatusMap.get('google') ? (
                <p className={localStyles.accountMeta}>{providerStatusMap.get('google')?.message}</p>
              ) : null}
            </article>

            <article className={localStyles.accountCard}>
              <strong className={localStyles.accountTitle}>네이버 메일 로그인</strong>
              <p className={localStyles.accountMeta}>
                네이버 로그인으로 계정을 연결합니다. 운영 환경에 따라 앱 비밀번호 연결도 함께 쓸 수 있습니다.
              </p>
              <div className={localStyles.sectionActions}>
                <button
                  type="button"
                  className="app-button app-button-primary"
                  onClick={() => void handleConnectNaverOauth()}
                  disabled={oauthProvider === 'naver_mail'}
                >
                  {oauthProvider === 'naver_mail' ? '네이버 로그인으로 이동 중...' : '네이버 로그인으로 연결'}
                </button>
              </div>
              {providerStatusMap.get('naver_mail') ? (
                <p className={localStyles.accountMeta}>{providerStatusMap.get('naver_mail')?.message}</p>
              ) : null}
              <strong className={localStyles.accountTitle}>네이버 앱 비밀번호 연결</strong>
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
              <button
                type="button"
                className="app-button app-button-primary"
                onClick={() => void handleConnectNaverAppPassword()}
                disabled={!naverForm.email.trim()}
              >
                앱 비밀번호로 연결
              </button>
            </article>
          </div>
        ) : (
          <div className={localStyles.workspace}>
            <div className={localStyles.threadColumn}>
              <div className={localStyles.threadList}>
                {threads.length === 0 ? (
                  <div className={localStyles.emptyState}>
                    {loading ? '메일을 불러오는 중입니다.' : '조건에 맞는 메일 스레드가 없습니다.'}
                  </div>
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
                        {thread.accountDisplayName} · {formatDateTime(thread.lastMessageAt)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className={localStyles.detailColumn}>
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
                <div className={localStyles.emptyState}>
                  {tab === 'reports'
                    ? '보고서 발송용 메일을 작성할 수 있습니다.'
                    : '왼쪽에서 메일 스레드를 선택하면 상세 내용을 볼 수 있습니다.'}
                </div>
              )}

              <div className={localStyles.composeGrid}>
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
                <div className={localStyles.sectionActions}>
                  <button
                    type="button"
                    className="app-button app-button-primary"
                    onClick={() => void handleSend()}
                    disabled={!selectedAccount || !compose.to.trim() || !compose.subject.trim() || !compose.body.trim()}
                  >
                    메일 발송
                  </button>
                  {tab === 'reports' ? (
                    <span className="app-chip">
                      보고서 {reportKey || '-'} / 현장 {siteId || '-'}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default MailboxPanel;
