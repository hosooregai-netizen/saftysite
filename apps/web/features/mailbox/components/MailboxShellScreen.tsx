'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  buildForwardBody,
  buildForwardSubject,
  buildReplySubject,
  buildThreadRecipients,
  dedupeRecipients,
  isLikelyEmail,
  stripHtmlToText,
} from '@/features/mailbox/components/mailboxComposeHelpers';
import {
  buildRecipientObjects,
  createDraft,
  getMailProviderStatus,
  getMailThreadDetail,
  listMailAccounts,
  listMailboxDrafts,
  listMailThreads,
  listRecipientSuggestions,
  removeDraft,
  sendMailboxMessage,
  startMailConnect,
  syncMailAccounts,
  type MailboxAttachmentDraft,
  updateDraft,
  updateMailThreadState,
} from '@/lib/mailboxApi';
import {
  bootstrapDemoSession,
  isAuthenticatedSession,
  type DemoSession,
} from '@/lib/reportApi';
import {
  beginGoogleWorkspaceAuth,
  clearPendingGoogleMailConnect,
  hasPendingGoogleMailConnect,
} from '@/lib/sessionAuthFlow';
import type {
  MailAccount,
  MailAttachmentRecord,
  MailboxBox,
  MailboxDraft,
  MailProviderStatus,
  MailRecipientSuggestion,
  MailThread,
  MailThreadDetail,
} from '@/types/mail';
import styles from './MailboxShell.module.css';
import { MailboxAppMenuDrawer } from './MailboxAppMenuDrawer';
import { MailboxComposePanel } from './MailboxComposePanel';
import { MailboxOnboardingState } from './MailboxOnboardingState';
import { MailboxSidebar } from './MailboxSidebar';
import { MailboxThreadListPane } from './MailboxThreadListPane';
import { MailboxTopbar } from './MailboxTopbar';
import { MailboxViewerPane } from './MailboxViewerPane';

type ComposeIntent = 'draft' | 'forward' | 'new' | 'reply';
type ComposeState = {
  body: string;
  ccInput: string;
  subject: string;
  toInput: string;
  toRecipients: string[];
};

type MailboxGoogleSyncMetadata = {
  initialBackfillCompleted: boolean;
  syncError: string | null;
  syncStatus: string;
};

const ALL_ACCOUNTS_FILTER = 'all';
const MAILBOX_OAUTH_NOTICE_KEY = 'mailbox-oauth-notice';
const MAILBOX_OAUTH_ERROR_KEY = 'mailbox-oauth-error';

function buildEmptyComposeState(): ComposeState {
  return {
    body: '',
    ccInput: '',
    subject: '',
    toInput: '',
    toRecipients: [],
  };
}

function readGoogleSyncMetadata(account: MailAccount | null): MailboxGoogleSyncMetadata | null {
  if (!account || account.provider !== 'google') return null;
  const metadata = account.metadata ?? {};
  return {
    initialBackfillCompleted: Boolean(metadata.initialBackfillCompleted),
    syncError: typeof metadata.syncError === 'string' ? metadata.syncError : null,
    syncStatus: typeof metadata.syncStatus === 'string' ? metadata.syncStatus : 'idle',
  };
}

function resolveMailboxBox(value: string | null): MailboxBox {
  if (
    value === 'all' ||
    value === 'drafts' ||
    value === 'inbox' ||
    value === 'sent' ||
    value === 'starred' ||
    value === 'trash'
  ) {
    return value;
  }
  return 'inbox';
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function extractCcRecipients(value: string) {
  return dedupeRecipients(
    value
      .split(/[;,]+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .filter(isLikelyEmail),
  );
}

function draftHasContent(compose: ComposeState, attachments: MailboxAttachmentDraft[]) {
  return Boolean(
    compose.subject.trim() ||
      stripHtmlToText(compose.body).trim() ||
      compose.toRecipients.length > 0 ||
      compose.toInput.trim() ||
      extractCcRecipients(compose.ccInput).length > 0 ||
      attachments.length > 0,
  );
}

function mapDraftAttachment(attachment: MailAttachmentRecord, index: number): MailboxAttachmentDraft {
  return {
    contentType: attachment.contentType || 'application/octet-stream',
    dataBase64: attachment.dataBase64,
    downloadUrl: attachment.downloadUrl,
    filename: attachment.filename || `attachment-${index + 1}`,
    id: `${attachment.filename || 'attachment'}-${index}`,
    sizeBytes: attachment.sizeBytes || 0,
    source: attachment.source,
  };
}

function upsertDraft(rows: MailboxDraft[], draft: MailboxDraft) {
  return [draft, ...rows.filter((item) => item.id !== draft.id)].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
}

function threadVisibleInBox(thread: MailThread, box: MailboxBox) {
  const inTrash = Boolean(thread.trashedAt);
  const archived = Boolean(thread.archivedAt);
  const isOutgoing = thread.lastDirection === 'outgoing';
  const isStarred = Boolean(thread.isStarred);

  if (box === 'trash') return inTrash;
  if (inTrash) return false;
  if (box === 'sent') return isOutgoing;
  if (box === 'inbox') return !isOutgoing && !archived;
  if (box === 'starred') return isStarred;
  return true;
}

export function MailboxShellScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const composerRef = useRef<HTMLDivElement | null>(null);
  const autoConnectTriggeredRef = useRef(false);
  const autoSyncTriggeredRef = useRef<Set<string>>(new Set());

  const routeBox = resolveMailboxBox(searchParams.get('box'));
  const routeQuery = searchParams.get('mailboxQuery') || '';
  const routeAccountId = searchParams.get('accountId') || '';
  const routeThreadId = searchParams.get('threadId') || '';
  const routeHeadquarterId = searchParams.get('headquarterId') || '';
  const routeReportKey = searchParams.get('reportKey') || '';
  const routeSiteId = searchParams.get('siteId') || '';
  const oauthNotice = searchParams.get('oauthNotice') || '';
  const oauthError = searchParams.get('oauthError') || '';

  const [session, setSession] = useState<DemoSession | null>(null);
  const [accounts, setAccounts] = useState<MailAccount[]>([]);
  const [providerStatuses, setProviderStatuses] = useState<MailProviderStatus[]>([]);
  const [drafts, setDrafts] = useState<MailboxDraft[]>([]);
  const [threads, setThreads] = useState<MailThread[]>([]);
  const [threadDetail, setThreadDetail] = useState<MailThreadDetail | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState(routeAccountId || '');
  const [selectedThreadId, setSelectedThreadId] = useState(routeThreadId || '');
  const [selectedDraftId, setSelectedDraftId] = useState('');
  const [activeBox, setActiveBox] = useState<MailboxBox>(routeBox);
  const [searchBox, setSearchBox] = useState<MailboxBox>('all');
  const [query, setQuery] = useState(routeQuery);
  const [composeIntent, setComposeIntent] = useState<ComposeIntent>('new');
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMinimized, setComposeMinimized] = useState(false);
  const [composeMaximized, setComposeMaximized] = useState(false);
  const [compose, setCompose] = useState<ComposeState>(buildEmptyComposeState);
  const [attachments, setAttachments] = useState<MailboxAttachmentDraft[]>([]);
  const [recipientSuggestions, setRecipientSuggestions] = useState<MailRecipientSuggestion[]>([]);
  const [recipientSuggestionsLoading, setRecipientSuggestionsLoading] = useState(false);
  const [recipientSuggestionsOpen, setRecipientSuggestionsOpen] = useState(false);
  const [recipientSuggestionIndex, setRecipientSuggestionIndex] = useState(0);
  const [appMenuOpen, setAppMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedHistoryIds, setExpandedHistoryIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [draftStatus, setDraftStatus] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  const deferredQuery = useDeferredValue(query.trim());
  const deferredRecipientQuery = useDeferredValue(compose.toInput.trim());
  const googleProviderStatus = providerStatuses.find((item) => item.provider === 'google') ?? null;
  const canUseMailbox = Boolean(session && isAuthenticatedSession(session));
  const effectiveBox = deferredQuery ? searchBox : activeBox;
  const selectedAccount =
    selectedAccountId && selectedAccountId !== ALL_ACCOUNTS_FILTER
      ? accounts.find((account) => account.id === selectedAccountId) ?? null
      : null;
  const composeAccount =
    selectedAccount ??
    accounts.find((account) => account.isDefault) ??
    accounts[0] ??
    null;
  const composeAccountSyncMeta = readGoogleSyncMetadata(composeAccount);
  const canSendCompose = Boolean(
    composeAccount &&
      dedupeRecipients([
        ...compose.toRecipients,
        ...(isLikelyEmail(compose.toInput.trim()) ? [compose.toInput.trim()] : []),
      ]).length > 0 &&
      compose.subject.trim() &&
      stripHtmlToText(compose.body).trim(),
  );

  const replaceMailboxQuery = useCallback((updates: Record<string, string | null>) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      const normalized = String(value ?? '').trim();
      if (!normalized) {
        nextParams.delete(key);
        return;
      }
      nextParams.set(key, normalized);
    });
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const nextSession = await bootstrapDemoSession();
        if (cancelled) return;
        setSession(nextSession);
        if (!isAuthenticatedSession(nextSession)) {
          setIsLoading(false);
          return;
        }

        const [nextAccounts, nextStatuses, nextDrafts] = await Promise.all([
          listMailAccounts(),
          getMailProviderStatus(),
          listMailboxDrafts(),
        ]);
        if (cancelled) return;
        setAccounts(nextAccounts);
        setProviderStatuses(nextStatuses);
        setDrafts(nextDrafts);
        setSelectedAccountId((current) =>
          current || routeAccountId || (nextAccounts.length > 1 ? ALL_ACCOUNTS_FILTER : nextAccounts[0]?.id || ''),
        );
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : '메일함을 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [routeAccountId]);

  useEffect(() => {
    const storedNotice =
      typeof window === 'undefined' ? '' : window.sessionStorage.getItem(MAILBOX_OAUTH_NOTICE_KEY) || '';
    const storedError =
      typeof window === 'undefined' ? '' : window.sessionStorage.getItem(MAILBOX_OAUTH_ERROR_KEY) || '';
    const nextNotice = oauthNotice || storedNotice;
    const nextError = oauthError || storedError;

    if (nextNotice) setNotice(nextNotice);
    if (nextError) setError(nextError);

    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(MAILBOX_OAUTH_NOTICE_KEY);
      window.sessionStorage.removeItem(MAILBOX_OAUTH_ERROR_KEY);
    }

    if (!oauthNotice && !oauthError) return;
    replaceMailboxQuery({
      oauthNotice: null,
      oauthError: null,
    });
  }, [oauthError, oauthNotice, replaceMailboxQuery]);

  useEffect(() => {
    setActiveBox(routeBox);
  }, [routeBox]);

  useEffect(() => {
    setQuery(routeQuery);
  }, [routeQuery]);

  useEffect(() => {
    if (!selectedAccountId && accounts.length > 0) {
      setSelectedAccountId(accounts.length > 1 ? ALL_ACCOUNTS_FILTER : accounts[0]?.id || '');
    }
  }, [accounts, selectedAccountId]);

  useEffect(() => {
    if (selectedAccountId === ALL_ACCOUNTS_FILTER) {
      return;
    }
    if (selectedAccountId && accounts.some((account) => account.id === selectedAccountId)) {
      return;
    }
    setSelectedAccountId(accounts.length > 1 ? ALL_ACCOUNTS_FILTER : accounts[0]?.id || '');
  }, [accounts, selectedAccountId]);

  useEffect(() => {
    if (autoConnectTriggeredRef.current) return;
    if (!canUseMailbox || accounts.length > 0 || !googleProviderStatus?.enabled) return;
    if (!hasPendingGoogleMailConnect()) return;

    autoConnectTriggeredRef.current = true;
    void (async () => {
      try {
        const next = await startMailConnect();
        clearPendingGoogleMailConnect();
        window.location.href = next.authorizationUrl;
      } catch (nextError) {
        autoConnectTriggeredRef.current = false;
        setError(nextError instanceof Error ? nextError.message : '메일 계정 연결을 시작하지 못했습니다.');
      }
    })();
  }, [accounts.length, canUseMailbox, googleProviderStatus?.enabled]);

  useEffect(() => {
    if (!canUseMailbox || syncing || accounts.length === 0) return;
    const pendingAccount = accounts.find((account) => {
      const metadata = readGoogleSyncMetadata(account);
      if (!metadata) return false;
      return !metadata.initialBackfillCompleted && metadata.syncStatus !== 'backfilling';
    });
    if (!pendingAccount) return;
    if (autoSyncTriggeredRef.current.has(pendingAccount.id)) return;

    autoSyncTriggeredRef.current.add(pendingAccount.id);
    void (async () => {
      try {
        setSyncing(true);
        const summary = await syncMailAccounts();
        const [nextAccounts, nextStatuses, nextDrafts] = await Promise.all([
          listMailAccounts(),
          getMailProviderStatus(),
          listMailboxDrafts(),
        ]);
        setAccounts(nextAccounts);
        setProviderStatuses(nextStatuses);
        setDrafts(nextDrafts);
        setReloadToken((current) => current + 1);
        const segments = [
          `스레드 ${summary.threadCount}건`,
          `메시지 ${summary.messageCount}건`,
        ];
        if (summary.backfillAccountCount > 0) {
          segments.unshift(`초기 백필 ${summary.backfillAccountCount}개`);
        }
        if (summary.incrementalAccountCount > 0) {
          segments.unshift(`증분 동기화 ${summary.incrementalAccountCount}개`);
        }
        setNotice(`메일 동기화를 완료했습니다. ${segments.join(' / ')}.`);
        if (summary.syncErrors.length > 0) {
          setError(summary.syncErrors.join('\n'));
        }
      } catch {
        autoSyncTriggeredRef.current.delete(pendingAccount.id);
      } finally {
        setSyncing(false);
      }
    })();
  }, [accounts, canUseMailbox, syncing]);

  useEffect(() => {
    let cancelled = false;
    if (!canUseMailbox || accounts.length === 0 || effectiveBox === 'drafts') {
      setThreads([]);
      setThreadDetail(null);
      setThreadLoading(false);
      return;
    }

    void (async () => {
      try {
        setThreadLoading(true);
        const response = await listMailThreads({
          accountId: selectedAccountId === ALL_ACCOUNTS_FILTER ? '' : selectedAccountId,
          box: effectiveBox,
          headquarterId: routeHeadquarterId,
          query: deferredQuery,
          reportKey: routeReportKey,
          siteId: routeSiteId,
        });
        if (cancelled) return;
        setThreads(response.rows);
        setSelectedThreadId((current) =>
          current && response.rows.some((row) => row.id === current) ? current : response.rows[0]?.id || '',
        );
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : '메일 목록을 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) {
          setThreadLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    accounts.length,
    canUseMailbox,
    deferredQuery,
    effectiveBox,
    reloadToken,
    routeHeadquarterId,
    routeReportKey,
    routeSiteId,
    selectedAccountId,
  ]);

  useEffect(() => {
    let cancelled = false;
    if (!canUseMailbox || effectiveBox === 'drafts' || !selectedThreadId) {
      setThreadDetail(null);
      return;
    }

    void (async () => {
      try {
        const detail = await getMailThreadDetail(selectedThreadId);
        if (cancelled) return;
        setThreadDetail(detail);
        if (detail.thread.isUnread || !detail.thread.lastOpenedAt) {
          const updated = await updateMailThreadState(selectedThreadId, { markRead: true });
          if (cancelled) return;
          setThreads((current) => current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
          setThreadDetail((current) =>
            current && current.thread.id === updated.id ? { ...current, thread: { ...current.thread, ...updated } } : current,
          );
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : '메일 본문을 불러오지 못했습니다.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canUseMailbox, effectiveBox, reloadToken, selectedThreadId]);

  useEffect(() => {
    let cancelled = false;
    if (!canUseMailbox || !composeOpen || !composeAccount?.id || !deferredRecipientQuery || !recipientSuggestionsOpen) {
      setRecipientSuggestions([]);
      setRecipientSuggestionsLoading(false);
      return;
    }

    void (async () => {
      try {
        setRecipientSuggestionsLoading(true);
        const nextRows = await listRecipientSuggestions({
          accountId: composeAccount.id,
          query: deferredRecipientQuery,
        });
        if (!cancelled) {
          setRecipientSuggestions(nextRows);
          setRecipientSuggestionIndex(0);
        }
      } catch {
        if (!cancelled) {
          setRecipientSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setRecipientSuggestionsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canUseMailbox, composeAccount?.id, composeOpen, deferredRecipientQuery, recipientSuggestionsOpen]);

  useEffect(() => {
    if (!canUseMailbox || !composeOpen || !composeAccount?.id) return;
    if (!draftHasContent(compose, attachments)) {
      setDraftStatus('');
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        try {
          setDraftStatus('임시 저장 중');
          const payload = {
            accountId: composeAccount.id,
            attachments: attachments.map((attachment) => ({
              contentType: attachment.contentType,
              dataBase64: attachment.dataBase64,
              downloadUrl: attachment.downloadUrl,
              filename: attachment.filename,
              sizeBytes: attachment.sizeBytes,
              source: attachment.source,
            })),
            body: compose.body,
            ccRecipients: extractCcRecipients(compose.ccInput),
            headquarterId: routeHeadquarterId,
            recipients: dedupeRecipients([
              ...compose.toRecipients,
              ...(isLikelyEmail(compose.toInput.trim()) ? [compose.toInput.trim()] : []),
            ]),
            reportKeys: routeReportKey ? [routeReportKey] : [],
            siteId: routeSiteId,
            subject: compose.subject,
          };
          const saved = selectedDraftId ? await updateDraft(selectedDraftId, payload) : await createDraft(payload);
          setDrafts((current) => upsertDraft(current, saved));
          setSelectedDraftId(saved.id);
          setDraftStatus(`임시 저장 ${formatDateTime(saved.updatedAt)}`);
        } catch (nextError) {
          setDraftStatus('');
          setError(nextError instanceof Error ? nextError.message : '임시보관함 저장에 실패했습니다.');
        }
      })();
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [
    attachments,
    canUseMailbox,
    compose,
    composeAccount?.id,
    composeOpen,
    routeHeadquarterId,
    routeReportKey,
    routeSiteId,
    selectedDraftId,
  ]);

  const visibleDrafts = useMemo(() => {
    return drafts.filter((draft) => {
      if (selectedAccountId && selectedAccountId !== ALL_ACCOUNTS_FILTER && draft.accountId && draft.accountId !== selectedAccountId) {
        return false;
      }
      if (!deferredQuery) return true;
      return [draft.subject, draft.body, ...draft.recipients, ...draft.ccRecipients]
        .join(' ')
        .toLowerCase()
        .includes(deferredQuery.toLowerCase());
    });
  }, [deferredQuery, drafts, selectedAccountId]);

  const accountLabel =
    !canUseMailbox
      ? '로그인이 필요합니다'
      : selectedAccountId === ALL_ACCOUNTS_FILTER
        ? `${accounts.length}개 연결 계정`
        : selectedAccount?.mailboxLabel || composeAccount?.mailboxLabel || '연결 계정';
  const statusLabel =
    !canUseMailbox
      ? '로그인 필요'
      : accounts.length > 0
        ? `연결 계정 ${accounts.length}개`
        : googleProviderStatus?.enabled
          ? '연결 가능'
          : '설정 확인 필요';
  const statusTone = !canUseMailbox ? 'warning' : accounts.length > 0 ? 'success' : googleProviderStatus?.enabled ? 'warning' : 'muted';

  const recipientOptions = useMemo(
    () =>
      recipientSuggestions.map((item) => ({
        ...item,
        label: item.name?.trim() ? `${item.name} <${item.email}>` : item.email,
      })),
    [recipientSuggestions],
  );

  const handleSetCompose = (updater: (current: ComposeState) => ComposeState) => {
    setCompose((current) => updater(current));
  };

  const syncMailboxResources = useCallback(async () => {
    const [nextAccounts, nextStatuses, nextDrafts] = await Promise.all([
      listMailAccounts(),
      getMailProviderStatus(),
      listMailboxDrafts(),
    ]);
    setAccounts(nextAccounts);
    setProviderStatuses(nextStatuses);
    setDrafts(nextDrafts);
  }, []);

  const openBox = (box: MailboxBox) => {
    setActiveBox(box);
    setSelectedThreadId('');
    setThreadDetail(null);
    replaceMailboxQuery({
      box,
      threadId: null,
    });
    if (box === 'drafts') {
      setSidebarOpen(false);
    }
  };

  const handleSelectAccount = (value: string) => {
    setSelectedAccountId(value);
    setSelectedThreadId('');
    replaceMailboxQuery({
      accountId: value === ALL_ACCOUNTS_FILTER ? null : value,
      threadId: null,
    });
  };

  const handleSearchChange = (value: string) => {
    setQuery(value);
    if (value.trim()) {
      setSearchBox('all');
    }
    replaceMailboxQuery({
      mailboxQuery: value.trim() || null,
    });
  };

  const handleOpenNewMail = () => {
    setComposeIntent('new');
    setCompose(buildEmptyComposeState());
    setAttachments([]);
    setSelectedDraftId('');
    setComposeOpen(true);
    setComposeMinimized(false);
    setComposeMaximized(false);
    setError('');
    replaceMailboxQuery({
      compose: 'new',
      draftId: null,
    });
  };

  const handleOpenThread = (threadId: string) => {
    setSelectedThreadId(threadId);
    setSidebarOpen(false);
    replaceMailboxQuery({
      threadId,
    });
  };

  const handleSelectDraft = (draft: MailboxDraft) => {
    setActiveBox('drafts');
    setComposeIntent('draft');
    setSelectedDraftId(draft.id);
    setCompose({
      body: draft.body,
      ccInput: draft.ccRecipients.join(', '),
      subject: draft.subject,
      toInput: '',
      toRecipients: draft.recipients,
    });
    setAttachments(draft.attachments.map(mapDraftAttachment));
    setComposeOpen(true);
    setComposeMinimized(false);
    setComposeMaximized(false);
    replaceMailboxQuery({
      box: 'drafts',
      compose: 'draft',
      draftId: draft.id,
    });
  };

  const handleDeleteDraft = async (draftId: string) => {
    try {
      await removeDraft(draftId);
      setDrafts((current) => current.filter((draft) => draft.id !== draftId));
      if (draftId === selectedDraftId) {
        setSelectedDraftId('');
        setCompose(buildEmptyComposeState());
        setAttachments([]);
        setComposeOpen(false);
        replaceMailboxQuery({
          compose: null,
          draftId: null,
        });
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '임시보관 메일 삭제에 실패했습니다.');
    }
  };

  const handleSync = useCallback(async () => {
    try {
      setSyncing(true);
      const summary = await syncMailAccounts();
      await syncMailboxResources();
      setReloadToken((current) => current + 1);
      const segments = [
        `스레드 ${summary.threadCount}건`,
        `메시지 ${summary.messageCount}건`,
      ];
      if (summary.backfillAccountCount > 0) {
        segments.unshift(`초기 백필 ${summary.backfillAccountCount}개`);
      }
      if (summary.incrementalAccountCount > 0) {
        segments.unshift(`증분 동기화 ${summary.incrementalAccountCount}개`);
      }
      setNotice(`메일 동기화를 완료했습니다. ${segments.join(' / ')}.`);
      if (summary.syncErrors.length > 0) {
        setError(summary.syncErrors.join('\n'));
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '메일 동기화에 실패했습니다.');
    } finally {
      setSyncing(false);
    }
  }, [syncMailboxResources]);

  const handleConnectGoogle = async () => {
    try {
      const next = await startMailConnect();
      window.location.href = next.authorizationUrl;
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '메일 계정 연결을 시작하지 못했습니다.');
    }
  };

  const patchThread = async (
    thread: MailThread,
    input: { isArchived?: boolean; isStarred?: boolean; isTrashed?: boolean; markRead?: boolean; restore?: boolean },
    nextNotice?: string,
  ) => {
    const updated = await updateMailThreadState(thread.id, input);
    setThreads((current) => {
      const nextRows = current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item));
      return threadVisibleInBox(updated, effectiveBox) ? nextRows : nextRows.filter((item) => item.id !== updated.id);
    });
    setThreadDetail((current) =>
      current && current.thread.id === updated.id ? { ...current, thread: { ...current.thread, ...updated } } : current,
    );
    if (!threadVisibleInBox(updated, effectiveBox)) {
      setSelectedThreadId((current) => (current === updated.id ? '' : current));
      setThreadDetail((current) => (current?.thread.id === updated.id ? null : current));
    }
    if (nextNotice) setNotice(nextNotice);
    setReloadToken((current) => current + 1);
  };

  const handleReply = () => {
    if (!threadDetail) return;
    setCompose({
      body: '',
      ccInput: '',
      subject: buildReplySubject(threadDetail.thread.subject || ''),
      toInput: '',
      toRecipients: dedupeRecipients(
        buildThreadRecipients(threadDetail.thread, threadDetail.thread.accountEmail)
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    });
    setComposeIntent('reply');
    setAttachments([]);
    setSelectedDraftId('');
    setComposeOpen(true);
    setComposeMinimized(false);
    replaceMailboxQuery({ compose: 'reply', draftId: null });
  };

  const handleForward = () => {
    const primaryMessage = threadDetail?.messages[threadDetail.messages.length - 1];
    if (!primaryMessage || !threadDetail) return;
    setCompose({
      body: buildForwardBody(primaryMessage),
      ccInput: '',
      subject: buildForwardSubject(primaryMessage.subject || threadDetail.thread.subject || ''),
      toInput: '',
      toRecipients: [],
    });
    setComposeIntent('forward');
    setAttachments([]);
    setSelectedDraftId('');
    setComposeOpen(true);
    setComposeMinimized(false);
    replaceMailboxQuery({ compose: 'forward', draftId: null });
  };

  const handleSend = async () => {
    if (!composeAccount) return;
    const recipients = dedupeRecipients([
      ...compose.toRecipients,
      ...(isLikelyEmail(compose.toInput.trim()) ? [compose.toInput.trim()] : []),
    ]);
    if (recipients.length === 0 || !compose.subject.trim() || !stripHtmlToText(compose.body).trim()) {
      setError('받는 사람, 제목, 본문을 확인해 주세요.');
      return;
    }

    try {
      setError('');
      const primaryMessage = threadDetail?.messages[threadDetail.messages.length - 1];
      await sendMailboxMessage({
        accountId: composeAccount.id,
        attachments,
        body: compose.body,
        cc: buildRecipientObjects(extractCcRecipients(compose.ccInput)),
        forwardedFromMessageId: composeIntent === 'forward' ? primaryMessage?.id : undefined,
        fromName: session?.userName || composeAccount.displayName,
        headquarterId: threadDetail?.thread.headquarterId || routeHeadquarterId,
        recipients: buildRecipientObjects(recipients),
        replyToMessageId: composeIntent === 'reply' ? primaryMessage?.id : undefined,
        reportKeys:
          threadDetail?.thread.reportKey
            ? [threadDetail.thread.reportKey]
            : routeReportKey
              ? [routeReportKey]
              : [],
        siteId: threadDetail?.thread.siteId || routeSiteId,
        subject: compose.subject,
        threadId: composeIntent === 'reply' ? threadDetail?.thread.id || '' : '',
      });
      if (selectedDraftId) {
        await removeDraft(selectedDraftId).catch(() => undefined);
        setDrafts((current) => current.filter((draft) => draft.id !== selectedDraftId));
      }
      setCompose(buildEmptyComposeState());
      setAttachments([]);
      setSelectedDraftId('');
      setComposeIntent('new');
      setComposeOpen(false);
      setComposeMinimized(false);
      setComposeMaximized(false);
      setNotice('메일을 발송했습니다.');
      setActiveBox('sent');
      setQuery('');
      setSearchBox('all');
      replaceMailboxQuery({
        box: 'sent',
        compose: null,
        draftId: null,
        mailboxQuery: null,
      });
      setReloadToken((current) => current + 1);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '메일 발송에 실패했습니다.');
    }
  };

  const handleAttachmentChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    setAttachments((current) => [
      ...current,
      ...files.map((file) => ({
        contentType: file.type || 'application/octet-stream',
        file,
        filename: file.name,
        id: `${file.name}-${file.size}-${file.lastModified}`,
        sizeBytes: file.size,
        source: 'inline',
      })),
    ]);
    event.target.value = '';
  };

  if (isLoading) {
    return <div className={styles.host} />;
  }

  return (
    <div className={styles.host}>
      <MailboxTopbar
        accountLabel={accountLabel}
        canCompose={Boolean(canUseMailbox && composeAccount)}
        onOpenAccount={() => {
          if (canUseMailbox) {
            router.push('/account#account');
            return;
          }
          void beginGoogleWorkspaceAuth({ nextPath: '/mailbox?box=inbox' }).catch((nextError) => {
            setError(nextError instanceof Error ? nextError.message : '구글 로그인으로 이동하지 못했습니다.');
          });
        }}
        onOpenCompose={handleOpenNewMail}
        onOpenDrawer={() => setSidebarOpen(true)}
        onOpenWorkMenu={() => setAppMenuOpen(true)}
        onSync={() => void handleSync()}
        query={query}
        setQuery={handleSearchChange}
        statusLabel={syncing ? '동기화 중' : statusLabel}
      statusTone={statusTone}
      />

      {error ? <div className={styles.bannerError}>{error}</div> : null}
      {notice ? <div className={styles.bannerNotice}>{notice}</div> : null}
      {composeAccountSyncMeta && !composeAccountSyncMeta.initialBackfillCompleted && !error ? (
        <div className={styles.bannerNotice}>
          {composeAccountSyncMeta.syncStatus === 'backfilling'
            ? '받은편지함과 보낸편지함을 가져오는 중입니다.'
            : composeAccountSyncMeta.syncError
              ? composeAccountSyncMeta.syncError
              : '연결된 Gmail 계정의 초기 메일 동기화를 준비하고 있습니다.'}
        </div>
      ) : null}

      <div className={styles.layout}>
        <div className={styles.sidebarPane}>
          <MailboxSidebar
            accounts={accounts}
            activeBox={activeBox}
            onCompose={handleOpenNewMail}
            onSelectAccount={handleSelectAccount}
            onSelectBox={openBox}
            selectedAccountId={selectedAccountId || (accounts.length > 1 ? ALL_ACCOUNTS_FILTER : accounts[0]?.id || '')}
          />
        </div>

        {sidebarOpen ? (
          <>
            <div className={styles.scrim} role="presentation" onClick={() => setSidebarOpen(false)} />
            <div className={styles.sidebarDrawer}>
              <MailboxSidebar
                accounts={accounts}
                activeBox={activeBox}
                onCompose={handleOpenNewMail}
                onSelectAccount={(value) => {
                  handleSelectAccount(value);
                  setSidebarOpen(false);
                }}
                onSelectBox={(value) => {
                  openBox(value);
                  setSidebarOpen(false);
                }}
                selectedAccountId={selectedAccountId || (accounts.length > 1 ? ALL_ACCOUNTS_FILTER : accounts[0]?.id || '')}
              />
            </div>
          </>
        ) : null}

        <div className={styles.threadPane}>
          {!canUseMailbox ? (
            <MailboxOnboardingState
              actionLabel="Google로 로그인"
              description="메일함을 사용하려면 먼저 앱 계정으로 로그인한 뒤 메일 계정을 연결해야 합니다. 로그인 후 받은편지함과 보낸편지함을 한 화면에서 관리할 수 있습니다."
              helperLabel="로그인 필요"
              onAction={() => {
                void beginGoogleWorkspaceAuth({ nextPath: '/mailbox?box=inbox' }).catch((nextError) => {
                  setError(nextError instanceof Error ? nextError.message : '구글 로그인으로 이동하지 못했습니다.');
                });
              }}
              title="메일함을 시작하려면 로그인하세요."
            />
          ) : accounts.length === 0 ? (
            <MailboxOnboardingState
              actionLabel="Google 메일 연결"
              description={
                googleProviderStatus?.message ||
                '연결 후 받은편지함, 보낸편지함, 전역 메일 검색, floating compose를 바로 사용할 수 있습니다.'
              }
              helperLabel={googleProviderStatus?.enabled ? '연결 가능' : '설정 확인 필요'}
              onAction={() => void handleConnectGoogle()}
              onSecondaryAction={() => void handleSync()}
              title="연결된 메일 계정이 없습니다."
            />
          ) : (
            <MailboxThreadListPane
              activeBox={effectiveBox}
              drafts={visibleDrafts}
              loading={threadLoading}
              query={query}
              searchBox={searchBox}
              selectedDraftId={selectedDraftId}
              selectedThreadId={selectedThreadId}
              threads={threads}
              onDeleteDraft={(draftId) => void handleDeleteDraft(draftId)}
              onOpenDraft={handleSelectDraft}
              onOpenThread={handleOpenThread}
              onSearchBoxChange={setSearchBox}
              onToggleStar={(thread) => void patchThread(thread, { isStarred: !thread.isStarred }, thread.isStarred ? '중요 표시를 해제했습니다.' : '중요 메일에 추가했습니다.')}
            />
          )}
        </div>

        <div className={`${styles.viewerPane} ${selectedThreadId ? styles.viewerPaneOpen : ''}`}>
          <MailboxViewerPane
            activeBox={effectiveBox}
            detail={effectiveBox === 'drafts' ? null : threadDetail}
            expandedMessageIds={expandedHistoryIds}
            onArchive={(thread) => void patchThread(thread, { isArchived: true }, '메일을 보관했습니다.')}
            onForward={handleForward}
            onReply={handleReply}
            onRestore={(thread) => void patchThread(thread, { restore: true }, '메일을 복원했습니다.')}
            onToggleHistory={(messageId) =>
              setExpandedHistoryIds((current) => {
                const next = new Set(current);
                if (next.has(messageId)) next.delete(messageId);
                else next.add(messageId);
                return next;
              })
            }
            onToggleStar={(thread) => void patchThread(thread, { isStarred: !thread.isStarred }, thread.isStarred ? '중요 표시를 해제했습니다.' : '중요 메일에 추가했습니다.')}
            onTrash={(thread) => void patchThread(thread, { isTrashed: true }, '메일을 휴지통으로 이동했습니다.')}
          />
        </div>
      </div>

        <MailboxComposePanel
          attachments={attachments}
          canSend={canSendCompose}
          compose={compose}
        composeOpen={composeOpen}
        composeStatus={draftStatus}
        composerRef={composerRef}
        draftId={selectedDraftId}
        maximized={composeMaximized}
        minimized={composeMinimized}
        onAttachmentChange={handleAttachmentChange}
        onClose={() => {
          setComposeOpen(false);
          setComposeMinimized(false);
          setComposeMaximized(false);
          replaceMailboxQuery({ compose: null });
        }}
        onDeleteDraft={(draftId) => void handleDeleteDraft(draftId)}
        onMaximize={() => setComposeMaximized((current) => !current)}
        onMinimize={() => setComposeMinimized((current) => !current)}
        onRemoveAttachment={(attachmentId) =>
          setAttachments((current) => current.filter((item) => item.id !== attachmentId))
        }
        onRemoveRecipient={(email) =>
          handleSetCompose((current) => ({
            ...current,
            toRecipients: current.toRecipients.filter((item) => item !== email),
          }))
        }
        onSend={() => void handleSend()}
        onSetCompose={handleSetCompose}
        onSelectSuggestion={(suggestion) =>
          handleSetCompose((current) => ({
            ...current,
            toInput: '',
            toRecipients: dedupeRecipients([...current.toRecipients, suggestion.email]),
          }))
        }
        recipientSuggestionIndex={recipientSuggestionIndex}
        recipientSuggestions={recipientOptions}
        recipientSuggestionsLoading={recipientSuggestionsLoading}
        recipientSuggestionsOpen={recipientSuggestionsOpen}
        setRecipientSuggestionIndex={setRecipientSuggestionIndex}
        setRecipientSuggestionsOpen={setRecipientSuggestionsOpen}
      />

      <MailboxAppMenuDrawer open={appMenuOpen} onClose={() => setAppMenuOpen(false)} />
    </div>
  );
}

export default MailboxShellScreen;
