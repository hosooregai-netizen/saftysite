'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  DEMO_NOW,
  DEMO_TODAY,
  accidentOptions,
  buildBadWorkplaceViolations,
  buildMonthCalendar,
  buildPhotoItemFromUpload,
  buildWindowErrorMessage,
  calculateSessionProgress,
  causativeAgentOptions,
  createBadWorkplaceDraft,
  createDefaultFinding,
  createQuarterlyDraft,
  createSessionDraft,
  cx,
  filterPhotos,
  formatCurrency,
  formatDate,
  formatDateTime,
  getEligibleScheduleRows,
  getNewestSiteSession,
  getSessionById,
  getSiteById,
  getSiteSessionsForQuarter,
  getSourceModeLabel,
  groupSchedulesByDate,
  parseReferenceLawTitles,
  recalculateBadWorkplaceDraft,
  recalculateQuarterlyDraft,
  riskOptions,
  sessionSteps,
  simulateDoc7AiPatch,
  sortSchedules,
} from '../domain';
import { useReverseApp } from '../state';
import type { BadWorkplaceReport, BadWorkplaceSourceMode, QuarterlyReport, SessionReport, Site } from '../types';
import { Badge, EmptyState, Field, Modal, Notice, Panel, ScreenHeader, StatGrid, buttonClass } from '../ui';

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));
    reader.readAsDataURL(file);
  });
}

function createAutoTitle(reportNumber: number, reportDate: string) {
  return `${reportNumber}차 기술지도 (${reportDate})`;
}

export function HomeScreen() {
  const { state } = useReverseApp();
  return (
    <div className="screen-stack">
      <ScreenHeader
        eyebrow="/"
        title="Reverse Rebuild"
        description="`docs/reverse-specs`의 기능 문서만을 기준으로 주요 흐름을 새 하위 앱에서 다시 구현한 데모입니다."
      />
      <StatGrid
        items={[
          { label: '현장', value: state.sites.length },
          { label: '일정', value: state.schedules.length },
          { label: '기술지도 세션', value: state.sessions.length },
          { label: '분기 보고서', value: state.quarterlyReports.length },
          { label: '취약 현장 통보서', value: state.badWorkplaceReports.length },
          { label: '사진 자산', value: state.photos.length },
        ]}
      />

      <div className="card-grid">
        {[
          ['/admin', '관리자 개요', '대시보드, 미발송, 자료 부족, 종료 임박'],
          ['/admin/schedules', '관리자 일정', '캘린더 + 큐 + 드래그 이동'],
          ['/admin/sites', '현장 목록', '필터, 수정, 배정, 기본 자료'],
          ['/admin/reports', '보고서 테이블', '리뷰/발송 모달과 벌크 액션'],
          ['/calendar', '작업자 일정', '내 일정 월간 캘린더'],
          ['/sites/site-alpha', '현장 허브', '기술지도 리스트 / 생성'],
          ['/sites/site-alpha/photos', '사진 앨범', '업로드 / legacy photo'],
          ['/sessions/session-alpha-02', '세션 에디터', 'step shell + doc7'],
          ['/mobile/sessions/session-alpha-02?action=direct-signature', '모바일 세션', 'direct-signature 모드 포함'],
          ['/sites/site-alpha/quarterly/2026-Q1', '분기 보고서', 'source sync + autosave'],
          ['/sites/site-beta/bad-workplace/2026-03', '취약 현장 통보서', 'source mode switching'],
        ].map(([href, title, description]) => (
          <Link key={href} href={href} className="route-card">
            <strong>{title}</strong>
            <p>{description}</p>
            <span className="route-card-link">{href}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function WorkerCalendarScreen({ initialSiteId }: { initialSiteId?: string }) {
  const { currentUser, state, updateSchedule } = useReverseApp();
  const [month, setMonth] = useState('2026-04');
  const [siteId, setSiteId] = useState(initialSiteId ?? '');
  const [selectedDate, setSelectedDate] = useState('');
  const [dialog, setDialog] = useState({
    open: false,
    plannedDate: '',
    scheduleId: '',
    selectionReasonLabel: '',
    selectionReasonMemo: '',
  });
  const [notice, setNotice] = useState('');

  if (currentUser.role === 'admin') {
    return (
      <div className="screen-stack">
        <ScreenHeader eyebrow="/calendar" title="내 일정" description="관리자 계정은 작업자 캘린더 대신 관리자 일정 보드로 이동해야 합니다." />
        <Panel title="관리자 리다이렉트">
          <EmptyState
            title="관리자 계정 감지"
            description="스펙대로 관리자 계정은 `/admin/schedules`로 리다이렉트해야 하는 흐름입니다."
            action={
              <Link href="/admin/schedules" className={buttonClass('primary')}>
                관리자 일정 열기
              </Link>
            }
          />
        </Panel>
      </div>
    );
  }

  const rows = useMemo(
    () =>
      state.schedules.filter((row) => {
        const monthValue = row.plannedDate ?? row.windowStart;
        return (
          row.assigneeUserId === currentUser.id &&
          monthValue.startsWith(month) &&
          (!siteId || row.siteId === siteId)
        );
      }),
    [currentUser.id, month, siteId, state.schedules],
  );
  const unselectedRows = rows
    .filter((row) => !row.plannedDate)
    .sort((left, right) => left.roundNo - right.roundNo || left.siteName.localeCompare(right.siteName, 'ko'));
  const selectedRows = sortSchedules(rows.filter((row) => row.plannedDate));
  const visibleSelectedRows = selectedDate ? selectedRows.filter((row) => row.plannedDate === selectedDate) : selectedRows;
  const rowsByDate = groupSchedulesByDate(selectedRows);
  const calendar = buildMonthCalendar(month);
  const dialogEligibleRows = getEligibleScheduleRows(rows, dialog.plannedDate, dialog.scheduleId);
  const dialogSelectedRow = dialogEligibleRows.find((row) => row.id === dialog.scheduleId);
  const dialogWindowError = buildWindowErrorMessage(dialogSelectedRow, dialog.plannedDate);

  function openDialog(date: string, schedule?: { id: string; selectionReasonLabel?: string; selectionReasonMemo?: string }) {
    const selected = schedule ?? dialogEligibleRows[0];
    setDialog({
      open: true,
      plannedDate: date,
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
    const row = rows.find((item) => item.id === dialog.scheduleId);
    if (!row) {
      window.alert('선택한 회차를 찾지 못했습니다.');
      return;
    }
    updateSchedule(dialog.scheduleId, {
      plannedDate: dialog.plannedDate,
      selectionReasonLabel: dialog.selectionReasonLabel.trim(),
      selectionReasonMemo: dialog.selectionReasonMemo.trim(),
      status: 'selected',
    });
    setSelectedDate(dialog.plannedDate);
    setNotice(`${row.siteName} ${row.roundNo}회차 방문 일정과 사유를 저장했습니다.`);
    setDialog({ open: false, plannedDate: '', scheduleId: '', selectionReasonLabel: '', selectionReasonMemo: '' });
  }

  return (
    <div className="screen-stack">
      <ScreenHeader
        eyebrow="/calendar"
        title="내 일정"
        description="작업자 월간 캘린더, 미선택 회차, 선택 완료 일정, 방문일 선택 모달을 분리된 흐름으로 복원했습니다."
      />

      <Notice message={notice} />

      <StatGrid
        items={[
          { label: '미선택 회차', value: unselectedRows.length },
          { label: '선택 완료 일정', value: selectedRows.length },
          { label: '배정 현장', value: new Set(rows.map((row) => row.siteId)).size },
        ]}
      />

      <Panel title="필터" className="panel-tight">
        <div className="form-grid form-grid-3">
          <Field label="월">
            <input className="input" type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
          </Field>
          <Field label="현장">
            <select className="input" value={siteId} onChange={(event) => setSiteId(event.target.value)}>
              <option value="">전체 현장</option>
              {state.sites
                .filter((site) => site.assignedUserIds.includes(currentUser.id))
                .map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.siteName}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="선택 날짜">
            <div className="info-strip">{selectedDate || '없음'}</div>
          </Field>
        </div>
      </Panel>

      <div className="three-column">
        <Panel title="미선택 회차">
          <div className="stack-list">
            {unselectedRows.map((row) => (
              <article key={row.id} className="list-card">
                <div>
                  <strong>
                    {row.siteName} {row.roundNo}/{row.totalRounds}
                  </strong>
                  <p className="muted">
                    허용 창 {row.windowStart} ~ {row.windowEnd}
                  </p>
                </div>
                <button type="button" className={buttonClass('secondary')} onClick={() => openDialog(row.windowStart, row)}>
                  팝업에서 일정 지정
                </button>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="월간 캘린더">
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
                onClick={() => {
                  setSelectedDate(day.value);
                  openDialog(day.value);
                }}
              >
                <span className="calendar-day">{day.day}</span>
                <div className="calendar-chips">
                  {(rowsByDate[day.value] ?? []).slice(0, 3).map((row) => (
                    <span key={row.id} className="calendar-chip">
                      {row.roundNo}회차
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="선택 완료 일정">
          <div className="stack-list">
            {visibleSelectedRows.map((row) => (
              <article key={row.id} className="list-card">
                <div>
                  <strong>
                    {row.plannedDate} · {row.siteName}
                  </strong>
                  <p className="muted">
                    {row.selectionReasonLabel} / {row.selectionReasonMemo}
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
        title="방문 일정 선택"
        onClose={() => setDialog({ open: false, plannedDate: '', scheduleId: '', selectionReasonLabel: '', selectionReasonMemo: '' })}
        footer={
          <>
            <button
              type="button"
              className={buttonClass('ghost')}
              onClick={() => setDialog({ open: false, plannedDate: '', scheduleId: '', selectionReasonLabel: '', selectionReasonMemo: '' })}
            >
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
          <Field label="회차">
            <select
              className="input"
              value={dialog.scheduleId}
              onChange={(event) => setDialog((current) => ({ ...current, scheduleId: event.target.value }))}
            >
              <option value="">회차 선택</option>
              {dialogEligibleRows.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.siteName} {row.roundNo}회차
                </option>
              ))}
            </select>
          </Field>
          <Field label="사유 분류">
            <input
              className="input"
              value={dialog.selectionReasonLabel}
              onChange={(event) => setDialog((current) => ({ ...current, selectionReasonLabel: event.target.value }))}
            />
          </Field>
          <Field label="상세 메모">
            <textarea
              className="input textarea"
              value={dialog.selectionReasonMemo}
              onChange={(event) => setDialog((current) => ({ ...current, selectionReasonMemo: event.target.value }))}
            />
          </Field>
        </div>
        {dialogWindowError ? <Notice message={dialogWindowError} tone="warning" /> : null}
      </Modal>
    </div>
  );
}

export function SiteReportsScreen({ siteId, mobile }: { siteId: string; mobile: boolean }) {
  const router = useRouter();
  const { currentUser, state, createSession, deleteSession } = useReverseApp();
  const site = getSiteById(state, siteId);
  const [query, setQuery] = useState('');
  const [dispatchFilter, setDispatchFilter] = useState<'all' | 'sent' | 'unsent'>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [reportDate, setReportDate] = useState(DEMO_TODAY);
  const siteSessions = state.sessions.filter((session) => session.siteId === siteId).sort((left, right) => right.visitDate.localeCompare(left.visitDate));
  const nextReportNumber = Math.max(0, ...siteSessions.map((session) => session.reportNumber)) + 1;
  const [reportTitle, setReportTitle] = useState(createAutoTitle(nextReportNumber, DEMO_TODAY));
  const [deleteTarget, setDeleteTarget] = useState<string>('');
  const [notice, setNotice] = useState('');

  const filteredRows = siteSessions.filter((session) => {
    const matchesQuery =
      !query.trim() ||
      session.reportTitle.toLowerCase().includes(query.trim().toLowerCase()) ||
      session.visitDate.includes(query.trim());
    const matchesDispatch =
      dispatchFilter === 'all' ||
      (dispatchFilter === 'sent' && session.dispatch.sent) ||
      (dispatchFilter === 'unsent' && !session.dispatch.sent);
    return matchesQuery && matchesDispatch;
  });

  if (!site) {
    return (
      <div className="screen-stack">
        <ScreenHeader title="현장을 찾을 수 없습니다." />
      </div>
    );
  }

  function handleCreate() {
    if (!site) {
      return;
    }
    if (!reportDate) {
      window.alert('지도일을 입력해 주세요.');
      return;
    }
    if (!reportTitle.trim()) {
      window.alert('제목을 입력해 주세요.');
      return;
    }
    const draft = createSessionDraft(site, reportDate, reportTitle.trim(), nextReportNumber, currentUser);
    createSession(draft);
    setCreateOpen(false);
    router.push(mobile ? `/mobile/sessions/${encodeURIComponent(draft.id)}` : `/sessions/${encodeURIComponent(draft.id)}`);
  }

  const createHrefBase = mobile ? `/mobile/sites/${siteId}` : `/sites/${siteId}`;

  return (
    <div className="screen-stack">
      <ScreenHeader
        eyebrow={mobile ? '/mobile/sites/[site]' : '/sites/[site]'}
        title={site.siteName}
        description="기술지도 보고서 목록, 생성, 즉시 이동, 삭제 아카이브 흐름을 shared index 모델처럼 재구성했습니다."
        actions={
          <>
            <Link href={`${createHrefBase}/photos`} className={buttonClass('ghost')}>
              사진 앨범
            </Link>
            <Link href={`${createHrefBase}/quarterly/2026-Q1`} className={buttonClass('ghost')}>
              분기 보고서
            </Link>
            <Link href={`${createHrefBase}/bad-workplace/2026-04`} className={buttonClass('ghost')}>
              취약 현장
            </Link>
            <button type="button" className={buttonClass('primary')} onClick={() => setCreateOpen(true)}>
              새 기술지도
            </button>
          </>
        }
      />

      <Notice message={notice} />

      <StatGrid
        items={[
          { label: '보고서 수', value: siteSessions.length },
          { label: '다음 회차', value: `${nextReportNumber}회차` },
          { label: '담당자', value: site.guidanceOfficerName || '미배정' },
        ]}
      />

      <Panel title="목록 필터" className="panel-tight">
        <div className="form-grid form-grid-3">
          <Field label="검색">
            <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="제목 / 날짜" />
          </Field>
          <Field label="발송 상태">
            <select
              className="input"
              value={dispatchFilter}
              onChange={(event) => setDispatchFilter(event.target.value as 'all' | 'sent' | 'unsent')}
            >
              <option value="all">전체</option>
              <option value="sent">발송 완료</option>
              <option value="unsent">미발송</option>
            </select>
          </Field>
          <Field label="표시 수">
            <div className="info-strip">{filteredRows.length}건</div>
          </Field>
        </div>
      </Panel>

      <Panel title={mobile ? '모바일 보고서 카드' : '보고서 목록'}>
        <div className={mobile ? 'stack-list' : 'stack-list'}>
          {filteredRows.map((session) => (
            <article key={session.id} className="list-card list-card-vertical">
              <div>
                <strong>{session.reportTitle}</strong>
                <p className="muted">
                  {session.visitDate} · {session.reportNumber}회차 · 자동저장 {formatDateTime(session.lastAutosavedAt)}
                </p>
              </div>
              <div className="inline-actions">
                <Badge tone={session.dispatch.sent ? 'success' : 'warning'}>
                  {session.dispatch.sent ? '발송 완료' : '미발송'}
                </Badge>
                <Badge tone="accent">{session.progress}%</Badge>
              </div>
              <div className="inline-actions">
                <Link
                  href={mobile ? `/mobile/sessions/${encodeURIComponent(session.id)}` : `/sessions/${encodeURIComponent(session.id)}`}
                  className={buttonClass('secondary')}
                >
                  열기
                </Link>
                <button type="button" className={buttonClass('danger')} onClick={() => setDeleteTarget(session.id)}>
                  삭제
                </button>
              </div>
            </article>
          ))}
        </div>
      </Panel>

      <Modal
        open={createOpen}
        title="기술지도 생성"
        description="seed API 대신 현재 사이트/회차 규칙으로 로컬 초안 세션을 즉시 생성합니다."
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <button type="button" className={buttonClass('ghost')} onClick={() => setCreateOpen(false)}>
              취소
            </button>
            <button type="button" className={buttonClass('primary')} onClick={handleCreate}>
              생성 후 이동
            </button>
          </>
        }
      >
        <div className="form-grid">
          <Field label="지도일">
            <input
              className="input"
              type="date"
              value={reportDate}
              onChange={(event) => {
                setReportDate(event.target.value);
                setReportTitle(createAutoTitle(nextReportNumber, event.target.value));
              }}
            />
          </Field>
          <Field label="제목">
            <input className="input" value={reportTitle} onChange={(event) => setReportTitle(event.target.value)} />
          </Field>
        </div>
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        title="보고서 삭제"
        description="아카이브/삭제 흐름을 단순화해 실제 세션 목록에서 제거합니다."
        onClose={() => setDeleteTarget('')}
        footer={
          <>
            <button type="button" className={buttonClass('ghost')} onClick={() => setDeleteTarget('')}>
              취소
            </button>
            <button
              type="button"
              className={buttonClass('danger')}
              onClick={() => {
                deleteSession(deleteTarget);
                setDeleteTarget('');
                setNotice('보고서를 삭제했습니다.');
              }}
            >
              삭제
            </button>
          </>
        }
      >
        정말 삭제할까요?
      </Modal>
    </div>
  );
}

export function PhotoAlbumScreen({ siteId, mobile }: { siteId: string; mobile: boolean }) {
  const { addPhoto, currentUser, state } = useReverseApp();
  const site = getSiteById(state, siteId);
  const [query, setQuery] = useState('');
  const [source, setSource] = useState<'all' | 'album_upload' | 'legacy_import'>('all');
  const [visibleCount, setVisibleCount] = useState(6);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState('');
  const [notice, setNotice] = useState('');

  const filtered = useMemo(() => {
    const rows = filterPhotos(state.photos.filter((photo) => photo.siteId === siteId), query, source).sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    );
    return rows;
  }, [query, siteId, source, state.photos]);

  const visibleRows = filtered.slice(0, visibleCount);
  const activeItem = filtered.find((photo) => photo.id === activeId) ?? visibleRows[0];

  if (!site) {
    return <EmptyState title="현장을 찾을 수 없습니다." />;
  }

  async function handleUpload(file?: File | null) {
    if (!file || !site) {
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    const item = buildPhotoItemFromUpload(site, currentUser, dataUrl, file.name);
    addPhoto(item);
    setActiveId(item.id);
    setNotice(`${file.name} 업로드를 완료했습니다.`);
  }

  return (
    <div className="screen-stack">
      <ScreenHeader
        eyebrow={mobile ? '/mobile/sites/[site]/photos' : '/sites/[site]/photos'}
        title={`${site.siteName} 사진 앨범`}
        description="업로드 사진과 legacy import 사진을 한 목록에서 검색/미리보기/선택할 수 있게 구성했습니다."
        actions={
          <label className={buttonClass('primary')}>
            사진 업로드
            <input
              hidden
              type="file"
              accept="image/*"
              onChange={(event) => {
                void handleUpload(event.target.files?.[0]);
                event.currentTarget.value = '';
              }}
            />
          </label>
        }
      />

      <Notice message={notice} />

      <div className="two-column">
        <Panel title="앨범 목록">
          <div className="form-grid form-grid-3">
            <Field label="검색">
              <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="파일명 / 보고서" />
            </Field>
            <Field label="소스">
              <select className="input" value={source} onChange={(event) => setSource(event.target.value as 'all' | 'album_upload' | 'legacy_import')}>
                <option value="all">all</option>
                <option value="album_upload">album_upload</option>
                <option value="legacy_import">legacy_import</option>
              </select>
            </Field>
            <Field label="선택">
              <div className="info-strip">{selectedIds.length}건</div>
            </Field>
          </div>

          <div className="photo-grid">
            {visibleRows.map((photo) => (
              <article
                key={photo.id}
                className={cx('photo-card', activeItem?.id === photo.id && 'photo-card-active')}
                onClick={() => setActiveId(photo.id)}
              >
                <img src={photo.previewUrl} alt={photo.fileName} />
                <div className="photo-card-meta">
                  <div className="inline-actions">
                    <Badge tone={photo.sourceKind === 'legacy_import' ? 'warning' : 'accent'}>
                      {photo.sourceKind === 'legacy_import' ? '이관된 보고서 사진' : '업로드 사진'}
                    </Badge>
                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(photo.id)}
                        onChange={(event) =>
                          setSelectedIds((current) =>
                            event.target.checked
                              ? [...current, photo.id]
                              : current.filter((value) => value !== photo.id),
                          )
                        }
                      />
                    </label>
                  </div>
                  <strong>{photo.fileName}</strong>
                  <p className="muted">{formatDateTime(photo.createdAt)}</p>
                </div>
              </article>
            ))}
          </div>

          {filtered.length > visibleCount ? (
            <button type="button" className={buttonClass('ghost')} onClick={() => setVisibleCount((current) => current + 6)}>
              더 보기
            </button>
          ) : null}
        </Panel>

        <Panel title="미리보기" description={activeItem?.fileName}>
          {activeItem ? (
            <div className="preview-stack">
              <img src={activeItem.previewUrl} alt={activeItem.fileName} className="preview-image" />
              <div className="stack-list">
                <div className="info-strip">촬영 시각 {formatDateTime(activeItem.capturedAt)}</div>
                <div className="info-strip">업로더 {activeItem.uploadedByName ?? 'legacy import'}</div>
                <div className="info-strip">GPS {activeItem.gpsLatitude ? `${activeItem.gpsLatitude}, ${activeItem.gpsLongitude}` : '없음'}</div>
                {activeItem.sourceReportTitle ? <div className="info-strip">출처 {activeItem.sourceReportTitle}</div> : null}
              </div>
              <button
                type="button"
                className={buttonClass('secondary')}
                onClick={() => window.alert(`${selectedIds.length || 1}건 다운로드 데모`)}
              >
                다운로드
              </button>
            </div>
          ) : (
            <EmptyState title="표시할 사진이 없습니다." />
          )}
        </Panel>
      </div>
    </div>
  );
}

type SessionStepKey = (typeof sessionSteps)[number][0];

const stepToField: Record<SessionStepKey, keyof SessionReport['summary'] | 'doc7'> = {
  step2: 'overview',
  step3: 'siteScene',
  step4: 'previousGuidance',
  step5: 'totalComment',
  step6: 'deathFactors',
  step7: 'doc7',
  step8: 'futureProcess',
  step9: 'riskAssessment',
  step10: 'measurement',
  step11: 'education',
  step12: 'activity',
};

export function SessionScreen({
  sessionId,
  mobile,
  directSignature,
}: {
  sessionId: string;
  mobile: boolean;
  directSignature: boolean;
}) {
  const { addPhoto, currentUser, state, updateSession } = useReverseApp();
  const session = getSessionById(state, sessionId);
  const site = getSiteById(state, session?.siteId);
  const [activeStep, setActiveStep] = useState<SessionStepKey>('step2');
  const [notice, setNotice] = useState('');
  const [doc7AiLoadingId, setDoc7AiLoadingId] = useState('');
  const [doc7AiErrors, setDoc7AiErrors] = useState<Record<string, string>>({});
  const [documentInfoOpen, setDocumentInfoOpen] = useState(false);
  const [photoPicker, setPhotoPicker] = useState<{ findingId: string; slot: 'photoUrl' | 'photoUrl2' } | null>(null);
  const [photoQuery, setPhotoQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!session || !site) {
    return (
      <div className="screen-stack">
        <ScreenHeader title="세션을 찾을 수 없습니다." />
        <EmptyState title="세션이 없습니다." />
      </div>
    );
  }

  const activeSession = session;
  const activeSite = site;
  const sitePhotos = filterPhotos(state.photos.filter((photo) => photo.siteId === activeSite.id), photoQuery, 'all');

  function mutateSession(mutator: (current: SessionReport) => SessionReport) {
    updateSession(activeSession.id, (current) => {
      const next = mutator(current);
      return {
        ...next,
        progress: calculateSessionProgress(next),
        updatedAt: DEMO_NOW,
        lastAutosavedAt: DEMO_NOW,
      };
    });
  }

  async function handleAttachFile(file: File, findingId: string, slot: 'photoUrl' | 'photoUrl2') {
    const dataUrl = await readFileAsDataUrl(file);
    addPhoto(buildPhotoItemFromUpload(activeSite, currentUser, dataUrl, file.name));
    mutateSession((current) => ({
      ...current,
      document7Findings: current.document7Findings.map((finding) =>
        finding.id === findingId ? { ...finding, [slot]: dataUrl } : finding,
      ),
    }));
    setNotice(`${file.name}을(를) 첨부했습니다.`);
  }

  async function handleAiRefill(findingId: string) {
    const finding = activeSession.document7Findings.find((entry) => entry.id === findingId);
    if (!finding?.photoUrl) {
      setDoc7AiErrors((current) => ({ ...current, [findingId]: '사진 파일을 다시 불러오는 중 오류가 발생했습니다.' }));
      return;
    }
    setDoc7AiLoadingId(findingId);
    setDoc7AiErrors((current) => ({ ...current, [findingId]: '' }));
    await new Promise((resolve) => window.setTimeout(resolve, 400));
    try {
      const patch = simulateDoc7AiPatch(finding);
      mutateSession((current) => ({
        ...current,
        document7Findings: current.document7Findings.map((entry) =>
          entry.id === findingId ? { ...entry, ...patch } : entry,
        ),
      }));
      setNotice('문서7 AI 자동 채우기 결과를 적용했습니다.');
    } catch {
      setDoc7AiErrors((current) => ({ ...current, [findingId]: '문서7 AI 자동 채우기에 실패했습니다.' }));
    } finally {
      setDoc7AiLoadingId('');
    }
  }

  const stepField = stepToField[activeStep];

  return (
    <div className="screen-stack">
      <ScreenHeader
        eyebrow={mobile ? '/mobile/sessions/[sessionId]' : '/sessions/[sessionId]'}
        title={activeSession.reportTitle}
        description="모바일/웹 모두 같은 세션 데이터를 사용하고, step shell과 doc7 편집을 같은 모델 위에 올립니다."
        actions={
          <>
            {mobile ? (
              <Link href={`/sessions/${encodeURIComponent(activeSession.id)}`} className={buttonClass('ghost')}>
                Web 보기
              </Link>
            ) : null}
            <button type="button" className={buttonClass('secondary')} onClick={() => setDocumentInfoOpen(true)}>
              문서 정보
            </button>
            <button
              type="button"
              className={buttonClass('secondary')}
              onClick={() => {
                mutateSession((current) => current);
                setNotice('saveNow()를 호출한 것처럼 세션을 저장했습니다.');
              }}
            >
              저장
            </button>
            <button type="button" className={buttonClass('ghost')} onClick={() => window.alert('HWPX export')}>
              HWPX
            </button>
            <button type="button" className={buttonClass('ghost')} onClick={() => window.alert('PDF export')}>
              PDF
            </button>
          </>
        }
      />

      {directSignature ? <Notice message="direct-signature 액션 모드가 감지되어 서명 동선을 우선 강조합니다." tone="warning" /> : null}
      <Notice message={notice} />

      <Panel title="요약 바">
        <StatGrid
          items={[
            { label: '진행률', value: `${calculateSessionProgress(activeSession)}%`, tone: 'accent' },
            { label: '최근 저장', value: formatDateTime(activeSession.lastAutosavedAt) },
            { label: '현장', value: activeSession.siteName },
          ]}
        />
      </Panel>

      <Panel title="단계 탭">
        <div className="tab-row">
          {sessionSteps.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={cx('tab-button', activeStep === key && 'tab-button-active')}
              onClick={() => setActiveStep(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </Panel>

      {stepField === 'doc7' ? (
        <Panel title="현존 유해·위험요인 세부 지적" description="카드 단위 add/delete, 2개 사진 슬롯, AI refill, 수동 입력을 유지합니다.">
          <div className="stack-list">
            {activeSession.document7Findings.map((finding, index) => (
              <article key={finding.id} className="finding-card">
                <div className="finding-header">
                  <strong>지적사항 {index + 1}</strong>
                  <div className="inline-actions">
                    <button
                      type="button"
                      className={buttonClass('ghost')}
                      disabled={!finding.photoUrl || doc7AiLoadingId === finding.id}
                      onClick={() => {
                        void handleAiRefill(finding.id);
                      }}
                    >
                      {doc7AiLoadingId === finding.id ? 'AI 처리중' : 'AI 다시 채우기'}
                    </button>
                    <button
                      type="button"
                      className={buttonClass('danger')}
                      onClick={() =>
                        mutateSession((current) => ({
                          ...current,
                          document7Findings: current.document7Findings.filter((entry) => entry.id !== finding.id),
                        }))
                      }
                    >
                      삭제
                    </button>
                  </div>
                </div>

                <div className="photo-slot-row">
                  {(['photoUrl', 'photoUrl2'] as const).map((slot) => (
                    <div key={slot} className="photo-slot">
                      {finding[slot] ? <img src={finding[slot]} alt={`${slot} preview`} /> : <div className="photo-placeholder">사진 없음</div>}
                      <div className="inline-actions">
                        <label className={buttonClass('secondary')}>
                          파일
                          <input
                            hidden
                            type="file"
                            accept="image/*"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (file) {
                                void handleAttachFile(file, finding.id, slot);
                              }
                              event.currentTarget.value = '';
                            }}
                          />
                        </label>
                        <button type="button" className={buttonClass('ghost')} onClick={() => setPhotoPicker({ findingId: finding.id, slot })}>
                          앨범
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {doc7AiErrors[finding.id] ? <Notice message={doc7AiErrors[finding.id]} tone="danger" /> : null}

                <div className="form-grid form-grid-2">
                  <Field label="위치">
                    <input
                      className="input"
                      value={finding.location}
                      onChange={(event) =>
                        mutateSession((current) => ({
                          ...current,
                          document7Findings: current.document7Findings.map((entry) =>
                            entry.id === finding.id ? { ...entry, location: event.target.value } : entry,
                          ),
                        }))
                      }
                    />
                  </Field>
                  <Field label="재해형태">
                    <select
                      className="input"
                      value={finding.accidentType}
                      onChange={(event) =>
                        mutateSession((current) => ({
                          ...current,
                          document7Findings: current.document7Findings.map((entry) =>
                            entry.id === finding.id ? { ...entry, accidentType: event.target.value } : entry,
                          ),
                        }))
                      }
                    >
                      {accidentOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="위험도">
                    <select
                      className="input"
                      value={finding.riskLevel}
                      onChange={(event) =>
                        mutateSession((current) => ({
                          ...current,
                          document7Findings: current.document7Findings.map((entry) =>
                            entry.id === finding.id ? { ...entry, riskLevel: event.target.value } : entry,
                          ),
                        }))
                      }
                    >
                      {riskOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="기인물">
                    <select
                      className="input"
                      value={finding.causativeAgentKey}
                      onChange={(event) =>
                        mutateSession((current) => ({
                          ...current,
                          document7Findings: current.document7Findings.map((entry) =>
                            entry.id === finding.id ? { ...entry, causativeAgentKey: event.target.value } : entry,
                          ),
                        }))
                      }
                    >
                      {causativeAgentOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="유해요인">
                    <textarea
                      className="input textarea"
                      value={finding.hazardDescription}
                      onChange={(event) =>
                        mutateSession((current) => ({
                          ...current,
                          document7Findings: current.document7Findings.map((entry) =>
                            entry.id === finding.id ? { ...entry, hazardDescription: event.target.value } : entry,
                          ),
                        }))
                      }
                    />
                  </Field>
                  <Field label="개선요청사항">
                    <textarea
                      className="input textarea"
                      value={finding.improvementRequest}
                      onChange={(event) =>
                        mutateSession((current) => ({
                          ...current,
                          document7Findings: current.document7Findings.map((entry) =>
                            entry.id === finding.id
                              ? {
                                  ...entry,
                                  improvementRequest: event.target.value,
                                  improvementPlan: event.target.value,
                                }
                              : entry,
                          ),
                        }))
                      }
                    />
                  </Field>
                  <Field label="강조사항">
                    <textarea
                      className="input textarea"
                      value={finding.emphasis}
                      onChange={(event) =>
                        mutateSession((current) => ({
                          ...current,
                          document7Findings: current.document7Findings.map((entry) =>
                            entry.id === finding.id ? { ...entry, emphasis: event.target.value } : entry,
                          ),
                        }))
                      }
                    />
                  </Field>
                  <Field label="관련 법령">
                    <input
                      className="input"
                      value={finding.legalReferenceTitle}
                      onChange={(event) =>
                        mutateSession((current) => ({
                          ...current,
                          document7Findings: current.document7Findings.map((entry) =>
                            entry.id === finding.id
                              ? {
                                  ...entry,
                                  legalReferenceId: undefined,
                                  legalReferenceTitle: event.target.value,
                                  referenceLawTitles: parseReferenceLawTitles(event.target.value),
                                }
                              : entry,
                          ),
                        }))
                      }
                    />
                  </Field>
                </div>
              </article>
            ))}
          </div>
          <button
            type="button"
            className={buttonClass('secondary')}
            onClick={() =>
              mutateSession((current) => ({
                ...current,
                document7Findings: [
                  ...current.document7Findings,
                  createDefaultFinding(`finding-${current.id}-${Date.now()}`, current.drafterName),
                ],
              }))
            }
          >
            + 지적 사항 추가
          </button>
        </Panel>
      ) : (
        <Panel title={sessionSteps.find(([key]) => key === activeStep)?.[1] ?? '문서 내용'}>
          <textarea
            className="input textarea textarea-large"
            value={activeSession.summary[stepField]}
            onChange={(event) =>
              mutateSession((current) => ({
                ...current,
                summary: {
                  ...current.summary,
                  [stepField]: event.target.value,
                },
              }))
            }
          />
        </Panel>
      )}

      <Modal
        open={documentInfoOpen}
        title="문서 정보"
        onClose={() => setDocumentInfoOpen(false)}
        footer={
          <button type="button" className={buttonClass('primary')} onClick={() => setDocumentInfoOpen(false)}>
            확인
          </button>
        }
      >
        <StatGrid
          items={[
            { label: '세션 ID', value: activeSession.id },
            { label: '작성자', value: activeSession.drafterName },
            { label: '검토자', value: activeSession.reviewerName || '-' },
            { label: '승인자', value: activeSession.approverName || '-' },
          ]}
        />
      </Modal>

      <Modal
        open={Boolean(photoPicker)}
        title="현장 사진 선택"
        description="shared photo album 데이터를 세션 첨부 슬롯으로 연결합니다."
        onClose={() => setPhotoPicker(null)}
      >
        <div className="form-grid">
          <Field label="앨범 검색">
            <input className="input" value={photoQuery} onChange={(event) => setPhotoQuery(event.target.value)} />
          </Field>
        </div>
        <div className="photo-grid">
          {sitePhotos.map((photo) => (
            <button
              key={photo.id}
              type="button"
              className="photo-card photo-card-button"
              onClick={() => {
                if (!photoPicker) {
                  return;
                }
                mutateSession((current) => ({
                  ...current,
                  document7Findings: current.document7Findings.map((entry) =>
                    entry.id === photoPicker.findingId ? { ...entry, [photoPicker.slot]: photo.previewUrl } : entry,
                  ),
                }));
                setPhotoPicker(null);
              }}
            >
              <img src={photo.previewUrl} alt={photo.fileName} />
              <div className="photo-card-meta">
                <strong>{photo.fileName}</strong>
                <p className="muted">{photo.sourceKind}</p>
              </div>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}

export function QuarterlyScreen({ siteId, quarterKey, mobile }: { siteId: string; quarterKey: string; mobile: boolean }) {
  const { currentUser, state, upsertQuarterlyReport } = useReverseApp();
  const site = getSiteById(state, siteId);
  const sourceSessions = useMemo(() => getSiteSessionsForQuarter(state.sessions.filter((session) => session.siteId === siteId), quarterKey), [quarterKey, siteId, state.sessions]);
  const existingReport = state.quarterlyReports.find((report) => report.siteId === siteId && report.quarterKey === quarterKey);
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [draft, setDraft] = useState<QuarterlyReport | null>(existingReport ?? null);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>(existingReport?.generatedFromSessionIds ?? sourceSessions.map((session) => session.id));
  const autosaveRef = useRef(false);

  useEffect(() => {
    if (!site || existingReport) {
      return;
    }
    upsertQuarterlyReport(createQuarterlyDraft(site, quarterKey, currentUser.name, sourceSessions));
  }, [currentUser.name, existingReport, quarterKey, site, sourceSessions, upsertQuarterlyReport]);

  useEffect(() => {
    if (existingReport) {
      setDraft(existingReport);
      setSelectedSourceIds(existingReport.generatedFromSessionIds);
    }
  }, [existingReport]);

  useEffect(() => {
    if (!draft) {
      return;
    }
    if (!autosaveRef.current) {
      autosaveRef.current = true;
      return;
    }
    const timeout = window.setTimeout(() => {
      upsertQuarterlyReport({ ...draft, updatedAt: DEMO_NOW });
      setNotice('분기 보고서를 자동 저장했습니다.');
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [draft, upsertQuarterlyReport]);

  if (!site || !draft) {
    return <EmptyState title="분기 보고서 초안을 준비 중입니다." />;
  }

  return (
    <div className="screen-stack">
      <ScreenHeader
        eyebrow={mobile ? '/mobile/sites/[site]/quarterly/[quarter]' : '/sites/[site]/quarterly/[quarter]'}
        title={draft.title}
        description="source report 선택, 재계산, site snapshot 편집, autosave, HWPX/PDF 내보내기를 함께 복원했습니다."
        actions={
          <>
            <button type="button" className={buttonClass('secondary')} onClick={() => setSourceModalOpen(true)}>
              source reports
            </button>
            <button type="button" className={buttonClass('ghost')} onClick={() => window.alert('Quarterly HWPX export')}>
              HWPX
            </button>
            <button type="button" className={buttonClass('ghost')} onClick={() => window.alert('Quarterly PDF export')}>
              PDF
            </button>
          </>
        }
      />

      <Notice message={notice} />

      <StatGrid
        items={[
          { label: '선택 source', value: draft.generatedFromSessionIds.length },
          { label: '최근 계산', value: formatDateTime(draft.lastCalculatedAt) },
          { label: 'OPS asset', value: draft.opsAssetTitle || '없음' },
        ]}
      />

      <Panel title="문서 정보 / 현장 스냅샷">
        <div className="form-grid form-grid-2">
          <Field label="제목">
            <input className="input" value={draft.title} onChange={(event) => setDraft((current) => (current ? { ...current, title: event.target.value } : current))} />
          </Field>
          <Field label="작성자">
            <input className="input" value={draft.drafter} onChange={(event) => setDraft((current) => (current ? { ...current, drafter: event.target.value } : current))} />
          </Field>
          <Field label="검토자">
            <input className="input" value={draft.reviewer} onChange={(event) => setDraft((current) => (current ? { ...current, reviewer: event.target.value } : current))} />
          </Field>
          <Field label="승인자">
            <input className="input" value={draft.approver} onChange={(event) => setDraft((current) => (current ? { ...current, approver: event.target.value } : current))} />
          </Field>
          <Field label="현장소장">
            <input
              className="input"
              value={draft.siteSnapshot.siteManagerName}
              onChange={(event) =>
                setDraft((current) =>
                  current
                    ? {
                        ...current,
                        siteSnapshot: { ...current.siteSnapshot, siteManagerName: event.target.value },
                      }
                    : current,
                )
              }
            />
          </Field>
          <Field label="연락처">
            <input
              className="input"
              value={draft.siteSnapshot.siteManagerContact}
              onChange={(event) =>
                setDraft((current) =>
                  current
                    ? {
                        ...current,
                        siteSnapshot: { ...current.siteSnapshot, siteManagerContact: event.target.value },
                      }
                    : current,
                )
              }
            />
          </Field>
        </div>
      </Panel>

      <div className="two-column">
        <Panel title="이행 현황">
          <table className="table">
            <thead>
              <tr>
                <th>지도일</th>
                <th>보고서</th>
                <th>지적 수</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {draft.implementationRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.guidanceDate}</td>
                  <td>{row.reportTitle}</td>
                  <td>{row.findingCount}</td>
                  <td>{row.completionStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="통계 / OPS">
          <div className="stack-list">
            <div className="info-strip">재해형태: {draft.accidentStats.map((item) => `${item.label} ${item.value}`).join(', ') || '없음'}</div>
            <div className="info-strip">기인물: {draft.causativeStats.map((item) => `${item.label} ${item.value}`).join(', ') || '없음'}</div>
            <div className="info-strip">OPS: {draft.opsAssetDescription || '없음'}</div>
          </div>
        </Panel>
      </div>

      <div className="two-column">
        <Panel title="향후 계획">
          <textarea
            className="input textarea textarea-large"
            value={draft.futurePlans.join('\n')}
            onChange={(event) =>
              setDraft((current) =>
                current
                  ? {
                      ...current,
                      futurePlans: event.target.value.split('\n').map((line) => line.trim()).filter(Boolean),
                    }
                  : current,
              )
            }
          />
        </Panel>
        <Panel title="주요 조치">
          <textarea
            className="input textarea textarea-large"
            value={draft.majorMeasures.join('\n')}
            onChange={(event) =>
              setDraft((current) =>
                current
                  ? {
                      ...current,
                      majorMeasures: event.target.value.split('\n').map((line) => line.trim()).filter(Boolean),
                    }
                  : current,
              )
            }
          />
        </Panel>
      </div>

      <Modal
        open={sourceModalOpen}
        title="source report 선택"
        description="초기 draft는 분기 기간 내 기술지도 보고서를 모두 선택하고, 이후에는 명시 선택만 반영합니다."
        onClose={() => setSourceModalOpen(false)}
        footer={
          <>
            <button type="button" className={buttonClass('ghost')} onClick={() => setSourceModalOpen(false)}>
              취소
            </button>
            <button
              type="button"
              className={buttonClass('primary')}
              onClick={() => {
                setDraft((current) => (current ? recalculateQuarterlyDraft(current, sourceSessions, selectedSourceIds) : current));
                setSourceModalOpen(false);
                setNotice(selectedSourceIds.length > 0 ? `선택한 지도 보고서 ${selectedSourceIds.length}건을 반영했습니다.` : '선택한 지도 보고서가 없습니다.');
              }}
            >
              재계산
            </button>
          </>
        }
      >
        <div className="stack-list">
          {sourceSessions.map((session) => (
            <label key={session.id} className="checkbox-row">
              <input
                type="checkbox"
                checked={selectedSourceIds.includes(session.id)}
                onChange={(event) =>
                  setSelectedSourceIds((current) =>
                    event.target.checked ? [...current, session.id] : current.filter((value) => value !== session.id),
                  )
                }
              />
              <span>
                {session.visitDate} · {session.reportTitle}
              </span>
            </label>
          ))}
        </div>
      </Modal>
    </div>
  );
}

export function BadWorkplaceScreen({
  siteId,
  reportMonth,
  mobile,
}: {
  siteId: string;
  reportMonth: string;
  mobile: boolean;
}) {
  const { currentUser, state, upsertBadWorkplaceReport } = useReverseApp();
  const site = getSiteById(state, siteId);
  const sessions = state.sessions.filter((session) => session.siteId === siteId).sort((left, right) => right.visitDate.localeCompare(left.visitDate));
  const existingReport = state.badWorkplaceReports.find((report) => report.siteId === siteId && report.reportMonth === reportMonth);
  const [draft, setDraft] = useState<BadWorkplaceReport | null>(existingReport ?? null);
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [sourceMode, setSourceMode] = useState<BadWorkplaceSourceMode>(existingReport?.sourceMode ?? 'current_new_hazard');
  const [sourceSessionId, setSourceSessionId] = useState(existingReport?.sourceSessionId ?? sessions[0]?.id ?? '');
  const [notice, setNotice] = useState('');
  const autosaveRef = useRef(false);

  useEffect(() => {
    if (!site || existingReport) {
      return;
    }
    upsertBadWorkplaceReport(createBadWorkplaceDraft(site, reportMonth, currentUser, getNewestSiteSession(sessions)));
  }, [currentUser, existingReport, reportMonth, sessions, site, upsertBadWorkplaceReport]);

  useEffect(() => {
    if (existingReport) {
      setDraft(existingReport);
      setSourceMode(existingReport.sourceMode);
      setSourceSessionId(existingReport.sourceSessionId ?? '');
    }
  }, [existingReport]);

  useEffect(() => {
    if (!draft) {
      return;
    }
    if (!autosaveRef.current) {
      autosaveRef.current = true;
      return;
    }
    const timeout = window.setTimeout(() => {
      upsertBadWorkplaceReport({ ...draft, updatedAt: DEMO_NOW });
      setNotice('취약 현장 통보서를 자동 저장했습니다.');
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [draft, upsertBadWorkplaceReport]);

  if (!site || !draft) {
    return <EmptyState title="취약 현장 통보서 초안을 준비 중입니다." />;
  }

  return (
    <div className="screen-stack">
      <ScreenHeader
        eyebrow={mobile ? '/mobile/sites/[site]/bad-workplace/[month]' : '/sites/[site]/bad-workplace/[month]'}
        title={draft.title}
        description="source session 선택, source mode 전환, 위반 항목 편집, autosave, 문서 출력 흐름을 복원했습니다."
        actions={
          <>
            <button type="button" className={buttonClass('secondary')} onClick={() => setSourceModalOpen(true)}>
              source 설정
            </button>
            <button type="button" className={buttonClass('ghost')} onClick={() => window.alert('Bad workplace HWPX export')}>
              HWPX
            </button>
            <button type="button" className={buttonClass('ghost')} onClick={() => window.alert('Bad workplace PDF export')}>
              PDF
            </button>
          </>
        }
      />

      <Notice message={notice} />

      <StatGrid
        items={[
          { label: 'source mode', value: getSourceModeLabel(draft.sourceMode) },
          { label: '위반 수', value: draft.violations.length },
          { label: '진척률', value: `${draft.progressRate}%` },
        ]}
      />

      <Panel title="기본 정보">
        <div className="form-grid form-grid-2">
          <Field label="수신자">
            <input
              className="input"
              value={draft.receiverName}
              onChange={(event) => setDraft((current) => (current ? { ...current, receiverName: event.target.value } : current))}
            />
          </Field>
          <Field label="통보일">
            <input
              className="input"
              type="date"
              value={draft.notificationDate}
              onChange={(event) => setDraft((current) => (current ? { ...current, notificationDate: event.target.value } : current))}
            />
          </Field>
          <Field label="기관명">
            <input
              className="input"
              value={draft.agencyName}
              onChange={(event) => setDraft((current) => (current ? { ...current, agencyName: event.target.value } : current))}
            />
          </Field>
          <Field label="대표자">
            <input
              className="input"
              value={draft.agencyRepresentative}
              onChange={(event) => setDraft((current) => (current ? { ...current, agencyRepresentative: event.target.value } : current))}
            />
          </Field>
          <Field label="첨부 설명">
            <textarea
              className="input textarea"
              value={draft.attachmentDescription}
              onChange={(event) =>
                setDraft((current) => (current ? { ...current, attachmentDescription: event.target.value } : current))
              }
            />
          </Field>
        </div>
      </Panel>

      <Panel title="위반 항목">
        <table className="table">
          <thead>
            <tr>
              <th>법령</th>
              <th>위험 요인</th>
              <th>개선 조치</th>
              <th>미이행 내용</th>
            </tr>
          </thead>
          <tbody>
            {draft.violations.map((violation) => (
              <tr key={violation.id}>
                <td>
                  <input
                    className="input"
                    value={violation.legalReference}
                    onChange={(event) =>
                      setDraft((current) =>
                        current
                          ? {
                              ...current,
                              violations: current.violations.map((row) =>
                                row.id === violation.id ? { ...row, legalReference: event.target.value } : row,
                              ),
                            }
                          : current,
                      )
                    }
                  />
                </td>
                <td>
                  <textarea
                    className="input textarea"
                    value={violation.hazardFactor}
                    onChange={(event) =>
                      setDraft((current) =>
                        current
                          ? {
                              ...current,
                              violations: current.violations.map((row) =>
                                row.id === violation.id ? { ...row, hazardFactor: event.target.value } : row,
                              ),
                            }
                          : current,
                      )
                    }
                  />
                </td>
                <td>
                  <textarea
                    className="input textarea"
                    value={violation.improvementMeasure}
                    onChange={(event) =>
                      setDraft((current) =>
                        current
                          ? {
                              ...current,
                              violations: current.violations.map((row) =>
                                row.id === violation.id ? { ...row, improvementMeasure: event.target.value } : row,
                              ),
                            }
                          : current,
                      )
                    }
                  />
                </td>
                <td>
                  <textarea
                    className="input textarea"
                    value={violation.nonCompliance}
                    onChange={(event) =>
                      setDraft((current) =>
                        current
                          ? {
                              ...current,
                              violations: current.violations.map((row) =>
                                row.id === violation.id ? { ...row, nonCompliance: event.target.value } : row,
                              ),
                            }
                          : current,
                      )
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Modal
        open={sourceModalOpen}
        title="source 설정"
        description="source mode 전환 시 현재 선택된 세션 기준으로 violation row를 다시 생성합니다."
        onClose={() => setSourceModalOpen(false)}
        footer={
          <>
            <button type="button" className={buttonClass('ghost')} onClick={() => setSourceModalOpen(false)}>
              취소
            </button>
            <button
              type="button"
              className={buttonClass('primary')}
              onClick={() => {
                const sourceSession = sessions.find((session) => session.id === sourceSessionId);
                setDraft((current) => (current ? recalculateBadWorkplaceDraft(current, sourceSession, sourceMode) : current));
                setSourceModalOpen(false);
                setNotice(`${getSourceModeLabel(sourceMode)} 기준으로 위반 항목을 재구성했습니다.`);
              }}
            >
              적용
            </button>
          </>
        }
      >
        <div className="form-grid">
          <Field label="source mode">
            <select className="input" value={sourceMode} onChange={(event) => setSourceMode(event.target.value as BadWorkplaceSourceMode)}>
              <option value="previous_unresolved">이전 지적사항 미이행</option>
              <option value="current_new_hazard">당회차 신규 위험</option>
            </select>
          </Field>
          <Field label="source session">
            <select className="input" value={sourceSessionId} onChange={(event) => setSourceSessionId(event.target.value)}>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.visitDate} · {session.reportTitle}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Modal>
    </div>
  );
}
