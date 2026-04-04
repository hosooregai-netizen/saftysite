'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { SortableHeaderCell } from '@/features/admin/components/SortableHeaderCell';
import {
  buildAdminOverviewModel,
  getOverviewExportSheets,
} from '@/features/admin/lib/buildAdminControlCenterModel';
import { fetchAdminOverview } from '@/lib/admin/apiClient';
import {
  exportAdminWorkbook,
} from '@/lib/admin/exportClient';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import type { SafetyAdminAlert, SafetyAdminOverviewResponse, TableSortState } from '@/types/admin';
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

function compareText(left: string, right: string, direction: TableSortState['direction']) {
  return left.localeCompare(right, 'ko') * (direction === 'asc' ? 1 : -1);
}

function compareNumber(left: number, right: number, direction: TableSortState['direction']) {
  return (left - right) * (direction === 'asc' ? 1 : -1);
}

function compareSeverity(
  left: SafetyAdminAlert['severity'],
  right: SafetyAdminAlert['severity'],
  direction: TableSortState['direction'],
) {
  const weight = { danger: 0, warning: 1, info: 2 };
  return compareNumber(weight[left], weight[right], direction);
}

export function AdminOverviewSection({
  data,
  reports,
}: AdminOverviewSectionProps) {
  const fallbackOverview = useMemo(() => buildAdminOverviewModel(data, reports), [data, reports]);
  const [overviewResponse, setOverviewResponse] = useState<SafetyAdminOverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [overdueSort, setOverdueSort] = useState<TableSortState>({
    direction: 'desc',
    key: 'overdueCount',
  });
  const [reviewSort, setReviewSort] = useState<TableSortState>({
    direction: 'desc',
    key: 'updatedAt',
  });
  const [workerSort, setWorkerSort] = useState<TableSortState>({
    direction: 'desc',
    key: 'overdueCount',
  });
  const [deadlineSort, setDeadlineSort] = useState<TableSortState>({
    direction: 'asc',
    key: 'deadlineDate',
  });
  const [completionSort, setCompletionSort] = useState<TableSortState>({
    direction: 'desc',
    key: 'missingItems',
  });
  const [scheduleSort, setScheduleSort] = useState<TableSortState>({
    direction: 'asc',
    key: 'plannedDate',
  });
  const [alertSort, setAlertSort] = useState<TableSortState>({
    direction: 'asc',
    key: 'severity',
  });

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

  const overdueSiteRows = useMemo(() => {
    return [...overview.overdueSiteRows].sort((left, right) => {
      switch (overdueSort.key) {
        case 'siteName':
          return compareText(left.siteName, right.siteName, overdueSort.direction);
        case 'headquarterName':
          return compareText(left.headquarterName, right.headquarterName, overdueSort.direction);
        case 'reportKindsLabel':
          return compareText(left.reportKindsLabel, right.reportKindsLabel, overdueSort.direction);
        case 'overdueCount':
        default:
          return compareNumber(left.overdueCount, right.overdueCount, overdueSort.direction);
      }
    });
  }, [overview.overdueSiteRows, overdueSort.direction, overdueSort.key]);

  const pendingReviewRows = useMemo(() => {
    return [...overview.pendingReviewRows].sort((left, right) => {
      switch (reviewSort.key) {
        case 'siteName':
          return compareText(left.siteName, right.siteName, reviewSort.direction);
        case 'assigneeName':
          return compareText(left.assigneeName, right.assigneeName, reviewSort.direction);
        case 'qualityLabel':
          return compareText(left.qualityLabel, right.qualityLabel, reviewSort.direction);
        case 'reportTitle':
        default:
          if (reviewSort.key === 'updatedAt') {
            return compareText(left.updatedAt, right.updatedAt, reviewSort.direction);
          }
          return compareText(left.reportTitle, right.reportTitle, reviewSort.direction);
      }
    });
  }, [overview.pendingReviewRows, reviewSort.direction, reviewSort.key]);

  const workerLoadRows = useMemo(() => {
    return [...overview.workerLoadRows].sort((left, right) => {
      switch (workerSort.key) {
        case 'userName':
          return compareText(left.userName, right.userName, workerSort.direction);
        case 'assignedSiteCount':
          return compareNumber(left.assignedSiteCount, right.assignedSiteCount, workerSort.direction);
        case 'loadLabel':
          return compareText(left.loadLabel, right.loadLabel, workerSort.direction);
        case 'overdueCount':
        default:
          return compareNumber(left.overdueCount, right.overdueCount, workerSort.direction);
      }
    });
  }, [overview.workerLoadRows, workerSort.direction, workerSort.key]);

  const deadlineRows = useMemo(() => {
    return [...overview.deadlineRows].sort((left, right) => {
      switch (deadlineSort.key) {
        case 'reportTitle':
          return compareText(left.reportTitle, right.reportTitle, deadlineSort.direction);
        case 'siteName':
          return compareText(left.siteName, right.siteName, deadlineSort.direction);
        case 'deadlineLabel':
          return compareText(left.deadlineLabel, right.deadlineLabel, deadlineSort.direction);
        case 'statusLabel':
          return compareText(left.statusLabel, right.statusLabel, deadlineSort.direction);
        case 'deadlineDate':
        default:
          return compareText(left.deadlineDate, right.deadlineDate, deadlineSort.direction);
      }
    });
  }, [deadlineSort.direction, deadlineSort.key, overview.deadlineRows]);

  const completionRows = useMemo(() => {
    return [...overview.completionRows].sort((left, right) => {
      switch (completionSort.key) {
        case 'siteName':
          return compareText(left.siteName, right.siteName, completionSort.direction);
        case 'headquarterName':
          return compareText(left.headquarterName, right.headquarterName, completionSort.direction);
        case 'missingItems':
        default:
          return compareNumber(left.missingItems.length, right.missingItems.length, completionSort.direction);
      }
    });
  }, [completionSort.direction, completionSort.key, overview.completionRows]);

  const scheduleRows = useMemo(() => {
    return [...overview.scheduleRows].sort((left, right) => {
      switch (scheduleSort.key) {
        case 'siteName':
          return compareText(left.siteName, right.siteName, scheduleSort.direction);
        case 'roundNo':
          return compareNumber(left.roundNo, right.roundNo, scheduleSort.direction);
        case 'assigneeName':
          return compareText(left.assigneeName, right.assigneeName, scheduleSort.direction);
        case 'plannedDate':
        default:
          return compareText(
            left.plannedDate || left.windowStart || left.windowEnd,
            right.plannedDate || right.windowStart || right.windowEnd,
            scheduleSort.direction,
          );
      }
    });
  }, [overview.scheduleRows, scheduleSort.direction, scheduleSort.key]);

  const alerts = useMemo(() => {
    return [...overview.alerts].sort((left, right) => {
      switch (alertSort.key) {
        case 'title':
          return compareText(left.title, right.title, alertSort.direction);
        case 'description':
          return compareText(left.description, right.description, alertSort.direction);
        case 'createdAt':
          return compareText(left.createdAt, right.createdAt, alertSort.direction);
        case 'severity':
        default:
          return compareSeverity(left.severity, right.severity, alertSort.direction);
      }
    });
  }, [alertSort.direction, alertSort.key, overview.alerts]);

  const exportOverview = () =>
    exportAdminWorkbook(
      'overview',
      getOverviewExportSheets({
        ...overview,
        alerts,
        completionRows,
        deadlineRows,
        overdueSiteRows,
        pendingReviewRows,
        scheduleRows,
        workerLoadRows,
      }),
    );

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
              onClick={() => void exportOverview()}
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
              <span className="app-chip">{overdueSiteRows.length}건</span>
            </div>
          </div>
          <div className={styles.sectionBody}>
            {overdueSiteRows.length === 0 ? (
              renderEmptyRow('지금은 발송 지연 현장이 없습니다.')
            ) : (
              <div className={styles.tableShell}>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <SortableHeaderCell column={{ key: 'siteName' }} current={overdueSort} label="현장" onChange={setOverdueSort} />
                        <SortableHeaderCell column={{ key: 'headquarterName' }} current={overdueSort} label="사업장" onChange={setOverdueSort} />
                        <SortableHeaderCell column={{ key: 'overdueCount' }} current={overdueSort} defaultDirection="desc" label="지연 건수" onChange={setOverdueSort} />
                        <SortableHeaderCell column={{ key: 'reportKindsLabel' }} current={overdueSort} label="구분" onChange={setOverdueSort} />
                      </tr>
                    </thead>
                    <tbody>
                      {overdueSiteRows.map((row) => (
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
              <span className="app-chip">{pendingReviewRows.length}건</span>
            </div>
          </div>
          <div className={styles.sectionBody}>
            {pendingReviewRows.length === 0 ? (
              renderEmptyRow('확인 대기 보고서가 없습니다.')
            ) : (
              <div className={styles.tableShell}>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <SortableHeaderCell column={{ key: 'reportTitle' }} current={reviewSort} label="보고서" onChange={setReviewSort} />
                        <SortableHeaderCell column={{ key: 'siteName' }} current={reviewSort} label="현장" onChange={setReviewSort} />
                        <SortableHeaderCell column={{ key: 'assigneeName' }} current={reviewSort} label="담당자" onChange={setReviewSort} />
                        <SortableHeaderCell column={{ key: 'qualityLabel' }} current={reviewSort} defaultDirection="desc" label="품질 상태" onChange={setReviewSort} />
                        <SortableHeaderCell column={{ key: 'updatedAt' }} current={reviewSort} defaultDirection="desc" label="수정일" onChange={setReviewSort} />
                      </tr>
                    </thead>
                    <tbody>
                      {pendingReviewRows.map((row) => (
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
              <span className="app-chip">{workerLoadRows.length}명</span>
            </div>
          </div>
          <div className={styles.sectionBody}>
            {workerLoadRows.length === 0 ? (
              renderEmptyRow('주의가 필요한 요원이 없습니다.')
            ) : (
              <div className={styles.tableShell}>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <SortableHeaderCell column={{ key: 'userName' }} current={workerSort} label="요원" onChange={setWorkerSort} />
                        <SortableHeaderCell column={{ key: 'assignedSiteCount' }} current={workerSort} defaultDirection="desc" label="배정 현장" onChange={setWorkerSort} />
                        <SortableHeaderCell column={{ key: 'overdueCount' }} current={workerSort} defaultDirection="desc" label="지연 건수" onChange={setWorkerSort} />
                        <SortableHeaderCell column={{ key: 'loadLabel' }} current={workerSort} label="상태" onChange={setWorkerSort} />
                      </tr>
                    </thead>
                    <tbody>
                      {workerLoadRows.map((row) => (
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
              <span className="app-chip">{deadlineRows.length}건</span>
            </div>
          </div>
          <div className={styles.sectionBody}>
            {deadlineRows.length === 0 ? (
              renderEmptyRow('7일 이내 마감 예정 보고서가 없습니다.')
            ) : (
              <div className={styles.tableShell}>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <SortableHeaderCell column={{ key: 'reportTitle' }} current={deadlineSort} label="보고서" onChange={setDeadlineSort} />
                        <SortableHeaderCell column={{ key: 'siteName' }} current={deadlineSort} label="현장" onChange={setDeadlineSort} />
                        <SortableHeaderCell column={{ key: 'deadlineDate' }} current={deadlineSort} defaultDirection="asc" label="마감일" onChange={setDeadlineSort} />
                        <SortableHeaderCell column={{ key: 'deadlineLabel' }} current={deadlineSort} defaultDirection="asc" label="남은 기간" onChange={setDeadlineSort} />
                        <SortableHeaderCell column={{ key: 'statusLabel' }} current={deadlineSort} label="상태" onChange={setDeadlineSort} />
                      </tr>
                    </thead>
                    <tbody>
                      {deadlineRows.map((row) => (
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
            {completionRows.length === 0 ? (
              renderEmptyRow('추가 보완이 필요한 현장이 없습니다.')
            ) : (
              <div className={styles.tableShell}>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <SortableHeaderCell column={{ key: 'siteName' }} current={completionSort} label="현장" onChange={setCompletionSort} />
                        <SortableHeaderCell column={{ key: 'headquarterName' }} current={completionSort} label="사업장" onChange={setCompletionSort} />
                        <SortableHeaderCell column={{ key: 'missingItems' }} current={completionSort} defaultDirection="desc" label="누락 항목" onChange={setCompletionSort} />
                      </tr>
                    </thead>
                    <tbody>
                      {completionRows.map((row) => (
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
            {scheduleRows.length === 0 ? (
              renderEmptyRow('일정 충돌 또는 구간 밖 일정이 없습니다.')
            ) : (
              <div className={styles.tableShell}>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <SortableHeaderCell column={{ key: 'siteName' }} current={scheduleSort} label="현장" onChange={setScheduleSort} />
                        <SortableHeaderCell column={{ key: 'roundNo' }} current={scheduleSort} defaultDirection="desc" label="회차" onChange={setScheduleSort} />
                        <SortableHeaderCell column={{ key: 'plannedDate' }} current={scheduleSort} defaultDirection="asc" label="방문일" onChange={setScheduleSort} />
                        <SortableHeaderCell column={{ key: 'assigneeName' }} current={scheduleSort} label="담당자" onChange={setScheduleSort} />
                        <th>이슈</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scheduleRows.map((row) => (
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
          {alerts.length === 0 ? (
            renderEmptyRow('현재 확인이 필요한 알림이 없습니다.')
          ) : (
            <div className={styles.tableShell}>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <SortableHeaderCell column={{ key: 'title' }} current={alertSort} label="유형" onChange={setAlertSort} />
                      <SortableHeaderCell column={{ key: 'description' }} current={alertSort} label="내용" onChange={setAlertSort} />
                      <SortableHeaderCell column={{ key: 'severity' }} current={alertSort} defaultDirection="asc" label="심각도" onChange={setAlertSort} />
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.slice(0, 12).map((alert) => (
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
