'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import {
  getSessionProgress,
  getSessionSiteKey,
  getSessionSiteSubtitle,
  getSessionSiteTitle,
  getSessionTitle,
} from '@/constants/inspectionSession';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import styles from './page.module.css';

interface SiteReportsPageProps {
  params: {
    siteKey: string;
  };
}

function formatDateTime(value: string | null): string {
  if (!value) return '저장 이력 없음';

  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function SiteReportsPage({ params }: SiteReportsPageProps) {
  const router = useRouter();
  const decodedSiteKey = decodeURIComponent(params.siteKey);
  const { sessions, isReady, createSession, deleteSession } = useInspectionSessions();

  const siteSessions = useMemo(
    () => sessions.filter((session) => getSessionSiteKey(session) === decodedSiteKey),
    [decodedSiteKey, sessions]
  );

  const latestSession = siteSessions[0] ?? null;

  const handleCreateReport = () => {
    const nextSession = createSession(
      latestSession
        ? {
            businessName: latestSession.cover.businessName,
            projectName: latestSession.cover.projectName,
            siteAddress: latestSession.cover.siteAddress,
            contractorName: latestSession.cover.contractorName,
          }
        : {}
    );

    router.push(`/sessions/${nextSession.id}`);
  };

  if (!isReady) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className="app-shell">
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>보고서 목록을 불러오는 중입니다.</p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (!latestSession) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className="app-shell">
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>해당 현장을 찾을 수 없습니다.</p>
              <Link href="/" className="app-button app-button-secondary">
                현장 목록으로
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="app-page">
      <div className="app-container">
        <section className="app-shell">
          <header className={styles.hero}>
            <div className={styles.heroMain}>
              <Link href="/" className={styles.backLink}>
                현장 목록으로
              </Link>
              <p className={styles.heroKicker}>현장 보고서</p>
              <h1 className={styles.heroTitle}>{getSessionSiteTitle(latestSession)}</h1>
              {getSessionSiteSubtitle(latestSession) ? (
                <p className={styles.heroDescription}>
                  {getSessionSiteSubtitle(latestSession)}
                </p>
              ) : null}
            </div>

            <div className={styles.heroActions}>
              <span className="app-chip">총 {siteSessions.length}건</span>
              <button
                type="button"
                onClick={handleCreateReport}
                className="app-button app-button-primary"
              >
                새 보고서 시작
              </button>
            </div>
          </header>

          <div className={styles.pageGrid}>
            <section className={styles.panel}>
              <div className={styles.listHead} aria-hidden="true">
                <span>보고서명</span>
                <span>진행</span>
                <span>점검일</span>
                <span>마지막 저장</span>
                <span>작업</span>
              </div>

              <div className={styles.reportList}>
                {siteSessions.map((session) => {
                  const progress = getSessionProgress(session);

                  return (
                    <article key={session.id} className={styles.reportRow}>
                      <div className={styles.primaryCell}>
                        <h2 className={styles.reportTitle}>{getSessionTitle(session)}</h2>
                        <p className={styles.reportMeta}>
                          담당 {session.cover.consultantName || '미입력'}
                        </p>
                      </div>

                      <div className={styles.progressCell}>
                        <span className={styles.mobileLabel}>진행</span>
                        <div className={styles.progressStack}>
                          <div className={styles.progressTrack} aria-hidden="true">
                            <span
                              className={styles.progressFill}
                              style={{ width: `${progress.percentage}%` }}
                            />
                          </div>
                          <span className={styles.progressText}>
                            {progress.completed}/{progress.total} 완료
                          </span>
                        </div>
                      </div>

                      <div className={styles.dataCell}>
                        <span className={styles.mobileLabel}>점검일</span>
                        <span className={styles.dataValue}>
                          {session.cover.inspectionDate || '미입력'}
                        </span>
                      </div>

                      <div className={styles.dataCell}>
                        <span className={styles.mobileLabel}>마지막 저장</span>
                        <span className={styles.dataValue}>
                          {formatDateTime(session.lastSavedAt)}
                        </span>
                      </div>

                      <div className={styles.rowActions}>
                        <Link
                          href={`/sessions/${session.id}`}
                          className="app-button app-button-secondary"
                        >
                          이어서 작성
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              window.confirm(
                                '이 보고서를 목록에서 삭제하시겠습니까?'
                              )
                            ) {
                              deleteSession(session.id);
                            }
                          }}
                          className="app-button app-button-secondary"
                        >
                          삭제
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
