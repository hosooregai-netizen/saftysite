'use client';

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppModal from '@/components/ui/AppModal';
import { SubmitSearchField } from '@/components/ui/SubmitSearchField';
import {
  buildSortMenuOptions,
  SortableHeaderCell,
} from '@/features/admin/components/SortableHeaderCell';
import { SectionHeaderFilterMenu } from '@/features/admin/components/SectionHeaderFilterMenu';
import { useSubmittedSearchState } from '@/hooks/useSubmittedSearchState';
import {
  readEnumParam,
  readNumberParam,
  readStringParam,
} from '@/hooks/useUrlQueryState';
import {
  fetchAdminSessionCacheOnce,
  readAdminSessionCache,
  writeAdminSessionCache,
} from '@/features/admin/lib/adminSessionCache';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import { getAdminSectionHref } from '@/lib/admin';
import {
  fetchAdminScheduleCalendar,
  fetchAdminScheduleLookups,
  fetchAdminScheduleQueue,
} from '@/lib/admin/apiClient';
import {
  downloadAdminSiteBasicMaterial,
  exportAdminServerWorkbook,
} from '@/lib/admin/exportClient';
import {
  getScheduleDisplayPhase,
  getScheduleStatusLabel,
} from '@/lib/calendar/scheduleDisplayPhase';
import type {
  SafetyAdminScheduleCalendarResponse,
  SafetyAdminScheduleLookupsResponse,
  SafetyAdminScheduleQueueResponse,
  SafetyInspectionSchedule,
  TableSortState,
} from '@/types/admin';
import type { SafetyUser } from '@/types/backend';

interface SchedulesSectionProps {
  currentUser: SafetyUser;
}

type ScheduleViewMode = 'calendar' | 'list';
type QueueLoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface ScheduleFormState {
  assigneeUserId: string;
  plannedDate: string;
  selectionReasonLabel: string;
  selectionReasonMemo: string;
  status: SafetyInspectionSchedule['status'];
}

const EMPTY_FORM: ScheduleFormState = {
  assigneeUserId: '',
  plannedDate: '',
  selectionReasonLabel: '',
  selectionReasonMemo: '',
  status: 'planned',
};

const EMPTY_LOOKUPS: SafetyAdminScheduleLookupsResponse = {
  sites: [],
  users: [],
};

const EMPTY_CALENDAR_RESPONSE: SafetyAdminScheduleCalendarResponse = {
  allSelectedTotal: 0,
  availableMonths: [],
  month: '',
  monthTotal: 0,
  refreshedAt: '',
  rows: [],
  unselectedTotal: 0,
};

const EMPTY_QUEUE_RESPONSE: SafetyAdminScheduleQueueResponse = {
  limit: 25,
  month: '',
  offset: 0,
  refreshedAt: '',
  rows: [],
  total: 0,
};

const DEFAULT_SORT: TableSortState = {
  direction: 'asc',
  key: 'plannedDate',
};

const QUEUE_PAGE_SIZE = 25;
const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

function isLegacySelectionPlaceholder(value: string) {
  const normalized = value.trim();
  if (!normalized) return false;
  return normalized === 'Legacy InSEF import' || normalized.includes('legacy_site_id=');
}

function normalizeSelectionReasonValue(value: string) {
  return isLegacySelectionPlaceholder(value) ? '' : value.trim();
}

function getMonthToken(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function shiftMonthToken(month: string, delta: number) {
  const [year, monthValue] = month.split('-').map(Number);
  const nextDate = new Date(year, monthValue - 1 + delta, 1);
  return getMonthToken(nextDate);
}

function formatMonthLabel(month: string) {
  const [year, monthValue] = month.split('-').map(Number);
  if (!year || !monthValue) return month;
  return `${year}년 ${monthValue}월`;
}

function buildCalendarDays(month: string) {
  const [year, monthValue] = month.split('-').map(Number);
  const start = new Date(year, monthValue - 1, 1);
  const end = new Date(year, monthValue, 0);
  const leadingEmptyCount = (start.getDay() + 6) % 7;
  const days: Array<{ day: number; token: string }> = [];

  for (let day = 1; day <= end.getDate(); day += 1) {
    days.push({
      day,
      token: `${month}-${String(day).padStart(2, '0')}`,
    });
  }

  return {
    days,
    leadingEmptyCount,
  };
}

function formatDateTime(value: string) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('ko-KR');
}

function compareText(left: string, right: string, direction: 'asc' | 'desc') {
  const compared = left.localeCompare(right, 'ko');
  return direction === 'asc' ? compared : -compared;
}

function compareNumber(left: number, right: number, direction: 'asc' | 'desc') {
  return direction === 'asc' ? left - right : right - left;
}

function sortScheduleRows(
  rows: SafetyInspectionSchedule[],
  sort: TableSortState,
  userNameById: ReadonlyMap<string, string>,
) {
  const sortDir = sort.direction;
  const sortBy = sort.key;

  return [...rows].sort((left, right) => {
    switch (sortBy) {
      case 'assigneeName':
        return compareText(
          resolveScheduleAssigneeName(left, userNameById),
          resolveScheduleAssigneeName(right, userNameById),
          sortDir,
        );
      case 'headquarterName':
        return compareText(left.headquarterName || '', right.headquarterName || '', sortDir);
      case 'roundNo':
        return compareNumber(left.roundNo, right.roundNo, sortDir);
      case 'siteName':
        return compareText(left.siteName, right.siteName, sortDir);
      case 'status':
        return compareText(left.status, right.status, sortDir);
      case 'windowEnd':
        return compareText(left.windowEnd, right.windowEnd, sortDir);
      case 'windowStart':
        return compareText(left.windowStart, right.windowStart, sortDir);
      case 'plannedDate':
      default: {
        const primary = compareText(
          left.plannedDate || left.windowStart,
          right.plannedDate || right.windowStart,
          sortDir,
        );
        if (primary !== 0) return primary;

        const byRound = compareNumber(left.roundNo, right.roundNo, 'asc');
        if (byRound !== 0) return byRound;

        return compareText(left.siteName, right.siteName, 'asc');
      }
    }
  });
}

function sortSelectableRows(rows: SafetyInspectionSchedule[]) {
  return [...rows].sort(
    (left, right) =>
      left.windowStart.localeCompare(right.windowStart) ||
      left.roundNo - right.roundNo ||
      left.siteName.localeCompare(right.siteName, 'ko'),
  );
}

function buildInitialForm(
  schedule: SafetyInspectionSchedule | null,
  plannedDate = '',
): ScheduleFormState {
  if (!schedule) {
    return {
      ...EMPTY_FORM,
      plannedDate,
    };
  }

  const selectionReasonLabel = normalizeSelectionReasonValue(schedule.selectionReasonLabel);
  const selectionReasonMemo = normalizeSelectionReasonValue(schedule.selectionReasonMemo);

  return {
    assigneeUserId: schedule.assigneeUserId,
    plannedDate: plannedDate || schedule.plannedDate || schedule.windowStart,
    selectionReasonLabel,
    selectionReasonMemo,
    status: schedule.status,
  };
}

function buildWindowSummary(row: SafetyInspectionSchedule) {
  return `${row.windowStart} ~ ${row.windowEnd}`;
}

function buildSelectionSummary(row: SafetyInspectionSchedule) {
  const parts = [
    normalizeSelectionReasonValue(row.selectionReasonLabel),
    normalizeSelectionReasonValue(row.selectionReasonMemo),
  ].filter(Boolean);
  if (parts.length === 0) return '-';
  return parts.join(' / ');
}

function resolveScheduleAssigneeName(
  row: SafetyInspectionSchedule,
  userNameById: ReadonlyMap<string, string>,
) {
  return userNameById.get(row.assigneeUserId) || row.assigneeName || '';
}

function buildScheduleDisplayLabel(
  row: SafetyInspectionSchedule,
  userNameById: ReadonlyMap<string, string>,
) {
  return `[${resolveScheduleAssigneeName(row, userNameById) || '미배정'}] ${row.siteName}`;
}

function buildDayListLabel(
  row: SafetyInspectionSchedule,
  userNameById: ReadonlyMap<string, string>,
) {
  return buildScheduleDisplayLabel(row, userNameById);
}

export function SchedulesSection({ currentUser }: SchedulesSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultMonth = getMonthToken();
  const initialMonth = searchParams.get('month') || defaultMonth;
  const initialSelectedDate = searchParams.get('plannedDate') || '';
  const viewMode: ScheduleViewMode = searchParams.get('view') === 'list' ? 'list' : 'calendar';
  const urlQueuePage = readNumberParam(searchParams, 'queuePage', 1, 1);
  const urlSort = useMemo<TableSortState>(
    () => ({
      direction: readEnumParam(searchParams, 'scheduleDir', ['asc', 'desc'] as const, DEFAULT_SORT.direction),
      key: readStringParam(searchParams, 'scheduleSort', DEFAULT_SORT.key),
    }),
    [searchParams],
  );
  const [month, setMonth] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate);
  const { query, queryInput, setQueryInput, submitQuery } = useSubmittedSearchState(
    searchParams.get('query') || '',
  );
  const [siteId, setSiteId] = useState(() => searchParams.get('siteId') || '');
  const [assigneeUserId, setAssigneeUserId] = useState(
    () => searchParams.get('assigneeUserId') || '',
  );
  const [status, setStatus] = useState(() => searchParams.get('status') || '');
  const [sort, setSort] = useState<TableSortState>(urlSort);
  const [queuePage, setQueuePage] = useState(urlQueuePage);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dayListDialogOpen, setDayListDialogOpen] = useState(false);
  const [dayListDialogDate, setDayListDialogDate] = useState('');
  const [dayListDialogRowIds, setDayListDialogRowIds] = useState<string[]>([]);
  const [activeScheduleId, setActiveScheduleId] = useState('');
  const [form, setForm] = useState<ScheduleFormState>(EMPTY_FORM);
  const deferredQuery = useDeferredValue(query);
  const [lookups, setLookups] = useState<SafetyAdminScheduleLookupsResponse>(() => {
    return (
      readAdminSessionCache<SafetyAdminScheduleLookupsResponse>(
        currentUser.id,
        'schedule-lookups',
      ).value ?? EMPTY_LOOKUPS
    );
  });
  const [calendarState, setCalendarState] = useState<{
    error: string | null;
    errorRequestKey: string;
    response: SafetyAdminScheduleCalendarResponse;
    resolvedRequestKey: string;
  }>(() => {
    const initialFilters = {
      assigneeUserId: searchParams.get('assigneeUserId') || '',
      month: initialMonth,
      query: (searchParams.get('query') || '').trim(),
      siteId: searchParams.get('siteId') || '',
      status: searchParams.get('status') || '',
    };
    const initialRequestKey = JSON.stringify(initialFilters);
    return {
      error: null,
      errorRequestKey: '',
      response:
        readAdminSessionCache<SafetyAdminScheduleCalendarResponse>(
          currentUser.id,
          `schedule-calendar:${initialRequestKey}`,
        ).value ?? EMPTY_CALENDAR_RESPONSE,
      resolvedRequestKey: initialRequestKey,
    };
  });
  const [queueState, setQueueState] = useState<{
    error: string | null;
    errorRequestKey: string;
    response: SafetyAdminScheduleQueueResponse;
    resolvedRequestKey: string;
    status: QueueLoadStatus;
  }>(() => {
    const initialFilters = {
      assigneeUserId: searchParams.get('assigneeUserId') || '',
      limit: QUEUE_PAGE_SIZE,
      month: initialMonth,
      offset: (urlQueuePage - 1) * QUEUE_PAGE_SIZE,
      query: (searchParams.get('query') || '').trim(),
      siteId: searchParams.get('siteId') || '',
      sortBy: urlSort.key,
      sortDir: urlSort.direction,
      status: searchParams.get('status') || '',
    };
    const initialRequestKey = JSON.stringify(initialFilters);
    const cachedQueue = readAdminSessionCache<SafetyAdminScheduleQueueResponse>(
      currentUser.id,
      `schedule-queue:${initialRequestKey}`,
    ).value;
    return {
      error: null,
      errorRequestKey: '',
      response: cachedQueue ?? EMPTY_QUEUE_RESPONSE,
      resolvedRequestKey: initialRequestKey,
      status: cachedQueue ? 'loaded' : 'idle',
    };
  });
  const [calendarLoadingRequestKey, setCalendarLoadingRequestKey] = useState('');
  const [queueLoadingRequestKey, setQueueLoadingRequestKey] = useState('');
  const [refreshNonce, setRefreshNonce] = useState(0);
  const calendarAbortControllerRef = useRef<AbortController | null>(null);
  const queueAbortControllerRef = useRef<AbortController | null>(null);

  const replaceScheduleRoute = useCallback(
    (overrides: Partial<Record<'assigneeUserId' | 'month' | 'plannedDate' | 'query' | 'queuePage' | 'scheduleDir' | 'scheduleSort' | 'siteId' | 'status', string>> & {
      view?: ScheduleViewMode;
    }) => {
      const nextParams = new URLSearchParams();
      const nextMonth = overrides.month ?? month;
      const nextPlannedDate = overrides.plannedDate ?? selectedDate;
      const nextQuery = overrides.query ?? query;
      const nextSiteId = overrides.siteId ?? siteId;
      const nextAssigneeUserId = overrides.assigneeUserId ?? assigneeUserId;
      const nextStatus = overrides.status ?? status;
      const nextView = overrides.view ?? viewMode;
      const nextQueuePage = overrides.queuePage ?? String(queuePage);
      const nextScheduleSort = overrides.scheduleSort ?? sort.key;
      const nextScheduleDir = overrides.scheduleDir ?? sort.direction;

      if (nextMonth && nextMonth !== defaultMonth) nextParams.set('month', nextMonth);
      if (nextPlannedDate) nextParams.set('plannedDate', nextPlannedDate);
      if (nextQuery.trim()) nextParams.set('query', nextQuery.trim());
      if (nextQueuePage && nextQueuePage !== '1') nextParams.set('queuePage', nextQueuePage);
      if (nextScheduleSort && nextScheduleSort !== DEFAULT_SORT.key) nextParams.set('scheduleSort', nextScheduleSort);
      if (nextScheduleDir && nextScheduleDir !== DEFAULT_SORT.direction) nextParams.set('scheduleDir', nextScheduleDir);
      if (nextSiteId) nextParams.set('siteId', nextSiteId);
      if (nextAssigneeUserId) nextParams.set('assigneeUserId', nextAssigneeUserId);
      if (nextStatus) nextParams.set('status', nextStatus);
      if (nextView === 'list') nextParams.set('view', 'list');

      router.replace(getAdminSectionHref('schedules', Object.fromEntries(nextParams.entries())));
    },
    [
      assigneeUserId,
      defaultMonth,
      month,
      query,
      queuePage,
      router,
      selectedDate,
      siteId,
      sort.direction,
      sort.key,
      status,
      viewMode,
    ],
  );

  const scheduleRequest = useMemo(
    () => ({
      assigneeUserId,
      month,
      query: deferredQuery.trim(),
      siteId,
      status,
    }),
    [assigneeUserId, deferredQuery, month, siteId, status],
  );
  const calendarRequestKey = useMemo(() => JSON.stringify(scheduleRequest), [scheduleRequest]);
  const queueRequest = useMemo(
    () => ({
      ...scheduleRequest,
      limit: QUEUE_PAGE_SIZE,
      offset: (queuePage - 1) * QUEUE_PAGE_SIZE,
      sortBy: sort.key,
      sortDir: sort.direction,
    }),
    [queuePage, scheduleRequest, sort.direction, sort.key],
  );
  const queueRequestKey = useMemo(() => JSON.stringify(queueRequest), [queueRequest]);
  const cachedCalendarForRequest = useMemo(
    () =>
      readAdminSessionCache<SafetyAdminScheduleCalendarResponse>(
        currentUser.id,
        `schedule-calendar:${calendarRequestKey}`,
      ).value,
    [currentUser.id, calendarRequestKey],
  );
  const cachedQueueForRequest = useMemo(
    () =>
      readAdminSessionCache<SafetyAdminScheduleQueueResponse>(
        currentUser.id,
        `schedule-queue:${queueRequestKey}`,
      ).value,
    [currentUser.id, queueRequestKey],
  );
  const shouldLoadQueue = viewMode === 'list';

  useEffect(() => {
    setMonth(initialMonth);
  }, [initialMonth]);

  useEffect(() => {
    setSelectedDate(initialSelectedDate);
  }, [initialSelectedDate]);

  useEffect(() => {
    setSiteId(searchParams.get('siteId') || '');
    setAssigneeUserId(searchParams.get('assigneeUserId') || '');
    setStatus(searchParams.get('status') || '');
  }, [searchParams]);

  useEffect(() => {
    setSort(urlSort);
  }, [urlSort]);

  useEffect(() => {
    setQueuePage(urlQueuePage);
  }, [urlQueuePage]);

  useEffect(() => {
    if (selectedDate && !selectedDate.startsWith(month)) {
      setSelectedDate('');
    }
  }, [month, selectedDate]);

  useEffect(() => {
    setQueuePage(1);
  }, [assigneeUserId, month, query, siteId, status]);

  useEffect(() => {
    replaceScheduleRoute({});
  }, [replaceScheduleRoute]);

  useEffect(() => {
    let lastRequestedAt = 0;
    const requestRefresh = () => {
      const now = Date.now();
      if (now - lastRequestedAt < 2000) return;
      lastRequestedAt = now;
      setRefreshNonce((current) => current + 1);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestRefresh();
      }
    };

    window.addEventListener('focus', requestRefresh);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    const refreshInterval = window.setInterval(requestRefresh, 30000);

    return () => {
      window.clearInterval(refreshInterval);
      window.removeEventListener('focus', requestRefresh);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const cachedLookups = readAdminSessionCache<SafetyAdminScheduleLookupsResponse>(
      currentUser.id,
      'schedule-lookups',
    );
    if (cachedLookups.value) {
      setLookups(cachedLookups.value);
    }
    if (cachedLookups.isFresh && cachedLookups.value) {
      return;
    }

    void fetchAdminSessionCacheOnce(
      currentUser.id,
      'schedule-lookups',
      fetchAdminScheduleLookups,
    )
      .then((response) => {
        writeAdminSessionCache(currentUser.id, 'schedule-lookups', response);
        setLookups(response);
      })
      .catch((error) => {
        console.error('Failed to load admin schedule lookups', error);
      });
  }, [currentUser.id]);

  useEffect(() => {
    const cachedCalendar = readAdminSessionCache<SafetyAdminScheduleCalendarResponse>(
      currentUser.id,
      `schedule-calendar:${calendarRequestKey}`,
    );
    if (cachedCalendar.value) {
      setCalendarState((current) => ({
        error: current.errorRequestKey === calendarRequestKey ? current.error : null,
        errorRequestKey:
          current.errorRequestKey === calendarRequestKey ? current.errorRequestKey : '',
        response: cachedCalendar.value ?? current.response,
        resolvedRequestKey: calendarRequestKey,
      }));
    }
    calendarAbortControllerRef.current?.abort();
    const abortController = new AbortController();
    calendarAbortControllerRef.current = abortController;
    setCalendarLoadingRequestKey(calendarRequestKey);

    void fetchAdminScheduleCalendar(scheduleRequest, { signal: abortController.signal })
      .then((response) => {
        if (
          abortController.signal.aborted ||
          calendarAbortControllerRef.current !== abortController
        ) {
          return;
        }
        writeAdminSessionCache(currentUser.id, `schedule-calendar:${calendarRequestKey}`, response);
        setCalendarState({
          error: null,
          errorRequestKey: '',
          response,
          resolvedRequestKey: calendarRequestKey,
        });
        setCalendarLoadingRequestKey('');
      })
      .catch((error) => {
        if (
          abortController.signal.aborted ||
          calendarAbortControllerRef.current !== abortController
        ) {
          return;
        }
        setCalendarState((current) => ({
          ...current,
          error:
            error instanceof Error
              ? error.message
              : '일정 데이터를 불러오지 못했습니다.',
          errorRequestKey: calendarRequestKey,
        }));
        setCalendarLoadingRequestKey('');
      });

    return () => {
      abortController.abort();
    };
  }, [calendarRequestKey, currentUser.id, refreshNonce, scheduleRequest]);

  useEffect(() => {
    const cachedQueue = readAdminSessionCache<SafetyAdminScheduleQueueResponse>(
      currentUser.id,
      `schedule-queue:${queueRequestKey}`,
    );

    if (cachedQueue.value) {
      setQueueState((current) => ({
        error: current.errorRequestKey === queueRequestKey ? current.error : null,
        errorRequestKey:
          current.errorRequestKey === queueRequestKey ? current.errorRequestKey : '',
        response: cachedQueue.value ?? current.response,
        resolvedRequestKey: queueRequestKey,
        status: 'loaded',
      }));
    }

    if (!shouldLoadQueue) {
      queueAbortControllerRef.current?.abort();
      setQueueLoadingRequestKey('');
      return;
    }

    queueAbortControllerRef.current?.abort();
    const abortController = new AbortController();
    queueAbortControllerRef.current = abortController;
    setQueueLoadingRequestKey(queueRequestKey);
    setQueueState((current) => ({
      ...current,
      error: current.errorRequestKey === queueRequestKey ? current.error : null,
      errorRequestKey:
        current.errorRequestKey === queueRequestKey ? current.errorRequestKey : '',
      response:
        cachedQueue.value ??
        (current.resolvedRequestKey === queueRequestKey
          ? current.response
          : {
              ...EMPTY_QUEUE_RESPONSE,
              month: scheduleRequest.month,
              offset: queueRequest.offset,
            }),
      resolvedRequestKey: queueRequestKey,
      status: 'loading',
    }));

    void fetchAdminScheduleQueue(queueRequest, { signal: abortController.signal })
      .then((response) => {
        if (
          abortController.signal.aborted ||
          queueAbortControllerRef.current !== abortController
        ) {
          return;
        }
        writeAdminSessionCache(currentUser.id, `schedule-queue:${queueRequestKey}`, response);
        setQueueState({
          error: null,
          errorRequestKey: '',
          response,
          resolvedRequestKey: queueRequestKey,
          status: 'loaded',
        });
        setQueueLoadingRequestKey('');
      })
      .catch((error) => {
        if (
          abortController.signal.aborted ||
          queueAbortControllerRef.current !== abortController
        ) {
          return;
        }
        setQueueState((current) => ({
          ...current,
          error:
            error instanceof Error
              ? error.message
              : '미선택 목록을 불러오지 못했습니다.',
          errorRequestKey: queueRequestKey,
          status: 'error',
        }));
        setQueueLoadingRequestKey('');
      });

    return () => {
      abortController.abort();
    };
  }, [
    currentUser.id,
    queueRequest,
    queueRequestKey,
    refreshNonce,
    scheduleRequest.month,
    shouldLoadQueue,
  ]);

  const calendarResponse =
    calendarState.resolvedRequestKey === calendarRequestKey
      ? calendarState.response
      : cachedCalendarForRequest ?? calendarState.response;
  const queueResponse =
    queueState.resolvedRequestKey === queueRequestKey
      ? queueState.response
      : cachedQueueForRequest ?? {
          ...EMPTY_QUEUE_RESPONSE,
          month: calendarResponse.month,
          total: calendarResponse.unselectedTotal,
        };
  const queueLoadStatus: QueueLoadStatus =
    queueState.resolvedRequestKey === queueRequestKey
      ? queueState.status
      : cachedQueueForRequest
        ? 'loaded'
        : 'idle';
  const calendarError =
    calendarState.errorRequestKey === calendarRequestKey ? calendarState.error : null;
  const queueError = queueState.errorRequestKey === queueRequestKey ? queueState.error : null;
  const error = calendarError || (shouldLoadQueue ? queueError : null);
  const isCalendarLoading =
    calendarLoadingRequestKey === calendarRequestKey ||
    calendarState.resolvedRequestKey !== calendarRequestKey;
  const isQueueLoading =
    shouldLoadQueue &&
    (queueLoadingRequestKey === queueRequestKey || queueLoadStatus === 'idle');
  const isLoading = isCalendarLoading || isQueueLoading;
  const hasVisibleData =
    calendarResponse.rows.length > 0 ||
    calendarResponse.availableMonths.length > 0;
  const isInitialLoading = isCalendarLoading && !hasVisibleData;
  const activeFilterCount = (siteId ? 1 : 0) + (assigneeUserId ? 1 : 0) + (status ? 1 : 0);
  const siteOptions = lookups.sites;
  const userOptions = lookups.users;
  const userNameById = useMemo(
    () => new Map(userOptions.map((user) => [user.id, user.name])),
    [userOptions],
  );
  const sortedSelectedRows = useMemo(
    () => sortScheduleRows(calendarResponse.rows, sort, userNameById),
    [calendarResponse.rows, sort, userNameById],
  );
  const sortedQueueRows = useMemo(
    () => sortScheduleRows(queueResponse.rows, sort, userNameById),
    [queueResponse.rows, sort, userNameById],
  );
  const allScheduleRows = useMemo(() => {
    const byId = new Map<string, SafetyInspectionSchedule>();
    [...sortedSelectedRows, ...sortedQueueRows].forEach((row) => byId.set(row.id, row));
    return Array.from(byId.values());
  }, [sortedQueueRows, sortedSelectedRows]);
  const visibleRows = useMemo(() => {
    if (viewMode === 'list') {
      return sortedSelectedRows;
    }
    return selectedDate
      ? sortedSelectedRows.filter((row) => row.plannedDate === selectedDate)
      : sortedSelectedRows;
  }, [selectedDate, sortedSelectedRows, viewMode]);
  const pagedQueueRows = sortedQueueRows;
  const queueTotalPages = Math.max(1, Math.ceil(queueResponse.total / QUEUE_PAGE_SIZE));
  const queueSummaryTotal =
    queueLoadStatus === 'idle' ? calendarResponse.unselectedTotal : queueResponse.total;
  const queueSummaryLabel = isQueueLoading
    ? '미선택 목록 로딩 중'
    : queueLoadStatus === 'idle'
      ? `${queueSummaryTotal.toLocaleString('ko-KR')}건 (목록 미로딩)`
      : `${queueResponse.total.toLocaleString('ko-KR')}건`;
  const calendar = useMemo(() => buildCalendarDays(month), [month]);
  const rowsByDate = useMemo(() => {
    const map = new Map<string, SafetyInspectionSchedule[]>();
    sortedSelectedRows.forEach((row) => {
      if (!row.plannedDate) return;
      if (!map.has(row.plannedDate)) {
        map.set(row.plannedDate, []);
      }
      map.get(row.plannedDate)?.push(row);
    });
    return map;
  }, [sortedSelectedRows]);
  const activeSchedule = useMemo(
    () => allScheduleRows.find((row) => row.id === activeScheduleId) ?? null,
    [activeScheduleId, allScheduleRows],
  );
  const dayListDialogRows = useMemo(
    () =>
      sortSelectableRows(
        sortedSelectedRows.filter(
          (row) =>
            row.plannedDate === dayListDialogDate &&
            (dayListDialogRowIds.length === 0 || dayListDialogRowIds.includes(row.id)),
        ),
      ),
    [dayListDialogDate, dayListDialogRowIds, sortedSelectedRows],
  );
  const activeSiteDetailHref = activeSchedule
    ? getAdminSectionHref('headquarters', {
        headquarterId: activeSchedule.headquarterId,
        siteId: activeSchedule.siteId,
      })
    : '';
  const showOtherMonthHint =
    !isCalendarLoading &&
    calendarResponse.monthTotal === 0 &&
    calendarResponse.allSelectedTotal > 0 &&
    calendarResponse.availableMonths.some((token) => token !== month);
  const jumpableMonths = calendarResponse.availableMonths
    .filter((token) => token !== month)
    .slice(0, 6);

  const openScheduleDialog = (input: {
    plannedDate: string;
    schedule?: SafetyInspectionSchedule | null;
  }) => {
    const defaultSchedule = input.schedule ?? null;
    if (!defaultSchedule) {
      setSelectedDate(input.plannedDate);
      return;
    }
    setSelectedDate(input.plannedDate);
    setActiveScheduleId(defaultSchedule?.id || '');
    setForm(buildInitialForm(defaultSchedule, input.plannedDate));
    setDialogOpen(true);
  };

  const openDayListDialog = (plannedDate: string, rowIds: string[]) => {
    setSelectedDate(plannedDate);
    setDayListDialogDate(plannedDate);
    setDayListDialogRowIds(rowIds);
    setDayListDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setActiveScheduleId('');
    setForm(EMPTY_FORM);
  };

  const closeDayListDialog = () => {
    setDayListDialogOpen(false);
    setDayListDialogDate('');
    setDayListDialogRowIds([]);
  };

  const handleExport = async () => {
    try {
      setCalendarState((current) => ({
        ...current,
        error: null,
        errorRequestKey: '',
      }));
      await exportAdminServerWorkbook('schedules', {
        assignee_user_id: assigneeUserId,
        month,
        planned_date: selectedDate,
        query,
        site_id: siteId,
        sort_by: sort.key,
        sort_dir: sort.direction,
        status,
      });
    } catch (nextError) {
      setCalendarState((current) => ({
        ...current,
        error:
          nextError instanceof Error ? nextError.message : '일정 엑셀 내보내기에 실패했습니다.',
        errorRequestKey: calendarRequestKey,
      }));
    }
  };

  const handleDownloadBasicMaterial = async () => {
    if (!siteId) {
      setCalendarState((current) => ({
        ...current,
        error: '기초자료는 특정 현장을 선택한 상태에서만 출력할 수 있습니다.',
        errorRequestKey: calendarRequestKey,
      }));
      return;
    }

    try {
      setCalendarState((current) => ({
        ...current,
        error: null,
        errorRequestKey: '',
      }));
      const matchedSite = siteOptions.find((site) => site.id === siteId);
      await downloadAdminSiteBasicMaterial(
        siteId,
        matchedSite ? `${matchedSite.name}-기초자료.xlsx` : undefined,
      );
    } catch (nextError) {
      setCalendarState((current) => ({
        ...current,
        error:
          nextError instanceof Error ? nextError.message : '기초자료 출력에 실패했습니다.',
        errorRequestKey: calendarRequestKey,
      }));
    }
  };

  const resetHeaderFilters = () => {
    setSiteId('');
    setAssigneeUserId('');
    setStatus('');
  };

  return (
    <div className={styles.dashboardStack}>
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderTitleBlock}>
            <h2 className={styles.sectionTitle}>일정/캘린더</h2>
          </div>
          <div className={styles.sectionHeaderActions}>
            <SubmitSearchField
              busy={isLoading}
              formClassName={`${styles.sectionHeaderSearchShell} ${styles.sectionHeaderToolbarSearch}`}
              inputClassName={`app-input ${styles.sectionHeaderSearchInput}`}
              buttonClassName={styles.sectionHeaderSearchButton}
              value={queryInput}
              onChange={setQueryInput}
              onSubmit={submitQuery}
              placeholder="현장명, 건설사명, 담당자로 검색"
            />
            <SectionHeaderFilterMenu
              activeCount={activeFilterCount}
              ariaLabel="일정 필터"
              onReset={resetHeaderFilters}
            >
              <div className={styles.sectionHeaderMenuGrid}>
                <div className={styles.sectionHeaderMenuField}>
                  <label htmlFor="schedule-filter-site">현장</label>
                  <select
                    id="schedule-filter-site"
                    className="app-select"
                    value={siteId}
                    onChange={(event) => setSiteId(event.target.value)}
                  >
                    <option value="">전체 현장</option>
                    {siteOptions.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.sectionHeaderMenuField}>
                  <label htmlFor="schedule-filter-assignee">담당자</label>
                  <select
                    id="schedule-filter-assignee"
                    className="app-select"
                    value={assigneeUserId}
                    onChange={(event) => setAssigneeUserId(event.target.value)}
                  >
                    <option value="">전체 담당자</option>
                    {userOptions.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.sectionHeaderMenuField}>
                  <label htmlFor="schedule-filter-status">상태</label>
                  <select
                    id="schedule-filter-status"
                    className="app-select"
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                  >
                    <option value="">전체 상태</option>
                    <option value="planned">예정</option>
                    <option value="completed">완료</option>
                    <option value="canceled">취소</option>
                    <option value="postponed">연기</option>
                  </select>
                </div>
              </div>
            </SectionHeaderFilterMenu>
            {siteId ? (
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={() => void handleDownloadBasicMaterial()}
              >
                기초자료 출력
              </button>
            ) : null}
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => void handleExport()}
            >
              엑셀 내보내기
            </button>
          </div>
        </div>
        <div className={styles.sectionBody}>
          {error ? <div className={styles.bannerError}>{error}</div> : null}
          {showOtherMonthHint ? (
            <div className={styles.bannerNotice}>
              현재 선택한 {formatMonthLabel(month)}에는 확정 일정이 없고, 다른 월에
              {' '}
              {calendarResponse.allSelectedTotal.toLocaleString('ko-KR')}
              건이 있습니다.
              {jumpableMonths.length > 0 ? (
                <span className={styles.availableMonthButtonRow}>
                  {jumpableMonths.map((token) => (
                    <button
                      key={token}
                      type="button"
                      className={styles.availableMonthButton}
                      onClick={() => setMonth(token)}
                    >
                      {formatMonthLabel(token)}
                    </button>
                  ))}
                </span>
              ) : null}
            </div>
          ) : null}

          <div className={styles.scheduleViewTabs} role="tablist" aria-label="관제 일정 보기 방식">
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'calendar'}
              className={[
                styles.scheduleViewTab,
                viewMode === 'calendar' ? styles.scheduleViewTabActive : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => replaceScheduleRoute({ view: 'calendar' })}
            >
              달력으로 보기
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'list'}
              className={[
                styles.scheduleViewTab,
                viewMode === 'list' ? styles.scheduleViewTabActive : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => replaceScheduleRoute({ view: 'list' })}
            >
              목록으로 보기
            </button>
          </div>

          <div className={styles.scheduleMonthToolbar}>
            <div className={styles.scheduleMonthNav}>
              <button
                type="button"
                className={styles.scheduleMonthNavButton}
                onClick={() => setMonth(shiftMonthToken(month, -1))}
              >
                이전 달
              </button>
              <button
                type="button"
                className={styles.scheduleMonthNavButton}
                onClick={() => setMonth(shiftMonthToken(month, 1))}
              >
                다음 달
              </button>
              <button
                type="button"
                className={styles.scheduleMonthTodayButton}
                onClick={() => {
                  setMonth(defaultMonth);
                  setSelectedDate('');
                }}
              >
                오늘
              </button>
              <strong className={styles.scheduleMonthLabel}>{formatMonthLabel(month)}</strong>
              <input
                aria-label="대상 월"
                className={`app-input ${styles.scheduleMonthInput}`}
                type="month"
                value={month}
                onChange={(event) => setMonth(event.target.value || defaultMonth)}
              />
            </div>
            <div className={styles.scheduleMonthMeta}>
              {isInitialLoading
                ? '일정을 불러오는 중입니다.'
                : `선택 일정 ${calendarResponse.monthTotal.toLocaleString('ko-KR')}건 · 전체 확정 ${calendarResponse.allSelectedTotal.toLocaleString('ko-KR')}건 · 미선택 ${queueSummaryLabel}`}
            </div>
          </div>

          {viewMode === 'calendar' ? (
            <>
              <div className={styles.calendarWeekdayRow}>
                {WEEKDAY_LABELS.map((label) => (
                  <div key={label} className={styles.calendarWeekdayCell}>
                    {label}
                  </div>
                ))}
              </div>
              <div className={styles.calendarGrid}>
                {Array.from({ length: calendar.leadingEmptyCount }).map((_, index) => (
                  <div key={`empty-${index}`} className={styles.calendarCellEmpty} />
                ))}
                {calendar.days.map((day) => {
                  const dayRows = rowsByDate.get(day.token) || [];
                  const isSelected = selectedDate === day.token;

                  return (
                    <div
                      key={day.token}
                      className={[
                        styles.calendarCell,
                        isSelected ? styles.calendarCellActive : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <button
                        type="button"
                        className={styles.calendarCellHeaderButton}
                        onClick={() => {
                          if (dayRows.length > 1) {
                            openDayListDialog(day.token, dayRows.map((row) => row.id));
                            return;
                          }
                          if (dayRows.length === 1) {
                            openScheduleDialog({
                              plannedDate: day.token,
                              schedule: dayRows[0] || null,
                            });
                            return;
                          }
                          setSelectedDate(day.token);
                        }}
                      >
                        <span className={styles.calendarCellDate}>{day.day}일</span>
                        <span className={styles.calendarCellCount}>{dayRows.length}건</span>
                      </button>
                      {dayRows.length > 0 ? (
                        <div className={styles.calendarScheduleStack}>
                          {dayRows.slice(0, 5).map((row) => (
                            (() => {
                              const displayPhase = getScheduleDisplayPhase(row);
                              return (
                                <button
                                  key={`calendar-row-${row.id}`}
                                  type="button"
                                  className={[
                                    styles.calendarScheduleChip,
                                    displayPhase === 'completed'
                                      ? styles.calendarScheduleChipCompleted
                                      : '',
                                    displayPhase === 'in_progress'
                                      ? styles.calendarScheduleChipInProgress
                                      : '',
                                    displayPhase === 'planned'
                                      ? styles.calendarScheduleChipPlanned
                                      : '',
                                    displayPhase === 'postponed'
                                      ? styles.calendarScheduleChipPostponed
                                      : '',
                                    displayPhase === 'canceled'
                                      ? styles.calendarScheduleChipCanceled
                                      : '',
                                    displayPhase === 'planned' && row.isOverdue
                                      ? styles.calendarScheduleChipWarning
                                      : '',
                                  ]
                                    .filter(Boolean)
                                    .join(' ')}
                                  onClick={() =>
                                    openScheduleDialog({
                                      plannedDate: row.plannedDate || row.windowStart,
                                      schedule: row,
                                    })
                                  }
                                >
                                  <span className={styles.calendarScheduleChipTitle}>
                                    {buildScheduleDisplayLabel(row, userNameById)}
                                  </span>
                                </button>
                              );
                            })()
                          ))}
                          {dayRows.length > 5 ? (
                            <button
                              type="button"
                              className={styles.calendarMoreButton}
                              onClick={() =>
                                openDayListDialog(day.token, dayRows.map((row) => row.id))
                              }
                            >
                              +{dayRows.length - 5}건 더보기
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>
      </section>

      {viewMode === 'list' ? (
        <section className={`${styles.sectionCard} ${styles.listSectionCard}`}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>미선택 일정 큐</h2>
              <div className={styles.sectionHeaderMeta}>
                회차는 유지하되 방문일은 계약 기간 안에서 자유롭게 선택할 수 있습니다.
              </div>
            </div>
            <div className={styles.sectionHeaderActions}>
              <span className={styles.sectionHeaderMeta}>
                {queueSummaryLabel}
              </span>
            </div>
          </div>
          <div className={styles.sectionBody}>
            <div className={styles.tableShell}>
              {sortedQueueRows.length === 0 ? (
                <div className={styles.tableEmpty}>
                  {isQueueLoading
                    ? '미선택 목록을 불러오는 중입니다.'
                    : queueLoadStatus === 'idle'
                      ? '미선택 목록은 목록 보기에서 불러옵니다.'
                      : queueError
                        ? queueError
                        : queueResponse.total > 0
                          ? '현재 페이지에 표시할 미선택 회차가 없습니다.'
                          : '아직 날짜를 선택하지 않은 회차가 없습니다.'}
                </div>
              ) : (
                <>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <SortableHeaderCell
                            column={{ key: 'siteName' }}
                            current={sort}
                            label="미선택 회차"
                            onChange={setSort}
                            sortMenuOptions={buildSortMenuOptions('siteName', {
                              asc: '현장 가나다순',
                              desc: '현장 역순',
                            })}
                          />
                          <SortableHeaderCell
                            column={{ key: 'roundNo' }}
                            current={sort}
                            defaultDirection="desc"
                            label="회차"
                            onChange={setSort}
                          />
                          <SortableHeaderCell
                            column={{ key: 'windowStart' }}
                            current={sort}
                            defaultDirection="asc"
                            label="허용 구간"
                            onChange={setSort}
                          />
                          <SortableHeaderCell
                            column={{ key: 'assigneeName' }}
                            current={sort}
                            label="담당자"
                            onChange={setSort}
                            sortMenuOptions={buildSortMenuOptions('assigneeName', {
                              asc: '담당자 가나다순',
                              desc: '담당자 역순',
                            })}
                          />
                          <SortableHeaderCell
                            column={{ key: 'status' }}
                            current={sort}
                            label="상태"
                            onChange={setSort}
                            sortMenuOptions={buildSortMenuOptions('status', {
                              asc: '상태 오름차순',
                              desc: '상태 내림차순',
                            })}
                          />
                          <th>메뉴</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedQueueRows.map((row) => (
                          <tr
                            key={`unselected-${row.id}`}
                            onClick={() =>
                              openScheduleDialog({
                                plannedDate: row.windowStart,
                                schedule: row,
                              })
                            }
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                openScheduleDialog({
                                  plannedDate: row.windowStart,
                                  schedule: row,
                                });
                              }
                            }}
                            tabIndex={0}
                          >
                            <td>{row.siteName}</td>
                            <td>
                              {row.roundNo} / {row.totalRounds && row.totalRounds > 0 ? row.totalRounds : row.roundNo}
                            </td>
                            <td>{buildWindowSummary(row)}</td>
                            <td>{resolveScheduleAssigneeName(row, userNameById) || '-'}</td>
                            <td>{getScheduleStatusLabel(row)}</td>
                            <td>
                              <button
                                type="button"
                                className="app-button app-button-secondary"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openScheduleDialog({
                                    plannedDate: row.windowStart,
                                    schedule: row,
                                  });
                                }}
                              >
                                확인
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className={styles.paginationRow}>
                    <button
                      type="button"
                      className="app-button app-button-secondary"
                      onClick={() => setQueuePage((current) => Math.max(1, current - 1))}
                      disabled={queuePage <= 1}
                    >
                      이전
                    </button>
                    <span className={styles.paginationLabel}>
                      {queuePage} / {queueTotalPages} 페이지
                    </span>
                    <button
                      type="button"
                      className="app-button app-button-secondary"
                      onClick={() =>
                        setQueuePage((current) => Math.min(queueTotalPages, current + 1))
                      }
                      disabled={queuePage >= queueTotalPages}
                    >
                      다음
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {viewMode === 'list' ? (
        <section className={`${styles.sectionCard} ${styles.listSectionCard}`}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>방문 일정 목록</h2>
          </div>
          <div className={styles.sectionHeaderActions}>
            <span className={styles.sectionHeaderMeta}>
              {isInitialLoading
                ? '불러오는 중'
                : `${calendarResponse.monthTotal.toLocaleString('ko-KR')}건 / 전체 확정 ${calendarResponse.allSelectedTotal.toLocaleString('ko-KR')}건`}
            </span>
          </div>
        </div>
        <div className={styles.sectionBody}>
          {visibleRows.length === 0 ? (
            <div className={styles.tableEmpty}>
              {isInitialLoading ? '일정을 불러오는 중입니다.' : '조건에 맞는 일정이 없습니다.'}
            </div>
          ) : (
            <div className={styles.tableShell}>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <SortableHeaderCell
                        column={{ key: 'siteName' }}
                        current={sort}
                        label="현장"
                        onChange={setSort}
                        sortMenuOptions={buildSortMenuOptions('siteName', {
                          asc: '현장 가나다순',
                          desc: '현장 역순',
                        })}
                      />
                      <SortableHeaderCell
                        column={{ key: 'roundNo' }}
                        current={sort}
                        defaultDirection="desc"
                        label="회차"
                        onChange={setSort}
                      />
                      <SortableHeaderCell
                        column={{ key: 'plannedDate' }}
                        current={sort}
                        defaultDirection="asc"
                        label="방문일"
                        onChange={setSort}
                      />
                      <SortableHeaderCell
                        column={{ key: 'windowStart' }}
                        current={sort}
                        defaultDirection="asc"
                        label="허용 구간"
                        onChange={setSort}
                      />
                      <SortableHeaderCell
                        column={{ key: 'assigneeName' }}
                        current={sort}
                        label="담당자"
                        onChange={setSort}
                        sortMenuOptions={buildSortMenuOptions('assigneeName', {
                          asc: '담당자 가나다순',
                          desc: '담당자 역순',
                        })}
                      />
                      <th>선택 정보</th>
                      <th>메뉴</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() =>
                          openScheduleDialog({
                            plannedDate: row.plannedDate || row.windowStart,
                            schedule: row,
                          })
                        }
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            openScheduleDialog({
                              plannedDate: row.plannedDate || row.windowStart,
                              schedule: row,
                            });
                          }
                        }}
                        tabIndex={0}
                      >
                        <td>{row.siteName}</td>
                        <td>
                          {row.roundNo} / {row.totalRounds && row.totalRounds > 0 ? row.totalRounds : row.roundNo}
                        </td>
                        <td>{row.plannedDate || '-'}</td>
                        <td>{buildWindowSummary(row)}</td>
                        <td>{resolveScheduleAssigneeName(row, userNameById) || '-'}</td>
                        <td>
                          {[
                            row.selectionConfirmedByName || '-',
                            formatDateTime(row.selectionConfirmedAt),
                          ].join(' / ')}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="app-button app-button-secondary"
                            onClick={(event) => {
                              event.stopPropagation();
                              openScheduleDialog({
                                plannedDate: row.plannedDate || row.windowStart,
                                schedule: row,
                              });
                            }}
                          >
                            확인
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        </section>
      ) : null}

      <AppModal
        open={dialogOpen}
        title="방문 일정 상세"
        onClose={closeDialog}
        actions={
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={closeDialog}
          >
            닫기
          </button>
        }
      >
        <div className={styles.modalGrid}>
          {activeSchedule ? (
            <div className={styles.modalFieldWide}>
              <div className={styles.scheduleSummaryPanel}>
                <div className={styles.scheduleSummaryHeader}>
                  <div>
                    <div className={styles.scheduleSummaryTitle}>
                      {buildScheduleDisplayLabel(activeSchedule, userNameById)}
                    </div>
                    <div className={styles.scheduleSummaryMeta}>
                      {[
                        activeSchedule.headquarterName || '건설사 정보 없음',
                        `${activeSchedule.roundNo}회차`,
                      ].join(' · ')}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="app-button app-button-secondary"
                    onClick={() => router.push(activeSiteDetailHref)}
                  >
                    현장 상세로 이동
                  </button>
                </div>
                <div className={styles.scheduleSummaryGrid}>
                  <div>
                    <span className={styles.scheduleSummaryLabel}>담당자</span>
                    <strong>{resolveScheduleAssigneeName(activeSchedule, userNameById) || '미배정'}</strong>
                  </div>
                  <div>
                    <span className={styles.scheduleSummaryLabel}>허용 구간</span>
                    <strong>{buildWindowSummary(activeSchedule)}</strong>
                  </div>
                  <div>
                    <span className={styles.scheduleSummaryLabel}>상태</span>
                    <strong>{getScheduleStatusLabel(activeSchedule)}</strong>
                  </div>
                  <div>
                    <span className={styles.scheduleSummaryLabel}>선택 사유</span>
                    <strong>{buildSelectionSummary(activeSchedule)}</strong>
                  </div>
                  <div>
                    <span className={styles.scheduleSummaryLabel}>선택 정보</span>
                    <strong>
                      {[
                        activeSchedule.selectionConfirmedByName || '-',
                        formatDateTime(activeSchedule.selectionConfirmedAt),
                      ].join(' / ')}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          <label className={styles.modalField}>
            <span className={styles.label}>방문일</span>
            <input
              className="app-input"
              type="date"
              value={form.plannedDate}
              readOnly
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  plannedDate: event.target.value,
                }))
              }
            />
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>담당자</span>
            <select
              className="app-select"
              value={form.assigneeUserId}
              disabled
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  assigneeUserId: event.target.value,
                }))
              }
            >
              <option value="">선택</option>
              {userOptions.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>사유 분류</span>
            <input
              className="app-input"
              value={form.selectionReasonLabel}
              readOnly
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  selectionReasonLabel: event.target.value,
                }))
              }
              placeholder="예: 현장 요청, 우천 예보"
            />
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>상태</span>
            <select
              className="app-select"
              value={form.status}
              disabled
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as SafetyInspectionSchedule['status'],
                }))
              }
            >
              <option value="planned">예정</option>
              <option value="completed">완료</option>
              <option value="postponed">연기</option>
              <option value="canceled">취소</option>
            </select>
          </label>
          <label className={styles.modalFieldWide}>
            <span className={styles.label}>상세 메모</span>
            <textarea
              className="app-textarea"
              rows={4}
              value={form.selectionReasonMemo}
              readOnly
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  selectionReasonMemo: event.target.value,
                }))
              }
              placeholder="방문 일정을 이 날짜로 확정한 이유를 자세히 기록합니다."
            />
          </label>
          {activeSchedule ? (
            <div className={styles.modalFieldWide}>
              <div className={styles.modalHint}>
                허용 구간: {activeSchedule.windowStart} ~ {activeSchedule.windowEnd}
              </div>
            </div>
          ) : null}
        </div>
      </AppModal>

      <AppModal
        open={dayListDialogOpen}
        title={`${dayListDialogDate || form.plannedDate || month} 일정 목록`}
        onClose={closeDayListDialog}
        size="large"
        actions={
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={closeDayListDialog}
          >
            닫기
          </button>
        }
      >
        <div className={styles.modalGrid}>
          <div className={styles.modalFieldWide}>
            <span className={styles.label}>선택한 날짜 일정</span>
            {dayListDialogRows.length === 0 ? (
              <div className={styles.tableEmpty}>이 날짜에 등록된 일정이 없습니다.</div>
            ) : (
              <div className={`${styles.tableWrap} ${styles.dayListTableWrap}`}>
                <table className={`${styles.table} ${styles.dayListTable}`}>
                  <thead>
                    <tr>
                      <th>일정</th>
                      <th>회차</th>
                      <th>상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayListDialogRows.map((row) => (
                      (() => {
                        const displayPhase = getScheduleDisplayPhase(row);
                        const toneClasses = [
                          displayPhase === 'completed' ? styles.dayListToneCompleted : '',
                          displayPhase === 'in_progress' ? styles.dayListToneInProgress : '',
                          displayPhase === 'planned' ? styles.dayListTonePlanned : '',
                          displayPhase === 'postponed' ? styles.dayListTonePostponed : '',
                          displayPhase === 'canceled' ? styles.dayListToneCanceled : '',
                          displayPhase === 'planned' && row.isOverdue
                            ? styles.dayListToneWarning
                            : '',
                        ]
                          .filter(Boolean)
                          .join(' ');

                        return (
                          <tr
                            key={`day-list-${row.id}`}
                            className={styles.tableClickableRow}
                            onClick={() => {
                              closeDayListDialog();
                              openScheduleDialog({
                                plannedDate: row.plannedDate || dayListDialogDate || row.windowStart,
                                schedule: row,
                              });
                            }}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                closeDayListDialog();
                                openScheduleDialog({
                                  plannedDate: row.plannedDate || dayListDialogDate || row.windowStart,
                                  schedule: row,
                                });
                              }
                            }}
                            tabIndex={0}
                          >
                            <td>
                              <span
                                className={[styles.dayListScheduleChip, toneClasses]
                                  .filter(Boolean)
                                  .join(' ')}
                              >
                                {buildDayListLabel(row, userNameById)}
                              </span>
                            </td>
                            <td>
                              {row.roundNo} /{' '}
                              {row.totalRounds && row.totalRounds > 0 ? row.totalRounds : row.roundNo}
                            </td>
                            <td>
                              <span
                                className={[styles.dayListStatusBadge, toneClasses]
                                  .filter(Boolean)
                                  .join(' ')}
                              >
                                {getScheduleStatusLabel(row)}
                              </span>
                            </td>
                          </tr>
                        );
                      })()
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AppModal>
    </div>
  );
}
