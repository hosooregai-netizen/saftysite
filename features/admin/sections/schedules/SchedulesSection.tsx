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
  readAdminSessionCache,
  writeAdminSessionCache,
} from '@/features/admin/lib/adminSessionCache';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import { getAdminSectionHref } from '@/lib/admin';
import {
  fetchAdminScheduleCalendar,
  fetchAdminScheduleLookups,
  fetchAdminScheduleQueue,
  updateAdminSchedule,
} from '@/lib/admin/apiClient';
import {
  downloadAdminSiteBasicMaterial,
  exportAdminServerWorkbook,
} from '@/lib/admin/exportClient';
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

interface ScheduleFormState {
  assigneeUserId: string;
  plannedDate: string;
  recordSelectionReason: boolean;
  selectionReasonLabel: string;
  selectionReasonMemo: string;
  status: SafetyInspectionSchedule['status'];
}

const EMPTY_FORM: ScheduleFormState = {
  assigneeUserId: '',
  plannedDate: '',
  recordSelectionReason: false,
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
  limit: 5000,
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

function getScheduleStatusLabel(status: SafetyInspectionSchedule['status']) {
  switch (status) {
    case 'completed':
      return '완료';
    case 'postponed':
      return '연기';
    case 'canceled':
      return '취소';
    case 'planned':
    default:
      return '예정';
  }
}

function normalizeSelectionReasonValue(value: string) {
  return isLegacySelectionPlaceholder(value) ? '' : value.trim();
}

function hasSelectionReasonInput(selectionReasonLabel: string, selectionReasonMemo: string) {
  return Boolean(
    normalizeSelectionReasonValue(selectionReasonLabel) ||
      normalizeSelectionReasonValue(selectionReasonMemo),
  );
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

function isDateWithinWindow(value: string, windowStart: string, windowEnd: string) {
  if (!value || !windowStart || !windowEnd) return false;
  return value >= windowStart && value <= windowEnd;
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

function sortScheduleRows(rows: SafetyInspectionSchedule[], sort: TableSortState) {
  const sortDir = sort.direction;
  const sortBy = sort.key;

  return [...rows].sort((left, right) => {
    switch (sortBy) {
      case 'assigneeName':
        return compareText(left.assigneeName || '', right.assigneeName || '', sortDir);
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
    recordSelectionReason: hasSelectionReasonInput(selectionReasonLabel, selectionReasonMemo),
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

function buildIssueSummary(row: SafetyInspectionSchedule) {
  return [
    row.isOutOfWindow ? '구간 밖' : '',
    row.isConflicted ? '일정 충돌' : '',
    row.isOverdue ? '지연' : '',
  ]
    .filter(Boolean)
    .join(' / ');
}

function buildScheduleChipLabel(row: SafetyInspectionSchedule) {
  const totalRounds = row.totalRounds && row.totalRounds > 0 ? row.totalRounds : row.roundNo;
  return `[${row.assigneeName || '미배정'}] ${row.roundNo}/${totalRounds} - ${row.siteName}`;
}

function buildScheduleQueryText(row: SafetyInspectionSchedule) {
  return [row.siteName, row.headquarterName, row.assigneeName].filter(Boolean).join(' ');
}

async function fetchSchedulePayloads(
  filters: {
    assigneeUserId?: string;
    month?: string;
    query?: string;
    siteId?: string;
    status?: string;
  },
  signal?: AbortSignal,
) {
  const [calendar, queue] = await Promise.all([
    fetchAdminScheduleCalendar(filters, signal ? { signal } : {}),
    fetchAdminScheduleQueue(
      {
        ...filters,
        limit: 5000,
        offset: 0,
      },
      signal ? { signal } : {},
    ),
  ]);

  return { calendar, queue };
}

export function SchedulesSection({ currentUser }: SchedulesSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultMonth = getMonthToken();
  const initialMonth = searchParams.get('month') || defaultMonth;
  const initialSelectedDate = searchParams.get('plannedDate') || '';
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
  const [sort, setSort] = useState<TableSortState>(DEFAULT_SORT);
  const [queuePage, setQueuePage] = useState(1);
  const [notice, setNotice] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeScheduleId, setActiveScheduleId] = useState('');
  const [dialogOverflowRowIds, setDialogOverflowRowIds] = useState<string[]>([]);
  const [dragScheduleId, setDragScheduleId] = useState('');
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
  const [scheduleState, setScheduleState] = useState<{
    calendar: SafetyAdminScheduleCalendarResponse;
    error: string | null;
    errorRequestKey: string;
    queue: SafetyAdminScheduleQueueResponse;
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
      calendar:
        readAdminSessionCache<SafetyAdminScheduleCalendarResponse>(
          currentUser.id,
          `schedule-calendar:${initialRequestKey}`,
        ).value ?? EMPTY_CALENDAR_RESPONSE,
      error: null,
      errorRequestKey: '',
      queue:
        readAdminSessionCache<SafetyAdminScheduleQueueResponse>(
          currentUser.id,
          `schedule-queue:${initialRequestKey}`,
        ).value ?? EMPTY_QUEUE_RESPONSE,
      resolvedRequestKey: initialRequestKey,
    };
  });
  const [loadingRequestKey, setLoadingRequestKey] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

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
  const requestKey = useMemo(() => JSON.stringify(scheduleRequest), [scheduleRequest]);
  const cachedCalendarForRequest = useMemo(
    () =>
      readAdminSessionCache<SafetyAdminScheduleCalendarResponse>(
        currentUser.id,
        `schedule-calendar:${requestKey}`,
      ).value,
    [currentUser.id, requestKey],
  );
  const cachedQueueForRequest = useMemo(
    () =>
      readAdminSessionCache<SafetyAdminScheduleQueueResponse>(
        currentUser.id,
        `schedule-queue:${requestKey}`,
      ).value,
    [currentUser.id, requestKey],
  );

  const applySchedulePayloads = useCallback(
    (
      nextRequestKey: string,
      payloads: {
        calendar: SafetyAdminScheduleCalendarResponse;
        queue: SafetyAdminScheduleQueueResponse;
      },
    ) => {
      writeAdminSessionCache(
        currentUser.id,
        `schedule-calendar:${nextRequestKey}`,
        payloads.calendar,
      );
      writeAdminSessionCache(currentUser.id, `schedule-queue:${nextRequestKey}`, payloads.queue);
      setScheduleState({
        calendar: payloads.calendar,
        error: null,
        errorRequestKey: '',
        queue: payloads.queue,
        resolvedRequestKey: nextRequestKey,
      });
    },
    [currentUser.id],
  );

  const refreshScheduleData = async (nextMonth = month) => {
    const nextFilters = {
      assigneeUserId,
      month: nextMonth,
      query: query.trim(),
      siteId,
      status,
    };
    const nextRequestKey = JSON.stringify(nextFilters);
    const payloads = await fetchSchedulePayloads(nextFilters);
    applySchedulePayloads(nextRequestKey, payloads);
    setLoadingRequestKey('');
    return payloads;
  };

  useEffect(() => {
    if (selectedDate && !selectedDate.startsWith(month)) {
      setSelectedDate('');
    }
  }, [month, selectedDate]);

  useEffect(() => {
    setQueuePage(1);
  }, [assigneeUserId, month, query, siteId, status]);

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

    void fetchAdminScheduleLookups()
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
      `schedule-calendar:${requestKey}`,
    );
    const cachedQueue = readAdminSessionCache<SafetyAdminScheduleQueueResponse>(
      currentUser.id,
      `schedule-queue:${requestKey}`,
    );

    if (cachedCalendar.value || cachedQueue.value) {
      setScheduleState((current) => ({
        calendar: cachedCalendar.value ?? current.calendar,
        error: current.errorRequestKey === requestKey ? current.error : null,
        errorRequestKey:
          current.errorRequestKey === requestKey ? current.errorRequestKey : '',
        queue: cachedQueue.value ?? current.queue,
        resolvedRequestKey: requestKey,
      }));
    }
    if (
      cachedCalendar.isFresh &&
      cachedQueue.isFresh &&
      cachedCalendar.value &&
      cachedQueue.value
    ) {
      setLoadingRequestKey('');
      return;
    }

    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setLoadingRequestKey(requestKey);

    void fetchSchedulePayloads(scheduleRequest, abortController.signal)
      .then((payloads) => {
        applySchedulePayloads(requestKey, payloads);
        setLoadingRequestKey('');
      })
      .catch((error) => {
        if (abortController.signal.aborted) return;
        setScheduleState((current) => ({
          ...current,
          error:
            error instanceof Error
              ? error.message
              : '일정 데이터를 불러오지 못했습니다.',
          errorRequestKey: requestKey,
        }));
        setLoadingRequestKey('');
      });

    return () => {
      abortController.abort();
    };
  }, [applySchedulePayloads, currentUser.id, requestKey, scheduleRequest]);

  const calendarResponse =
    scheduleState.resolvedRequestKey === requestKey
      ? scheduleState.calendar
      : cachedCalendarForRequest ?? scheduleState.calendar;
  const queueResponse =
    scheduleState.resolvedRequestKey === requestKey
      ? scheduleState.queue
      : cachedQueueForRequest ?? scheduleState.queue;
  const error = scheduleState.errorRequestKey === requestKey ? scheduleState.error : null;
  const isLoading =
    loadingRequestKey === requestKey || scheduleState.resolvedRequestKey !== requestKey;
  const hasVisibleData =
    calendarResponse.rows.length > 0 ||
    queueResponse.rows.length > 0 ||
    calendarResponse.availableMonths.length > 0;
  const isInitialLoading = isLoading && !hasVisibleData;
  const activeFilterCount = (siteId ? 1 : 0) + (assigneeUserId ? 1 : 0) + (status ? 1 : 0);
  const sortedSelectedRows = useMemo(
    () => sortScheduleRows(calendarResponse.rows, sort),
    [calendarResponse.rows, sort],
  );
  const sortedQueueRows = useMemo(
    () => sortScheduleRows(queueResponse.rows, sort),
    [queueResponse.rows, sort],
  );
  const allScheduleRows = useMemo(() => {
    const byId = new Map<string, SafetyInspectionSchedule>();
    [...sortedSelectedRows, ...sortedQueueRows].forEach((row) => byId.set(row.id, row));
    return Array.from(byId.values());
  }, [sortedQueueRows, sortedSelectedRows]);
  const visibleRows = useMemo(
    () =>
      selectedDate
        ? sortedSelectedRows.filter((row) => row.plannedDate === selectedDate)
        : sortedSelectedRows,
    [selectedDate, sortedSelectedRows],
  );
  const pagedQueueRows = useMemo(() => {
    const offset = (queuePage - 1) * QUEUE_PAGE_SIZE;
    return sortedQueueRows.slice(offset, offset + QUEUE_PAGE_SIZE);
  }, [queuePage, sortedQueueRows]);
  const queueTotalPages = Math.max(1, Math.ceil(sortedQueueRows.length / QUEUE_PAGE_SIZE));
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
  const dragSchedule = useMemo(
    () => sortedSelectedRows.find((row) => row.id === dragScheduleId) ?? null,
    [dragScheduleId, sortedSelectedRows],
  );
  const dialogSelectableRows = useMemo(() => {
    const rows = allScheduleRows.filter((row) => row.id === activeScheduleId || !row.plannedDate);
    return sortSelectableRows(rows);
  }, [activeScheduleId, allScheduleRows]);
  const dialogSelectedRows = useMemo(
    () =>
      sortSelectableRows(
        sortedSelectedRows.filter(
          (row) =>
            row.plannedDate === form.plannedDate &&
            row.id !== activeScheduleId &&
            (dialogOverflowRowIds.length === 0 || dialogOverflowRowIds.includes(row.id)),
        ),
      ),
    [activeScheduleId, dialogOverflowRowIds, form.plannedDate, sortedSelectedRows],
  );
  const activeSiteDetailHref = activeSchedule
    ? getAdminSectionHref('headquarters', {
        headquarterId: activeSchedule.headquarterId,
        siteId: activeSchedule.siteId,
      })
    : '';
  const showOtherMonthHint =
    !isLoading &&
    calendarResponse.monthTotal === 0 &&
    calendarResponse.allSelectedTotal > 0 &&
    calendarResponse.availableMonths.some((token) => token !== month);
  const jumpableMonths = calendarResponse.availableMonths
    .filter((token) => token !== month)
    .slice(0, 6);
  const siteOptions = lookups.sites;
  const userOptions = lookups.users;

  useEffect(() => {
    if (!dialogOpen || activeScheduleId || dialogSelectableRows.length === 0) return;
    const defaultSchedule = dialogSelectableRows[0];
    setActiveScheduleId(defaultSchedule.id);
    setForm((current) => ({
      ...buildInitialForm(defaultSchedule, current.plannedDate || defaultSchedule.windowStart),
      plannedDate: current.plannedDate || defaultSchedule.windowStart,
    }));
  }, [activeScheduleId, dialogOpen, dialogSelectableRows]);

  const openScheduleDialog = (input: {
    overflowRowIds?: string[];
    plannedDate: string;
    schedule?: SafetyInspectionSchedule | null;
  }) => {
    const selectedRowsOnDate = sortSelectableRows(
      allScheduleRows.filter((row) => row.plannedDate === input.plannedDate),
    );
    const defaultSchedule =
      input.schedule ??
      selectedRowsOnDate[0] ??
      sortSelectableRows(allScheduleRows.filter((row) => !row.plannedDate))[0] ??
      null;
    setSelectedDate(input.plannedDate);
    setActiveScheduleId(defaultSchedule?.id || '');
    setDialogOverflowRowIds(input.overflowRowIds ?? []);
    setForm(buildInitialForm(defaultSchedule, input.plannedDate));
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setActiveScheduleId('');
    setDialogOverflowRowIds([]);
    setForm(EMPTY_FORM);
  };

  const handlePickSchedule = (schedule: SafetyInspectionSchedule) => {
    setActiveScheduleId(schedule.id);
    setForm(
      buildInitialForm(schedule, form.plannedDate || schedule.plannedDate || schedule.windowStart),
    );
  };

  const handleSave = async () => {
    if (!activeSchedule) {
      setScheduleState((current) => ({
        ...current,
        error: '일정을 저장할 회차를 먼저 선택해 주세요.',
        errorRequestKey: requestKey,
      }));
      return;
    }
    if (!form.plannedDate) {
      setScheduleState((current) => ({
        ...current,
        error: '방문일을 먼저 선택해 주세요.',
        errorRequestKey: requestKey,
      }));
      return;
    }
    const selectionReasonLabel = form.selectionReasonLabel.trim();
    const selectionReasonMemo = form.selectionReasonMemo.trim();
    if (
      form.recordSelectionReason &&
      (!selectionReasonLabel || !selectionReasonMemo)
    ) {
      setScheduleState((current) => ({
        ...current,
        error: '사유 분류와 상세 메모를 함께 입력해 주세요.',
        errorRequestKey: requestKey,
      }));
      return;
    }

    try {
      const nextMonth = form.plannedDate.slice(0, 7) || month;
      setScheduleState((current) => ({
        ...current,
        error: null,
        errorRequestKey: '',
      }));
      await updateAdminSchedule(activeSchedule.id, {
        assigneeUserId: form.assigneeUserId,
        plannedDate: form.plannedDate,
        selectionReasonLabel: form.recordSelectionReason ? selectionReasonLabel : '',
        selectionReasonMemo: form.recordSelectionReason ? selectionReasonMemo : '',
        status: form.status,
      });
      await refreshScheduleData(nextMonth);
      setMonth(nextMonth);
      setSelectedDate(form.plannedDate);
      setNotice('일정을 저장했습니다.');
      closeDialog();
    } catch (nextError) {
      setScheduleState((current) => ({
        ...current,
        error:
          nextError instanceof Error ? nextError.message : '일정 저장에 실패했습니다.',
        errorRequestKey: requestKey,
      }));
    }
  };

  const canDropScheduleOnDate = (
    schedule: SafetyInspectionSchedule | null,
    targetDate: string,
  ) => {
    if (!schedule || !schedule.plannedDate || !targetDate) return false;
    if (targetDate === schedule.plannedDate) return false;
    return true;
  };

  const handleQuickMove = async (
    schedule: SafetyInspectionSchedule,
    targetDate: string,
  ) => {
    if (!canDropScheduleOnDate(schedule, targetDate)) return;

    try {
      const nextMonth = targetDate.slice(0, 7) || month;
      setScheduleState((current) => ({
        ...current,
        error: null,
        errorRequestKey: '',
      }));
      await updateAdminSchedule(schedule.id, {
        plannedDate: targetDate,
      });
      await refreshScheduleData(nextMonth);
      setMonth(nextMonth);
      setSelectedDate(targetDate);
      setNotice(
        `${schedule.siteName} ${schedule.roundNo}회차 방문일을 ${targetDate}로 변경했습니다.`,
      );
    } catch (nextError) {
      setScheduleState((current) => ({
        ...current,
        error:
          nextError instanceof Error ? nextError.message : '일정 이동에 실패했습니다.',
        errorRequestKey: requestKey,
      }));
    } finally {
      setDragScheduleId('');
    }
  };

  const handleExport = async () => {
    try {
      setScheduleState((current) => ({
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
      setScheduleState((current) => ({
        ...current,
        error:
          nextError instanceof Error ? nextError.message : '일정 엑셀 내보내기에 실패했습니다.',
        errorRequestKey: requestKey,
      }));
    }
  };

  const handleDownloadBasicMaterial = async () => {
    if (!siteId) {
      setScheduleState((current) => ({
        ...current,
        error: '기초자료는 특정 현장을 선택한 상태에서만 출력할 수 있습니다.',
        errorRequestKey: requestKey,
      }));
      return;
    }

    try {
      setScheduleState((current) => ({
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
      setScheduleState((current) => ({
        ...current,
        error:
          nextError instanceof Error ? nextError.message : '기초자료 출력에 실패했습니다.',
        errorRequestKey: requestKey,
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
              placeholder="현장명, 사업장명, 담당자로 검색"
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
          {notice ? <div className={styles.bannerNotice}>{notice}</div> : null}
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
                : `선택 일정 ${calendarResponse.monthTotal.toLocaleString('ko-KR')}건 · 전체 확정 ${calendarResponse.allSelectedTotal.toLocaleString('ko-KR')}건 · 미선택 ${queueResponse.total.toLocaleString('ko-KR')}건`}
            </div>
          </div>

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
              const hasWarning = dayRows.some(
                (row) => row.isConflicted || row.isOutOfWindow || row.isOverdue,
              );
              const isSelected = selectedDate === day.token;
              const canDrop = canDropScheduleOnDate(dragSchedule, day.token);

              return (
                <div
                  key={day.token}
                  className={[
                    styles.calendarCell,
                    isSelected ? styles.calendarCellActive : '',
                    canDrop ? styles.calendarCellDropReady : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onDragOver={(event) => {
                    if (!canDrop) return;
                    event.preventDefault();
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (!dragSchedule || !canDrop) return;
                    void handleQuickMove(dragSchedule, day.token);
                  }}
                >
                  <button
                    type="button"
                    className={styles.calendarCellHeaderButton}
                    onClick={() => openScheduleDialog({ plannedDate: day.token })}
                  >
                    <span className={styles.calendarCellDate}>{day.day}일</span>
                    <span className={styles.calendarCellCount}>{dayRows.length}건</span>
                    {hasWarning ? <span className={styles.calendarCellFlag}>지연</span> : null}
                  </button>
                  {dayRows.length > 0 ? (
                    <div className={styles.calendarScheduleStack}>
                      {dayRows.slice(0, 5).map((row) => (
                        <button
                          key={`calendar-row-${row.id}`}
                          type="button"
                          draggable={Boolean(row.plannedDate)}
                          className={[
                            styles.calendarScheduleChip,
                            row.isOverdue ? styles.calendarScheduleChipWarning : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          onClick={() =>
                            openScheduleDialog({
                              plannedDate: row.plannedDate || row.windowStart,
                              schedule: row,
                            })
                          }
                          onDragStart={() => setDragScheduleId(row.id)}
                          onDragEnd={() => setDragScheduleId('')}
                        >
                          <span className={styles.calendarScheduleChipTitle}>
                            {buildScheduleChipLabel(row)}
                          </span>
                          <span className={styles.calendarScheduleChipMeta}>
                            {buildIssueSummary(row) || buildScheduleQueryText(row)}
                          </span>
                        </button>
                      ))}
                      {dayRows.length > 5 ? (
                        <button
                          type="button"
                          className={styles.calendarMoreButton}
                          onClick={() =>
                            openScheduleDialog({
                              overflowRowIds: dayRows.slice(5).map((row) => row.id),
                              plannedDate: day.token,
                              schedule: dayRows[5] || dayRows[0] || null,
                            })
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

          <div className={styles.tableShell}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>미선택 일정 큐</h3>
                <div className={styles.sectionHeaderMeta}>
                  계약일 기준 15일 간격으로 회차가 자동 계산되며, 총 회차 범위 안에서만
                  선택할 수 있습니다.
                </div>
              </div>
              <div className={styles.sectionHeaderActions}>
                <span className={styles.sectionHeaderMeta}>
                  {queueResponse.total.toLocaleString('ko-KR')}건
                </span>
              </div>
            </div>
            {sortedQueueRows.length === 0 ? (
              <div className={styles.tableEmpty}>
                {isInitialLoading ? '일정을 불러오는 중입니다.' : '아직 날짜를 선택하지 않은 회차가 없습니다.'}
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
                        <tr key={`unselected-${row.id}`}>
                          <td>{row.siteName}</td>
                          <td>
                            {row.roundNo} / {row.totalRounds && row.totalRounds > 0 ? row.totalRounds : row.roundNo}
                          </td>
                          <td>{buildWindowSummary(row)}</td>
                          <td>{row.assigneeName || '-'}</td>
                          <td>{getScheduleStatusLabel(row.status)}</td>
                          <td>
                            <button
                              type="button"
                              className="app-button app-button-secondary"
                              onClick={() =>
                                openScheduleDialog({
                                  plannedDate: row.windowStart,
                                  schedule: row,
                                })
                              }
                            >
                              일정 지정
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
                      <th>선택 사유</th>
                      <th>선택 정보</th>
                      <th>이슈</th>
                      <th>메뉴</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.siteName}</td>
                        <td>
                          {row.roundNo} / {row.totalRounds && row.totalRounds > 0 ? row.totalRounds : row.roundNo}
                        </td>
                        <td>{row.plannedDate || '-'}</td>
                        <td>{buildWindowSummary(row)}</td>
                        <td>{row.assigneeName || '-'}</td>
                        <td>{buildSelectionSummary(row)}</td>
                        <td>
                          {[
                            row.selectionConfirmedByName || '-',
                            formatDateTime(row.selectionConfirmedAt),
                          ].join(' / ')}
                        </td>
                        <td>{buildIssueSummary(row) || '-'}</td>
                        <td>
                          <button
                            type="button"
                            className="app-button app-button-secondary"
                            onClick={() =>
                              openScheduleDialog({
                                plannedDate: row.plannedDate || row.windowStart,
                                schedule: row,
                              })
                            }
                          >
                            수정
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

      <AppModal
        open={dialogOpen}
        title="방문 일정 선택"
        onClose={closeDialog}
        actions={
          <>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={closeDialog}
            >
              취소
            </button>
            <button
              type="button"
              className="app-button app-button-primary"
              onClick={() => void handleSave()}
              disabled={
                !activeSchedule ||
                !form.plannedDate ||
                (form.recordSelectionReason &&
                  (!form.selectionReasonLabel.trim() || !form.selectionReasonMemo.trim()))
              }
            >
              저장
            </button>
          </>
        }
      >
        <div className={styles.modalGrid}>
          {activeSchedule ? (
            <div className={styles.modalFieldWide}>
              <div className={styles.scheduleSummaryPanel}>
                <div className={styles.scheduleSummaryHeader}>
                  <div>
                    <div className={styles.scheduleSummaryTitle}>
                      {activeSchedule.siteName} · {activeSchedule.roundNo}회차
                    </div>
                    <div className={styles.scheduleSummaryMeta}>
                      {activeSchedule.headquarterName || '사업장 정보 없음'}
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
                    <strong>{activeSchedule.assigneeName || '미배정'}</strong>
                  </div>
                  <div>
                    <span className={styles.scheduleSummaryLabel}>허용 구간</span>
                    <strong>{buildWindowSummary(activeSchedule)}</strong>
                  </div>
                  <div>
                    <span className={styles.scheduleSummaryLabel}>상태</span>
                    <strong>{getScheduleStatusLabel(activeSchedule.status)}</strong>
                  </div>
                  <div>
                    <span className={styles.scheduleSummaryLabel}>선택 사유</span>
                    <strong>{buildSelectionSummary(activeSchedule)}</strong>
                  </div>
                  <div>
                    <span className={styles.scheduleSummaryLabel}>이슈</span>
                    <strong>{buildIssueSummary(activeSchedule) || '없음'}</strong>
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
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  plannedDate: event.target.value,
                }))
              }
            />
          </label>
          <div className={styles.modalFieldWide}>
            <span className={styles.label}>변경 사유 기록</span>
            <label className={styles.inlineToggle}>
              <input
                aria-label="변경 사유 기록"
                className={styles.inlineToggleInput}
                type="checkbox"
                checked={form.recordSelectionReason}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    recordSelectionReason: event.target.checked,
                    selectionReasonLabel: event.target.checked ? current.selectionReasonLabel : '',
                    selectionReasonMemo: event.target.checked ? current.selectionReasonMemo : '',
                  }))
                }
              />
              <span className={styles.inlineToggleLabel}>
                {form.recordSelectionReason
                  ? '사유를 함께 저장합니다.'
                  : '사유 없이 일정만 저장합니다.'}
              </span>
            </label>
          </div>
          <label className={styles.modalField}>
            <span className={styles.label}>담당자</span>
            <select
              className="app-select"
              value={form.assigneeUserId}
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
          <label className={styles.modalFieldWide}>
            <span className={styles.label}>선택 가능한 회차</span>
            {dialogSelectableRows.length === 0 ? (
              <div className={styles.tableEmpty}>이 날짜에 선택할 수 있는 회차가 없습니다.</div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>선택</th>
                      <th>현장</th>
                      <th>회차</th>
                      <th>허용 구간</th>
                      <th>담당자</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dialogSelectableRows.map((row) => (
                      <tr key={`dialog-${row.id}`}>
                        <td>
                          <input
                            type="radio"
                            name="schedule-select"
                            checked={activeScheduleId === row.id}
                            onChange={() => handlePickSchedule(row)}
                          />
                        </td>
                        <td>{row.siteName}</td>
                        <td>
                          {row.roundNo} / {row.totalRounds && row.totalRounds > 0 ? row.totalRounds : row.roundNo}
                        </td>
                        <td>{buildWindowSummary(row)}</td>
                        <td>{row.assigneeName || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </label>
          {dialogSelectedRows.length > 0 ? (
            <div className={styles.modalFieldWide}>
              <span className={styles.label}>같은 날짜 확정 일정</span>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>현장</th>
                      <th>회차</th>
                      <th>선택 사유</th>
                      <th>선택자</th>
                      <th>메뉴</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dialogSelectedRows.map((row) => (
                      <tr key={`existing-${row.id}`}>
                        <td>{row.siteName}</td>
                        <td>
                          {row.roundNo} / {row.totalRounds && row.totalRounds > 0 ? row.totalRounds : row.roundNo}
                        </td>
                        <td>{buildSelectionSummary(row)}</td>
                        <td>{row.selectionConfirmedByName || '-'}</td>
                        <td>
                          <button
                            type="button"
                            className="app-button app-button-secondary"
                            onClick={() => handlePickSchedule(row)}
                          >
                            불러오기
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
          <label className={styles.modalField}>
            <span className={styles.label}>사유 분류</span>
            <input
              className="app-input"
              value={form.selectionReasonLabel}
              disabled={!form.recordSelectionReason}
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
              disabled={!form.recordSelectionReason}
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
    </div>
  );
}
