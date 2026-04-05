'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import LoginPanel from '@/components/auth/LoginPanel';
import { AdminMenuDrawer, AdminMenuPanel } from '@/components/admin/AdminMenu';
import SignaturePad from '@/components/ui/SignaturePad';
import WorkerAppHeader from '@/components/worker/WorkerAppHeader';
import { WorkerMenuDrawer, WorkerMenuPanel } from '@/components/worker/WorkerMenu';
import WorkerMenuSidebar from '@/components/worker/WorkerMenuSidebar';
import WorkerShellBody from '@/components/worker/WorkerShellBody';
import {
  buildSiteAssistHref,
  buildSiteHubHref,
  buildSitePhotoAlbumHref,
} from '@/features/home/lib/siteEntry';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { createFieldSignature, fetchFieldSignatures } from '@/lib/assist/apiClient';
import { getAdminSectionHref, isAdminUserRole } from '@/lib/admin';
import { fetchPhotoAlbum, uploadPhotoAlbumAsset } from '@/lib/photos/apiClient';
import type { FieldSignatureRecord } from '@/types/assist';
import type { PhotoAlbumItem } from '@/types/photos';
import shellStyles from '@/features/site-reports/components/SiteReportsScreen.module.css';
import styles from './SiteAssistScreen.module.css';

interface SiteAssistScreenProps {
  scheduleId?: string;
  siteKey: string;
}

function LoadingState() {
  return (
    <main className="app-page">
      <div className="app-container">
        <section className="app-shell">
          <div className={styles.emptyState}>현장 보조 화면을 준비하는 중입니다.</div>
        </section>
      </div>
    </main>
  );
}

function MissingState() {
  return (
    <main className="app-page">
      <div className="app-container">
        <section className="app-shell">
          <div className={styles.emptyState}>해당 현장을 찾을 수 없습니다.</div>
        </section>
      </div>
    </main>
  );
}

function formatTimestamp(value: string | null | undefined) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('ko-KR');
}

function toDialablePhone(value: string | null | undefined) {
  if (!value) return '';
  return value.replace(/[^0-9+]/g, '');
}

export function SiteAssistScreen({ scheduleId, siteKey }: SiteAssistScreenProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [photos, setPhotos] = useState<PhotoAlbumItem[]>([]);
  const [signatures, setSignatures] = useState<FieldSignatureRecord[]>([]);
  const [signatureValue, setSignatureValue] = useState('');
  const [signatureNote, setSignatureNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savingSignature, setSavingSignature] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const decodedSiteKey = decodeURIComponent(siteKey);
  const {
    authError,
    currentUser,
    isAuthenticated,
    isReady,
    login,
    logout,
    sites,
  } = useInspectionSessions();

  const currentSite = useMemo(
    () => sites.find((site) => site.id === decodedSiteKey) ?? null,
    [decodedSiteKey, sites],
  );
  const isAdminView = Boolean(currentUser && isAdminUserRole(currentUser.role));
  const backHref = currentSite
    ? isAdminView
      ? getAdminSectionHref('headquarters', {
          headquarterId: currentSite.headquarterId,
          siteId: currentSite.id,
        })
      : buildSiteHubHref(currentSite.id)
    : '/';
  const photoAlbumHref = currentSite
    ? buildSitePhotoAlbumHref(currentSite.id, {
        backHref: buildSiteAssistHref(currentSite.id, { scheduleId }),
        backLabel: '현장 보조로 돌아가기',
      })
    : '/';

  useEffect(() => {
    if (!isAuthenticated || !currentSite) return;
    let cancelled = false;
    void (async () => {
      try {
        setLoading(true);
        setError(null);
        const [photoResponse, signatureResponse] = await Promise.all([
          fetchPhotoAlbum({
            limit: 12,
            siteId: currentSite.id,
            source: 'all',
            sortBy: 'capturedAt',
            sortDir: 'desc',
          }),
          fetchFieldSignatures(currentSite.id, 10),
        ]);
        if (cancelled) return;
        setPhotos(photoResponse.rows);
        setSignatures(signatureResponse);
        if (signatureResponse[0]?.imageDataUrl) {
          setSignatureValue(signatureResponse[0].imageDataUrl);
          setSignatureNote(signatureResponse[0].note || '');
        }
      } catch (nextError) {
        if (cancelled) return;
        setError(
          nextError instanceof Error
            ? nextError.message
            : '현장 보조 데이터를 불러오지 못했습니다.',
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentSite, isAuthenticated]);

  const managerName = currentSite?.adminSiteSnapshot.siteManagerName || '';
  const managerPhone =
    currentSite?.adminSiteSnapshot.siteManagerPhone ||
    currentSite?.adminSiteSnapshot.siteContactEmail ||
    '';
  const dialableManagerPhone = toDialablePhone(managerPhone);
  const latestSignature = signatures[0] ?? null;

  const handleUpload = async (files: FileList | null) => {
    if (!currentSite || !files || files.length === 0) return;
    try {
      setUploading(true);
      setError(null);
      setNotice(null);
      const uploaded = await Promise.all(
        Array.from(files).map((file) =>
          uploadPhotoAlbumAsset({
            file,
            siteId: currentSite.id,
          }),
        ),
      );
      setPhotos((current) => [...uploaded, ...current]);
      setNotice(`${uploaded.length}건의 현장 사진을 업로드했습니다.`);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : '현장 사진을 업로드하지 못했습니다.',
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSaveSignature = async () => {
    if (!currentSite || !signatureValue) {
      setError('서명을 먼저 입력해 주세요.');
      return;
    }
    try {
      setSavingSignature(true);
      setError(null);
      setNotice(null);
      const nextRecord = await createFieldSignature({
        imageDataUrl: signatureValue,
        note: signatureNote,
        scheduleId: scheduleId || null,
        siteId: currentSite.id,
      });
      setSignatures((current) => [
        nextRecord,
        ...current.filter((item) => item.id !== nextRecord.id),
      ]);
      setNotice('현장 사인을 저장했습니다.');
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : '현장 사인을 저장하지 못했습니다.',
      );
    } finally {
      setSavingSignature(false);
    }
  };

  if (!isReady) return <LoadingState />;

  if (!isAuthenticated) {
    return (
      <LoginPanel
        error={authError}
        onSubmit={login}
        title="현장 보조 로그인"
        description="로그인하면 이전 사진 확인, 현장 사진 업로드, 사인 저장, 현장소장 연락처 확인을 할 수 있습니다."
      />
    );
  }

  if (!currentSite) return <MissingState />;

  return (
    <main className="app-page">
      <div className="app-container">
        <section className={`app-shell ${shellStyles.shell}`}>
          <WorkerAppHeader
            currentUserName={currentUser?.name}
            onLogout={logout}
            onOpenMenu={() => setMenuOpen(true)}
          />

          <WorkerShellBody>
            <WorkerMenuSidebar>
              {isAdminView ? (
                <AdminMenuPanel activeSection="headquarters" currentSiteKey={currentSite.id} />
              ) : (
                <WorkerMenuPanel currentSiteKey={currentSite.id} />
              )}
            </WorkerMenuSidebar>

            <div className={shellStyles.contentColumn}>
              <header className={shellStyles.hero}>
                <div className={shellStyles.heroBody}>
                  <Link href={backHref} className={shellStyles.heroBackLink}>
                    {'<'} 이전
                  </Link>
                  <div className={shellStyles.heroMain}>
                    <h1 className={shellStyles.heroTitle}>현장 보조 - {currentSite.siteName}</h1>
                    <p className={shellStyles.heroDescription}>
                      이전 기술지도 사진 확인, 현장 사진 업로드, 현장 사인, 현장소장 연락처를 한 화면에서 처리합니다.
                    </p>
                  </div>
                </div>
              </header>

              <div className={shellStyles.pageGrid}>
                {error ? <div className={styles.errorBox}>{error}</div> : null}
                {notice ? <div className={styles.noticeBox}>{notice}</div> : null}

                <section className={styles.summaryGrid}>
                  <article className={styles.summaryCard}>
                    <span className={styles.summaryLabel}>현장</span>
                    <strong className={styles.summaryValue}>{currentSite.siteName}</strong>
                    <span className={styles.summaryMeta}>
                      {currentSite.customerName || '사업장 미상'}
                    </span>
                  </article>
                  <article className={styles.summaryCard}>
                    <span className={styles.summaryLabel}>현장소장</span>
                    <strong className={styles.summaryValue}>{managerName || '미입력'}</strong>
                    <span className={styles.summaryMeta}>
                      {dialableManagerPhone ? (
                        <a href={`tel:${dialableManagerPhone}`}>{managerPhone}</a>
                      ) : managerPhone ? (
                        managerPhone
                      ) : (
                        '연락처 미입력'
                      )}
                    </span>
                  </article>
                  <article className={styles.summaryCard}>
                    <span className={styles.summaryLabel}>연결 회차</span>
                    <strong className={styles.summaryValue}>
                      {scheduleId ? '일정 연결됨' : '현장 단위'}
                    </strong>
                    <span className={styles.summaryMeta}>
                      {scheduleId || 'scheduleId 없음'}
                    </span>
                  </article>
                </section>

                <div className={styles.panelStack}>
                  <section className={styles.sectionCard}>
                    <div className={styles.sectionHeader}>
                      <div>
                        <h2 className={styles.sectionTitle}>이전 기술지도 사진</h2>
                        <p className={styles.summaryMeta}>
                          최근 사진을 바로 확인하고, 같은 화면에서 원본 사진을 업로드할 수 있습니다.
                        </p>
                      </div>
                      <div className={styles.inlineActions}>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(event) => void handleUpload(event.target.files)}
                        />
                        <span className="app-chip">
                          {uploading ? '업로드 중...' : '원본 업로드'}
                        </span>
                        <Link href={photoAlbumHref} className="app-button app-button-secondary">
                          전체 사진첩
                        </Link>
                      </div>
                    </div>
                    <div className={styles.sectionBody}>
                      {loading ? (
                        <div className={styles.emptyState}>사진을 불러오는 중입니다.</div>
                      ) : photos.length === 0 ? (
                        <div className={styles.emptyState}>이전 사진이 아직 없습니다.</div>
                      ) : (
                        <div className={styles.photoGrid}>
                          {photos.slice(0, 9).map((photo) => (
                            <article key={photo.id} className={styles.photoCard}>
                              <img
                                src={photo.previewUrl}
                                alt={photo.fileName || '현장 사진'}
                                className={styles.photoPreview}
                              />
                              <div className={styles.badgeRow}>
                                <span className="app-chip">
                                  {photo.sourceKind === 'report_legacy' ? 'legacy' : 'album'}
                                </span>
                                <span className="app-chip">
                                  {photo.capturedAt || photo.createdAt}
                                </span>
                              </div>
                              <div className={styles.photoMeta}>
                                <strong>{photo.fileName}</strong>
                                <span>{photo.uploadedByName || '업로더 미상'}</span>
                              </div>
                              <div className={styles.inlineActions}>
                                <a
                                  href={photo.downloadUrl}
                                  className="app-button app-button-secondary"
                                >
                                  원본 다운로드
                                </a>
                              </div>
                            </article>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>

                  <section className={styles.sectionCard}>
                    <div className={styles.sectionHeader}>
                      <div>
                        <h2 className={styles.sectionTitle}>현장 사인</h2>
                        <p className={styles.summaryMeta}>
                          저장하면 가장 최근 사인을 바로 다시 확인할 수 있습니다.
                        </p>
                      </div>
                    </div>
                    <div className={styles.sectionBody}>
                      <div className={styles.panelStack}>
                        <SignaturePad
                          label="현장 확인 서명"
                          value={signatureValue}
                          onChange={setSignatureValue}
                        />
                        <label>
                          <span className={styles.summaryLabel}>메모</span>
                          <textarea
                            className="app-textarea"
                            rows={3}
                            value={signatureNote}
                            onChange={(event) => setSignatureNote(event.target.value)}
                            placeholder="필요하면 간단한 메모를 남겨 주세요."
                          />
                        </label>
                        <div className={styles.inlineActions}>
                          <button
                            type="button"
                            className="app-button app-button-primary"
                            onClick={() => void handleSaveSignature()}
                            disabled={savingSignature || !signatureValue}
                          >
                            {savingSignature ? '저장 중...' : '사인 저장'}
                          </button>
                          {scheduleId ? (
                            <span className="app-chip">이 회차에 연결됨</span>
                          ) : null}
                        </div>
                        {latestSignature ? (
                          <div className={styles.signaturePreview}>
                            <span className={styles.summaryLabel}>최근 저장된 사인</span>
                            <img
                              src={latestSignature.imageDataUrl}
                              alt="최근 저장된 현장 사인"
                              className={styles.signatureImage}
                            />
                            <span className={styles.summaryMeta}>
                              {formatTimestamp(latestSignature.signedAt)} /{' '}
                              {latestSignature.signedByName || '작성자 미상'}
                            </span>
                            {latestSignature.note ? (
                              <span className={styles.summaryMeta}>{latestSignature.note}</span>
                            ) : null}
                          </div>
                        ) : (
                          <div className={styles.emptyState}>저장된 현장 사인이 없습니다.</div>
                        )}
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </WorkerShellBody>
        </section>
      </div>

      {isAdminView ? (
        <AdminMenuDrawer
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          activeSection="headquarters"
          currentSiteKey={currentSite.id}
        />
      ) : (
        <WorkerMenuDrawer
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          currentSiteKey={currentSite.id}
        />
      )}
    </main>
  );
}
