'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoginPanel from '@/components/auth/LoginPanel';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { fetchAdminReportSessionBootstrap } from '@/lib/admin/apiClient';
import { readSafetyAuthToken } from '@/lib/safetyApi';

function buildOriginalPdfApiPath(reportKey: string) {
  return `/api/admin/reports/${encodeURIComponent(reportKey)}/original-pdf`;
}

async function readErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error?.trim() || '';
  } catch {
    return '';
  }
}

function AdminReportOpenPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    authError,
    isAuthenticated,
    isReady,
    login,
    upsertHydratedSiteSessions,
  } = useInspectionSessions();
  const reportKey = useMemo(() => searchParams.get('reportKey')?.trim() || '', [searchParams]);
  const [message, setMessage] = useState('legacy 보고서를 여는 중입니다.');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady || !isAuthenticated) {
      return;
    }
    if (!reportKey) {
      setError('열 보고서 키가 없습니다.');
      return;
    }

    let cancelled = false;

    const openReport = async () => {
      setError(null);
      setMessage('legacy 보고서를 여는 중입니다.');
      let bootstrapError = '';

      try {
        const payload = await fetchAdminReportSessionBootstrap(reportKey);
        if (cancelled) return;
        upsertHydratedSiteSessions(payload.site, payload.siteSessions);
        router.replace(`/sessions/${encodeURIComponent(payload.session.id)}`);
        return;
      } catch (nextError) {
        bootstrapError =
          nextError instanceof Error
            ? nextError.message
            : '구조화 세션을 불러오지 못했습니다.';
      }

      const token = readSafetyAuthToken();
      if (!token) {
        if (!cancelled) {
          setError('로그인이 만료되었습니다. 다시 로그인해 주세요.');
        }
        return;
      }

      setMessage('구조화 세션을 찾지 못해 원본 PDF를 여는 중입니다.');

      try {
        const response = await fetch(buildOriginalPdfApiPath(reportKey), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const detail = await readErrorMessage(response);
          throw new Error(detail || '원본 PDF를 열지 못했습니다.');
        }

        const blob = await response.blob();
        if (cancelled) return;
        const blobUrl = URL.createObjectURL(blob);
        window.location.replace(blobUrl);
      } catch (nextError) {
        if (!cancelled) {
          const pdfError =
            nextError instanceof Error
              ? nextError.message
              : '원본 PDF를 열지 못했습니다.';
          setError(
            bootstrapError
              ? `구조화 세션과 원본 PDF를 모두 열지 못했습니다. ${pdfError}`
              : pdfError,
          );
        }
      }
    };

    void openReport();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isReady, reportKey, router, upsertHydratedSiteSessions]);

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

  return (
    <main className="app-page">
      <div className="app-container" style={{ maxWidth: 640 }}>
        <section className="app-shell" style={{ padding: 24 }}>
          <h1 style={{ fontSize: '1.25rem', marginBottom: 12 }}>legacy 보고서 열기</h1>
          <p style={{ margin: 0 }}>{error || message}</p>
          {error ? (
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

export default function AdminReportOpenPage() {
  return (
    <Suspense fallback={<main className="app-page">보고서를 준비하는 중입니다.</main>}>
      <AdminReportOpenPageContent />
    </Suspense>
  );
}
