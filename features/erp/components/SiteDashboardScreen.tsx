'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LoginPanel from '@/components/auth/LoginPanel';
import { SafetyApiError, fetchSafetySiteDashboard } from '@/lib/safetyApi';
import { useErpProtectedScreen } from '@/features/erp/hooks/useErpProtectedScreen';
import {
  ERP_DOCUMENT_KIND_LABELS,
  buildSiteDashboardHref,
  buildSiteSafetyHref,
  buildSiteWorkersHref,
  formatErpDate,
  formatErpDateTime,
} from '@/features/erp/lib/shared';
import type { SafetySiteDashboard } from '@/types/backend';
import { ErpSiteShell } from './ErpSiteShell';
import styles from './ErpScreen.module.css';

function getErrorMessage(error: unknown): string {
  if (error instanceof SafetyApiError || error instanceof Error) {
    return error.message;
  }

  return '현장 대시보드를 불러오는 중 오류가 발생했습니다.';
}

interface SiteDashboardScreenProps {
  siteKey: string;
}

export function SiteDashboardScreen({ siteKey }: SiteDashboardScreenProps) {
  const { authError, currentUser, isAuthenticated, isReady, login, logout, shouldShowLogin, token } =
    useErpProtectedScreen();
  const [dashboard, setDashboard] = useState<SafetySiteDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token || !isAuthenticated) return;

    let isDisposed = false;
    const run = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchSafetySiteDashboard(token, siteKey);
        if (!isDisposed) {
          setDashboard(response);
        }
      } catch (nextError) {
        if (!isDisposed) {
          setError(getErrorMessage(nextError));
        }
      } finally {
        if (!isDisposed) {
          setIsLoading(false);
        }
      }
    };

    void run();

    return () => {
      isDisposed = true;
    };
  }, [isAuthenticated, siteKey, token]);

  if (shouldShowLogin) {
    return (
      <LoginPanel
        error={authError}
        onSubmit={login}
        title="SI SAFER ERP 로그인"
        description="관리직 계정으로 로그인하면 현장 대시보드, 출입자 관리, 일일 안전 문서를 바로 사용할 수 있습니다."
      />
    );
  }

  if (!isReady || (isAuthenticated && isLoading && !dashboard)) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className="app-shell">
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>현장 ERP를 불러오는 중입니다.</p>
              <p className={styles.emptyDescription}>대시보드와 출입자 현황을 준비하고 있습니다.</p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (!dashboard) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className="app-shell">
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>현장 정보를 찾을 수 없습니다.</p>
              <p className={styles.emptyDescription}>{error ?? '접근 권한 또는 데이터 상태를 확인해 주세요.'}</p>
              <div className={styles.sectionActions}>
                <Link href="/" className="app-button app-button-secondary">
                  현장 목록으로 돌아가기
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const { site } = dashboard;
  const siteTabs = [
    { href: buildSiteDashboardHref(site.id), label: '현장 대시보드' },
    { href: buildSiteWorkersHref(site.id), label: '출입자관리' },
    { href: buildSiteSafetyHref(site.id), label: '일일 안전관리' },
  ];
  const noticePendingHref = buildSiteWorkersHref(site.id, {
    ackKind: 'hazard_notice',
    pendingOnly: true,
    autoSelectPending: true,
  });
  const tbmPendingHref = buildSiteWorkersHref(site.id, {
    ackKind: 'tbm',
    pendingOnly: true,
    autoSelectPending: true,
  });
  const educationPendingHref = buildSiteWorkersHref(site.id, {
    ackKind: 'safety_education',
    pendingOnly: true,
    autoSelectPending: true,
  });

  return (
    <ErpSiteShell
      currentUserName={currentUser?.name}
      description="오늘 등록 인원, 미확인 공지, TBM 미서명, 교육 미이수 현황을 한 화면에서 확인합니다."
      heroMeta={
        <>
          <span className={styles.badge}>{site.headquarter?.name || '사업장 미지정'}</span>
          <span className={styles.badge}>{site.manager_name || '현장 책임자 미입력'}</span>
          <span className={styles.badge}>{site.site_address || '주소 미입력'}</span>
        </>
      }
      onLogout={logout}
      summary={
        <section className={styles.summaryBar}>
          <Link href={buildSiteWorkersHref(site.id)} className={styles.summaryCard}>
            <span className={styles.summaryLabel}>오늘 등록 인원</span>
            <strong className={styles.summaryValue}>{dashboard.registered_worker_count}</strong>
            <span className={styles.summaryMeta}>차단 {dashboard.blocked_worker_count}명</span>
          </Link>
          <Link href={noticePendingHref} className={styles.summaryCard}>
            <span className={styles.summaryLabel}>미확인 공지</span>
            <strong className={styles.summaryValue}>{dashboard.unacknowledged_notice_count}</strong>
            <span className={styles.summaryMeta}>모바일 공지 확인 필요</span>
          </Link>
          <Link href={tbmPendingHref} className={styles.summaryCard}>
            <span className={styles.summaryLabel}>TBM 미서명</span>
            <strong className={styles.summaryValue}>{dashboard.unsigned_tbm_count}</strong>
            <span className={styles.summaryMeta}>오늘 작업 전 확인 필요</span>
          </Link>
          <Link href={educationPendingHref} className={styles.summaryCard}>
            <span className={styles.summaryLabel}>교육 미이수</span>
            <strong className={styles.summaryValue}>{dashboard.incomplete_education_count}</strong>
            <span className={styles.summaryMeta}>
              점검 미완료 문서 {dashboard.incomplete_inspection_document_count}건
            </span>
          </Link>
        </section>
      }
      tabs={siteTabs}
      title={site.site_name}
    >
      {error ? (
        <section className={styles.sectionCard}>
          <div className={styles.sectionBody}>
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>일부 데이터를 새로고침하지 못했습니다.</p>
              <p className={styles.emptyDescription}>{error}</p>
            </div>
          </div>
        </section>
      ) : null}

      <div className={styles.splitGrid}>
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderMain}>
              <h2 className={styles.sectionTitle}>최근 문서</h2>
              <p className={styles.sectionDescription}>
                관리직과 일용직이 오늘 확인해야 할 최신 문서를 빠르게 점검합니다.
              </p>
            </div>
            <div className={styles.sectionActions}>
              <Link href={buildSiteSafetyHref(site.id)} className="app-button app-button-primary">
                문서 보드 열기
              </Link>
            </div>
          </div>
          <div className={styles.sectionBody}>
            {dashboard.latest_documents.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyTitle}>등록된 안전 문서가 없습니다.</p>
                <p className={styles.emptyDescription}>문서 보드에서 TBM, 공지, 교육, 점검 문서를 생성해 주세요.</p>
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>문서 종류</th>
                      <th>문서명</th>
                      <th>기준일</th>
                      <th>최종 수정</th>
                      <th>상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.latest_documents.map((document) => (
                      <tr key={document.report_id}>
                        <td>
                          {document.document_kind
                            ? ERP_DOCUMENT_KIND_LABELS[document.document_kind]
                            : '안전 문서'}
                        </td>
                        <td>
                          <Link href={`/documents/${encodeURIComponent(document.report_id)}`}>
                            <span className={styles.tablePrimary}>{document.report_title}</span>
                          </Link>
                          <span className={styles.tableSecondary}>{document.report_key}</span>
                        </td>
                        <td>{formatErpDate(document.visit_date)}</td>
                        <td>{formatErpDateTime(document.updated_at)}</td>
                        <td>
                          <span
                            className={`${styles.badge} ${
                              document.status === 'published'
                                ? styles.badgePublished
                                : document.status === 'submitted'
                                  ? styles.badgeSubmitted
                                  : document.status === 'archived'
                                    ? styles.badgeArchived
                                    : styles.badgeDraft
                            }`}
                          >
                            {document.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <div className={styles.secondaryGrid}>
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionHeaderMain}>
                <h2 className={styles.sectionTitle}>오늘 필요한 작업</h2>
                <p className={styles.sectionDescription}>미완료 항목 위주로 다음 화면으로 바로 이동합니다.</p>
              </div>
            </div>
            <div className={styles.sectionBody}>
              <div className={styles.textList}>
                <div className={styles.textListItem}>
                  <span className={styles.textListBullet}>1.</span>
                  <span>출입자 {dashboard.registered_worker_count}명 상태와 차단 인원을 확인하세요.</span>
                </div>
                <div className={styles.textListItem}>
                  <span className={styles.textListBullet}>2.</span>
                  <span>공지 미확인 {dashboard.unacknowledged_notice_count}명, TBM 미서명 {dashboard.unsigned_tbm_count}명을 우선 정리하세요.</span>
                </div>
                <div className={styles.textListItem}>
                  <span className={styles.textListBullet}>3.</span>
                  <span>점검 미완료 문서 {dashboard.incomplete_inspection_document_count}건을 마감하고 인쇄본을 준비하세요.</span>
                </div>
              </div>
              <div className={styles.sectionActions}>
                <Link href={noticePendingHref} className="app-button app-button-secondary">
                  공지 미확인 보기
                </Link>
                <Link href={tbmPendingHref} className="app-button app-button-secondary">
                  TBM 미서명 보기
                </Link>
                <Link href={educationPendingHref} className="app-button app-button-secondary">
                  교육 미이수 보기
                </Link>
                <Link href={buildSiteWorkersHref(site.id)} className="app-button app-button-secondary">
                  출입자관리
                </Link>
                <Link href={buildSiteSafetyHref(site.id)} className="app-button app-button-primary">
                  일일 안전관리
                </Link>
              </div>
            </div>
          </section>

          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionHeaderMain}>
                <h2 className={styles.sectionTitle}>모바일 미확인 미리보기</h2>
                <p className={styles.sectionDescription}>
                  최신 공지, TBM, 안전 교육 기준으로 아직 확인하지 않은 출입자를 바로 확인합니다.
                </p>
              </div>
            </div>
            <div className={styles.sectionBody}>
              {dashboard.pending_mobile_ack_groups.length === 0 ? (
                <p className={styles.helperText}>
                  아직 미확인 집계를 계산할 문서가 없습니다.
                </p>
              ) : (
                <div className={styles.textList}>
                  {dashboard.pending_mobile_ack_groups.map((group) => {
                    const groupHref = buildSiteWorkersHref(site.id, {
                      ackKind: group.kind,
                      pendingOnly: true,
                      autoSelectPending: true,
                    });
                    const previewNames = group.workers
                      .map((worker) =>
                        [worker.name, worker.company_name, worker.trade].filter(Boolean).join(' / ')
                      )
                      .filter(Boolean);

                    return (
                      <div key={group.kind} className={styles.linkHistoryItem}>
                        <div className={styles.linkHistoryMain}>
                          <div className={styles.inlineStats}>
                            <span className={styles.badge}>{group.label}</span>
                            <span
                              className={`${styles.badge} ${
                                group.count > 0 ? styles.badgeWarning : styles.badgePublished
                              }`}
                            >
                              미확인 {group.count}명
                            </span>
                            {group.excluded_count > 0 ? (
                              <span className={styles.badge}>제외 {group.excluded_count}명</span>
                            ) : null}
                            {group.report_updated_at ? (
                              <span className={styles.badge}>
                                기준 {formatErpDateTime(group.report_updated_at)}
                              </span>
                            ) : (
                              <span className={`${styles.badge} ${styles.badgeDraft}`}>
                                기준 문서 없음
                              </span>
                            )}
                          </div>
                          <p className={styles.sectionDescription}>
                            {group.report_title || `${group.label} 최신 문서가 아직 없습니다.`}
                          </p>
                          <p className={styles.helperText}>
                            {previewNames.length > 0
                              ? previewNames.join(', ')
                              : group.count > 0
                                ? '미확인 인원이 있습니다. 출입자관리에서 전체 목록을 확인해 주세요.'
                                : '현재 미확인 인원이 없습니다.'}
                          </p>
                        </div>
                        <div className={styles.sectionActions}>
                          <Link href={groupHref} className="app-button app-button-secondary">
                            {group.count > 0 ? '미확인 보기' : '출입자관리'}
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionHeaderMain}>
                <h2 className={styles.sectionTitle}>현장 기본정보</h2>
              </div>
            </div>
            <div className={styles.sectionBody}>
              <div className={styles.textList}>
                <div className={styles.textListItem}>
                  <span className={styles.textListBullet}>•</span>
                  <span>사업장: {site.headquarter?.name || '-'}</span>
                </div>
                <div className={styles.textListItem}>
                  <span className={styles.textListBullet}>•</span>
                  <span>현장 책임자: {site.manager_name || '-'} / {site.manager_phone || '-'}</span>
                </div>
                <div className={styles.textListItem}>
                  <span className={styles.textListBullet}>•</span>
                  <span>공사기간: {formatErpDate(site.project_start_date)} ~ {formatErpDate(site.project_end_date)}</span>
                </div>
                <div className={styles.textListItem}>
                  <span className={styles.textListBullet}>•</span>
                  <span>배정 관리직: {(site.assigned_users ?? []).map((user) => user.name).join(', ') || site.assigned_user?.name || '-'}</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </ErpSiteShell>
  );
}
