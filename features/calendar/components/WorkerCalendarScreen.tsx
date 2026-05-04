'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppModal from '@/components/ui/AppModal';
import LoginPanel from '@/components/auth/LoginPanel';
import WorkerAppHeader from '@/components/worker/WorkerAppHeader';
import WorkerMenuSidebar from '@/components/worker/WorkerMenuSidebar';
import WorkerShellBody from '@/components/worker/WorkerShellBody';
import { WorkerMenuDrawer, WorkerMenuPanel } from '@/components/worker/WorkerMenu';
import { createEmptyTechnicalGuidanceRelations } from '@/constants/inspectionSession/sessionFactory';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import {
  readEnumParam,
  readStringParam,
} from '@/hooks/useUrlQueryState';
import {
  consumePendingPostLoginRedirect,
  WORKER_CALENDAR_POST_LOGIN_REDIRECT,
} from '@/lib/auth/postLoginRedirect';
import { isAdminUserRole, getAdminSectionHref } from '@/lib/admin';
import { buildDefaultReportTitle } from '@/features/site-reports/report-list/reportListHelpers';
import { fetchAllMySchedules, reserveNextMySchedule, updateMySchedule } from '@/lib/calendar/apiClient';
import { fetchTechnicalGuidanceSeed, readSafetyAuthToken } from '@/lib/safetyApi';
import homeStyles from '@/features/home/components/HomeScreen.module.css';
import {
  applyScheduleReportUpdateToSession,
  buildContractWindowFromScheduleRows,
  buildContractWindowFromSafetySite,
  buildScheduleReportSyncPlan,
  resolveContractWindow,
} from '@/features/schedule-report-sync/scheduleReportSync';
import {
  buildWorkerCalendarReportLookup,
  buildWorkerCalendarRowsWithReportDates,
  findDuplicateUnlinkedScheduleReservations,
  mergeWorkerCalendarReportItems,
  resolveWorkerCalendarReportForSchedule,
} from './workerCalendarReportMatching';
import {
  buildWorkerCalendarReportIndexSiteIds,
  shouldUseWorkerCalendarReportItems,
} from './workerCalendarLoading';
import type { SafetyInspectionSchedule } from '@/types/admin';
import type { InspectionReportListItem } from '@/types/inspectionSession';
import styles from './WorkerCalendarScreen.module.css';

interface ScheduleDialogState {
  open: boolean;
  plannedDate: string;
  scheduleId: string;
  selectionReasonLabel: string;
  selectionReasonMemo: string;
  siteId: string;
}

interface WorkerDialogSiteOption {
  completedRounds: number;
  hasLoadedCompletion: boolean;
  isComplete: boolean;
  label: string;
  remainingRounds: number;
  siteId: string;
  totalRounds: number;
}

interface WorkerGuidanceSessionLink {
  actualVisitDate: string;
  linkedReportKey: string;
  sessionId: string;
}

type CalendarViewMode = 'calendar' | 'list';
type CalendarLoadState = 'idle' | 'loading' | 'ready' | 'error';
type ScheduleListFilter =
  | 'all'
  | 'unselected'
  | 'selected'
  | SafetyInspectionSchedule['status'];

const EMPTY_DIALOG_STATE: ScheduleDialogState = {
  open: false,
  plannedDate: '',
  scheduleId: '',
  selectionReasonLabel: '',
  selectionReasonMemo: '',
  siteId: '',
};

function getMonthToken(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function shiftMonthToken(month: string, delta: number) {
  const [year, monthValue] = month.split('-').map(Number);
  const date = new Date(year, monthValue - 1 + delta, 1);
  return getMonthToken(date);
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

function sortSchedules(rows: SafetyInspectionSchedule[]) {
  return [...rows].sort(
    (left, right) =>
      left.roundNo - right.roundNo ||
      left.siteName.localeCompare(right.siteName, 'ko') ||
      left.windowStart.localeCompare(right.windowStart),
  );
}

function sortScheduledRows(rows: SafetyInspectionSchedule[]) {
  return [...rows].sort(
    (left, right) =>
      (left.plannedDate || left.windowStart).localeCompare(right.plannedDate || right.windowStart) ||
      left.roundNo - right.roundNo ||
      left.siteName.localeCompare(right.siteName, 'ko'),
  );
}

function normalizeText(value: string | null | undefined) {
  return typeof value === 'string' ? value.trim() : '';
}

function formatWorkerRoundLabel(row: SafetyInspectionSchedule) {
  const totalRounds = row.totalRounds && row.totalRounds > 0 ? row.totalRounds : row.roundNo;
  return `${row.roundNo} / ${totalRounds}회차`;
}

function isDateWithinWindow(value: string, windowStart: string, windowEnd: string) {
  if (!value || !windowStart || !windowEnd) return false;
  return value >= windowStart && value <= windowEnd;
}

function buildWindowErrorMessage(
  input: { siteName: string; windowEnd: string; windowStart: string },
) {
  if (!input.windowStart || !input.windowEnd) {
    return `${input.siteName || '선택한 현장'}은 계약 기간이 설정되어 있지 않아 방문일을 저장할 수 없습니다.`;
  }
  return `${input.siteName || '선택한 현장'}은 계약 기간 ${input.windowStart} ~ ${input.windowEnd} 안에서만 선택할 수 있습니다.`;
}

function getStatusLabel(row: SafetyInspectionSchedule) {
  if (!row.plannedDate) return '미선택';
  switch (row.status) {
    case 'completed':
      return '완료';
    case 'canceled':
      return '취소';
    case 'postponed':
      return '보류';
    default:
      return '진행';
  }
}

function getStatusClassName(row: SafetyInspectionSchedule) {
  if (!row.plannedDate) return styles.statusPending;
  switch (row.status) {
    case 'completed':
      return styles.statusCompleted;
    case 'canceled':
      return styles.statusCanceled;
    case 'postponed':
      return styles.statusPostponed;
    default:
      return styles.statusPlanned;
  }
}

export function WorkerCalendarScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [month, setMonth] = useState(readStringParam(searchParams, 'month', getMonthToken()));
  const [rows, setRows] = useState<SafetyInspectionSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [calendarLoadState, setCalendarLoadState] = useState<CalendarLoadState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [listFilter, setListFilter] = useState<ScheduleListFilter>(
    readEnumParam(
      searchParams,
      'listFilter',
      ['all', 'unselected', 'selected', 'planned', 'completed', 'postponed', 'canceled'] as const,
      'all',
    ),
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [dialog, setDialog] = useState<ScheduleDialogState>(EMPTY_DIALOG_STATE);
  const [dialogSubmittingAction, setDialogSubmittingAction] = useState<'save' | 'launch' | null>(null);
  const calendarLoadRequestIdRef = useRef(0);
  const lastCompletedCalendarLoadKeyRef = useRef('');
  const duplicateCleanupKeysRef = useRef(new Set<string>());
  const [loadedReportIndexSiteIds, setLoadedReportIndexSiteIds] = useState<Set<string>>(() => new Set());
  const [reportIndexLoadedAfterMs, setReportIndexLoadedAfterMs] = useState(0);
  const [contractWindowsBySiteId, setContractWindowsBySiteId] = useState<
    Record<string, { windowEnd: string; windowStart: string }>
  >({});
  const {
    authError,
    createSession,
    currentUser,
    ensureAssignedSafetySite,
    ensureSessionLoaded,
    ensureSiteReportIndexLoaded,
    getSessionById,
    getSessionsBySiteId,
    getReportIndexBySiteId,
    isAuthenticated,
    isReady,
    login,
    logout,
    saveNow,
    sites,
    updateSession,
  } = useInspectionSessions();

  const isAdminView = Boolean(currentUser && isAdminUserRole(currentUser.role));
  const selectedSiteId = searchParams.get('siteId') || '';
  const viewMode: CalendarViewMode = searchParams.get('view') === 'list' ? 'list' : 'calendar';
  const siteListKey = useMemo(
    () => sites.map((site) => site.id).sort().join('|'),
    [sites],
  );

  const beginCalendarTransition = useCallback(() => {
    setRows([]);
    setLoadedReportIndexSiteIds(new Set());
    setReportIndexLoadedAfterMs(0);
    setLoading(true);
    setCalendarLoadState('loading');
  }, []);

  const replaceCalendarRoute = useCallback((input: {
    listFilter?: ScheduleListFilter;
    month?: string;
    siteId?: string;
    view?: CalendarViewMode;
  }) => {
    const nextMonth = input.month ?? month;
    const nextListFilter = input.listFilter ?? listFilter;
    const nextSiteId = input.siteId ?? selectedSiteId;
    const nextView = input.view ?? viewMode;
    if (nextMonth !== month || nextSiteId !== selectedSiteId) {
      beginCalendarTransition();
    }
    const nextSearchParams = new URLSearchParams();
    if (nextMonth && nextMonth !== getMonthToken()) {
      nextSearchParams.set('month', nextMonth);
    }
    if (nextListFilter !== 'all') {
      nextSearchParams.set('listFilter', nextListFilter);
    }
    if (nextSiteId) {
      nextSearchParams.set('siteId', nextSiteId);
    }
    if (nextView !== 'calendar') {
      nextSearchParams.set('view', nextView);
    }
    const query = nextSearchParams.toString();
    router.replace(query ? `/calendar?${query}` : '/calendar');
  }, [beginCalendarTransition, listFilter, month, router, selectedSiteId, viewMode]);

  useEffect(() => {
    setMonth(readStringParam(searchParams, 'month', getMonthToken()));
    setListFilter(
      readEnumParam(
        searchParams,
        'listFilter',
        ['all', 'unselected', 'selected', 'planned', 'completed', 'postponed', 'canceled'] as const,
        'all',
      ),
    );
  }, [searchParams]);

  useEffect(() => {
    replaceCalendarRoute({});
  }, [replaceCalendarRoute]);

  useEffect(() => {
    if (!currentUser) return;

    const pendingRedirect = consumePendingPostLoginRedirect();
    if (pendingRedirect) {
      if (pendingRedirect !== WORKER_CALENDAR_POST_LOGIN_REDIRECT) {
        router.replace(pendingRedirect);
      }
      return;
    }

    if (isAdminView) {
      router.replace(getAdminSectionHref('schedules', selectedSiteId ? { siteId: selectedSiteId } : undefined));
    }
  }, [currentUser, isAdminView, router, selectedSiteId]);

  const reloadCalendarRows = useCallback(
    async (input?: { month?: string; siteId?: string }) => {
      const loadMonth = input?.month ?? month;
      const loadSiteId = input?.siteId ?? selectedSiteId;
      const loadKey = `${loadMonth}\0${loadSiteId}\0${siteListKey}`;
      const loadStartedAt = Date.now();
      const requestId = ++calendarLoadRequestIdRef.current;

      setLoading(true);
      setCalendarLoadState('loading');
      setError(null);
      setRows([]);
      setLoadedReportIndexSiteIds(new Set());
      setReportIndexLoadedAfterMs(0);

      try {
        const response = await fetchAllMySchedules({
          month: loadMonth,
          siteId: loadSiteId,
        });
        const reportSiteIds = buildWorkerCalendarReportIndexSiteIds({
          rows: response.rows,
          selectedSiteId: loadSiteId,
          sites,
        });

        await Promise.allSettled(
          reportSiteIds.map((siteId) =>
            ensureSiteReportIndexLoaded(siteId, { force: true }),
          ),
        );

        if (calendarLoadRequestIdRef.current !== requestId) {
          return response;
        }

        setRows(response.rows);
        setLoadedReportIndexSiteIds(new Set(reportSiteIds));
        setReportIndexLoadedAfterMs(loadStartedAt);
        setCalendarLoadState('ready');
        lastCompletedCalendarLoadKeyRef.current = loadKey;
        return response;
      } catch (nextError) {
        if (calendarLoadRequestIdRef.current === requestId) {
          setError(nextError instanceof Error ? nextError.message : '내 일정을 불러오지 못했습니다.');
          setCalendarLoadState('error');
        }
        throw nextError;
      } finally {
        if (calendarLoadRequestIdRef.current === requestId) {
          setLoading(false);
        }
      }
    },
    [ensureSiteReportIndexLoaded, month, selectedSiteId, siteListKey, sites],
  );

  useEffect(() => {
    if (!isAuthenticated || isAdminView) return;
    const loadKey = `${month}\0${selectedSiteId}\0${siteListKey}`;
    if (lastCompletedCalendarLoadKeyRef.current === loadKey) {
      return;
    }
    void reloadCalendarRows().catch(() => undefined);
  }, [
    isAdminView,
    isAuthenticated,
    month,
    reloadCalendarRows,
    selectedSiteId,
    siteListKey,
  ]);

  const reportItemsBySiteId = useMemo(() => {
    const nextMap = new Map<string, InspectionReportListItem[]>();
    sites.forEach((site) => {
      const reportIndex = getReportIndexBySiteId(site.id);
      const indexedReports = shouldUseWorkerCalendarReportItems({
        readySiteIds: loadedReportIndexSiteIds,
        fetchedAt: reportIndex?.fetchedAt,
        loadedAfterMs: reportIndexLoadedAfterMs,
        siteId: site.id,
        status: reportIndex?.status,
      })
        ? reportIndex?.items ?? []
        : [];
      nextMap.set(site.id, mergeWorkerCalendarReportItems(indexedReports));
    });
    return nextMap;
  }, [getReportIndexBySiteId, loadedReportIndexSiteIds, reportIndexLoadedAfterMs, sites]);
  const calendarRows = useMemo(
    () =>
      buildWorkerCalendarRowsWithReportDates({
        contractWindowsBySiteId,
        reportsBySiteId: reportItemsBySiteId,
        rows,
        selectedSiteId,
        sites,
      }),
    [contractWindowsBySiteId, reportItemsBySiteId, rows, selectedSiteId, sites],
  );
  const cleanupCandidateRows = useMemo(
    () =>
      buildWorkerCalendarRowsWithReportDates({
        contractWindowsBySiteId,
        includeDuplicateReservations: true,
        reportsBySiteId: reportItemsBySiteId,
        rows,
        selectedSiteId,
        sites,
      }),
    [contractWindowsBySiteId, reportItemsBySiteId, rows, selectedSiteId, sites],
  );
  const selectedRows = useMemo(
    () =>
      [...calendarRows]
        .filter((row) => Boolean(row.plannedDate))
        .sort(
          (left, right) =>
            (left.plannedDate || '').localeCompare(right.plannedDate || '') ||
            left.roundNo - right.roundNo ||
            left.siteName.localeCompare(right.siteName, 'ko'),
        ),
    [calendarRows],
  );
  const listRows = useMemo(() => {
    const mergedRows = sortScheduledRows(calendarRows);
    switch (listFilter) {
      case 'unselected':
        return mergedRows.filter((row) => !row.plannedDate);
      case 'selected':
        return mergedRows.filter((row) => Boolean(row.plannedDate));
      case 'planned':
      case 'postponed':
      case 'completed':
      case 'canceled':
        return mergedRows.filter((row) => row.status === listFilter);
      default:
        return mergedRows;
    }
  }, [calendarRows, listFilter]);
  const calendar = useMemo(() => buildCalendarDays(month), [month]);
  const isCalendarLoading = loading || calendarLoadState === 'loading';
  const rowsByDate = useMemo(() => {
    const map = new Map<string, SafetyInspectionSchedule[]>();
    selectedRows.forEach((row) => {
      if (!row.plannedDate) return;
      if (!map.has(row.plannedDate)) {
        map.set(row.plannedDate, []);
      }
      map.get(row.plannedDate)?.push(row);
    });
    return map;
  }, [selectedRows]);
  const reportLookupBySiteId = useMemo(() => {
    const nextMap = new Map<string, ReturnType<typeof buildWorkerCalendarReportLookup>>();
    reportItemsBySiteId.forEach((items, siteId) => {
      nextMap.set(siteId, buildWorkerCalendarReportLookup(items));
    });
    return nextMap;
  }, [reportItemsBySiteId]);
  const dialogSiteOptions = useMemo<WorkerDialogSiteOption[]>(() => {
    return [...sites]
      .filter((site) => !selectedSiteId || site.id === selectedSiteId)
      .sort((left, right) => left.siteName.localeCompare(right.siteName, 'ko'))
      .map((site) => {
        const totalRounds =
          typeof site.totalRounds === 'number' && site.totalRounds > 0 ? site.totalRounds : 0;
        const progressedRounds = new Set<number>();
        calendarRows
          .filter((row) => row.siteId === site.id)
          .forEach((row) => {
            if (
              row.plannedDate ||
              row.actualVisitDate ||
              row.linkedReportKey ||
              row.status === 'completed'
            ) {
              progressedRounds.add(row.roundNo);
            }
          });
        const completedRounds = progressedRounds.size;
        const hasLoadedCompletion = true;
        const remainingRounds = Math.max(totalRounds - completedRounds, 0);
        return {
          completedRounds,
          hasLoadedCompletion,
          isComplete: hasLoadedCompletion && totalRounds > 0 && remainingRounds <= 0,
          label: site.siteName,
          remainingRounds,
          siteId: site.id,
          totalRounds,
        };
      });
  }, [
    calendarRows,
    selectedSiteId,
    sites,
  ]);
  const dialogSelectedSchedule = useMemo(
    () =>
      rows.find((row) => row.id === dialog.scheduleId) ??
      calendarRows.find((row) => row.id === dialog.scheduleId) ??
      null,
    [calendarRows, dialog.scheduleId, rows],
  );
  const dialogRoundRows = useMemo(() => {
    if (dialogSelectedSchedule) {
      return [dialogSelectedSchedule];
    }
    if (!dialog.siteId) {
      return [];
    }
    return sortSchedules(
      rows.filter(
        (row) =>
          row.siteId === dialog.siteId &&
          !row.plannedDate &&
          row.status !== 'completed' &&
          row.status !== 'canceled',
      ),
    ).slice(0, 1);
  }, [dialog.siteId, dialogSelectedSchedule, rows]);
  const dialogScheduleContractWindow = useMemo(
    () =>
      dialog.siteId
        ? buildContractWindowFromScheduleRows(
            calendarRows.filter((row) => row.siteId === dialog.siteId),
          )
        : { windowEnd: '', windowStart: '' },
    [calendarRows, dialog.siteId],
  );
  const dialogContractWindow = dialog.siteId
    ? resolveContractWindow(
        contractWindowsBySiteId[dialog.siteId] ?? null,
        dialogScheduleContractWindow,
      )
    : null;
  const dialogSiteName =
    dialogSelectedSchedule?.siteName ||
    dialogSiteOptions.find((option) => option.siteId === dialog.siteId)?.label ||
    '';
  const dialogWindowError =
    dialog.open && dialog.plannedDate && dialog.siteId
      ? !dialogContractWindow?.windowStart || !dialogContractWindow.windowEnd
        ? buildWindowErrorMessage({
            siteName: dialogSiteName,
            windowEnd: '',
            windowStart: '',
          })
        : !isDateWithinWindow(
              dialog.plannedDate,
              dialogContractWindow.windowStart,
              dialogContractWindow.windowEnd,
            )
          ? buildWindowErrorMessage({
              siteName: dialogSiteName,
              windowEnd: dialogContractWindow.windowEnd,
              windowStart: dialogContractWindow.windowStart,
            })
          : ''
      : '';
  useEffect(() => {
    if (!dialog.open || dialog.siteId || dialogSiteOptions.length === 0) return;
    setDialog((current) => ({
      ...current,
      siteId: dialogSiteOptions[0].siteId,
    }));
  }, [dialog.open, dialog.siteId, dialogSiteOptions]);

  useEffect(() => {
    if (!dialog.open || !dialog.siteId || dialog.scheduleId) return;
    const nextSchedule = dialogRoundRows[0] ?? null;
    if (!nextSchedule) return;
    setDialog((current) => ({
      ...current,
      scheduleId: nextSchedule.id,
      selectionReasonLabel: nextSchedule.selectionReasonLabel || '',
      selectionReasonMemo: nextSchedule.selectionReasonMemo || '',
    }));
  }, [dialog.open, dialog.scheduleId, dialog.siteId, dialogRoundRows]);

  useEffect(() => {
    if (!dialog.open || !dialog.siteId) return;
    void ensureSiteReportIndexLoaded(dialog.siteId).catch(() => undefined);
  }, [dialog.open, dialog.siteId, ensureSiteReportIndexLoaded]);

  useEffect(() => {
    if (!dialog.open || !dialog.siteId) return;
    const currentWindow = contractWindowsBySiteId[dialog.siteId];
    if (currentWindow?.windowStart && currentWindow.windowEnd) return;

    let cancelled = false;
    void ensureAssignedSafetySite(dialog.siteId)
      .then((assignedSite) => {
        if (cancelled) return;
        setContractWindowsBySiteId((current) => ({
          ...current,
          [dialog.siteId]: buildContractWindowFromSafetySite(assignedSite),
        }));
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [contractWindowsBySiteId, dialog.open, dialog.siteId, ensureAssignedSafetySite]);

  const closeDialog = () => {
    setDialog(EMPTY_DIALOG_STATE);
  };

  const openScheduleDialog = (input: {
    plannedDate: string;
    schedule?: SafetyInspectionSchedule | null;
  }) => {
    const nextPlannedDate = input.plannedDate;
    const requestedSchedule = input.schedule ?? null;
    const defaultSiteId =
      requestedSchedule?.siteId ||
      (selectedSiteId && dialogSiteOptions.some((option) => option.siteId === selectedSiteId)
        ? selectedSiteId
        : dialogSiteOptions[0]?.siteId || '');
    const existingDateSchedule =
      requestedSchedule ??
      sortSchedules(
        calendarRows.filter(
          (row) =>
            row.plannedDate === nextPlannedDate &&
            (!defaultSiteId || row.siteId === defaultSiteId),
        ),
      )[0] ??
      null;

    setSelectedDate(nextPlannedDate);
    setDialog({
      open: true,
      plannedDate: nextPlannedDate,
      scheduleId: existingDateSchedule?.id || '',
      selectionReasonLabel: existingDateSchedule?.selectionReasonLabel || '',
      selectionReasonMemo: existingDateSchedule?.selectionReasonMemo || '',
      siteId: existingDateSchedule?.siteId || defaultSiteId,
    });
  };

  const handleDialogSiteSelect = (siteId: string) => {
    setDialog((current) => ({
      ...current,
      scheduleId: '',
      selectionReasonLabel: '',
      selectionReasonMemo: '',
      siteId,
    }));
  };

  const upsertScheduleRow = useCallback((schedule: SafetyInspectionSchedule) => {
    setRows((current) => {
      const nextRows = current.filter(
        (row) =>
          row.id !== schedule.id &&
          !(row.siteId === schedule.siteId && row.roundNo === schedule.roundNo),
      );
      return [...nextRows, schedule];
    });
  }, []);

  const upsertScheduleRows = useCallback((schedules: SafetyInspectionSchedule[]) => {
    if (schedules.length === 0) return;
    setRows((current) => {
      const nextRows = current.filter(
        (row) =>
          !schedules.some(
            (schedule) =>
              schedule.id === row.id ||
              (schedule.siteId === row.siteId && schedule.roundNo === row.roundNo),
          ),
      );
      return [...nextRows, ...schedules];
    });
  }, []);

  useEffect(() => {
    if (!isAuthenticated || isAdminView || loading) return;
    const persistedIds = new Set(rows.map((row) => row.id));
    const cleanupTargets = findDuplicateUnlinkedScheduleReservations(cleanupCandidateRows)
      .filter((row) => persistedIds.has(row.id))
      .filter((row) => {
        const key = `${row.id}::${row.plannedDate}::${row.roundNo}`;
        if (duplicateCleanupKeysRef.current.has(key)) {
          return false;
        }
        duplicateCleanupKeysRef.current.add(key);
        return true;
      });

    if (cleanupTargets.length === 0) return;

    let cancelled = false;
    void (async () => {
      const cleanedRows: SafetyInspectionSchedule[] = [];
      try {
        for (const target of cleanupTargets) {
          const cleaned = await updateMySchedule(target.id, {
            actualVisitDate: '',
            linkedReportKey: '',
            plannedDate: '',
          });
          cleanedRows.push({
            ...cleaned,
            actualVisitDate: cleaned.actualVisitDate || '',
            linkedReportKey: cleaned.linkedReportKey || '',
            plannedDate: cleaned.plannedDate || '',
            windowEnd: cleaned.windowEnd || target.windowEnd,
            windowStart: cleaned.windowStart || target.windowStart,
          });
        }
        if (cancelled) return;
        upsertScheduleRows(cleanedRows);
        const firstTarget = cleanupTargets[0];
        setNotice(
          cleanupTargets.length > 1
            ? `${firstTarget.siteName} 중복 방문 일정 ${cleanupTargets.length}건을 정리했습니다.`
            : `${firstTarget.siteName} ${firstTarget.roundNo}회차 중복 방문 일정을 정리했습니다.`,
        );
      } catch (nextError) {
        cleanupTargets.forEach((row) => {
          duplicateCleanupKeysRef.current.delete(`${row.id}::${row.plannedDate}::${row.roundNo}`);
        });
        if (!cancelled) {
          setError(
            nextError instanceof Error
              ? nextError.message
              : '중복 방문 일정을 정리하지 못했습니다.',
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    cleanupCandidateRows,
    isAdminView,
    isAuthenticated,
    loading,
    rows,
    upsertScheduleRows,
  ]);

  const buildSiteScheduleRows = (siteId: string, changedSchedule: SafetyInspectionSchedule) => {
    const byRound = new Map<number, SafetyInspectionSchedule>();
    rows
      .filter((row) => row.siteId === siteId)
      .forEach((row) => {
        byRound.set(row.roundNo, row);
      });
    byRound.set(changedSchedule.roundNo, changedSchedule);
    return Array.from(byRound.values());
  };

  const persistScheduleReportSync = async (changedSchedule: SafetyInspectionSchedule) => {
    const scheduleResponse = await fetchAllMySchedules({
      includeAll: true,
      siteId: changedSchedule.siteId,
    });
    const siteSchedules = [
      ...scheduleResponse.rows.filter((row) => row.id !== changedSchedule.id),
      changedSchedule,
    ];
    const reportIndex = getReportIndexBySiteId(changedSchedule.siteId);
    const contractWindow = resolveContractWindow(
      contractWindowsBySiteId[changedSchedule.siteId] ?? null,
      buildContractWindowFromScheduleRows(siteSchedules),
    );
    const plan = buildScheduleReportSyncPlan({
      buildReportTitle: buildDefaultReportTitle,
      changedSchedule: {
        actualVisitDate: changedSchedule.actualVisitDate,
        linkedReportKey: changedSchedule.linkedReportKey,
        plannedDate: changedSchedule.plannedDate,
        scheduleId: changedSchedule.id,
      },
      contractWindow,
      reports: reportIndex?.status === 'loaded' ? reportIndex.items : [],
      schedules: siteSchedules.length > 0
        ? siteSchedules
        : buildSiteScheduleRows(changedSchedule.siteId, changedSchedule),
    });

    if (!plan.ok) {
      throw new Error(plan.message);
    }

    const savedSchedules: SafetyInspectionSchedule[] = [];
    for (const update of plan.scheduleUpdates) {
      const saved = await updateMySchedule(update.scheduleId, {
        actualVisitDate: update.actualVisitDate,
        linkedReportKey: update.linkedReportKey,
        plannedDate: update.plannedDate,
      });
      savedSchedules.push(saved);
    }
    upsertScheduleRows(savedSchedules);

    for (const update of plan.reportUpdates) {
      if (!getSessionById(update.reportKey)) {
        await ensureSessionLoaded(update.reportKey);
      }
      if (!getSessionById(update.reportKey)) {
        throw new Error('연결된 보고서를 불러오지 못해 일정과 보고서를 함께 정리하지 못했습니다.');
      }
      updateSession(update.reportKey, (current) =>
        applyScheduleReportUpdateToSession(current, update),
      );
    }
    if (plan.reportUpdates.length > 0) {
      await saveNow({ throwOnError: true });
    }

    return (
      savedSchedules.find((schedule) => schedule.id === changedSchedule.id) ??
      changedSchedule
    );
  };

  const ensureDraftSessionForSchedule = async (schedule: SafetyInspectionSchedule) => {
    const reportLookup =
      reportLookupBySiteId.get(schedule.siteId) ?? buildWorkerCalendarReportLookup([]);
    const selectedReport = resolveWorkerCalendarReportForSchedule(schedule, reportLookup);
    if (selectedReport) {
      return {
        actualVisitDate: normalizeText(schedule.actualVisitDate),
        linkedReportKey: normalizeText(selectedReport.reportKey),
        sessionId: normalizeText(selectedReport.reportKey),
      } satisfies WorkerGuidanceSessionLink;
    }

    const site = sites.find((item) => item.id === schedule.siteId);
    if (!site) return null;

    const existingSession = getSessionsBySiteId(site.id).find(
      (session) =>
        (session.scheduleId && session.scheduleId === schedule.id) ||
        session.reportNumber === schedule.roundNo,
    );
    if (existingSession) {
      return {
        actualVisitDate: normalizeText(schedule.actualVisitDate),
        linkedReportKey: existingSession.id,
        sessionId: existingSession.id,
      } satisfies WorkerGuidanceSessionLink;
    }

    let technicalGuidanceRelations:
      | ReturnType<typeof createEmptyTechnicalGuidanceRelations>
      | undefined;
    let document4FollowUps:
      | NonNullable<Parameters<typeof createSession>[1]>['document4FollowUps']
      | undefined;

    try {
      const token = readSafetyAuthToken();
      if (token) {
        const seed = await fetchTechnicalGuidanceSeed(token, site.id);
        document4FollowUps = seed.open_followups.map((item) => ({
          id: item.id,
          sourceSessionId: item.source_session_id ?? undefined,
          sourceFindingId: item.source_finding_id ?? undefined,
          location: item.location,
          guidanceDate: item.guidance_date,
          confirmationDate: item.confirmation_date || schedule.plannedDate,
          beforePhotoUrl: item.before_photo_url,
          afterPhotoUrl: item.after_photo_url,
          result: item.result,
        }));
        technicalGuidanceRelations = createEmptyTechnicalGuidanceRelations({
          computedAt: new Date().toISOString(),
          projectionVersion: seed.projection_version,
          stale: false,
          recomputeStatus: 'fresh',
          sourceReportKeys: seed.previous_authoritative_report?.report_key
            ? [seed.previous_authoritative_report.report_key]
            : [],
          cumulativeAccidentEntries: seed.cumulative_accident_entries,
          cumulativeAgentEntries: seed.cumulative_agent_entries,
        });
      }
    } catch {
      document4FollowUps = undefined;
      technicalGuidanceRelations = undefined;
    }

    const reportDate = schedule.plannedDate || new Date().toISOString().slice(0, 10);
    const createdSession = createSession(site, {
      document4FollowUps,
      meta: {
        drafter: currentUser?.name || site.assigneeName,
        reportDate,
        reportTitle: buildDefaultReportTitle(reportDate, schedule.roundNo),
        siteName: site.siteName,
      },
      reportNumber: schedule.roundNo,
      scheduleId: schedule.id,
      scheduleRoundNo: schedule.roundNo,
      technicalGuidanceRelations,
    });
    return {
      actualVisitDate: normalizeText(schedule.actualVisitDate),
      linkedReportKey: createdSession.id,
      sessionId: createdSession.id,
    } satisfies WorkerGuidanceSessionLink;
  };

  const resolvePersistedScheduleForSave = async (schedule: SafetyInspectionSchedule) => {
    if (rows.some((row) => row.id === schedule.id)) {
      return schedule;
    }

    const response = await fetchAllMySchedules({
      includeAll: true,
      siteId: schedule.siteId,
    });
    const persisted =
      response.rows.find((row) => row.id === schedule.id) ??
      response.rows.find(
        (row) => row.siteId === schedule.siteId && row.roundNo === schedule.roundNo,
      );

    setRows((current) => {
      const nextRows = current.filter(
        (row) =>
          !response.rows.some(
            (refreshed) =>
              refreshed.id === row.id ||
              (refreshed.siteId === row.siteId && refreshed.roundNo === row.roundNo),
          ),
      );
      return [...nextRows, ...response.rows];
    });

    return persisted ?? schedule;
  };

  const persistScheduleReportLink = async (
    schedule: SafetyInspectionSchedule,
    reportLinkUpdate: WorkerGuidanceSessionLink | null,
    selectionReasonLabel: string,
    selectionReasonMemo: string,
  ) => {
    const nextLinkedReportKey =
      normalizeText(reportLinkUpdate?.linkedReportKey) || normalizeText(reportLinkUpdate?.sessionId);
    const nextActualVisitDate = normalizeText(schedule.actualVisitDate);
    const nextPlannedDate = normalizeText(schedule.plannedDate);
    const mergedSchedule: SafetyInspectionSchedule = {
      ...schedule,
      actualVisitDate: nextActualVisitDate,
      linkedReportKey: normalizeText(schedule.linkedReportKey) || nextLinkedReportKey,
      plannedDate: nextPlannedDate || schedule.plannedDate,
    };
    const currentLinkedReportKey = normalizeText(schedule.linkedReportKey);
    const shouldPersistLink =
      nextLinkedReportKey &&
      (nextLinkedReportKey !== currentLinkedReportKey ||
        nextActualVisitDate !== normalizeText(schedule.actualVisitDate) ||
        nextPlannedDate !== normalizeText(schedule.plannedDate));

    if (!shouldPersistLink) {
      return mergedSchedule;
    }

    const saved = await updateMySchedule(schedule.id, {
      actualVisitDate: nextActualVisitDate,
      linkedReportKey: nextLinkedReportKey,
      plannedDate: nextPlannedDate || schedule.plannedDate,
      selectionReasonLabel,
      selectionReasonMemo,
      status: schedule.status,
    });

    const syncedSchedule: SafetyInspectionSchedule = {
      ...saved,
      actualVisitDate: saved.actualVisitDate || nextActualVisitDate,
      linkedReportKey: saved.linkedReportKey || nextLinkedReportKey,
      plannedDate: saved.plannedDate || nextPlannedDate || schedule.plannedDate,
      windowEnd: saved.windowEnd || schedule.windowEnd,
      windowStart: saved.windowStart || schedule.windowStart,
    };
    upsertScheduleRow(syncedSchedule);
    return syncedSchedule;
  };

  const saveScheduleSelection = async (schedule: SafetyInspectionSchedule | null) => {
    const selectionReasonLabel = dialog.selectionReasonLabel.trim();
    const selectionReasonMemo = dialog.selectionReasonMemo.trim();
    const linkedReportKey = '';
    const actualVisitDate = '';

    const persistedSchedule = schedule
      ? await resolvePersistedScheduleForSave(schedule)
      : null;
    const saved = persistedSchedule
      ? await updateMySchedule(persistedSchedule.id, {
          actualVisitDate,
          linkedReportKey,
          plannedDate: dialog.plannedDate,
          selectionReasonLabel,
          selectionReasonMemo,
        })
      : await reserveNextMySchedule({
          plannedDate: dialog.plannedDate,
          selectionReasonLabel,
          selectionReasonMemo,
          siteId: schedule?.siteId || dialog.siteId,
        });
    const updated: SafetyInspectionSchedule = {
      ...saved,
      actualVisitDate: saved.actualVisitDate || actualVisitDate,
      linkedReportKey: saved.linkedReportKey || linkedReportKey,
      windowEnd: saved.windowEnd || persistedSchedule?.windowEnd || schedule?.windowEnd || '',
      windowStart: saved.windowStart || persistedSchedule?.windowStart || schedule?.windowStart || '',
    };
    upsertScheduleRow(updated);

    await ensureSiteReportIndexLoaded(updated.siteId, { force: true }).catch(() => undefined);
    const reportLinkUpdate = await ensureDraftSessionForSchedule(updated);
    if (!reportLinkUpdate?.linkedReportKey && !reportLinkUpdate?.sessionId) {
      throw new Error('방문 일정에 연결할 기술지도 보고서를 생성하지 못했습니다.');
    }
    const finalized = reportLinkUpdate
      ? await persistScheduleReportLink(
          updated,
          reportLinkUpdate,
          selectionReasonLabel,
          selectionReasonMemo,
        )
      : updated;
    if (finalized !== updated) {
      upsertScheduleRow(finalized);
    }
    const linkedSessionId =
      normalizeText(reportLinkUpdate?.sessionId) ||
      normalizeText(reportLinkUpdate?.linkedReportKey);
    if (linkedSessionId && getSessionById(linkedSessionId)) {
      await saveNow({ throwOnError: true });
      await ensureSiteReportIndexLoaded(finalized.siteId, { force: true }).catch(() => undefined);
    }
    const synced = await persistScheduleReportSync(finalized);
    await ensureSiteReportIndexLoaded(synced.siteId, { force: true }).catch(() => undefined);
    setSelectedDate(synced.plannedDate || finalized.plannedDate || dialog.plannedDate);

    return {
      finalized: synced,
      reportLinkUpdate,
      selectionReasonLabel,
      selectionReasonMemo,
    };
  };

  const handleSaveSchedule = async () => {
    if (!dialog.siteId) {
      setError('현장을 먼저 선택해 주세요.');
      return;
    }
    const schedule = dialogRoundRows.find((row) => row.id === dialog.scheduleId) ?? null;
    if (!dialog.plannedDate) {
      setError('방문 날짜를 먼저 선택해 주세요.');
      return;
    }
    if (dialogWindowError) {
      setError(dialogWindowError);
      return;
    }
    const selectionReasonLabel = dialog.selectionReasonLabel.trim();
    const selectionReasonMemo = dialog.selectionReasonMemo.trim();

    try {
      setDialogSubmittingAction('save');
      setError(null);
      const { finalized } = await saveScheduleSelection(schedule);
      const targetDate = finalized.plannedDate || dialog.plannedDate;
      const targetMonth = targetDate.slice(0, 7) || month;
      await reloadCalendarRows({ month: targetMonth, siteId: selectedSiteId });
      if (targetMonth !== month) {
        setMonth(targetMonth);
      }
      setSelectedDate(targetDate);
      setNotice(
        selectionReasonLabel || selectionReasonMemo
          ? `${finalized.siteName} ${finalized.roundNo}회차 방문 일정과 사유를 저장했습니다.`
          : `${finalized.siteName} ${finalized.roundNo}회차 방문 일정을 저장했습니다.`,
      );
      closeDialog();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '일정을 저장하지 못했습니다.');
    } finally {
      setDialogSubmittingAction(null);
    }
  };

  const handleLaunchTechnicalGuidance = async () => {
    if (!dialog.siteId) {
      setError('현장을 먼저 선택해 주세요.');
      return;
    }

    const schedule = dialogRoundRows.find((row) => row.id === dialog.scheduleId) ?? null;

    const isReadOnlySchedule = schedule?.status === 'completed' || schedule?.status === 'canceled';
    if (!isReadOnlySchedule && !dialog.plannedDate) {
      setError('방문 날짜를 먼저 선택해 주세요.');
      return;
    }
    if (!isReadOnlySchedule && dialogWindowError) {
      setError(dialogWindowError);
      return;
    }

    try {
      setDialogSubmittingAction('launch');
      setError(null);

      const savedSelection = isReadOnlySchedule && schedule
        ? { finalized: schedule, reportLinkUpdate: await ensureDraftSessionForSchedule(schedule) }
        : await saveScheduleSelection(schedule);
      const reportLinkUpdate = savedSelection.reportLinkUpdate;
      const sessionId =
        normalizeText(reportLinkUpdate?.sessionId) ||
        normalizeText(reportLinkUpdate?.linkedReportKey) ||
        normalizeText(savedSelection.finalized.linkedReportKey);

      if (!sessionId) {
        throw new Error('연결된 기술지도 보고서를 찾지 못했습니다.');
      }

      await ensureSessionLoaded(sessionId).catch(() => undefined);
      closeDialog();
      router.push(`/sessions/${encodeURIComponent(sessionId)}`);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : '연결된 기술지도 보고서를 열지 못했습니다.',
      );
    } finally {
      setDialogSubmittingAction(null);
    }
  };

  if (!isReady) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className="app-shell">
            <div className={homeStyles.emptyState}>
              <p className={homeStyles.emptyTitle}>일정을 준비하는 중입니다.</p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginPanel
        error={authError}
        onSubmit={login}
        title="내 일정 로그인"
        description="로그인하면 배정된 현장의 다음 방문 일정을 등록할 수 있습니다."
      />
    );
  }

  if (isAdminView) {
    return null;
  }

  return (
    <main className="app-page">
      <div className="app-container">
        <section className={`app-shell ${homeStyles.shell}`}>
          <WorkerAppHeader
            currentUserName={currentUser?.name}
            onLogout={logout}
            onOpenMenu={() => setMenuOpen(true)}
          />

          <WorkerShellBody>
            <WorkerMenuSidebar>
              <WorkerMenuPanel />
            </WorkerMenuSidebar>

            <div className={homeStyles.contentColumn}>
              <header className={homeStyles.hero}>
                <div className={homeStyles.heroBody}>
                  <div className={homeStyles.heroMain}>
                    <h1 className={homeStyles.heroTitle}>내 일정</h1>
                  </div>
                </div>
              </header>

              <div className={homeStyles.pageGrid}>
                <section className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h2 className={styles.sectionTitle}>방문 일정 등록</h2>
                      <div className={styles.sectionMeta}>
                        관제와 같은 일정 원본을 기준으로, 달력과 목록 두 방식으로 일정을 확인하고 수정할 수 있습니다.
                      </div>
                    </div>
                  </div>
                  {error ? <div className={homeStyles.emptyState}>{error}</div> : null}
                  {notice ? <div className={styles.noticeBox}>{notice}</div> : null}

                  <div className={styles.viewTabs} role="tablist" aria-label="일정 보기 방식">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={viewMode === 'calendar'}
                      className={`${styles.viewTab} ${viewMode === 'calendar' ? styles.viewTabActive : ''}`}
                      onClick={() => replaceCalendarRoute({ view: 'calendar' })}
                    >
                      달력으로 보기
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={viewMode === 'list'}
                      className={`${styles.viewTab} ${viewMode === 'list' ? styles.viewTabActive : ''}`}
                      onClick={() => replaceCalendarRoute({ view: 'list' })}
                    >
                      목록으로 보기
                    </button>
                  </div>

                  <div className={styles.toolbar}>
                    <div className={styles.monthNav}>
                      <button
                        type="button"
                        className="app-button app-button-secondary"
                        onClick={() => {
                          beginCalendarTransition();
                          setMonth((current) => shiftMonthToken(current, -1));
                        }}
                      >
                        이전 달
                      </button>
                      <button
                        type="button"
                        className="app-button app-button-secondary"
                        onClick={() => {
                          const targetMonth = getMonthToken();
                          if (targetMonth !== month) {
                            beginCalendarTransition();
                          }
                          setMonth(targetMonth);
                        }}
                      >
                        이번 달
                      </button>
                      <button
                        type="button"
                        className="app-button app-button-secondary"
                        onClick={() => {
                          beginCalendarTransition();
                          setMonth((current) => shiftMonthToken(current, 1));
                        }}
                      >
                        다음 달
                      </button>
                    </div>
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>표시 월</span>
                      <input
                        aria-label="표시 월"
                        className="app-input"
                        type="month"
                        value={month}
                        onChange={(event) => {
                          beginCalendarTransition();
                          setMonth(event.target.value || getMonthToken());
                        }}
                      />
                    </label>
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>현장</span>
                      <select
                        aria-label="현장"
                        className="app-select"
                        value={selectedSiteId}
                        onChange={(event) => {
                          const value = event.target.value;
                          replaceCalendarRoute({ siteId: value, view: viewMode });
                        }}
                      >
                        <option value="">전체 현장</option>
                        {sites.map((site) => (
                          <option key={site.id} value={site.id}>
                            {site.siteName}
                          </option>
                        ))}
                      </select>
                    </label>
                    {viewMode === 'list' ? (
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>목록 필터</span>
                        <select
                          aria-label="목록 필터"
                          className="app-select"
                          value={listFilter}
                          onChange={(event) => setListFilter(event.target.value as ScheduleListFilter)}
                        >
                          <option value="all">전체</option>
                          <option value="unselected">미선택 회차</option>
                          <option value="selected">선택 완료 일정</option>
                          <option value="planned">진행</option>
                          <option value="completed">완료</option>
                          <option value="postponed">보류</option>
                          <option value="canceled">취소</option>
                        </select>
                      </label>
                    ) : null}
                  </div>

                  {isCalendarLoading ? <div className={styles.emptyState}>일정을 불러오는 중입니다.</div> : null}

                  {viewMode === 'calendar' ? (
                    <div className={styles.layout}>
                      <div className={styles.list}>
                        <section className={styles.calendarPanel}>
                          <div className={styles.calendarPanelHeader}>
                            <h3 className={styles.sectionTitle}>월간 캘린더</h3>
                            <div className={styles.sectionMeta}>
                              날짜를 누르면 해당 날짜 기준으로 다음 진행 회차가 자동 배정됩니다.
                            </div>
                          </div>
                          <div className={styles.calendarGrid}>
                            {['월', '화', '수', '목', '금', '토', '일'].map((label) => (
                              <div key={label} className={styles.weekday}>
                                {label}
                              </div>
                            ))}
                            {Array.from({ length: calendar.leadingEmptyCount }).map((_, index) => (
                              <div key={`empty-${index + 1}`} className={styles.calendarCellEmpty} />
                            ))}
                            {calendar.days.map((day) => {
                              const dayRows = rowsByDate.get(day.token) || [];
                              const isActive = selectedDate === day.token;
                              return (
                                <div
                                  key={day.token}
                                  role="button"
                                  tabIndex={0}
                                  className={`${styles.calendarCell} ${isActive ? styles.calendarCellActive : ''}`}
                                  onClick={() =>
                                    openScheduleDialog({
                                      plannedDate: day.token,
                                      schedule: dayRows[0] ?? null,
                                    })
                                  }
                                  onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                      event.preventDefault();
                                      openScheduleDialog({
                                        plannedDate: day.token,
                                        schedule: dayRows[0] ?? null,
                                      });
                                    }
                                  }}
                                >
                                  <div className={styles.calendarDay}>{day.day}</div>
                                  <div className={styles.calendarEvents}>
                                    {dayRows.slice(0, 3).map((row) => (
                                      <button
                                        key={row.id}
                                        type="button"
                                        className={`${styles.calendarEvent} ${styles.calendarEventButton}`}
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          openScheduleDialog({
                                            plannedDate: row.plannedDate || day.token,
                                            schedule: row,
                                          });
                                        }}
                                      >
                                        {row.siteName} {row.roundNo}회차
                                      </button>
                                    ))}
                                    {dayRows.length > 3 ? (
                                      <span className={styles.calendarEvent}>+ {dayRows.length - 3}건</span>
                                    ) : null}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </section>
                      </div>
                    </div>
                  ) : (
                    <section className={styles.sectionCard}>
                      <div className={styles.sectionHeader}>
                        <div>
                          <h3 className={styles.sectionTitle}>기술지도 일정 목록</h3>
                          <div className={styles.sectionMeta}>
                            방문 일정 전체를 목록으로 보고 바로 수정할 수 있습니다.
                          </div>
                        </div>
                      </div>
                      {listRows.length === 0 ? (
                        <div className={styles.emptyState}>조건에 맞는 일정이 없습니다.</div>
                      ) : (
                        <div className={styles.tableScroll}>
                          <table className={styles.scheduleTable}>
                            <thead>
                              <tr>
                                <th>방문일</th>
                                <th>현장명</th>
                                <th>차수</th>
                                <th>상태</th>
                                <th>허용 구간</th>
                                <th>선택 사유</th>
                                <th>관리</th>
                              </tr>
                            </thead>
                            <tbody>
                              {listRows.map((row) => (
                                <tr key={row.id}>
                                  <td>{row.plannedDate || '-'}</td>
                                  <td>{row.siteName}</td>
                                  <td>{row.roundNo}회차</td>
                                  <td>
                                    <span className={`${styles.statusBadge} ${getStatusClassName(row)}`}>
                                      {getStatusLabel(row)}
                                    </span>
                                  </td>
                                  <td>
                                    {row.windowStart} ~ {row.windowEnd}
                                  </td>
                                  <td>{row.selectionReasonLabel || row.selectionReasonMemo || '-'}</td>
                                  <td>
                                    <button
                                      type="button"
                                      className="app-button app-button-secondary"
                                      onClick={() =>
                                        openScheduleDialog({
                                          plannedDate: row.plannedDate || row.windowStart,
                                          schedule: row,
                                        })}
                                    >
                                      {row.plannedDate ? '일정 수정' : '일정 지정'}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </section>
                  )}
                </section>
              </div>
            </div>
          </WorkerShellBody>
        </section>
      </div>

      <WorkerMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />

      <AppModal
        open={dialog.open}
        title="방문 일정 등록"
        onClose={closeDialog}
        actions={
          <>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={closeDialog}
              disabled={dialogSubmittingAction !== null}
            >
              닫기
            </button>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => void handleLaunchTechnicalGuidance()}
              disabled={!dialog.siteId || dialogSubmittingAction !== null}
            >
              {dialogSubmittingAction === 'launch' ? '기술지도 여는 중...' : '기술지도 실시'}
            </button>
            <button
              type="button"
              className="app-button app-button-primary"
              onClick={() => void handleSaveSchedule()}
              disabled={
                !dialog.siteId ||
                !dialog.plannedDate ||
                Boolean(dialogWindowError) ||
                dialogSubmittingAction !== null
              }
            >
              {dialogSubmittingAction === 'save' ? '일정 저장 중...' : '방문 일정 저장'}
            </button>
          </>
        }
      >
        <div className={styles.dialogStack}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>방문 날짜</span>
            <input
              className="app-input"
              type="date"
              value={dialog.plannedDate}
              onChange={(event) =>
                setDialog((current) => ({
                  ...current,
                  plannedDate: event.target.value,
                }))
              }
            />
          </label>

          <section className={styles.dialogSection}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>현장</span>
              <select
                className="app-select"
                name="worker-site-select"
                value={dialog.siteId}
                onChange={(event) => handleDialogSiteSelect(event.target.value)}
              >
                {dialogSiteOptions.length === 0 ? (
                  <option value="">배정된 현장이 없습니다.</option>
                ) : null}
                {dialogSiteOptions.map((option) => (
                  <option key={option.siteId} value={option.siteId}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className={styles.dialogSection}>
            <div className={styles.dialogHint}>
              {dialogSelectedSchedule
                ? `자동 배정 회차: ${formatWorkerRoundLabel(dialogSelectedSchedule)}`
                : '저장 시 다음 진행 회차가 자동 배정됩니다.'}
            </div>
          </section>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>사유 분류</span>
            <input
              className="app-input"
              value={dialog.selectionReasonLabel}
              onChange={(event) =>
                setDialog((current) => ({
                  ...current,
                  selectionReasonLabel: event.target.value,
                }))
              }
              placeholder="예: 현장 요청, 장비 반입 대기"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>상세 메모</span>
            <textarea
              className="app-textarea"
              rows={4}
              value={dialog.selectionReasonMemo}
              onChange={(event) =>
                setDialog((current) => ({
                  ...current,
                  selectionReasonMemo: event.target.value,
                }))
              }
              placeholder="방문 일정을 이 날짜로 선택한 배경을 자세히 적어 주세요."
            />
          </label>

          {dialogSelectedSchedule ? (
            <>
              <div className={styles.dialogHint}>
                계약 기간: {dialogContractWindow?.windowStart || '-'} ~ {dialogContractWindow?.windowEnd || '-'}
              </div>
              {dialogWindowError ? (
                <div className={styles.dialogError}>{dialogWindowError}</div>
              ) : null}
            </>
          ) : null}
        </div>
      </AppModal>
    </main>
  );
}

export default WorkerCalendarScreen;
