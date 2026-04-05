'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  buildSortMenuOptions,
  SortableHeaderCell,
} from '@/features/admin/components/SortableHeaderCell';
import {
  buildAdminOverviewModel,
  getOverviewExportSheets,
  type AdminOverviewChartEntry,
  type AdminOverviewModel,
} from '@/features/admin/lib/buildAdminControlCenterModel';
import { getDispatchStatusLabel } from '@/lib/admin/reportMeta';
import { fetchAdminOverview } from '@/lib/admin/apiClient';
import { exportAdminWorkbook } from '@/lib/admin/exportClient';
import {
  buildDonutSlices,
  fullDonutRing,
} from '@/components/session/workspace/chartDonutUtils';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import type { SafetyAdminOverviewResponse, TableSortState } from '@/types/admin';
import type { SafetyReportListItem } from '@/types/backend';
import type { ControllerDashboardData } from '@/types/controller';

interface AdminOverviewSectionProps {
  data: ControllerDashboardData;
  reports: SafetyReportListItem[];
}

const EMPTY_DONUT_RING = fullDonutRing(0, 0, 22, 40);

function renderEmptyRow(label: string) {
  return <div className={styles.tableEmpty}>{label}</div>;
}

function compareText(left: string, right: string, direction: TableSortState['direction']) {
  return left.localeCompare(right, 'ko') * (direction === 'asc' ? 1 : -1);
}

function compareNumber(left: number, right: number, direction: TableSortState['direction']) {
  return (left - right) * (direction === 'asc' ? 1 : -1);
}

function hasVisibleChartEntries(entries: AdminOverviewChartEntry[]) {
  return entries.some((entry) => entry.count > 0);
}

function hasSiteStatusSummary(summary: SafetyAdminOverviewResponse['siteStatusSummary']) {
  return summary.totalSiteCount > 0 || hasVisibleChartEntries(summary.entries);
}

function hasQuarterlyMaterialSummary(
  summary: SafetyAdminOverviewResponse['quarterlyMaterialSummary'],
) {
  return (
    summary.totalSiteCount > 0 ||
    hasVisibleChartEntries(summary.entries) ||
    summary.missingSiteRows.length > 0 ||
    Boolean(summary.quarterLabel)
  );
}

function hasDeadlineSignalSummary(summary: SafetyAdminOverviewResponse['deadlineSignalSummary']) {
  return summary.totalReportCount > 0 || hasVisibleChartEntries(summary.entries);
}

function formatSyncTimestamp(value: Date | null) {
  if (!value) return '서버 동기화 전';
  return value.toLocaleString('ko-KR', {
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: '2-digit',
  });
}

function getDispatchStatusTone(
  status: SafetyAdminOverviewResponse['unsentReportRows'][number]['dispatchStatus'],
) {
  switch (status) {
    case 'overdue':
      return styles.overviewTableStatusDanger;
    case 'warning':
      return styles.overviewTableStatusWarning;
    case 'sent':
      return styles.overviewTableStatusSuccess;
    default:
      return styles.overviewTableStatusNeutral;
  }
}

function isActionableDispatchStatus(
  status: SafetyAdminOverviewResponse['unsentReportRows'][number]['dispatchStatus'],
) {
  return status === 'warning' || status === 'overdue';
}

const DEADLINE_SIGNAL_COLOR_BY_KEY: Record<string, string> = {
  d_plus_0_3: '#dbe7f6',
  d_plus_4_6: '#dfbb73',
  d_plus_7_plus: '#d96f6f',
};

function DonutOverviewCard({
  entries,
  title,
  totalLabel,
  totalValue,
}: {
  entries: AdminOverviewChartEntry[];
  title: string;
  totalLabel: string;
  totalValue: number;
}) {
  const populatedEntries = entries.filter((entry) => entry.count > 0);
  const slices =
    totalValue > 0
      ? buildDonutSlices(
          populatedEntries.map((entry) => ({ count: entry.count, label: entry.key })),
          totalValue,
        )
      : [];
  const colorByKey = new Map(slices.map((slice) => [slice.label, slice.color]));

  return (
    <article className={styles.kpiVisualCard}>
      <div className={styles.kpiVisualHeader}>
        <div>
          <h2 className={styles.kpiVisualTitle}>{title}</h2>
        </div>
      </div>

      <div className={styles.kpiDonutLayout}>
        <div className={styles.kpiDonutFigure}>
          <svg
            className={styles.kpiDonutSvg}
            viewBox="-50 -50 100 100"
            role="img"
            aria-label={`${title}: 총 ${totalValue}`}
          >
            <title>{`${title}: 총 ${totalValue}`}</title>
            <path d={EMPTY_DONUT_RING} fill="#e8edf3" />
            {slices.map((slice) => (
              <path key={slice.label} d={slice.path} fill={slice.color} stroke="none" />
            ))}
          </svg>
          <div className={styles.kpiDonutCenter} aria-hidden="true">
            <strong>{totalValue}</strong>
            <span>{totalLabel}</span>
          </div>
        </div>

        <ul className={styles.kpiLegend}>
          {entries.map((entry) => (
            <li key={entry.key} className={styles.kpiLegendItem}>
              <span
                className={styles.kpiLegendSwatch}
                style={{
                  backgroundColor:
                    totalValue > 0 && entry.count > 0
                      ? colorByKey.get(entry.key) ?? '#4f8ae8'
                      : '#d7e0e8',
                }}
                aria-hidden="true"
              />
              <Link href={entry.href} className={styles.tableInlineLink}>
                {entry.label}
              </Link>
              <span className={styles.kpiLegendValue}>{entry.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function DeadlineSignalOverviewCard({
  entries,
  title,
  totalValue,
}: {
  entries: AdminOverviewChartEntry[];
  title: string;
  totalValue: number;
}) {
  const normalizedEntries = entries.map((entry) => ({
    ...entry,
    color: DEADLINE_SIGNAL_COLOR_BY_KEY[entry.key] ?? '#4f8ae8',
    width: totalValue > 0 ? `${(entry.count / totalValue) * 100}%` : '0%',
  }));

  return (
    <article className={styles.kpiVisualCard}>
      <div className={styles.kpiVisualHeader}>
        <div>
          <h2 className={styles.kpiVisualTitle}>{title}</h2>
        </div>
        <span className={styles.kpiSignalTotal}>{`${totalValue}건`}</span>
      </div>

      <div className={styles.kpiSignalSummary}>
        <div
          className={styles.kpiSignalTrack}
          role="img"
          aria-label={`${title}: 총 ${totalValue}건`}
        >
          {normalizedEntries.map((entry) =>
            entry.count > 0 ? (
              <span
                key={entry.key}
                className={styles.kpiSignalSegment}
                style={{ backgroundColor: entry.color, width: entry.width }}
                aria-hidden="true"
              />
            ) : null,
          )}
        </div>

        <ul className={styles.kpiSignalLegend}>
          {normalizedEntries.map((entry) => (
            <li key={entry.key} className={styles.kpiSignalLegendItem}>
              <span
                className={styles.kpiLegendSwatch}
                style={{
                  backgroundColor: entry.count > 0 ? entry.color : '#d7e0e8',
                }}
                aria-hidden="true"
              />
              <Link href={entry.href} className={`${styles.tableInlineLink} ${styles.kpiSignalLegendLabel}`}>
                {entry.label}
              </Link>
              <span className={styles.kpiSignalLegendValue}>{`${entry.count}건`}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export function AdminOverviewSection({
  data,
  reports,
}: AdminOverviewSectionProps) {
  const fallbackOverview = useMemo(
    () =>
      ({
        ...buildAdminOverviewModel(data, reports),
        alerts: [],
        completionRows: [],
        scheduleRows: [],
      } satisfies SafetyAdminOverviewResponse),
    [data, reports],
  );
  const [overviewResponse, setOverviewResponse] = useState<SafetyAdminOverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [materialSort, setMaterialSort] = useState<TableSortState>({
    direction: 'desc',
    key: 'missingTotal',
  });
  const [unsentSort, setUnsentSort] = useState<TableSortState>({
    direction: 'desc',
    key: 'unsentDays',
  });

  const refreshOverview = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const nextOverview = await fetchAdminOverview();
      setOverviewResponse(nextOverview);
      setLastSyncedAt(new Date());
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : '관제 대시보드를 불러오지 못했습니다.',
      );
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refreshOverview();
  }, [refreshOverview]);

  const overview = useMemo(() => {
    if (!overviewResponse) {
      return fallbackOverview;
    }

    return {
      ...overviewResponse,
      deadlineSignalSummary: hasDeadlineSignalSummary(overviewResponse.deadlineSignalSummary)
        ? overviewResponse.deadlineSignalSummary
        : fallbackOverview.deadlineSignalSummary,
      quarterlyMaterialSummary: hasQuarterlyMaterialSummary(overviewResponse.quarterlyMaterialSummary)
        ? {
            ...overviewResponse.quarterlyMaterialSummary,
            quarterKey:
              overviewResponse.quarterlyMaterialSummary.quarterKey ||
              fallbackOverview.quarterlyMaterialSummary.quarterKey,
            quarterLabel:
              overviewResponse.quarterlyMaterialSummary.quarterLabel ||
              fallbackOverview.quarterlyMaterialSummary.quarterLabel,
          }
        : fallbackOverview.quarterlyMaterialSummary,
      siteStatusSummary: hasSiteStatusSummary(overviewResponse.siteStatusSummary)
        ? overviewResponse.siteStatusSummary
        : fallbackOverview.siteStatusSummary,
      unsentReportRows:
        overviewResponse.unsentReportRows.length > 0 || fallbackOverview.unsentReportRows.length === 0
          ? overviewResponse.unsentReportRows
          : fallbackOverview.unsentReportRows,
    } satisfies SafetyAdminOverviewResponse;
  }, [fallbackOverview, overviewResponse]);

  const normalizedUnsentReportRows = useMemo(() => {
    const fallbackRowsByKey = new Map(
      fallbackOverview.unsentReportRows.map((row) => [row.reportKey, row]),
    );

    return overview.unsentReportRows
      .map((row) => {
        const fallbackRow = fallbackRowsByKey.get(row.reportKey);
        return {
          ...fallbackRow,
          ...row,
          assigneeName: row.assigneeName || fallbackRow?.assigneeName || '-',
        };
      })
      .filter((row) => isActionableDispatchStatus(row.dispatchStatus));
  }, [fallbackOverview.unsentReportRows, overview.unsentReportRows]);

  const sortedMaterialRows = useMemo(() => {
    return [...overview.quarterlyMaterialSummary.missingSiteRows].sort((left, right) => {
      const leftMissingTotal = left.education.missingCount + left.measurement.missingCount;
      const rightMissingTotal = right.education.missingCount + right.measurement.missingCount;

      switch (materialSort.key) {
        case 'siteName':
          return compareText(left.siteName, right.siteName, materialSort.direction);
        case 'headquarterName':
          return compareText(left.headquarterName, right.headquarterName, materialSort.direction);
        case 'educationMissing':
          return compareNumber(
            left.education.missingCount,
            right.education.missingCount,
            materialSort.direction,
          );
        case 'measurementMissing':
          return compareNumber(
            left.measurement.missingCount,
            right.measurement.missingCount,
            materialSort.direction,
          );
        case 'missingTotal':
        default:
          return compareNumber(leftMissingTotal, rightMissingTotal, materialSort.direction);
      }
    });
  }, [materialSort.direction, materialSort.key, overview.quarterlyMaterialSummary.missingSiteRows]);

  const sortedUnsentReportRows = useMemo(() => {
    return [...normalizedUnsentReportRows].sort((left, right) => {
      switch (unsentSort.key) {
        case 'siteName':
          return compareText(left.siteName, right.siteName, unsentSort.direction);
        case 'headquarterName':
          return compareText(left.headquarterName, right.headquarterName, unsentSort.direction);
        case 'reportTitle':
          return compareText(left.reportTitle, right.reportTitle, unsentSort.direction);
        case 'assigneeName':
          return compareText(left.assigneeName, right.assigneeName, unsentSort.direction);
        case 'visitDate':
          return compareText(left.visitDate, right.visitDate, unsentSort.direction);
        case 'unsentDays':
        default:
          return compareNumber(left.unsentDays, right.unsentDays, unsentSort.direction);
      }
    });
  }, [normalizedUnsentReportRows, unsentSort.direction, unsentSort.key]);

  const exportOverview = useCallback(async () => {
    const exportModel: AdminOverviewModel = {
      coverageRows: overview.coverageRows,
      deadlineSignalSummary: overview.deadlineSignalSummary,
      deadlineRows: overview.deadlineRows,
      metricCards: overview.metricCards,
      overdueSiteRows: overview.overdueSiteRows,
      pendingReviewRows: overview.pendingReviewRows,
      quarterlyMaterialSummary: {
        ...overview.quarterlyMaterialSummary,
        missingSiteRows: sortedMaterialRows,
      },
      siteStatusSummary: overview.siteStatusSummary,
      summaryRows: overview.summaryRows,
      unsentReportRows: sortedUnsentReportRows,
      workerLoadRows: overview.workerLoadRows,
    };

    await exportAdminWorkbook('overview', getOverviewExportSheets(exportModel));
  }, [overview, sortedMaterialRows, sortedUnsentReportRows]);

  return (
    <div className={styles.dashboardStack}>
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>운영 개요</h2>
            <div className={styles.sectionHeaderMeta}>
              마지막 갱신 {formatSyncTimestamp(lastSyncedAt)}
            </div>
          </div>
          <div className={styles.sectionHeaderActions}>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => void refreshOverview()}
              disabled={isRefreshing}
            >
              {isRefreshing ? '새로고침 중...' : '새로고침'}
            </button>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => void exportOverview()}
            >
              엑셀 내보내기
            </button>
          </div>
        </div>
        <div className={`${styles.sectionBody} ${styles.kpiPanelBody}`}>
          {error ? <div className={styles.bannerError}>{error}</div> : null}

          <div className={styles.kpiVisualGrid}>
            <DonutOverviewCard
              title="현장 상태"
              entries={overview.siteStatusSummary.entries}
              totalLabel="전체 현장"
              totalValue={overview.siteStatusSummary.totalSiteCount}
            />
            <DonutOverviewCard
              title="교육/계측 자료 충족 상태"
              entries={overview.quarterlyMaterialSummary.entries}
              totalLabel={overview.quarterlyMaterialSummary.quarterLabel}
              totalValue={overview.quarterlyMaterialSummary.totalSiteCount}
            />
            <DeadlineSignalOverviewCard
              title="미발송 경과 현황"
              entries={overview.deadlineSignalSummary.entries}
              totalValue={overview.deadlineSignalSummary.totalReportCount}
            />
          </div>
        </div>
      </section>

      <div className={styles.dashboardStack}>
        <section className={`${styles.sectionCard} ${styles.listSectionCard} ${styles.overviewTableCard}`}>
          <div className={styles.sectionHeader}>
            <div className={styles.overviewTableHeaderBlock}>
              <h2 className={styles.sectionTitle}>발송 관리 대상</h2>
            </div>
            <div className={styles.sectionHeaderActions}>
              <span className={styles.overviewTableCount}>
                {sortedUnsentReportRows.length.toLocaleString('ko-KR')}건
              </span>
            </div>
          </div>
          <div className={styles.sectionBody}>
            {sortedUnsentReportRows.length === 0 ? (
              renderEmptyRow('현재 조치가 필요한 발송 관리 대상이 없습니다.')
            ) : (
              <div className={styles.tableShell}>
                <div className={styles.tableWrap}>
                  <table className={`${styles.table} ${styles.overviewUnsentTable}`}>
                    <colgroup>
                      <col className={styles.overviewColSite} />
                      <col className={styles.overviewColHeadquarter} />
                      <col className={styles.overviewColReport} />
                      <col className={styles.overviewColType} />
                      <col className={styles.overviewColAssignee} />
                      <col className={styles.overviewColDate} />
                      <col className={styles.overviewColElapsed} />
                      <col className={styles.overviewColStatus} />
                    </colgroup>
                    <thead>
                      <tr>
                        <SortableHeaderCell
                          column={{ key: 'siteName' }}
                          current={unsentSort}
                          label="현장"
                          onChange={setUnsentSort}
                          sortMenuOptions={buildSortMenuOptions('siteName', {
                            asc: '현장 가나다순',
                            desc: '현장 역순',
                          })}
                        />
                        <SortableHeaderCell
                          column={{ key: 'headquarterName' }}
                          current={unsentSort}
                          label="사업장"
                          onChange={setUnsentSort}
                          sortMenuOptions={buildSortMenuOptions('headquarterName', {
                            asc: '사업장 가나다순',
                            desc: '사업장 역순',
                          })}
                        />
                        <SortableHeaderCell
                          column={{ key: 'reportTitle' }}
                          current={unsentSort}
                          label="보고서"
                          onChange={setUnsentSort}
                        />
                        <th>유형</th>
                        <SortableHeaderCell
                          column={{ key: 'assigneeName' }}
                          current={unsentSort}
                          label="담당자"
                          onChange={setUnsentSort}
                          sortMenuOptions={buildSortMenuOptions('assigneeName', {
                            asc: '담당자 가나다순',
                            desc: '담당자 역순',
                          })}
                        />
                        <SortableHeaderCell
                          column={{ key: 'visitDate' }}
                          current={unsentSort}
                          defaultDirection="desc"
                          label="지도 실시일"
                          onChange={setUnsentSort}
                        />
                        <SortableHeaderCell
                          column={{ key: 'unsentDays' }}
                          current={unsentSort}
                          defaultDirection="desc"
                          label="미발송 경과"
                          onChange={setUnsentSort}
                          sortMenuOptions={buildSortMenuOptions('unsentDays', {
                            asc: '최근 지도 우선',
                            desc: '오래 미발송된 순',
                          })}
                        />
                        <th>상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedUnsentReportRows.map((row) => (
                        <tr key={row.reportKey}>
                          <td>
                            <div className={styles.tablePrimary}>{row.siteName}</div>
                          </td>
                          <td>
                            <span className={styles.overviewTableMuted}>{row.headquarterName}</span>
                          </td>
                          <td>
                            <Link
                              href={row.href}
                              className={`${styles.tableInlineLink} ${styles.overviewTableWrapLink}`}
                            >
                              {row.reportTitle}
                            </Link>
                          </td>
                          <td>
                            <span className={styles.overviewTableMuted}>{row.reportTypeLabel}</span>
                          </td>
                          <td>
                            <span className={styles.overviewTableMetric}>{row.assigneeName || '-'}</span>
                          </td>
                          <td>
                            <span className={styles.overviewTableMetric}>{row.visitDate}</span>
                          </td>
                          <td>
                            <span className={styles.overviewTableMetric}>{`D+${row.unsentDays}`}</span>
                          </td>
                          <td>
                            <span
                              className={`${styles.overviewTableStatus} ${getDispatchStatusTone(row.dispatchStatus)}`}
                            >
                              {getDispatchStatusLabel(row.dispatchStatus)}
                            </span>
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

        <section className={`${styles.sectionCard} ${styles.listSectionCard} ${styles.overviewTableCard}`}>
          <div className={styles.sectionHeader}>
            <div className={styles.overviewTableHeaderBlock}>
              <h2 className={styles.sectionTitle}>교육/계측 자료 부족 현장</h2>
              {overview.quarterlyMaterialSummary.quarterLabel ? (
                <div className={styles.overviewTableScope}>
                  {overview.quarterlyMaterialSummary.quarterLabel}
                </div>
              ) : null}
            </div>
            <div className={styles.sectionHeaderActions}>
              <span className={styles.overviewTableCount}>
                {sortedMaterialRows.length.toLocaleString('ko-KR')}개 현장
              </span>
            </div>
          </div>
          <div className={styles.sectionBody}>
            {sortedMaterialRows.length === 0 ? (
              renderEmptyRow('현재 교육/계측 자료가 부족한 현장이 없습니다.')
            ) : (
              <div className={styles.tableShell}>
                <div className={styles.tableWrap}>
                  <table className={`${styles.table} ${styles.overviewMaterialTable}`}>
                    <colgroup>
                      <col className={styles.overviewColSiteWide} />
                      <col className={styles.overviewColHeadquarterWide} />
                      <col className={styles.overviewColMetric} />
                      <col className={styles.overviewColMetric} />
                      <col className={styles.overviewColMetric} />
                      <col className={styles.overviewColMetric} />
                      <col className={styles.overviewColMetric} />
                    </colgroup>
                    <thead>
                      <tr>
                        <SortableHeaderCell
                          column={{ key: 'siteName' }}
                          current={materialSort}
                          label="현장"
                          onChange={setMaterialSort}
                          sortMenuOptions={buildSortMenuOptions('siteName', {
                            asc: '현장 가나다순',
                            desc: '현장 역순',
                          })}
                        />
                        <SortableHeaderCell
                          column={{ key: 'headquarterName' }}
                          current={materialSort}
                          label="사업장"
                          onChange={setMaterialSort}
                          sortMenuOptions={buildSortMenuOptions('headquarterName', {
                            asc: '사업장 가나다순',
                            desc: '사업장 역순',
                          })}
                        />
                        <SortableHeaderCell
                          column={{ key: 'educationMissing' }}
                          current={materialSort}
                          defaultDirection="desc"
                          label="교육 부족"
                          onChange={setMaterialSort}
                          sortMenuOptions={buildSortMenuOptions('educationMissing', {
                            asc: '교육 부족 적은 순',
                            desc: '교육 부족 많은 순',
                          })}
                        />
                        <SortableHeaderCell
                          column={{ key: 'measurementMissing' }}
                          current={materialSort}
                          defaultDirection="desc"
                          label="계측 부족"
                          onChange={setMaterialSort}
                          sortMenuOptions={buildSortMenuOptions('measurementMissing', {
                            asc: '계측 부족 적은 순',
                            desc: '계측 부족 많은 순',
                          })}
                        />
                        <th>교육 현황</th>
                        <th>계측 현황</th>
                        <SortableHeaderCell
                          column={{ key: 'missingTotal' }}
                          current={materialSort}
                          defaultDirection="desc"
                          label="총 부족"
                          onChange={setMaterialSort}
                        />
                      </tr>
                    </thead>
                    <tbody>
                      {sortedMaterialRows.map((row) => {
                        const missingTotal =
                          row.education.missingCount + row.measurement.missingCount;
                        return (
                          <tr key={row.siteId}>
                            <td>
                              <Link href={row.href} className={styles.tableInlineLink}>
                                {row.siteName}
                              </Link>
                            </td>
                            <td>{row.headquarterName}</td>
                            <td>
                              <span className={styles.overviewTableStatus}>{`${row.education.missingCount}건`}</span>
                            </td>
                            <td>
                              <span className={styles.overviewTableStatus}>{`${row.measurement.missingCount}건`}</span>
                            </td>
                            <td>
                              <span className={styles.overviewTableMetric}>
                                {`${row.education.filledCount}/${row.education.requiredCount}`}
                              </span>
                            </td>
                            <td>
                              <span className={styles.overviewTableMetric}>
                                {`${row.measurement.filledCount}/${row.measurement.requiredCount}`}
                              </span>
                            </td>
                            <td>
                              <span className={styles.overviewTableStatus}>{`${missingTotal}건`}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
