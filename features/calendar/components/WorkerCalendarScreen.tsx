'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppModal from '@/components/ui/AppModal';
import LoginPanel from '@/components/auth/LoginPanel';
import WorkerAppHeader from '@/components/worker/WorkerAppHeader';
import WorkerMenuSidebar from '@/components/worker/WorkerMenuSidebar';
import WorkerShellBody from '@/components/worker/WorkerShellBody';
import { WorkerMenuDrawer, WorkerMenuPanel } from '@/components/worker/WorkerMenu';
import { buildSiteAssistHref } from '@/features/home/lib/siteEntry';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { isAdminUserRole, getAdminSectionHref } from '@/lib/admin';
import { fetchMySchedules, updateMySchedule } from '@/lib/calendar/apiClient';
import homeStyles from '@/features/home/components/HomeScreen.module.css';
import type { SafetyInspectionSchedule } from '@/types/admin';
import styles from './WorkerCalendarScreen.module.css';

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
  const [pendingDates, setPendingDates] = useState<Record<string, string>>({});
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

  const handleSaveSchedule = async (schedule: SafetyInspectionSchedule, plannedDate: string) => {
    if (!plannedDate) {
      setError('선택할 방문 날짜를 먼저 입력해 주세요.');
      return;
    }
    if (!isDateWithinWindow(plannedDate, schedule.windowStart, schedule.windowEnd)) {
      setError(buildWindowErrorMessage(schedule));
      return;
    }
    try {
      setError(null);
      const updated = await updateMySchedule(schedule.id, { plannedDate });
      setRows((current) => current.map((row) => (row.id === updated.id ? updated : row)));
      setPendingDates((current) => ({ ...current, [schedule.id]: '' }));
      setSelectedDate(updated.plannedDate || '');
      setNotice(`${schedule.siteName} ${schedule.roundNo}회차 일정을 저장했습니다.`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '일정을 저장하지 못했습니다.');
    }
  };

  const openEditModal = (schedule: SafetyInspectionSchedule) => {
    setEditingSchedule(schedule);
    setEditPlannedDate(schedule.plannedDate || schedule.windowStart);
  };

  const handleSaveEdit = async () => {
    if (!editingSchedule) return;
    await handleSaveSchedule(editingSchedule, editPlannedDate);
    setEditingSchedule(null);
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
                    <span className={styles.summaryMeta}>먼저 날짜를 선택해야 하는 일정</span>
                  </article>
                  <article className={styles.summaryCard}>
                    <span className={styles.summaryLabel}>선택 완료 일정</span>
                    <strong className={styles.summaryValue}>{selectedRows.length}</strong>
                    <span className={styles.summaryMeta}>관제 캘린더에도 바로 반영됩니다.</span>
                  </article>
                  <article className={styles.summaryCard}>
                    <span className={styles.summaryLabel}>배정 현장</span>
                    <strong className={styles.summaryValue}>
                      {selectedSiteId ? 1 : sites.length}
                    </strong>
                    <span className={styles.summaryMeta}>계약일 기준 15일 구간 안에서만 선택 가능</span>
                  </article>
                </section>

                <section className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h2 className={styles.sectionTitle}>회차별 일정 선택</h2>
                      <div className={styles.sectionMeta}>계약일 기준 15일씩 구간이 나뉘며, 구간 밖 일정은 작업자 화면에서 저장할 수 없습니다.</div>
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
                            <div className={styles.sectionMeta}>배정 직후 생성된 회차입니다.</div>
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
                                {pendingDates[row.id] &&
                                !isDateWithinWindow(
                                  pendingDates[row.id] || '',
                                  row.windowStart,
                                  row.windowEnd,
                                ) ? (
                                  <div className={styles.rowMeta}>
                                    {buildWindowErrorMessage(row)}
                                  </div>
                                ) : null}
                                <div className={styles.rowActions}>
                                  <Link
                                    href={buildSiteAssistHref(row.siteId, { scheduleId: row.id })}
                                    className="app-button app-button-secondary"
                                  >
                                    현장 보조
                                  </Link>
                                  <label className={styles.inlineField}>
                                    <span className={styles.fieldLabel}>방문 날짜</span>
                                    <input
                                      className="app-input"
                                      type="date"
                                      min={row.windowStart}
                                      max={row.windowEnd}
                                      value={pendingDates[row.id] ?? ''}
                                      onChange={(event) =>
                                        setPendingDates((current) => ({
                                          ...current,
                                          [row.id]: event.target.value,
                                        }))
                                      }
                                    />
                                  </label>
                                  <button
                                    type="button"
                                    className="app-button app-button-primary"
                                    onClick={() => void handleSaveSchedule(row, pendingDates[row.id] || '')}
                                    disabled={
                                      !pendingDates[row.id] ||
                                      !isDateWithinWindow(
                                        pendingDates[row.id] || '',
                                        row.windowStart,
                                        row.windowEnd,
                                      )
                                    }
                                  >
                                    이 날짜로 선택
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
                            <div className={styles.sectionMeta}>날짜를 누르면 아래 선택 완료 일정이 해당 일자로 좁혀집니다.</div>
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
                                <div className={styles.rowActions}>
                                  <Link
                                    href={buildSiteAssistHref(row.siteId, { scheduleId: row.id })}
                                    className="app-button app-button-secondary"
                                  >
                                    현장 보조
                                  </Link>
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
                )
              }
            >
              이 날짜로 변경
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
