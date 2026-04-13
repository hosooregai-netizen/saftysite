'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { formatCompactDate } from './mobileSiteHomeHelpers';
import styles from '../components/MobileShell.module.css';

interface MobileSiteHomeSummarySectionProps {
  directSignatureHref: string | null;
  isUploadingPhoto: boolean;
  latestGuidanceDate: string;
  photoAlbumHref: string;
  photoUploadError: string | null;
  photoUploadNotice: string | null;
  reportIndexStatus: string;
  onPhotoCapture: (files: FileList | null) => Promise<void>;
}

export function MobileSiteHomeSummarySection({
  directSignatureHref,
  isUploadingPhoto,
  latestGuidanceDate,
  photoAlbumHref,
  photoUploadError,
  photoUploadNotice,
  reportIndexStatus,
  onPhotoCapture,
}: MobileSiteHomeSummarySectionProps) {
  const photoCaptureInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <section className={`${styles.sectionCard} ${styles.mobileSummarySection}`}>
      <div className={`${styles.statGrid} ${styles.mobileHomeSummaryGrid}`}>
        <article className={`${styles.statCard} ${styles.mobileSummaryCard}`}>
          <span className={`${styles.statLabel} ${styles.mobileSummaryLabel}`}>방문 예정일</span>
          <strong className={`${styles.statValue} ${styles.mobileSummaryValue}`}>
            {formatCompactDate(latestGuidanceDate)}
          </strong>
          <span style={{ color: '#64748b', fontSize: '12px' }}>마지막 보고서 지도일 기준</span>
        </article>
        <button
          type="button"
          className={`app-button app-button-primary ${styles.mobileSummaryTallButton}`}
          onClick={() => photoCaptureInputRef.current?.click()}
          disabled={isUploadingPhoto}
          style={{ whiteSpace: 'normal' }}
        >
          {isUploadingPhoto ? '업로드 중' : '사진 촬영'}
        </button>
        <div className={styles.mobileSummaryExportStack}>
          {directSignatureHref ? (
            <Link
              href={directSignatureHref}
              className={`app-button app-button-secondary ${styles.mobileSummaryMiniButton} ${styles.mobileSummaryLinkButton}`}
            >
              직접수령 서명
            </Link>
          ) : (
            <button
              type="button"
              className={`app-button app-button-secondary ${styles.mobileSummaryMiniButton}`}
              disabled
            >
              직접수령 서명
            </button>
          )}
          <Link
            href={photoAlbumHref}
            className={`app-button app-button-secondary ${styles.mobileSummaryMiniButton} ${styles.mobileSummaryLinkButton}`}
          >
            사진첩 열기
          </Link>
        </div>
      </div>
      {reportIndexStatus === 'loading' ? <p className={styles.inlineNotice}>목록 동기화 중</p> : null}
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
          void onPhotoCapture(event.target.files);
          event.currentTarget.value = '';
        }}
      />
      {photoUploadNotice ? (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.94)',
            borderRadius: '999px',
            bottom: '104px',
            boxShadow: '0 12px 32px rgba(15, 23, 42, 0.22)',
            color: '#f8fafc',
            fontSize: '13px',
            fontWeight: 600,
            left: '50%',
            maxWidth: 'calc(100vw - 32px)',
            padding: '10px 14px',
            position: 'fixed',
            textAlign: 'center',
            transform: 'translateX(-50%)',
            zIndex: 40,
          }}
        >
          {photoUploadNotice}
        </div>
      ) : null}
    </section>
  );
}
