'use client';

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchAdminReports } from '@/lib/admin/apiClient';
import { buildControllerReportHref } from '@/lib/admin/controllerReports';
import { filterVisibleAdminReportRows } from '@/lib/admin/reportVisibility';
import {
  EMPTY_REVIEW_FORM,
  REPORT_PAGE_SIZE,
  REPORT_PRESET_PAGE_SIZE,
  filterRowsForOverviewPreset,
  type OverviewReportsPreset,
} from './reportsSectionFilters';
import { useReportDispatchActions } from './useReportDispatchActions';
import { useReportDocumentActions } from './useReportDocumentActions';
import type { ControllerReportRow, TableSortState } from '@/types/admin';
import type { SmsProviderStatus } from '@/types/messages';
import type { ReportsSectionProps } from './reportsSectionTypes';

export function useReportsSectionState({
  currentUser,
  ensureSessionLoaded,
  getSessionById,
  headquarters,
  onReloadData,
  sessions,
  sites,
  users,
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
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [reviewRow, setReviewRow] = useState<ControllerReportRow | null>(null);
  const [reviewForm, setReviewForm] = useState(EMPTY_REVIEW_FORM);
  const [dispatchRow, setDispatchRow] = useState<ControllerReportRow | null>(null);
  const [dispatchSmsPhone, setDispatchSmsPhone] = useState('');
  const [dispatchSmsMessage, setDispatchSmsMessage] = useState('');
  const [dispatchSmsSending, setDispatchSmsSending] = useState(false);
  const [smsProviderStatuses, setSmsProviderStatuses] = useState<SmsProviderStatus[]>([]);
  const deferredQuery = useDeferredValue(query);

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchAdminReports({
        assigneeUserId: assigneeFilter === 'all' ? '' : assigneeFilter,
        dateFrom,
        dateTo,
        headquarterId: headquarterFilter === 'all' ? '' : headquarterFilter,
        limit: overviewPreset ? REPORT_PRESET_PAGE_SIZE : REPORT_PAGE_SIZE,
        offset,
        qualityStatus: qualityFilter === 'all' ? '' : qualityFilter,
        query: deferredQuery,
        reportType:
          overviewPreset === 'badWorkplaceOverdue' && reportType === 'all'
            ? 'bad_workplace'
            : reportType === 'all'
              ? ''
              : reportType,
        siteId: siteFilter === 'all' ? '' : siteFilter,
        sortBy: sort.key,
        sortDir: sort.direction,
      });
      const filteredRows = filterVisibleAdminReportRows(
        filterRowsForOverviewPreset(response.rows, overviewPreset),
        sites,
        headquarters,
      );
      setRows(filteredRows);
      setTotal(overviewPreset ? filteredRows.length : response.total);
      setSelectedKeys([]);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '보고서 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [
    assigneeFilter,
    dateFrom,
    dateTo,
    deferredQuery,
    headquarterFilter,
    headquarters,
    offset,
    overviewPreset,
    qualityFilter,
    reportType,
    siteFilter,
    sites,
    sort.direction,
    sort.key,
  ]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedKeys.includes(row.reportKey)),
    [rows, selectedKeys],
  );
  const headquarterOptions = useMemo(
    () =>
      Array.from(
        new Map(
          sites
            .filter((site) => site.headquarter_id)
            .map((site) => [
              site.headquarter_id,
              site.headquarter_detail?.name || site.headquarter?.name || '사업장 미지정',
            ]),
        ).entries(),
      ),
    [sites],
  );
  const siteOptions = useMemo(() => sites.map((site) => [site.id, site.site_name] as const), [sites]);
  const assigneeOptions = useMemo(() => users.map((user) => [user.id, user.name] as const), [users]);
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
    buildPendingDispatchPayload,
    bulkDispatchSent,
    bulkOwnerAssign,
    bulkQuality,
    dispatchSite,
    loadSmsProviderStatuses,
    saveDispatch,
    saveReview,
    sendDispatchSms,
  } = useReportDispatchActions({
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
    sites,
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
    (row: ControllerReportRow) => {
      const site = sites.find((item) => item.id === row.siteId);
      const reportTypeLabel =
        row.reportType === 'quarterly_report'
          ? '분기보고서'
          : row.reportType === 'technical_guidance'
            ? '기술지도 보고서'
            : '보고서';
      setDispatchRow(row);
      setDispatchSmsPhone(site?.manager_phone || '');
      setDispatchSmsMessage(
        [
          `[${reportTypeLabel}] ${row.siteName}`,
          `${row.periodLabel || row.reportTitle || row.reportKey} 발송 안내입니다.`,
          '메일함에서 첨부된 보고서를 확인해 주세요.',
        ].join('\n'),
      );
    },
    [sites],
  );

  const openReportRow = useCallback(
    (row: ControllerReportRow) => {
      router.push(buildControllerReportHref(row));
    },
    [router],
  );

  return {
    activeFilterCount,
    assigneeFilter,
    assigneeOptions,
    buildManualDispatchPayload,
    buildPendingDispatchPayload,
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
    openDispatchModal,
    openReportRow,
    openReviewModal,
    qualityFilter,
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
    total,
    bulkDispatchSent,
    bulkOwnerAssign,
    bulkQuality,
    query,
  };
}
