'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AppModal from '@/components/ui/AppModal';
import {
  buildSortMenuOptions,
  SortableHeaderCell,
} from '@/features/admin/components/SortableHeaderCell';
import { SectionHeaderFilterMenu } from '@/features/admin/components/SectionHeaderFilterMenu';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import {
  fetchAdminSchedules,
  generateAdminSchedules,
  updateAdminSchedule,
} from '@/lib/admin/apiClient';
import { exportAdminServerWorkbook } from '@/lib/admin/exportClient';
import type { SafetyInspectionSchedule, TableSortState } from '@/types/admin';
import type { SafetySite, SafetyUser } from '@/types/backend';

interface SchedulesSectionProps {
  currentUser: SafetyUser;
  sites: SafetySite[];
  users: SafetyUser[];
}

interface ScheduleFormState {
  assigneeUserId: string;
  exceptionMemo: string;
  exceptionReasonCode: string;
  plannedDate: string;
  status: SafetyInspectionSchedule['status'];
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

function buildInitialForm(schedule: SafetyInspectionSchedule): ScheduleFormState {
  return {
    assigneeUserId: schedule.assigneeUserId,
    exceptionMemo: schedule.exceptionMemo,
    exceptionReasonCode: schedule.exceptionReasonCode,
    plannedDate: schedule.plannedDate,
    status: schedule.status,
  };
}

export function SchedulesSection({
  currentUser,
  sites,
  users,
}: SchedulesSectionProps) {
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
  const [rows, setRows] = useState<SafetyInspectionSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [generatorSiteId, setGeneratorSiteId] = useState('');
  const [editingSchedule, setEditingSchedule] = useState<SafetyInspectionSchedule | null>(null);
  const [form, setForm] = useState<ScheduleFormState>({
    assigneeUserId: '',
    exceptionMemo: '',
    exceptionReasonCode: '',
    plannedDate: '',
    status: 'planned',
  });
  const defaultMonth = getMonthToken();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchAdminSchedules({
          assigneeUserId: scope === 'mine' ? currentUser.id : assigneeUserId,
          month,
          sortBy: sort.key,
          sortDir: sort.direction,
          query,
          siteId,
          status,
        });
        if (!cancelled) {
          setRows(response.rows);
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

  const visibleRows = useMemo(
    () => (selectedDate ? rows.filter((row) => row.plannedDate === selectedDate) : rows),
    [rows, selectedDate],
  );
  const unselectedRows = useMemo(
    () => rows.filter((row) => !row.plannedDate),
    [rows],
  );
  const calendar = useMemo(() => buildCalendarDays(month), [month]);
  const rowsByDate = useMemo(() => {
    const map = new Map<string, SafetyInspectionSchedule[]>();
    rows.forEach((row) => {
      if (!map.has(row.plannedDate)) {
        map.set(row.plannedDate, []);
      }
      map.get(row.plannedDate)?.push(row);
    });
    return map;
  }, [rows]);
  const activeFilterCount =
    (month !== defaultMonth ? 1 : 0) +
    (siteId ? 1 : 0) +
    (scope === 'all' && assigneeUserId ? 1 : 0) +
    (status ? 1 : 0);

  const openEdit = (schedule: SafetyInspectionSchedule) => {
    setEditingSchedule(schedule);
    setForm(buildInitialForm(schedule));
  };

  const handleGenerate = async () => {
    if (!generatorSiteId) {
      setError('일정 자동생성할 현장을 먼저 선택해 주세요.');
      return;
    }

    try {
      setError(null);
      await generateAdminSchedules(generatorSiteId);
      setNotice('회차별 방문 일정을 생성했습니다.');
      const response = await fetchAdminSchedules({
        assigneeUserId: scope === 'mine' ? currentUser.id : assigneeUserId,
        month,
        sortBy: sort.key,
        sortDir: sort.direction,
        query,
        siteId,
        status,
      });
      setRows(response.rows);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '일정 자동생성에 실패했습니다.');
    }
  };

  const handleSave = async () => {
    if (!editingSchedule) return;

    try {
      setError(null);
      await updateAdminSchedule(editingSchedule.id, {
        assigneeUserId: form.assigneeUserId,
        exceptionMemo: form.exceptionMemo,
        exceptionReasonCode: form.exceptionReasonCode,
        plannedDate: form.plannedDate,
        status: form.status,
      });

      const response = await fetchAdminSchedules({
        assigneeUserId: scope === 'mine' ? currentUser.id : assigneeUserId,
        month,
        query,
        siteId,
        sortBy: sort.key,
        sortDir: sort.direction,
        status,
      });
      setRows(response.rows);
      setNotice('일정을 저장했습니다.');
      setEditingSchedule(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '일정 저장에 실패했습니다.');
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
            <select
              className={`app-select ${styles.sectionHeaderSelect}`}
              value={generatorSiteId}
              onChange={(event) => setGeneratorSiteId(event.target.value)}
            >
              <option value="">자동생성 현장</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.site_name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => void handleGenerate()}
            >
              회차 자동생성
            </button>
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

          <div className={styles.calendarGrid}>
            {Array.from({ length: calendar.leadingEmptyCount }).map((_, index) => (
              <div key={`empty-${index}`} className={styles.calendarCellEmpty} />
            ))}
            {calendar.days.map((day) => {
              const dayRows = rowsByDate.get(day.token) || [];
              const hasWarning = dayRows.some((row) => row.isConflicted || row.isOutOfWindow);
              const isSelected = selectedDate === day.token;

              return (
                <button
                  key={day.token}
                  type="button"
                  className={`${styles.calendarCell} ${isSelected ? styles.calendarCellActive : ''}`}
                  onClick={() => setSelectedDate((current) => (current === day.token ? '' : day.token))}
                >
                  <span className={styles.calendarCellDate}>{day.day}</span>
                  <span className={styles.calendarCellCount}>{dayRows.length}건</span>
                  {hasWarning ? <span className={styles.calendarCellFlag}>주의</span> : null}
                </button>
              );
            })}
          </div>

          <div className={styles.tableShell}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>미선택 일정 큐</h3>
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
                        <td>{row.windowStart} ~ {row.windowEnd}</td>
                        <td>{row.assigneeName || '-'}</td>
                        <td>{row.status}</td>
                        <td>
                          <button
                            type="button"
                            className="app-button app-button-secondary"
                            onClick={() => openEdit(row)}
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
              {loading ? '불러오는 중' : `${visibleRows.length}건`}
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
                        <td>{row.windowStart} ~ {row.windowEnd}</td>
                        <td>{row.assigneeName || '-'}</td>
                        <td>{row.status}</td>
                        <td>
                          {[
                            row.isConflicted ? '충돌' : '',
                            row.isOutOfWindow ? '구간 밖' : '',
                            row.isOverdue ? '지연' : '',
                          ]
                            .filter(Boolean)
                            .join(', ') || '-'}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="app-button app-button-secondary"
                            onClick={() => openEdit(row)}
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
        open={Boolean(editingSchedule)}
        title="방문 일정 수정"
        onClose={() => setEditingSchedule(null)}
        actions={
          <>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => setEditingSchedule(null)}
            >
              취소
            </button>
            <button
              type="button"
              className="app-button app-button-primary"
              onClick={() => void handleSave()}
            >
              저장
            </button>
          </>
        }
      >
        {editingSchedule ? (
          <div className={styles.modalGrid}>
            <label className={styles.modalField}>
              <span className={styles.label}>방문일</span>
              <input
                className="app-input"
                type="date"
                value={form.plannedDate}
                onChange={(event) => setForm((current) => ({ ...current, plannedDate: event.target.value }))}
              />
            </label>
            <label className={styles.modalField}>
              <span className={styles.label}>담당자</span>
              <select
                className="app-select"
                value={form.assigneeUserId}
                onChange={(event) => setForm((current) => ({ ...current, assigneeUserId: event.target.value }))}
              >
                <option value="">선택</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
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
            <label className={styles.modalField}>
              <span className={styles.label}>사유코드</span>
              <input
                className="app-input"
                value={form.exceptionReasonCode}
                onChange={(event) =>
                  setForm((current) => ({ ...current, exceptionReasonCode: event.target.value }))
                }
                placeholder="예: holiday, customer_request"
              />
            </label>
            <label className={styles.modalFieldWide}>
              <span className={styles.label}>사유 메모</span>
              <textarea
                className="app-textarea"
                rows={3}
                value={form.exceptionMemo}
                onChange={(event) =>
                  setForm((current) => ({ ...current, exceptionMemo: event.target.value }))
                }
              />
            </label>
            <div className={styles.modalFieldWide}>
              <div className={styles.modalHint}>
                허용 구간: {editingSchedule.windowStart} ~ {editingSchedule.windowEnd}
              </div>
            </div>
          </div>
        ) : null}
      </AppModal>
    </div>
  );
}
