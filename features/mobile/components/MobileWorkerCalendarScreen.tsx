'use client';

import { useEffect, useMemo, useState } from 'react';
import AppModal from '@/components/ui/AppModal';
import LoginPanel from '@/components/auth/LoginPanel';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { fetchMySchedules, updateMySchedule } from '@/lib/calendar/apiClient';
import type { SafetyInspectionSchedule } from '@/types/admin';
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
  schedule: Pick<SafetyInspectionSchedule, 'roundNo' | 'siteName' | 'windowEnd' | 'windowStart'>,
) {
  return `${schedule.siteName} ${schedule.roundNo}회차는 허용 구간 ${schedule.windowStart} ~ ${schedule.windowEnd} 안에서만 선택할 수 있습니다.`;
}

export function MobileWorkerCalendarScreen() {
  const [month, setMonth] = useState(getMonthToken());
  const [rows, setRows] = useState<SafetyInspectionSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [dialog, setDialog] = useState<ScheduleDialogState>(EMPTY_DIALOG_STATE);
  const {
    authError,
    currentUser,
    isAuthenticated,
    isReady,
    login,
    logout,
    sites,
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

  const calendar = useMemo(() => buildCalendarDays(month), [month]);
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
    rows.forEach((row) => {
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
  }, [rows]);
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
    () => sortSchedules(rows.filter((row) => row.siteId === dialog.siteId)),
    [dialog.siteId, rows],
  );
  const dialogRoundRows = useMemo(() => {
    const completedRounds = completedRoundsBySiteId.get(dialog.siteId) ?? new Set<number>();
    return dialogAllRoundRows.filter((row) => {
      if (row.status === 'canceled' || row.status === 'completed') {
        return false;
      }
      return !completedRounds.has(row.roundNo);
    });
  }, [completedRoundsBySiteId, dialog.siteId, dialogAllRoundRows]);
  const dialogSelectedSchedule = useMemo(
    () => rows.find((row) => row.id === dialog.scheduleId) ?? null,
    [dialog.scheduleId, rows],
  );
  const dialogWindowError =
    dialogSelectedSchedule &&
    dialog.plannedDate &&
    !isDateWithinWindow(dialog.plannedDate, dialogSelectedSchedule.windowStart, dialogSelectedSchedule.windowEnd)
      ? buildWindowErrorMessage(dialogSelectedSchedule)
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

  const openScheduleDialog = (plannedDate: string) => {
    const defaultSite = dialogSiteOptions.find((option) => !option.isComplete) ?? dialogSiteOptions[0];
    const defaultSiteId = defaultSite?.siteId || '';
    const completedRounds = completedRoundsBySiteId.get(defaultSiteId) ?? new Set<number>();
    const defaultSiteRows = sortSchedules(rows.filter((row) => row.siteId === defaultSiteId)).filter((row) => {
      if (row.status === 'canceled' || row.status === 'completed') {
        return false;
      }
      return !completedRounds.has(row.roundNo);
    });
    const defaultSchedule =
      defaultSiteRows.find((row) => row.plannedDate === plannedDate) ??
      defaultSiteRows.find((row) => !row.plannedDate) ??
      defaultSiteRows[0] ??
      null;

    setSelectedDate(plannedDate);
    setDialog({
      open: true,
      plannedDate,
      scheduleId: defaultSchedule?.id || '',
      selectionReasonLabel: defaultSchedule?.selectionReasonLabel || '',
      selectionReasonMemo: defaultSchedule?.selectionReasonMemo || '',
      siteId: defaultSchedule?.siteId || defaultSiteId,
    });
  };

  const handleDialogSiteSelect = (siteId: string) => {
    const completedRounds = completedRoundsBySiteId.get(siteId) ?? new Set<number>();
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
    try {
      setError(null);
      const updated = await updateMySchedule(schedule.id, {
        plannedDate: dialog.plannedDate,
        selectionReasonLabel: dialog.selectionReasonLabel.trim(),
        selectionReasonMemo: dialog.selectionReasonMemo.trim(),
      });
      setRows((current) => current.map((row) => (row.id === updated.id ? updated : row)));
      setSelectedDate(updated.plannedDate || dialog.plannedDate);
      setNotice(`${schedule.siteName} ${schedule.roundNo}회차 방문 일정을 저장했습니다.`);
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
        description="로그인하면 배정된 현장의 회차별 방문 일정을 모바일에서 바로 선택할 수 있습니다."
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
              날짜를 누르면 배정 현장과 회차를 선택해 방문 일정을 바로 저장할 수 있습니다.
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
                    onClick={() => openScheduleDialog(day.token)}
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
                    <article key={row.id} className={workerStyles.rowCard}>
                      <div className={workerStyles.rowTitle}>{row.siteName}</div>
                      <div className={workerStyles.rowMeta}>
                        {formatWorkerRoundLabel(row)} · {row.plannedDate || '미선택'}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </section>

      <AppModal
        open={dialog.open}
        title="방문 일정 선택"
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
              disabled={!dialog.scheduleId || Boolean(dialogWindowError)}
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
              <strong>선택 가능한 회차</strong>
            </div>
            {dialogRoundRows.length === 0 ? (
              <div className={workerStyles.emptyState}>선택 가능한 회차가 없습니다.</div>
            ) : (
              <div className={workerStyles.dialogList}>
                {dialogRoundRows.map((row) => (
                  <label
                    key={row.id}
                    className={`${workerStyles.dialogOption} ${dialog.scheduleId === row.id ? workerStyles.dialogOptionActive : ''}`}
                  >
                    <input
                      type="radio"
                      name="mobile-worker-schedule"
                      checked={dialog.scheduleId === row.id}
                      onChange={() =>
                        setDialog((current) => ({
                          ...current,
                          scheduleId: row.id,
                          selectionReasonLabel: row.selectionReasonLabel || '',
                          selectionReasonMemo: row.selectionReasonMemo || '',
                          siteId: row.siteId,
                        }))
                      }
                    />
                    <div>
                      <strong>{row.siteName}</strong>
                      <div className={workerStyles.rowMeta}>
                        {formatWorkerRoundLabel(row)} · 허용 구간 {row.windowStart} ~ {row.windowEnd}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
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

          {dialogWindowError ? (
            <div className={workerStyles.emptyState}>{dialogWindowError}</div>
          ) : null}
        </div>
      </AppModal>
    </MobileShell>
  );
}

export default MobileWorkerCalendarScreen;
