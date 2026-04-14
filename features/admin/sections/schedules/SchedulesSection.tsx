'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppModal from '@/components/ui/AppModal';
import {
  buildSortMenuOptions,
  SortableHeaderCell,
} from '@/features/admin/components/SortableHeaderCell';
import { SectionHeaderFilterMenu } from '@/features/admin/components/SectionHeaderFilterMenu';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import { getAdminSectionHref } from '@/lib/admin';
import {
  fetchAdminSchedules,
  updateAdminSchedule,
} from '@/lib/admin/apiClient';
import {
  downloadAdminSiteBasicMaterial,
  exportAdminServerWorkbook,
} from '@/lib/admin/exportClient';
import type { SafetyInspectionSchedule, TableSortState } from '@/types/admin';
import type { SafetySite, SafetyUser } from '@/types/backend';

interface SchedulesSectionProps {
  currentUser: SafetyUser;
  sites: SafetySite[];
  users: SafetyUser[];
}

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

function sortSchedules(rows: SafetyInspectionSchedule[]) {
  return [...rows].sort(
    (left, right) =>
      left.roundNo - right.roundNo ||
      left.siteName.localeCompare(right.siteName, 'ko') ||
      left.windowStart.localeCompare(right.windowStart),
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
  return {
    assigneeUserId: schedule.assigneeUserId,
    plannedDate: plannedDate || schedule.plannedDate || schedule.windowStart,
    selectionReasonLabel: schedule.selectionReasonLabel,
    selectionReasonMemo: schedule.selectionReasonMemo,
    status: schedule.status,
  };
}

function buildWindowSummary(row: SafetyInspectionSchedule) {
  return `${row.windowStart} ~ ${row.windowEnd}`;
}

function buildSelectionSummary(row: SafetyInspectionSchedule) {
  if (!row.selectionReasonLabel && !row.selectionReasonMemo) {
    return '-';
  }
  return [row.selectionReasonLabel, row.selectionReasonMemo].filter(Boolean).join(' / ');
}

function buildIssueSummary(row: SafetyInspectionSchedule) {
  return [
    row.isConflicted ? '충돌' : '',
    row.isOutOfWindow ? '구간 밖' : '',
    row.isOverdue ? '지연' : '',
  ]
    .filter(Boolean)
    .join(', ');
}

function buildDayAssigneeSummary(rows: SafetyInspectionSchedule[]) {
  const labels = Array.from(
    new Set(rows.map((row) => row.assigneeName).filter(Boolean)),
  ).slice(0, 2);
  if (labels.length === 0) return '';
  return rows.length > 2 ? `${labels.join(', ')} 외` : labels.join(', ');
}

export function SchedulesSection({
  currentUser,
  sites,
  users,
}: SchedulesSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [scope, setScope] = useState<'all' | 'mine'>(() =>
    searchParams.get('scope') === 'mine' ? 'mine' : 'all',
  );
  const [month, setMonth] = useState(() => searchParams.get('month') || getMonthToken());
  const [query, setQuery] = useState(() => searchParams.get('query') || '');
  const [siteId, setSiteId] = useState(() => searchParams.get('siteId') || '');
  const [assigneeUserId, setAssigneeUserId] = useState(() => searchParams.get('assigneeUserId') || '');
  const [status, setStatus] = useState(() => searchParams.get('status') || '');
  const [selectedDate, setSelectedDate] = useState(() => searchParams.get('plannedDate') || '');
  const [sort, setSort] = useState<TableSortState>({
    direction: 'asc',
    key: 'plannedDate',
  });
  const [allMonthTotal, setAllMonthTotal] = useState(0);
  const [currentMonthTotal, setCurrentMonthTotal] = useState(0);
  const [rows, setRows] = useState<SafetyInspectionSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeScheduleId, setActiveScheduleId] = useState('');
  const [dragScheduleId, setDragScheduleId] = useState('');
  const [form, setForm] = useState<ScheduleFormState>(EMPTY_FORM);
  const defaultMonth = getMonthToken();

  const buildScheduleQuery = (monthToken: string) => ({
    assigneeUserId: scope === 'mine' ? currentUser.id : assigneeUserId,
    limit: 5000,
    month: monthToken,
    query,
    siteId,
    sortBy: sort.key,
    sortDir: sort.direction,
    status,
  });

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const [response, allMonthResponse] = await Promise.all([
          fetchAdminSchedules(buildScheduleQuery(month)),
          fetchAdminSchedules({
            ...buildScheduleQuery('all'),
            limit: 1,
            sortBy: 'plannedDate',
            sortDir: 'asc',
          }),
        ]);
        if (!cancelled) {
          setRows(response.rows);
          setCurrentMonthTotal(response.total);
          setAllMonthTotal(allMonthResponse.total);
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : '일정 목록을 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [assigneeUserId, currentUser.id, month, query, scope, siteId, sort.direction, sort.key, status]);

  const selectedRows = useMemo(() => rows.filter((row) => Boolean(row.plannedDate)), [rows]);
  const visibleRows = useMemo(
    () => (selectedDate ? selectedRows.filter((row) => row.plannedDate === selectedDate) : selectedRows),
    [selectedDate, selectedRows],
  );
  const unselectedRows = useMemo(() => sortSchedules(rows.filter((row) => !row.plannedDate)), [rows]);
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
  const activeFilterCount =
    (month !== defaultMonth ? 1 : 0) +
    (siteId ? 1 : 0) +
    (scope === 'all' && assigneeUserId ? 1 : 0) +
    (status ? 1 : 0);
  const activeSchedule = useMemo(
    () => rows.find((row) => row.id === activeScheduleId) ?? null,
    [activeScheduleId, rows],
  );
  const dragSchedule = useMemo(
    () => rows.find((row) => row.id === dragScheduleId) ?? null,
    [dragScheduleId, rows],
  );
  const dialogSelectableRows = useMemo(() => {
    const nextRows = rows.filter(
      (row) =>
        (row.id === activeScheduleId || !row.plannedDate) &&
        isDateWithinWindow(form.plannedDate, row.windowStart, row.windowEnd),
    );
    return sortSchedules(nextRows);
  }, [activeScheduleId, form.plannedDate, rows]);
  const dialogSelectedRows = useMemo(
    () =>
      sortSchedules(
        selectedRows.filter(
          (row) => row.plannedDate === form.plannedDate && row.id !== activeScheduleId,
        ),
      ),
    [activeScheduleId, form.plannedDate, selectedRows],
  );
  const activeSiteDetailHref = activeSchedule
    ? getAdminSectionHref('headquarters', {
        headquarterId: activeSchedule.headquarterId,
        siteId: activeSchedule.siteId,
      })
    : '';
  const otherMonthCount = Math.max(0, allMonthTotal - currentMonthTotal);
  const showOtherMonthHint = !loading && currentMonthTotal === 0 && otherMonthCount > 0;

  useEffect(() => {
    if (!dialogOpen || activeScheduleId || dialogSelectableRows.length === 0) return;
    const defaultSchedule = dialogSelectableRows[0];
    setActiveScheduleId(defaultSchedule.id);
    setForm((current) => ({
      ...buildInitialForm(defaultSchedule, current.plannedDate || defaultSchedule.windowStart),
      plannedDate: current.plannedDate || defaultSchedule.windowStart,
    }));
  }, [activeScheduleId, dialogOpen, dialogSelectableRows]);

  const refreshRows = async (nextMonth = month) => {
    const [response, allMonthResponse] = await Promise.all([
      fetchAdminSchedules(buildScheduleQuery(nextMonth)),
      fetchAdminSchedules({
        ...buildScheduleQuery('all'),
        limit: 1,
        sortBy: 'plannedDate',
        sortDir: 'asc',
      }),
    ]);
    setRows(response.rows);
    setCurrentMonthTotal(response.total);
    setAllMonthTotal(allMonthResponse.total);
  };

  const openScheduleDialog = (input: {
    plannedDate: string;
    schedule?: SafetyInspectionSchedule | null;
  }) => {
    const defaultSchedule =
      input.schedule ??
      sortSchedules(
        rows.filter(
          (row) =>
            (!row.plannedDate || row.plannedDate === input.plannedDate) &&
            isDateWithinWindow(input.plannedDate, row.windowStart, row.windowEnd),
        ),
      )[0] ??
      null;
    setSelectedDate(input.plannedDate);
    setActiveScheduleId(defaultSchedule?.id || '');
    setForm(buildInitialForm(defaultSchedule, input.plannedDate));
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setActiveScheduleId('');
    setForm(EMPTY_FORM);
  };

  const handlePickSchedule = (schedule: SafetyInspectionSchedule) => {
    setActiveScheduleId(schedule.id);
    setForm(buildInitialForm(schedule, form.plannedDate || schedule.plannedDate || schedule.windowStart));
  };

  const handleSave = async () => {
    if (!activeSchedule) {
      setError('일정을 저장할 회차를 먼저 선택해 주세요.');
      return;
    }
    if (!form.plannedDate) {
      setError('방문일을 먼저 선택해 주세요.');
      return;
    }
    if (!form.selectionReasonLabel.trim() || !form.selectionReasonMemo.trim()) {
      setError('사유 분류와 상세 메모를 함께 입력해 주세요.');
      return;
    }

    try {
      setError(null);
      const nextMonth = form.plannedDate.slice(0, 7) || month;
      await updateAdminSchedule(activeSchedule.id, {
        assigneeUserId: form.assigneeUserId,
        exceptionMemo: '',
        exceptionReasonCode: '',
        plannedDate: form.plannedDate,
        selectionReasonLabel: form.selectionReasonLabel,
        selectionReasonMemo: form.selectionReasonMemo,
        status: form.status,
      });

      await refreshRows(nextMonth);
      setMonth(nextMonth);
      setSelectedDate(form.plannedDate);
      setNotice('일정을 저장했습니다.');
      closeDialog();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '일정 저장에 실패했습니다.');
    }
  };

  const canDropScheduleOnDate = (
    schedule: SafetyInspectionSchedule | null,
    targetDate: string,
  ) => {
    if (!schedule || !schedule.plannedDate || !targetDate) return false;
    if (targetDate === schedule.plannedDate) return false;
    return isDateWithinWindow(targetDate, schedule.windowStart, schedule.windowEnd);
  };

  const handleQuickMove = async (
    schedule: SafetyInspectionSchedule,
    targetDate: string,
  ) => {
    if (!canDropScheduleOnDate(schedule, targetDate)) return;

    try {
      setError(null);
      const nextMonth = targetDate.slice(0, 7) || month;
      await updateAdminSchedule(schedule.id, {
        exceptionMemo: '',
        exceptionReasonCode: '',
        plannedDate: targetDate,
      });
      await refreshRows(nextMonth);
      setMonth(nextMonth);
      setSelectedDate(targetDate);
      setNotice(`${schedule.siteName} ${schedule.roundNo}회차 방문일을 ${targetDate}로 변경했습니다.`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '일정 이동에 실패했습니다.');
    } finally {
      setDragScheduleId('');
    }
  };

  const handleExport = async () => {
    try {
      setError(null);
      await exportAdminServerWorkbook('schedules', {
        assignee_user_id: scope === 'mine' ? currentUser.id : assigneeUserId,
        month,
        planned_date: selectedDate,
        query,
        site_id: siteId,
        sort_by: sort.key,
        sort_dir: sort.direction,
        status,
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '일정 엑셀 내보내기에 실패했습니다.');
    }
  };

  const handleDownloadBasicMaterial = async () => {
    if (!siteId) {
      setError('기초자료는 특정 현장을 선택한 상태에서만 출력할 수 있습니다.');
      return;
    }

    try {
      setError(null);
      const matchedSite = sites.find((site) => site.id === siteId);
      await downloadAdminSiteBasicMaterial(
        siteId,
        matchedSite ? `${matchedSite.site_name}-기초자료.xlsx` : undefined,
      );
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '기초자료 출력에 실패했습니다.');
    }
  };

  const resetHeaderFilters = () => {
    setMonth(defaultMonth);
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
          <div className={`${styles.sectionHeaderActions} ${styles.sectionHeaderToolbarActions}`}>
            <button
              type="button"
              className={`${styles.filterButton} ${scope === 'all' ? styles.filterButtonActive : ''}`}
              onClick={() => setScope('all')}
            >
              전체 일정
            </button>
            <button
              type="button"
              className={`${styles.filterButton} ${scope === 'mine' ? styles.filterButtonActive : ''}`}
              onClick={() => setScope('mine')}
            >
              내 일정
            </button>
            <input
              className={`app-input ${styles.sectionHeaderSearch} ${styles.sectionHeaderToolbarSearch}`}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="현장명, 사업장명, 담당자로 검색"
            />
            <SectionHeaderFilterMenu
              activeCount={activeFilterCount}
              ariaLabel="일정 필터"
              onReset={resetHeaderFilters}
            >
              <div className={styles.sectionHeaderMenuGrid}>
                <div className={styles.sectionHeaderMenuField}>
                  <label htmlFor="schedule-filter-month">대상 월</label>
                  <input
                    id="schedule-filter-month"
                    className="app-input"
                    type="month"
                    value={month}
                    onChange={(event) => setMonth(event.target.value || defaultMonth)}
                  />
                </div>
                <div className={styles.sectionHeaderMenuField}>
                  <label htmlFor="schedule-filter-site">현장</label>
                  <select
                    id="schedule-filter-site"
                    className="app-select"
                    value={siteId}
                    onChange={(event) => setSiteId(event.target.value)}
                  >
                    <option value="">전체 현장</option>
                    {sites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.site_name}
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
                    disabled={scope === 'mine'}
                  >
                    <option value="">전체 담당자</option>
                    {users.map((user) => (
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
              현재 선택한 {month}에는 일정이 없고, 같은 필터 기준 다른 월에 {otherMonthCount}건이 있습니다.
            </div>
          ) : null}

          <div className={styles.calendarGrid}>
            {Array.from({ length: calendar.leadingEmptyCount }).map((_, index) => (
              <div key={`empty-${index}`} className={styles.calendarCellEmpty} />
            ))}
            {calendar.days.map((day) => {
              const dayRows = rowsByDate.get(day.token) || [];
              const hasWarning = dayRows.some((row) => row.isConflicted || row.isOutOfWindow);
              const isSelected = selectedDate === day.token;
              const canDrop = canDropScheduleOnDate(dragSchedule, day.token);
              const assigneeSummary = buildDayAssigneeSummary(dayRows);

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
                    <span className={styles.calendarCellDate}>{day.day}</span>
                    <span className={styles.calendarCellCount}>{dayRows.length}건</span>
                    {assigneeSummary ? (
                      <span className={styles.calendarCellAssignees}>{assigneeSummary}</span>
                    ) : null}
                    {hasWarning ? <span className={styles.calendarCellFlag}>주의</span> : null}
                  </button>
                  {dayRows.length > 0 ? (
                    <div className={styles.calendarScheduleStack}>
                      {dayRows.slice(0, 3).map((row) => (
                        <button
                          key={`calendar-row-${row.id}`}
                          type="button"
                          draggable={Boolean(row.plannedDate)}
                          className={[
                            styles.calendarScheduleChip,
                            row.isConflicted || row.isOutOfWindow ? styles.calendarScheduleChipWarning : '',
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
                            {row.assigneeName || '미배정'} · {row.siteName}
                          </span>
                          <span className={styles.calendarScheduleChipMeta}>
                            {row.roundNo}회차
                            {buildIssueSummary(row) ? ` · ${buildIssueSummary(row)}` : ''}
                          </span>
                        </button>
                      ))}
                      {dayRows.length > 3 ? (
                        <button
                          type="button"
                          className={styles.calendarMoreButton}
                          onClick={() => openScheduleDialog({ plannedDate: day.token })}
                        >
                          +{dayRows.length - 3}건 더보기
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
                  계약일 기준 15일 간격으로 회차가 자동 계산되며, 총 회차 범위 안에서만 선택할 수 있습니다.
                </div>
              </div>
              <div className={styles.sectionHeaderActions}>
                <span className={styles.sectionHeaderMeta}>{unselectedRows.length}건</span>
              </div>
            </div>
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
                  {unselectedRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={styles.tableEmpty}>
                        아직 날짜를 선택하지 않은 회차가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    unselectedRows.map((row) => (
                      <tr key={`unselected-${row.id}`}>
                        <td>{row.siteName}</td>
                        <td>{row.roundNo}회차</td>
                        <td>{buildWindowSummary(row)}</td>
                        <td>{row.assigneeName || '-'}</td>
                        <td>{row.status}</td>
                        <td>
                          <button
                            type="button"
                            className="app-button app-button-secondary"
                            onClick={() =>
                              openScheduleDialog({ plannedDate: row.windowStart, schedule: row })
                            }
                          >
                            일정 지정
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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
              {loading ? '불러오는 중' : `${currentMonthTotal.toLocaleString('ko-KR')}건 / 전체 ${allMonthTotal.toLocaleString('ko-KR')}건`}
            </span>
          </div>
        </div>
        <div className={styles.sectionBody}>
          {visibleRows.length === 0 ? (
            <div className={styles.tableEmpty}>
              {loading ? '일정을 불러오는 중입니다.' : '조건에 맞는 일정이 없습니다.'}
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
                        <td>{row.roundNo}회차</td>
                        <td>{row.plannedDate || '-'}</td>
                        <td>{buildWindowSummary(row)}</td>
                        <td>{row.assigneeName || '-'}</td>
                        <td>{buildSelectionSummary(row)}</td>
                        <td>
                          {[row.selectionConfirmedByName || '-', formatDateTime(row.selectionConfirmedAt)].join(' / ')}
                        </td>
                        <td>
                          {buildIssueSummary(row) || '-'}
                        </td>
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
                !form.selectionReasonLabel.trim() ||
                !form.selectionReasonMemo.trim()
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
                    <strong>{activeSchedule.status}</strong>
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
                      {[activeSchedule.selectionConfirmedByName || '-', formatDateTime(activeSchedule.selectionConfirmedAt)].join(' / ')}
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
              min={activeSchedule?.windowStart || undefined}
              max={undefined}
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
              onChange={(event) =>
                setForm((current) => ({ ...current, assigneeUserId: event.target.value }))
              }
            >
              <option value="">선택</option>
              {users.map((user) => (
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
                        <td>{row.roundNo}회차</td>
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
                        <td>{row.roundNo}회차</td>
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
              onChange={(event) =>
                setForm((current) => ({ ...current, selectionReasonLabel: event.target.value }))
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
              <option value="canceled">취소</option>
            </select>
          </label>
          <label className={styles.modalFieldWide}>
            <span className={styles.label}>상세 메모</span>
            <textarea
              className="app-textarea"
              rows={4}
              value={form.selectionReasonMemo}
              onChange={(event) =>
                setForm((current) => ({ ...current, selectionReasonMemo: event.target.value }))
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
