'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import {
  fetchMailAccounts,
  fetchMailProviderStatuses,
  fetchMailRecipientSuggestions,
  fetchMailThreadDetail,
  fetchMailThreads,
} from '@/lib/mail/apiClient';
import { fetchSafetyReportList, readSafetyAuthToken } from '@/lib/safetyApi';
import type {
  MailAccount,
  MailProviderStatus,
  MailThread,
  MailThreadDetail,
} from '@/types/mail';
import {
  getDemoMailboxAccounts,
  getDemoMailboxThreadDetail,
  getDemoMailboxThreads,
  MAILBOX_DEMO_SESSION_KEY,
} from './demoMailboxData';
import { MailboxHeaderPanel } from './MailboxHeaderPanel';
import { MailboxComposeSection } from './MailboxComposeSection';
import { MailboxConnectWorkspace } from './MailboxConnectWorkspace';
import { MailboxReportPickerModal } from './MailboxReportPickerModal';
import { MailboxThreadDetailSection } from './MailboxThreadDetailSection';
import { MailboxThreadListSection } from './MailboxThreadListSection';
import {
  buildComposeState,
  formatMailBodyHtml,
  isLikelyEmail,
  stripHtmlToText,
} from './mailboxComposeHelpers';
import {
  MAILBOX_TAB_META,
  type ComposeAttachment,
  type ComposeMode,
  type ComposeState,
  type MailboxPanelProps,
  type MailboxReportOption,
  type MailboxTab,
  type MailboxView,
  type MailSendProgressState,
  type RecipientSuggestionItem,
  type SelectedReportContext,
  THREAD_PAGE_SIZE,
} from './mailboxPanelTypes';
import {
  buildProviderStatusDetail,
  buildProviderStatusLabel,
  buildSyncStatusSummary,
  buildThreadTimestamp,
  normalizeMailAccountUi,
  normalizeMailThreadDetailUi,
  normalizeMailThreadUi,
  readMailAccountSyncMetadata,
} from './mailboxPanelHelpers';
import {
  buildThreadCounterparty,
  deriveInitialComposeMode,
  deriveInitialView,
  deriveMailboxTab,
  persistDemoMailboxMode,
} from './mailboxViewHelpers';
import { useMailboxAccountActions } from './useMailboxAccountActions';
import { useMailboxComposeUiActions } from './useMailboxComposeUiActions';
import { useMailboxRecipientActions } from './useMailboxRecipientActions';
import { useMailboxSendAction } from './useMailboxSendAction';
import localStyles from './MailboxPanel.module.css';

export function MailboxPanel({
  mode,
  adminReports = [],
  adminSites = [],
}: MailboxPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    isAuthenticated,
    isReady,
    sites: workerSites,
  } = useInspectionSessions();
  const composerRef = useRef<HTMLDivElement | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const reportKey = searchParams.get('reportKey') || '';
  const siteId = searchParams.get('siteId') || '';
  const headquarterId = searchParams.get('headquarterId') || '';
  const [tab, setTab] = useState<MailboxTab>('all');
  const [view, setView] = useState<MailboxView>('list');
  const [composeMode, setComposeMode] = useState<ComposeMode>('new');
  const [query, setQuery] = useState('');
  const [accounts, setAccounts] = useState<MailAccount[]>([]);
  const [providerStatuses, setProviderStatuses] = useState<MailProviderStatus[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [threads, setThreads] = useState<MailThread[]>([]);
  const [threadOffset, setThreadOffset] = useState(0);
  const [threadTotal, setThreadTotal] = useState(0);
  const [selectedThreadId, setSelectedThreadId] = useState('');
  const [threadDetail, setThreadDetail] = useState<MailThreadDetail | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [accountStateLoading, setAccountStateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [oauthProvider, setOauthProvider] = useState<'google' | 'naver_mail' | null>(null);
  const [compose, setCompose] = useState<ComposeState>(() => buildComposeState());
  const [attachments, setAttachments] = useState<ComposeAttachment[]>([]);
  const [reportPickerOpen, setReportPickerOpen] = useState(false);
  const [reportPickerLoading, setReportPickerLoading] = useState(false);
  const [reportSearch, setReportSearch] = useState('');
  const [reportSiteFilter, setReportSiteFilter] = useState('');
  const [workerModalReports, setWorkerModalReports] = useState<MailboxReportOption[]>([]);
  const [selectedReport, setSelectedReport] = useState<SelectedReportContext | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [mailSendProgress, setMailSendProgress] = useState<MailSendProgressState | null>(null);
  const [recipientSuggestions, setRecipientSuggestions] = useState<RecipientSuggestionItem[]>([]);
  const [recipientSuggestionsLoading, setRecipientSuggestionsLoading] = useState(false);
  const [recipientSuggestionsOpen, setRecipientSuggestionsOpen] = useState(false);
  const [recipientSuggestionIndex, setRecipientSuggestionIndex] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.removeItem(MAILBOX_DEMO_SESSION_KEY);
    setIsDemoMode(false);
  }, []);

  useEffect(() => {
    const nextBox = searchParams.get('box');
    if (nextBox === 'accounts') {
      const nextSearchParams = new URLSearchParams(searchParams.toString());
      nextSearchParams.set('box', 'all');
      router.replace(`${pathname}?${nextSearchParams.toString()}`, { scroll: false });
      return;
    }
    const nextThreadId = searchParams.get('threadId') || '';
    const nextTab = deriveMailboxTab(nextBox);
    setTab(nextTab);
    setSelectedThreadId(nextThreadId);
    setComposeMode(
      deriveInitialComposeMode({
        box: nextBox,
        headquarterId,
        reportKey,
        siteId,
      }),
    );
    setSelectedReport(
      reportKey || siteId || headquarterId
        ? {
            headquarterId,
            headquarterName: '',
          recipientEmail: '',
          documentKind: null,
          meta: {},
          reportKey,
          reportType: null,
          reportTitle: reportKey || '보고서',
          siteId,
          siteName: '',
            updatedAt: null,
            visitDate: null,
          }
        : null,
    );
    setView(
      deriveInitialView({
        box: nextBox,
        threadId: nextThreadId,
      }),
    );
    setReportSiteFilter(siteId || '');
  }, [headquarterId, pathname, reportKey, router, searchParams, siteId]);

  const selectableAccounts = useMemo(() => {
    const personalAccounts = accounts.filter((account) => account.scope === 'personal');
    return personalAccounts.length > 0 ? personalAccounts : accounts;
  }, [accounts]);
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
  const selectedAccountSyncMeta = useMemo(() => readMailAccountSyncMetadata(selectedAccount), [selectedAccount]);
  const syncStatusSummary = useMemo(() => buildSyncStatusSummary(selectedAccountSyncMeta), [selectedAccountSyncMeta]);
  const activeTabMeta = MAILBOX_TAB_META[tab];
  const providerStatusMap = useMemo(
    () => new Map(providerStatuses.map((provider) => [provider.provider, provider])),
    [providerStatuses],
  );
  const googleProviderStatus = providerStatusMap.get('google');
  const naverProviderStatus = providerStatusMap.get('naver_mail');
  const googleProviderStatusLabel = buildProviderStatusLabel(googleProviderStatus);
  const googleProviderStatusDetail = buildProviderStatusDetail(googleProviderStatus);
  const naverProviderStatusLabel = buildProviderStatusLabel(naverProviderStatus);
  const naverProviderStatusDetail = buildProviderStatusDetail(naverProviderStatus);
  const hasMultipleAccounts = selectableAccounts.length > 1;
  const hasPersonalAccount = accounts.some((account) => account.scope === 'personal');
  const adminSiteById = useMemo(
    () => new Map(adminSites.map((item) => [item.id, item])),
    [adminSites],
  );
  const adminReportOptions = useMemo(
    () =>
      adminReports.map((item) => {
        const matchedSite = adminSiteById.get(item.site_id);
        return {
          headquarterId: item.headquarter_id || '',
          headquarterName:
            matchedSite?.headquarter_detail?.name || matchedSite?.headquarter?.name || '',
          recipientEmail: matchedSite?.site_contact_email || '',
          documentKind: item.document_kind ?? null,
          meta: item.meta,
          reportKey: item.report_key,
          reportType: item.report_type ?? null,
          reportTitle: item.report_title,
          siteId: item.site_id,
          siteName: matchedSite?.site_name || item.site_id,
          updatedAt: item.updated_at,
          visitDate: item.visit_date,
        };
      }),
    [adminReports, adminSiteById],
  );
  const workerReportOptions = useMemo(() => workerModalReports, [workerModalReports]);
  const reportOptions = mode === 'admin' ? adminReportOptions : workerReportOptions;
  const listScopeMeta = useMemo(
    () => [hasMultipleAccounts && selectedAccount ? selectedAccount.mailboxLabel : ''].filter(Boolean),
    [hasMultipleAccounts, selectedAccount],
  );
  const visibleRecipientSuggestions = useMemo(
    () =>
      recipientSuggestions.filter(
        (item) =>
          !compose.toRecipients.some((recipient) => recipient.toLowerCase() === item.email.toLowerCase()),
      ),
    [compose.toRecipients, recipientSuggestions],
  );

  useEffect(() => {
    if (!selectedReport) return;
    const matchedReport = reportOptions.find((item) =>
      selectedReport.reportKey
        ? item.reportKey === selectedReport.reportKey
        : item.siteId === selectedReport.siteId,
    );
    if (!matchedReport) return;
    setSelectedReport((current) => {
      if (!current) return current;
      if (
        current.reportTitle === matchedReport.reportTitle &&
        current.siteName === matchedReport.siteName &&
        current.headquarterName === matchedReport.headquarterName
      ) {
        return current;
      }
      return matchedReport;
    });
  }, [reportOptions, selectedReport]);

  useEffect(() => {
    if (isDemoMode || mode !== 'worker' || !reportPickerOpen || !isAuthenticated || !isReady) return;
    const token = readSafetyAuthToken();
    if (!token) return;
    let cancelled = false;
    void (async () => {
      try {
        setReportPickerLoading(true);
        const nextRows = await Promise.all(
          workerSites.map(async (workerSite) => {
            const reports = await fetchSafetyReportList(token, {
              activeOnly: true,
              limit: 200,
              siteId: workerSite.id,
            });
            return reports.map((item) => ({
              headquarterId: item.headquarter_id || workerSite.headquarterId || '',
              headquarterName: workerSite.customerName || '',
              recipientEmail: workerSite.adminSiteSnapshot.siteContactEmail || '',
              documentKind: item.document_kind ?? null,
              meta: item.meta,
              reportKey: item.report_key,
              reportType: item.report_type ?? null,
              reportTitle: item.report_title,
              siteId: item.site_id,
              siteName: workerSite.siteName,
              updatedAt: item.updated_at,
              visitDate: item.visit_date,
            }));
          }),
        );
        if (!cancelled) {
          setWorkerModalReports(nextRows.flat());
        }
      } finally {
        if (!cancelled) {
          setReportPickerLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isDemoMode, isReady, mode, reportPickerOpen, workerSites]);

  useEffect(() => {
    if (!composerRef.current) return;
    if (composerRef.current.innerHTML === compose.body) return;
    composerRef.current.innerHTML = compose.body;
  }, [compose.body, view]);

  useEffect(() => {
    if (accounts.length === 0) {
      setSelectedAccountId('');
      return;
    }
    const selectedStillVisible = selectableAccounts.some((account) => account.id === selectedAccountId);
    if (!selectedStillVisible) {
      setSelectedAccountId(selectableAccounts[0]?.id || '');
    }
  }, [accounts, selectableAccounts, selectedAccountId]);

  useEffect(() => {
    if (isDemoMode || view !== 'compose' || !selectedAccountId) {
      setRecipientSuggestions([]);
      setRecipientSuggestionsLoading(false);
      setRecipientSuggestionIndex(0);
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        try {
          setRecipientSuggestionsLoading(true);
          const response = await fetchMailRecipientSuggestions({
            accountId: selectedAccountId,
            limit: 8,
            query: compose.toInput.trim(),
          });
          if (cancelled) return;
          setRecipientSuggestions(
            response.rows.map((item) => ({
              ...item,
              label: item.name ? `${item.name} <${item.email}>` : item.email,
            })),
          );
          setRecipientSuggestionIndex(0);
        } catch {
          if (!cancelled) {
            setRecipientSuggestions([]);
            setRecipientSuggestionIndex(0);
          }
        } finally {
          if (!cancelled) {
            setRecipientSuggestionsLoading(false);
          }
        }
      })();
    }, compose.toInput.trim() ? 120 : 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [compose.toInput, isDemoMode, selectedAccountId, view]);

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
    if (isDemoMode) {
      const demoAccounts = getDemoMailboxAccounts();
      setAccounts(demoAccounts);
      setProviderStatuses([]);
      setSelectedAccountId(demoAccounts[0]?.id || '');
      setAccountStateLoading(false);
      return;
    }

    void (async () => {
      try {
        setAccountStateLoading(true);
        const [response, providerResponse] = await Promise.all([
          fetchMailAccounts(),
          fetchMailProviderStatuses(),
        ]);
        const nextAccounts = response.rows.map(normalizeMailAccountUi);
        const nextSelectableAccounts = nextAccounts.filter((account) => account.scope === 'personal');
        setAccounts(nextAccounts);
        setProviderStatuses(providerResponse.rows);
        setSelectedAccountId((current) => current || nextSelectableAccounts[0]?.id || nextAccounts[0]?.id || '');
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : '메일 계정을 불러오지 못했습니다.');
      } finally {
        setAccountStateLoading(false);
      }
    })();
  }, [isDemoMode]);

  useEffect(() => {
    setThreadOffset(0);
  }, [headquarterId, query, reportKey, selectedAccountId, siteId, tab]);

  useEffect(() => {
    if (isDemoMode) {
      const demoThreads = getDemoMailboxThreads(tab, query).filter(
        (thread) => !selectedAccountId || thread.accountId === selectedAccountId,
      );
      setThreads(demoThreads);
      setThreadTotal(demoThreads.length);
      setSelectedThreadId((current) =>
        current && demoThreads.some((item) => item.id === current)
          ? current
          : demoThreads[0]?.id || '',
      );
      setThreadLoading(false);
      return;
    }

    void (async () => {
      try {
        setThreadLoading(true);
        setError(null);
        const response = await fetchMailThreads({
          accountId: selectedAccount?.id || '',
          box: tab,
          headquarterId,
          limit: THREAD_PAGE_SIZE,
          offset: threadOffset,
          query,
          reportKey: '',
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
  }, [headquarterId, isDemoMode, query, reportKey, selectedAccount, selectedAccountId, siteId, tab, threadOffset]);

  useEffect(() => {
    if (isDemoMode) {
      if (!selectedThreadId || view !== 'thread') {
        setThreadDetail(null);
        setThreadLoading(false);
        return;
      }
      setThreadLoading(true);
      setThreadDetail(getDemoMailboxThreadDetail(selectedThreadId));
      setThreadLoading(false);
      return;
    }

    if (!selectedThreadId || view !== 'thread') {
      setThreadDetail(null);
      setThreadLoading(false);
      return;
    }
    void (async () => {
      try {
        setThreadLoading(true);
        const detail = normalizeMailThreadDetailUi(await fetchMailThreadDetail(selectedThreadId));
        setThreadDetail(detail);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : '메일 스레드 상세를 불러오지 못했습니다.');
      } finally {
        setThreadLoading(false);
      }
    })();
  }, [isDemoMode, selectedAccount, selectedThreadId, view]);

  useEffect(() => {
    if (composeMode !== 'report' || !selectedReport?.reportKey) return;
    setCompose((current) => ({
      ...current,
      subject: current.subject || `[보고서] ${selectedReport.reportTitle || selectedReport.reportKey}`,
      toRecipients:
        current.toRecipients.length > 0
          ? current.toRecipients
          : selectedReport.recipientEmail && isLikelyEmail(selectedReport.recipientEmail)
            ? [selectedReport.recipientEmail]
            : current.toRecipients,
    }));
  }, [composeMode, selectedReport]);

  const resetCompose = (mode: ComposeMode) => {
    setCompose(
      buildComposeState({
        subject:
          mode === 'report' && selectedReport?.reportKey
            ? `[보고서] ${selectedReport.reportTitle || selectedReport.reportKey}`
            : '',
      }),
    );
    setAttachments([]);
  };

  const handleDisableDemoMode = (options?: { silent?: boolean }) => {
    persistDemoMailboxMode(false);
    setIsDemoMode(false);
    setAccounts([]);
    setThreads([]);
    setThreadTotal(0);
    setSelectedThreadId('');
    setThreadDetail(null);
    setSelectedReport(null);
    resetCompose('new');
    setView('list');
    if (!options?.silent) {
      setNotice('데모 메일함을 종료했습니다.');
    }
  };

  const handleOpenThread = (threadId: string) => {
    setSelectedThreadId(threadId);
    setThreadDetail(null);
    setView('thread');
  };

  const handleChangeMailboxTab = (nextTab: MailboxTab) => {
    setTab(nextTab);
    setSelectedThreadId('');
    setThreadDetail(null);
    setView('list');
    setThreadOffset(0);
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.set('box', nextTab);
    nextSearchParams.delete('threadId');
    router.replace(`${pathname}?${nextSearchParams.toString()}`, { scroll: false });
  };

  const handleBackToList = () => {
    setView('list');
  };

  const {
    handleConnectGoogle,
    handleConnectNaverOauth,
    handleDisconnectSelectedAccount,
    handleRefreshAccountState,
    handleSync,
  } = useMailboxAccountActions({
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
  });

  const {
    handleRecipientBlur,
    handleRecipientInputChange,
    handleRecipientKeyDown,
    handleRecipientSuggestionSelect,
    handleRemoveRecipient,
  } = useMailboxRecipientActions({
    compose,
    recipientSuggestionIndex,
    recipientSuggestionsOpen,
    setCompose,
    setRecipientSuggestionIndex,
    setRecipientSuggestionsOpen,
    visibleRecipientSuggestions,
  });

  const {
    handleAttachmentSelect,
    handleClearSelectedReport,
    handleComposerCommand,
    handleComposerInput,
    handleComposerLink,
    handleOpenCompose,
    handleOpenReportPicker,
    handleRemoveAttachment,
    handleReply,
    handleSelectReport,
  } = useMailboxComposeUiActions({
    attachmentInputRef,
    composeMode,
    composerRef,
    selectedAccount,
    selectedReport,
    setAttachments,
    setCompose,
    setComposeMode,
    setReportPickerOpen,
    setReportSearch,
    setReportSiteFilter,
    setSelectedReport,
    setView,
    siteId,
    threadDetail,
    resetCompose,
  });

  const { handleSend } = useMailboxSendAction({
    attachments,
    compose,
    composeMode,
    isDemoMode,
    query,
    resetCompose,
    selectedAccount,
    selectedReport,
    selectedThreadId,
    setComposeMode,
    setError,
    setMailSendProgress,
    setNotice,
    setSelectedReport,
    setThreadDetail,
    setThreadTotal,
    setThreads,
    setView,
    siteId,
    tab,
    threadDetail,
    threadOffset,
  });

  const threadPage = Math.floor(threadOffset / THREAD_PAGE_SIZE) + 1;
  const threadPageCount = Math.max(1, Math.ceil(threadTotal / THREAD_PAGE_SIZE));
  const threadRangeStart = threadTotal === 0 ? 0 : threadOffset + 1;
  const threadRangeEnd = Math.min(threadOffset + threads.length, threadTotal);
  const canGoPrevThreadPage = threadOffset > 0;
  const canGoNextThreadPage = threadOffset + THREAD_PAGE_SIZE < threadTotal;
  const composeTitle =
    composeMode === 'reply' ? '답장 작성' : composeMode === 'report' ? '보고서 메일 보내기' : '메일 보내기';
  const listPrimaryColumnLabel = tab === 'sent' ? '받는 사람' : '상대방';
  const threadEmptyMessage = threadLoading ? '메일을 불러오는 중입니다.' : activeTabMeta.empty;
  const detailEmptyMessage = '메일을 선택하면 상세 내용을 볼 수 있습니다.';
  const composePlainText = stripHtmlToText(compose.body);
  const showMailboxConnectGate = !isDemoMode && accounts.length === 0;
  const showMailboxConnectPrompt = !isDemoMode && !showMailboxConnectGate && !hasPersonalAccount;
  const isSendingMail = Boolean(mailSendProgress);
  const mailboxLead =
    mode === 'admin'
      ? '보고서 발송, 실제 수신 메일 확인, 연결 계정 관리를 한 화면에서 이어서 처리합니다.'
      : '개인 메일 계정으로 보고서 발송과 메일 확인을 같은 흐름에서 처리할 수 있습니다.';
  const filteredReportOptions = useMemo(() => {
    const normalizedQuery = reportSearch.trim().toLowerCase();
    return reportOptions
      .filter((item) => (mode === 'admin' && reportSiteFilter ? item.siteId === reportSiteFilter : true))
      .filter((item) => {
        if (!normalizedQuery) return true;
        return [
          item.reportTitle,
          item.reportKey,
          item.siteName,
          item.headquarterName,
          item.visitDate || '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .sort((left, right) => (right.updatedAt || '').localeCompare(left.updatedAt || ''));
  }, [mode, reportOptions, reportSearch, reportSiteFilter]);
  const filteredReportOptionsByKey = useMemo(
    () => new Map(filteredReportOptions.map((option) => [option.reportKey, option] as const)),
    [filteredReportOptions],
  );
  const threadRows = useMemo(
    () =>
      threads.map((thread) => ({
        id: thread.id,
        isUnread: (tab === 'all' || tab === 'inbox') && thread.unreadCount > 0,
        partyLabel: buildThreadCounterparty(thread, selectedAccount?.email || ''),
        subject: thread.subject || '(제목 없음)',
        timestamp: buildThreadTimestamp(thread),
      })),
    [selectedAccount?.email, tab, threads],
  );
  const threadDetailTitle = threadDetail ? threadDetail.thread.subject || '(제목 없음)' : '메일 상세';
  const threadDetailDescription = threadDetail
    ? `${buildThreadCounterparty(threadDetail.thread, selectedAccount?.email || '')} · ${buildThreadTimestamp(threadDetail.thread)}`
    : detailEmptyMessage;
  const threadDetailHints = threadDetail
    ? [
        `읽지 않은 메일 ${threadDetail.thread.unreadCount}건`,
        `메시지 ${threadDetail.thread.messageCount}건`,
        `계정 ${threadDetail.thread.accountDisplayName}`,
        ...(threadDetail.thread.reportKey ? [`보고서 ${threadDetail.thread.reportKey}`] : []),
      ]
    : [];

  const moveThreadPage = (nextPage: number) => {
    const boundedPage = Math.min(Math.max(1, nextPage), threadPageCount);
    setThreadOffset((boundedPage - 1) * THREAD_PAGE_SIZE);
  };

  useEffect(() => {
    if (!showMailboxConnectGate) return;
    setView('list');
    setSelectedThreadId('');
    setThreadDetail(null);
  }, [showMailboxConnectGate]);

  return (
    <section className={`${styles.sectionCard} ${styles.listSectionCard}`}>
      <MailboxHeaderPanel
        accountStateLoading={accountStateLoading}
        disconnectableAccount={disconnectableAccount}
        hasMultipleAccounts={hasMultipleAccounts}
        listScopeMeta={listScopeMeta}
        mailboxLead={mailboxLead}
        query={query}
        selectedAccountId={selectedAccountId}
        selectableAccounts={selectableAccounts}
        showMailboxConnectGate={showMailboxConnectGate}
        syncStatusSummary={syncStatusSummary}
        tab={tab}
        view={view}
        onChangeAccountId={setSelectedAccountId}
        onChangeMailboxTab={handleChangeMailboxTab}
        onChangeQuery={setQuery}
        onDisconnectSelectedAccount={() => void handleDisconnectSelectedAccount()}
        onOpenCompose={() => handleOpenCompose()}
        onSync={() => void handleSync()}
      />

      <div className={`${styles.sectionBody} ${localStyles.shell}`}>
        {error ? <div className={styles.bannerError}>{error}</div> : null}
        {notice ? <div className={styles.bannerNotice}>{notice}</div> : null}
        <div className={`${localStyles.workspace} ${localStyles.workspaceSingle}`}>
          <div
            className={localStyles.mainColumn}
            data-mailbox-workspace={showMailboxConnectGate ? undefined : 'true'}
          >
            {showMailboxConnectPrompt ? (
              <MailboxConnectWorkspace
                accountStateLoading={accountStateLoading}
                googleProviderStatusDetail={googleProviderStatusDetail}
                googleProviderStatusLabel={googleProviderStatusLabel}
                mode="prompt"
                naverProviderStatusDetail={naverProviderStatusDetail}
                naverProviderStatusLabel={naverProviderStatusLabel}
                oauthProvider={oauthProvider}
                onConnectGoogle={() => void handleConnectGoogle()}
                onConnectNaver={() => void handleConnectNaverOauth()}
                onRefreshAccountState={() => void handleRefreshAccountState()}
              />
            ) : null}

            {showMailboxConnectGate ? (
              <MailboxConnectWorkspace
                accountStateLoading={accountStateLoading}
                googleProviderStatusDetail={googleProviderStatusDetail}
                googleProviderStatusLabel={googleProviderStatusLabel}
                mode="gate"
                naverProviderStatusDetail={naverProviderStatusDetail}
                naverProviderStatusLabel={naverProviderStatusLabel}
                oauthProvider={oauthProvider}
                onConnectGoogle={() => void handleConnectGoogle()}
                onConnectNaver={() => void handleConnectNaverOauth()}
                onRefreshAccountState={() => void handleRefreshAccountState()}
              />
            ) : view === 'compose' ? (
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
                recipientSuggestions={visibleRecipientSuggestions}
                recipientSuggestionsLoading={recipientSuggestionsLoading}
                recipientSuggestionsOpen={recipientSuggestionsOpen}
                selectedAccountId={selectedAccountId}
                selectableAccounts={selectableAccounts}
                selectedReport={selectedReport}
                submitDisabled={
                  isDemoMode ||
                  isSendingMail ||
                  !selectedAccount ||
                  (compose.toRecipients.length === 0 && !isLikelyEmail(compose.toInput.trim())) ||
                  !compose.subject.trim() ||
                  !composePlainText.trim()
                }
                onAttachmentSelect={handleAttachmentSelect}
                onBlurRecipient={handleRecipientBlur}
                onChangeAccountId={setSelectedAccountId}
                onChangeRecipientInput={handleRecipientInputChange}
                onChangeSubject={(subject) => setCompose((current) => ({ ...current, subject }))}
                onClearSelectedReport={handleClearSelectedReport}
                onComposerCommand={handleComposerCommand}
                onComposerInput={handleComposerInput}
                onComposerLink={handleComposerLink}
                onFocusRecipient={() => setRecipientSuggestionsOpen(true)}
                onOpenReportPicker={handleOpenReportPicker}
                onRecipientKeyDown={handleRecipientKeyDown}
                onRemoveAttachment={handleRemoveAttachment}
                onRemoveRecipient={handleRemoveRecipient}
                onSelectRecipientSuggestion={handleRecipientSuggestionSelect}
                onSend={() => void handleSend()}
              />
            ) : view === 'list' ? (
              <MailboxThreadListSection
                canGoNextThreadPage={canGoNextThreadPage}
                canGoPrevThreadPage={canGoPrevThreadPage}
                emptyMessage={threadEmptyMessage}
                page={threadPage}
                pageCount={threadPageCount}
                primaryColumnLabel={listPrimaryColumnLabel}
                rangeEnd={threadRangeEnd}
                rangeStart={threadRangeStart}
                rows={threadRows}
                title={activeTabMeta.title}
                total={threadTotal}
                onMovePage={moveThreadPage}
                onOpenThread={handleOpenThread}
              />
            ) : view === 'thread' ? (
              <MailboxThreadDetailSection
                detailDescription={threadDetailDescription}
                detailEmptyMessage={detailEmptyMessage}
                detailHints={threadDetailHints}
                threadDetail={threadDetail}
                title={threadDetailTitle}
                onBackToList={handleBackToList}
                onReply={handleReply}
                renderMessageBodyHtml={formatMailBodyHtml}
              />
            ) : null}
          </div>
        </div>
      </div>

      <MailboxReportPickerModal
        filteredReportOptions={filteredReportOptions}
        mode={mode}
        open={reportPickerOpen}
        reportPickerLoading={reportPickerLoading}
        reportSearch={reportSearch}
        reportSiteFilter={reportSiteFilter}
        siteOptions={adminSites}
        onChangeReportSearch={setReportSearch}
        onChangeSiteFilter={setReportSiteFilter}
        onClose={() => setReportPickerOpen(false)}
        onSelectReport={(reportKey) => {
          const option = filteredReportOptionsByKey.get(reportKey);
          if (option) {
            handleSelectReport(option);
          }
        }}
      />
    </section>
  );
}

export default MailboxPanel;
