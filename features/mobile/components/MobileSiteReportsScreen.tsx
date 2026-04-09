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
    return '작성 완료';
  }

  if (progressRate > 0) {
    return '작성 중';
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
    <article className={styles.reportCard}>
      <div className={styles.cardTop}>
        <div className={styles.cardTitleWrap}>
          <span className={styles.cardKicker}>기술지도 보고서</span>
          <h2 className={styles.cardTitle}>{item.reportTitle}</h2>
          <span className={styles.cardSubTitle}>
            마지막 저장 {formatDateTime(item.lastAutosavedAt || item.updatedAt)}
          </span>
        </div>
        <span className={styles.roundBadge}>{item.visitRound ? `${item.visitRound}차` : '-'}</span>
      </div>

      <div className={styles.metaGrid}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>지도일</span>
          <strong className={styles.metaValue}>{formatCompactDate(item.visitDate)}</strong>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>작성자</span>
          <strong className={styles.metaValue}>
            {getDrafterDisplay(item, assignedUserDisplay, fallbackAssignee)}
          </strong>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>진행 상태</span>
          <strong className={styles.metaValue}>{getProgressLabel(progressRate)}</strong>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>최종 갱신</span>
          <strong className={styles.metaValue}>
            {formatDateTime(item.lastAutosavedAt || item.updatedAt)}
          </strong>
        </div>
      </div>

      <div className={styles.progressBlock}>
        <div className={styles.progressHeader}>
          <span className={styles.progressLabel}>모바일 핵심 섹션 진행률</span>
          <strong className={styles.progressValue}>{progressRate}%</strong>
        </div>
        <div className={styles.progressTrack} aria-hidden="true">
          <span className={styles.progressFill} style={{ width: `${progressRate}%` }} />
        </div>
      </div>

      <div className={styles.cardActions}>
        <Link
          href={buildMobileSessionHref(item.reportKey)}
          className={`app-button app-button-primary ${styles.cardActionPrimary}`}
        >
          이어서 작성
        </Link>
        {canArchiveReports ? (
          <button
            type="button"
            className={`app-button app-button-danger ${styles.cardActionSecondary}`}
            onClick={() => onDeleteRequest(item.reportKey)}
          >
            삭제
          </button>
        ) : null}
      </div>
    </article>
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
        footer={
          <>
            <button
              type="button"
              className={`app-button app-button-primary ${styles.footerPrimary}`}
              onClick={openCreateDialog}
              disabled={!canCreateReport}
            >
              보고서 추가
            </button>
            <Link
              href={buildMobileSiteHomeHref(currentSite.id)}
              className={`app-button app-button-secondary ${styles.footerSecondary}`}
            >
              현장 홈
            </Link>
          </>
        }
        kicker="기술지도 보고서"
        onLogout={logout}
        subtitle="모바일에서는 핵심 섹션 중심으로 이어서 편집합니다."
        title={currentSite.siteName}
        webHref={`/sites/${encodeURIComponent(currentSite.id)}`}
      >
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleWrap}>
              <span className={styles.sectionEyebrow}>목록 요약</span>
              <h2 className={styles.sectionTitle}>현장 보고서 인덱스</h2>
            </div>
            <span className={styles.sectionMeta}>
              {reportIndexStatus === 'loading' ? '목록 동기화 중' : `${reportItems.length}건`}
            </span>
          </div>

          <div className={styles.statGrid}>
            <article className={styles.statCard}>
              <span className={styles.statLabel}>총 보고서</span>
              <strong className={styles.statValue}>{reportItems.length}</strong>
              <span className={styles.statMeta}>현장 기준 전체 문서</span>
            </article>
            <article className={styles.statCard}>
              <span className={styles.statLabel}>최근 갱신</span>
              <strong className={styles.statValue}>{formatCompactDate(latestUpdatedAt)}</strong>
              <span className={styles.statMeta}>
                {latestUpdatedAt ? formatDateTime(latestUpdatedAt) : '기록 없음'}
              </span>
            </article>
          </div>
        </section>

        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleWrap}>
              <span className={styles.sectionEyebrow}>목록 제어</span>
              <h2 className={styles.sectionTitle}>검색과 정렬</h2>
            </div>
          </div>

          <div className={styles.filterRow}>
            <input
              className="app-input"
              placeholder="차수, 제목, 지도일, 작성자로 검색"
              value={reportQuery}
              onChange={(event) => setReportQuery(event.target.value)}
            />
            <select
              className="app-select"
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
        </section>

        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleWrap}>
              <span className={styles.sectionEyebrow}>보고서 목록</span>
              <h2 className={styles.sectionTitle}>모바일 편집 대상</h2>
            </div>
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
