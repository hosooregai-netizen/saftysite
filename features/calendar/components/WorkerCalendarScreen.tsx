'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppModal from '@/components/ui/AppModal';
import LoginPanel from '@/components/auth/LoginPanel';
import WorkerAppHeader from '@/components/worker/WorkerAppHeader';
import WorkerMenuSidebar from '@/components/worker/WorkerMenuSidebar';
import WorkerShellBody from '@/components/worker/WorkerShellBody';
import { WorkerMenuDrawer, WorkerMenuPanel } from '@/components/worker/WorkerMenu';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { isAdminUserRole, getAdminSectionHref } from '@/lib/admin';
import { fetchMySchedules, updateMySchedule } from '@/lib/calendar/apiClient';
import homeStyles from '@/features/home/components/HomeScreen.module.css';
import type { SafetyInspectionSchedule } from '@/types/admin';
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

function isDateWithinWindow(value: string, windowStart: string, windowEnd: string) {
  if (!value || !windowStart || !windowEnd) return false;
  return value >= windowStart && value <= windowEnd;
}

function buildWindowErrorMessage(
  schedule: Pick<SafetyInspectionSchedule, 'roundNo' | 'siteName' | 'windowEnd' | 'windowStart'>,
) {
  return `${schedule.siteName} ${schedule.roundNo}회차는 계약 기간 ${schedule.windowStart} ~ ${schedule.windowEnd} 안에서만 선택할 수 있습니다.`;
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

function getCompletedRoundNumbers(rows: Array<{ visitRound: number | null }>) {
  const completed = new Set<number>();
  rows.forEach((row) => {
    if (typeof row.visitRound === 'number' && Number.isFinite(row.visitRound) && row.visitRound > 0) {
      completed.add(Math.trunc(row.visitRound));
    }
  });
  return completed;
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    authError,
    currentUser,
    ensureSiteReportIndexLoaded,
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
  const dialogSelectedSchedule = useMemo(
    () => rows.find((row) => row.id === dialog.scheduleId) ?? null,
    [dialog.scheduleId, rows],
  );
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
        const remainingRounds = Math.max(totalRounds - completedRounds, 0);
        return {
          completedRounds,
          hasLoadedCompletion,
          isComplete: hasLoadedCompletion && totalRounds > 0 && completedRounds >= totalRounds,
          label: site.siteName,
          remainingRounds,
          siteId: site.id,
          totalRounds,
        };
      });
  }, [getReportIndexBySiteId, reportCompletedRoundsBySiteId, selectedSiteId, sites]);
  const dialogAllRoundRows = useMemo(
    () =>
      sortSchedules(rows.filter((row) => row.siteId === dialog.siteId)).sort(
        (left, right) =>
          left.roundNo - right.roundNo ||
          (left.plannedDate || '').localeCompare(right.plannedDate || '') ||
          left.siteName.localeCompare(right.siteName, 'ko'),
      ),
    [dialog.siteId, rows],
  );
  const dialogRoundRows = useMemo(() => {
    const completedRounds = reportCompletedRoundsBySiteId.get(dialog.siteId) ?? new Set<number>();
    return dialogAllRoundRows.filter((row) => {
      if (row.status === 'canceled' || row.status === 'completed') {
        return false;
      }
      return !completedRounds.has(row.roundNo);
    });
  }, [dialog.siteId, dialogAllRoundRows, reportCompletedRoundsBySiteId]);
  const dialogSelectedSite = useMemo(
    () => dialogSiteOptions.find((option) => option.siteId === dialog.siteId) ?? null,
    [dialog.siteId, dialogSiteOptions],
  );
  const dialogSelectedReportIndexState = dialog.siteId
    ? getReportIndexBySiteId(dialog.siteId)
    : null;
  const dialogWindowError =
    dialogSelectedSchedule &&
    dialog.plannedDate &&
    !isDateWithinWindow(dialog.plannedDate, dialogSelectedSchedule.windowStart, dialogSelectedSchedule.windowEnd)
      ? buildWindowErrorMessage(dialogSelectedSchedule)
      : '';
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

  const closeDialog = () => {
    setDialog(EMPTY_DIALOG_STATE);
  };

  const openScheduleDialog = (input: {
    plannedDate: string;
    schedule?: SafetyInspectionSchedule | null;
  }) => {
    const nextPlannedDate = input.plannedDate;
    const defaultSiteId =
      input.schedule?.siteId ||
      (selectedSiteId && dialogSiteOptions.some((option) => option.siteId === selectedSiteId)
        ? selectedSiteId
        : dialogSiteOptions[0]?.siteId || '');
    const defaultCompletedRounds = reportCompletedRoundsBySiteId.get(defaultSiteId) ?? new Set<number>();
    const defaultSiteRows = sortSchedules(rows.filter((row) => row.siteId === defaultSiteId)).filter((row) => {
      if (row.status === 'canceled' || row.status === 'completed') {
        return false;
      }
      return !defaultCompletedRounds.has(row.roundNo);
    });
    const defaultSchedule =
      input.schedule ??
      defaultSiteRows.find((row) => row.plannedDate === nextPlannedDate) ??
      defaultSiteRows.find((row) => !row.plannedDate) ??
      defaultSiteRows[0] ??
      null;

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
    const completedRounds = reportCompletedRoundsBySiteId.get(siteId) ?? new Set<number>();
    const nextRoundRows = sortSchedules(rows.filter((row) => row.siteId === siteId)).filter((row) => {
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

  const handleDialogScheduleSelect = (schedule: SafetyInspectionSchedule) => {
    setDialog((current) => ({
      ...current,
      scheduleId: schedule.id,
      selectionReasonLabel: schedule.selectionReasonLabel || '',
      selectionReasonMemo: schedule.selectionReasonMemo || '',
      siteId: schedule.siteId,
    }));
  };

  const handleSaveSchedule = async () => {
    if (!dialog.scheduleId) {
      setError('회차를 먼저 선택해 주세요.');
      return;
    }
    const schedule = rows.find((row) => row.id === dialog.scheduleId);
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

    try {
      setError(null);
      const updated = await updateMySchedule(schedule.id, {
        plannedDate: dialog.plannedDate,
        selectionReasonLabel,
        selectionReasonMemo,
      });
      setRows((current) => current.map((row) => (row.id === updated.id ? updated : row)));
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
                        className="app-input"
                        type="month"
                        value={month}
                        onChange={(event) => setMonth(event.target.value || getMonthToken())}
                      />
                    </label>
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>현장</span>
                      <select
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
                        <section className={styles.sectionCard}>
                          <div className={styles.sectionHeader}>
                            <div>
                              <h3 className={styles.sectionTitle}>월간 캘린더</h3>
                              <div className={styles.sectionMeta}>
                                날짜를 누르면 해당 날짜 기준으로 회차를 지정하거나 수정할 수 있습니다.
                              </div>
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
              <div className={styles.dialogSectionHeader}>
                <strong>배정된 현장</strong>
                <span className={styles.sectionMeta}>{dialogSiteOptions.length}곳</span>
              </div>
            {dialogSiteOptions.length === 0 ? (
              <div className={styles.emptyState}>배정된 현장이 없습니다.</div>
            ) : (
              <div className={styles.dialogList}>
                {dialogSiteOptions.map((option) => (
                  <label
                    key={option.siteId}
                    className={`${styles.dialogOption} ${dialog.siteId === option.siteId ? styles.dialogOptionActive : ''}`}
                  >
                    <input
                      type="radio"
                      name="worker-site"
                      checked={dialog.siteId === option.siteId}
                      onChange={() => handleDialogSiteSelect(option.siteId)}
                    />
                    <div className={styles.dialogOptionBody}>
                      <strong>{option.label}</strong>
                      <span className={styles.dialogMeta}>
                        {option.totalRounds > 0
                          ? option.hasLoadedCompletion
                            ? option.isComplete
                              ? `총 ${option.totalRounds}회차 완료`
                              : `완료 ${option.completedRounds}/${option.totalRounds}회차 · 선택 가능 ${option.remainingRounds}회차`
                            : `총 ${option.totalRounds}회차`
                          : '총 계약회차 미설정'}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </section>

          <section className={styles.dialogSection}>
            <div className={styles.dialogSectionHeader}>
              <strong>선택 가능한 회차</strong>
              <span className={styles.sectionMeta}>{dialogRoundRows.length}건</span>
            </div>
            {!dialog.siteId ? (
              <div className={styles.emptyState}>먼저 현장을 선택해 주세요.</div>
            ) : dialogSelectedReportIndexState?.status === 'loading' ? (
              <div className={styles.emptyState}>선택한 현장의 완료 회차를 확인하는 중입니다.</div>
            ) : dialogSelectedSite?.isComplete ? (
              <div className={styles.emptyState}>
                선택한 현장은 총 계약회차를 모두 완료했습니다.
              </div>
            ) : dialogRoundRows.length === 0 ? (
              <div className={styles.emptyState}>선택한 현장에서 아직 고를 수 있는 회차가 없습니다.</div>
            ) : (
              <div className={styles.dialogList}>
                {dialogRoundRows.map((row) => (
                  <label
                    key={row.id}
                    className={`${styles.dialogOption} ${dialog.scheduleId === row.id ? styles.dialogOptionActive : ''}`}
                  >
                    <input
                      type="radio"
                      name="worker-schedule"
                      checked={dialog.scheduleId === row.id}
                      onChange={() => handleDialogScheduleSelect(row)}
                    />
                    <div className={styles.dialogOptionBody}>
                      <strong>{formatWorkerRoundLabel(row)}</strong>
                      <span className={styles.dialogMeta}>
                        {row.siteName}
                      </span>
                      <span className={styles.dialogMeta}>
                        방문일 {row.plannedDate || '미선택'} · 상태 {getStatusLabel(row)} · 계약 기간 {row.windowStart} ~ {row.windowEnd}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            )}
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
            <div className={styles.dialogHint}>
              선택 회차 허용 구간: {dialogSelectedSchedule.windowStart} ~ {dialogSelectedSchedule.windowEnd}
            </div>
          ) : null}
          {dialogWindowError ? <div className={styles.dialogError}>{dialogWindowError}</div> : null}
        </div>
      </AppModal>
    </main>
  );
}

export default WorkerCalendarScreen;
