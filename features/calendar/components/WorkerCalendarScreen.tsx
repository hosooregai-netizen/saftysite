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
}

const EMPTY_DIALOG_STATE: ScheduleDialogState = {
  open: false,
  plannedDate: '',
  scheduleId: '',
  selectionReasonLabel: '',
  selectionReasonMemo: '',
};

function getMonthToken(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
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

function formatDateLabel(value: string) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('ko-KR');
}

function formatDateTimeLabel(value: string) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('ko-KR');
}

function isDateWithinWindow(value: string, windowStart: string, windowEnd: string) {
  if (!value || !windowStart || !windowEnd) return false;
  return value >= windowStart && value <= windowEnd;
}

function buildWindowErrorMessage(
  schedule: Pick<SafetyInspectionSchedule, 'roundNo' | 'siteName' | 'windowEnd' | 'windowStart'>,
) {
  return `${schedule.siteName} ${schedule.roundNo}회차는 ${schedule.windowStart} ~ ${schedule.windowEnd} 안에서만 선택할 수 있습니다.`;
}

function sortSchedules(rows: SafetyInspectionSchedule[]) {
  return [...rows].sort(
    (left, right) =>
      left.roundNo - right.roundNo ||
      left.siteName.localeCompare(right.siteName, 'ko') ||
      left.windowStart.localeCompare(right.windowStart),
  );
}

export function WorkerCalendarScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [month, setMonth] = useState(getMonthToken());
  const [rows, setRows] = useState<SafetyInspectionSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [dialog, setDialog] = useState<ScheduleDialogState>(EMPTY_DIALOG_STATE);
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    authError,
    currentUser,
    isAuthenticated,
    isReady,
    login,
    logout,
    sites,
  } = useInspectionSessions();

  const isAdminView = Boolean(currentUser && isAdminUserRole(currentUser.role));
  const selectedSiteId = searchParams.get('siteId') || '';

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

  const unselectedRows = useMemo(() => sortSchedules(rows.filter((row) => !row.plannedDate)), [rows]);
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
  const visibleSelectedRows = useMemo(
    () => (selectedDate ? selectedRows.filter((row) => row.plannedDate === selectedDate) : selectedRows),
    [selectedDate, selectedRows],
  );
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
  const dialogEligibleRows = useMemo(
    () =>
      sortSchedules(
        rows.filter(
          (row) =>
            (!row.plannedDate || row.id === dialog.scheduleId) &&
            isDateWithinWindow(dialog.plannedDate, row.windowStart, row.windowEnd),
        ),
      ),
    [dialog.plannedDate, dialog.scheduleId, rows],
  );
  const dialogSelectedRows = useMemo(
    () =>
      sortSchedules(
        selectedRows.filter(
          (row) => row.plannedDate === dialog.plannedDate && row.id !== dialog.scheduleId,
        ),
      ),
    [dialog.plannedDate, dialog.scheduleId, selectedRows],
  );
  const dialogWindowError =
    dialogSelectedSchedule &&
    dialog.plannedDate &&
    !isDateWithinWindow(dialog.plannedDate, dialogSelectedSchedule.windowStart, dialogSelectedSchedule.windowEnd)
      ? buildWindowErrorMessage(dialogSelectedSchedule)
      : '';

  useEffect(() => {
    if (!dialog.open || dialog.scheduleId || dialogEligibleRows.length === 0) return;
    setDialog((current) => ({
      ...current,
      scheduleId: dialogEligibleRows[0].id,
    }));
  }, [dialog.open, dialog.scheduleId, dialogEligibleRows]);

  const closeDialog = () => {
    setDialog(EMPTY_DIALOG_STATE);
  };

  const openScheduleDialog = (input: {
    plannedDate: string;
    schedule?: SafetyInspectionSchedule | null;
  }) => {
    const nextPlannedDate = input.plannedDate;
    const defaultSchedule =
      input.schedule ??
      sortSchedules(
        rows.filter(
          (row) =>
            (!row.plannedDate || row.plannedDate === nextPlannedDate) &&
            isDateWithinWindow(nextPlannedDate, row.windowStart, row.windowEnd),
        ),
      )[0] ??
      null;

    setSelectedDate(nextPlannedDate);
    setDialog({
      open: true,
      plannedDate: nextPlannedDate,
      scheduleId: defaultSchedule?.id || '',
      selectionReasonLabel: defaultSchedule?.selectionReasonLabel || '',
      selectionReasonMemo: defaultSchedule?.selectionReasonMemo || '',
    });
  };

  const handleDialogScheduleSelect = (schedule: SafetyInspectionSchedule) => {
    setDialog((current) => ({
      ...current,
      scheduleId: schedule.id,
      selectionReasonLabel: schedule.selectionReasonLabel || '',
      selectionReasonMemo: schedule.selectionReasonMemo || '',
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
    if (!dialog.selectionReasonLabel.trim() || !dialog.selectionReasonMemo.trim()) {
      setError('사유 분류와 상세 메모를 함께 입력해 주세요.');
      return;
    }
    if (!isDateWithinWindow(dialog.plannedDate, schedule.windowStart, schedule.windowEnd)) {
      setError(buildWindowErrorMessage(schedule));
      return;
    }

    try {
      setError(null);
      const updated = await updateMySchedule(schedule.id, {
        plannedDate: dialog.plannedDate,
        selectionReasonLabel: dialog.selectionReasonLabel,
        selectionReasonMemo: dialog.selectionReasonMemo,
      });
      setRows((current) => current.map((row) => (row.id === updated.id ? updated : row)));
      setSelectedDate(updated.plannedDate || dialog.plannedDate);
      setNotice(`${schedule.siteName} ${schedule.roundNo}회차 방문 일정과 사유를 저장했습니다.`);
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
                <section className={styles.summaryBar}>
                  <article className={styles.summaryCard}>
                    <span className={styles.summaryLabel}>미선택 회차</span>
                    <strong className={styles.summaryValue}>{unselectedRows.length}</strong>
                  </article>
                  <article className={styles.summaryCard}>
                    <span className={styles.summaryLabel}>선택 완료 일정</span>
                    <strong className={styles.summaryValue}>{selectedRows.length}</strong>
                  </article>
                  <article className={styles.summaryCard}>
                    <span className={styles.summaryLabel}>배정 현장</span>
                    <strong className={styles.summaryValue}>
                      {selectedSiteId ? 1 : sites.length}
                    </strong>
                  </article>
                </section>

                <section className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h2 className={styles.sectionTitle}>회차별 일정 선택</h2>
                      <div className={styles.sectionMeta}>
                        달력 날짜를 클릭하면 해당 날짜에 선택 가능한 회차와 사유 입력 팝업이 열립니다.
                      </div>
                    </div>
                  </div>
                  {error ? <div className={homeStyles.emptyState}>{error}</div> : null}
                  {notice ? <div className={styles.noticeBox}>{notice}</div> : null}

                  <div className={styles.toolbar}>
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
                          router.replace(value ? `/calendar?siteId=${encodeURIComponent(value)}` : '/calendar');
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
                  </div>

                  <div className={styles.layout}>
                    <div className={styles.list}>
                      <section className={styles.sectionCard}>
                        <div className={styles.sectionHeader}>
                          <div>
                            <h3 className={styles.sectionTitle}>미선택 회차</h3>
                          </div>
                        </div>
                        {loading ? (
                          <div className={styles.emptyState}>일정을 불러오는 중입니다.</div>
                        ) : unselectedRows.length === 0 ? (
                          <div className={styles.emptyState}>선택이 필요한 회차가 없습니다.</div>
                        ) : (
                          <div className={styles.list}>
                            {unselectedRows.map((row) => (
                              <article key={row.id} className={styles.rowCard}>
                                <div className={styles.rowTitle}>
                                  {row.siteName} · {row.roundNo}회차
                                </div>
                                <div className={styles.rowMeta}>
                                  허용 구간 {row.windowStart} ~ {row.windowEnd}
                                </div>
                                <div className={styles.rowActions}>
                                  <button
                                    type="button"
                                    className="app-button app-button-primary"
                                    onClick={() => openScheduleDialog({ plannedDate: row.windowStart, schedule: row })}
                                  >
                                    팝업에서 일정 지정
                                  </button>
                                </div>
                              </article>
                            ))}
                          </div>
                        )}
                      </section>
                    </div>

                    <div className={styles.list}>
                      <section className={styles.sectionCard}>
                        <div className={styles.sectionHeader}>
                          <div>
                            <h3 className={styles.sectionTitle}>월간 캘린더</h3>
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

                      <section className={styles.sectionCard}>
                        <div className={styles.sectionHeader}>
                          <div>
                            <h3 className={styles.sectionTitle}>선택된 일정</h3>
                            <div className={styles.sectionMeta}>
                              {selectedDate ? `${formatDateLabel(selectedDate)} 기준` : '전체 선택 완료 일정'}
                            </div>
                          </div>
                        </div>
                        {visibleSelectedRows.length === 0 ? (
                          <div className={styles.emptyState}>표시할 일정이 없습니다.</div>
                        ) : (
                          <div className={styles.selectedList}>
                            {visibleSelectedRows.map((row) => (
                              <article key={row.id} className={styles.rowCard}>
                                <div className={styles.rowTitle}>
                                  {row.siteName} · {row.roundNo}회차
                                </div>
                                <div className={styles.rowMeta}>
                                  방문일 {row.plannedDate} / 허용 구간 {row.windowStart} ~ {row.windowEnd}
                                </div>
                                <div className={styles.rowMeta}>
                                  사유 {row.selectionReasonLabel || '-'} / {row.selectionReasonMemo || '상세 메모 없음'}
                                </div>
                                <div className={styles.rowMeta}>
                                  선택자 {row.selectionConfirmedByName || row.assigneeName || '-'} /{' '}
                                  {formatDateTimeLabel(row.selectionConfirmedAt)}
                                </div>
                                <div className={styles.rowActions}>
                                  <button
                                    type="button"
                                    className="app-button app-button-secondary"
                                    onClick={() => openScheduleDialog({ plannedDate: row.plannedDate || row.windowStart, schedule: row })}
                                  >
                                    날짜/사유 수정
                                  </button>
                                </div>
                              </article>
                            ))}
                          </div>
                        )}
                      </section>
                    </div>
                  </div>
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
              disabled={
                !dialog.scheduleId ||
                !dialog.plannedDate ||
                !dialog.selectionReasonLabel.trim() ||
                !dialog.selectionReasonMemo.trim() ||
                Boolean(dialogWindowError)
              }
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
              <strong>선택 가능한 회차</strong>
              <span className={styles.sectionMeta}>{dialogEligibleRows.length}건</span>
            </div>
            {dialogEligibleRows.length === 0 ? (
              <div className={styles.emptyState}>이 날짜에 선택할 수 있는 회차가 없습니다.</div>
            ) : (
              <div className={styles.dialogList}>
                {dialogEligibleRows.map((row) => (
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
                      <strong>{row.siteName} · {row.roundNo}회차</strong>
                      <span className={styles.dialogMeta}>
                        허용 구간 {row.windowStart} ~ {row.windowEnd}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </section>

          {dialogSelectedRows.length > 0 ? (
            <section className={styles.dialogSection}>
              <div className={styles.dialogSectionHeader}>
                <strong>같은 날짜에 확정된 일정</strong>
              </div>
              <div className={styles.dialogList}>
                {dialogSelectedRows.map((row) => (
                  <div key={row.id} className={styles.dialogExistingRow}>
                    <div className={styles.dialogOptionBody}>
                      <strong>{row.siteName} · {row.roundNo}회차</strong>
                      <span className={styles.dialogMeta}>
                        {row.selectionReasonLabel || '사유 미입력'} / {row.selectionReasonMemo || '상세 메모 없음'}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="app-button app-button-secondary"
                      onClick={() => handleDialogScheduleSelect(row)}
                    >
                      불러오기
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

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
