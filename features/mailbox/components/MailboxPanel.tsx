'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AppModal from '@/components/ui/AppModal';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
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
import { fetchSafetyReportList, readSafetyAuthToken } from '@/lib/safetyApi';
import type { SafetyReportListItem, SafetySite } from '@/types/backend';
import type { MailAccount, MailProviderStatus, MailThread, MailThreadDetail } from '@/types/mail';
import localStyles from './MailboxPanel.module.css';

type MailboxTab = 'inbox' | 'sent' | 'accounts';
type MailboxView = 'list' | 'thread' | 'compose';
type ComposeMode = 'new' | 'reply' | 'report';

interface MailboxPanelProps {
  currentUserName?: string | null;
  mode: 'admin' | 'worker';
  adminReports?: SafetyReportListItem[];
  adminSites?: SafetySite[];
}

interface MailboxReportOption {
  headquarterId: string;
  headquarterName: string;
  reportKey: string;
  reportTitle: string;
  siteId: string;
  siteName: string;
  updatedAt: string | null;
  visitDate: string | null;
}

type SelectedReportContext = MailboxReportOption;

interface ComposeAttachment {
  file: File;
  id: string;
}

interface ComposeState {
  body: string;
  subject: string;
  toInput: string;
  toRecipients: string[];
}

const THREAD_PAGE_SIZE = 50;
const DEFAULT_SHARED_MAILBOX_EMAIL = 'safety-control@naverworks.local';
const DEFAULT_SHARED_MAILBOX_NAME = '관제 공용 메일함';
const MAILBOX_TAB_META: Record<MailboxTab, { empty: string; title: string }> = {
  inbox: {
    title: '받은편지함',
    empty: '연결된 계정이나 검색 조건에 맞는 수신 메일이 없습니다.',
  },
  sent: {
    title: '보낸편지함',
    empty: '연결된 계정이나 검색 조건에 맞는 발송 메일이 없습니다.',
  },
  accounts: {
    title: '연결 계정',
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

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function stripHtmlToText(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|blockquote|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function formatMailBodyHtml(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const looksLikeHtml = /<[a-z][\s\S]*>/i.test(trimmed);
  if (!looksLikeHtml) {
    return escapeHtml(trimmed).replace(/\n/g, '<br />');
  }

  return trimmed
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/\s(on\w+)=(".*?"|'.*?'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '');
}

function isLikelyEmail(value: string) {
  const normalized = value.trim();
  if (!normalized) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

function dedupeRecipients(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const normalized = value.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)}MB`;
  }
  if (size >= 1024) {
    return `${Math.round(size / 1024)}KB`;
  }
  return `${size}B`;
}

function extractRecipientTokens(value: string) {
  return value
    .split(/[\s,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildComposeState(input?: Partial<ComposeState>): ComposeState {
  return {
    body: input?.body || '',
    subject: input?.subject || '',
    toInput: input?.toInput || '',
    toRecipients: input?.toRecipients || [],
  };
}

function buildThreadRecipients(thread: MailThread, accountEmail: string): string {
  return thread.participants
    .filter((item) => item.email !== accountEmail)
    .map((item) => item.email)
    .join(', ');
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

function buildReplySubject(subject: string) {
  const normalized = subject.trim();
  if (!normalized) return '';
  return /^re:/i.test(normalized) ? normalized : `Re: ${normalized}`;
}

function buildThreadCounterparty(thread: MailThread, accountEmail: string) {
  const others = thread.participants.filter((item) => item.email !== accountEmail);
  if (others.length === 0) {
    return thread.accountDisplayName || thread.accountEmail || '-';
  }
  const first = others[0];
  const firstLabel = first.name?.trim() || first.email;
  return others.length > 1 ? `${firstLabel} 외 ${others.length - 1}` : firstLabel;
}

function buildThreadTimestamp(thread: MailThread) {
  return formatDateTime(thread.lastMessageAt);
}

function deriveMailboxTab(rawBox: string | null): MailboxTab {
  if (rawBox === 'sent') return 'sent';
  if (rawBox === 'accounts') return 'accounts';
  return 'inbox';
}

function deriveInitialComposeMode(input: {
  box: string | null;
  headquarterId: string;
  reportKey: string;
  siteId: string;
}) {
  return input.box === 'reports' || Boolean(input.reportKey || input.siteId || input.headquarterId)
    ? 'report'
    : 'new';
}

function deriveInitialView(input: { box: string | null; tab: MailboxTab; threadId: string }) {
  if (input.tab === 'accounts') return 'list' as const;
  if (input.box === 'reports') return 'compose' as const;
  if (input.threadId) return 'thread' as const;
  return 'list' as const;
}

export function MailboxPanel({
  currentUserName,
  mode,
  adminReports = [],
  adminSites = [],
}: MailboxPanelProps) {
  const searchParams = useSearchParams();
  const {
    isAuthenticated,
    isReady,
    sites: workerSites,
  } = useInspectionSessions();
  const composerRef = useRef<HTMLDivElement | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const initialBox = searchParams.get('box');
  const initialThreadId = searchParams.get('threadId') || '';
  const reportKey = searchParams.get('reportKey') || '';
  const siteId = searchParams.get('siteId') || '';
  const headquarterId = searchParams.get('headquarterId') || '';
  const [tab, setTab] = useState<MailboxTab>(() => deriveMailboxTab(initialBox));
  const [view, setView] = useState<MailboxView>(() =>
    deriveInitialView({
      box: initialBox,
      tab: deriveMailboxTab(initialBox),
      threadId: initialThreadId,
    }),
  );
  const [composeMode, setComposeMode] = useState<ComposeMode>(() =>
    deriveInitialComposeMode({
      box: initialBox,
      headquarterId,
      reportKey,
      siteId,
    }),
  );
  const [query, setQuery] = useState('');
  const [accounts, setAccounts] = useState<MailAccount[]>([]);
  const [providerStatuses, setProviderStatuses] = useState<MailProviderStatus[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [threads, setThreads] = useState<MailThread[]>([]);
  const [threadOffset, setThreadOffset] = useState(0);
  const [threadTotal, setThreadTotal] = useState(0);
  const [selectedThreadId, setSelectedThreadId] = useState(initialThreadId);
  const [threadDetail, setThreadDetail] = useState<MailThreadDetail | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [accountStateLoading, setAccountStateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [naverForm, setNaverForm] = useState({ appPassword: '', displayName: '', email: '' });
  const [oauthProvider, setOauthProvider] = useState<'google' | 'naver_mail' | null>(null);
  const [compose, setCompose] = useState<ComposeState>(() => buildComposeState());
  const [attachments, setAttachments] = useState<ComposeAttachment[]>([]);
  const [reportPickerOpen, setReportPickerOpen] = useState(false);
  const [reportPickerLoading, setReportPickerLoading] = useState(false);
  const [reportSearch, setReportSearch] = useState('');
  const [reportSiteFilter, setReportSiteFilter] = useState(siteId || '');
  const [workerModalReports, setWorkerModalReports] = useState<MailboxReportOption[]>([]);
  const [selectedReport, setSelectedReport] = useState<SelectedReportContext | null>(() =>
    reportKey || siteId || headquarterId
      ? {
          headquarterId,
          headquarterName: '',
          reportKey,
          reportTitle: reportKey || '보고서',
          siteId,
          siteName: '',
          updatedAt: null,
          visitDate: null,
        }
      : null,
  );

  useEffect(() => {
    const nextBox = searchParams.get('box');
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
            reportKey,
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
        tab: nextTab,
        threadId: nextThreadId,
      }),
    );
  }, [headquarterId, reportKey, searchParams, siteId]);

  const selectedAccount = useMemo(
    () => accounts.find((item) => item.id === selectedAccountId) ?? accounts[0] ?? null,
    [accounts, selectedAccountId],
  );
  const activeTabMeta = MAILBOX_TAB_META[tab];
  const providerStatusMap = useMemo(
    () => new Map(providerStatuses.map((provider) => [provider.provider, provider])),
    [providerStatuses],
  );
  const googleProviderStatus = providerStatusMap.get('google');
  const naverProviderStatus = providerStatusMap.get('naver_mail');
  const hasMultipleAccounts = accounts.length > 1;
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
          reportKey: item.report_key,
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
    if (mode !== 'worker' || !reportPickerOpen || !isAuthenticated || !isReady) return;
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
              reportKey: item.report_key,
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
  }, [isAuthenticated, isReady, mode, reportPickerOpen, workerSites]);

  useEffect(() => {
    if (!composerRef.current) return;
    if (composerRef.current.innerHTML === compose.body) return;
    composerRef.current.innerHTML = compose.body;
  }, [compose.body, view]);

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
  }, [headquarterId, query, reportKey, selectedAccountId, siteId, tab, threadOffset]);

  useEffect(() => {
    if (!selectedThreadId || tab === 'accounts' || view !== 'thread') {
      setThreadDetail(null);
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
  }, [selectedThreadId, tab, view]);

  useEffect(() => {
    if (composeMode !== 'report' || !selectedReport?.reportKey) return;
    setCompose((current) => ({
      ...current,
      subject: current.subject || `[보고서] ${selectedReport.reportTitle || selectedReport.reportKey}`,
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

  const handleOpenThread = (threadId: string) => {
    setSelectedThreadId(threadId);
    setThreadDetail(null);
    setView('thread');
  };

  const handleBackToList = () => {
    setView('list');
  };

  const handleOpenCompose = (mode: ComposeMode = 'new') => {
    if (mode !== 'report') {
      setSelectedReport(null);
    }
    setComposeMode(mode);
    if (mode !== 'reply') {
      resetCompose(mode);
    }
    setView('compose');
  };

  const handleReply = () => {
    if (!threadDetail) return;
    setSelectedReport(null);
    setComposeMode('reply');
    setCompose(
      buildComposeState({
        subject: buildReplySubject(threadDetail.thread.subject),
        toRecipients: selectedAccount
          ? dedupeRecipients(
              buildThreadRecipients(threadDetail.thread, selectedAccount.email)
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean),
            )
          : [],
      }),
    );
    setAttachments([]);
    setView('compose');
  };

  const handleSync = async () => {
    try {
      const synced = await syncMail();
      setNotice(`메일 새로 고침을 완료했습니다. 계정 ${synced.synced_account_count}개 / 스레드 ${synced.thread_count}건`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '메일 새로 고침에 실패했습니다.');
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

  const commitRecipientTokens = (tokens: string[]) => {
    const nextTokens = dedupeRecipients([...compose.toRecipients, ...tokens.filter(isLikelyEmail)]);
    setCompose((current) => ({
      ...current,
      toInput: '',
      toRecipients: nextTokens,
    }));
  };

  const handleRecipientInputChange = (value: string) => {
    if (!/[\s,;]$/.test(value)) {
      setCompose((current) => ({
        ...current,
        toInput: value,
      }));
      return;
    }
    const tokens = extractRecipientTokens(value);
    const validTokens = tokens.filter(isLikelyEmail);
    const invalidTokens = tokens.filter((item) => !isLikelyEmail(item));
    if (validTokens.length > 0) {
      setCompose((current) => ({
        ...current,
        toInput: invalidTokens.join(' '),
        toRecipients: dedupeRecipients([...current.toRecipients, ...validTokens]),
      }));
      return;
    }
    setCompose((current) => ({
      ...current,
      toInput: invalidTokens.join(' '),
    }));
  };

  const handleRecipientKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      event.key !== 'Enter' &&
      event.key !== 'Tab' &&
      event.key !== ' ' &&
      event.key !== ',' &&
      event.key !== ';'
    ) {
      return;
    }
    const candidate = compose.toInput.trim();
    if (!isLikelyEmail(candidate)) return;
    event.preventDefault();
    commitRecipientTokens([candidate]);
  };

  const handleRecipientBlur = () => {
    if (!isLikelyEmail(compose.toInput.trim())) return;
    commitRecipientTokens([compose.toInput.trim()]);
  };

  const handleRemoveRecipient = (email: string) => {
    setCompose((current) => ({
      ...current,
      toRecipients: current.toRecipients.filter((item) => item !== email),
    }));
  };

  const handleComposerInput = () => {
    if (!composerRef.current) return;
    setCompose((current) => ({
      ...current,
      body: composerRef.current?.innerHTML || '',
    }));
  };

  const handleComposerCommand = (command: string, value?: string) => {
    if (!composerRef.current) return;
    composerRef.current.focus();
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(command, false, value);
    setCompose((current) => ({
      ...current,
      body: composerRef.current?.innerHTML || '',
    }));
  };

  const handleComposerLink = () => {
    const url = window.prompt('링크 주소를 입력하세요.');
    if (!url) return;
    handleComposerCommand('createLink', url.trim());
  };

  const handleAttachmentSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    setAttachments((current) => {
      const existingIds = new Set(current.map((item) => item.id));
      const nextItems = files
        .map((file) => ({
          file,
          id: `${file.name}-${file.size}-${file.lastModified}`,
        }))
        .filter((item) => !existingIds.has(item.id));
      return [...current, ...nextItems];
    });
    event.target.value = '';
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    setAttachments((current) => current.filter((item) => item.id !== attachmentId));
  };

  const handleOpenReportPicker = () => {
    setReportSearch('');
    setReportSiteFilter(selectedReport?.siteId || siteId || '');
    setReportPickerOpen(true);
  };

  const handleSelectReport = (option: SelectedReportContext) => {
    setSelectedReport(option);
    setComposeMode('report');
    setCompose((current) => ({
      ...current,
      subject:
        current.subject.trim() && composeMode !== 'report'
          ? current.subject
          : `[보고서] ${option.reportTitle || option.reportKey}`,
    }));
    setReportPickerOpen(false);
  };

  const handleClearSelectedReport = () => {
    setSelectedReport(null);
    if (composeMode === 'report') {
      setComposeMode('new');
    }
  };

  const handleSend = async () => {
    if (!selectedAccount) return;

    const normalizedRecipients = dedupeRecipients([
      ...compose.toRecipients,
      ...(isLikelyEmail(compose.toInput.trim()) ? [compose.toInput.trim()] : []),
    ]);
    const selectedReportKey =
      composeMode === 'reply' ? threadDetail?.thread.reportKey || '' : selectedReport?.reportKey || '';
    const selectedSiteId =
      composeMode === 'reply' ? threadDetail?.thread.siteId || '' : selectedReport?.siteId || '';
    const selectedHeadquarterId =
      composeMode === 'reply'
        ? threadDetail?.thread.headquarterId || ''
        : selectedReport?.headquarterId || '';

    try {
      await sendMail({
        accountId: selectedAccount.id,
        body: compose.body,
        headquarterId: selectedHeadquarterId,
        reportKey: selectedReportKey,
        siteId: selectedSiteId,
        subject: compose.subject,
        threadId: composeMode === 'reply' ? threadDetail?.thread.id || '' : '',
        to: normalizedRecipients.map((email) => ({ email, name: null })),
      });
      setNotice(
        attachments.length > 0
          ? '메일을 발송했습니다. 첨부 파일은 아직 메일 API와 연결되지 않아 본 발송에는 포함되지 않았습니다.'
          : '메일을 발송했습니다.',
      );
      if (composeMode === 'report') {
        setSelectedReport(null);
        setComposeMode('new');
      }
      resetCompose('new');
      const nextThreads = await fetchMailThreads({
        accountId: selectedAccount.id,
        box: tab,
        headquarterId: selectedHeadquarterId,
        limit: THREAD_PAGE_SIZE,
        offset: threadOffset,
        query,
        reportKey: '',
        siteId: selectedSiteId,
      });
      setThreads(nextThreads.rows.map(normalizeMailThreadUi));
      setThreadTotal(nextThreads.total);
      if (composeMode === 'reply' && selectedThreadId) {
        setThreadDetail(normalizeMailThreadDetailUi(await fetchMailThreadDetail(selectedThreadId)));
        setView('thread');
      } else {
        setView('list');
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
    composeMode === 'reply' ? '답장 작성' : composeMode === 'report' ? '보고서 메일 보내기' : '메일 보내기';
  const listPrimaryColumnLabel = tab === 'sent' ? '받는 사람' : '보낸 사람';
  const threadEmptyMessage = threadLoading ? '메일을 불러오는 중입니다.' : activeTabMeta.empty;
  const detailEmptyMessage = '메일을 선택하면 상세 내용을 볼 수 있습니다.';
  const composePlainText = stripHtmlToText(compose.body);
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

  return (
    <section className={`${styles.sectionCard} ${styles.listSectionCard}`}>
      <div className={styles.sectionHeader}>
        <div className={`${styles.sectionHeaderActions} ${localStyles.headerToolbar}`}>
          <div className={localStyles.headerPrimaryRow}>
            <div className={localStyles.sectionHeaderMeta}>
              <h2 className={styles.sectionTitle}>{mode === 'admin' ? '통합 메일함' : '개인 메일함'}</h2>
            </div>
            <div className={localStyles.headerUtilityGroup}>
              {tab !== 'accounts' && view === 'list' ? (
                <input
                  aria-label="메일 검색"
                  className={`app-input ${localStyles.searchField}`}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="제목, 본문, 주소 검색"
                />
              ) : null}
              <div className={localStyles.headerPrimaryActions}>
                <button
                  type="button"
                  className={`app-button app-button-secondary ${localStyles.headerActionButton}`}
                  onClick={() => void handleSync()}
                >
                  새로 고침
                </button>
                <button
                  type="button"
                  className={`app-button app-button-primary ${localStyles.composeHeaderButton}`}
                  onClick={() => handleOpenCompose()}
                >
                  메일 보내기
                </button>
              </div>
            </div>
          </div>
          {tab !== 'accounts' && view === 'list' && (hasMultipleAccounts || listScopeMeta.length > 0) ? (
            <div className={localStyles.headerSecondaryRow}>
              {hasMultipleAccounts ? (
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
              {hasMultipleAccounts && listScopeMeta.length > 0 ? (
                <span className={localStyles.headerScope}>{listScopeMeta.join(' · ')}</span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className={`${styles.sectionBody} ${localStyles.shell}`}>
        {error ? <div className={styles.bannerError}>{error}</div> : null}
        {notice ? <div className={styles.bannerNotice}>{notice}</div> : null}
        <div className={`${localStyles.workspace} ${localStyles.workspaceSingle}`}>
          <div className={localStyles.mainColumn}>

        {tab !== 'accounts' && view === 'list' && listScopeMeta.length > 0 ? (
          <div className={localStyles.scopeRow}>
            <span className={localStyles.scopeKicker}>현재 범위</span>
            <strong className={localStyles.scopeValue}>{activeTabMeta.title}</strong>
            <span className={localStyles.scopeText}>{listScopeMeta.join(' · ')}</span>
          </div>
        ) : null}

        {view === 'compose' ? (
          <section className={localStyles.stageCard}>
            <div className={localStyles.composeSectionHeader}>
              <h3 className={localStyles.panelTitle}>{composeTitle}</h3>
              {hasMultipleAccounts ? (
                <label className={localStyles.composeAccountInline}>
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
              ) : null}
            </div>
            <div className={localStyles.composeDivider} />
            <div className={localStyles.composeGrid}>
              <label className={localStyles.fieldWide}>
                <span className={localStyles.fieldLabel}>받는 사람</span>
                <div className={localStyles.recipientInputShell}>
                  {compose.toRecipients.map((recipient) => (
                    <span key={recipient} className={localStyles.recipientChip}>
                      <span>{recipient}</span>
                      <button
                        type="button"
                        className={localStyles.recipientChipRemove}
                        onClick={() => handleRemoveRecipient(recipient)}
                        aria-label={`${recipient} 제거`}
                      >
                        x
                      </button>
                    </span>
                  ))}
                  <input
                    className={localStyles.recipientInput}
                    value={compose.toInput}
                    onBlur={handleRecipientBlur}
                    onChange={(event) => handleRecipientInputChange(event.target.value)}
                    onKeyDown={handleRecipientKeyDown}
                    placeholder={compose.toRecipients.length === 0 ? 'example@domain.com 입력 후 띄어쓰기' : ''}
                  />
                </div>
              </label>

              <label className={localStyles.fieldWide}>
                <span className={localStyles.fieldLabel}>제목</span>
                <input
                  className="app-input"
                  value={compose.subject}
                  onChange={(event) => setCompose((current) => ({ ...current, subject: event.target.value }))}
                  placeholder="메일 제목을 입력하세요."
                />
              </label>

              <div className={localStyles.fieldWide}>
                <span className={localStyles.fieldLabel}>본문</span>
                <div className={localStyles.composeToolbar}>
                  <div className={localStyles.composeToolbarGroup}>
                    <button
                      type="button"
                      className={localStyles.toolbarButton}
                      onClick={() => handleComposerCommand('bold')}
                    >
                      B
                    </button>
                    <button
                      type="button"
                      className={localStyles.toolbarButton}
                      onClick={() => handleComposerCommand('italic')}
                    >
                      I
                    </button>
                    <button
                      type="button"
                      className={localStyles.toolbarButton}
                      onClick={() => handleComposerCommand('underline')}
                    >
                      U
                    </button>
                    <input
                      type="color"
                      className={localStyles.colorInput}
                      aria-label="텍스트 색상"
                      onChange={(event) => handleComposerCommand('foreColor', event.target.value)}
                    />
                  </div>
                  <div className={localStyles.composeToolbarGroup}>
                    <button
                      type="button"
                      className={localStyles.toolbarButton}
                      onClick={() => handleComposerCommand('insertUnorderedList')}
                    >
                      글머리표
                    </button>
                    <button
                      type="button"
                      className={localStyles.toolbarButton}
                      onClick={() => handleComposerCommand('formatBlock', 'blockquote')}
                    >
                      인용
                    </button>
                    <button
                      type="button"
                      className={localStyles.toolbarButton}
                      onClick={handleComposerLink}
                    >
                      링크
                    </button>
                  </div>
                </div>
                <div
                  ref={composerRef}
                  className={localStyles.composeEditor}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={handleComposerInput}
                  data-placeholder={composeMode === 'reply' ? '답장 내용을 입력하세요.' : '메일 내용을 입력하세요.'}
                />
                <div className={localStyles.composeSupportArea}>
                  <div className={localStyles.composeSupportActions}>
                    <button
                      type="button"
                      className={localStyles.toolbarButton}
                      onClick={() => attachmentInputRef.current?.click()}
                    >
                      파일 첨부
                    </button>
                    <button
                      type="button"
                      className={`${localStyles.toolbarButton} ${localStyles.reportPickerButton}`}
                      onClick={handleOpenReportPicker}
                    >
                      보고서 선택하기
                    </button>
                    <input
                      ref={attachmentInputRef}
                      type="file"
                      multiple
                      hidden
                      onChange={handleAttachmentSelect}
                    />
                  </div>

                  {composeMode === 'report' && selectedReport ? (
                    <div className={localStyles.composeSupportBlock}>
                      <span className={localStyles.fieldLabel}>선택 보고서</span>
                      <div className={localStyles.reportSelectionCard}>
                        <div className={localStyles.reportSelectionMain}>
                          <strong className={localStyles.reportSelectionTitle}>
                            {selectedReport.reportTitle || selectedReport.reportKey}
                          </strong>
                          <span className={localStyles.accountMeta}>
                            {selectedReport.siteName || '-'}
                            {selectedReport.headquarterName ? ` · ${selectedReport.headquarterName}` : ''}
                            {selectedReport.visitDate ? ` · ${selectedReport.visitDate}` : ''}
                          </span>
                        </div>
                        <button
                          type="button"
                          className={`app-button app-button-secondary ${localStyles.inlineActionButton}`}
                          onClick={handleClearSelectedReport}
                        >
                          선택 해제
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {attachments.length > 0 ? (
                    <div className={localStyles.composeSupportBlock}>
                      <span className={localStyles.fieldLabel}>첨부 파일</span>
                      <div className={localStyles.attachmentList}>
                        {attachments.map((attachment) => (
                          <div key={attachment.id} className={localStyles.attachmentChip}>
                            <span>
                              {attachment.file.name} · {formatFileSize(attachment.file.size)}
                            </span>
                            <button
                              type="button"
                              className={localStyles.recipientChipRemove}
                              onClick={() => handleRemoveAttachment(attachment.id)}
                              aria-label={`${attachment.file.name} 제거`}
                            >
                              x
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className={localStyles.composeFooter}>
                <div className={localStyles.composeActions}>
                  <button
                    type="button"
                    className={`app-button app-button-primary ${localStyles.submitButton}`}
                    onClick={() => void handleSend()}
                    disabled={
                      !selectedAccount ||
                      (compose.toRecipients.length === 0 && !isLikelyEmail(compose.toInput.trim())) ||
                      !compose.subject.trim() ||
                      !composePlainText.trim()
                    }
                  >
                    메일 발송
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : tab === 'accounts' ? (
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
                <span className={localStyles.accountMeta}>
                  로그인 버튼을 누르면 팝업이 아니라 현재 탭이 구글 로그인 화면으로 이동합니다.
                </span>
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
                    새로 고침
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
                <span className={localStyles.accountMeta}>
                  로그인 버튼을 누르면 현재 탭이 네이버 로그인 화면으로 이동합니다.
                </span>
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
        ) : view === 'list' ? (
          <section className={styles.tableShell}>
            <div className={localStyles.mailTableHeader}>
              <strong className={localStyles.panelTitle}>{activeTabMeta.title}</strong>
              <span className={localStyles.inlineMeta}>
                표시 {threadRangeStart}-{threadRangeEnd} / 전체 {threadTotal}건
              </span>
            </div>
            {threads.length === 0 ? (
              <div className={styles.tableEmpty}>{threadEmptyMessage}</div>
            ) : (
              <>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>{listPrimaryColumnLabel}</th>
                        <th>제목</th>
                        <th>첨부</th>
                        <th>일시</th>
                      </tr>
                    </thead>
                    <tbody>
                      {threads.map((thread) => {
                        const partyLabel = buildThreadCounterparty(thread, selectedAccount?.email || '');
                        const isUnread = tab === 'inbox' && thread.unreadCount > 0;
                        return (
                          <tr
                            key={thread.id}
                            className={`${styles.tableClickableRow} ${isUnread ? localStyles.mailRowUnread : ''}`}
                            tabIndex={0}
                            onClick={() => handleOpenThread(thread.id)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                handleOpenThread(thread.id);
                              }
                            }}
                          >
                            <td>
                              <span className={styles.tablePrimary}>{partyLabel}</span>
                            </td>
                            <td>
                              <span className={styles.tablePrimary}>{thread.subject || '(제목 없음)'}</span>
                            </td>
                            <td className={localStyles.mailAttachmentCell}>-</td>
                            <td className={localStyles.mailDateCell}>{buildThreadTimestamp(thread)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className={styles.paginationRow}>
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
              </>
            )}
          </section>
        ) : view === 'thread' ? (
          <section className={localStyles.stageCard}>
            <div className={localStyles.stageHeader}>
              <div className={localStyles.stageHeading}>
                <div className={localStyles.stageMetaRow}>
                  <button
                    type="button"
                    className={`app-button app-button-secondary ${localStyles.backButton}`}
                    onClick={handleBackToList}
                  >
                    목록
                  </button>
                  <span className={localStyles.inlineMeta}>{activeTabMeta.title}</span>
                </div>
                <h3 className={localStyles.panelTitle}>
                  {threadDetail ? threadDetail.thread.subject || '(제목 없음)' : '메일 상세'}
                </h3>
                <p className={localStyles.panelDescription}>
                  {threadDetail
                    ? `${buildThreadCounterparty(threadDetail.thread, selectedAccount?.email || '')} · ${buildThreadTimestamp(threadDetail.thread)}`
                    : detailEmptyMessage}
                </p>
              </div>
              {threadDetail ? (
                <div className={localStyles.stageActions}>
                  <button
                    type="button"
                    className={`app-button app-button-primary ${localStyles.submitButton}`}
                    onClick={handleReply}
                  >
                    답장
                  </button>
                </div>
              ) : null}
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
                      <div
                        className={localStyles.messageBody}
                        dangerouslySetInnerHTML={{ __html: formatMailBodyHtml(message.body) }}
                      />
                    </article>
                  ))}
                </div>
                <div className={localStyles.detailMetaRow}>
                  <span className={localStyles.detailHint}>
                    읽지 않은 메일 {threadDetail.thread.unreadCount}건
                  </span>
                  {threadDetail.thread.reportKey ? (
                    <span className={localStyles.detailHint}>보고서 {threadDetail.thread.reportKey}</span>
                  ) : null}
                </div>
              </>
            ) : (
              <div className={localStyles.emptyState}>{detailEmptyMessage}</div>
            )}
          </section>
        ) : null}
          </div>
        </div>
      </div>

      <AppModal
        open={reportPickerOpen}
        title={mode === 'admin' ? '보고서 선택' : '배정 현장 보고서 선택'}
        size="large"
        onClose={() => setReportPickerOpen(false)}
        actions={
          <>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => setReportPickerOpen(false)}
            >
              닫기
            </button>
          </>
        }
      >
        <div className={localStyles.reportPickerToolbar}>
          <input
            className={`app-input ${localStyles.reportPickerSearch}`}
            value={reportSearch}
            onChange={(event) => setReportSearch(event.target.value)}
            placeholder="보고서명, 현장명, 키 검색"
          />
          {mode === 'admin' ? (
            <select
              className={`app-select ${localStyles.reportPickerFilter}`}
              value={reportSiteFilter}
              onChange={(event) => setReportSiteFilter(event.target.value)}
            >
              <option value="">전체 현장</option>
              {adminSites.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.site_name}
                </option>
              ))}
            </select>
          ) : null}
        </div>
        <div className={localStyles.reportPickerList}>
          {reportPickerLoading ? (
            <div className={localStyles.emptyState}>보고서 목록을 불러오는 중입니다.</div>
          ) : filteredReportOptions.length === 0 ? (
            <div className={localStyles.emptyState}>선택할 수 있는 보고서가 없습니다.</div>
          ) : (
            filteredReportOptions.map((option) => (
              <article key={option.reportKey} className={localStyles.reportPickerItem}>
                <div className={localStyles.reportPickerMain}>
                  <strong className={localStyles.reportSelectionTitle}>
                    {option.reportTitle || option.reportKey}
                  </strong>
                  <span className={localStyles.accountMeta}>
                    {option.siteName}
                    {option.headquarterName ? ` · ${option.headquarterName}` : ''}
                    {option.visitDate ? ` · ${option.visitDate}` : ''}
                  </span>
                  <span className={localStyles.accountMeta}>{option.reportKey}</span>
                </div>
                <button
                  type="button"
                  className={`app-button app-button-primary ${localStyles.inlineActionButton}`}
                  onClick={() => handleSelectReport(option)}
                >
                  선택
                </button>
              </article>
            ))
          )}
        </div>
      </AppModal>
    </section>
  );
}

export default MailboxPanel;
