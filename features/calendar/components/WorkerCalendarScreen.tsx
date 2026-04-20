'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppModal from '@/components/ui/AppModal';
import LoginPanel from '@/components/auth/LoginPanel';
import WorkerAppHeader from '@/components/worker/WorkerAppHeader';
import WorkerMenuSidebar from '@/components/worker/WorkerMenuSidebar';
import WorkerShellBody from '@/components/worker/WorkerShellBody';
import { WorkerMenuDrawer, WorkerMenuPanel } from '@/components/worker/WorkerMenu';
import { createEmptyTechnicalGuidanceRelations } from '@/constants/inspectionSession/sessionFactory';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { isAdminUserRole, getAdminSectionHref } from '@/lib/admin';
import { buildDefaultReportTitle } from '@/features/site-reports/report-list/reportListHelpers';
import { fetchMySchedules, updateMySchedule } from '@/lib/calendar/apiClient';
import { fetchTechnicalGuidanceSeed, readSafetyAuthToken } from '@/lib/safetyApi';
import homeStyles from '@/features/home/components/HomeScreen.module.css';
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

type WorkerDialogRoundState =
  | 'available'
  | 'needs_schedule_link'
  | 'linked_report';

interface WorkerDialogRoundOption {
  linkedReport: InspectionReportListItem | null;
  row: SafetyInspectionSchedule;
  state: WorkerDialogRoundState;
}

const SYNTHETIC_WORKER_SCHEDULE_ID_PREFIX = 'worker-round:';

type CalendarViewMode = 'calendar' | 'list';
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

function isSyntheticWorkerScheduleId(value: string) {
  return value.startsWith(SYNTHETIC_WORKER_SCHEDULE_ID_PREFIX);
}

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

function buildContractWindowFromSafetySite(
  site: {
    contract_date?: string | null;
    contract_end_date?: string | null;
    contract_start_date?: string | null;
    project_end_date?: string | null;
  } | null,
) {
  const windowStart =
    normalizeText(site?.contract_start_date) || normalizeText(site?.contract_date);
  let windowEnd =
    normalizeText(site?.contract_end_date) ||
    normalizeText(site?.project_end_date) ||
    windowStart;
  if (windowStart && windowEnd && windowEnd < windowStart) {
    windowEnd = windowStart;
  }
  return {
    windowEnd,
    windowStart,
  };
}

function getReportPriorityScore(item: InspectionReportListItem) {
  let score = 0;
  if (item.status === 'published') score += 40;
  else if (item.status === 'submitted') score += 30;
  else if (item.status === 'draft') score += 20;
  if (item.publishedAt) score += 10;
  else if (item.submittedAt) score += 8;
  if (item.visitDate) score += 4;
  if (item.lastAutosavedAt) score += 2;
  return score;
}

function buildReportItemsByRound(rows: InspectionReportListItem[]) {
  const nextMap = new Map<number, InspectionReportListItem>();
  rows.forEach((row) => {
    if (typeof row.visitRound !== 'number' || !Number.isFinite(row.visitRound) || row.visitRound <= 0) {
      return;
    }
    const roundNo = Math.trunc(row.visitRound);
    const current = nextMap.get(roundNo) ?? null;
    if (!current || getReportPriorityScore(row) >= getReportPriorityScore(current)) {
      nextMap.set(roundNo, row);
    }
  });
  return nextMap;
}

function buildWorkerDialogRoundOptions(input: {
  contractWindowEnd: string;
  contractWindowStart: string;
  reportItemsByRound: Map<number, InspectionReportListItem>;
  siteId: string;
  siteName: string;
  rows: SafetyInspectionSchedule[];
  totalRounds: number;
}) {
  if (input.totalRounds <= 0) {
    return [] as WorkerDialogRoundOption[];
  }

  const siteRows = sortSchedules(input.rows.filter((row) => row.siteId === input.siteId));
  const existingByRound = new Map(siteRows.map((row) => [row.roundNo, row]));
  const fallbackWindowStart = input.contractWindowStart || siteRows[0]?.windowStart || '';
  const fallbackWindowEnd = input.contractWindowEnd || siteRows[0]?.windowEnd || fallbackWindowStart;
  const nextRows: WorkerDialogRoundOption[] = [];

  for (let roundNo = 1; roundNo <= input.totalRounds; roundNo += 1) {
    const existing = existingByRound.get(roundNo) ?? null;
    const linkedReport = input.reportItemsByRound.get(roundNo) ?? null;
    if (existing && (existing.status === 'canceled' || existing.status === 'completed')) {
      continue;
    }
    const hasPersistedLink = Boolean(normalizeText(existing?.linkedReportKey));
    const state: WorkerDialogRoundState = linkedReport
      ? hasPersistedLink
        ? 'linked_report'
        : 'needs_schedule_link'
      : 'available';
    if (existing) {
      nextRows.push({
        linkedReport,
        row: {
          ...existing,
          actualVisitDate: existing.actualVisitDate || normalizeText(linkedReport?.visitDate),
          windowEnd: existing.windowEnd || fallbackWindowEnd,
          windowStart: existing.windowStart || fallbackWindowStart,
        },
        state,
      });
      continue;
    }

    nextRows.push({
      linkedReport,
      row: {
        actualVisitDate: normalizeText(linkedReport?.visitDate),
        assigneeName: '',
        assigneeUserId: '',
        exceptionMemo: '',
        exceptionReasonCode: '',
        headquarterId: '',
        headquarterName: '',
        id: `${SYNTHETIC_WORKER_SCHEDULE_ID_PREFIX}${input.siteId}:${roundNo}`,
        isConflicted: false,
        isOutOfWindow: false,
        isOverdue: false,
        linkedReportKey: '',
        plannedDate: '',
        roundNo,
        selectionConfirmedAt: '',
        selectionConfirmedByName: '',
        selectionConfirmedByUserId: '',
        selectionReasonLabel: '',
        selectionReasonMemo: '',
        siteId: input.siteId,
        siteName: input.siteName,
        status: 'planned',
        totalRounds: input.totalRounds,
        windowEnd: fallbackWindowEnd,
        windowStart: fallbackWindowStart,
      },
      state,
    });
  }

  return [...nextRows].sort(
    (left, right) =>
      left.row.roundNo - right.row.roundNo ||
      left.row.siteName.localeCompare(right.row.siteName, 'ko') ||
      left.row.windowStart.localeCompare(right.row.windowStart),
  );
}

function findPreferredWorkerDialogOption(
  options: WorkerDialogRoundOption[],
  input: {
    plannedDate: string;
    scheduleId?: string;
  },
) {
  const rows = options.map((option) => option.row);
  const availableRows = options
    .filter((option) => option.state === 'available')
    .map((option) => option.row);
  const needsLinkRows = options
    .filter((option) => option.state === 'needs_schedule_link')
    .map((option) => option.row);
  return (
    rows.find((row) => row.id === input.scheduleId) ??
    availableRows.find((row) => !row.plannedDate) ??
    needsLinkRows.find((row) => !row.plannedDate) ??
    rows.find((row) => row.plannedDate === input.plannedDate) ??
    availableRows[0] ??
    needsLinkRows[0] ??
    rows[0] ??
    null
  );
}

function getCompletedRoundNumbers(rows: Array<{ visitRound: number | null }>) {
  const completed = new Set<number>();
  rows.forEach((row) => {
    if (typeof row.visitRound === 'number' && Number.isFinite(row.visitRound) && row.visitRound > 0) {
      completed.add(Math.trunc(row.visitRound));
    }
  });
  return completed;
}

function getSelectableWorkerRoundCount(rows: WorkerDialogRoundOption[]) {
  return rows.filter((option) => option.state !== 'linked_report').length;
}

function formatWorkerRoundLabel(row: SafetyInspectionSchedule) {
  const totalRounds = row.totalRounds && row.totalRounds > 0 ? row.totalRounds : row.roundNo;
  return `${row.roundNo} / ${totalRounds}회차`;
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
  const [month, setMonth] = useState(getMonthToken());
  const [rows, setRows] = useState<SafetyInspectionSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listFilter, setListFilter] = useState<ScheduleListFilter>('all');
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [dialog, setDialog] = useState<ScheduleDialogState>(EMPTY_DIALOG_STATE);
  const [contractWindowsBySiteId, setContractWindowsBySiteId] = useState<
    Record<string, { windowEnd: string; windowStart: string }>
  >({});
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    authError,
    createSession,
    currentUser,
    ensureAssignedSafetySite,
    ensureSiteReportIndexLoaded,
    getSessionsBySiteId,
    getReportIndexBySiteId,
    isAuthenticated,
    isReady,
    login,
    logout,
    sites,
  } = useInspectionSessions();

  const isAdminView = Boolean(currentUser && isAdminUserRole(currentUser.role));
  const selectedSiteId = searchParams.get('siteId') || '';
  const viewMode: CalendarViewMode = searchParams.get('view') === 'list' ? 'list' : 'calendar';

  const replaceCalendarRoute = (input: {
    siteId?: string;
    view?: CalendarViewMode;
  }) => {
    const nextSiteId = input.siteId ?? selectedSiteId;
    const nextView = input.view ?? viewMode;
    const nextSearchParams = new URLSearchParams();
    if (nextSiteId) {
      nextSearchParams.set('siteId', nextSiteId);
    }
    if (nextView !== 'calendar') {
      nextSearchParams.set('view', nextView);
    }
    const query = nextSearchParams.toString();
    router.replace(query ? `/calendar?${query}` : '/calendar');
  };

  useEffect(() => {
    if (isAdminView) {
      router.replace(getAdminSectionHref('schedules', selectedSiteId ? { siteId: selectedSiteId } : undefined));
    }
  }, [isAdminView, router, selectedSiteId]);

  useEffect(() => {
    if (!isAuthenticated || isAdminView) return;
    let cancelled = false;
    void (async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchMySchedules({
          month,
          siteId: selectedSiteId,
        });
        if (!cancelled) {
          setRows(response.rows);
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : '내 일정을 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdminView, isAuthenticated, month, selectedSiteId]);

  const selectedRows = useMemo(
    () =>
      [...rows]
        .filter((row) => Boolean(row.plannedDate))
        .sort(
          (left, right) =>
            (left.plannedDate || '').localeCompare(right.plannedDate || '') ||
            left.roundNo - right.roundNo ||
            left.siteName.localeCompare(right.siteName, 'ko'),
        ),
    [rows],
  );
  const listRows = useMemo(() => {
    const mergedRows = sortScheduledRows(rows);
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
  }, [listFilter, rows]);
  const calendar = useMemo(() => buildCalendarDays(month), [month]);
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
  const reportCompletedRoundsBySiteId = useMemo(() => {
    const nextMap = new Map<string, Set<number>>();
    sites.forEach((site) => {
      const reportIndex = getReportIndexBySiteId(site.id);
      nextMap.set(
        site.id,
        reportIndex?.status === 'loaded'
          ? getCompletedRoundNumbers(reportIndex.items)
          : new Set<number>(),
      );
    });
    return nextMap;
  }, [getReportIndexBySiteId, sites]);
  const reportItemsByRoundBySiteId = useMemo(() => {
    const nextMap = new Map<string, Map<number, InspectionReportListItem>>();
    sites.forEach((site) => {
      const reportIndex = getReportIndexBySiteId(site.id);
      nextMap.set(
        site.id,
        reportIndex?.status === 'loaded' ? buildReportItemsByRound(reportIndex.items) : new Map(),
      );
    });
    return nextMap;
  }, [getReportIndexBySiteId, sites]);
  const dialogSiteOptions = useMemo<WorkerDialogSiteOption[]>(() => {
    return [...sites]
      .filter((site) => !selectedSiteId || site.id === selectedSiteId)
      .sort((left, right) => left.siteName.localeCompare(right.siteName, 'ko'))
      .map((site) => {
        const totalRounds = typeof site.totalRounds === 'number' && site.totalRounds > 0 ? site.totalRounds : 0;
        const reportIndex = getReportIndexBySiteId(site.id);
        const hasLoadedCompletion = reportIndex?.status === 'loaded';
        const completedRounds = hasLoadedCompletion
          ? reportCompletedRoundsBySiteId.get(site.id)?.size ?? 0
          : 0;
        const contractWindow = contractWindowsBySiteId[site.id] ?? { windowEnd: '', windowStart: '' };
        const remainingRounds = hasLoadedCompletion
          ? getSelectableWorkerRoundCount(
              buildWorkerDialogRoundOptions({
                contractWindowEnd: contractWindow.windowEnd,
                contractWindowStart: contractWindow.windowStart,
                reportItemsByRound: reportItemsByRoundBySiteId.get(site.id) ?? new Map(),
                siteId: site.id,
                siteName: site.siteName,
                rows,
                totalRounds,
              }),
            )
          : Math.max(totalRounds - completedRounds, 0);
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
    contractWindowsBySiteId,
    getReportIndexBySiteId,
    reportCompletedRoundsBySiteId,
    reportItemsByRoundBySiteId,
    rows,
    selectedSiteId,
    sites,
  ]);
  const dialogSelectedSite = useMemo(
    () => dialogSiteOptions.find((option) => option.siteId === dialog.siteId) ?? null,
    [dialog.siteId, dialogSiteOptions],
  );
  const dialogRoundOptions = useMemo(() => {
    const contractWindow = contractWindowsBySiteId[dialog.siteId] ?? { windowEnd: '', windowStart: '' };
    return buildWorkerDialogRoundOptions({
      contractWindowEnd: contractWindow.windowEnd,
      contractWindowStart: contractWindow.windowStart,
      reportItemsByRound: reportItemsByRoundBySiteId.get(dialog.siteId) ?? new Map(),
      siteId: dialog.siteId,
      siteName: dialogSelectedSite?.label || '',
      rows,
      totalRounds: dialogSelectedSite?.totalRounds ?? 0,
    });
  }, [contractWindowsBySiteId, dialog.siteId, dialogSelectedSite, reportItemsByRoundBySiteId, rows]);
  const dialogRoundRows = useMemo(
    () =>
      dialogRoundOptions
        .filter((option) => option.state !== 'linked_report' || option.row.id === dialog.scheduleId)
        .map((option) => option.row),
    [dialog.scheduleId, dialogRoundOptions],
  );
  const dialogRoundOptionById = useMemo(
    () => new Map(dialogRoundOptions.map((option) => [option.row.id, option])),
    [dialogRoundOptions],
  );
  const dialogSelectedOption = useMemo(
    () => dialogRoundOptionById.get(dialog.scheduleId) ?? null,
    [dialog.scheduleId, dialogRoundOptionById],
  );
  const dialogSelectedSchedule = useMemo(
    () => dialogRoundRows.find((row) => row.id === dialog.scheduleId) ?? null,
    [dialog.scheduleId, dialogRoundRows],
  );
  const dialogSelectedReportIndexState = dialog.siteId
    ? getReportIndexBySiteId(dialog.siteId)
    : null;
  useEffect(() => {
    if (!dialog.open || dialog.siteId || dialogSiteOptions.length === 0) return;
    setDialog((current) => ({
      ...current,
      siteId: dialogSiteOptions[0].siteId,
    }));
  }, [dialog.open, dialog.siteId, dialogSiteOptions]);

  useEffect(() => {
    if (!dialog.open || !dialog.siteId) return;
    void ensureSiteReportIndexLoaded(dialog.siteId).catch(() => undefined);
  }, [dialog.open, dialog.siteId, ensureSiteReportIndexLoaded]);

  useEffect(() => {
    if (!dialog.open) return;
    const missingSiteIds = dialogSiteOptions
      .map((option) => option.siteId)
      .filter((siteId) => !contractWindowsBySiteId[siteId]);
    if (missingSiteIds.length === 0) {
      return;
    }
    let cancelled = false;
    void (async () => {
      const nextEntries = await Promise.all(
        missingSiteIds.map(async (siteId) => {
          const assignedSite = await ensureAssignedSafetySite(siteId);
          return [siteId, buildContractWindowFromSafetySite(assignedSite)] as const;
        }),
      );
      if (cancelled) {
        return;
      }
      setContractWindowsBySiteId((current) => {
        const next = { ...current };
        nextEntries.forEach(([siteId, contractWindow]) => {
          next[siteId] = contractWindow;
        });
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [contractWindowsBySiteId, dialog.open, dialogSiteOptions, ensureAssignedSafetySite]);

  useEffect(() => {
    if (!dialog.open || !dialog.siteId) return;
    const currentOption = dialogRoundOptionById.get(dialog.scheduleId) ?? null;
    const firstReportFreeRow =
      dialogRoundOptions.find((option) => !option.linkedReport && !option.row.plannedDate)?.row ??
      dialogRoundOptions.find((option) => !option.linkedReport)?.row ??
      null;
    const preferredRow =
      currentOption?.linkedReport && firstReportFreeRow
        ? firstReportFreeRow
        : findPreferredWorkerDialogOption(dialogRoundOptions, {
      plannedDate: dialog.plannedDate,
      scheduleId: currentOption?.state === 'available' ? dialog.scheduleId : '',
    });
    if (!preferredRow) {
      if (!dialog.scheduleId) return;
      setDialog((current) => ({
        ...current,
        scheduleId: '',
        selectionReasonLabel: '',
        selectionReasonMemo: '',
      }));
      return;
    }
    const shouldKeepCurrentSelection =
      preferredRow.id === dialog.scheduleId ||
      (!dialog.plannedDate && currentOption?.state === 'available');
    if (shouldKeepCurrentSelection) {
      return;
    }
    setDialog((current) => ({
      ...current,
      scheduleId: preferredRow.id,
      selectionReasonLabel: preferredRow.selectionReasonLabel || '',
      selectionReasonMemo: preferredRow.selectionReasonMemo || '',
    }));
  }, [
    dialog.open,
    dialog.plannedDate,
    dialog.scheduleId,
    dialog.siteId,
    dialogRoundOptionById,
    dialogRoundOptions,
    dialogRoundRows,
  ]);

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
    const defaultSiteOption =
      dialogSiteOptions.find((option) => option.siteId === defaultSiteId) ?? null;
    const defaultContractWindow = contractWindowsBySiteId[defaultSiteId] ?? { windowEnd: '', windowStart: '' };
    const defaultSiteRows = buildWorkerDialogRoundOptions({
      contractWindowEnd: defaultContractWindow.windowEnd,
      contractWindowStart: defaultContractWindow.windowStart,
      reportItemsByRound: reportItemsByRoundBySiteId.get(defaultSiteId) ?? new Map(),
      siteId: defaultSiteId,
      siteName: defaultSiteOption?.label || requestedSchedule?.siteName || '',
      rows,
      totalRounds: defaultSiteOption?.totalRounds ?? requestedSchedule?.totalRounds ?? 0,
    })
      .filter((option) => option.state !== 'linked_report' || option.row.id === requestedSchedule?.id)
      .map((option) => option.row);
    const defaultSchedule = requestedSchedule
      ? defaultSiteRows.find((row) => row.roundNo === requestedSchedule.roundNo) ?? requestedSchedule
      : findPreferredWorkerDialogOption(
          buildWorkerDialogRoundOptions({
            contractWindowEnd: defaultContractWindow.windowEnd,
            contractWindowStart: defaultContractWindow.windowStart,
            reportItemsByRound: reportItemsByRoundBySiteId.get(defaultSiteId) ?? new Map(),
            siteId: defaultSiteId,
            siteName: defaultSiteOption?.label || '',
            rows,
            totalRounds: defaultSiteOption?.totalRounds ?? 0,
          }).filter((option) => option.state !== 'linked_report'),
          { plannedDate: nextPlannedDate },
        );

    setSelectedDate(nextPlannedDate);
    setDialog({
      open: true,
      plannedDate: nextPlannedDate,
      scheduleId: defaultSchedule?.id || '',
      selectionReasonLabel: defaultSchedule?.selectionReasonLabel || '',
      selectionReasonMemo: defaultSchedule?.selectionReasonMemo || '',
      siteId: defaultSchedule?.siteId || defaultSiteId,
    });
  };

  const handleDialogSiteSelect = (siteId: string) => {
    const selectedSiteOption =
      dialogSiteOptions.find((option) => option.siteId === siteId) ?? null;
    const contractWindow = contractWindowsBySiteId[siteId] ?? { windowEnd: '', windowStart: '' };
    const preferredRow = findPreferredWorkerDialogOption(
      buildWorkerDialogRoundOptions({
        contractWindowEnd: contractWindow.windowEnd,
        contractWindowStart: contractWindow.windowStart,
        reportItemsByRound: reportItemsByRoundBySiteId.get(siteId) ?? new Map(),
        siteId,
        siteName: selectedSiteOption?.label || '',
        rows,
        totalRounds: selectedSiteOption?.totalRounds ?? 0,
      }).filter((option) => option.state !== 'linked_report'),
      {
      plannedDate: dialog.plannedDate,
      scheduleId: dialog.scheduleId,
      },
    );
    setDialog((current) => ({
      ...current,
      scheduleId: preferredRow?.id || '',
      selectionReasonLabel: preferredRow?.selectionReasonLabel || '',
      selectionReasonMemo: preferredRow?.selectionReasonMemo || '',
      siteId,
    }));
  };

  const handleDialogScheduleSelect = (schedule: SafetyInspectionSchedule) => {
    setDialog((current) => ({
      ...current,
      scheduleId: schedule.id,
      selectionReasonLabel: schedule.selectionReasonLabel || '',
      selectionReasonMemo: schedule.selectionReasonMemo || '',
      siteId: schedule.siteId,
    }));
  };

  const ensureDraftSessionForSchedule = async (schedule: SafetyInspectionSchedule) => {
    const selectedReport = reportItemsByRoundBySiteId.get(schedule.siteId)?.get(schedule.roundNo) ?? null;
    if (selectedReport) {
      return {
        actualVisitDate: schedule.actualVisitDate || normalizeText(selectedReport.visitDate),
        linkedReportKey: normalizeText(selectedReport.reportKey),
      };
    }

    const site = sites.find((item) => item.id === schedule.siteId);
    if (!site) return null;

    const existingSession = getSessionsBySiteId(site.id).find(
      (session) => session.reportNumber === schedule.roundNo,
    );
    if (existingSession) {
      return null;
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
    createSession(site, {
      document4FollowUps,
      meta: {
        drafter: currentUser?.name || site.assigneeName,
        reportDate,
        reportTitle: buildDefaultReportTitle(reportDate, schedule.roundNo),
        siteName: site.siteName,
      },
      reportNumber: schedule.roundNo,
      technicalGuidanceRelations,
    });
    return null;
  };

  const resolvePersistedScheduleForSave = async (schedule: SafetyInspectionSchedule) => {
    if (!isSyntheticWorkerScheduleId(schedule.id) && rows.some((row) => row.id === schedule.id)) {
      return schedule;
    }

    const response = await fetchMySchedules({
      limit: 300,
      month,
      siteId: schedule.siteId,
    });
    const persisted = response.rows.find(
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

    return persisted ?? null;
  };

  const handleSaveSchedule = async () => {
    if (!dialog.scheduleId) {
      setError('회차를 먼저 선택해 주세요.');
      return;
    }
    const schedule = dialogRoundRows.find((row) => row.id === dialog.scheduleId) ?? null;
    if (!schedule) {
      setError('선택한 회차를 찾지 못했습니다.');
      return;
    }
    if (!dialog.plannedDate) {
      setError('방문 날짜를 먼저 선택해 주세요.');
      return;
    }
    const selectionReasonLabel = dialog.selectionReasonLabel.trim();
    const selectionReasonMemo = dialog.selectionReasonMemo.trim();
    const linkedReport = dialogSelectedOption?.linkedReport ?? null;
    const linkedReportKey = normalizeText(linkedReport?.reportKey);
    const actualVisitDate = normalizeText(linkedReport?.visitDate);

    try {
      setError(null);
      const persistedSchedule = await resolvePersistedScheduleForSave(schedule);
      if (!persistedSchedule) {
        setError('서버가 이 회차 일정 row를 아직 준비하지 못했습니다. 잠시 후 다시 열어 주세요.');
        return;
      }
      const saved = await updateMySchedule(persistedSchedule.id, {
        actualVisitDate,
        linkedReportKey,
        plannedDate: dialog.plannedDate,
        selectionReasonLabel,
        selectionReasonMemo,
      });
      const updated: SafetyInspectionSchedule = {
        ...saved,
        actualVisitDate: saved.actualVisitDate || actualVisitDate,
        linkedReportKey: saved.linkedReportKey || linkedReportKey,
        windowEnd: saved.windowEnd || persistedSchedule.windowEnd || schedule.windowEnd,
        windowStart: saved.windowStart || persistedSchedule.windowStart || schedule.windowStart,
      };
      setRows((current) => {
        const nextRows = current.filter(
          (row) =>
            row.id !== updated.id &&
            !(row.siteId === updated.siteId && row.roundNo === updated.roundNo),
        );
        return [...nextRows, updated];
      });
      const reportLinkUpdate = await ensureDraftSessionForSchedule(updated);
      const finalized = reportLinkUpdate
        ? {
            ...updated,
            actualVisitDate: updated.actualVisitDate || reportLinkUpdate.actualVisitDate,
            linkedReportKey: updated.linkedReportKey || reportLinkUpdate.linkedReportKey,
          }
        : updated;
      if (finalized !== updated) {
        setRows((current) =>
          current.map((row) => (row.id === finalized.id ? finalized : row)),
        );
      }
      setSelectedDate(updated.plannedDate || dialog.plannedDate);
      setNotice(
        selectionReasonLabel || selectionReasonMemo
          ? `${schedule.siteName} ${schedule.roundNo}회차 방문 일정과 사유를 저장했습니다.`
          : `${schedule.siteName} ${schedule.roundNo}회차 방문 일정을 저장했습니다.`,
      );
      closeDialog();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '일정을 저장하지 못했습니다.');
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
        description="로그인하면 배정된 현장의 회차별 방문 일정을 선택할 수 있습니다."
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
                      <h2 className={styles.sectionTitle}>회차별 일정 선택</h2>
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
                        onClick={() => setMonth((current) => shiftMonthToken(current, -1))}
                      >
                        이전 달
                      </button>
                      <button
                        type="button"
                        className="app-button app-button-secondary"
                        onClick={() => setMonth(getMonthToken())}
                      >
                        이번 달
                      </button>
                      <button
                        type="button"
                        className="app-button app-button-secondary"
                        onClick={() => setMonth((current) => shiftMonthToken(current, 1))}
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
                        onChange={(event) => setMonth(event.target.value || getMonthToken())}
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

                  {loading ? <div className={styles.emptyState}>일정을 불러오는 중입니다.</div> : null}

                  {viewMode === 'calendar' ? (
                    <div className={styles.layout}>
                      <div className={styles.list}>
                        <section className={styles.calendarPanel}>
                          <div className={styles.calendarPanelHeader}>
                            <h3 className={styles.sectionTitle}>월간 캘린더</h3>
                            <div className={styles.sectionMeta}>
                              날짜를 누르면 해당 날짜 기준으로 회차를 지정하거나 수정할 수 있습니다.
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
                                <button
                                  key={day.token}
                                  type="button"
                                  className={`${styles.calendarCell} ${isActive ? styles.calendarCellActive : ''}`}
                                  onClick={() => openScheduleDialog({ plannedDate: day.token })}
                                >
                                  <div className={styles.calendarDay}>{day.day}</div>
                                  <div className={styles.calendarEvents}>
                                    {dayRows.slice(0, 3).map((row) => (
                                      <span key={row.id} className={styles.calendarEvent}>
                                        {row.siteName} {row.roundNo}회차
                                      </span>
                                    ))}
                                    {dayRows.length > 3 ? (
                                      <span className={styles.calendarEvent}>+ {dayRows.length - 3}건</span>
                                    ) : null}
                                  </div>
                                </button>
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
        title="방문 일정 선택"
        onClose={closeDialog}
        actions={
          <>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={closeDialog}
            >
              닫기
            </button>
            <button
              type="button"
              className="app-button app-button-primary"
              onClick={() => void handleSaveSchedule()}
              disabled={!dialog.scheduleId || !dialog.plannedDate}
            >
              방문 일정 저장
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
            <label className={styles.field}>
              <span className={styles.fieldLabel}>회차</span>
              <select
                className="app-select"
                name="worker-round-select"
                value={dialog.scheduleId}
                onChange={(event) => {
                  const nextSchedule = dialogRoundRows.find((row) => row.id === event.target.value) ?? null;
                  if (nextSchedule) {
                    handleDialogScheduleSelect(nextSchedule);
                  }
                }}
                disabled={!dialog.siteId || dialogSelectedReportIndexState?.status === 'loading' || dialogRoundRows.length === 0}
              >
                {!dialog.siteId ? <option value="">먼저 현장을 선택해 주세요.</option> : null}
                {dialog.siteId && dialogSelectedReportIndexState?.status === 'loading' ? (
                  <option value="">회차를 불러오는 중입니다.</option>
                ) : null}
                {dialog.siteId && dialogSelectedReportIndexState?.status !== 'loading' && dialogRoundRows.length === 0 ? (
                  <option value="">선택 가능한 회차가 없습니다.</option>
                ) : null}
                {dialogRoundRows.map((row) => (
                  <option key={row.id} value={row.id}>
                    {formatWorkerRoundLabel(row)}
                  </option>
                ))}
              </select>
            </label>
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
                계약 기간: {dialogSelectedSchedule.windowStart} ~ {dialogSelectedSchedule.windowEnd}
              </div>
              {dialogSelectedOption?.state === 'needs_schedule_link' ? (
                <div className={styles.dialogHint}>기존 보고서가 있어 이 회차 일정에 연결됩니다.</div>
              ) : null}
            </>
          ) : null}
        </div>
      </AppModal>
    </main>
  );
}

export default WorkerCalendarScreen;
