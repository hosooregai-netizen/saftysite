'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import {
  DEMO_NOW,
  DEMO_TODAY,
  buildControllerReportRows,
  buildMonthCalendar,
  buildOverviewModel,
  buildWindowErrorMessage,
  cx,
  formatCurrency,
  formatDate,
  formatDateTime,
  getEligibleScheduleRows,
  groupSchedulesByDate,
  sortSchedules,
} from '../domain';
import { useReverseApp } from '../state';
import type { ControllerReportRow } from '../domain';
import type { QualityStatus, ScheduleRecord, Site } from '../types';
import { Badge, EmptyState, Field, Modal, Notice, Panel, ScreenHeader, StatGrid, buttonClass } from '../ui';

type ScheduleDialogState = {
  open: boolean;
  plannedDate: string;
  scheduleId: string;
  selectionReasonLabel: string;
  selectionReasonMemo: string;
};

const emptyScheduleDialog: ScheduleDialogState = {
  open: false,
  plannedDate: '',
  scheduleId: '',
  selectionReasonLabel: '',
  selectionReasonMemo: '',
};

function signalTone(signal: ControllerReportRow['dispatchSignal']) {
  if (signal === 'sent') {
    return 'success';
  }
  if (signal === 'warning') {
    return 'warning';
  }
  if (signal === 'overdue') {
    return 'danger';
  }
  return 'neutral';
}

export function AdminOverviewScreen() {
  const { state } = useReverseApp();
  const overview = useMemo(() => buildOverviewModel(state), [state]);
  const [lastSyncedAt, setLastSyncedAt] = useState(DEMO_NOW);
  const [notice, setNotice] = useState('');

  return (
    <div className="screen-stack">
      <ScreenHeader
        eyebrow="/admin"
        title="운영 개요"
        description="리버스 스펙 기준으로 현장 상태, 자료 부족, 발송 지연, 우선 관리 대상을 한 화면에 재구성했습니다."
        actions={
          <>
            <button
              type="button"
              className={buttonClass('secondary')}
              onClick={() => {
                setLastSyncedAt(DEMO_NOW);
                setNotice('원격 응답 없이도 현재 파생 모델을 다시 동기화했습니다.');
              }}
            >
              새로고침
            </button>
            <button
              type="button"
              className={buttonClass('ghost')}
              onClick={() => window.alert('현재 화면 기준으로 Excel 내보내기 모델을 생성하는 데모입니다.')}
            >
              Excel 내보내기
            </button>
          </>
        }
      />

      <Notice message={notice} />

      <Panel
        title="운영 개요"
        description={`마지막 동기화 ${formatDateTime(lastSyncedAt)} · 원격 응답 대신 현재 상태 모델을 재계산합니다.`}
      >
        <StatGrid
          items={[
            ...overview.siteStatusSummary.map((item) => ({ label: item.label, value: item.value })),
            ...overview.quarterlyMaterialSummary.map((item) => ({
              label: item.label,
              value: item.value,
              tone: item.value > 0 ? 'warning' : 'normal',
            })),
            ...overview.deadlineSignalSummary.map((item) => ({
              label: item.label,
              value: item.value,
              tone: item.label === '지연' && item.value > 0 ? 'warning' : 'accent',
            })),
          ]}
        />
      </Panel>

      <div className="two-column">
        <Panel title="발송 관리 대상" description="현재 모델 기준 미발송 행을 우선순위 순으로 노출합니다.">
          <table className="table">
            <thead>
              <tr>
                <th>현장</th>
                <th>보고서</th>
                <th>미발송 경과</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {overview.unsentReportRows.map((row) => (
                <tr key={row.reportKey}>
                  <td>{row.siteName}</td>
                  <td>
                    <Link href={row.routeHref} className="table-link">
                      {row.reportTitle}
                    </Link>
                  </td>
                  <td>{row.unsentDays}일</td>
                  <td>
                    <Badge tone={signalTone(row.dispatchSignal)}>{row.dispatchStatus}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="우선 관리 분기 현황" description="분기 보고서 중 리뷰 이슈 또는 지연 신호가 큰 항목을 우선 노출합니다.">
          <table className="table">
            <thead>
              <tr>
                <th>현장</th>
                <th>분기</th>
                <th>품질</th>
                <th>신호</th>
              </tr>
            </thead>
            <tbody>
              {overview.priorityQuarterlyManagementRows.map((row) => (
                <tr key={row.reportKey}>
                  <td>{row.siteName}</td>
                  <td>{row.periodLabel}</td>
                  <td>
                    <Badge tone={row.qualityStatus === 'issue' ? 'danger' : 'accent'}>{row.qualityStatus}</Badge>
                  </td>
                  <td>
                    <Badge tone={signalTone(row.dispatchSignal)}>{row.dispatchStatus}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <div className="two-column">
        <Panel title="종료 임박 현장" description="프로젝트 종료일 기준으로 임박 현장을 정렬합니다.">
          <table className="table">
            <thead>
              <tr>
                <th>현장</th>
                <th>사업장</th>
                <th>종료일</th>
              </tr>
            </thead>
            <tbody>
              {overview.endingSoonRows.map((site) => (
                <tr key={site.id}>
                  <td>
                    <Link href={`/sites/${site.id}`} className="table-link">
                      {site.siteName}
                    </Link>
                  </td>
                  <td>{site.headquarterName}</td>
                  <td>{site.projectEndDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="교육/계측 자료 부족 현장" description="스펙의 기본 정렬 규칙처럼 누락 총합이 큰 현장을 먼저 보여줍니다.">
          <table className="table">
            <thead>
              <tr>
                <th>현장</th>
                <th>교육 부족</th>
                <th>계측 부족</th>
                <th>총 부족</th>
              </tr>
            </thead>
            <tbody>
              {overview.materialRows.map((site) => (
                <tr key={site.id}>
                  <td>{site.siteName}</td>
                  <td>{site.material.educationMissing}</td>
                  <td>{site.material.measurementMissing}</td>
                  <td>{site.material.educationMissing + site.material.measurementMissing}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}

export function AdminSchedulesScreen() {
  const { state, updateSchedule } = useReverseApp();
  const [month, setMonth] = useState('2026-04');
  const [query, setQuery] = useState('');
  const [siteId, setSiteId] = useState('');
  const [assigneeUserId, setAssigneeUserId] = useState('');
  const [status, setStatus] = useState('');
  const [dialog, setDialog] = useState<ScheduleDialogState>(emptyScheduleDialog);
  const [dragScheduleId, setDragScheduleId] = useState('');
  const [notice, setNotice] = useState('');

  const visibleRows = useMemo(() => {
    return state.schedules.filter((row) => {
      const monthValue = row.plannedDate ?? row.windowStart;
      const matchesMonth = monthValue.startsWith(month);
      const matchesQuery =
        !query.trim() ||
        row.siteName.toLowerCase().includes(query.trim().toLowerCase()) ||
        row.headquarterName.toLowerCase().includes(query.trim().toLowerCase());
      const matchesSite = !siteId || row.siteId === siteId;
      const matchesAssignee = !assigneeUserId || row.assigneeUserId === assigneeUserId;
      const matchesStatus = !status || row.status === status;
      return matchesMonth && matchesQuery && matchesSite && matchesAssignee && matchesStatus;
    });
  }, [assigneeUserId, month, query, siteId, state.schedules, status]);

  const selectedRows = useMemo(
    () => sortSchedules(visibleRows.filter((row) => row.plannedDate)),
    [visibleRows],
  );
  const queueRows = useMemo(
    () =>
      [...visibleRows]
        .filter((row) => !row.plannedDate)
        .sort((left, right) => left.roundNo - right.roundNo || left.siteName.localeCompare(right.siteName, 'ko')),
    [visibleRows],
  );
  const rowsByDate = useMemo(() => groupSchedulesByDate(selectedRows), [selectedRows]);
  const calendar = useMemo(() => buildMonthCalendar(month), [month]);

  const dialogEligibleRows = useMemo(
    () => getEligibleScheduleRows(visibleRows, dialog.plannedDate, dialog.scheduleId),
    [dialog.plannedDate, dialog.scheduleId, visibleRows],
  );
  const activeSchedule = dialogEligibleRows.find((row) => row.id === dialog.scheduleId);
  const dialogWindowError = buildWindowErrorMessage(activeSchedule, dialog.plannedDate);

  function openDialog(plannedDate: string, sourceRow?: ScheduleRecord) {
    const eligible = getEligibleScheduleRows(visibleRows, plannedDate, sourceRow?.id);
    const selected = sourceRow ?? eligible[0];
    setDialog({
      open: true,
      plannedDate,
      scheduleId: selected?.id ?? '',
      selectionReasonLabel: selected?.selectionReasonLabel ?? '',
      selectionReasonMemo: selected?.selectionReasonMemo ?? '',
    });
  }

  function saveDialog() {
    if (!dialog.scheduleId) {
      window.alert('회차를 먼저 선택해 주세요.');
      return;
    }
    if (!dialog.plannedDate) {
      window.alert('방문 날짜를 먼저 선택해 주세요.');
      return;
    }
    if (!dialog.selectionReasonLabel.trim() || !dialog.selectionReasonMemo.trim()) {
      window.alert('사유 분류와 상세 메모를 함께 입력해 주세요.');
      return;
    }
    if (dialogWindowError) {
      window.alert(dialogWindowError);
      return;
    }

    const row = visibleRows.find((item) => item.id === dialog.scheduleId);
    if (!row) {
      window.alert('선택한 회차를 찾지 못했습니다.');
      return;
    }

    updateSchedule(dialog.scheduleId, {
      plannedDate: dialog.plannedDate,
      selectionReasonLabel: dialog.selectionReasonLabel.trim(),
      selectionReasonMemo: dialog.selectionReasonMemo.trim(),
      status: 'selected',
      selectionConfirmedAt: DEMO_NOW,
      selectionConfirmedByName: row.assigneeName ?? '미배정',
    });

    setNotice(`${row.siteName} ${row.roundNo}회차 일정을 저장했습니다.`);
    setDialog(emptyScheduleDialog);
  }

  function handleDrop(date: string) {
    const dragRow = visibleRows.find((row) => row.id === dragScheduleId);
    if (!dragRow || !dragRow.plannedDate) {
      return;
    }
    if (date === dragRow.plannedDate) {
      return;
    }
    if (date < dragRow.windowStart || date > dragRow.windowEnd) {
      window.alert('허용된 방문일 창 안에서만 이동할 수 있습니다.');
      return;
    }
    updateSchedule(dragRow.id, { plannedDate: date });
    setNotice(`${dragRow.siteName} ${dragRow.roundNo}회차를 ${date}로 이동했습니다.`);
    setDragScheduleId('');
  }

  return (
    <div className="screen-stack">
      <ScreenHeader
        eyebrow="/admin/schedules"
        title="일정 보드"
        description="월별 캘린더, 미선택 회차 큐, 확정 일정 모달, 드래그 이동까지 스펙을 기반으로 재구성했습니다."
        actions={
          <>
            <button
              type="button"
              className={buttonClass('ghost')}
              onClick={() => window.alert('현재 필터 기준 Excel 내보내기')}
            >
              Excel 내보내기
            </button>
            <button
              type="button"
              className={buttonClass('secondary')}
              onClick={() =>
                siteId
                  ? window.alert(`${siteId} 기본 자료 다운로드`)
                  : window.alert('현장 하나를 고르면 기본 자료 다운로드가 활성화됩니다.')
              }
            >
              기본 자료 다운로드
            </button>
          </>
        }
      />

      <Notice message={notice} />

      <Panel title="필터" className="panel-tight">
        <div className="form-grid form-grid-5">
          <Field label="월">
            <input className="input" type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
          </Field>
          <Field label="검색">
            <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="현장/사업장" />
          </Field>
          <Field label="현장">
            <select className="input" value={siteId} onChange={(event) => setSiteId(event.target.value)}>
              <option value="">전체</option>
              {state.sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.siteName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="담당자">
            <select className="input" value={assigneeUserId} onChange={(event) => setAssigneeUserId(event.target.value)}>
              <option value="">전체</option>
              {state.users
                .filter((user) => user.role === 'worker')
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="상태">
            <select className="input" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">전체</option>
              <option value="unselected">미선택</option>
              <option value="selected">확정</option>
              <option value="completed">완료</option>
            </select>
          </Field>
        </div>
      </Panel>

      <div className="three-column">
        <Panel title="미선택 회차" description={`${queueRows.length}건`}>
          <div className="stack-list">
            {queueRows.map((row) => (
              <article key={row.id} className="list-card">
                <div>
                  <strong>
                    {row.roundNo}/{row.totalRounds} · {row.siteName}
                  </strong>
                  <p className="muted">
                    허용 창 {row.windowStart} ~ {row.windowEnd}
                  </p>
                </div>
                <button type="button" className={buttonClass('secondary')} onClick={() => openDialog(row.windowStart, row)}>
                  일정 지정
                </button>
              </article>
            ))}
            {queueRows.length === 0 ? <EmptyState title="미선택 일정이 없습니다." /> : null}
          </div>
        </Panel>

        <Panel title="월간 캘린더" description="칩을 드래그해 허용 범위 안에서 날짜를 옮길 수 있습니다." className="calendar-panel">
          <div className="calendar-grid">
            {['월', '화', '수', '목', '금', '토', '일'].map((day) => (
              <div key={day} className="calendar-weekday">
                {day}
              </div>
            ))}
            {calendar.map((day) => (
              <button
                type="button"
                key={day.value}
                className={cx('calendar-cell', !day.inMonth && 'calendar-cell-muted')}
                onClick={() => openDialog(day.value)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDrop(day.value)}
              >
                <span className="calendar-day">{day.day}</span>
                <div className="calendar-chips">
                  {(rowsByDate[day.value] ?? []).slice(0, 3).map((row) => (
                    <span
                      key={row.id}
                      className="calendar-chip"
                      draggable
                      onDragStart={() => setDragScheduleId(row.id)}
                    >
                      {(row.assigneeName ?? '미배정').slice(0, 2)} · {row.roundNo}회차
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="선택 완료 일정" description={`${selectedRows.length}건`}>
          <div className="stack-list">
            {selectedRows.map((row) => (
              <article key={row.id} className="list-card">
                <div>
                  <strong>
                    {row.plannedDate} · {row.siteName}
                  </strong>
                  <p className="muted">
                    {row.roundNo}회차 · {row.selectionReasonLabel || '사유 미입력'}
                  </p>
                </div>
                <button type="button" className={buttonClass('ghost')} onClick={() => openDialog(row.plannedDate ?? month, row)}>
                  수정
                </button>
              </article>
            ))}
          </div>
        </Panel>
      </div>

      <Modal
        open={dialog.open}
        title="일정 지정 / 수정"
        description="허용된 날짜 창 안에서 하나의 회차를 선택하고 사유를 함께 저장합니다."
        onClose={() => setDialog(emptyScheduleDialog)}
        footer={
          <>
            <button type="button" className={buttonClass('ghost')} onClick={() => setDialog(emptyScheduleDialog)}>
              취소
            </button>
            <button type="button" className={buttonClass('primary')} onClick={saveDialog}>
              저장
            </button>
          </>
        }
      >
        <div className="form-grid">
          <Field label="방문일">
            <input
              className="input"
              type="date"
              value={dialog.plannedDate}
              onChange={(event) => setDialog((current) => ({ ...current, plannedDate: event.target.value }))}
            />
          </Field>
          <Field label="대상 회차">
            <select
              className="input"
              value={dialog.scheduleId}
              onChange={(event) => setDialog((current) => ({ ...current, scheduleId: event.target.value }))}
            >
              <option value="">회차 선택</option>
              {dialogEligibleRows.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.siteName} {row.roundNo}/{row.totalRounds}
                </option>
              ))}
            </select>
          </Field>
          <Field label="사유 분류">
            <input
              className="input"
              value={dialog.selectionReasonLabel}
              onChange={(event) =>
                setDialog((current) => ({ ...current, selectionReasonLabel: event.target.value }))
              }
              placeholder="현장 요청 / 정기 점검"
            />
          </Field>
          <Field label="상세 메모">
            <textarea
              className="input textarea"
              value={dialog.selectionReasonMemo}
              onChange={(event) =>
                setDialog((current) => ({ ...current, selectionReasonMemo: event.target.value }))
              }
              placeholder="방문 배경과 창 선택 사유"
            />
          </Field>
        </div>

        {activeSchedule ? (
          <div className="info-strip">
            허용 창 {activeSchedule.windowStart} ~ {activeSchedule.windowEnd}
          </div>
        ) : null}
        {dialogWindowError ? <Notice message={dialogWindowError} tone="warning" /> : null}
      </Modal>
    </div>
  );
}

function buildSiteDraft(site?: Site) {
  return (
    site ?? {
      id: '',
      headquarterId: 'hq-new',
      headquarterName: '',
      siteName: '',
      siteCode: '',
      managementNumber: '',
      projectKind: '',
      siteAddress: '',
      projectAmount: 0,
      projectStartDate: DEMO_TODAY,
      projectEndDate: DEMO_TODAY,
      contractEndDate: DEMO_TODAY,
      assignedUserIds: [],
      status: '준비중' as const,
      siteManagerName: '',
      siteManagerContact: '',
      adminSiteSnapshot: {
        headquarterName: '',
        siteName: '',
        siteAddress: '',
        siteManagerName: '',
        siteManagerContact: '',
        assigneeName: '',
      },
      material: {
        quarterLabel: '2026년 2분기',
        educationMissing: 0,
        measurementMissing: 0,
        educationStatus: '교육 자료 충족',
        measurementStatus: '계측 자료 충족',
      },
    }
  );
}

export function AdminSitesScreen() {
  const { state, assignSiteUsers, deleteSite, upsertSite } = useReverseApp();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [assignmentSiteId, setAssignmentSiteId] = useState('');
  const [assignmentDraft, setAssignmentDraft] = useState<string[]>([]);
  const [notice, setNotice] = useState('');

  const filteredSites = useMemo(() => {
    return state.sites.filter((site) => {
      const matchesQuery =
        !query.trim() ||
        site.siteName.toLowerCase().includes(query.trim().toLowerCase()) ||
        site.managementNumber.toLowerCase().includes(query.trim().toLowerCase()) ||
        site.projectKind.toLowerCase().includes(query.trim().toLowerCase()) ||
        site.siteAddress.toLowerCase().includes(query.trim().toLowerCase());
      const matchesStatus = !statusFilter || site.status === statusFilter;
      const matchesAssignment =
        assignmentFilter === 'all' ||
        (assignmentFilter === 'assigned' && site.assignedUserIds.length > 0) ||
        (assignmentFilter === 'unassigned' && site.assignedUserIds.length === 0);
      return matchesQuery && matchesStatus && matchesAssignment;
    });
  }, [assignmentFilter, query, state.sites, statusFilter]);

  function saveSite() {
    if (!editingSite) {
      return;
    }
    if (!editingSite.headquarterName.trim() || !editingSite.siteName.trim()) {
      window.alert('사업장과 현장명은 필수입니다.');
      return;
    }
    const next = {
      ...editingSite,
      id: editingSite.id || `site-${Math.random().toString(36).slice(2, 8)}`,
      adminSiteSnapshot: {
        ...editingSite.adminSiteSnapshot,
        headquarterName: editingSite.headquarterName,
        siteName: editingSite.siteName,
        siteAddress: editingSite.siteAddress,
        siteManagerName: editingSite.siteManagerName,
        siteManagerContact: editingSite.siteManagerContact,
      },
    };
    upsertSite(next);
    setNotice(`${next.siteName} 정보를 저장했습니다.`);
    setEditingSite(null);
  }

  function openAssignment(site: Site) {
    setAssignmentSiteId(site.id);
    setAssignmentDraft(site.assignedUserIds);
  }

  const assignmentSite = state.sites.find((site) => site.id === assignmentSiteId);

  return (
    <div className="screen-stack">
      <ScreenHeader
        eyebrow="/admin/sites"
        title="현장 목록"
        description="검색, 배정, 상태 변경, 수정, Excel 내보내기, 기본 자료 다운로드를 스펙에 맞춰 분리했습니다."
        actions={
          <>
            <button
              type="button"
              className={buttonClass('ghost')}
              onClick={() => window.alert('현재 목록을 Excel로 내보냅니다.')}
            >
              Excel 내보내기
            </button>
            <button type="button" className={buttonClass('primary')} onClick={() => setEditingSite(buildSiteDraft())}>
              현장 추가
            </button>
          </>
        }
      />

      <Notice message={notice} />

      <Panel title="필터" className="panel-tight">
        <div className="form-grid form-grid-4">
          <Field label="검색">
            <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="현장명 / 관리번호 / 주소" />
          </Field>
          <Field label="상태">
            <select className="input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">전체</option>
              <option value="운영중">운영중</option>
              <option value="준비중">준비중</option>
              <option value="종료 임박">종료 임박</option>
            </select>
          </Field>
          <Field label="배정">
            <select
              className="input"
              value={assignmentFilter}
              onChange={(event) => setAssignmentFilter(event.target.value as 'all' | 'assigned' | 'unassigned')}
            >
              <option value="all">전체</option>
              <option value="assigned">배정됨</option>
              <option value="unassigned">미배정</option>
            </select>
          </Field>
          <Field label="활성 필터">
            <div className="info-strip">
              {[statusFilter && `상태:${statusFilter}`, assignmentFilter !== 'all' && `배정:${assignmentFilter}`]
                .filter(Boolean)
                .join(' · ') || '없음'}
            </div>
          </Field>
        </div>
      </Panel>

      <Panel title="현장 목록" description={`${filteredSites.length}건`}>
        <table className="table">
          <thead>
            <tr>
              <th>현장명</th>
              <th>사업장</th>
              <th>공사 종류</th>
              <th>지도요원</th>
              <th>주소</th>
              <th>공사 금액</th>
              <th>상태</th>
              <th>마지막 방문일</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {filteredSites.map((site) => (
              <tr key={site.id}>
                <td>
                  <Link href={`/sites/${site.id}`} className="table-link">
                    {site.siteName}
                  </Link>
                  <div className="table-subline">{site.managementNumber}</div>
                </td>
                <td>{site.headquarterName}</td>
                <td>{site.projectKind}</td>
                <td>{site.guidanceOfficerName || '미배정'}</td>
                <td>{site.siteAddress}</td>
                <td>
                  {formatCurrency(site.projectAmount)}
                  <div className="table-subline">
                    {site.projectStartDate} ~ {site.projectEndDate}
                  </div>
                </td>
                <td>
                  <Badge tone={site.status === '종료 임박' ? 'warning' : 'accent'}>{site.status}</Badge>
                </td>
                <td>{formatDate(site.lastVisitDate)}</td>
                <td>
                  <div className="inline-actions">
                    <Link href={`/sites/${site.id}`} className={buttonClass('ghost')}>
                      메인
                    </Link>
                    <button type="button" className={buttonClass('ghost')} onClick={() => openAssignment(site)}>
                      배정
                    </button>
                    <button type="button" className={buttonClass('ghost')} onClick={() => setEditingSite(site)}>
                      수정
                    </button>
                    <button
                      type="button"
                      className={buttonClass('ghost')}
                      onClick={() => window.alert(`${site.siteName} 기본 자료 다운로드`)}
                    >
                      자료
                    </button>
                    <button
                      type="button"
                      className={buttonClass('danger')}
                      onClick={() => {
                        if (window.confirm(`${site.siteName} 현장을 삭제할까요? 배정/보고서 정보도 함께 제거됩니다.`)) {
                          deleteSite(site.id);
                        }
                      }}
                    >
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Modal
        open={Boolean(editingSite)}
        title={editingSite?.id ? '현장 수정' : '현장 추가'}
        onClose={() => setEditingSite(null)}
        footer={
          <>
            <button type="button" className={buttonClass('ghost')} onClick={() => setEditingSite(null)}>
              취소
            </button>
            <button type="button" className={buttonClass('primary')} onClick={saveSite}>
              저장
            </button>
          </>
        }
      >
        {editingSite ? (
          <div className="form-grid form-grid-2">
            <Field label="사업장">
              <input
                className="input"
                value={editingSite.headquarterName}
                onChange={(event) =>
                  setEditingSite((current) => (current ? { ...current, headquarterName: event.target.value } : current))
                }
              />
            </Field>
            <Field label="현장명">
              <input
                className="input"
                value={editingSite.siteName}
                onChange={(event) =>
                  setEditingSite((current) => (current ? { ...current, siteName: event.target.value } : current))
                }
              />
            </Field>
            <Field label="공사 종류">
              <input
                className="input"
                value={editingSite.projectKind}
                onChange={(event) =>
                  setEditingSite((current) => (current ? { ...current, projectKind: event.target.value } : current))
                }
              />
            </Field>
            <Field label="상태">
              <select
                className="input"
                value={editingSite.status}
                onChange={(event) =>
                  setEditingSite((current) =>
                    current ? { ...current, status: event.target.value as Site['status'] } : current,
                  )
                }
              >
                <option value="운영중">운영중</option>
                <option value="준비중">준비중</option>
                <option value="종료 임박">종료 임박</option>
                <option value="휴면">휴면</option>
              </select>
            </Field>
            <Field label="주소">
              <input
                className="input"
                value={editingSite.siteAddress}
                onChange={(event) =>
                  setEditingSite((current) => (current ? { ...current, siteAddress: event.target.value } : current))
                }
              />
            </Field>
            <Field label="공사 금액">
              <input
                className="input"
                type="number"
                value={editingSite.projectAmount}
                onChange={(event) =>
                  setEditingSite((current) =>
                    current ? { ...current, projectAmount: Number(event.target.value) || 0 } : current,
                  )
                }
              />
            </Field>
            <Field label="현장소장">
              <input
                className="input"
                value={editingSite.siteManagerName}
                onChange={(event) =>
                  setEditingSite((current) =>
                    current
                      ? {
                          ...current,
                          siteManagerName: event.target.value,
                          adminSiteSnapshot: { ...current.adminSiteSnapshot, siteManagerName: event.target.value },
                        }
                      : current,
                  )
                }
              />
            </Field>
            <Field label="연락처">
              <input
                className="input"
                value={editingSite.siteManagerContact}
                onChange={(event) =>
                  setEditingSite((current) =>
                    current
                      ? {
                          ...current,
                          siteManagerContact: event.target.value,
                          adminSiteSnapshot: { ...current.adminSiteSnapshot, siteManagerContact: event.target.value },
                        }
                      : current,
                  )
                }
              />
            </Field>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(assignmentSite)}
        title="지도요원 배정"
        description={assignmentSite?.siteName}
        onClose={() => setAssignmentSiteId('')}
        footer={
          <>
            <button type="button" className={buttonClass('ghost')} onClick={() => setAssignmentSiteId('')}>
              취소
            </button>
            <button
              type="button"
              className={buttonClass('primary')}
              onClick={() => {
                if (!assignmentSite) {
                  return;
                }
                assignSiteUsers(assignmentSite.id, assignmentDraft);
                setAssignmentSiteId('');
                setNotice(`${assignmentSite.siteName} 배정을 저장했습니다.`);
              }}
            >
              저장
            </button>
          </>
        }
      >
        <div className="stack-list">
          {state.users
            .filter((user) => user.role === 'worker')
            .map((user) => (
              <label key={user.id} className="checkbox-row">
                <input
                  type="checkbox"
                  checked={assignmentDraft.includes(user.id)}
                  onChange={(event) =>
                    setAssignmentDraft((current) =>
                      event.target.checked
                        ? [...current, user.id]
                        : current.filter((value) => value !== user.id),
                    )
                  }
                />
                <span>
                  {user.name} · {user.phone}
                </span>
              </label>
            ))}
        </div>
      </Modal>
    </div>
  );
}

export function AdminReportsScreen() {
  const { currentUser, state, updateReportDispatch, updateReportReview } = useReverseApp();
  const reportRows = useMemo(() => buildControllerReportRows(state), [state]);
  const [query, setQuery] = useState('');
  const [reportType, setReportType] = useState('');
  const [siteId, setSiteId] = useState('');
  const [assigneeUserId, setAssigneeUserId] = useState('');
  const [qualityStatus, setQualityStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  const [reviewTarget, setReviewTarget] = useState<ControllerReportRow | null>(null);
  const [reviewDraft, setReviewDraft] = useState({
    qualityStatus: 'unchecked' as QualityStatus,
    ownerUserId: currentUser.id,
    note: '',
  });
  const [dispatchTarget, setDispatchTarget] = useState<ControllerReportRow | null>(null);
  const [dispatchDraft, setDispatchDraft] = useState({
    phone: '',
    message: '',
    markSent: false,
  });

  const filteredRows = useMemo(() => {
    return reportRows.filter((row) => {
      const matchesQuery =
        !query.trim() ||
        row.reportTitle.toLowerCase().includes(query.trim().toLowerCase()) ||
        row.siteName.toLowerCase().includes(query.trim().toLowerCase()) ||
        row.headquarterName.toLowerCase().includes(query.trim().toLowerCase());
      const matchesReportType = !reportType || row.reportType === reportType;
      const matchesSite = !siteId || row.siteId === siteId;
      const matchesAssignee = !assigneeUserId || row.assigneeUserId === assigneeUserId;
      const matchesQuality = !qualityStatus || row.qualityStatus === qualityStatus;
      const matchesDateFrom = !dateFrom || (row.visitDate ?? '') >= dateFrom;
      const matchesDateTo = !dateTo || (row.visitDate ?? '') <= dateTo;
      return (
        matchesQuery &&
        matchesReportType &&
        matchesSite &&
        matchesAssignee &&
        matchesQuality &&
        matchesDateFrom &&
        matchesDateTo
      );
    });
  }, [assigneeUserId, dateFrom, dateTo, qualityStatus, query, reportRows, reportType, siteId]);

  function toggleSelected(reportKey: string) {
    setSelectedKeys((current) =>
      current.includes(reportKey) ? current.filter((value) => value !== reportKey) : [...current, reportKey],
    );
  }

  function applyBulkReview(nextQuality: QualityStatus) {
    filteredRows
      .filter((row) => selectedKeys.includes(row.reportKey))
      .forEach((row) => {
        updateReportReview(row.reportType, row.reportKey, {
          qualityStatus: nextQuality,
          checkerUserId: currentUser.id,
          ownerUserId: currentUser.id,
          checkedAt: DEMO_NOW,
        });
      });
    setNotice(`${selectedKeys.length}건에 리뷰 상태 ${nextQuality}를 반영했습니다.`);
    setSelectedKeys([]);
  }

  function openReview(row: ControllerReportRow) {
    setReviewTarget(row);
    setReviewDraft({
      qualityStatus: row.qualityStatus,
      ownerUserId: row.assigneeUserId ?? currentUser.id,
      note: row.controllerReview ?? '',
    });
  }

  function openDispatch(row: ControllerReportRow) {
    setDispatchTarget(row);
    setDispatchDraft({
      phone: state.sites.find((site) => site.id === row.siteId)?.siteManagerContact ?? '',
      message: `${row.reportTitle} 발송 메시지`,
      markSent: row.dispatchSignal === 'sent',
    });
  }

  return (
    <div className="screen-stack">
      <ScreenHeader
        eyebrow="/admin/reports"
        title="전체 보고서"
        description="검색/정렬/리뷰/발송/개별 문서 액션을 하나의 테이블과 모달 워크플로로 복원했습니다."
        actions={
          <button
            type="button"
            className={buttonClass('ghost')}
            onClick={() => window.alert('현재 필터 기준 보고서 목록 Excel 내보내기')}
          >
            목록 내보내기
          </button>
        }
      />

      <Notice message={notice} />

      {selectedKeys.length > 0 ? (
        <Panel title="벌크 작업" className="panel-tight">
          <div className="inline-actions">
            <span>{selectedKeys.length}건 선택됨</span>
            <button type="button" className={buttonClass('secondary')} onClick={() => applyBulkReview('ok')}>
              리뷰 OK
            </button>
            <button type="button" className={buttonClass('secondary')} onClick={() => applyBulkReview('issue')}>
              리뷰 이슈
            </button>
            <button
              type="button"
              className={buttonClass('ghost')}
              onClick={() => {
                filteredRows
                  .filter((row) => selectedKeys.includes(row.reportKey) && row.reportType === 'quarterly_report')
                  .forEach((row) =>
                    updateReportDispatch(row.reportType, row.reportKey, {
                      sent: true,
                      manualChecked: true,
                      lastSentAt: DEMO_NOW,
                    }),
                  );
                setNotice('선택된 분기 보고서를 수동 발송 처리했습니다.');
                setSelectedKeys([]);
              }}
            >
              수동 발송 처리
            </button>
          </div>
        </Panel>
      ) : null}

      <Panel title="필터" className="panel-tight">
        <div className="form-grid form-grid-4">
          <Field label="검색">
            <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="현장 / 제목" />
          </Field>
          <Field label="보고서 종류">
            <select className="input" value={reportType} onChange={(event) => setReportType(event.target.value)}>
              <option value="">전체</option>
              <option value="technical_guidance">기술지도</option>
              <option value="quarterly_report">분기 보고서</option>
              <option value="bad_workplace">취약 현장</option>
            </select>
          </Field>
          <Field label="현장">
            <select className="input" value={siteId} onChange={(event) => setSiteId(event.target.value)}>
              <option value="">전체</option>
              {state.sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.siteName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="담당자">
            <select className="input" value={assigneeUserId} onChange={(event) => setAssigneeUserId(event.target.value)}>
              <option value="">전체</option>
              {state.users
                .filter((user) => user.role === 'worker')
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="품질 상태">
            <select className="input" value={qualityStatus} onChange={(event) => setQualityStatus(event.target.value)}>
              <option value="">전체</option>
              <option value="unchecked">unchecked</option>
              <option value="ok">ok</option>
              <option value="issue">issue</option>
            </select>
          </Field>
          <Field label="시작일">
            <input className="input" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </Field>
          <Field label="종료일">
            <input className="input" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </Field>
          <Field label="요약">
            <div className="info-strip">{filteredRows.length}건 표시</div>
          </Field>
        </div>
      </Panel>

      <Panel title="보고서 테이블">
        <table className="table">
          <thead>
            <tr>
              <th />
              <th>보고서</th>
              <th>현장</th>
              <th>유형</th>
              <th>품질</th>
              <th>발송</th>
              <th>업데이트</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.reportKey}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedKeys.includes(row.reportKey)}
                    onChange={() => toggleSelected(row.reportKey)}
                  />
                </td>
                <td>
                  <Link href={row.routeHref} className="table-link">
                    {row.reportTitle}
                  </Link>
                  <div className="table-subline">{row.periodLabel}</div>
                </td>
                <td>{row.siteName}</td>
                <td>{row.reportType}</td>
                <td>
                  <Badge tone={row.qualityStatus === 'issue' ? 'danger' : row.qualityStatus === 'ok' ? 'success' : 'neutral'}>
                    {row.qualityStatus}
                  </Badge>
                </td>
                <td>
                  <Badge tone={signalTone(row.dispatchSignal)}>{row.dispatchStatus}</Badge>
                </td>
                <td>{formatDateTime(row.updatedAt)}</td>
                <td>
                  <div className="inline-actions">
                    <Link href={row.routeHref} className={buttonClass('ghost')}>
                      열기
                    </Link>
                    <button type="button" className={buttonClass('ghost')} onClick={() => openReview(row)}>
                      리뷰
                    </button>
                    <button type="button" className={buttonClass('ghost')} onClick={() => openDispatch(row)}>
                      발송
                    </button>
                    <button
                      type="button"
                      className={buttonClass('ghost')}
                      onClick={() => window.alert(`${row.reportTitle} HWPX/PDF 내보내기 데모`)}
                    >
                      문서
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Modal
        open={Boolean(reviewTarget)}
        title="품질 리뷰"
        description={reviewTarget?.reportTitle}
        onClose={() => setReviewTarget(null)}
        footer={
          <>
            <button type="button" className={buttonClass('ghost')} onClick={() => setReviewTarget(null)}>
              취소
            </button>
            <button
              type="button"
              className={buttonClass('primary')}
              onClick={() => {
                if (!reviewTarget) {
                  return;
                }
                updateReportReview(reviewTarget.reportType, reviewTarget.reportKey, {
                  qualityStatus: reviewDraft.qualityStatus,
                  ownerUserId: reviewDraft.ownerUserId,
                  checkerUserId: currentUser.id,
                  note: reviewDraft.note,
                  checkedAt: DEMO_NOW,
                });
                setReviewTarget(null);
                setNotice(`${reviewTarget.reportTitle} 리뷰를 저장했습니다.`);
              }}
            >
              저장
            </button>
          </>
        }
      >
        <div className="form-grid">
          <Field label="품질 상태">
            <select
              className="input"
              value={reviewDraft.qualityStatus}
              onChange={(event) =>
                setReviewDraft((current) => ({
                  ...current,
                  qualityStatus: event.target.value as QualityStatus,
                }))
              }
            >
              <option value="unchecked">unchecked</option>
              <option value="ok">ok</option>
              <option value="issue">issue</option>
            </select>
          </Field>
          <Field label="리뷰 담당">
            <select
              className="input"
              value={reviewDraft.ownerUserId}
              onChange={(event) => setReviewDraft((current) => ({ ...current, ownerUserId: event.target.value }))}
            >
              {state.users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="메모">
            <textarea
              className="input textarea"
              value={reviewDraft.note}
              onChange={(event) => setReviewDraft((current) => ({ ...current, note: event.target.value }))}
            />
          </Field>
        </div>
      </Modal>

      <Modal
        open={Boolean(dispatchTarget)}
        title="발송 처리"
        description={dispatchTarget?.reportTitle}
        onClose={() => setDispatchTarget(null)}
        footer={
          <>
            <button type="button" className={buttonClass('ghost')} onClick={() => setDispatchTarget(null)}>
              취소
            </button>
            <button
              type="button"
              className={buttonClass('primary')}
              onClick={() => {
                if (!dispatchTarget) {
                  return;
                }
                updateReportDispatch(dispatchTarget.reportType, dispatchTarget.reportKey, {
                  sent: dispatchDraft.markSent,
                  manualChecked: dispatchDraft.markSent,
                  smsSent: dispatchDraft.markSent,
                  phone: dispatchDraft.phone,
                  message: dispatchDraft.message,
                  lastSentAt: dispatchDraft.markSent ? DEMO_NOW : undefined,
                });
                setDispatchTarget(null);
                setNotice(`${dispatchTarget.reportTitle} 발송 상태를 저장했습니다.`);
              }}
            >
              저장
            </button>
          </>
        }
      >
        <div className="form-grid">
          <Field label="연락처">
            <input
              className="input"
              value={dispatchDraft.phone}
              onChange={(event) => setDispatchDraft((current) => ({ ...current, phone: event.target.value }))}
            />
          </Field>
          <Field label="메시지">
            <textarea
              className="input textarea"
              value={dispatchDraft.message}
              onChange={(event) => setDispatchDraft((current) => ({ ...current, message: event.target.value }))}
            />
          </Field>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={dispatchDraft.markSent}
              onChange={(event) =>
                setDispatchDraft((current) => ({
                  ...current,
                  markSent: event.target.checked,
                }))
              }
            />
            <span>발송 완료로 표시하고 SMS 이력도 함께 기록</span>
          </label>
        </div>
      </Modal>
    </div>
  );
}

export function AdminReportOpenScreen({ reportKey }: { reportKey?: string }) {
  const router = useRouter();
  const { state } = useReverseApp();
  const [input, setInput] = useState(reportKey ?? '');
  const session = state.sessions.find((row) => row.id === reportKey);

  useEffect(() => {
    if (!session || !reportKey) {
      return;
    }
    const timeout = window.setTimeout(() => {
      router.replace(`/sessions/${encodeURIComponent(session.id)}`);
    }, 900);
    return () => window.clearTimeout(timeout);
  }, [reportKey, router, session]);

  return (
    <div className="screen-stack">
      <ScreenHeader
        eyebrow="/admin/report-open"
        title="Legacy Report Bootstrap"
        description="관리자 전용 기술지도 레거시 리포트를 structured session으로 주입한 뒤 `/sessions/[sessionId]`로 이동시키는 흐름을 모사합니다."
      />

      {!reportKey ? (
        <Panel title="리포트 키 입력" description="예시: legacy:alpha-2026-01">
          <div className="inline-actions">
            <input className="input" value={input} onChange={(event) => setInput(event.target.value)} />
            <button
              type="button"
              className={buttonClass('primary')}
              onClick={() => router.replace(`/admin/report-open?reportKey=${encodeURIComponent(input)}`)}
            >
              bootstrap
            </button>
          </div>
        </Panel>
      ) : session ? (
        <Panel title="구조화 세션 부트스트랩 성공" description={`대상 세션 ${session.id}`}>
          <StatGrid
            items={[
              { label: '세션', value: session.id },
              { label: '현장', value: session.siteName },
              { label: '리다이렉트', value: '900ms 후 /sessions 이동' },
            ]}
          />
          <Link href={`/sessions/${encodeURIComponent(session.id)}`} className={buttonClass('secondary')}>
            바로 열기
          </Link>
        </Panel>
      ) : (
        <Panel title="구조화 세션 부트스트랩 실패" description="스펙에 있는 PDF fallback을 단순화해 텍스트 미리보기로 대체했습니다.">
          <Notice message="구조화 세션을 찾지 못해 원본 PDF fallback으로 전환합니다." tone="warning" />
          <button
            type="button"
            className={buttonClass('primary')}
            onClick={() =>
              window.open(
                `data:text/plain;charset=utf-8,${encodeURIComponent(
                  `원본 PDF fallback\nreportKey=${reportKey}\n\n실서비스에서는 이 시점에 원본 PDF API를 호출합니다.`,
                )}`,
              )
            }
          >
            원본 PDF fallback 열기
          </button>
        </Panel>
      )}
    </div>
  );
}

