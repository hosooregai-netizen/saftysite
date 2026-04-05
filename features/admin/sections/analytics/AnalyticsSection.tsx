'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  buildSortMenuOptions,
  SortableHeaderCell,
} from '@/features/admin/components/SortableHeaderCell';
import { SectionHeaderFilterMenu } from '@/features/admin/components/SectionHeaderFilterMenu';
import { AnalyticsCharts } from '@/features/admin/sections/analytics/AnalyticsCharts';
import {
  buildAdminAnalyticsModel,
  getAnalyticsExportSheets,
  type AdminAnalyticsPeriod,
} from '@/features/admin/lib/buildAdminControlCenterModel';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import { fetchAdminAnalytics } from '@/lib/admin/apiClient';
import {
  exportAdminWorkbook,
} from '@/lib/admin/exportClient';
import type { SafetyAdminAnalyticsResponse, TableSortState } from '@/types/admin';
import type { SafetyReportListItem } from '@/types/backend';
import type { ControllerDashboardData } from '@/types/controller';

interface AnalyticsSectionProps {
  data: ControllerDashboardData;
  reports: SafetyReportListItem[];
}

export function AnalyticsSection({
  data,
  reports,
}: AnalyticsSectionProps) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('query') || '');
  const [period, setPeriod] = useState<AdminAnalyticsPeriod>(() => {
    const value = searchParams.get('period');
    return value === 'month' ||
      value === 'quarter' ||
      value === 'year' ||
      value === 'all'
      ? value
      : 'month';
  });
  const [headquarterId, setHeadquarterId] = useState(() => searchParams.get('headquarterId') || '');
  const [userId, setUserId] = useState(() => searchParams.get('userId') || '');
  const [contractType, setContractType] = useState(() => searchParams.get('contractType') || '');
  const [employeeSort, setEmployeeSort] = useState<TableSortState>({
    direction: 'desc',
    key: 'visitRevenue',
  });
  const [siteRevenueSort, setSiteRevenueSort] = useState<TableSortState>({
    direction: 'desc',
    key: 'visitRevenue',
  });
  const [remoteAnalytics, setRemoteAnalytics] = useState<SafetyAdminAnalyticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fallbackAnalytics = useMemo(
    () =>
      buildAdminAnalyticsModel(data, reports, {
        contractType,
        headquarterId,
        period,
        query,
        userId,
      }),
    [contractType, data, headquarterId, period, query, reports, userId],
  );

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setError(null);
        const response = await fetchAdminAnalytics({
          contractType,
          headquarterId,
          period,
          query,
          userId,
        });
        if (!cancelled) {
          setRemoteAnalytics(response);
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(
            nextError instanceof Error ? nextError.message : '실적/매출 대시보드를 불러오지 못했습니다.',
          );
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [contractType, headquarterId, period, query, userId]);

  const analytics = remoteAnalytics ?? fallbackAnalytics;
  const activeFilterCount =
    (period !== 'month' ? 1 : 0) +
    (headquarterId ? 1 : 0) +
    (userId ? 1 : 0) +
    (contractType ? 1 : 0);

  const sortedEmployeeRows = useMemo(() => {
    const direction = employeeSort.direction === 'asc' ? 1 : -1;
    const getSortValue = (row: (typeof analytics.employeeRows)[number]) => {
      switch (employeeSort.key) {
        case 'userName':
          return row.userName;
        case 'assignedSiteCount':
          return row.assignedSiteCount;
        case 'completedReportCount':
          return row.completedReportCount;
        case 'contractContributionRevenue':
          return row.contractContributionRevenue;
        case 'overdueCount':
          return row.overdueCount;
        case 'visitRevenue':
        default:
          return row.visitRevenue;
      }
    };

    return [...analytics.employeeRows].sort((left, right) => {
      if (employeeSort.key === 'userName') {
        return String(getSortValue(left)).localeCompare(String(getSortValue(right)), 'ko') * direction;
      }

      return (Number(getSortValue(left)) - Number(getSortValue(right))) * direction;
    });
  }, [analytics, employeeSort.direction, employeeSort.key]);

  const sortedSiteRevenueRows = useMemo(() => {
    const direction = siteRevenueSort.direction === 'asc' ? 1 : -1;
    const getSortValue = (row: (typeof analytics.siteRevenueRows)[number]) => {
      switch (siteRevenueSort.key) {
        case 'siteName':
          return row.siteName;
        case 'headquarterName':
          return row.headquarterName;
        case 'contractTypeLabel':
          return row.contractTypeLabel;
        case 'executedRounds':
          return row.executedRounds;
        case 'contractContributionRevenue':
          return row.contractContributionRevenue;
        case 'visitRevenue':
        default:
          return row.visitRevenue;
      }
    };

    return [...analytics.siteRevenueRows].sort((left, right) => {
      if (
        siteRevenueSort.key === 'siteName' ||
        siteRevenueSort.key === 'headquarterName' ||
        siteRevenueSort.key === 'contractTypeLabel'
      ) {
        return String(getSortValue(left)).localeCompare(String(getSortValue(right)), 'ko') * direction;
      }
      return (Number(getSortValue(left)) - Number(getSortValue(right))) * direction;
    });
  }, [analytics, siteRevenueSort.direction, siteRevenueSort.key]);

  const handleExport = () =>
    exportAdminWorkbook(
      'analytics',
      getAnalyticsExportSheets({
        ...analytics,
        employeeRows: sortedEmployeeRows,
        siteRevenueRows: sortedSiteRevenueRows,
      }),
    );

  const resetHeaderFilters = () => {
    setPeriod('month');
    setHeadquarterId('');
    setUserId('');
    setContractType('');
  };

  return (
    <div className={styles.dashboardStack}>
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderTitleBlock}>
            <h2 className={styles.sectionTitle}>매출/실적 집계</h2>
          </div>
          <div className={`${styles.sectionHeaderActions} ${styles.sectionHeaderToolbarActions}`}>
            <input
              className={`app-input ${styles.sectionHeaderSearch} ${styles.sectionHeaderToolbarSearch}`}
              placeholder="직원명, 현장명, 사업장명으로 검색"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <SectionHeaderFilterMenu
              activeCount={activeFilterCount}
              ariaLabel="실적 집계 필터"
              onReset={resetHeaderFilters}
            >
              <div className={styles.sectionHeaderMenuGrid}>
                <div className={styles.sectionHeaderMenuField}>
                  <label htmlFor="analytics-filter-period">집계 기간</label>
                  <select
                    id="analytics-filter-period"
                    className="app-select"
                    value={period}
                    onChange={(event) => setPeriod(event.target.value as AdminAnalyticsPeriod)}
                  >
                    <option value="month">월</option>
                    <option value="quarter">분기</option>
                    <option value="year">연</option>
                    <option value="all">전체</option>
                  </select>
                </div>
                <div className={styles.sectionHeaderMenuField}>
                  <label htmlFor="analytics-filter-headquarter">사업장</label>
                  <select
                    id="analytics-filter-headquarter"
                    className="app-select"
                    value={headquarterId}
                    onChange={(event) => setHeadquarterId(event.target.value)}
                  >
                    <option value="">전체 사업장</option>
                    {data.headquarters.map((headquarter) => (
                      <option key={headquarter.id} value={headquarter.id}>
                        {headquarter.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.sectionHeaderMenuField}>
                  <label htmlFor="analytics-filter-user">직원</label>
                  <select
                    id="analytics-filter-user"
                    className="app-select"
                    value={userId}
                    onChange={(event) => setUserId(event.target.value)}
                  >
                    <option value="">전체 직원</option>
                    {data.users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.sectionHeaderMenuField}>
                  <label htmlFor="analytics-filter-contract-type">계약유형</label>
                  <select
                    id="analytics-filter-contract-type"
                    className="app-select"
                    value={contractType}
                    onChange={(event) => setContractType(event.target.value)}
                  >
                    <option value="">전체 계약유형</option>
                    <option value="private">민간계약</option>
                    <option value="negotiated">수의계약</option>
                    <option value="bid">입찰계약</option>
                    <option value="maintenance">유지보수</option>
                    <option value="other">기타</option>
                  </select>
                </div>
              </div>
            </SectionHeaderFilterMenu>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => void handleExport()}
            >
              엑셀 내보내기
            </button>
          </div>
        </div>
        <div className={styles.sectionBody}>
          {error ? <div className={styles.bannerError}>{error}</div> : null}
          <div className={styles.metricGrid}>
            {analytics.summaryCards.map((card) => (
              <div key={card.label} className={styles.metricStatCard}>
                <span className={styles.metricLinkLabel}>{card.label}</span>
                <strong className={styles.metricLinkValue}>{card.value}</strong>
                <span className={styles.metricLinkMeta}>{card.meta}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>실적/매출 시각화</h2>
          </div>
        </div>
        <div className={styles.sectionBody}>
          <AnalyticsCharts
            contractTypeRows={analytics.contractTypeRows}
            employeeRows={sortedEmployeeRows}
            siteRevenueRows={sortedSiteRevenueRows}
            stats={analytics.stats}
          />
        </div>
      </section>

      <section className={`${styles.sectionCard} ${styles.listSectionCard}`}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>직원별 실적/매출</h2>
          </div>
          <div className={styles.sectionHeaderActions} />
        </div>
        <div className={styles.sectionBody}>
          {sortedEmployeeRows.length === 0 ? (
            <div className={styles.tableEmpty}>조건에 맞는 실적 데이터가 없습니다.</div>
          ) : (
            <div className={styles.tableShell}>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <SortableHeaderCell
                        column={{ key: 'userName' }}
                        current={employeeSort}
                        label="직원명"
                        onChange={setEmployeeSort}
                      />
                      <SortableHeaderCell
                        column={{ key: 'assignedSiteCount' }}
                        current={employeeSort}
                        defaultDirection="desc"
                        label="배정 현장 수"
                        onChange={setEmployeeSort}
                      />
                      <SortableHeaderCell
                        column={{ key: 'completedReportCount' }}
                        current={employeeSort}
                        defaultDirection="desc"
                        label="완료 보고서 수"
                        onChange={setEmployeeSort}
                      />
                      <th>분기 보고 완료 수</th>
                      <th>불량사업장 제출 수</th>
                      <th>총 회차 배정</th>
                      <th>실행 회차</th>
                      <SortableHeaderCell
                        column={{ key: 'visitRevenue' }}
                        current={employeeSort}
                        defaultDirection="desc"
                        label="회차 매출"
                        onChange={setEmployeeSort}
                      />
                      <SortableHeaderCell
                        column={{ key: 'contractContributionRevenue' }}
                        current={employeeSort}
                        defaultDirection="desc"
                        label="총 계약 기여 매출"
                        onChange={setEmployeeSort}
                      />
                      <SortableHeaderCell
                        column={{ key: 'overdueCount' }}
                        current={employeeSort}
                        defaultDirection="desc"
                        label="지연 건수"
                        onChange={setEmployeeSort}
                      />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedEmployeeRows.map((row) => (
                      <tr key={row.userId}>
                        <td>{row.userName}</td>
                        <td>{row.assignedSiteCount}개</td>
                        <td>{row.completedReportCount}건</td>
                        <td>{row.quarterlyCompletedCount}건</td>
                        <td>{row.badWorkplaceSubmittedCount}건</td>
                        <td>{row.totalAssignedRounds}회</td>
                        <td>{row.executedRounds}회</td>
                        <td>{row.visitRevenue.toLocaleString('ko-KR')}원</td>
                        <td>{row.contractContributionRevenue.toLocaleString('ko-KR')}원</td>
                        <td>{row.overdueCount}건</td>
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
            <h2 className={styles.sectionTitle}>현장별 매출</h2>
          </div>
        </div>
        <div className={styles.sectionBody}>
          {sortedSiteRevenueRows.length === 0 ? (
            <div className={styles.tableEmpty}>집계 가능한 현장 매출 데이터가 없습니다.</div>
          ) : (
            <div className={styles.tableShell}>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <SortableHeaderCell
                        column={{ key: 'siteName' }}
                        current={siteRevenueSort}
                        label="현장"
                        onChange={setSiteRevenueSort}
                        sortMenuOptions={buildSortMenuOptions('siteName', {
                          asc: '현장 가나다순',
                          desc: '현장 역순',
                        })}
                      />
                      <SortableHeaderCell
                        column={{ key: 'headquarterName' }}
                        current={siteRevenueSort}
                        label="사업장"
                        onChange={setSiteRevenueSort}
                        sortMenuOptions={buildSortMenuOptions('headquarterName', {
                          asc: '사업장 가나다순',
                          desc: '사업장 역순',
                        })}
                      />
                      <SortableHeaderCell
                        column={{ key: 'contractTypeLabel' }}
                        current={siteRevenueSort}
                        label="계약유형"
                        onChange={setSiteRevenueSort}
                        sortMenuOptions={buildSortMenuOptions('contractTypeLabel', {
                          asc: '계약유형 오름차순',
                          desc: '계약유형 내림차순',
                        })}
                      />
                      <SortableHeaderCell
                        column={{ key: 'executedRounds' }}
                        current={siteRevenueSort}
                        defaultDirection="desc"
                        label="실행 회차"
                        onChange={setSiteRevenueSort}
                      />
                      <SortableHeaderCell
                        column={{ key: 'visitRevenue' }}
                        current={siteRevenueSort}
                        defaultDirection="desc"
                        label="회차 매출"
                        onChange={setSiteRevenueSort}
                      />
                      <SortableHeaderCell
                        column={{ key: 'contractContributionRevenue' }}
                        current={siteRevenueSort}
                        defaultDirection="desc"
                        label="총 계약 기여 매출"
                        onChange={setSiteRevenueSort}
                      />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSiteRevenueRows.map((row) => (
                      <tr key={`${row.siteName}-${row.href}`}>
                        <td>
                          <Link href={row.href} className={styles.tableInlineLink}>
                            {row.siteName}
                          </Link>
                        </td>
                        <td>{row.headquarterName}</td>
                        <td>{row.contractTypeLabel}</td>
                        <td>{row.executedRounds}회</td>
                        <td>{row.visitRevenue.toLocaleString('ko-KR')}원</td>
                        <td>{row.contractContributionRevenue.toLocaleString('ko-KR')}원</td>
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
