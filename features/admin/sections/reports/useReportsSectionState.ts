'use client';

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  readAdminSessionCache,
  writeAdminSessionCache,
} from '@/features/admin/lib/adminSessionCache';
import {
  fetchAdminDirectoryLookups,
  fetchAdminReports,
  fetchAdminSitesList,
} from '@/lib/admin/apiClient';
import {
  buildControllerReportOpenHref,
} from '@/lib/admin/controllerReports';
import { fetchAdminOriginalPdfBlob } from '@/lib/admin/originalPdfClient';
import {
  normalizeControllerReview,
  normalizeDispatchMeta,
} from '@/lib/admin/reportMeta';
import {
  EMPTY_REVIEW_FORM,
  REPORT_PAGE_SIZE,
  REPORT_PRESET_PAGE_SIZE,
  filterRowsForOverviewPreset,
  type OverviewReportsPreset,
} from './reportsSectionFilters';
import { useReportDispatchActions } from './useReportDispatchActions';
import { useReportDocumentActions } from './useReportDocumentActions';
import type { OriginalPdfDialogState } from './ReportsOriginalPdfDialog';
import type { ControllerReportRow, SafetyAdminReportsResponse, TableSortState } from '@/types/admin';
import type { SafetyReport, SafetySite } from '@/types/backend';
import type { SmsProviderStatus } from '@/types/messages';
import type { ReportsSectionProps, ReportsUserOption } from './reportsSectionTypes';

const adminReportsInFlight = new Map<string, Promise<SafetyAdminReportsResponse>>();

function fetchAdminReportsOnce(
  requestKey: string,
  input: Parameters<typeof fetchAdminReports>[0],
) {
  const existing = adminReportsInFlight.get(requestKey);
  if (existing) return existing;

  const nextRequest = fetchAdminReports(input).finally(() => {
    adminReportsInFlight.delete(requestKey);
  });
  adminReportsInFlight.set(requestKey, nextRequest);
  return nextRequest;
}

function buildRequestKey(input: Record<string, string | number | null>) {
  return JSON.stringify(input);
}

function isLegacyTechnicalGuidanceRow(row: ControllerReportRow) {
  return row.reportType === 'technical_guidance' && row.reportKey.startsWith('legacy:');
}

function isAbortError(error: unknown) {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'name' in error &&
      (error as { name?: string }).name === 'AbortError',
  );
}

function addDays(value: string, days: number) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  parsed.setDate(parsed.getDate() + days);
  return parsed.toISOString().slice(0, 10);
}

function resolveDispatchStatus(
  row: ControllerReportRow,
  dispatchStatus: string,
  visitDate: string,
  updatedAt: string,
) {
  if (row.reportType === 'quarterly_report') {
    const baseDate = visitDate || updatedAt.slice(0, 10);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const parsed = new Date(baseDate);
    parsed.setHours(0, 0, 0, 0);
    const daysSinceVisit = Number.isNaN(parsed.getTime())
      ? null
      : Math.floor((today.getTime() - parsed.getTime()) / (1000 * 60 * 60 * 24));

    return {
      deadlineDate: addDays(baseDate, 7),
      dispatchStatus:
        dispatchStatus === 'sent' || dispatchStatus === 'manual_checked'
          ? 'sent'
          : daysSinceVisit == null
            ? ''
            : daysSinceVisit >= 7
              ? 'overdue'
              : daysSinceVisit >= 4
                ? 'warning'
                : 'normal',
    } as const;
  }

  return {
    deadlineDate: addDays(visitDate || updatedAt.slice(0, 10), 7),
    dispatchStatus:
      dispatchStatus === 'sent' || dispatchStatus === 'manual_checked' ? 'sent' : '',
  } as const;
}

export function useReportsSectionState({
  currentUser,
  ensureSessionLoaded,
  getSessionById,
  onReloadData,
  sessions,
}: ReportsSectionProps) {
  void onReloadData;
  const router = useRouter();
  const searchParams = useSearchParams();
  const overviewPreset = useMemo<OverviewReportsPreset | null>(() => {
    const value = searchParams.get('overviewPreset');
    return value === 'badWorkplaceOverdue' || value === 'issueBundle' || value === 'siteOverdueBundle'
      ? value
      : null;
  }, [searchParams]);
  const [query, setQuery] = useState(() => searchParams.get('query') || '');
  const [sort, setSort] = useState<TableSortState>({ direction: 'desc', key: 'updatedAt' });
  const [reportType, setReportType] = useState<'all' | ControllerReportRow['reportType']>(() => {
    const value = searchParams.get('reportType');
    return value === 'technical_guidance' ||
      value === 'quarterly_report' ||
      value === 'bad_workplace'
      ? value
      : 'all';
  });
  const [headquarterFilter, setHeadquarterFilter] = useState(() => searchParams.get('headquarterId') || 'all');
  const [siteFilter, setSiteFilter] = useState(() => searchParams.get('siteId') || 'all');
  const [assigneeFilter, setAssigneeFilter] = useState(() => searchParams.get('assigneeUserId') || 'all');
  const [qualityFilter, setQualityFilter] = useState<'all' | string>(() => searchParams.get('qualityStatus') || 'all');
  const [dateFrom, setDateFrom] = useState(() => searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(() => searchParams.get('dateTo') || '');
  const [rows, setRows] = useState<ControllerReportRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [originalPdfDialog, setOriginalPdfDialog] = useState<OriginalPdfDialogState>({
    error: null,
    loading: false,
    pdfUrl: null,
    reason: null,
    row: null,
  });
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [reviewRow, setReviewRow] = useState<ControllerReportRow | null>(null);
  const [reviewForm, setReviewForm] = useState(EMPTY_REVIEW_FORM);
  const [dispatchRow, setDispatchRow] = useState<ControllerReportRow | null>(null);
  const [dispatchSite, setDispatchSite] = useState<SafetySite | null>(null);
  const [dispatchSmsPhone, setDispatchSmsPhone] = useState('');
  const [dispatchSmsMessage, setDispatchSmsMessage] = useState('');
  const [dispatchSmsSending, setDispatchSmsSending] = useState(false);
  const [smsProviderStatuses, setSmsProviderStatuses] = useState<SmsProviderStatus[]>([]);
  const [directoryLookups, setDirectoryLookups] = useState<
    import('@/types/admin').SafetyAdminDirectoryLookupsResponse
  >({
    contractTypes: [],
    headquarters: [],
    sites: [],
    users: [],
  });
  const deferredQuery = useDeferredValue(query);
  const reportCacheKey = useMemo(
    () =>
      buildRequestKey({
        assigneeFilter,
        dateFrom,
        dateTo,
        deferredQuery: deferredQuery.trim(),
        headquarterFilter,
        offset,
        overviewPreset,
        qualityFilter,
        reportType,
        siteFilter,
        sort: `${sort.key}:${sort.direction}`,
      }),
    [
      assigneeFilter,
      dateFrom,
      dateTo,
      deferredQuery,
      headquarterFilter,
      offset,
      overviewPreset,
      qualityFilter,
      reportType,
      siteFilter,
      sort.direction,
      sort.key,
    ],
  );
  const isMountedRef = useRef(true);
  const latestReportRequestKeyRef = useRef('');
  const originalPdfAbortControllerRef = useRef<AbortController | null>(null);
  const originalPdfUrlRef = useRef<string | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const cachedLookups = readAdminSessionCache<import('@/types/admin').SafetyAdminDirectoryLookupsResponse>(
      currentUser.id,
      'directory-lookups',
    );
    if (cachedLookups.value) {
      setDirectoryLookups(cachedLookups.value);
    }
    if (cachedLookups.isFresh && cachedLookups.value) {
      return;
    }

    void fetchAdminDirectoryLookups()
      .then((response) => {
        writeAdminSessionCache(currentUser.id, 'directory-lookups', response);
        setDirectoryLookups(response);
      })
      .catch((nextError) => {
        console.error('Failed to load report directory lookups', nextError);
      });
  }, [currentUser.id]);

  useEffect(() => {
    const cached = readAdminSessionCache<{
      rows: ControllerReportRow[];
      total: number;
    }>(currentUser.id, `reports:${reportCacheKey}`);
    if (!cached.value) {
      return;
    }

    setRows(cached.value.rows);
    setTotal(cached.value.total);
    setSelectedKeys([]);
  }, [currentUser.id, reportCacheKey]);

  const fetchRows = useCallback(async () => {
    const activeRequestKey = `${currentUser.id}:${reportCacheKey}`;
    latestReportRequestKeyRef.current = activeRequestKey;

    try {
      setLoading(true);
      setError(null);
      const response = await fetchAdminReportsOnce(
        activeRequestKey,
        {
          assigneeUserId: assigneeFilter === 'all' ? '' : assigneeFilter,
          dateFrom,
          dateTo,
          headquarterId: headquarterFilter === 'all' ? '' : headquarterFilter,
          limit: overviewPreset ? REPORT_PRESET_PAGE_SIZE : REPORT_PAGE_SIZE,
          offset,
          qualityStatus: qualityFilter === 'all' ? '' : qualityFilter,
          query: deferredQuery.trim(),
          reportType:
            overviewPreset === 'badWorkplaceOverdue' && reportType === 'all'
              ? 'bad_workplace'
              : reportType === 'all'
                ? ''
                : reportType,
          siteId: siteFilter === 'all' ? '' : siteFilter,
          sortBy: sort.key,
          sortDir: sort.direction,
        },
      );
      if (
        !isMountedRef.current ||
        latestReportRequestKeyRef.current !== activeRequestKey
      ) {
        return;
      }

      const filteredRows = filterRowsForOverviewPreset(response.rows, overviewPreset);
      const nextTotal = overviewPreset ? filteredRows.length : response.total;
      setRows(filteredRows);
      setTotal(nextTotal);
      setSelectedKeys([]);
      writeAdminSessionCache(currentUser.id, `reports:${reportCacheKey}`, {
        rows: filteredRows,
        total: nextTotal,
      });
    } catch (nextError) {
      if (
        !isMountedRef.current ||
        latestReportRequestKeyRef.current !== activeRequestKey
      ) {
        return;
      }
      setError(nextError instanceof Error ? nextError.message : '보고서 목록을 불러오지 못했습니다.');
    } finally {
      if (
        isMountedRef.current &&
        latestReportRequestKeyRef.current === activeRequestKey
      ) {
        setLoading(false);
      }
    }
  }, [
    assigneeFilter,
    currentUser.id,
    dateFrom,
    dateTo,
    deferredQuery,
    headquarterFilter,
    offset,
    overviewPreset,
    qualityFilter,
    reportCacheKey,
    reportType,
    siteFilter,
    sort.direction,
    sort.key,
  ]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const releaseOriginalPdfUrl = useCallback(() => {
    if (!originalPdfUrlRef.current) return;
    URL.revokeObjectURL(originalPdfUrlRef.current);
    originalPdfUrlRef.current = null;
  }, []);

  const openOriginalPdfDialog = useCallback(
    async (row: ControllerReportRow, reason: string | null = null) => {
      originalPdfAbortControllerRef.current?.abort();
      releaseOriginalPdfUrl();

      const abortController = new AbortController();
      originalPdfAbortControllerRef.current = abortController;
      setOriginalPdfDialog({
        error: null,
        loading: true,
        pdfUrl: null,
        reason,
        row,
      });

      try {
        const blob = await fetchAdminOriginalPdfBlob(row.reportKey, {
          signal: abortController.signal,
        });
        if (abortController.signal.aborted) return;

        const pdfUrl = URL.createObjectURL(blob);
        originalPdfUrlRef.current = pdfUrl;
        setOriginalPdfDialog((current) =>
          current.row?.reportKey === row.reportKey
            ? {
                ...current,
                error: null,
                loading: false,
                pdfUrl,
              }
            : current,
        );
      } catch (nextError) {
        if (abortController.signal.aborted || isAbortError(nextError)) return;
        const pdfError =
          nextError instanceof Error ? nextError.message : '원본 PDF를 열지 못했습니다.';
        setOriginalPdfDialog((current) =>
          current.row?.reportKey === row.reportKey
            ? {
                ...current,
                error: reason ? `${reason} ${pdfError}` : pdfError,
                loading: false,
                pdfUrl: null,
              }
            : current,
        );
      }
    },
    [releaseOriginalPdfUrl],
  );

  const closeOriginalPdfDialog = useCallback(() => {
    originalPdfAbortControllerRef.current?.abort();
    originalPdfAbortControllerRef.current = null;
    releaseOriginalPdfUrl();
    setOriginalPdfDialog({
      error: null,
      loading: false,
      pdfUrl: null,
      reason: null,
      row: null,
    });
  }, [releaseOriginalPdfUrl]);

  useEffect(
    () => () => {
      originalPdfAbortControllerRef.current?.abort();
      releaseOriginalPdfUrl();
    },
    [releaseOriginalPdfUrl],
  );

  const applyUpdatedReportRow = useCallback(
    (report: SafetyReport) => {
      const currentRow = rows.find((row) => row.reportKey === report.report_key);
      if (!currentRow) return;

      const controllerReview = normalizeControllerReview(report.review);
      const dispatch = normalizeDispatchMeta(report.dispatch);
      const nextDispatchState = resolveDispatchStatus(
        currentRow,
        dispatch?.dispatchStatus || '',
        String(report.visit_date || currentRow.visitDate || ''),
        String(report.updated_at || currentRow.updatedAt),
      );
      const updatedRow: ControllerReportRow = {
        ...currentRow,
        checkerUserId: controllerReview?.checkerUserId || '',
        controllerReview,
        deadlineDate: nextDispatchState.deadlineDate,
        dispatch,
        dispatchSignal: nextDispatchState.dispatchStatus,
        dispatchStatus: nextDispatchState.dispatchStatus,
        lifecycleStatus: report.lifecycle_status || currentRow.lifecycleStatus,
        qualityStatus: controllerReview?.qualityStatus || 'unchecked',
        status: report.status,
        updatedAt: report.updated_at,
        visitDate: String(report.visit_date || currentRow.visitDate || ''),
        workflowStatus:
          report.workflow_status === 'draft' ||
          report.workflow_status === 'submitted' ||
          report.workflow_status === 'published'
            ? report.workflow_status
            : currentRow.workflowStatus,
      };
      const nextRows = filterRowsForOverviewPreset(
        rows.map((row) => (row.reportKey === updatedRow.reportKey ? updatedRow : row)),
        overviewPreset,
      );
      const nextTotal = overviewPreset ? nextRows.length : total;

      setRows(nextRows);
      setTotal(nextTotal);
      setDispatchRow((current) => (current?.reportKey === updatedRow.reportKey ? updatedRow : current));
      setSelectedKeys((current) =>
        nextRows.some((row) => row.reportKey === updatedRow.reportKey)
          ? current
          : current.filter((key) => key !== updatedRow.reportKey),
      );
      writeAdminSessionCache(currentUser.id, `reports:${reportCacheKey}`, {
        rows: nextRows,
        total: nextTotal,
      });
    },
    [currentUser.id, overviewPreset, reportCacheKey, rows, total],
  );

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedKeys.includes(row.reportKey)),
    [rows, selectedKeys],
  );
  const headquarterOptions = useMemo(
    () => directoryLookups.headquarters.map((item) => [item.id, item.name] as const),
    [directoryLookups.headquarters],
  );
  const siteOptions = useMemo(
    () => directoryLookups.sites.map((item) => [item.id, item.name] as const),
    [directoryLookups.sites],
  );
  const users = useMemo<ReportsUserOption[]>(
    () => directoryLookups.users.map((user) => ({ id: user.id, name: user.name })),
    [directoryLookups.users],
  );
  const assigneeOptions = useMemo(
    () => users.map((user) => [user.id, user.name] as const),
    [users],
  );
  const activeFilterCount = useMemo(
    () =>
      [
        Boolean(overviewPreset),
        reportType !== 'all',
        headquarterFilter !== 'all',
        siteFilter !== 'all',
        assigneeFilter !== 'all',
        qualityFilter !== 'all',
        Boolean(dateFrom),
        Boolean(dateTo),
      ].filter(Boolean).length,
    [
      assigneeFilter,
      dateFrom,
      dateTo,
      headquarterFilter,
      overviewPreset,
      qualityFilter,
      reportType,
      siteFilter,
    ],
  );

  const {
    buildManualDispatchPayload,
    bulkDispatchSent,
    bulkOwnerAssign,
    bulkQuality,
    loadSmsProviderStatuses,
    saveDispatch,
    saveReview,
    sendDispatchSms,
    toggleDispatchStatus,
  } = useReportDispatchActions({
    applyUpdatedReportRow,
    currentUser,
    dispatchRow,
    dispatchSmsMessage,
    dispatchSmsPhone,
    fetchRows,
    reviewForm,
    reviewRow,
    selectedRows,
    setDispatchRow,
    setDispatchSmsSending,
    setError,
    setNotice,
    setReviewRow,
  });

  useEffect(() => {
    if (!dispatchRow || smsProviderStatuses.length > 0) return;
    void (async () => {
      const statuses = await loadSmsProviderStatuses();
      setSmsProviderStatuses(statuses);
    })();
  }, [dispatchRow, loadSmsProviderStatuses, smsProviderStatuses.length]);

  const { exportList, exportReport } = useReportDocumentActions({
    assigneeFilter,
    dateFrom,
    dateTo,
    ensureSessionLoaded,
    getSessionById,
    headquarterFilter,
    qualityFilter,
    query,
    reportType,
    rows,
    sessions,
    setError,
    setNotice,
    siteFilter,
    sort,
    users,
  });

  const resetHeaderFilters = useCallback(() => {
    setOffset(0);
    setReportType('all');
    setHeadquarterFilter('all');
    setSiteFilter('all');
    setAssigneeFilter('all');
    setQualityFilter('all');
    setDateFrom('');
    setDateTo('');
  }, []);

  const openReviewModal = useCallback((row: ControllerReportRow) => {
    setReviewRow(row);
    setReviewForm({
      note: row.controllerReview?.note || '',
      ownerUserId: row.controllerReview?.ownerUserId || row.assigneeUserId || '',
      qualityStatus: row.controllerReview?.qualityStatus || 'unchecked',
    });
  }, []);

  const openDispatchModal = useCallback(
    async (row: ControllerReportRow) => {
      setDispatchRow(row);
      setDispatchSite(null);
      setDispatchSmsPhone('');
      setDispatchSmsMessage(
        [
          `[분기보고서] ${row.siteName}`,
          `${row.periodLabel || row.reportTitle || row.reportKey} 발송 관련 안내입니다.`,
          '메일함에서 첨부 보고서를 함께 확인해 주세요.',
        ].join('\n'),
      );

      const cacheKey = `reports:site:${row.siteId}`;
      const cachedSite = readAdminSessionCache<SafetySite>(currentUser.id, cacheKey);
      if (cachedSite.value) {
        setDispatchSite(cachedSite.value);
        setDispatchSmsPhone(cachedSite.value.manager_phone || '');
        return;
      }

      try {
        const response = await fetchAdminSitesList({ limit: 1, offset: 0, siteId: row.siteId });
        const site = response.rows[0] ?? null;
        if (!site) {
          return;
        }
        writeAdminSessionCache(currentUser.id, cacheKey, site);
        setDispatchSite(site);
        setDispatchSmsPhone(site.manager_phone || '');
      } catch (nextError) {
        console.error('Failed to load report dispatch site detail', nextError);
      }
    },
    [currentUser.id],
  );

  const openReportRow = useCallback(
    async (row: ControllerReportRow) => {
      setError(null);
      setNotice(null);

      if (isLegacyTechnicalGuidanceRow(row)) {
        await openOriginalPdfDialog(row, '레거시 보고서는 원본 PDF로 엽니다.');
        return;
      }

      router.push(buildControllerReportOpenHref(row));
    },
    [openOriginalPdfDialog, router],
  );

  return {
    activeFilterCount,
    assigneeFilter,
    assigneeOptions,
    buildManualDispatchPayload,
    bulkDispatchSent,
    bulkOwnerAssign,
    bulkQuality,
    dateFrom,
    dateTo,
    dispatchRow,
    dispatchSite,
    dispatchSmsMessage,
    dispatchSmsPhone,
    dispatchSmsSending,
    error,
    exportList,
    exportReport,
    headquarterFilter,
    headquarterOptions,
    loading,
    notice,
    offset,
    closeOriginalPdfDialog,
    openDispatchModal,
    openOriginalPdfDialog,
    openReportRow,
    openReviewModal,
    originalPdfDialog,
    qualityFilter,
    query,
    reportType,
    resetHeaderFilters,
    reviewForm,
    reviewRow,
    rows,
    saveDispatch,
    saveReview,
    selectedKeys,
    selectedRows,
    sendDispatchSms,
    setAssigneeFilter: (value: string) => {
      setOffset(0);
      setAssigneeFilter(value);
    },
    setDateFrom: (value: string) => {
      setOffset(0);
      setDateFrom(value);
    },
    setDateTo: (value: string) => {
      setOffset(0);
      setDateTo(value);
    },
    setDispatchRow,
    setDispatchSmsMessage,
    setDispatchSmsPhone,
    setHeadquarterFilter: (value: string) => {
      setOffset(0);
      setHeadquarterFilter(value);
    },
    setOffset,
    setQualityFilter: (value: string) => {
      setOffset(0);
      setQualityFilter(value);
    },
    setQuery: (value: string) => {
      setOffset(0);
      setQuery(value);
    },
    setReportType: (value: 'all' | ControllerReportRow['reportType']) => {
      setOffset(0);
      setReportType(value);
    },
    setReviewForm,
    setReviewRow,
    setSelectedKeys,
    setSiteFilter: (value: string) => {
      setOffset(0);
      setSiteFilter(value);
    },
    setSort: (next: TableSortState) => {
      setOffset(0);
      setSort(next);
    },
    siteFilter,
    siteOptions,
    smsProviderStatuses,
    sort,
    toggleDispatchStatus,
    total,
    users,
  };
}
