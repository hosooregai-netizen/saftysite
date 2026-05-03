'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AppModal from '@/components/ui/AppModal';
import LoginPanel from '@/components/auth/LoginPanel';
import { getSessionGuidanceDate } from '@/constants/inspectionSession';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { buildDefaultReportTitle } from '@/features/site-reports/report-list/reportListHelpers';
import {
  applyScheduleReportUpdateToSession,
  buildContractWindowFromScheduleRows,
  buildContractWindowFromSafetySite,
  buildScheduleReportSyncPlan,
  resolveContractWindow,
} from '@/features/schedule-report-sync/scheduleReportSync';
import {
  buildWorkerCalendarRowsWithReportDates,
  findDuplicateUnlinkedScheduleReservations,
} from '@/features/calendar/components/workerCalendarReportMatching';
import { fetchMySchedules, reserveNextMySchedule, updateMySchedule } from '@/lib/calendar/apiClient';
import { mapInspectionSessionToReportListItem } from '@/lib/safetyApiMappers';
import type { SafetyInspectionSchedule } from '@/types/admin';
import type { InspectionReportListItem } from '@/types/inspectionSession';
import { MobileShell } from './MobileShell';
import { MobileTabBar } from './MobileTabBar';
import { buildMobileRootTabs } from '../site-list/mobileSiteListTabs';
import mobileStyles from './MobileShell.module.css';
import workerStyles from '@/features/calendar/components/WorkerCalendarScreen.module.css';

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
  isComplete: boolean;
  label: string;
  remainingRounds: number;
  siteId: string;
  totalRounds: number;
}

const DEFAULT_SITE_TOTAL_ROUNDS = 8;

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

  return { days, leadingEmptyCount };
}

function sortSchedules(rows: SafetyInspectionSchedule[]) {
  return [...rows].sort(
    (left, right) =>
      left.roundNo - right.roundNo ||
      left.siteName.localeCompare(right.siteName, 'ko') ||
      left.windowStart.localeCompare(right.windowStart),
  );
}

function normalizeText(value: string | null | undefined) {
  return typeof value === 'string' ? value.trim() : '';
}

function getNormalizedTotalRounds(value: number | null | undefined) {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.trunc(value);
  }
  return DEFAULT_SITE_TOTAL_ROUNDS;
}

function formatWorkerRoundLabel(row: SafetyInspectionSchedule) {
  return `${row.roundNo} / ${getNormalizedTotalRounds(row.totalRounds)}회차`;
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

export function MobileWorkerCalendarScreen() {
  const [month, setMonth] = useState(getMonthToken());
  const [rows, setRows] = useState<SafetyInspectionSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [dialog, setDialog] = useState<ScheduleDialogState>(EMPTY_DIALOG_STATE);
  const duplicateCleanupKeysRef = useRef(new Set<string>());
  const [contractWindowsBySiteId, setContractWindowsBySiteId] = useState<
    Record<string, { windowEnd: string; windowStart: string }>
  >({});
  const {
    authError,
    createSession,
    currentUser,
    ensureAssignedSafetySite,
    getSessionById,
    getSessionsBySiteId,
    isAuthenticated,
    isReady,
    login,
    logout,
    saveNow,
    sites,
    updateSession,
  } = useInspectionSessions();

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    void (async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchMySchedules({ month });
        if (!cancelled) {
          setRows(response.rows);
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : '일정을 불러오지 못했습니다.');
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
  }, [isAuthenticated, month]);

  const reportItemsBySiteId = useMemo(() => {
    const nextMap = new Map<string, InspectionReportListItem[]>();
    sites.forEach((site) => {
      nextMap.set(
        site.id,
        getSessionsBySiteId(site.id).map((session) =>
          mapInspectionSessionToReportListItem(session, site),
        ),
      );
    });
    return nextMap;
  }, [getSessionsBySiteId, sites]);
  const calendarRows = useMemo(
    () =>
      buildWorkerCalendarRowsWithReportDates({
        contractWindowsBySiteId,
        reportsBySiteId: reportItemsBySiteId,
        rows,
        sites,
      }),
    [contractWindowsBySiteId, reportItemsBySiteId, rows, sites],
  );
  const cleanupCandidateRows = useMemo(
    () =>
      buildWorkerCalendarRowsWithReportDates({
        contractWindowsBySiteId,
        includeDuplicateReservations: true,
        reportsBySiteId: reportItemsBySiteId,
        rows,
        sites,
      }),
    [contractWindowsBySiteId, reportItemsBySiteId, rows, sites],
  );
  const calendar = useMemo(() => buildCalendarDays(month), [month]);
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
  const selectedDateRows = useMemo(
    () => sortSchedules(rowsByDate.get(selectedDate) ?? []),
    [rowsByDate, selectedDate],
  );
  const completedRoundsBySiteId = useMemo(() => {
    const nextMap = new Map<string, Set<number>>();
    calendarRows.forEach((row) => {
      if (!row.siteId) return;
      if (!nextMap.has(row.siteId)) {
        nextMap.set(row.siteId, new Set<number>());
      }
      const completedRounds = nextMap.get(row.siteId);
      if (!completedRounds) return;
      const isCompleted =
        row.status === 'completed' ||
        (typeof row.linkedReportKey === 'string' && row.linkedReportKey.trim().length > 0);
      if (isCompleted && row.roundNo > 0) {
        completedRounds.add(row.roundNo);
      }
    });
    return nextMap;
  }, [calendarRows]);
  const dialogSiteOptions = useMemo<WorkerDialogSiteOption[]>(() => {
    return [...sites]
      .sort((left, right) => left.siteName.localeCompare(right.siteName, 'ko'))
      .map((site) => {
        const totalRounds = getNormalizedTotalRounds(site.totalRounds);
        const completedRounds = completedRoundsBySiteId.get(site.id)?.size ?? 0;
        const remainingRounds = Math.max(totalRounds - completedRounds, 0);
        return {
          completedRounds,
          isComplete: completedRounds >= totalRounds,
          label: site.siteName,
          remainingRounds,
          siteId: site.id,
          totalRounds,
        };
      });
  }, [completedRoundsBySiteId, sites]);
  const dialogAllRoundRows = useMemo(
    () => sortSchedules(calendarRows.filter((row) => row.siteId === dialog.siteId)),
    [calendarRows, dialog.siteId],
  );
  const dialogRoundRows = useMemo(() => {
    const completedRounds = completedRoundsBySiteId.get(dialog.siteId) ?? new Set<number>();
    return dialogAllRoundRows.filter((row) => {
      if (row.status === 'canceled' || row.status === 'completed') {
        return false;
      }
      if (row.id === dialog.scheduleId) {
        return true;
      }
      return !completedRounds.has(row.roundNo);
    });
  }, [completedRoundsBySiteId, dialog.scheduleId, dialog.siteId, dialogAllRoundRows]);
  const dialogSelectedSchedule = useMemo(
    () =>
      rows.find((row) => row.id === dialog.scheduleId) ??
      calendarRows.find((row) => row.id === dialog.scheduleId) ??
      null,
    [calendarRows, dialog.scheduleId, rows],
  );
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
        ? buildWindowErrorMessage({ siteName: dialogSiteName, windowEnd: '', windowStart: '' })
        : !isDateWithinWindow(dialog.plannedDate, dialogContractWindow.windowStart, dialogContractWindow.windowEnd)
          ? buildWindowErrorMessage({
              siteName: dialogSiteName,
              windowEnd: dialogContractWindow.windowEnd,
              windowStart: dialogContractWindow.windowStart,
            })
          : ''
      : '';

  useEffect(() => {
    if (!selectedDate && calendar.days.length > 0) {
      setSelectedDate(calendar.days[0].token);
    }
  }, [calendar.days, selectedDate]);

  useEffect(() => {
    if (!dialog.open || dialog.siteId || dialogSiteOptions.length === 0) return;
    const defaultSite = dialogSiteOptions.find((option) => !option.isComplete) ?? dialogSiteOptions[0];
    setDialog((current) => ({ ...current, siteId: defaultSite.siteId }));
  }, [dialog.open, dialog.siteId, dialogSiteOptions]);

  useEffect(() => {
    const currentWindow = dialog.siteId ? contractWindowsBySiteId[dialog.siteId] : null;
    if (
      !dialog.open ||
      !dialog.siteId ||
      (currentWindow?.windowStart && currentWindow.windowEnd)
    ) {
      return;
    }
    let cancelled = false;
    void ensureAssignedSafetySite(dialog.siteId)
      .then((safetySite) => {
        if (cancelled) return;
        setContractWindowsBySiteId((current) => ({
          ...current,
          [dialog.siteId]: buildContractWindowFromSafetySite(safetySite),
        }));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [contractWindowsBySiteId, dialog.open, dialog.siteId, ensureAssignedSafetySite]);

  useEffect(() => {
    if (!dialog.open || !dialog.siteId) return;
    const preferredRow =
      dialogRoundRows.find((row) => row.id === dialog.scheduleId) ??
      dialogRoundRows.find((row) => row.plannedDate === dialog.plannedDate) ??
      dialogRoundRows.find((row) => !row.plannedDate) ??
      dialogRoundRows[0] ??
      null;
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
    if (
      preferredRow.id === dialog.scheduleId &&
      dialog.selectionReasonLabel === (preferredRow.selectionReasonLabel || '') &&
      dialog.selectionReasonMemo === (preferredRow.selectionReasonMemo || '')
    ) {
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
    dialog.selectionReasonLabel,
    dialog.selectionReasonMemo,
    dialog.siteId,
    dialogRoundRows,
  ]);

  const openScheduleDialog = (input: {
    plannedDate: string;
    schedule?: SafetyInspectionSchedule | null;
  }) => {
    const requestedSchedule = input.schedule ?? null;
    const defaultSite =
      (requestedSchedule
        ? dialogSiteOptions.find((option) => option.siteId === requestedSchedule.siteId)
        : null) ??
      dialogSiteOptions.find((option) => !option.isComplete) ??
      dialogSiteOptions[0];
    const defaultSiteId = defaultSite?.siteId || '';
    const completedRounds = completedRoundsBySiteId.get(defaultSiteId) ?? new Set<number>();
    const defaultSiteRows = sortSchedules(calendarRows.filter((row) => row.siteId === defaultSiteId)).filter((row) => {
      if (row.status === 'canceled' || row.status === 'completed') {
        return false;
      }
      if (row.id === requestedSchedule?.id) {
        return true;
      }
      return !completedRounds.has(row.roundNo);
    });
    const defaultSchedule =
      requestedSchedule ??
      defaultSiteRows.find((row) => row.plannedDate === input.plannedDate) ??
      defaultSiteRows.find((row) => !row.plannedDate) ??
      defaultSiteRows[0] ??
      null;

    setSelectedDate(input.plannedDate);
    setDialog({
      open: true,
      plannedDate: input.plannedDate,
      scheduleId: defaultSchedule?.id || '',
      selectionReasonLabel: defaultSchedule?.selectionReasonLabel || '',
      selectionReasonMemo: defaultSchedule?.selectionReasonMemo || '',
      siteId: defaultSchedule?.siteId || defaultSiteId,
    });
  };

  const handleDialogSiteSelect = (siteId: string) => {
    const completedRounds = completedRoundsBySiteId.get(siteId) ?? new Set<number>();
    const nextRoundRows = sortSchedules(calendarRows.filter((row) => row.siteId === siteId)).filter((row) => {
      if (row.status === 'canceled' || row.status === 'completed') {
        return false;
      }
      return !completedRounds.has(row.roundNo);
    });
    const preferredRow =
      nextRoundRows.find((row) => row.id === dialog.scheduleId) ??
      nextRoundRows.find((row) => row.plannedDate === dialog.plannedDate) ??
      nextRoundRows.find((row) => !row.plannedDate) ??
      nextRoundRows[0] ??
      null;
    setDialog((current) => ({
      ...current,
      scheduleId: preferredRow?.id || '',
      selectionReasonLabel: preferredRow?.selectionReasonLabel || '',
      selectionReasonMemo: preferredRow?.selectionReasonMemo || '',
      siteId,
    }));
  };

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
    if (!isAuthenticated || loading) return;
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
  }, [cleanupCandidateRows, isAuthenticated, loading, rows, upsertScheduleRows]);

  const persistScheduleReportSync = async (changedSchedule: SafetyInspectionSchedule) => {
    const scheduleResponse = await fetchMySchedules({
      limit: 300,
      siteId: changedSchedule.siteId,
    });
    const site = sites.find((item) => item.id === changedSchedule.siteId) ?? null;
    const reports =
      site == null
        ? []
        : getSessionsBySiteId(changedSchedule.siteId).map((session) =>
            mapInspectionSessionToReportListItem(session, site),
          );
    const siteSchedules = [
      ...scheduleResponse.rows.filter((row) => row.id !== changedSchedule.id),
      changedSchedule,
    ];
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
      reports,
      schedules: siteSchedules,
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
      if (!getSessionById(update.reportKey)) continue;
      updateSession(update.reportKey, (current) =>
        applyScheduleReportUpdateToSession(current, update),
      );
    }
    if (plan.reportUpdates.length > 0) {
      await saveNow();
    }

    return savedSchedules.find((schedule) => schedule.id === changedSchedule.id) ?? changedSchedule;
  };

  const ensureDraftSessionForSchedule = (schedule: SafetyInspectionSchedule) => {
    const existingLinkedReportKey = normalizeText(schedule.linkedReportKey);
    if (existingLinkedReportKey) {
      return {
        actualVisitDate: normalizeText(schedule.actualVisitDate) || schedule.plannedDate,
        linkedReportKey: existingLinkedReportKey,
      };
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
        actualVisitDate: getSessionGuidanceDate(existingSession) || schedule.plannedDate,
        linkedReportKey: existingSession.id,
      };
    }

    const reportDate = schedule.plannedDate || dialog.plannedDate || new Date().toISOString().slice(0, 10);
    const createdSession = createSession(site, {
      meta: {
        drafter: currentUser?.name || site.assigneeName,
        reportDate,
        reportTitle: buildDefaultReportTitle(reportDate, schedule.roundNo),
        siteName: site.siteName,
      },
      reportNumber: schedule.roundNo,
      scheduleId: schedule.id,
      scheduleRoundNo: schedule.roundNo,
    });

    return {
      actualVisitDate: reportDate,
      linkedReportKey: createdSession.id,
    };
  };

  const handleSaveSchedule = async () => {
    if (!dialog.siteId) {
      setError('현장을 먼저 선택해 주세요.');
      return;
    }
    const schedule =
      rows.find((row) => row.id === dialog.scheduleId) ??
      calendarRows.find((row) => row.id === dialog.scheduleId) ??
      null;
    if (!dialog.plannedDate) {
      setError('방문 날짜를 먼저 선택해 주세요.');
      return;
    }
    if (dialogWindowError) {
      setError(dialogWindowError);
      return;
    }
    try {
      setError(null);
      const updated = schedule?.plannedDate
        ? await updateMySchedule(schedule.id, {
            plannedDate: dialog.plannedDate,
            selectionReasonLabel: dialog.selectionReasonLabel.trim(),
            selectionReasonMemo: dialog.selectionReasonMemo.trim(),
          })
        : await reserveNextMySchedule({
            plannedDate: dialog.plannedDate,
            selectionReasonLabel: dialog.selectionReasonLabel.trim(),
            selectionReasonMemo: dialog.selectionReasonMemo.trim(),
            siteId: schedule?.siteId || dialog.siteId,
          });
      const linkUpdate = ensureDraftSessionForSchedule(updated);
      const linkPlannedDate = normalizeText(linkUpdate?.actualVisitDate) || updated.plannedDate || dialog.plannedDate;
      const shouldPersistLink =
        Boolean(linkUpdate?.linkedReportKey) &&
        (normalizeText(linkUpdate?.linkedReportKey) !== normalizeText(updated.linkedReportKey) ||
          normalizeText(linkUpdate?.actualVisitDate) !== normalizeText(updated.actualVisitDate) ||
          linkPlannedDate !== normalizeText(updated.plannedDate));
      const finalized =
        linkUpdate && shouldPersistLink
          ? await updateMySchedule(updated.id, {
              actualVisitDate: linkUpdate.actualVisitDate,
              linkedReportKey: linkUpdate.linkedReportKey,
              plannedDate: linkPlannedDate,
              selectionReasonLabel: dialog.selectionReasonLabel.trim(),
              selectionReasonMemo: dialog.selectionReasonMemo.trim(),
            })
          : updated;
      setRows((current) => {
        const nextRows = current.filter(
          (row) => row.id !== finalized.id && !(row.siteId === finalized.siteId && row.roundNo === finalized.roundNo),
        );
        return [...nextRows, finalized];
      });
      const synced = await persistScheduleReportSync(finalized);
      setSelectedDate(synced.plannedDate || finalized.plannedDate || dialog.plannedDate);
      setNotice(
        linkUpdate
          ? `${finalized.siteName} ${finalized.roundNo}회차 방문 일정과 기술지도 보고서를 연결했습니다.`
          : `${finalized.siteName} ${finalized.roundNo}회차 방문 일정을 저장했습니다.`,
      );
      setDialog(EMPTY_DIALOG_STATE);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '일정을 저장하지 못했습니다.');
    }
  };

  if (!isReady) {
    return (
      <MobileShell
        currentUserName={currentUser?.name}
        onLogout={logout}
        title="일정"
        webHref="/calendar"
        tabBar={<MobileTabBar tabs={buildMobileRootTabs('calendar')} />}
      >
        <section className={mobileStyles.stateCard}>
          <div className={mobileStyles.sectionTitleWrap}>
            <h2 className={mobileStyles.sectionTitle}>일정을 준비하는 중입니다.</h2>
          </div>
        </section>
      </MobileShell>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginPanel
        error={authError}
        onSubmit={login}
        title="모바일 일정 로그인"
        description="로그인하면 배정된 현장의 다음 방문 일정을 모바일에서 바로 등록할 수 있습니다."
      />
    );
  }

  return (
    <MobileShell
      currentUserName={currentUser?.name}
      onLogout={logout}
      title="일정"
      webHref="/calendar"
      tabBar={<MobileTabBar tabs={buildMobileRootTabs('calendar')} />}
    >
      <section className={workerStyles.sectionCard}>
        <div className={workerStyles.sectionHeader}>
          <div>
            <h2 className={workerStyles.sectionTitle}>월간 캘린더</h2>
            <div className={workerStyles.sectionMeta}>
              날짜를 누르면 배정 현장의 다음 진행 회차가 자동 배정됩니다.
            </div>
          </div>
        </div>

        {error ? <div className={workerStyles.emptyState}>{error}</div> : null}
        {notice ? <div className={workerStyles.noticeBox}>{notice}</div> : null}

        <div className={workerStyles.toolbar}>
          <div className={workerStyles.monthNav}>
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
          <label className={workerStyles.field}>
            <span className={workerStyles.fieldLabel}>표시 월</span>
            <input
              className="app-input"
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value || getMonthToken())}
            />
          </label>
        </div>

        {loading ? (
          <div className={workerStyles.emptyState}>일정 데이터를 불러오는 중입니다.</div>
        ) : (
          <>
            <div className={workerStyles.calendarGrid}>
              {['월', '화', '수', '목', '금', '토', '일'].map((weekday) => (
                <div key={weekday} className={workerStyles.weekday}>
                  {weekday}
                </div>
              ))}
              {Array.from({ length: calendar.leadingEmptyCount }).map((_, index) => (
                <div key={`empty-${index + 1}`} className={workerStyles.calendarCellEmpty} />
              ))}
              {calendar.days.map((day) => {
                const dayRows = rowsByDate.get(day.token) ?? [];
                return (
                  <button
                    key={day.token}
                    type="button"
                    className={`${workerStyles.calendarCell} ${selectedDate === day.token ? workerStyles.calendarCellActive : ''}`}
                    onClick={() => openScheduleDialog({ plannedDate: day.token })}
                    style={{ textAlign: 'left' }}
                  >
                    <div className={workerStyles.calendarDay}>{day.day}</div>
                    <div className={workerStyles.calendarEvents}>
                      {dayRows.slice(0, 2).map((row) => (
                        <div key={row.id} className={workerStyles.calendarEvent}>
                          {row.siteName} {row.roundNo}회차
                        </div>
                      ))}
                      {dayRows.length > 2 ? (
                        <div className={workerStyles.calendarEvent}>+{dayRows.length - 2}건</div>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: '1rem' }}>
              <div className={workerStyles.sectionHeader}>
                <div>
                  <h2 className={workerStyles.sectionTitle}>
                    {selectedDate ? `${selectedDate} 일정` : '선택 날짜 일정'}
                  </h2>
                  <div className={workerStyles.sectionMeta}>선택한 날짜의 저장된 일정을 확인합니다.</div>
                </div>
              </div>
              {selectedDateRows.length === 0 ? (
                <div className={workerStyles.emptyState}>표시할 일정이 없습니다.</div>
              ) : (
                <div className={workerStyles.list}>
                  {selectedDateRows.map((row) => (
                    <button
                      key={row.id}
                      type="button"
                      className={`${workerStyles.rowCard} ${workerStyles.rowCardButton}`}
                      onClick={() =>
                        openScheduleDialog({
                          plannedDate: row.plannedDate || selectedDate,
                          schedule: row,
                        })
                      }
                    >
                      <div className={workerStyles.rowTitle}>{row.siteName}</div>
                      <div className={workerStyles.rowMeta}>
                        {formatWorkerRoundLabel(row)} · {row.plannedDate || '미선택'}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </section>

      <AppModal
        open={dialog.open}
        title="방문 일정 등록"
        onClose={() => setDialog(EMPTY_DIALOG_STATE)}
        actions={
          <>
            <button type="button" className="app-button app-button-secondary" onClick={() => setDialog(EMPTY_DIALOG_STATE)}>
              닫기
            </button>
            <button
              type="button"
              className="app-button app-button-primary"
              onClick={() => void handleSaveSchedule()}
              disabled={!dialog.siteId || !dialog.plannedDate || Boolean(dialogWindowError)}
            >
              방문 일정 저장
            </button>
          </>
        }
      >
        <div className={workerStyles.dialogStack}>
          <label className={workerStyles.field}>
            <span className={workerStyles.fieldLabel}>방문 날짜</span>
            <input
              className="app-input"
              type="date"
              value={dialog.plannedDate}
              onChange={(event) =>
                setDialog((current) => ({ ...current, plannedDate: event.target.value }))
              }
            />
          </label>

          <section className={workerStyles.dialogSection}>
            <div className={workerStyles.dialogSectionHeader}>
              <strong>배정된 현장</strong>
            </div>
            {dialogSiteOptions.length === 0 ? (
              <div className={workerStyles.emptyState}>배정된 현장이 없습니다.</div>
            ) : (
              <div className={workerStyles.dialogList}>
                {dialogSiteOptions.map((option) => (
                  <label
                    key={option.siteId}
                    className={`${workerStyles.dialogOption} ${dialog.siteId === option.siteId ? workerStyles.dialogOptionActive : ''}`}
                  >
                    <input
                      type="radio"
                      name="mobile-worker-site"
                      checked={dialog.siteId === option.siteId}
                      onChange={() => handleDialogSiteSelect(option.siteId)}
                    />
                    <div>
                      <strong>{option.label}</strong>
                      <div className={workerStyles.rowMeta}>
                        완료 {option.completedRounds}회차 · 남은 회차 {option.remainingRounds}건
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </section>

          <section className={workerStyles.dialogSection}>
            <div className={workerStyles.dialogSectionHeader}>
              <strong>자동 배정 회차</strong>
            </div>
            <div className={workerStyles.dialogHint}>
              {dialogSelectedSchedule
                ? formatWorkerRoundLabel(dialogSelectedSchedule)
                : '저장 시 다음 진행 회차가 자동 배정됩니다.'}
            </div>
          </section>

          <label className={workerStyles.field}>
            <span className={workerStyles.fieldLabel}>사유 분류</span>
            <input
              className="app-input"
              value={dialog.selectionReasonLabel}
              placeholder="예: 현장 요청, 장비 반입 대기"
              onChange={(event) =>
                setDialog((current) => ({
                  ...current,
                  selectionReasonLabel: event.target.value,
                }))
              }
            />
          </label>
          <label className={workerStyles.field}>
            <span className={workerStyles.fieldLabel}>상세 메모</span>
            <textarea
              className="app-input"
              rows={4}
              value={dialog.selectionReasonMemo}
              placeholder="방문 일정을 이 날짜로 선택한 배경을 적어 주세요."
              onChange={(event) =>
                setDialog((current) => ({
                  ...current,
                  selectionReasonMemo: event.target.value,
                }))
              }
            />
          </label>

          {dialog.siteId ? (
            <div className={workerStyles.dialogHint}>
              계약 기간: {dialogContractWindow?.windowStart || '-'} ~ {dialogContractWindow?.windowEnd || '-'}
            </div>
          ) : null}

          {dialogWindowError ? (
            <div className={workerStyles.emptyState}>{dialogWindowError}</div>
          ) : null}
        </div>
      </AppModal>
    </MobileShell>
  );
}

export default MobileWorkerCalendarScreen;
