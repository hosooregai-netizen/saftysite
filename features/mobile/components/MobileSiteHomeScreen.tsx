'use client';

import { useEffect, useRef, useState } from 'react';
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
  buildMobileSiteQuarterlyHref,
  buildMobileSiteQuarterlyListHref,
  buildMobileSiteReportsHref,
} from '@/features/home/lib/siteEntry';
import { useSiteOperationalReportIndex } from '@/hooks/useSiteOperationalReportIndex';
import { useSiteReportListState } from '@/features/site-reports/hooks/useSiteReportListState';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { uploadPhotoAlbumAsset } from '@/lib/photos/apiClient';
import { createPhotoThumbnail } from '@/lib/photos/thumbnail';
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
  const photoCaptureInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUploadNotice, setPhotoUploadNotice] = useState<string | null>(null);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
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
  const { quarterlyReports } = useSiteOperationalReportIndex(
    currentSite,
    isAuthenticated && isReady && Boolean(currentSite),
  );

  useEffect(() => {
    if (!photoUploadNotice) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPhotoUploadNotice(null);
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [photoUploadNotice]);

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
        title="현장 메뉴 로그인"
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
  const latestGuidanceDate = latestSession
    ? getSessionGuidanceDate(latestSession)
    : latestRemoteReport?.visitDate || '';
  const latestReportKey = latestSession?.id || latestRemoteReport?.reportKey || '';
  const latestReportTitle = latestSession
    ? getSessionTitle(latestSession)
    : latestRemoteReport?.reportTitle || '';
  const latestReportProgress = latestSession
    ? getSessionProgress(latestSession).percentage
    : clampProgress(latestRemoteReport?.progressRate);
  const latestReportHref = latestReportKey
    ? buildMobileSessionHref(latestReportKey)
    : buildMobileSiteReportsHref(currentSite.id);
  const directSignatureHref = latestReportKey
    ? buildMobileSessionHref(latestReportKey, { action: 'direct-signature' })
    : null;
  const managerPhone = snapshot.siteManagerPhone.trim();
  const managerPhoneHref = formatTelHref(managerPhone);
  const siteContact = snapshot.siteContactEmail.trim();
  const siteContactHref = formatMailHref(siteContact) ?? formatTelHref(siteContact);
  const headquartersContact = snapshot.headquartersContact.trim();
  const headquartersContactHref = formatTelHref(headquartersContact);
  const showSiteContact = siteContact.length > 0 && siteContact !== managerPhone;
  const currentYear = new Date().getFullYear();
  const currentYearQuarterlyReports = quarterlyReports.filter(
    (report) => report.year === currentYear,
  );
  const completedQuarterCount = new Set(
    currentYearQuarterlyReports.map((report) => report.quarterKey).filter(Boolean),
  ).size;
  const quarterlyListHref = buildMobileSiteQuarterlyListHref(currentSite.id);

  const handlePhotoCapture = async (files: FileList | null) => {
    const file = Array.from(files ?? []).find((item) => item.size > 0);
    if (!file) {
      return;
    }

    try {
      setIsUploadingPhoto(true);
      setPhotoUploadError(null);
      setPhotoUploadNotice(null);

      const thumbnail = await createPhotoThumbnail(file).catch(() => null);
      await uploadPhotoAlbumAsset({
        file,
        siteId: currentSite.id,
        thumbnail,
      });
      setPhotoUploadNotice('촬영한 사진을 현장 사진첩에 바로 저장했습니다.');
    } catch (error) {
      setPhotoUploadError(
        error instanceof Error
          ? error.message
          : '현장 사진 업로드 중 오류가 발생했습니다.',
      );
    } finally {
      setIsUploadingPhoto(false);
      if (photoCaptureInputRef.current) {
        photoCaptureInputRef.current.value = '';
      }
    }
  };

  return (
    <MobileShell
      backHref={buildMobileHomeHref()}
      backLabel="현장 목록"
      currentUserName={currentUser?.name}
      tabBar={<MobileTabBar tabs={buildSiteTabs(currentSite.id, 'site-home')} />}
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

        <div
          className={styles.statGrid}
          style={{
            gridTemplateColumns:
              'minmax(0, 1.2fr) minmax(0, 0.9fr) minmax(0, 0.9fr)',
            alignItems: 'stretch',
          }}
        >
          <article className={styles.statCard}>
            <span className={styles.statLabel}>방문 예정일</span>
            <strong className={styles.statValue}>{formatCompactDate(latestGuidanceDate)}</strong>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              마지막 보고서 지도일 기준
            </span>
          </article>
          <button
            type="button"
            className="app-button app-button-primary"
            onClick={() => photoCaptureInputRef.current?.click()}
            disabled={isUploadingPhoto}
            style={{ minHeight: '100%', whiteSpace: 'normal' }}
          >
            {isUploadingPhoto ? '사진 업로드 중...' : '현장 사진 촬영'}
          </button>
          {directSignatureHref ? (
            <Link
              href={directSignatureHref}
              className="app-button app-button-secondary"
              style={{
                minHeight: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                textAlign: 'center',
                whiteSpace: 'normal',
              }}
            >
              현장 소장 서명(직접수령)
            </Link>
          ) : (
            <button
              type="button"
              className="app-button app-button-secondary"
              disabled
              style={{ minHeight: '100%', whiteSpace: 'normal' }}
            >
              현장 소장 서명(직접수령)
            </button>
          )}
        </div>
        {!directSignatureHref ? (
          <p className={styles.inlineNotice}>
            마지막 보고서가 있어야 직접수령 서명을 시작할 수 있습니다.
          </p>
        ) : null}
        {photoUploadError ? <p className={styles.inlineNotice}>{photoUploadError}</p> : null}
        <input
          ref={photoCaptureInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(event) => {
            void handlePhotoCapture(event.target.files);
          }}
        />
        {photoUploadNotice ? (
          <div
            style={{
              position: 'fixed',
              left: '50%',
              bottom: '104px',
              transform: 'translateX(-50%)',
              zIndex: 40,
              maxWidth: 'calc(100vw - 32px)',
              padding: '10px 14px',
              borderRadius: '999px',
              background: 'rgba(15, 23, 42, 0.94)',
              color: '#f8fafc',
              fontSize: '13px',
              fontWeight: 600,
              textAlign: 'center',
              boxShadow: '0 12px 32px rgba(15, 23, 42, 0.22)',
            }}
          >
            {photoUploadNotice}
          </div>
        ) : null}
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
            <h2 className={styles.sectionTitle}>기술지도 보고서</h2>
          </div>
        </div>

        {latestReportTitle ? (
          <Link href={latestReportHref} style={{ textDecoration: 'none', color: 'inherit' }}>
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

      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleWrap}>
            <h2 className={styles.sectionTitle}>분기보고서</h2>
          </div>
        </div>

        <div
          className={styles.statGrid}
          style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}
        >
          <article className={styles.statCard}>
            <span className={styles.statLabel}>{currentYear}년 작성</span>
            <strong className={styles.statValue}>{completedQuarterCount}/4</strong>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              등록된 분기 보고 기준
            </span>
          </article>
          <Link
            href={quarterlyListHref}
            className="app-button app-button-primary"
            style={{
              minHeight: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              textAlign: 'center',
            }}
          >
            분기 보고 열기
          </Link>
        </div>

      </section>
    </MobileShell>
  );
}
