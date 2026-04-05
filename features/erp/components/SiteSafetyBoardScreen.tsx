'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoginPanel from '@/components/auth/LoginPanel';
import {
  SafetyApiError,
  fetchSafetyReportDraftContext,
  fetchSafetyReportList,
  fetchSafetySiteDashboard,
  upsertSafetyReport,
} from '@/lib/safetyApi';
import type {
  ErpDocumentKind,
  SafetyInspectionPayload,
  SafetyReportDraftContext,
  SafetyReportListItem,
  SafetySiteDashboard,
  SafetyWorkLogPayload,
} from '@/types/backend';
import { useErpProtectedScreen } from '@/features/erp/hooks/useErpProtectedScreen';
import {
  ERP_DOCUMENT_KIND_LABELS,
  ERP_DOCUMENT_KIND_OPTIONS,
  ERP_REPORT_STATUS_LABELS,
  buildDocumentHref,
  buildSiteDashboardHref,
  buildSiteSafetyHref,
  buildSiteWorkersHref,
  createDefaultErpPayload,
  formatErpDate,
  formatErpDateTime,
} from '@/features/erp/lib/shared';
import { ErpSiteShell } from './ErpSiteShell';
import styles from './ErpScreen.module.css';

function getErrorMessage(error: unknown): string {
  if (error instanceof SafetyApiError || error instanceof Error) {
    return error.message;
  }

  return '일일 안전관리 화면을 처리하는 중 오류가 발생했습니다.';
}

function mergeUniqueStrings(existing: string[], incoming: string[]): string[] {
  const merged: string[] = [];
  const seen = new Set<string>();
  for (const item of [...existing, ...incoming]) {
    const normalized = item.trim();
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(normalized);
  }
  return merged;
}

function mergePrefilledPayload(
  kind: ErpDocumentKind,
  context: SafetyReportDraftContext | null
): Record<string, unknown> {
  const defaults = createDefaultErpPayload(kind) as unknown as Record<string, unknown>;
  if (!context) {
    return defaults;
  }

  const recentPayload = context.recent_payload ?? {};
  const unresolvedPayload = context.unresolved_payload ?? {};
  if (kind === 'safety_work_log') {
    const defaultWorkLog = defaults as unknown as SafetyWorkLogPayload;
    const recentWorkLog = recentPayload as Partial<SafetyWorkLogPayload>;
    const base = {
      ...defaultWorkLog,
      ...recentWorkLog,
    };
    const unresolved = unresolvedPayload as Partial<SafetyWorkLogPayload>;
    return {
      ...base,
      mainTasks: mergeUniqueStrings(base.mainTasks ?? [], unresolved.mainTasks ?? []),
      issues: mergeUniqueStrings(base.issues ?? [], unresolved.issues ?? []),
      photos: mergeUniqueStrings(base.photos ?? [], unresolved.photos ?? []),
    };
  }

  if (kind === 'safety_inspection_log' || kind === 'patrol_inspection_log') {
    const defaultInspection = defaults as unknown as SafetyInspectionPayload;
    const recentInspection = recentPayload as Partial<SafetyInspectionPayload>;
    const base = {
      ...defaultInspection,
      ...recentInspection,
    };
    const unresolved = unresolvedPayload as Partial<SafetyInspectionPayload>;
    const baseChecklist = Array.isArray(base.checklist) ? base.checklist : [];
    const unresolvedChecklist = Array.isArray(unresolved.checklist) ? unresolved.checklist : [];
    return {
      ...base,
      checklist: [...baseChecklist, ...unresolvedChecklist],
      actions: mergeUniqueStrings(base.actions ?? [], unresolved.actions ?? []),
      photos: mergeUniqueStrings(base.photos ?? [], unresolved.photos ?? []),
    };
  }

  return {
    ...defaults,
    ...(recentPayload as Record<string, unknown>),
  };
}

interface SiteSafetyBoardScreenProps {
  siteKey: string;
}

export function SiteSafetyBoardScreen({ siteKey }: SiteSafetyBoardScreenProps) {
  const router = useRouter();
  const { authError, currentUser, isAuthenticated, isReady, login, logout, shouldShowLogin, token } =
    useErpProtectedScreen();
  const [dashboard, setDashboard] = useState<SafetySiteDashboard | null>(null);
  const [reports, setReports] = useState<SafetyReportListItem[]>([]);
  const [selectedKind, setSelectedKind] = useState<ErpDocumentKind | 'all'>('all');
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingKind, setIsCreatingKind] = useState<ErpDocumentKind | null>(null);

  const load = useCallback(async (authToken: string) => {
    const [dashboardResponse, reportListResponse] = await Promise.all([
      fetchSafetySiteDashboard(authToken, siteKey),
      fetchSafetyReportList(authToken, {
        siteId: siteKey,
        activeOnly: true,
        limit: 300,
      }),
    ]);

    setDashboard(dashboardResponse);
    setReports(
      reportListResponse.filter(
        (item) => item.document_kind && ERP_DOCUMENT_KIND_OPTIONS.some((option) => option.value === item.document_kind)
      )
    );
  }, [siteKey]);

  useEffect(() => {
    if (!token || !isAuthenticated) return;

    let isDisposed = false;
    const run = async () => {
      setIsLoading(true);
      setError(null);

      try {
        await load(token);
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
  }, [isAuthenticated, load, token]);

  const filteredReports = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return reports.filter((report) => {
      if (!report.document_kind) return false;
      if (selectedKind !== 'all' && report.document_kind !== selectedKind) {
        return false;
      }
      if (!normalizedQuery) return true;

      return [report.report_title, report.report_key, report.meta.siteName]
        .filter((value): value is string => typeof value === 'string')
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [query, reports, selectedKind]);

  const countsByKind = useMemo(() => {
    return reports.reduce<Record<ErpDocumentKind, number>>((accumulator, report) => {
      if (!report.document_kind) return accumulator;
      accumulator[report.document_kind] = (accumulator[report.document_kind] ?? 0) + 1;
      return accumulator;
    }, {
      tbm: 0,
      hazard_notice: 0,
      safety_education: 0,
      safety_work_log: 0,
      safety_inspection_log: 0,
      patrol_inspection_log: 0,
    });
  }, [reports]);

  const currentSite = dashboard?.site ?? null;

  const handleCreateDocument = async (kind: ErpDocumentKind) => {
    if (!token || !currentSite) return;

    setIsCreatingKind(kind);
    setError(null);
    setNotice(null);

    try {
      const today = new Date().toISOString().slice(0, 10);
      const draftContext = await fetchSafetyReportDraftContext(token, currentSite.id, kind).catch(
        () => null
      );
      const created = await upsertSafetyReport(token, {
        report_key: `erp:${currentSite.id}:${kind}:${Date.now()}`,
        report_title: `${currentSite.site_name} ${ERP_DOCUMENT_KIND_LABELS[kind]} ${today}`,
        site_id: currentSite.id,
        headquarter_id: currentSite.headquarter_id,
        visit_date: today,
        document_kind: kind,
        payload: mergePrefilledPayload(kind, draftContext),
        meta: {
          documentKind: kind,
          siteName: currentSite.site_name,
          initializedFromDraftContext: Boolean(draftContext?.previous_document),
        },
        status: 'draft',
        create_revision: false,
        revision_reason: 'autosave',
      });

      router.push(buildDocumentHref(created.id));
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setIsCreatingKind(null);
    }
  };

  if (shouldShowLogin) {
    return (
      <LoginPanel
        error={authError}
        onSubmit={login}
        title="일일 안전관리 로그인"
        description="TBM, 공지, 교육, 점검 문서를 생성하고 자동저장 형태로 관리합니다."
      />
    );
  }

  if (!isReady || (isAuthenticated && isLoading && !dashboard)) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className="app-shell">
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>일일 안전관리 화면을 준비하고 있습니다.</p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (!currentSite) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className="app-shell">
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>현장을 찾을 수 없습니다.</p>
              <p className={styles.emptyDescription}>{error ?? '접근 권한을 확인해 주세요.'}</p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const noticePendingHref = buildSiteWorkersHref(currentSite.id, {
    ackKind: 'hazard_notice',
    pendingOnly: true,
    autoSelectPending: true,
  });
  const tbmPendingHref = buildSiteWorkersHref(currentSite.id, {
    ackKind: 'tbm',
    pendingOnly: true,
    autoSelectPending: true,
  });
  const educationPendingHref = buildSiteWorkersHref(currentSite.id, {
    ackKind: 'safety_education',
    pendingOnly: true,
    autoSelectPending: true,
  });

  return (
    <ErpSiteShell
      currentUserName={currentUser?.name}
      description="TBM, 위험 공지, 안전 교육, 작업일지, 점검일지를 한 보드에서 생성하고 자동저장합니다."
      heroMeta={
        <>
          <Link href={noticePendingHref} className={styles.badge}>
            미확인 공지 {dashboard?.unacknowledged_notice_count ?? 0}명
          </Link>
          <Link href={tbmPendingHref} className={styles.badge}>
            TBM 미서명 {dashboard?.unsigned_tbm_count ?? 0}명
          </Link>
          <Link href={educationPendingHref} className={styles.badge}>
            교육 미이수 {dashboard?.incomplete_education_count ?? 0}명
          </Link>
        </>
      }
      onLogout={logout}
      tabs={[
        { href: buildSiteDashboardHref(currentSite.id), label: '현장 대시보드' },
        { href: buildSiteWorkersHref(currentSite.id), label: '출입자관리' },
        { href: buildSiteSafetyHref(currentSite.id), label: '일일 안전관리' },
      ]}
      title={`${currentSite.site_name} 일일 안전관리`}
    >
      <section className={styles.summaryBar}>
        {ERP_DOCUMENT_KIND_OPTIONS.map((option) => (
          <article key={option.value} className={styles.summaryCard}>
            <span className={styles.summaryLabel}>{option.label}</span>
            <strong className={styles.summaryValue}>{countsByKind[option.value] ?? 0}</strong>
            <span className={styles.summaryMeta}>{option.description}</span>
          </article>
        ))}
      </section>

      {(error || notice) && (
        <section className={styles.sectionCard}>
          <div className={styles.sectionBody}>
            {error ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyTitle}>문서 보드 작업 중 오류가 발생했습니다.</p>
                <p className={styles.emptyDescription}>{error}</p>
              </div>
            ) : null}
            {notice ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyTitle}>안내</p>
                <p className={styles.emptyDescription}>{notice}</p>
              </div>
            ) : null}
          </div>
        </section>
      )}

      <div className={styles.splitGrid}>
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderMain}>
              <h2 className={styles.sectionTitle}>문서 종류</h2>
              <p className={styles.sectionDescription}>필요한 문서를 바로 만들고 편집 화면으로 이동합니다.</p>
            </div>
            <div className={styles.sectionActions}>
              <Link href={noticePendingHref} className="app-button app-button-secondary">
                공지 미확인
              </Link>
              <Link href={tbmPendingHref} className="app-button app-button-secondary">
                TBM 미서명
              </Link>
              <Link href={educationPendingHref} className="app-button app-button-secondary">
                교육 미이수
              </Link>
            </div>
          </div>
          <div className={styles.sectionBody}>
            <div className={styles.secondaryGrid}>
              {ERP_DOCUMENT_KIND_OPTIONS.map((option) => (
                <article key={option.value} className={styles.sectionCard}>
                  <div className={styles.sectionBody}>
                    <div className={styles.sectionHeaderMain}>
                      <h3 className={styles.sectionTitle}>{option.label}</h3>
                      <p className={styles.sectionDescription}>{option.description}</p>
                    </div>
                    <div className={styles.inlineStats}>
                      <span className={styles.badge}>등록 {countsByKind[option.value] ?? 0}건</span>
                    </div>
                    <div className={styles.sectionActions}>
                      <button
                        type="button"
                        className="app-button app-button-primary"
                        onClick={() => void handleCreateDocument(option.value)}
                        disabled={isCreatingKind !== null}
                      >
                        {isCreatingKind === option.value ? '생성 중...' : '새 문서'}
                      </button>
                      <button
                        type="button"
                        className="app-button app-button-secondary"
                        onClick={() => setSelectedKind(option.value)}
                      >
                        목록 보기
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderMain}>
              <h2 className={styles.sectionTitle}>문서 목록</h2>
              <p className={styles.sectionDescription}>날짜, 상태, 문서 종류 기준으로 최근 문서를 확인합니다.</p>
            </div>
          </div>
          <div className={styles.sectionBody}>
            <div className={styles.tableTools}>
              <input
                className={`app-input ${styles.tableSearch}`}
                placeholder="문서명 또는 키 검색"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <select
                className="app-select"
                value={selectedKind}
                onChange={(event) =>
                  setSelectedKind(event.target.value as ErpDocumentKind | 'all')
                }
              >
                <option value="all">전체 문서</option>
                {ERP_DOCUMENT_KIND_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {filteredReports.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyTitle}>조건에 맞는 문서가 없습니다.</p>
                <p className={styles.emptyDescription}>왼쪽 카드에서 새 문서를 생성해 주세요.</p>
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>문서명</th>
                      <th>종류</th>
                      <th>기준일</th>
                      <th>상태</th>
                      <th>최종 수정</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((report) => (
                      <tr key={report.id}>
                        <td>
                          <Link href={buildDocumentHref(report.id)}>
                            <span className={styles.tablePrimary}>{report.report_title}</span>
                          </Link>
                          <span className={styles.tableSecondary}>{report.report_key}</span>
                        </td>
                        <td>
                          {report.document_kind
                            ? ERP_DOCUMENT_KIND_LABELS[report.document_kind]
                            : '-'}
                        </td>
                        <td>{formatErpDate(report.visit_date)}</td>
                        <td>
                          <span
                            className={`${styles.badge} ${
                              report.status === 'published'
                                ? styles.badgePublished
                                : report.status === 'submitted'
                                  ? styles.badgeSubmitted
                                  : report.status === 'archived'
                                    ? styles.badgeArchived
                                    : styles.badgeDraft
                            }`}
                          >
                            {ERP_REPORT_STATUS_LABELS[report.status]}
                          </span>
                        </td>
                        <td>{formatErpDateTime(report.updated_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </ErpSiteShell>
  );
}
