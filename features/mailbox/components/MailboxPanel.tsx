'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import {
  fetchBadWorkplacePdfDocumentByReportKey,
  fetchInspectionPdfDocumentByReportKey,
  fetchQuarterlyPdfDocumentByReportKey,
} from '@/lib/api';
import { normalizeControllerReportType } from '@/lib/admin/reportMeta';
import {
  disconnectMailAccount,
  fetchMailAccounts,
  fetchMailProviderStatuses,
  fetchMailRecipientSuggestions,
  fetchMailThreadDetail,
  fetchMailThreads,
  sendMail,
  startGoogleMailConnect,
  startNaverMailConnect,
  syncMail,
} from '@/lib/mail/apiClient';
import { fetchSafetyReportList, readSafetyAuthToken } from '@/lib/safetyApi';
import type { SafetyReportListItem, SafetySite } from '@/types/backend';
import type {
  MailAccount,
  MailAccountSyncMetadata,
  MailAttachmentPayload,
  MailProviderStatus,
  MailRecipientSuggestion,
  MailThread,
  MailThreadDetail,
} from '@/types/mail';
import {
  getDemoMailboxAccounts,
  getDemoMailboxThreadDetail,
  getDemoMailboxThreads,
  MAILBOX_DEMO_SESSION_KEY,
} from './demoMailboxData';
import { MailboxComposeSection } from './MailboxComposeSection';
import { MailboxConnectWorkspace } from './MailboxConnectWorkspace';
import { MailboxReportPickerModal } from './MailboxReportPickerModal';
import { MailboxThreadDetailSection } from './MailboxThreadDetailSection';
import { MailboxThreadListSection } from './MailboxThreadListSection';
import localStyles from './MailboxPanel.module.css';

type MailboxTab = 'all' | 'inbox' | 'sent';
type MailboxView = 'list' | 'thread' | 'compose';
type ComposeMode = 'new' | 'reply' | 'report';

interface MailboxPanelProps {
  currentUserName?: string | null;
  mode: 'admin' | 'worker';
  adminReports?: SafetyReportListItem[];
  adminSites?: SafetySite[];
}

interface MailboxReportOption {
  documentKind: SafetyReportListItem['document_kind'] | null;
  headquarterId: string;
  headquarterName: string;
  meta: Record<string, unknown>;
  recipientEmail: string;
  reportKey: string;
  reportType: SafetyReportListItem['report_type'] | null;
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

interface MailSendProgressState {
  detail: string;
  percent: number;
  title: string;
}

interface RecipientSuggestionItem extends MailRecipientSuggestion {
  label: string;
}

const THREAD_PAGE_SIZE = 50;
const DEFAULT_SHARED_MAILBOX_EMAIL = 'safety-control@naverworks.local';
const DEFAULT_SHARED_MAILBOX_NAME = '관제 공용 메일함';
const MAILBOX_TAB_META: Record<MailboxTab, { empty: string; title: string }> = {
  all: {
    title: '전체 메일함',
    empty: '연결된 계정이나 검색 조건에 맞는 메일이 없습니다.',
  },
  inbox: {
    title: '받은편지함',
    empty: '연결된 계정이나 검색 조건에 맞는 받은 메일이 없습니다.',
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

function readMailAccountSyncMetadata(account: MailAccount | null): MailAccountSyncMetadata | null {
  if (!account || account.provider !== 'google' || account.scope !== 'personal') return null;
  const metadata = account.metadata ?? {};
  return {
    historyCursor: typeof metadata.historyCursor === 'string' ? metadata.historyCursor : null,
    initialBackfillCompleted: Boolean(metadata.initialBackfillCompleted),
    lastFullSyncAt: typeof metadata.lastFullSyncAt === 'string' ? metadata.lastFullSyncAt : null,
    lastIncrementalSyncAt: typeof metadata.lastIncrementalSyncAt === 'string' ? metadata.lastIncrementalSyncAt : null,
    queuedPageToken: typeof metadata.queuedPageToken === 'string' ? metadata.queuedPageToken : null,
    syncError: typeof metadata.syncError === 'string' ? metadata.syncError : null,
    syncStartedAt: typeof metadata.syncStartedAt === 'string' ? metadata.syncStartedAt : null,
    syncStatus: typeof metadata.syncStatus === 'string' ? metadata.syncStatus : 'idle',
  };
}

function formatSyncDateTime(value: string | null) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('ko-KR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function buildSyncStatusSummary(syncMeta: MailAccountSyncMetadata | null) {
  if (!syncMeta) return null;
  if (syncMeta.syncStatus === 'backfilling') {
    return {
      tone: 'progress' as const,
      title: '전체 메일함 초기 동기화 중',
      description: syncMeta.queuedPageToken
        ? '오래된 메일까지 순차적으로 저장하고 있습니다. 백그라운드 동기화가 계속 이어집니다.'
        : '전체 메일함을 처음부터 저장하고 있습니다. 오래된 메일은 순차적으로 추가됩니다.',
    };
  }
  if (syncMeta.syncStatus === 'incremental') {
    return {
      tone: 'progress' as const,
      title: '메일 변경 사항 동기화 중',
      description: '새로 들어온 메일과 변경된 스레드를 반영하고 있습니다.',
    };
  }
  if (syncMeta.syncStatus === 'error') {
    return {
      tone: 'error' as const,
      title: '메일 동기화 오류',
      description: syncMeta.syncError || '다음 백그라운드 동기화나 새로 고침에서 다시 시도합니다.',
    };
  }
  if (syncMeta.initialBackfillCompleted) {
    const basis = formatSyncDateTime(syncMeta.lastIncrementalSyncAt || syncMeta.lastFullSyncAt);
    return {
      tone: 'ready' as const,
      title: '전체 메일함이 저장되어 있습니다',
      description: basis
        ? `최근 동기화 ${basis}. 받은편지함, 보낸편지함, 보관 메일까지 DB 기준으로 표시합니다.`
        : '받은편지함, 보낸편지함, 보관 메일까지 DB 기준으로 표시합니다.',
    };
  }
  return {
    tone: 'progress' as const,
    title: '전체 메일함 초기 동기화 미완료',
    description:
      '오래된 메일 가져오기가 아직 끝나지 않았습니다. 현재 동기화가 실행 중이 아닐 수도 있으며, 새로 고침이나 백그라운드 동기화 때 이어집니다.',
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
  if (rawBox === 'all') return 'all';
  if (rawBox === 'sent') return 'sent';
  return 'inbox' === rawBox ? 'inbox' : 'all';
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

function encodeByteArrayToBase64(bytes: Uint8Array) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

async function blobToBase64(blob: Blob) {
  return encodeByteArrayToBase64(new Uint8Array(await blob.arrayBuffer()));
}

function resolveSelectedReportType(report: Pick<MailboxReportOption, 'documentKind' | 'meta' | 'reportType'>) {
  const metaReportKind =
    report.meta && typeof report.meta.reportKind === 'string' ? report.meta.reportKind : report.documentKind || '';
  return normalizeControllerReportType(report.reportType || metaReportKind);
}

async function buildReportAttachmentPayload(
  report: SelectedReportContext,
  authToken: string,
): Promise<MailAttachmentPayload> {
  const reportType = resolveSelectedReportType(report);
  const exported =
    reportType === 'bad_workplace'
      ? await fetchBadWorkplacePdfDocumentByReportKey(report.reportKey, authToken)
      : reportType === 'quarterly_report'
        ? await fetchQuarterlyPdfDocumentByReportKey(report.reportKey, authToken)
        : await fetchInspectionPdfDocumentByReportKey(report.reportKey, authToken);
  return {
    contentType: exported.blob.type || 'application/pdf',
    dataBase64: await blobToBase64(exported.blob),
    filename: exported.filename || `${report.reportKey || 'report'}.pdf`,
  };
}

async function buildFileAttachmentPayload(file: File): Promise<MailAttachmentPayload> {
  return {
    contentType: file.type || 'application/octet-stream',
    dataBase64: await blobToBase64(file),
    filename: file.name,
  };
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
      if (synced.backfillAccountCount > 0) {
        summaryParts.push(`초기 백필 ${synced.backfillAccountCount}개`);
      }
      if (synced.incrementalAccountCount > 0) {
        summaryParts.push(`증분 동기화 ${synced.incrementalAccountCount}개`);
      }
      if (synced.queuedMessageCount > 0) {
        summaryParts.push(`처리 메일 ${synced.queuedMessageCount}건`);
      }
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

  const commitRecipientTokens = (tokens: string[]) => {
    const nextTokens = dedupeRecipients([...compose.toRecipients, ...tokens.filter(isLikelyEmail)]);
    setCompose((current) => ({
      ...current,
      toInput: '',
      toRecipients: nextTokens,
    }));
    setRecipientSuggestionIndex(0);
  };

  const handleRecipientSuggestionSelect = (suggestion: RecipientSuggestionItem) => {
    commitRecipientTokens([suggestion.email]);
    setRecipientSuggestionsOpen(false);
  };

  const handleRecipientInputChange = (value: string) => {
    if (!/[\s,;]$/.test(value)) {
      setCompose((current) => ({
        ...current,
        toInput: value,
      }));
      setRecipientSuggestionsOpen(true);
      setRecipientSuggestionIndex(0);
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
    if (event.key === 'ArrowDown') {
      if (visibleRecipientSuggestions.length === 0) return;
      event.preventDefault();
      setRecipientSuggestionsOpen(true);
      setRecipientSuggestionIndex((current) =>
        recipientSuggestionsOpen ? (current + 1) % visibleRecipientSuggestions.length : 0,
      );
      return;
    }
    if (event.key === 'ArrowUp') {
      if (visibleRecipientSuggestions.length === 0) return;
      event.preventDefault();
      setRecipientSuggestionsOpen(true);
      setRecipientSuggestionIndex((current) =>
        recipientSuggestionsOpen
          ? current <= 0
            ? visibleRecipientSuggestions.length - 1
            : current - 1
          : visibleRecipientSuggestions.length - 1,
      );
      return;
    }
    if (event.key === 'Escape') {
      setRecipientSuggestionsOpen(false);
      return;
    }
    if (
      event.key === 'Enter' &&
      recipientSuggestionsOpen &&
      visibleRecipientSuggestions[recipientSuggestionIndex]
    ) {
      event.preventDefault();
      handleRecipientSuggestionSelect(visibleRecipientSuggestions[recipientSuggestionIndex]);
      return;
    }
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
    setRecipientSuggestionsOpen(false);
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
      setError(null);
      setMailSendProgress({
        detail: '수신자와 본문을 정리하고 있습니다.',
        percent: 8,
        title: '메일 발송 준비 중',
      });
      const authToken = readSafetyAuthToken();
      const normalizedAttachments: MailAttachmentPayload[] = [];
      if (composeMode === 'report' && selectedReport?.reportKey) {
        if (!authToken) {
          throw new Error('보고서 첨부를 준비하려면 다시 로그인해 주세요.');
        }
        setMailSendProgress({
          detail: '선택한 보고서를 PDF로 생성하고 있습니다.',
          percent: 30,
          title: '보고서 PDF 준비 중',
        });
        normalizedAttachments.push(await buildReportAttachmentPayload(selectedReport, authToken));
      }
      if (attachments.length > 0) {
        setMailSendProgress({
          detail: `첨부 파일 ${attachments.length}건을 메일 전송 형식으로 준비하고 있습니다.`,
          percent: 54,
          title: '첨부 파일 정리 중',
        });
        for (const attachment of attachments) {
          normalizedAttachments.push(await buildFileAttachmentPayload(attachment.file));
        }
      }
      setMailSendProgress({
        detail: '메일 서버로 발송 요청을 보내고 있습니다.',
        percent: 78,
        title: '메일 발송 중',
      });
      await sendMail({
        accountId: selectedAccount.id,
        attachments: normalizedAttachments,
        body: compose.body,
        headquarterId: selectedHeadquarterId,
        reportKey: selectedReportKey,
        siteId: selectedSiteId,
        subject: compose.subject,
        threadId: composeMode === 'reply' ? threadDetail?.thread.id || '' : '',
        to: normalizedRecipients.map((email) => ({ email, name: null })),
      });
      setMailSendProgress({
        detail: '발송 결과를 메일함 목록에 반영하고 있습니다.',
        percent: 92,
        title: '목록 새로고침 중',
      });
      setNotice(
        normalizedAttachments.length > 0
          ? `메일을 발송했습니다. 첨부 ${normalizedAttachments.length}건을 함께 보냈습니다.`
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
      setMailSendProgress({
        detail: '메일 발송이 완료되었습니다.',
        percent: 100,
        title: '발송 완료',
      });
      window.setTimeout(() => {
        setMailSendProgress((current) => (current?.percent === 100 ? null : current));
      }, 900);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '메일 발송에 실패했습니다.');
      setMailSendProgress(null);
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
      <div className={styles.sectionHeader}>
        <div className={`${styles.sectionHeaderActions} ${localStyles.headerToolbar}`}>
            <div className={localStyles.headerPrimaryRow}>
              <div className={localStyles.sectionHeaderMeta}>
                <h2 className={styles.sectionTitle}>{mode === 'admin' ? '통합 메일함' : '개인 메일함'}</h2>
                <p className={localStyles.sectionLead}>{mailboxLead}</p>
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
                  {selectableAccounts.map((account) => (
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
            {!showMailboxConnectGate && view === 'list' && listScopeMeta.length > 0 ? (
              <div className={localStyles.scopeRow}>
                <span className={localStyles.scopeKicker}>현재 범위</span>
                <strong className={localStyles.scopeValue}>{activeTabMeta.title}</strong>
                <span className={localStyles.scopeText}>{listScopeMeta.join(' · ')}</span>
              </div>
            ) : null}
            {!showMailboxConnectGate && view === 'list' ? (
              <div className={localStyles.tabRail}>
                {(['all', 'inbox', 'sent'] as MailboxTab[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`${localStyles.tabButton} ${tab === item ? localStyles.tabButtonActive : ''}`}
                    onClick={() => handleChangeMailboxTab(item)}
                  >
                    <span className={localStyles.tabButtonBullet} aria-hidden="true" />
                    <span className={localStyles.tabButtonLabel}>{MAILBOX_TAB_META[item].title}</span>
                  </button>
                ))}
              </div>
            ) : null}
            {!showMailboxConnectGate && view === 'list' && syncStatusSummary ? (
              <div
                className={`${localStyles.syncStatusBanner} ${
                  syncStatusSummary.tone === 'error'
                    ? localStyles.syncStatusBannerError
                    : syncStatusSummary.tone === 'ready'
                      ? localStyles.syncStatusBannerReady
                      : localStyles.syncStatusBannerProgress
                }`}
              >
                <strong className={localStyles.syncStatusTitle}>{syncStatusSummary.title}</strong>
                <span className={localStyles.syncStatusText}>{syncStatusSummary.description}</span>
              </div>
            ) : null}

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
