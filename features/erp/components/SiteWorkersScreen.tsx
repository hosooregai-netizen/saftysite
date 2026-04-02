'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import LoginPanel from '@/components/auth/LoginPanel';
import {
  SafetyApiError,
  blockSiteWorker,
  createSiteWorker,
  createSiteWorkerMobileSession,
  fetchSafetyContentItems,
  fetchSafetySiteDashboard,
  fetchSiteWorkerMobileSessions,
  fetchSiteWorkers,
  importSiteWorkers,
  revokeSiteWorkerMobileSession,
  updateSiteWorker,
} from '@/lib/safetyApi';
import type {
  SafetyContentItem,
  SafetyEmploymentType,
  SafetySiteDashboard,
  SiteWorker,
  SiteWorkerImportError,
  SiteWorkerImportResponse,
  WorkerMobileSession,
} from '@/types/backend';
import { useErpProtectedScreen } from '@/features/erp/hooks/useErpProtectedScreen';
import {
  buildSiteDashboardHref,
  buildSiteSafetyHref,
  buildSiteWorkersHref,
  formatErpDateTime,
  getTemplateTypesForDocuments,
  getWorkerAckTimestamp,
  isWorkerAckTarget,
  toLineItems,
  WORKER_ACK_DRILLDOWN_LABELS,
  type WorkerAckDrilldownKind,
} from '@/features/erp/lib/shared';
import { ErpSiteShell } from './ErpSiteShell';
import styles from './ErpScreen.module.css';

interface WorkerFormState {
  ack_exemptions: WorkerAckDrilldownKind[];
  company_name: string;
  employment_type: SafetyEmploymentType;
  name: string;
  phone: string;
  ppe_issues_text: string;
  special_access: string;
  trade: string;
}

interface BulkIssuedWorkerCard {
  session: WorkerMobileSession;
  worker: SiteWorker;
}

const WORKER_SESSION_STATUS_LABELS = {
  active: '사용 가능',
  expired: '만료',
  revoked: '강제 만료',
  blocked: '차단됨',
} as const;
const ACK_EXEMPTION_OPTIONS: Array<{
  description: string;
  kind: WorkerAckDrilldownKind;
  label: string;
}> = [
  {
    kind: 'hazard_notice',
    label: WORKER_ACK_DRILLDOWN_LABELS.hazard_notice,
    description: '오늘 공지 확인 대상에서 제외',
  },
  {
    kind: 'tbm',
    label: WORKER_ACK_DRILLDOWN_LABELS.tbm,
    description: 'TBM 확인 대상에서 제외',
  },
  {
    kind: 'safety_education',
    label: WORKER_ACK_DRILLDOWN_LABELS.safety_education,
    description: '안전 교육 확인 대상에서 제외',
  },
];

const EMPTY_WORKER_FORM: WorkerFormState = {
  ack_exemptions: [],
  company_name: '',
  employment_type: 'daily',
  name: '',
  phone: '',
  ppe_issues_text: '',
  special_access: '',
  trade: '',
};

function getErrorMessage(error: unknown): string {
  if (error instanceof SafetyApiError || error instanceof Error) {
    return error.message;
  }

  return '출입자 데이터를 처리하는 중 오류가 발생했습니다.';
}

function normalizeContentList(body: unknown): string[] {
  if (Array.isArray(body)) {
    return body
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean);
  }

  if (typeof body === 'string') {
    return body
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (body && typeof body === 'object') {
    const values = Object.values(body as Record<string, unknown>);
    return values
      .flatMap((value) => normalizeContentList(value))
      .filter(Boolean);
  }

  return [];
}

function buildWorkerForm(worker: SiteWorker | null): WorkerFormState {
  if (!worker) return EMPTY_WORKER_FORM;

  return {
    ack_exemptions: worker.ack_exemptions ?? [],
    company_name: worker.company_name || '',
    employment_type: worker.employment_type,
    name: worker.name,
    phone: worker.phone || '',
    ppe_issues_text: (worker.ppe_issues ?? []).join('\n'),
    special_access: worker.special_access || '',
    trade: worker.trade || '',
  };
}

function mergeWorkersById(current: SiteWorker[], incoming: SiteWorker[]): SiteWorker[] {
  const next = new Map<string, SiteWorker>();
  for (const worker of [...incoming, ...current]) {
    next.set(worker.id, worker);
  }
  return Array.from(next.values()).sort((left, right) => {
    if (left.is_blocked !== right.is_blocked) {
      return Number(left.is_blocked) - Number(right.is_blocked);
    }
    return String(right.created_at).localeCompare(String(left.created_at));
  });
}

function getEmploymentTypeLabel(value: SafetyEmploymentType): string {
  if (value === 'daily') return '일용직';
  if (value === 'regular') return '상용직';
  if (value === 'partner') return '협력사';
  return '기타';
}

function parseAckFilterKind(value: string | null): WorkerAckDrilldownKind | null {
  if (value === 'hazard_notice' || value === 'tbm' || value === 'safety_education') {
    return value;
  }
  return null;
}

function buildAbsoluteEntryUrl(entryUrl: string): string {
  if (typeof window === 'undefined') {
    return entryUrl;
  }
  return new URL(entryUrl, window.location.origin).toString();
}

function escapeCsvCell(value: string): string {
  const normalized = value.replaceAll('"', '""');
  return /[",\n]/.test(normalized) ? `"${normalized}"` : normalized;
}

function downloadCsvFile(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map((cell) => escapeCsvCell(cell)).join(',')).join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function buildImportErrorCsv(summary: SiteWorkerImportResponse): string[][] {
  const rawKeys = Array.from(
    new Set(summary.errors.flatMap((item) => Object.keys(item.raw ?? {})))
  );

  return [
    ['row_number', 'name', 'message', ...rawKeys],
    ...summary.errors.map((item) => [
      String(item.row_number),
      item.name ?? '',
      item.message,
      ...rawKeys.map((key) => String(item.raw?.[key] ?? '')),
    ]),
  ];
}

function asImportErrorRawString(
  raw: SiteWorkerImportError['raw'],
  key: keyof SiteWorkerImportError['raw']
): string {
  return typeof raw[key] === 'string' ? raw[key] : '';
}

function buildWorkerFormFromImportError(errorItem: SiteWorkerImportError): WorkerFormState {
  return {
    ack_exemptions: [],
    company_name: asImportErrorRawString(errorItem.raw, 'company_name'),
    employment_type: (asImportErrorRawString(errorItem.raw, 'employment_type') ||
      'daily') as SafetyEmploymentType,
    name: asImportErrorRawString(errorItem.raw, 'name'),
    phone: asImportErrorRawString(errorItem.raw, 'phone'),
    ppe_issues_text: asImportErrorRawString(errorItem.raw, 'ppe_issues').replaceAll(';', '\n'),
    special_access: asImportErrorRawString(errorItem.raw, 'special_access'),
    trade: asImportErrorRawString(errorItem.raw, 'trade'),
  };
}

interface SiteWorkersScreenProps {
  siteKey: string;
}

export function SiteWorkersScreen({ siteKey }: SiteWorkersScreenProps) {
  const searchParams = useSearchParams();
  const { authError, currentUser, isAuthenticated, isReady, login, logout, shouldShowLogin, token } =
    useErpProtectedScreen();
  const csvInputRef = useRef<HTMLInputElement | null>(null);
  const workerFormRef = useRef<HTMLElement | null>(null);
  const autoSelectedFilterKeyRef = useRef<string | null>(null);
  const [dashboard, setDashboard] = useState<SafetySiteDashboard | null>(null);
  const [workers, setWorkers] = useState<SiteWorker[]>([]);
  const [contentItems, setContentItems] = useState<SafetyContentItem[]>([]);
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null);
  const [form, setForm] = useState<WorkerFormState>(EMPTY_WORKER_FORM);
  const [workerSessions, setWorkerSessions] = useState<WorkerMobileSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionQrDataUrls, setSessionQrDataUrls] = useState<Record<string, string>>({});
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const [bulkIssuedCards, setBulkIssuedCards] = useState<BulkIssuedWorkerCard[]>([]);
  const [bulkIssuedQrDataUrls, setBulkIssuedQrDataUrls] = useState<Record<string, string>>({});
  const [importSummary, setImportSummary] = useState<SiteWorkerImportResponse | null>(null);
  const [query, setQuery] = useState('');
  const [showBlocked, setShowBlocked] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const load = useCallback(async (authToken: string) => {
    const [dashboardResponse, workersResponse, contentResponse] = await Promise.all([
      fetchSafetySiteDashboard(authToken, siteKey),
      fetchSiteWorkers(authToken, { siteId: siteKey, limit: 1000 }),
      fetchSafetyContentItems(authToken),
    ]);

    setDashboard(dashboardResponse);
    setWorkers(workersResponse);
    setContentItems(
      contentResponse.filter((item) => getTemplateTypesForDocuments().includes(item.content_type))
    );
  }, [siteKey]);

  useEffect(() => {
    if (!token || !isAuthenticated) return;

    let isDisposed = false;
    const run = async () => {
      setIsLoading(true);
      setError(null);

      try {
        await load(token);
      } catch (nextError) {
        if (!isDisposed) {
          setError(getErrorMessage(nextError));
        }
      } finally {
        if (!isDisposed) {
          setIsLoading(false);
        }
      }
    };

    void run();

    return () => {
      isDisposed = true;
    };
  }, [isAuthenticated, load, token]);

  const ackFilterKind = parseAckFilterKind(searchParams.get('ack'));
  const isPendingOnlyFilter = searchParams.get('status') === 'pending';
  const shouldAutoSelectPending = searchParams.get('select') === 'pending';
  const ackReferenceDocument = useMemo(() => {
    if (!ackFilterKind) return null;
    return (
      dashboard?.latest_documents.find((item) => item.document_kind === ackFilterKind) ?? null
    );
  }, [ackFilterKind, dashboard?.latest_documents]);
  const pendingAckWorkerIds = useMemo(() => {
    if (!ackFilterKind || !ackReferenceDocument) return [];
    const reportUpdatedAt = ackReferenceDocument.updated_at ?? null;
    return workers
      .filter((worker) => isWorkerAckTarget(worker, ackFilterKind))
      .filter((worker) => {
        const acknowledgedAt = getWorkerAckTimestamp(worker, ackFilterKind);
        return !acknowledgedAt || (reportUpdatedAt ? acknowledgedAt < reportUpdatedAt : true);
      })
      .map((worker) => worker.id);
  }, [ackFilterKind, ackReferenceDocument, workers]);

  const filteredWorkers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const pendingWorkerIdSet = new Set(pendingAckWorkerIds);

    return workers.filter((worker) => {
      if (!showBlocked && worker.is_blocked) {
        return false;
      }
      if (ackFilterKind && isPendingOnlyFilter && !pendingWorkerIdSet.has(worker.id)) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [worker.name, worker.company_name, worker.trade, worker.phone]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [ackFilterKind, isPendingOnlyFilter, pendingAckWorkerIds, query, showBlocked, workers]);
  const selectedVisibleActiveWorkers = useMemo(
    () =>
      filteredWorkers.filter(
        (worker) => !worker.is_blocked && selectedWorkerIds.includes(worker.id)
      ),
    [filteredWorkers, selectedWorkerIds]
  );

  useEffect(() => {
    if (!shouldAutoSelectPending || !ackFilterKind) return;
    const nextKey = `${ackFilterKind}:${pendingAckWorkerIds.join(',')}`;
    if (autoSelectedFilterKeyRef.current === nextKey) return;
    autoSelectedFilterKeyRef.current = nextKey;
    setSelectedWorkerIds(pendingAckWorkerIds);
  }, [ackFilterKind, pendingAckWorkerIds, shouldAutoSelectPending]);

  useEffect(() => {
    setSelectedWorkerIds((current) =>
      current.filter((workerId) =>
        workers.some((worker) => worker.id === workerId && !worker.is_blocked)
      )
    );
  }, [workers]);

  const workerTradeSuggestions = useMemo(
    () =>
      contentItems
        .filter((item) => item.content_type === 'worker_trade')
        .flatMap((item) => normalizeContentList(item.body)),
    [contentItems]
  );
  const ppeSuggestions = useMemo(
    () =>
      contentItems
        .filter((item) => item.content_type === 'ppe_catalog')
        .flatMap((item) => normalizeContentList(item.body)),
    [contentItems]
  );

  const currentSite = dashboard?.site ?? null;
  const ackFilterLabel = ackFilterKind ? WORKER_ACK_DRILLDOWN_LABELS[ackFilterKind] : null;
  const currentEditingWorker =
    workers.find((worker) => worker.id === editingWorkerId) ?? null;
  const currentPreviewSession =
    workerSessions.find((session) => session.id === selectedSessionId) ?? workerSessions[0] ?? null;
  const currentPreviewEntryUrl = currentPreviewSession
    ? buildAbsoluteEntryUrl(currentPreviewSession.entry_url)
    : null;
  const isCurrentPreviewActive = currentPreviewSession?.status === 'active';
  const activeWorkerSessions = useMemo(
    () => workerSessions.filter((session) => session.status === 'active'),
    [workerSessions]
  );
  const bulkIssuedSessionIds = useMemo(
    () => new Set(bulkIssuedCards.map((item) => item.session.id)),
    [bulkIssuedCards]
  );
  const currentPreviewQrDataUrl = currentPreviewSession
    ? sessionQrDataUrls[currentPreviewSession.id] ?? null
    : null;

  useEffect(() => {
    let isDisposed = false;

    if (workerSessions.length === 0) {
      setSessionQrDataUrls({});
      return () => {
        isDisposed = true;
      };
    }

    void Promise.all(
      workerSessions.map(async (session) => {
        const nextUrl = await QRCode.toDataURL(buildAbsoluteEntryUrl(session.entry_url), {
          margin: 1,
          width: 240,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        });
        return [session.id, nextUrl] as const;
      })
    )
      .then((pairs) => {
        if (!isDisposed) {
          setSessionQrDataUrls(Object.fromEntries(pairs));
        }
      })
      .catch(() => {
        if (!isDisposed) {
          setSessionQrDataUrls({});
        }
      });

    return () => {
      isDisposed = true;
    };
  }, [workerSessions]);

  useEffect(() => {
    let isDisposed = false;

    if (bulkIssuedCards.length === 0) {
      setBulkIssuedQrDataUrls({});
      return () => {
        isDisposed = true;
      };
    }

    void Promise.all(
      bulkIssuedCards.map(async (item) => {
        const nextUrl = await QRCode.toDataURL(buildAbsoluteEntryUrl(item.session.entry_url), {
          margin: 1,
          width: 240,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        });
        return [item.session.id, nextUrl] as const;
      })
    )
      .then((pairs) => {
        if (!isDisposed) {
          setBulkIssuedQrDataUrls(Object.fromEntries(pairs));
        }
      })
      .catch(() => {
        if (!isDisposed) {
          setBulkIssuedQrDataUrls({});
        }
      });

    return () => {
      isDisposed = true;
    };
  }, [bulkIssuedCards]);

  const loadWorkerSessions = useCallback(
    async (authToken: string, workerId: string) => {
      setIsLoadingSessions(true);
      try {
        const sessions = await fetchSiteWorkerMobileSessions(authToken, workerId, 30);
        setWorkerSessions(sessions);
        setSelectedSessionId((current) =>
          sessions.some((session) => session.id === current) ? current : sessions[0]?.id ?? null
        );
      } finally {
        setIsLoadingSessions(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!token || !editingWorkerId) {
      setWorkerSessions([]);
      setSelectedSessionId(null);
      return;
    }

    void loadWorkerSessions(token, editingWorkerId).catch((nextError: unknown) => {
      setError(getErrorMessage(nextError));
    });
  }, [editingWorkerId, loadWorkerSessions, token]);

  const resetForm = () => {
    setEditingWorkerId(null);
    setForm(EMPTY_WORKER_FORM);
    setWorkerSessions([]);
    setSelectedSessionId(null);
    setSessionQrDataUrls({});
  };

  const toggleWorkerSelection = (workerId: string) => {
    setSelectedWorkerIds((current) =>
      current.includes(workerId)
        ? current.filter((item) => item !== workerId)
        : [...current, workerId]
    );
  };

  const selectVisibleWorkers = () => {
    setSelectedWorkerIds(
      filteredWorkers
        .filter((worker) => !worker.is_blocked)
        .map((worker) => worker.id)
    );
  };

  const clearWorkerSelection = () => {
    setSelectedWorkerIds([]);
  };

  const runMutation = async (task: () => Promise<void>, successMessage: string) => {
    setIsMutating(true);
    setError(null);
    setNotice(null);

    try {
      await task();
      setNotice(successMessage);
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setIsMutating(false);
    }
  };

  const handleSubmit = async () => {
    if (!token || !currentSite) return;
    if (!form.name.trim()) {
      setError('이름을 입력해 주세요.');
      return;
    }

    await runMutation(async () => {
      const sharedPayload = {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        company_name: form.company_name.trim() || null,
        trade: form.trade.trim() || null,
        employment_type: form.employment_type,
        special_access: form.special_access.trim() || null,
        ppe_issues: toLineItems(form.ppe_issues_text),
        ack_exemptions: form.ack_exemptions,
      };

      if (editingWorkerId) {
        const updated = await updateSiteWorker(token, editingWorkerId, sharedPayload);
        setWorkers((current) =>
          current.map((worker) => (worker.id === updated.id ? updated : worker))
        );
      } else {
        const created = await createSiteWorker(token, {
          site_id: currentSite.id,
          ...sharedPayload,
        });
        setWorkers((current) => [created, ...current]);
      }

      const refreshedDashboard = await fetchSafetySiteDashboard(token, currentSite.id);
      setDashboard(refreshedDashboard);
      resetForm();
    }, editingWorkerId ? '출입자 정보를 수정했습니다.' : '출입자를 등록했습니다.');
  };

  const handleDownloadCsvTemplate = () => {
    const rows = [
      ['name', 'phone', 'company_name', 'trade', 'employment_type', 'special_access', 'ppe_issues'],
      ['홍길동', '010-1111-2222', '테스트건설', '비계', 'daily', '출입 전 음주측정', '안전모 미착용; 안전대 점검 필요'],
    ];
    downloadCsvFile(`${currentSite?.site_name || 'site-workers'}-template.csv`, rows);
  };

  const handleDownloadImportErrors = () => {
    if (!importSummary || importSummary.errors.length === 0) return;
    downloadCsvFile(
      `${currentSite?.site_name || 'site-workers'}-import-errors.csv`,
      buildImportErrorCsv(importSummary)
    );
  };

  const handleLoadImportErrorIntoForm = (errorItem: SiteWorkerImportError) => {
    setEditingWorkerId(null);
    setForm(buildWorkerFormFromImportError(errorItem));
    setWorkerSessions([]);
    setSelectedSessionId(null);
    setSessionQrDataUrls({});
    setNotice(`${errorItem.row_number}행 데이터를 등록 폼으로 불러왔습니다. 필요한 값만 다듬어 저장해 주세요.`);
    setError(null);
    workerFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleAckExemption = (kind: WorkerAckDrilldownKind) => {
    setForm((current) => ({
      ...current,
      ack_exemptions: current.ack_exemptions.includes(kind)
        ? current.ack_exemptions.filter((item) => item !== kind)
        : [...current.ack_exemptions, kind],
    }));
  };

  const copyWorkerEntryUrl = useCallback(async (entryUrl: string) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    await navigator.clipboard.writeText(buildAbsoluteEntryUrl(entryUrl)).catch(() => undefined);
  }, []);

  const focusWorkerSession = useCallback(
    (worker: SiteWorker, preferredSessionId?: string | null) => {
      setEditingWorkerId(worker.id);
      setForm(buildWorkerForm(worker));
      setSelectedSessionId(preferredSessionId ?? null);
      workerFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    []
  );

  const openBulkIssuedCardsPrintWindow = () => {
    if (bulkIssuedCards.length === 0 || typeof window === 'undefined') return;

    const cardsHtml = bulkIssuedCards
      .map((item) => {
        const qrImage = bulkIssuedQrDataUrls[item.session.id];
        const entryUrl = buildAbsoluteEntryUrl(item.session.entry_url);
        return `
          <article class="card">
            <div class="qr-frame">
              ${qrImage ? `<img src="${qrImage}" alt="${item.worker.name} QR" />` : '<div class="empty">QR 준비 중</div>'}
            </div>
            <div class="card-body">
              <div class="badges">
                <span class="badge">${currentSite?.site_name ?? ''}</span>
                <span class="badge badge-ok">${WORKER_SESSION_STATUS_LABELS[item.session.status]}</span>
              </div>
              <h2>${item.worker.name}</h2>
              <p>${item.worker.company_name || '업체 미입력'} / ${item.worker.trade || '직종 미입력'} / ${getEmploymentTypeLabel(item.worker.employment_type)}</p>
              <p>발급 ${formatErpDateTime(item.session.created_at)}</p>
              <p>만료 ${formatErpDateTime(item.session.expires_at)}</p>
              <p class="link">${entryUrl}</p>
            </div>
          </article>
        `;
      })
      .join('');

    const popup = window.open('', '_blank', 'noopener,noreferrer,width=1024,height=900');
    if (!popup) {
      setError('팝업이 차단되어 일괄 인쇄 화면을 열 수 없습니다.');
      return;
    }

    popup.document.write(`
      <!doctype html>
      <html lang="ko">
        <head>
          <meta charset="utf-8" />
          <title>${currentSite?.site_name ?? 'SI SAFER'} QR 카드</title>
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            body { margin: 0; font-family: Arial, sans-serif; color: #111827; }
            .sheet { display: grid; gap: 8mm; }
            .card { display: grid; grid-template-columns: 88mm 1fr; gap: 10mm; min-height: 74mm; padding: 8mm; border: 1px solid #111827; break-inside: avoid; }
            .qr-frame { display: grid; place-items: center; border: 1px solid #111827; padding: 6mm; background: #fff; }
            .qr-frame img { width: 100%; max-width: 78mm; height: auto; display: block; }
            .card-body { display: grid; gap: 3mm; align-content: start; }
            .badges { display: flex; flex-wrap: wrap; gap: 2mm; }
            .badge { display: inline-flex; padding: 1mm 3mm; border: 1px solid #64748b; font-size: 11px; font-weight: 700; }
            .badge-ok { border-color: #1e6d34; color: #1e6d34; }
            h2, p { margin: 0; }
            h2 { font-size: 20px; }
            .link { word-break: break-all; font-size: 11px; color: #334155; }
            .empty { font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <main class="sheet">${cardsHtml}</main>
          <script>
            window.addEventListener('load', () => {
              window.print();
            });
          </script>
        </body>
      </html>
    `);
    popup.document.close();
  };

  const handleBulkIssueLinks = async () => {
    if (!token || !currentSite) return;
    const targetWorkers = workers.filter(
      (worker) => selectedWorkerIds.includes(worker.id) && !worker.is_blocked
    );
    if (targetWorkers.length === 0) {
      setError('링크를 발급할 근로자를 먼저 선택해 주세요.');
      return;
    }

    setIsMutating(true);
    setError(null);
    setNotice(null);

    try {
      const results = await Promise.allSettled(
        targetWorkers.map(async (worker) => ({
          worker,
          session: await createSiteWorkerMobileSession(token, worker.id),
        }))
      );

      const successes = results.flatMap((result) =>
        result.status === 'fulfilled' ? [result.value] : []
      );
      const failures = results.filter((result) => result.status === 'rejected');

      if (successes.length === 0) {
        throw new Error('선택한 근로자에게 모바일 링크를 발급하지 못했습니다.');
      }

      setBulkIssuedCards(successes);
      setSelectedWorkerIds(successes.map((item) => item.worker.id));
      focusWorkerSession(successes[0].worker, successes[0].session.id);
      setNotice(
        failures.length > 0
          ? `선택 ${targetWorkers.length}명 중 ${successes.length}명에게 링크를 발급했습니다. 실패 ${failures.length}건은 개별 확인이 필요합니다.`
          : `${successes.length}명에게 모바일 링크를 일괄 발급했습니다.`
      );
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setIsMutating(false);
    }
  };

  const handleImportWorkers = async (file: File | null) => {
    if (!file || !token || !currentSite) return;

    setIsImporting(true);
    setError(null);
    setNotice(null);
    try {
      const response = await importSiteWorkers(token, currentSite.id, file);
      setImportSummary(response);
      setWorkers((current) => mergeWorkersById(current, response.created_workers));
      const refreshedDashboard = await fetchSafetySiteDashboard(token, currentSite.id);
      setDashboard(refreshedDashboard);
      if (response.created_workers[0]) {
        setEditingWorkerId(response.created_workers[0].id);
        setForm(buildWorkerForm(response.created_workers[0]));
      }
      setNotice(
        response.failed_count > 0
          ? `CSV 등록을 완료했습니다. 등록 ${response.created_count}건, 오류 ${response.failed_count}건입니다.`
          : `CSV로 출입자 ${response.created_count}건을 등록했습니다.`
      );
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setIsImporting(false);
      if (csvInputRef.current) {
        csvInputRef.current.value = '';
      }
    }
  };

  if (shouldShowLogin) {
    return (
      <LoginPanel
        error={authError}
        onSubmit={login}
        title="출입자관리 로그인"
        description="현장 관리직 계정으로 로그인한 뒤 출입자 등록, 차단, QR 링크 발급을 진행할 수 있습니다."
      />
    );
  }

  if (!isReady || (isAuthenticated && isLoading && !dashboard)) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className="app-shell">
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>출입자관리 화면을 준비하고 있습니다.</p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (!currentSite) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className="app-shell">
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>현장 정보를 찾을 수 없습니다.</p>
              <p className={styles.emptyDescription}>{error ?? '접근 권한을 확인해 주세요.'}</p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <ErpSiteShell
      currentUserName={currentUser?.name}
      description="일용직 인원을 등록하고, 차단 여부와 모바일 전용 진입 링크를 관리합니다."
      heroMeta={
        <>
          <span className={styles.badge}>운영 인원 {dashboard?.registered_worker_count ?? 0}명</span>
          <span className={`${styles.badge} ${styles.badgeWarning}`}>
            차단 {dashboard?.blocked_worker_count ?? 0}명
          </span>
        </>
      }
      onLogout={logout}
      tabs={[
        { href: buildSiteDashboardHref(currentSite.id), label: '현장 대시보드' },
        { href: buildSiteWorkersHref(currentSite.id), label: '출입자관리' },
        { href: buildSiteSafetyHref(currentSite.id), label: '일일 안전관리' },
      ]}
      title={`${currentSite.site_name} 출입자관리`}
    >
      <input
        ref={csvInputRef}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        onChange={(event) => void handleImportWorkers(event.target.files?.[0] ?? null)}
      />

      {(error || notice) && (
        <section className={styles.sectionCard}>
          <div className={styles.sectionBody}>
            {error ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyTitle}>작업 중 오류가 발생했습니다.</p>
                <p className={styles.emptyDescription}>{error}</p>
              </div>
            ) : null}
            {notice ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyTitle}>변경 사항이 저장되었습니다.</p>
                <p className={styles.emptyDescription}>{notice}</p>
              </div>
            ) : null}
          </div>
        </section>
      )}

      <div className={styles.splitGrid}>
        <section className={`${styles.sectionCard} ${styles.printHidden}`}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderMain}>
              <h2 className={styles.sectionTitle}>출입자 목록</h2>
              <p className={styles.sectionDescription}>등록 인원, 차단 여부, 최근 확인 시점을 관리합니다.</p>
            </div>
          </div>
          <div className={styles.sectionBody}>
            {ackFilterKind ? (
              <div className={styles.inlineStats}>
                <span className={`${styles.badge} ${styles.badgeWarning}`}>
                  {ackFilterLabel} {pendingAckWorkerIds.length}명
                </span>
                {ackReferenceDocument ? (
                  <span className={styles.badge}>
                    기준 문서 {formatErpDateTime(ackReferenceDocument.updated_at)}
                  </span>
                ) : (
                  <span className={styles.badge}>기준 문서 없음</span>
                )}
                <span className={styles.badge}>
                  {isPendingOnlyFilter ? '미확인 인원만 표시' : '전체 인원 표시'}
                </span>
                <Link
                  href={buildSiteWorkersHref(currentSite.id)}
                  className="app-button app-button-secondary"
                >
                  필터 해제
                </Link>
              </div>
            ) : null}
            <div className={styles.tableTools}>
              <input
                className={`app-input ${styles.tableSearch}`}
                placeholder="이름, 업체명, 직종, 연락처 검색"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={() => setShowBlocked((current) => !current)}
              >
                {showBlocked ? '차단 인원 숨기기' : '차단 인원 보기'}
              </button>
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={resetForm}
              >
                새 출입자
              </button>
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={handleDownloadCsvTemplate}
              >
                CSV 양식
              </button>
              <button
                type="button"
                className="app-button app-button-primary"
                onClick={() => csvInputRef.current?.click()}
                disabled={isImporting}
              >
                {isImporting ? 'CSV 등록 중...' : 'CSV 일괄 등록'}
              </button>
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={selectVisibleWorkers}
              >
                {ackFilterKind && isPendingOnlyFilter ? '표시 미확인 선택' : '표시 인원 선택'}
              </button>
              {ackFilterKind ? (
                <button
                  type="button"
                  className="app-button app-button-secondary"
                  onClick={() => setSelectedWorkerIds(pendingAckWorkerIds)}
                  disabled={pendingAckWorkerIds.length === 0}
                >
                  미확인 인원 선택
                </button>
              ) : null}
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={clearWorkerSelection}
                disabled={selectedWorkerIds.length === 0}
              >
                선택 해제
              </button>
              <button
                type="button"
                className="app-button app-button-primary"
                onClick={() => void handleBulkIssueLinks()}
                disabled={isMutating || selectedVisibleActiveWorkers.length === 0}
              >
                {isMutating
                  ? '일괄 발급 중...'
                  : ackFilterKind && isPendingOnlyFilter
                    ? `미확인 링크 재발급 ${selectedVisibleActiveWorkers.length}명`
                    : `선택 링크 발급 ${selectedVisibleActiveWorkers.length}명`}
              </button>
            </div>

            {importSummary ? (
              <section className={styles.sectionCard}>
                  <div className={styles.sectionBody}>
                    <div className={styles.inlineStats}>
                      <span className={styles.badge}>처리 {importSummary.processed_count}건</span>
                      <span className={styles.badge}>등록 {importSummary.created_count}건</span>
                      {importSummary.failed_count > 0 ? (
                      <span className={`${styles.badge} ${styles.badgeWarning}`}>
                        오류 {importSummary.failed_count}건
                      </span>
                      ) : null}
                    </div>
                    {importSummary.errors.length > 0 ? (
                      <div className={styles.sectionActions}>
                        <button
                          type="button"
                          className="app-button app-button-secondary"
                          onClick={handleDownloadImportErrors}
                        >
                          오류 CSV 다운로드
                        </button>
                      </div>
                    ) : null}
                    <p className={styles.helperText}>
                      헤더는 `name`, `phone`, `company_name`, `trade`, `employment_type`,
                      `special_access`, `ppe_issues`를 지원합니다. 한글 헤더도 함께 인식합니다.
                  </p>
                  {importSummary.errors.length > 0 ? (
                    <div className={styles.textList}>
                      {importSummary.errors.slice(0, 8).map((item) => (
                        <div key={`${item.row_number}-${item.message}`} className={styles.linkHistoryItem}>
                          <div className={styles.linkHistoryMain}>
                            <div className={styles.textListItem}>
                              <span className={styles.textListBullet}>•</span>
                              <span>
                                {item.row_number}행{item.name ? ` (${item.name})` : ''}: {item.message}
                              </span>
                            </div>
                            <p className={styles.helperText}>
                              {[
                                asImportErrorRawString(item.raw, 'company_name'),
                                asImportErrorRawString(item.raw, 'trade'),
                                asImportErrorRawString(item.raw, 'employment_type'),
                              ]
                                .filter(Boolean)
                                .join(' / ') || '추가 정보 없음'}
                            </p>
                          </div>
                          <div className={styles.sectionActions}>
                            <button
                              type="button"
                              className="app-button app-button-secondary"
                              onClick={() => handleLoadImportErrorIntoForm(item)}
                            >
                              폼으로 불러오기
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}

            {filteredWorkers.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyTitle}>
                  {ackFilterKind ? '현재 필터에 맞는 출입자가 없습니다.' : '표시할 출입자가 없습니다.'}
                </p>
                <p className={styles.emptyDescription}>
                  {ackFilterKind
                    ? '미확인 대상이 없거나 아직 기준 문서가 없습니다.'
                    : '오른쪽 패널에서 출입자를 등록해 주세요.'}
                </p>
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          aria-label="표시 인원 전체 선택"
                          checked={
                            filteredWorkers.filter((worker) => !worker.is_blocked).length > 0 &&
                            filteredWorkers
                              .filter((worker) => !worker.is_blocked)
                              .every((worker) => selectedWorkerIds.includes(worker.id))
                          }
                          onChange={(event) => {
                            if (event.target.checked) {
                              selectVisibleWorkers();
                            } else {
                              clearWorkerSelection();
                            }
                          }}
                        />
                      </th>
                      <th>이름</th>
                      <th>업체 / 직종</th>
                      <th>연락처</th>
                      <th>TBM / 교육</th>
                      <th>상태</th>
                      <th>메뉴</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWorkers.map((worker) => (
                      <tr key={worker.id}>
                        <td>
                          <input
                            type="checkbox"
                            aria-label={`${worker.name} 선택`}
                            checked={selectedWorkerIds.includes(worker.id)}
                            onChange={() => toggleWorkerSelection(worker.id)}
                            disabled={worker.is_blocked}
                          />
                        </td>
                        <td>
                          <span className={styles.tablePrimary}>{worker.name}</span>
                          <span className={styles.tableSecondary}>
                            {getEmploymentTypeLabel(worker.employment_type)}
                          </span>
                        </td>
                        <td>
                          <span className={styles.tablePrimary}>
                            {worker.company_name || '업체 미입력'}
                          </span>
                          <span className={styles.tableSecondary}>
                            {worker.trade || '직종 미입력'}
                          </span>
                        </td>
                        <td>{worker.phone || '-'}</td>
                        <td>
                          <span className={styles.tablePrimary}>
                            TBM {formatErpDateTime(worker.latest_tbm_ack_at)}
                          </span>
                          <span className={styles.tableSecondary}>
                            교육 {formatErpDateTime(worker.latest_education_ack_at)}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`${styles.badge} ${
                              worker.is_blocked ? styles.badgeDanger : styles.badgePublished
                            }`}
                          >
                            {worker.is_blocked ? '차단' : '정상'}
                          </span>
                          {worker.ack_exemptions.length > 0 ? (
                            <span className={styles.tableSecondary}>
                              제외 {worker.ack_exemptions
                                .map((kind) => WORKER_ACK_DRILLDOWN_LABELS[kind])
                                .join(', ')}
                            </span>
                          ) : null}
                        </td>
                        <td>
                          <div className={styles.tableActions}>
                            <button
                              type="button"
                              className="app-button app-button-secondary"
                              onClick={() => {
                                setEditingWorkerId(worker.id);
                                setForm(buildWorkerForm(worker));
                                setSelectedSessionId(null);
                              }}
                              disabled={isMutating}
                            >
                              수정
                            </button>
                            <button
                              type="button"
                              className={
                                worker.is_blocked
                                  ? 'app-button app-button-secondary'
                                  : 'app-button app-button-danger'
                              }
                              onClick={() =>
                                void runMutation(async () => {
                                  if (!token) return;
                                  const updated = await blockSiteWorker(
                                    token,
                                    worker.id,
                                    !worker.is_blocked
                                  );
                                  setWorkers((current) =>
                                    current.map((item) =>
                                      item.id === updated.id ? updated : item
                                    )
                                  );
                                  const refreshedDashboard = await fetchSafetySiteDashboard(
                                    token,
                                    currentSite.id
                                  );
                                  setDashboard(refreshedDashboard);
                                }, worker.is_blocked ? '차단을 해제했습니다.' : '출입자를 차단했습니다.')
                              }
                              disabled={isMutating}
                            >
                              {worker.is_blocked ? '해제' : '차단'}
                            </button>
                            <button
                              type="button"
                              className="app-button app-button-primary"
                              onClick={() =>
                                void runMutation(async () => {
                                  if (!token) return;
                                  const session = await createSiteWorkerMobileSession(
                                    token,
                                    worker.id
                                  );
                                  focusWorkerSession(worker, session.id);
                                  await copyWorkerEntryUrl(session.entry_url);
                                }, '모바일 진입 링크를 발급했습니다. 클립보드에도 복사했습니다.')
                              }
                              disabled={isMutating || worker.is_blocked}
                            >
                              링크 발급
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section ref={workerFormRef} className={`${styles.sectionCard} ${styles.workerDetailPanel}`}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderMain}>
              <h2 className={styles.sectionTitle}>
                {currentEditingWorker ? `${currentEditingWorker.name} 수정` : '출입자 등록'}
              </h2>
              <p className={styles.sectionDescription}>현장 종속 인원을 등록하고 모바일 전용 링크를 발급합니다.</p>
            </div>
            <div className={styles.sectionActions}>
              {currentEditingWorker ? (
                <button
                  type="button"
                  className="app-button app-button-secondary"
                  onClick={resetForm}
                >
                  새로 등록하기
                </button>
              ) : null}
            </div>
          </div>
          <div className={styles.sectionBody}>
            <div className={`${styles.fieldGrid} ${styles.fieldGridCols2}`}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>이름</span>
                <input
                  className="app-input"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>연락처</span>
                <input
                  className="app-input"
                  value={form.phone}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, phone: event.target.value }))
                  }
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>업체명</span>
                <input
                  className="app-input"
                  value={form.company_name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, company_name: event.target.value }))
                  }
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>직종</span>
                <input
                  className="app-input"
                  list="worker-trade-options"
                  value={form.trade}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, trade: event.target.value }))
                  }
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>고용형태</span>
                <select
                  className="app-select"
                  value={form.employment_type}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      employment_type: event.target.value as SafetyEmploymentType,
                    }))
                  }
                >
                  <option value="daily">일용직</option>
                  <option value="regular">상용직</option>
                  <option value="partner">협력사</option>
                  <option value="other">기타</option>
                </select>
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>특이사항 / 출입조건</span>
                <input
                  className="app-input"
                  value={form.special_access}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      special_access: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>보호구 이슈</span>
              <textarea
                className="app-textarea"
                value={form.ppe_issues_text}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    ppe_issues_text: event.target.value,
                  }))
                }
                placeholder="한 줄에 하나씩 입력하세요."
              />
              <span className={styles.helperText}>
                추천 보호구: {ppeSuggestions.slice(0, 6).join(', ') || '등록된 보호구 기준이 없습니다.'}
              </span>
            </label>

            <div className={styles.field}>
              <span className={styles.fieldLabel}>모바일 확인 제외</span>
              <div className={styles.textList}>
                {ACK_EXEMPTION_OPTIONS.map((option) => (
                  <label key={option.kind} className={styles.textListItem}>
                    <input
                      type="checkbox"
                      checked={form.ack_exemptions.includes(option.kind)}
                      onChange={() => toggleAckExemption(option.kind)}
                    />
                    <span>
                      {option.label}
                      <span className={styles.helperText}> {option.description}</span>
                    </span>
                  </label>
                ))}
              </div>
              <span className={styles.helperText}>
                제외한 항목은 대시보드 미확인 집계, 문서 누락 경고, 모바일 확인 화면에서 모두 빠집니다.
              </span>
            </div>

            <div className={styles.sectionActions}>
              <button
                type="button"
                className="app-button app-button-primary"
                onClick={() => void handleSubmit()}
                disabled={isMutating}
              >
                {currentEditingWorker ? '출입자 수정' : '출입자 등록'}
              </button>
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={resetForm}
                disabled={isMutating}
              >
                입력 초기화
              </button>
            </div>

            {currentEditingWorker ? (
              <>
                <section className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <div className={styles.sectionHeaderMain}>
                      <h3 className={styles.sectionTitle}>모바일 링크 이력</h3>
                      <p className={styles.sectionDescription}>
                        최근 발급 링크를 확인하고 강제 만료하거나 QR 카드 미리보기를 고를 수 있습니다.
                      </p>
                    </div>
                  </div>
                  <div className={styles.sectionBody}>
                    {isLoadingSessions ? (
                      <p className={styles.helperText}>링크 이력을 불러오는 중입니다.</p>
                    ) : workerSessions.length === 0 ? (
                      <div className={styles.emptyState}>
                        <p className={styles.emptyTitle}>발급된 링크가 없습니다.</p>
                        <p className={styles.emptyDescription}>왼쪽 목록에서 링크 발급을 눌러 첫 모바일 링크를 생성해 주세요.</p>
                      </div>
                    ) : (
                      <div className={styles.textList}>
                        {workerSessions.map((session) => {
                          const entryUrl = buildAbsoluteEntryUrl(session.entry_url);
                          return (
                            <div key={session.id} className={styles.linkHistoryItem}>
                              <div className={styles.linkHistoryMain}>
                                <div className={styles.inlineStats}>
                                  <span className={styles.badge}>
                                    {WORKER_SESSION_STATUS_LABELS[session.status]}
                                  </span>
                                  {bulkIssuedSessionIds.has(session.id) ? (
                                    <span className={`${styles.badge} ${styles.badgePublished}`}>
                                      방금 발급
                                    </span>
                                  ) : null}
                                  <span className={styles.badge}>
                                    발급 {formatErpDateTime(session.created_at)}
                                  </span>
                                  <span className={styles.badge}>
                                    만료 {formatErpDateTime(session.expires_at)}
                                  </span>
                                </div>
                                <p className={styles.linkHistoryUrl}>{entryUrl}</p>
                              </div>
                              <div className={`${styles.sectionActions} ${styles.printHidden}`}>
                                <button
                                  type="button"
                                  className="app-button app-button-secondary"
                                  onClick={() => setSelectedSessionId(session.id)}
                                >
                                  QR 카드 보기
                                </button>
                                <button
                                  type="button"
                                  className="app-button app-button-secondary"
                                  onClick={() => {
                                    if (session.status === 'active') {
                                      void copyWorkerEntryUrl(session.entry_url);
                                    }
                                  }}
                                  disabled={session.status !== 'active'}
                                >
                                  링크 복사
                                </button>
                                <button
                                  type="button"
                                  className="app-button app-button-danger"
                                  onClick={() =>
                                    void runMutation(async () => {
                                      if (!token) return;
                                      const revoked = await revokeSiteWorkerMobileSession(token, session.id);
                                      setWorkerSessions((current) =>
                                        current.map((item) => (item.id === revoked.id ? revoked : item))
                                      );
                                      if (selectedSessionId === session.id) {
                                        setSelectedSessionId(revoked.id);
                                      }
                                    }, '모바일 링크를 강제 만료했습니다.')
                                  }
                                  disabled={isMutating || session.status !== 'active'}
                                >
                                  강제 만료
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </section>

                {currentPreviewSession ? (
                  <section className={`${styles.sectionCard} ${styles.qrPrintSection}`}>
                    <div className={styles.sectionHeader}>
                      <div className={styles.sectionHeaderMain}>
                        <h3 className={styles.sectionTitle}>QR 인쇄 카드</h3>
                        <p className={styles.sectionDescription}>
                          현장 입장용 모바일 링크를 카드 형태로 확인하고 바로 인쇄할 수 있습니다.
                        </p>
                        <p className={styles.printOnlyText}>현장 출입 전용 모바일 QR 카드</p>
                      </div>
                      <div className={`${styles.sectionActions} ${styles.printHidden}`}>
                        <button
                          type="button"
                          className="app-button app-button-secondary"
                          onClick={() => {
                            if (isCurrentPreviewActive && currentPreviewEntryUrl && navigator.clipboard) {
                              void navigator.clipboard.writeText(currentPreviewEntryUrl).catch(() => undefined);
                            }
                          }}
                          disabled={!isCurrentPreviewActive}
                        >
                          링크 복사
                        </button>
                        <button
                          type="button"
                          className="app-button app-button-primary"
                          onClick={() => window.print()}
                          disabled={!isCurrentPreviewActive}
                        >
                          {activeWorkerSessions.length > 1
                            ? `활성 QR ${activeWorkerSessions.length}건 인쇄`
                            : 'QR 카드 인쇄'}
                        </button>
                      </div>
                    </div>
                    <div className={styles.sectionBody}>
                      <div className={styles.screenOnlyBlock}>
                        <div className={styles.qrCard}>
                          <div className={styles.qrCodeFrame}>
                            {currentPreviewQrDataUrl ? (
                              <Image
                                src={currentPreviewQrDataUrl}
                                alt={`${currentEditingWorker.name} QR 코드`}
                                width={216}
                                height={216}
                                unoptimized
                                className={styles.qrCodeImage}
                              />
                            ) : (
                              <div className={styles.emptyState}>
                                <p className={styles.emptyDescription}>QR 코드를 준비하고 있습니다.</p>
                              </div>
                            )}
                          </div>
                          <div className={styles.qrCardBody}>
                            <div className={styles.inlineStats}>
                              <span className={styles.badge}>{currentSite.site_name}</span>
                              <span
                                className={`${styles.badge} ${
                                  currentPreviewSession.status === 'active'
                                    ? styles.badgePublished
                                    : currentPreviewSession.status === 'expired'
                                      ? styles.badgeWarning
                                      : styles.badgeDanger
                                }`}
                              >
                                {WORKER_SESSION_STATUS_LABELS[currentPreviewSession.status]}
                              </span>
                            </div>
                            <h3 className={styles.sectionTitle}>{currentEditingWorker.name}</h3>
                            <p className={styles.sectionDescription}>
                              {currentEditingWorker.company_name || '업체 미입력'}
                              {' / '}
                              {currentEditingWorker.trade || '직종 미입력'}
                              {' / '}
                              {getEmploymentTypeLabel(currentEditingWorker.employment_type)}
                            </p>
                            <div className={styles.fieldGrid}>
                              <div>
                                <span className={styles.fieldLabel}>전용 링크</span>
                                <p className={styles.linkHistoryUrl}>{currentPreviewEntryUrl}</p>
                              </div>
                              <div className={styles.inlineStats}>
                                <span className={styles.badge}>
                                  발급 {formatErpDateTime(currentPreviewSession.created_at)}
                                </span>
                                <span className={styles.badge}>
                                  만료 {formatErpDateTime(currentPreviewSession.expires_at)}
                                </span>
                              </div>
                            </div>
                            {!isCurrentPreviewActive ? (
                              <p className={styles.helperText}>
                                현재 선택한 링크는 이미 사용할 수 없는 상태입니다. 현장 배포용 QR 카드는 새 링크를 다시 발급한 뒤 인쇄해 주세요.
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <div className={styles.printOnlyBlock}>
                        <div className={styles.printCardList}>
                          {activeWorkerSessions.map((session) => {
                            const sessionEntryUrl = buildAbsoluteEntryUrl(session.entry_url);
                            const sessionQrDataUrl = sessionQrDataUrls[session.id] ?? null;
                            return (
                              <div key={session.id} className={styles.qrCard}>
                                <div className={styles.qrCodeFrame}>
                                  {sessionQrDataUrl ? (
                                    <Image
                                      src={sessionQrDataUrl}
                                      alt={`${currentEditingWorker.name} QR 코드`}
                                      width={216}
                                      height={216}
                                      unoptimized
                                      className={styles.qrCodeImage}
                                    />
                                  ) : (
                                    <div className={styles.emptyState}>
                                      <p className={styles.emptyDescription}>QR 코드를 준비하고 있습니다.</p>
                                    </div>
                                  )}
                                </div>
                                <div className={styles.qrCardBody}>
                                  <div className={styles.inlineStats}>
                                    <span className={styles.badge}>{currentSite.site_name}</span>
                                    <span className={`${styles.badge} ${styles.badgePublished}`}>
                                      {WORKER_SESSION_STATUS_LABELS[session.status]}
                                    </span>
                                  </div>
                                  <h3 className={styles.sectionTitle}>{currentEditingWorker.name}</h3>
                                  <p className={styles.sectionDescription}>
                                    {currentEditingWorker.company_name || '업체 미입력'}
                                    {' / '}
                                    {currentEditingWorker.trade || '직종 미입력'}
                                    {' / '}
                                    {getEmploymentTypeLabel(currentEditingWorker.employment_type)}
                                  </p>
                                  <div className={styles.fieldGrid}>
                                    <div>
                                      <span className={styles.fieldLabel}>전용 링크</span>
                                      <p className={styles.linkHistoryUrl}>{sessionEntryUrl}</p>
                                    </div>
                                    <div className={styles.inlineStats}>
                                      <span className={styles.badge}>
                                        발급 {formatErpDateTime(session.created_at)}
                                      </span>
                                      <span className={styles.badge}>
                                        만료 {formatErpDateTime(session.expires_at)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </section>
                ) : null}
              </>
            ) : null}

            {bulkIssuedCards.length > 0 ? (
              <section className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionHeaderMain}>
                    <h3 className={styles.sectionTitle}>일괄 발급 QR 카드</h3>
                    <p className={styles.sectionDescription}>
                      선택 근로자에게 방금 발급한 링크를 한 번에 검토하고 인쇄할 수 있습니다.
                    </p>
                  </div>
                  <div className={styles.sectionActions}>
                    <button
                      type="button"
                      className="app-button app-button-primary"
                      onClick={openBulkIssuedCardsPrintWindow}
                    >
                      일괄 QR 인쇄
                    </button>
                    <button
                      type="button"
                      className="app-button app-button-secondary"
                      onClick={() => {
                        setBulkIssuedCards([]);
                        setBulkIssuedQrDataUrls({});
                      }}
                    >
                      닫기
                    </button>
                  </div>
                </div>
                <div className={styles.sectionBody}>
                  <div className={styles.inlineStats}>
                    <span className={styles.badge}>발급 {bulkIssuedCards.length}명</span>
                    <span className={styles.badge}>
                      활성 링크 {bulkIssuedCards.filter((item) => item.session.status === 'active').length}건
                    </span>
                  </div>
                  <div className={styles.printCardList}>
                    {bulkIssuedCards.map((item) => {
                      const qrImage = bulkIssuedQrDataUrls[item.session.id] ?? null;
                      const entryUrl = buildAbsoluteEntryUrl(item.session.entry_url);
                      return (
                        <div key={item.session.id} className={styles.qrCard}>
                          <div className={styles.qrCodeFrame}>
                            {qrImage ? (
                              <Image
                                src={qrImage}
                                alt={`${item.worker.name} QR 코드`}
                                width={216}
                                height={216}
                                unoptimized
                                className={styles.qrCodeImage}
                              />
                            ) : (
                              <div className={styles.emptyState}>
                                <p className={styles.emptyDescription}>QR 코드를 준비하고 있습니다.</p>
                              </div>
                            )}
                          </div>
                          <div className={styles.qrCardBody}>
                            <div className={styles.inlineStats}>
                              <span className={styles.badge}>{currentSite.site_name}</span>
                              <span className={`${styles.badge} ${styles.badgePublished}`}>
                                {WORKER_SESSION_STATUS_LABELS[item.session.status]}
                              </span>
                            </div>
                            <h3 className={styles.sectionTitle}>{item.worker.name}</h3>
                            <p className={styles.sectionDescription}>
                              {item.worker.company_name || '업체 미입력'}
                              {' / '}
                              {item.worker.trade || '직종 미입력'}
                              {' / '}
                              {getEmploymentTypeLabel(item.worker.employment_type)}
                            </p>
                            <div className={styles.fieldGrid}>
                              <div>
                                <span className={styles.fieldLabel}>전용 링크</span>
                                <p className={styles.linkHistoryUrl}>{entryUrl}</p>
                              </div>
                              <div className={styles.inlineStats}>
                                <span className={styles.badge}>
                                  발급 {formatErpDateTime(item.session.created_at)}
                                </span>
                                <span className={styles.badge}>
                                  만료 {formatErpDateTime(item.session.expires_at)}
                                </span>
                              </div>
                            </div>
                            <div className={styles.sectionActions}>
                              <button
                                type="button"
                                className="app-button app-button-secondary"
                                onClick={() => {
                                  focusWorkerSession(item.worker, item.session.id);
                                }}
                              >
                                이력 열기
                              </button>
                              <button
                                type="button"
                                className="app-button app-button-secondary"
                                onClick={() => void copyWorkerEntryUrl(item.session.entry_url)}
                                disabled={item.session.status !== 'active'}
                              >
                                링크 복사
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            ) : null}

            <datalist id="worker-trade-options">
              {workerTradeSuggestions.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </div>
        </section>
      </div>
    </ErpSiteShell>
  );
}
