'use client';

import Link from 'next/link';
import LoginPanel from '@/components/auth/LoginPanel';
import {
  getSessionGuidanceDate,
  getSessionProgress,
  getSessionSortTime,
  getSessionTitle,
} from '@/constants/inspectionSession';
import {
  buildMobileHomeHref,
  buildMobileSessionHref,
  buildMobileSiteReportsHref,
} from '@/features/home/lib/siteEntry';
import { useSiteReportListState } from '@/features/site-reports/hooks/useSiteReportListState';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { MobileShell } from './MobileShell';
import styles from './MobileShell.module.css';
import { MobileTabBar } from './MobileTabBar';
import { buildSiteTabs } from '../lib/buildSiteTabs';

interface MobileSiteHomeScreenProps {
  siteKey: string;
}

function clampProgress(value: number | null | undefined) {
  return Math.max(0, Math.min(100, Math.round(value ?? 0)));
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

function formatMailHref(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed || !trimmed.includes('@')) {
    return null;
  }

  return `mailto:${trimmed}`;
}

function getDisplayValue(value: string | null | undefined) {
  return value?.trim() || '-';
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
        title="현장 앱 로그인"
        description="현장별 최신 보고 상태를 확인하고 모바일 보고서 흐름으로 이동합니다."
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
  const managerPhone = snapshot.siteManagerPhone.trim();
  const managerPhoneHref = formatTelHref(managerPhone);
  const siteContact = snapshot.siteContactEmail.trim();
  const siteContactHref = formatMailHref(siteContact) ?? formatTelHref(siteContact);
  const headquartersContact = snapshot.headquartersContact.trim();
  const headquartersContactHref = formatTelHref(headquartersContact);
  const showSiteContact = siteContact.length > 0 && siteContact !== managerPhone;

  return (
    <MobileShell
      backHref={buildMobileHomeHref()}
      backLabel="현장 목록"
      currentUserName={currentUser?.name}
      tabBar={<MobileTabBar tabs={buildSiteTabs(currentSite.id)} />}
      onLogout={logout}
      subtitle={snapshot.siteAddress || null}
      title={currentSite.siteName}
      webHref={`/sites/${encodeURIComponent(currentSite.id)}/entry`}
      webLabel="웹에서 현장 보기"
    >
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleWrap}>
            <h2 className={styles.sectionTitle}>현장 요약</h2>
          </div>
          <span className={styles.sectionMeta}>
            {reportIndexStatus === 'loading' ? '목록 동기화 중' : ''}
          </span>
        </div>

        <div className={styles.statGrid}>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>총 보고서</span>
            <strong className={styles.statValue}>{reportCount}</strong>
          </article>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>최근 지도일</span>
            <strong className={styles.statValue}>{formatCompactDate(latestGuidanceDate)}</strong>
          </article>
        </div>
      </section>

      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleWrap}>
            <h2 className={styles.sectionTitle}>현장 정보</h2>
          </div>
        </div>

        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>현장 관리번호</span>
            <strong className={styles.metaValue}>{getDisplayValue(snapshot.siteManagementNumber)}</strong>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>사업개시번호</span>
            <strong className={styles.metaValue}>{getDisplayValue(snapshot.businessStartNumber)}</strong>
          </div>
        </div>

        <div className={styles.infoList}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>고객사</span>
            <strong className={styles.infoValue}>{getDisplayValue(currentSite.customerName)}</strong>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>현장 주소</span>
            <strong className={styles.infoValue}>{getDisplayValue(snapshot.siteAddress)}</strong>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>공사 기간</span>
            <strong className={styles.infoValue}>{getDisplayValue(snapshot.constructionPeriod)}</strong>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>공사 금액</span>
            <strong className={styles.infoValue}>{getDisplayValue(snapshot.constructionAmount)}</strong>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>담당자</span>
            <strong className={styles.infoValue}>
              {getDisplayValue(currentSite.assigneeName || snapshot.assigneeName)}
            </strong>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>현장소장</span>
            <strong className={styles.infoValue}>{getDisplayValue(snapshot.siteManagerName)}</strong>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>연락처</span>
            {managerPhoneHref ? (
              <a className={`${styles.infoValue} ${styles.infoValueLink}`} href={managerPhoneHref}>
                {managerPhone}
              </a>
            ) : (
              <strong className={styles.infoValue}>{getDisplayValue(managerPhone)}</strong>
            )}
          </div>
          {showSiteContact ? (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>현장 연락처</span>
              {siteContactHref ? (
                <a className={`${styles.infoValue} ${styles.infoValueLink}`} href={siteContactHref}>
                  {siteContact}
                </a>
              ) : (
                <strong className={styles.infoValue}>{siteContact}</strong>
              )}
            </div>
          ) : null}
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>본사</span>
            <strong className={styles.infoValue}>{getDisplayValue(snapshot.companyName)}</strong>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>본사 연락처</span>
            {headquartersContactHref ? (
              <a className={`${styles.infoValue} ${styles.infoValueLink}`} href={headquartersContactHref}>
                {headquartersContact}
              </a>
            ) : (
              <strong className={styles.infoValue}>{getDisplayValue(headquartersContact)}</strong>
            )}
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>본사 주소</span>
            <strong className={styles.infoValue}>{getDisplayValue(snapshot.headquartersAddress)}</strong>
          </div>
        </div>
      </section>

      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleWrap}>
            <h2 className={styles.sectionTitle}>최근 보고서</h2>
          </div>
        </div>

        {latestReportTitle ? (
          <Link
            href={
              latestSession?.id
                ? buildMobileSessionHref(latestSession.id)
                : latestRemoteReport?.reportKey
                  ? buildMobileSessionHref(latestRemoteReport.reportKey)
                  : buildMobileSiteReportsHref(currentSite.id)
            }
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <article className={styles.reportCard} style={{ cursor: 'pointer', padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <h3
                    className={styles.cardTitle}
                    style={{
                      fontSize: '15px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {latestReportTitle}
                  </h3>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '8px',
                }}
              >
                <div style={{ display: 'flex', gap: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#475569' }}>
                    <strong style={{ fontWeight: 600, color: '#0f172a' }}>지도일</strong>{' '}
                    {formatCompactDate(latestGuidanceDate)}
                  </span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                  {getProgressLabel(latestReportProgress)}
                </span>
              </div>
            </article>
          </Link>
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
