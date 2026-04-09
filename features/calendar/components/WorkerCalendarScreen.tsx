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

interface ScheduleSelectionDraft {
  plannedDate: string;
  selectionReasonLabel: string;
  selectionReasonMemo: string;
}

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

function buildWindowErrorMessage(schedule: Pick<SafetyInspectionSchedule, 'roundNo' | 'siteName' | 'windowEnd' | 'windowStart'>) {
  return `${schedule.siteName} ${schedule.roundNo}회차는 ${schedule.windowStart} ~ ${schedule.windowEnd} 안에서만 선택할 수 있습니다.`;
}

export function WorkerCalendarScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [month, setMonth] = useState(getMonthToken());
  const [rows, setRows] = useState<SafetyInspectionSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [editingSchedule, setEditingSchedule] = useState<SafetyInspectionSchedule | null>(null);
  const [editPlannedDate, setEditPlannedDate] = useState('');
  const [editReasonLabel, setEditReasonLabel] = useState('');
  const [editReasonMemo, setEditReasonMemo] = useState('');
  const [pendingSelections, setPendingSelections] = useState<Record<string, ScheduleSelectionDraft>>({});
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

  const unselectedRows = useMemo(
    () => rows.filter((row) => !row.plannedDate),
    [rows],
  );
  const selectedRows = useMemo(
    () =>
      rows
        .filter((row) => Boolean(row.plannedDate))
        .sort((left, right) =>
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

  const updatePendingSelection = (scheduleId: string, patch: Partial<ScheduleSelectionDraft>) => {
    setPendingSelections((current) => ({
      ...current,
      [scheduleId]: {
        plannedDate: current[scheduleId]?.plannedDate || '',
        selectionReasonLabel: current[scheduleId]?.selectionReasonLabel || '',
        selectionReasonMemo: current[scheduleId]?.selectionReasonMemo || '',
        ...patch,
      },
    }));
  };

  const getPendingSelection = (scheduleId: string): ScheduleSelectionDraft => ({
    plannedDate: pendingSelections[scheduleId]?.plannedDate || '',
    selectionReasonLabel: pendingSelections[scheduleId]?.selectionReasonLabel || '',
    selectionReasonMemo: pendingSelections[scheduleId]?.selectionReasonMemo || '',
  });

  const handleSaveSchedule = async (
    schedule: SafetyInspectionSchedule,
    input: ScheduleSelectionDraft,
  ) => {
    const plannedDate = input.plannedDate;
    const selectionReasonLabel = input.selectionReasonLabel.trim();
    const selectionReasonMemo = input.selectionReasonMemo.trim();

    if (!plannedDate) {
      setError('선택할 방문 날짜를 먼저 입력해 주세요.');
      return false;
    }
    if (!isDateWithinWindow(plannedDate, schedule.windowStart, schedule.windowEnd)) {
      setError(buildWindowErrorMessage(schedule));
      return false;
    }
    if (!selectionReasonLabel || !selectionReasonMemo) {
      setError('방문 일정을 선택할 때는 사유 분류와 상세 메모를 함께 입력해 주세요.');
      return false;
    }
    try {
      setError(null);
      const updated = await updateMySchedule(schedule.id, {
        plannedDate,
        selectionReasonLabel,
        selectionReasonMemo,
      });
      setRows((current) => current.map((row) => (row.id === updated.id ? updated : row)));
      setPendingSelections((current) => {
        const next = { ...current };
        delete next[schedule.id];
        return next;
      });
      setSelectedDate(updated.plannedDate || '');
      setNotice(`${schedule.siteName} ${schedule.roundNo}회차 일정을 저장했습니다.`);
      return true;
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '일정을 저장하지 못했습니다.');
      return false;
    }
  };

  const openEditModal = (schedule: SafetyInspectionSchedule) => {
    setEditingSchedule(schedule);
    setEditPlannedDate(schedule.plannedDate || schedule.windowStart);
    setEditReasonLabel(schedule.selectionReasonLabel || '');
    setEditReasonMemo(schedule.selectionReasonMemo || '');
  };

  const handleSaveEdit = async () => {
    if (!editingSchedule) return;
    const saved = await handleSaveSchedule(editingSchedule, {
      plannedDate: editPlannedDate,
      selectionReasonLabel: editReasonLabel,
      selectionReasonMemo: editReasonMemo,
    });
    if (saved) {
      setEditingSchedule(null);
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
                            {unselectedRows.map((row) => {
                              const draft = getPendingSelection(row.id);
                              const hasDraftWindowError =
                                Boolean(draft.plannedDate) &&
                                !isDateWithinWindow(
                                  draft.plannedDate,
                                  row.windowStart,
                                  row.windowEnd,
                                );

                              return (
                                <article key={row.id} className={styles.rowCard}>
                                  <div className={styles.rowTitle}>
                                    {row.siteName} · {row.roundNo}회차
                                  </div>
                                  <div className={styles.rowMeta}>
                                    허용 구간 {row.windowStart} ~ {row.windowEnd}
                                  </div>
                                  {hasDraftWindowError ? (
                                    <div className={styles.rowMeta}>
                                      {buildWindowErrorMessage(row)}
                                    </div>
                                  ) : null}
                                  <div className={styles.rowActions}>
                                    <label className={styles.inlineField}>
                                      <span className={styles.fieldLabel}>방문 날짜</span>
                                      <input
                                        className="app-input"
                                        type="date"
                                        min={row.windowStart}
                                        max={row.windowEnd}
                                        value={draft.plannedDate}
                                        onChange={(event) =>
                                          updatePendingSelection(row.id, {
                                            plannedDate: event.target.value,
                                          })
                                        }
                                      />
                                    </label>
                                    <label className={styles.inlineField}>
                                      <span className={styles.fieldLabel}>사유 분류</span>
                                      <input
                                        className="app-input"
                                        value={draft.selectionReasonLabel}
                                        onChange={(event) =>
                                          updatePendingSelection(row.id, {
                                            selectionReasonLabel: event.target.value,
                                          })
                                        }
                                        placeholder="예: 현장 요청, 비상 작업"
                                      />
                                    </label>
                                    <label className={`${styles.inlineField} ${styles.memoField}`}>
                                      <span className={styles.fieldLabel}>상세 메모</span>
                                      <textarea
                                        className="app-textarea"
                                        rows={2}
                                        value={draft.selectionReasonMemo}
                                        onChange={(event) =>
                                          updatePendingSelection(row.id, {
                                            selectionReasonMemo: event.target.value,
                                          })
                                        }
                                        placeholder="방문일을 정한 배경이나 협의 내용을 남겨 주세요."
                                      />
                                    </label>
                                    <button
                                      type="button"
                                      className="app-button app-button-primary"
                                      onClick={() => void handleSaveSchedule(row, draft)}
                                      disabled={
                                        !draft.plannedDate ||
                                        !draft.selectionReasonLabel.trim() ||
                                        !draft.selectionReasonMemo.trim() ||
                                        hasDraftWindowError
                                      }
                                    >
                                      이 일정으로 확정
                                    </button>
                                  </div>
                                </article>
                              );
                            })}
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
                                onClick={() => setSelectedDate((current) => (current === day.token ? '' : day.token))}
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
                                <div className={styles.rowMeta}>상태 {row.status}</div>
                                <div className={styles.rowMeta}>
                                  사유 분류 {row.selectionReasonLabel || '-'}
                                </div>
                                <div className={styles.rowMeta}>
                                  상세 메모 {row.selectionReasonMemo || '-'}
                                </div>
                                <div className={styles.rowMeta}>
                                  확정 {formatDateTimeLabel(row.selectionConfirmedAt)} / {row.selectionConfirmedByName || row.assigneeName || '-'}
                                </div>
                                <div className={styles.rowActions}>
                                  <button
                                    type="button"
                                    className="app-button app-button-secondary"
                                    onClick={() => openEditModal(row)}
                                  >
                                    날짜 수정
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
        open={Boolean(editingSchedule)}
        title="일정 날짜 수정"
        onClose={() => setEditingSchedule(null)}
        actions={
          <>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => setEditingSchedule(null)}
            >
              닫기
            </button>
            <button
              type="button"
              className="app-button app-button-primary"
              onClick={() => void handleSaveEdit()}
              disabled={
                !editingSchedule ||
                !editPlannedDate ||
                !isDateWithinWindow(
                  editPlannedDate,
                  editingSchedule.windowStart,
                  editingSchedule.windowEnd,
                ) ||
                !editReasonLabel.trim() ||
                !editReasonMemo.trim()
              }
            >
              일정 확정 변경
            </button>
          </>
        }
      >
        {editingSchedule ? (
          <div className={styles.list}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>
                {editingSchedule.siteName} {editingSchedule.roundNo}회차 날짜
              </span>
              <input
                className="app-input"
                type="date"
                min={editingSchedule.windowStart}
                max={editingSchedule.windowEnd}
                value={editPlannedDate}
                onChange={(event) => setEditPlannedDate(event.target.value)}
              />
            </label>
            <div className={styles.rowMeta}>
              허용 구간 {editingSchedule.windowStart} ~ {editingSchedule.windowEnd}
            </div>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>사유 분류</span>
              <input
                className="app-input"
                value={editReasonLabel}
                onChange={(event) => setEditReasonLabel(event.target.value)}
                placeholder="예: 현장 요청, 비상 작업"
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>상세 메모</span>
              <textarea
                className="app-textarea"
                rows={3}
                value={editReasonMemo}
                onChange={(event) => setEditReasonMemo(event.target.value)}
                placeholder="방문일을 조정한 상세 이유를 남겨 주세요."
              />
            </label>
            <div className={styles.rowMeta}>
              마지막 확정 {formatDateTimeLabel(editingSchedule.selectionConfirmedAt)} / {editingSchedule.selectionConfirmedByName || editingSchedule.assigneeName || '-'}
            </div>
            {editPlannedDate &&
            !isDateWithinWindow(
              editPlannedDate,
              editingSchedule.windowStart,
              editingSchedule.windowEnd,
            ) ? (
              <div className={styles.rowMeta}>{buildWindowErrorMessage(editingSchedule)}</div>
            ) : null}
          </div>
        ) : null}
      </AppModal>
    </main>
  );
}

export default WorkerCalendarScreen;
