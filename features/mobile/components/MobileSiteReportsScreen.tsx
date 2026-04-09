'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import AppModal from '@/components/ui/AppModal';
import LoginPanel from '@/components/auth/LoginPanel';
import { useSiteReportListState, type SiteReportSortMode } from '@/features/site-reports/hooks/useSiteReportListState';
import { buildMobileSessionHref, buildMobileSiteHomeHref } from '@/features/home/lib/siteEntry';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { formatDateTime } from '@/lib/formatDateTime';
import type { InspectionReportListItem } from '@/types/inspectionSession';
import { MobileShell } from './MobileShell';
import { MobileTabBar } from './MobileTabBar';
import { buildSiteTabs } from '../lib/buildSiteTabs';
import styles from './MobileShell.module.css';

interface MobileSiteReportsScreenProps {
  siteKey: string;
}

interface CreateReportFormState {
  reportDate: string;
  reportTitle: string;
}

const EMPTY_CREATE_FORM: CreateReportFormState = {
  reportDate: '',
  reportTitle: '',
};

function clampProgress(value: number | null | undefined) {
  return Math.max(0, Math.min(100, Math.round(value ?? 0)));
}

function formatCompactDate(value: string | null | undefined) {
  if (!value?.trim()) {
    return '미기록';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
  }).format(parsed);
}

function getReportSortTime(item: InspectionReportListItem) {
  return Math.max(
    item.lastAutosavedAt ? new Date(item.lastAutosavedAt).getTime() : 0,
    item.updatedAt ? new Date(item.updatedAt).getTime() : 0,
    item.createdAt ? new Date(item.createdAt).getTime() : 0,
    item.visitDate ? new Date(item.visitDate).getTime() : 0,
  );
}

function getProgressLabel(progressRate: number) {
  if (progressRate >= 100) {
    return '완료';
  }
  if (progressRate > 0) {
    return '작성중';
  }
  return '미작성';
}

function getDrafterDisplay(
  item: InspectionReportListItem,
  assignedUserDisplay: string | undefined,
  fallbackAssignee: string,
) {
  return (
    (typeof item.meta.drafter === 'string' && item.meta.drafter.trim()) ||
    assignedUserDisplay ||
    fallbackAssignee ||
    '미지정'
  );
}

function ReportCard({
  assignedUserDisplay,
  canArchiveReports,
  fallbackAssignee,
  item,
  onDeleteRequest,
}: {
  assignedUserDisplay: string | undefined;
  canArchiveReports: boolean;
  fallbackAssignee: string;
  item: InspectionReportListItem;
  onDeleteRequest: (reportKey: string) => void;
}) {
  const progressRate = clampProgress(item.progressRate);

  return (
    <Link href={buildMobileSessionHref(item.reportKey)} style={{ textDecoration: 'none', color: 'inherit' }}>
      <article className={styles.reportCard} style={{ cursor: 'pointer', padding: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <span className={styles.roundBadge} style={{ minWidth: 'auto', height: '24px', minHeight: '24px', padding: '0 8px', fontSize: '12px', flexShrink: 0 }}>
              {item.visitRound ? `${item.visitRound}차` : '-'}
            </span>
            <h2 className={styles.cardTitle} style={{ fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.reportTitle}
            </h2>
          </div>
          {canArchiveReports && (
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '13px', padding: '4px', cursor: 'pointer', flexShrink: 0 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDeleteRequest(item.reportKey);
              }}
            >
              삭제
            </button>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: '#475569' }}>
              <strong style={{ fontWeight: 600, color: '#0f172a' }}>지도일</strong> {formatCompactDate(item.visitDate)}
            </span>
            <span style={{ fontSize: '13px', color: '#475569' }}>
              <strong style={{ fontWeight: 600, color: '#0f172a' }}>작성</strong> {getDrafterDisplay(item, assignedUserDisplay, fallbackAssignee)}
            </span>
          </div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
            {getProgressLabel(progressRate)}
          </span>
        </div>
      </article>
    </Link>
  );
}

export function MobileSiteReportsScreen({ siteKey }: MobileSiteReportsScreenProps) {
  const {
    authError,
    isAuthenticated,
    isReady,
    login,
    logout,
  } = useInspectionSessions();
  const {
    assignedUserDisplay,
    canArchiveReports,
    canCreateReport,
    createReport,
    currentSite,
    currentUser,
    deleteSession,
    filteredReportItems,
    getCreateReportTitleSuggestion,
    reloadReportIndex,
    reportIndexError,
    reportIndexStatus,
    reportItems,
    reportQuery,
    reportSortMode,
    setReportQuery,
    setReportSortMode,
  } = useSiteReportListState(siteKey, {
    buildReportHref: buildMobileSessionHref,
  });
  const [dialogSessionId, setDialogSessionId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateReportFormState>(EMPTY_CREATE_FORM);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [hasEditedCreateTitle, setHasEditedCreateTitle] = useState(false);
  const [isCreatingReport, setIsCreatingReport] = useState(false);
  const [isDeletingReport, setIsDeletingReport] = useState(false);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const latestUpdatedReport =
    reportItems.length > 0
      ? [...reportItems].sort(
          (left, right) => getReportSortTime(right) - getReportSortTime(left),
        )[0]
      : null;
  const latestUpdatedAt =
    latestUpdatedReport?.lastAutosavedAt || latestUpdatedReport?.updatedAt || null;
  const deletingSession = dialogSessionId
    ? reportItems.find((item) => item.reportKey === dialogSessionId) ?? null
    : null;

  const resetCreateDialog = () => {
    setCreateForm(EMPTY_CREATE_FORM);
    setCreateError(null);
    setHasEditedCreateTitle(false);
  };

  const openCreateDialog = () => {
    if (!canCreateReport) {
      return;
    }

    setCreateForm({
      reportDate: today,
      reportTitle: getCreateReportTitleSuggestion(today),
    });
    setCreateError(null);
    setHasEditedCreateTitle(false);
    setIsCreateDialogOpen(true);
  };

  const closeCreateDialog = () => {
    setIsCreateDialogOpen(false);
    resetCreateDialog();
  };

  const handleCreateDateChange = (value: string) => {
    setCreateError(null);
    setCreateForm((current) => {
      const next = { ...current, reportDate: value };

      if (hasEditedCreateTitle) {
        return next;
      }

      return {
        ...next,
        reportTitle: value ? getCreateReportTitleSuggestion(value) : '',
      };
    });
  };

  const handleCreateTitleChange = (value: string) => {
    setCreateError(null);
    setCreateForm((current) => ({
      ...current,
      reportTitle: value,
    }));
    setHasEditedCreateTitle(value.trim().length > 0);
  };

  const handleCreateSubmit = async () => {
    const reportDate = createForm.reportDate.trim();
    const reportTitle = createForm.reportTitle.trim();

    if (!reportDate) {
      setCreateError('지도일을 입력해 주세요.');
      return;
    }

    if (!reportTitle) {
      setCreateError('제목을 입력해 주세요.');
      return;
    }

    try {
      setIsCreatingReport(true);
      await createReport({
        reportDate,
        reportTitle,
      });
      closeCreateDialog();
    } catch (error) {
      setCreateError(
        error instanceof Error ? error.message : '보고서 생성 중 오류가 발생했습니다.',
      );
    } finally {
      setIsCreatingReport(false);
    }
  };

  const closeDeleteDialog = () => {
    setDialogSessionId(null);
    setDeleteError(null);
  };

  const handleDeleteSubmit = async () => {
    if (!dialogSessionId) {
      return;
    }

    try {
      setIsDeletingReport(true);
      setDeleteError(null);
      await deleteSession(dialogSessionId);
      closeDeleteDialog();
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : '보고서 삭제 중 오류가 발생했습니다.',
      );
    } finally {
      setIsDeletingReport(false);
    }
  };

  if (!isReady) {
    return (
      <main className="app-page">
        <div className={styles.pageShell}>
          <div className={styles.content}>
            <section className={styles.stateCard}>
              <h1 className={styles.sectionTitle}>보고서 목록을 준비하는 중입니다.</h1>
            </section>
          </div>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginPanel
        error={authError}
        onSubmit={login}
        title="모바일 보고서 로그인"
        description="현장별 기술지도 보고서를 추가하고 핵심 섹션 중심으로 바로 작성합니다."
      />
    );
  }

  if (!currentSite) {
    return (
      <main className="app-page">
        <div className={styles.pageShell}>
          <div className={styles.content}>
            <section className={styles.stateCard}>
              <h1 className={styles.sectionTitle}>현장을 찾을 수 없습니다.</h1>
              <Link href="/mobile" className="app-button app-button-secondary">
                현장 목록으로 돌아가기
              </Link>
            </section>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
    <MobileShell
      backHref={buildMobileSiteHomeHref(currentSite.id)}
      backLabel="현장 홈"
      currentUserName={currentUser?.name}
      tabBar={<MobileTabBar tabs={buildSiteTabs(currentSite.id)} />}
      onLogout={logout}
      title={currentSite.siteName}
      webHref={`/sites/${encodeURIComponent(currentSite.id)}`}
    >
      <section className={styles.sectionCard} style={{ padding: '16px 12px' }}>
        <div className={styles.sectionHeader} style={{ paddingBottom: '12px' }}>
          <div className={styles.sectionTitleWrap}>
            <h2 className={styles.sectionTitle}>현장 보고서 요약</h2>
          </div>
          <span className={styles.sectionMeta}>
            {reportIndexStatus === 'loading' ? '목록 동기화 중' : `총 ${reportItems.length}건 / 검색 ${filteredReportItems.length}건`}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input
            className="app-input"
            style={{ flex: 1, minWidth: 0, fontSize: '13px' }}
            placeholder="차수, 제목, 지도일, 작성자로 검색"
            value={reportQuery}
            onChange={(event) => setReportQuery(event.target.value)}
          />
          <select
            className="app-select"
            style={{ width: '100px', flexShrink: 0, fontSize: '13px', padding: '0 8px' }}
            value={reportSortMode}
            onChange={(event) =>
              setReportSortMode(event.target.value as SiteReportSortMode)
            }
          >
            <option value="round">차수순</option>
            <option value="name">제목순</option>
            <option value="progress">진행률순</option>
          </select>
        </div>

        {reportIndexError ? (
          <div className={styles.errorNotice}>
            <p>{reportIndexError}</p>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={reloadReportIndex}
              disabled={reportIndexStatus === 'loading'}
            >
              다시 불러오기
            </button>
          </div>
        ) : null}

        {reportIndexStatus === 'loading' && reportItems.length === 0 ? (
          <p className={styles.inlineNotice}>보고서 목록을 불러오는 중입니다.</p>
        ) : reportItems.length === 0 ? (
          <div className={styles.cardStack}>
            <p className={styles.inlineNotice}>
              아직 작성된 보고서가 없습니다. 첫 보고서를 추가해 모바일 작성 흐름을 시작해 주세요.
            </p>
            <button
              type="button"
              className="app-button app-button-primary"
              onClick={openCreateDialog}
              disabled={!canCreateReport}
            >
              첫 보고서 추가
            </button>
          </div>
        ) : filteredReportItems.length === 0 ? (
          <p className={styles.inlineNotice}>
            검색 조건에 맞는 보고서가 없습니다. 검색어 또는 정렬을 바꿔 다시 확인해 주세요.
          </p>
        ) : (
          <div className={styles.cardStack}>
            {filteredReportItems.map((item) => (
              <ReportCard
                key={item.reportKey}
                assignedUserDisplay={assignedUserDisplay}
                canArchiveReports={canArchiveReports}
                fallbackAssignee={currentSite.assigneeName}
                item={item}
                onDeleteRequest={setDialogSessionId}
              />
            ))}
          </div>
        )}

        {reportItems.length > 0 && (
          <div style={{ paddingTop: '16px' }}>
            <button
              type="button"
              className="app-button app-button-primary"
              style={{ width: '100%' }}
              onClick={openCreateDialog}
              disabled={!canCreateReport}
            >
              + 보고서 추가
            </button>
          </div>
        )}
      </section>
      </MobileShell>

      <AppModal
        open={isCreateDialogOpen}
        title="기술지도 보고서 추가"
        size="large"
        onClose={closeCreateDialog}
        actions={
          <>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={closeCreateDialog}
            >
              취소
            </button>
            <button
              type="button"
              className="app-button app-button-primary"
              onClick={() => void handleCreateSubmit()}
              disabled={
                isCreatingReport || !createForm.reportDate || !createForm.reportTitle.trim()
              }
            >
              {isCreatingReport ? '추가 중...' : '추가'}
            </button>
          </>
        }
      >
        <div className={styles.filterRow}>
          <label className={styles.metaItem}>
            <span className={styles.metaLabel}>지도일</span>
            <input
              className="app-input"
              type="date"
              value={createForm.reportDate}
              onChange={(event) => handleCreateDateChange(event.target.value)}
            />
          </label>
          <label className={styles.metaItem}>
            <span className={styles.metaLabel}>제목</span>
            <input
              className="app-input"
              value={createForm.reportTitle}
              onChange={(event) => handleCreateTitleChange(event.target.value)}
              placeholder="예: 2026-04-09 보고서 3"
            />
          </label>
          {createError ? <p className={styles.errorNotice}>{createError}</p> : null}
        </div>
      </AppModal>

      <AppModal
        open={canArchiveReports && Boolean(dialogSessionId)}
        title="보고서 삭제"
        onClose={closeDeleteDialog}
        actions={
          <>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={closeDeleteDialog}
            >
              취소
            </button>
            <button
              type="button"
              className="app-button app-button-danger"
              onClick={() => void handleDeleteSubmit()}
              disabled={isDeletingReport}
            >
              {isDeletingReport ? '삭제 중...' : '삭제'}
            </button>
          </>
        }
      >
        <div className={styles.filterRow}>
          <p className={styles.inlineNotice}>
            {deletingSession
              ? `"${deletingSession.reportTitle}" 보고서를 삭제합니다.`
              : '선택한 보고서를 삭제합니다.'}
          </p>
          {deleteError ? <p className={styles.errorNotice}>{deleteError}</p> : null}
        </div>
      </AppModal>
    </>
  );
}
