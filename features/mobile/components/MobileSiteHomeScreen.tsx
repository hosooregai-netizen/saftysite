'use client';

import Link from 'next/link';
import LoginPanel from '@/components/auth/LoginPanel';
import {
  getSessionGuidanceDate,
  getSessionProgress,
  getSessionSortTime,
  getSessionTitle,
} from '@/constants/inspectionSession';
import { useSiteReportListState } from '@/features/site-reports/hooks/useSiteReportListState';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { formatDateTime } from '@/lib/formatDateTime';
import { buildMobileHomeHref, buildMobileSiteReportsHref } from '@/features/home/lib/siteEntry';
import { MobileShell } from './MobileShell';
import styles from './MobileShell.module.css';

interface MobileSiteHomeScreenProps {
  siteKey: string;
}

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

function formatTelHref(value: string | null | undefined) {
  if (!value?.trim()) {
    return null;
  }

  const digits = value.replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : null;
}

function getReportSortTime(value: {
  createdAt: string;
  lastAutosavedAt: string | null;
  updatedAt: string;
  visitDate: string | null;
}) {
  return Math.max(
    value.lastAutosavedAt ? new Date(value.lastAutosavedAt).getTime() : 0,
    value.updatedAt ? new Date(value.updatedAt).getTime() : 0,
    value.createdAt ? new Date(value.createdAt).getTime() : 0,
    value.visitDate ? new Date(value.visitDate).getTime() : 0,
  );
}

export function MobileSiteHomeScreen({ siteKey }: MobileSiteHomeScreenProps) {
  const {
    authError,
    getSessionsBySiteId,
    isAuthenticated,
    isReady,
    login,
    logout,
  } = useInspectionSessions();
  const {
    currentSite,
    currentUser,
    reportIndexStatus,
    reportItems,
  } = useSiteReportListState(siteKey);

  if (!isReady) {
    return (
      <main className="app-page">
        <div className={styles.pageShell}>
          <div className={styles.content}>
            <section className={styles.stateCard}>
              <h1 className={styles.sectionTitle}>현장 정보를 불러오는 중입니다.</h1>
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
        title="현장 홈 로그인"
        description="현장별 최근 보고 상태를 확인하고 모바일 보고서 흐름으로 이동합니다."
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
              <Link href={buildMobileHomeHref()} className="app-button app-button-secondary">
                현장 목록으로 돌아가기
              </Link>
            </section>
          </div>
        </div>
      </main>
    );
  }

  const snapshot = currentSite.adminSiteSnapshot;
  const siteSessions = getSessionsBySiteId(currentSite.id);
  const latestSession =
    siteSessions.length > 0
      ? [...siteSessions].sort(
          (left, right) => getSessionSortTime(right) - getSessionSortTime(left),
        )[0]
      : null;
  const latestRemoteReport =
    reportItems.length > 0
      ? [...reportItems].sort(
          (left, right) => getReportSortTime(right) - getReportSortTime(left),
        )[0]
      : null;
  const reportCount = new Set([
    ...reportItems.map((item) => item.reportKey),
    ...siteSessions.map((session) => session.id),
  ]).size;
  const latestGuidanceDate = latestSession
    ? getSessionGuidanceDate(latestSession)
    : latestRemoteReport?.visitDate || '';
  const latestReportTitle = latestSession
    ? getSessionTitle(latestSession)
    : latestRemoteReport?.reportTitle || '';
  const latestReportProgress = latestSession
    ? getSessionProgress(latestSession).percentage
    : clampProgress(latestRemoteReport?.progressRate);
  const latestReportSavedAt = latestSession
    ? latestSession.lastSavedAt || latestSession.updatedAt
    : latestRemoteReport?.lastAutosavedAt || latestRemoteReport?.updatedAt || null;
  const managerPhone = snapshot.siteManagerPhone.trim();
  const managerPhoneHref = formatTelHref(managerPhone);

  return (
    <MobileShell
      backHref={buildMobileHomeHref()}
      backLabel="현장 목록"
      currentUserName={currentUser?.name}
      footer={
        <>
          <Link
            href={buildMobileSiteReportsHref(currentSite.id)}
            className={`app-button app-button-primary ${styles.footerPrimary}`}
          >
            보고서 목록 보기
          </Link>
          {managerPhoneHref ? (
            <a
              href={managerPhoneHref}
              className={`app-button app-button-secondary ${styles.footerSecondary}`}
            >
              현장소장 전화
            </a>
          ) : (
            <span className={`${styles.footerSecondary} ${styles.footerMeta}`}>
              현장소장 연락처 미등록
            </span>
          )}
        </>
      }
      kicker="현장 홈"
      onLogout={logout}
      subtitle={snapshot.siteAddress || null}
      title={currentSite.siteName}
      webHref={`/sites/${encodeURIComponent(currentSite.id)}/entry`}
      webLabel="웹에서 현장 보기"
    >
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleWrap}>
            <span className={styles.sectionEyebrow}>현장 요약</span>
            <h2 className={styles.sectionTitle}>보고서 중심 현장 홈</h2>
          </div>
          <span className={styles.sectionMeta}>
            {reportIndexStatus === 'loading' ? '목록 동기화 중' : '현장 수행 최소 기능'}
          </span>
        </div>

        <div className={styles.statGrid}>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>보고서</span>
            <strong className={styles.statValue}>{reportCount}</strong>
            <span className={styles.statMeta}>기술지도 누적 보고서</span>
          </article>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>최근 지도일</span>
            <strong className={styles.statValue}>{formatCompactDate(latestGuidanceDate)}</strong>
            <span className={styles.statMeta}>최근 작업 기준</span>
          </article>
        </div>
      </section>

      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleWrap}>
            <span className={styles.sectionEyebrow}>현장 정보</span>
            <h2 className={styles.sectionTitle}>현장 완료에 필요한 기본 정보</h2>
          </div>
        </div>

        <div className={styles.infoList}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>고객사</span>
            <strong className={styles.infoValue}>{currentSite.customerName || '-'}</strong>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>공사 기간</span>
            <strong className={styles.infoValue}>{snapshot.constructionPeriod || '-'}</strong>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>공사 금액</span>
            <strong className={styles.infoValue}>{snapshot.constructionAmount || '-'}</strong>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>담당자</span>
            <strong className={styles.infoValue}>{currentSite.assigneeName || '-'}</strong>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>현장소장</span>
            <strong className={styles.infoValue}>{snapshot.siteManagerName || '-'}</strong>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>연락처</span>
            <strong className={styles.infoValue}>{managerPhone || '-'}</strong>
          </div>
        </div>
      </section>

      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleWrap}>
            <span className={styles.sectionEyebrow}>최근 보고 현황</span>
            <h2 className={styles.sectionTitle}>이어 작성할 보고서</h2>
          </div>
        </div>

        {latestReportTitle ? (
          <article className={styles.reportCard}>
            <div className={styles.cardTop}>
              <div className={styles.cardTitleWrap}>
                <span className={styles.cardKicker}>최근 보고서</span>
                <h3 className={styles.cardTitle}>{latestReportTitle}</h3>
                <span className={styles.cardSubTitle}>
                  마지막 저장 {formatDateTime(latestReportSavedAt)}
                </span>
              </div>
              <span className={styles.roundBadge}>{latestReportProgress}%</span>
            </div>

            <div className={styles.progressBlock}>
              <div className={styles.progressHeader}>
                <span className={styles.progressLabel}>작성 진행률</span>
                <strong className={styles.progressValue}>{latestReportProgress}%</strong>
              </div>
              <div className={styles.progressTrack} aria-hidden="true">
                <span
                  className={styles.progressFill}
                  style={{ width: `${latestReportProgress}%` }}
                />
              </div>
            </div>

            <p className={styles.inlineNotice}>
              모바일 v1은 보고서 중심 흐름만 제공합니다. 일정, 사진첩, 기타 부가 기능은 웹에서
              계속 사용할 수 있습니다.
            </p>
          </article>
        ) : (
          <p className={styles.inlineNotice}>
            아직 이 현장에 작성된 기술지도 보고서가 없습니다. 보고서 목록에서 첫 보고서를
            추가해 주세요.
          </p>
        )}
      </section>
    </MobileShell>
  );
}
