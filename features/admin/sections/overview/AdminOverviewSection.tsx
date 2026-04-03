'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  buildAdminOverviewModel,
  getOverviewExportSheets,
} from '@/features/admin/lib/buildAdminControlCenterModel';
import { fetchAdminOverview } from '@/lib/admin/apiClient';
import {
  exportAdminServerWorkbook,
  exportAdminWorkbook,
} from '@/lib/admin/exportClient';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import type { SafetyAdminOverviewResponse } from '@/types/admin';
import type { SafetyReportListItem } from '@/types/backend';
import type { ControllerDashboardData } from '@/types/controller';

interface AdminOverviewSectionProps {
  data: ControllerDashboardData;
  reports: SafetyReportListItem[];
}

function renderEmptyRow(label: string) {
  return (
    <div className={styles.tableEmpty}>
      {label}
    </div>
  );
}

export function AdminOverviewSection({
  data,
  reports,
}: AdminOverviewSectionProps) {
  const fallbackOverview = useMemo(() => buildAdminOverviewModel(data, reports), [data, reports]);
  const [overviewResponse, setOverviewResponse] = useState<SafetyAdminOverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setError(null);
        const nextOverview = await fetchAdminOverview();
        if (!cancelled) {
          setOverviewResponse(nextOverview);
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(
            nextError instanceof Error ? nextError.message : '관제 대시보드를 불러오지 못했습니다.',
          );
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  const overview =
    overviewResponse ??
    ({
      ...fallbackOverview,
      alerts: [],
      completionRows: [],
      scheduleRows: [],
    } satisfies SafetyAdminOverviewResponse);

  return (
    <div className={styles.dashboardStack}>
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>실시간 관제 요약</h2>
          </div>
          <div className={styles.sectionHeaderActions}>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() =>
                void exportAdminServerWorkbook('overview').catch(() =>
                  exportAdminWorkbook('overview', getOverviewExportSheets(overview)),
                )
              }
            >
              엑셀 내보내기
            </button>
          </div>
        </div>
        <div className={styles.sectionBody}>
          {error ? <div className={styles.bannerError}>{error}</div> : null}
          <div className={styles.metricGrid}>
            {overview.metricCards.map((card) => (
              <Link
                key={card.label}
                href={card.href}
                className={`${styles.metricLinkCard} ${
                  card.tone === 'danger'
                    ? styles.metricLinkCardDanger
                    : card.tone === 'warning'
                      ? styles.metricLinkCardWarning
                      : ''
                }`}
              >
                <span className={styles.metricLinkLabel}>{card.label}</span>
                <strong className={styles.metricLinkValue}>{card.value}</strong>
                <span className={styles.metricLinkMeta}>{card.meta}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className={styles.dashboardGrid}>
        <section className={`${styles.sectionCard} ${styles.listSectionCard}`}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>발송 지연 현장 Top</h2>
            </div>
            <div className={styles.sectionHeaderActions}>
              <span className="app-chip">{overview.overdueSiteRows.length}건</span>
            </div>
          </div>
          <div className={styles.sectionBody}>
            {overview.overdueSiteRows.length === 0 ? (
              renderEmptyRow('지금은 발송 지연 현장이 없습니다.')
            ) : (
              <div className={styles.tableShell}>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>현장</th>
                        <th>사업장</th>
                        <th>지연 건수</th>
                        <th>구분</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.overdueSiteRows.map((row) => (
                        <tr key={`${row.siteName}-${row.overdueCount}`}>
                          <td>
                            <Link href={row.href} className={styles.tableInlineLink}>
                              {row.siteName}
                            </Link>
                          </td>
                          <td>{row.headquarterName}</td>
                          <td>{row.overdueCount}건</td>
                          <td>{row.reportKindsLabel}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className={`${styles.sectionCard} ${styles.listSectionCard}`}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>품질 체크 필요 보고서</h2>
            </div>
            <div className={styles.sectionHeaderActions}>
              <span className="app-chip">{overview.pendingReviewRows.length}건</span>
            </div>
          </div>
          <div className={styles.sectionBody}>
            {overview.pendingReviewRows.length === 0 ? (
              renderEmptyRow('확인 대기 보고서가 없습니다.')
            ) : (
              <div className={styles.tableShell}>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>보고서</th>
                        <th>현장</th>
                        <th>담당자</th>
                        <th>품질 상태</th>
                        <th>수정일</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.pendingReviewRows.map((row) => (
                        <tr key={`${row.reportTitle}-${row.updatedAt}`}>
                          <td>
                            <Link href={row.href} className={styles.tableInlineLink}>
                              {row.reportTitle}
                            </Link>
                            <div className={styles.tableSecondary}>{row.reportTypeLabel}</div>
                          </td>
                          <td>
                            <div className={styles.tablePrimary}>{row.siteName}</div>
                            <div className={styles.tableSecondary}>{row.headquarterName}</div>
                          </td>
                          <td>{row.assigneeName}</td>
                          <td>{row.qualityLabel}</td>
                          <td>{row.updatedAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className={styles.dashboardGrid}>
        <section className={`${styles.sectionCard} ${styles.listSectionCard}`}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>미배정/과부하 요원</h2>
            </div>
            <div className={styles.sectionHeaderActions}>
              <span className="app-chip">{overview.workerLoadRows.length}명</span>
            </div>
          </div>
          <div className={styles.sectionBody}>
            {overview.workerLoadRows.length === 0 ? (
              renderEmptyRow('주의가 필요한 요원이 없습니다.')
            ) : (
              <div className={styles.tableShell}>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>요원</th>
                        <th>배정 현장</th>
                        <th>지연 건수</th>
                        <th>상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.workerLoadRows.map((row) => (
                        <tr key={row.userName}>
                          <td>
                            <Link href={row.href} className={styles.tableInlineLink}>
                              {row.userName}
                            </Link>
                          </td>
                          <td>{row.assignedSiteCount}개</td>
                          <td>{row.overdueCount}건</td>
                          <td>{row.loadLabel}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className={`${styles.sectionCard} ${styles.listSectionCard}`}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>당일/주간 마감 예정</h2>
            </div>
            <div className={styles.sectionHeaderActions}>
              <span className="app-chip">{overview.deadlineRows.length}건</span>
            </div>
          </div>
          <div className={styles.sectionBody}>
            {overview.deadlineRows.length === 0 ? (
              renderEmptyRow('7일 이내 마감 예정 보고서가 없습니다.')
            ) : (
              <div className={styles.tableShell}>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>보고서</th>
                        <th>현장</th>
                        <th>마감일</th>
                        <th>남은 기간</th>
                        <th>상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.deadlineRows.map((row) => (
                        <tr key={`${row.reportTitle}-${row.deadlineDate}`}>
                          <td>
                            <Link href={row.href} className={styles.tableInlineLink}>
                              {row.reportTitle}
                            </Link>
                            <div className={styles.tableSecondary}>{row.reportTypeLabel}</div>
                          </td>
                          <td>{row.siteName}</td>
                          <td>{row.deadlineDate}</td>
                          <td>{row.deadlineLabel}</td>
                          <td>{row.statusLabel}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>자료 확보 현황</h2>
          </div>
        </div>
        <div className={styles.sectionBody}>
          <div className={styles.coverageGrid}>
            {overview.coverageRows.map((row) => (
              <div key={row.label} className={styles.coverageCard}>
                <div className={styles.coverageCardLabel}>{row.label}</div>
                <strong className={styles.coverageCardValue}>{row.itemCount}건 등록</strong>
                <div className={styles.coverageCardMeta}>
                  부족 현장 {row.missingSiteCount.toLocaleString('ko-KR')}개
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className={styles.dashboardGrid}>
        <section className={`${styles.sectionCard} ${styles.listSectionCard}`}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>데이터 보완 큐</h2>
            </div>
          </div>
          <div className={styles.sectionBody}>
            {overview.completionRows.length === 0 ? (
              renderEmptyRow('추가 보완이 필요한 현장이 없습니다.')
            ) : (
              <div className={styles.tableShell}>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>현장</th>
                        <th>사업장</th>
                        <th>누락 항목</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.completionRows.map((row) => (
                        <tr key={row.siteId}>
                          <td>
                            <Link href={row.href} className={styles.tableInlineLink}>
                              {row.siteName}
                            </Link>
                          </td>
                          <td>{row.headquarterName}</td>
                          <td>{row.missingItems.join(', ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className={`${styles.sectionCard} ${styles.listSectionCard}`}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>일정 충돌/예외</h2>
            </div>
          </div>
          <div className={styles.sectionBody}>
            {overview.scheduleRows.length === 0 ? (
              renderEmptyRow('일정 충돌 또는 구간 밖 일정이 없습니다.')
            ) : (
              <div className={styles.tableShell}>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>현장</th>
                        <th>회차</th>
                        <th>방문일</th>
                        <th>담당자</th>
                        <th>이슈</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.scheduleRows.map((row) => (
                        <tr key={row.id}>
                          <td>{row.siteName}</td>
                          <td>{row.roundNo}회차</td>
                          <td>{row.plannedDate}</td>
                          <td>{row.assigneeName || '-'}</td>
                          <td>
                            {[
                              row.isConflicted ? '충돌' : '',
                              row.isOutOfWindow ? '구간 밖' : '',
                              row.isOverdue ? '지연' : '',
                            ]
                              .filter(Boolean)
                              .join(', ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className={`${styles.sectionCard} ${styles.listSectionCard}`}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>알림 피드</h2>
          </div>
        </div>
        <div className={styles.sectionBody}>
          {overview.alerts.length === 0 ? (
            renderEmptyRow('현재 확인이 필요한 알림이 없습니다.')
          ) : (
            <div className={styles.tableShell}>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>유형</th>
                      <th>내용</th>
                      <th>심각도</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.alerts.slice(0, 12).map((alert) => (
                      <tr key={alert.id}>
                        <td>{alert.title}</td>
                        <td>
                          <Link href={alert.href} className={styles.tableInlineLink}>
                            {alert.description}
                          </Link>
                        </td>
                        <td>{alert.severity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
