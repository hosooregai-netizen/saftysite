'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoginPanel from '@/components/auth/LoginPanel';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { fetchAdminOriginalPdfBlob } from '@/lib/admin/originalPdfClient';

export default function AdminReportOpenPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    authError,
    isAuthenticated,
    isReady,
    login,
  } = useInspectionSessions();
  const reportKey = useMemo(() => searchParams.get('reportKey')?.trim() || '', [searchParams]);
  const [message, setMessage] = useState('레거시 원본 PDF를 여는 중입니다.');
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const pdfUrlRef = useRef<string | null>(null);
  const missingReportKeyError =
    isReady && isAuthenticated && !reportKey ? '열 보고서 키가 없습니다.' : null;

  const releasePdfUrl = useCallback(() => {
    if (!pdfUrlRef.current) return;
    URL.revokeObjectURL(pdfUrlRef.current);
    pdfUrlRef.current = null;
  }, []);

  useEffect(() => {
    if (!isReady || !isAuthenticated) {
      return;
    }
    if (!reportKey) return;

    let cancelled = false;
    const abortController = new AbortController();

    const openReport = async () => {
      releasePdfUrl();
      setPdfUrl(null);
      setError(null);
      setMessage('레거시 원본 PDF를 여는 중입니다.');

      try {
        const blob = await fetchAdminOriginalPdfBlob(reportKey, {
          signal: abortController.signal,
        });
        if (cancelled) return;
        const blobUrl = URL.createObjectURL(blob);
        pdfUrlRef.current = blobUrl;
        setPdfUrl(blobUrl);
        setMessage('레거시 원본 PDF를 열었습니다.');
      } catch (nextError) {
        if (!cancelled) {
          const pdfError =
            nextError instanceof Error
              ? nextError.message
              : '원본 PDF를 열지 못했습니다.';
          setError(pdfError);
        }
      }
    };

    void openReport();

    return () => {
      cancelled = true;
      abortController.abort();
      releasePdfUrl();
    };
  }, [isAuthenticated, isReady, releasePdfUrl, reportKey]);

  if (!isReady) {
    return <main className="app-page">보고서를 준비하는 중입니다.</main>;
  }

  if (!isAuthenticated) {
    return (
      <LoginPanel
        error={authError}
        onSubmit={login}
        title="관리자 로그인"
        description="legacy 보고서 열기를 계속하려면 다시 로그인해 주세요."
      />
    );
  }

  const displayError = missingReportKeyError || error;

  return (
    <main className="app-page">
      <div className="app-container" style={{ maxWidth: pdfUrl ? 1180 : 640 }}>
        <section className="app-shell" style={{ padding: 24 }}>
          <h1 style={{ fontSize: '1.25rem', marginBottom: 12 }}>레거시 원본 PDF 보기</h1>
          <p style={{ margin: 0 }}>{displayError || message}</p>
          {pdfUrl && !displayError ? (
            <div
              style={{
                border: '1px solid var(--erp-line)',
                borderRadius: 8,
                height: 'min(74dvh, 780px)',
                marginTop: 16,
                minHeight: 420,
                overflow: 'hidden',
              }}
            >
              <iframe
                src={`${pdfUrl}#toolbar=0&navpanes=0`}
                title="원본 PDF"
                style={{
                  border: 0,
                  height: '100%',
                  width: '100%',
                }}
              />
            </div>
          ) : null}
          {displayError ? (
            <div style={{ marginTop: 16 }}>
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={() => router.replace('/admin?section=reports')}
              >
                전체 보고서로 돌아가기
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
