'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import AppModal from '@/components/ui/AppModal';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import {
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
import {
  getDemoMailboxAccounts,
  getDemoMailboxThreadDetail,
  getDemoMailboxThreads,
  MAILBOX_DEMO_SESSION_KEY,
} from './demoMailboxData';
import localStyles from './MailboxPanel.module.css';

type MailboxTab = 'inbox' | 'sent';
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
  recipientEmail: string;
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

function deriveInitialView(input: { box: string | null; threadId: string }) {
  if (input.box === 'reports') return 'compose' as const;
  if (input.threadId) return 'thread' as const;
  return 'list' as const;
}

function persistDemoMailboxMode(nextValue: boolean) {
  if (typeof window === 'undefined') return;
  if (nextValue) {
    window.sessionStorage.setItem(MAILBOX_DEMO_SESSION_KEY, 'true');
    return;
  }
  window.sessionStorage.removeItem(MAILBOX_DEMO_SESSION_KEY);
}

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
  const [tab, setTab] = useState<MailboxTab>('inbox');
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsDemoMode(window.sessionStorage.getItem(MAILBOX_DEMO_SESSION_KEY) === 'true');
  }, []);

  useEffect(() => {
    const nextBox = searchParams.get('box');
    if (nextBox === 'accounts') {
      const nextSearchParams = new URLSearchParams(searchParams.toString());
      nextSearchParams.set('box', 'inbox');
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
        threadId: nextThreadId,
      }),
    );
    setReportSiteFilter(siteId || '');
  }, [headquarterId, pathname, reportKey, router, searchParams, siteId]);

  const selectedAccount = useMemo(
    () => accounts.find((item) => item.id === selectedAccountId) ?? accounts[0] ?? null,
    [accounts, selectedAccountId],
  );
  const disconnectableAccount = useMemo(() => {
    if (accounts.length === 1) {
      return accounts[0]?.scope === 'personal' ? accounts[0] : null;
    }
    if (!selectedAccountId) return null;
    const matched = accounts.find((item) => item.id === selectedAccountId) ?? null;
    return matched?.scope === 'personal' ? matched : null;
  }, [accounts, selectedAccountId]);
  const activeTabMeta = MAILBOX_TAB_META[tab];
  const providerStatusMap = useMemo(
    () => new Map(providerStatuses.map((provider) => [provider.provider, provider])),
    [providerStatuses],
  );
  const googleProviderStatus = providerStatusMap.get('google');
  const naverProviderStatus = providerStatusMap.get('naver_mail');
  const hasMultipleAccounts = accounts.length > 1;
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
    if (!selectedAccountId) {
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
        setAccounts(response.rows.map(normalizeMailAccountUi));
        setProviderStatuses(providerResponse.rows);
        setSelectedAccountId((current) => current || response.rows[0]?.id || '');
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

    if (!selectedAccount) {
      setThreads([]);
      setThreadTotal(0);
      setSelectedThreadId('');
      setThreadLoading(false);
      return;
    }
    void (async () => {
      try {
        setThreadLoading(true);
        setError(null);
        const response = await fetchMailThreads({
          accountId: selectedAccount.id,
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

    if (!selectedThreadId || !selectedAccount || view !== 'thread') {
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

  const handleEnableDemoMode = () => {
    persistDemoMailboxMode(true);
    setIsDemoMode(true);
    setError(null);
    setNotice('시연용 더미 메일함으로 전환했습니다.');
    setTab('inbox');
    setView('list');
    setQuery('');
    setThreadOffset(0);
    setSelectedThreadId('');
    setThreadDetail(null);
    setSelectedReport(null);
    resetCompose('new');
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
    if (isDemoMode) {
      setNotice('데모 메일함은 시연용 목록으로 고정되어 있어 실제 동기화를 실행하지 않습니다.');
      return;
    }
    try {
      const synced = await syncMail();
      setNotice(`메일 새로 고침을 완료했습니다. 계정 ${synced.synced_account_count}개 / 스레드 ${synced.thread_count}건`);
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
      toRecipients:
        current.toRecipients.length > 0
          ? current.toRecipients
          : option.recipientEmail && isLikelyEmail(option.recipientEmail)
            ? [option.recipientEmail]
            : [],
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
    if (isDemoMode) {
      setNotice('데모 메일함에서는 실제 발송을 진행하지 않습니다.');
      return;
    }
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
  const showMailboxConnectGate = !isDemoMode && accounts.length === 0;
  const showMailboxConnectPrompt = !isDemoMode && !showMailboxConnectGate && !hasPersonalAccount;
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

  useEffect(() => {
    if (!showMailboxConnectGate) return;
    setView('list');
    setSelectedThreadId('');
    setThreadDetail(null);
  }, [showMailboxConnectGate]);

  return (
    <section className={`${styles.sectionCard} ${styles.listSectionCard}`}>
      <div className={styles.sectionHeader}>
        <div className={`${styles.sectionHeaderActions} ${localStyles.headerToolbar}`}>
          <div className={localStyles.headerPrimaryRow}>
            <div className={localStyles.sectionHeaderMeta}>
              <h2 className={styles.sectionTitle}>{mode === 'admin' ? '통합 메일함' : '개인 메일함'}</h2>
              {isDemoMode ? <span className={localStyles.demoBadge}>데모 메일함</span> : null}
            </div>
            <div className={localStyles.headerUtilityGroup}>
              {!showMailboxConnectGate && view === 'list' ? (
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
                  disabled={isDemoMode}
                >
                  새로 고침
                </button>
                {!isDemoMode ? (
                  <button
                    type="button"
                    className={`app-button app-button-secondary ${localStyles.headerActionButton}`}
                    onClick={handleEnableDemoMode}
                  >
                    시연용 더미 로그인
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`app-button app-button-secondary ${localStyles.headerActionButton}`}
                    onClick={() => handleDisableDemoMode()}
                  >
                    데모 종료
                  </button>
                )}
                {!showMailboxConnectGate ? (
                  <button
                    type="button"
                    className={`app-button app-button-primary ${localStyles.composeHeaderButton}`}
                    onClick={() => handleOpenCompose()}
                  >
                    메일 보내기
                  </button>
                ) : null}
                {!showMailboxConnectGate && disconnectableAccount ? (
                  <button
                    type="button"
                    className={`app-button app-button-secondary ${localStyles.headerActionButton}`}
                    onClick={() => void handleDisconnectSelectedAccount()}
                    disabled={accountStateLoading}
                  >
                    메일 로그아웃
                  </button>
                ) : null}
              </div>
            </div>
          </div>
          {!showMailboxConnectGate && view === 'list' && (hasMultipleAccounts || listScopeMeta.length > 0) ? (
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
          <div
            className={localStyles.mainColumn}
            data-mailbox-workspace={showMailboxConnectGate ? undefined : 'true'}
          >
            {isDemoMode ? (
              <div className={localStyles.demoBanner}>
                시연용 더미 메일함입니다. 받은편지함, 보낸편지함, 상세 보기와 작성 화면은 확인할 수 있지만
                실제 로그인, 동기화, 발송은 실행되지 않습니다.
              </div>
            ) : null}
            {!showMailboxConnectGate && view === 'list' && listScopeMeta.length > 0 ? (
              <div className={localStyles.scopeRow}>
                <span className={localStyles.scopeKicker}>현재 범위</span>
                <strong className={localStyles.scopeValue}>{activeTabMeta.title}</strong>
                <span className={localStyles.scopeText}>{listScopeMeta.join(' · ')}</span>
              </div>
            ) : null}

            {showMailboxConnectPrompt ? (
              <div className={localStyles.accountWorkspace} data-mailbox-connect-prompt="true">
                <article className={localStyles.accountCard}>
                  <div className={localStyles.panelHeader}>
                    <div className={localStyles.panelHeading}>
                      <strong className={localStyles.accountTitle}>개인 메일 계정 추가 연결</strong>
                      <span className={localStyles.accountMeta}>
                        현재는 공용 메일함만 연결되어 있습니다. 개인 지메일 또는 네이버 메일을 추가로 연결하면
                        개인 수신/발신 흐름까지 함께 사용할 수 있습니다.
                      </span>
                    </div>
                    <button
                      type="button"
                      className={`app-button app-button-secondary ${localStyles.inlineActionButton}`}
                      onClick={() => void handleRefreshAccountState()}
                      disabled={accountStateLoading}
                    >
                      상태 새로 고침
                    </button>
                  </div>
                  <div className={localStyles.sectionActions}>
                    <button
                      type="button"
                      className={`app-button app-button-secondary ${localStyles.primaryActionButton}`}
                      onClick={handleEnableDemoMode}
                    >
                      시연용 더미 로그인
                    </button>
                  </div>
                </article>

                <article className={localStyles.accountCard}>
                  <div className={localStyles.panelHeader}>
                    <div className={localStyles.panelHeading}>
                      <strong className={localStyles.accountTitle}>지메일 로그인</strong>
                      <span className={localStyles.accountMeta}>개인 지메일 계정을 추가 연결합니다.</span>
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
                      {oauthProvider === 'google' ? '이동 중...' : '지메일 로그인'}
                    </button>
                  </div>
                </article>

                <article className={localStyles.accountCard}>
                  <div className={localStyles.panelHeader}>
                    <div className={localStyles.panelHeading}>
                      <strong className={localStyles.accountTitle}>네이버 로그인</strong>
                      <span className={localStyles.accountMeta}>개인 네이버 메일 계정을 추가 연결합니다.</span>
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
                      {oauthProvider === 'naver_mail' ? '이동 중...' : '네이버 로그인'}
                    </button>
                  </div>
                </article>
              </div>
            ) : null}

            {showMailboxConnectGate ? (
              <div className={localStyles.accountWorkspace} data-mailbox-connect-gate="true">
                <article className={localStyles.accountCard}>
                  <div className={localStyles.panelHeader}>
                    <div className={localStyles.panelHeading}>
                      <strong className={localStyles.accountTitle}>메일 계정 로그인</strong>
                      <span className={localStyles.accountMeta}>
                        메일 계정을 연결하면 받은편지함, 보낸편지함, 보고서 발송까지 한 화면에서 이어서 사용할
                        수 있습니다.
                      </span>
                    </div>
                    <button
                      type="button"
                      className={`app-button app-button-secondary ${localStyles.inlineActionButton}`}
                      onClick={() => void handleRefreshAccountState()}
                      disabled={accountStateLoading}
                    >
                      상태 새로 고침
                    </button>
                  </div>
                  <div className={localStyles.sectionActions}>
                    <button
                      type="button"
                      className={`app-button app-button-secondary ${localStyles.primaryActionButton}`}
                      onClick={handleEnableDemoMode}
                    >
                      시연용 더미 로그인
                    </button>
                  </div>
                </article>

                <article className={localStyles.accountCard}>
                  <div className={localStyles.panelHeader}>
                    <div className={localStyles.panelHeading}>
                      <strong className={localStyles.accountTitle}>지메일 로그인</strong>
                      <span className={localStyles.accountMeta}>
                        구글 메일 계정을 연결해 받은편지함과 보고서 메일 발송 흐름을 바로 사용할 수 있습니다.
                      </span>
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
                      {oauthProvider === 'google' ? '이동 중...' : '지메일 로그인'}
                    </button>
                  </div>
                </article>

                <article className={localStyles.accountCard}>
                  <div className={localStyles.panelHeader}>
                    <div className={localStyles.panelHeading}>
                      <strong className={localStyles.accountTitle}>네이버 로그인</strong>
                      <span className={localStyles.accountMeta}>
                        네이버 메일 계정을 연결해 수신 메일과 발송 이력을 같은 메일함에서 관리할 수 있습니다.
                      </span>
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
                      {oauthProvider === 'naver_mail' ? '이동 중...' : '네이버 로그인'}
                    </button>
                  </div>
                </article>
              </div>
            ) : view === 'compose' ? (
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
                          <span className={localStyles.accountMeta}>
                            기본 수신자 {selectedReport.recipientEmail || '미등록'}
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
                  {isDemoMode ? (
                    <div className={localStyles.composeSupportBlock}>
                      <span className={localStyles.fieldLabel}>시연 안내</span>
                      <span className={localStyles.accountMeta}>
                        데모 메일함에서는 작성 화면만 시연하며 실제 발송과 첨부 업로드는 실행되지 않습니다.
                      </span>
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
                      isDemoMode ||
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
