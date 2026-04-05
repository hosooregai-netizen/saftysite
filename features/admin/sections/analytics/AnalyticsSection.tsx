'use client';

import Link from 'next/link';
import { useDeferredValue, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { SITE_CONTRACT_TYPE_LABELS, formatCurrencyValue } from '@/lib/admin';
import {
  buildSortMenuOptions,
  SortableHeaderCell,
} from '@/features/admin/components/SortableHeaderCell';
import { SectionHeaderFilterMenu } from '@/features/admin/components/SectionHeaderFilterMenu';
import { AnalyticsCharts } from '@/features/admin/sections/analytics/AnalyticsCharts';
import {
  buildAdminAnalyticsModel,
  formatAnalyticsStatValue,
  getAnalyticsExportSheets,
  type AdminAnalyticsPeriod,
} from '@/features/admin/lib/buildAdminControlCenterModel';
import sharedStyles from '@/features/admin/sections/AdminSectionShared.module.css';
import localStyles from '@/features/admin/sections/analytics/AnalyticsSection.module.css';
import { exportAdminWorkbook } from '@/lib/admin/exportClient';
import type { TableSortState } from '@/types/admin';
import type { SafetyReportListItem } from '@/types/backend';
import type { ControllerDashboardData } from '@/types/controller';

interface AnalyticsSectionProps {
  data: ControllerDashboardData;
  reports: SafetyReportListItem[];
}

const PERIOD_LABELS: Record<AdminAnalyticsPeriod, string> = {
  all: '전체 기간',
  month: '월 기준',
  quarter: '분기 기준',
  year: '연 기준',
};

function getDeltaClassName(tone: 'negative' | 'neutral' | 'positive') {
  switch (tone) {
    case 'positive':
      return localStyles.deltaPositive;
    case 'negative':
      return localStyles.deltaNegative;
    case 'neutral':
    default:
      return localStyles.deltaNeutral;
  }
}

function formatRevenueChange(value: number | null) {
  if (value == null || Number.isNaN(value)) return '비교 없음';
  if (Math.abs(value) < 0.0005) return '0.0%';
  const sign = value > 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(1)}%`;
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
  const [detailView, setDetailView] = useState<'employee' | 'site'>('employee');
  const [employeeSort, setEmployeeSort] = useState<TableSortState>({
    direction: 'desc',
    key: 'visitRevenue',
  });
  const [siteRevenueSort, setSiteRevenueSort] = useState<TableSortState>({
    direction: 'desc',
    key: 'visitRevenue',
  });
  const deferredQuery = useDeferredValue(query);

  const analytics = useMemo(
    () =>
      buildAdminAnalyticsModel(data, reports, {
        contractType,
        headquarterId,
        period,
        query: deferredQuery,
        userId,
      }),
    [contractType, data, deferredQuery, headquarterId, period, reports, userId],
  );

  const activeFilterCount =
    (period !== 'month' ? 1 : 0) +
    (headquarterId ? 1 : 0) +
    (userId ? 1 : 0) +
    (contractType ? 1 : 0);

  const sortedEmployeeRows = useMemo(() => {
    const direction = employeeSort.direction === 'asc' ? 1 : -1;

    return [...analytics.employeeRows].sort((left, right) => {
      switch (employeeSort.key) {
        case 'userName':
          return left.userName.localeCompare(right.userName, 'ko') * direction;
        case 'primaryContractTypeLabel':
          return left.primaryContractTypeLabel.localeCompare(right.primaryContractTypeLabel, 'ko') * direction;
        case 'assignedSiteCount':
          return (left.assignedSiteCount - right.assignedSiteCount) * direction;
        case 'executedRounds':
          return (left.executedRounds - right.executedRounds) * direction;
        case 'avgPerVisitAmount':
          return (left.avgPerVisitAmount - right.avgPerVisitAmount) * direction;
        case 'overdueCount':
          return (left.overdueCount - right.overdueCount) * direction;
        case 'completionRate':
          return (left.completionRate - right.completionRate) * direction;
        case 'revenueChangeRate':
          return ((left.revenueChangeRate ?? Number.NEGATIVE_INFINITY) - (right.revenueChangeRate ?? Number.NEGATIVE_INFINITY)) * direction;
        case 'visitRevenue':
        default:
          return (left.visitRevenue - right.visitRevenue) * direction;
      }
    });
  }, [analytics.employeeRows, employeeSort.direction, employeeSort.key]);

  const sortedSiteRevenueRows = useMemo(() => {
    const direction = siteRevenueSort.direction === 'asc' ? 1 : -1;

    return [...analytics.siteRevenueRows].sort((left, right) => {
      switch (siteRevenueSort.key) {
        case 'siteName':
          return left.siteName.localeCompare(right.siteName, 'ko') * direction;
        case 'headquarterName':
          return left.headquarterName.localeCompare(right.headquarterName, 'ko') * direction;
        case 'contractTypeLabel':
          return left.contractTypeLabel.localeCompare(right.contractTypeLabel, 'ko') * direction;
        case 'executedRounds':
          return (left.executedRounds - right.executedRounds) * direction;
        case 'avgPerVisitAmount':
          return (left.avgPerVisitAmount - right.avgPerVisitAmount) * direction;
        case 'visitRevenue':
        default:
          return (left.visitRevenue - right.visitRevenue) * direction;
      }
    });
  }, [analytics.siteRevenueRows, siteRevenueSort.direction, siteRevenueSort.key]);

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

  const scopeChips = useMemo(() => {
    const chips = [
      { label: '집계 기준', value: '완료 회차 기준' },
      { label: '기간', value: PERIOD_LABELS[period] },
    ];

    const headquarter = data.headquarters.find((item) => item.id === headquarterId);
    const user = data.users.find((item) => item.id === userId);
    if (headquarter) {
      chips.push({ label: '사업장', value: headquarter.name });
    }
    if (user) {
      chips.push({ label: '직원', value: user.name });
    }
    if (contractType) {
      chips.push({
        label: '계약유형',
        value: SITE_CONTRACT_TYPE_LABELS[contractType as keyof typeof SITE_CONTRACT_TYPE_LABELS] || '미입력',
      });
    }
    if (query.trim()) {
      chips.push({ label: '검색', value: query.trim() });
    }

    return chips;
  }, [contractType, data.headquarters, data.users, headquarterId, period, query, userId]);

  return (
    <div className={sharedStyles.dashboardStack}>
      <section className={sharedStyles.sectionCard}>
        <div className={sharedStyles.sectionHeader}>
          <div className={sharedStyles.sectionHeaderTitleBlock}>
            <h2 className={sharedStyles.sectionTitle}>매출/실적 집계</h2>
          </div>
          <div className={`${sharedStyles.sectionHeaderActions} ${sharedStyles.sectionHeaderToolbarActions}`}>
            <input
              className={`app-input ${sharedStyles.sectionHeaderSearch} ${sharedStyles.sectionHeaderToolbarSearch}`}
              placeholder="직원, 현장, 사업장 검색"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <SectionHeaderFilterMenu
              activeCount={activeFilterCount}
              ariaLabel="실적 집계 필터"
              onReset={resetHeaderFilters}
            >
              <div className={sharedStyles.sectionHeaderMenuGrid}>
                <div className={sharedStyles.sectionHeaderMenuField}>
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
                <div className={sharedStyles.sectionHeaderMenuField}>
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
                <div className={sharedStyles.sectionHeaderMenuField}>
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
                <div className={sharedStyles.sectionHeaderMenuField}>
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
        <div className={`${sharedStyles.sectionBody} ${localStyles.summaryBody}`}>
          <div className={localStyles.scopeBar}>
            {scopeChips.map((chip) => (
              <div key={`${chip.label}-${chip.value}`} className={localStyles.scopeChip}>
                <span className={localStyles.scopeChipLabel}>{chip.label}</span>
                <strong className={localStyles.scopeChipValue}>{chip.value}</strong>
              </div>
            ))}
          </div>

          <div className={localStyles.kpiGrid}>
            {analytics.summaryCards.map((card) => (
              <article key={card.label} className={localStyles.kpiCard}>
                <span className={localStyles.kpiLabel}>{card.label}</span>
                <strong className={localStyles.kpiValue}>{card.value}</strong>
                <div className={localStyles.kpiDeltaRow}>
                  <span className={localStyles.kpiDeltaLabel}>{card.deltaLabel}</span>
                  <span className={`${localStyles.kpiDeltaValue} ${getDeltaClassName(card.deltaTone)}`}>
                    {card.deltaValue}
                  </span>
                </div>
              </article>
            ))}
          </div>

          <div className={localStyles.supportStrip}>
            <div className={localStyles.supportItem}>
              <span className={localStyles.supportLabel}>실행 회차</span>
              <strong className={localStyles.supportValue}>{analytics.stats.totalExecutedRounds}회</strong>
            </div>
            <div className={localStyles.supportItem}>
              <span className={localStyles.supportLabel}>완료율</span>
              <strong className={localStyles.supportValue}>
                {formatAnalyticsStatValue('percent', analytics.stats.completionRate)}
              </strong>
            </div>
            <div className={localStyles.supportItem}>
              <span className={localStyles.supportLabel}>지연 건수</span>
              <strong className={localStyles.supportValue}>{analytics.stats.overdueCount}건</strong>
            </div>
            <div className={localStyles.supportItem}>
              <span className={localStyles.supportLabel}>집계 현장</span>
              <strong className={localStyles.supportValue}>
                {analytics.stats.countedSiteCount}개
              </strong>
              <span className={localStyles.supportMeta}>
                제외 {analytics.stats.excludedSiteCount}개
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className={sharedStyles.sectionCard}>
        <div className={sharedStyles.sectionHeader}>
          <div>
            <h2 className={sharedStyles.sectionTitle}>추이 및 기여도</h2>
          </div>
        </div>
        <div className={sharedStyles.sectionBody}>
          <AnalyticsCharts
            employeeRows={sortedEmployeeRows}
            siteRevenueRows={sortedSiteRevenueRows}
            trendRows={analytics.trendRows}
          />
        </div>
      </section>

      <section className={`${sharedStyles.sectionCard} ${sharedStyles.listSectionCard}`}>
        <div className={sharedStyles.sectionHeader}>
          <div>
            <h2 className={sharedStyles.sectionTitle}>상세 표</h2>
          </div>
          <div className={localStyles.detailTabs}>
            <button
              type="button"
              className={`${localStyles.detailTabButton} ${detailView === 'employee' ? localStyles.detailTabButtonActive : ''}`}
              onClick={() => setDetailView('employee')}
            >
              직원별
            </button>
            <button
              type="button"
              className={`${localStyles.detailTabButton} ${detailView === 'site' ? localStyles.detailTabButtonActive : ''}`}
              onClick={() => setDetailView('site')}
            >
              현장별
            </button>
          </div>
        </div>

        {detailView === 'employee' ? (
          <div className={sharedStyles.sectionBody}>
            {sortedEmployeeRows.length === 0 ? (
              <div className={sharedStyles.tableEmpty}>조건에 맞는 직원별 실적 데이터가 없습니다.</div>
            ) : (
              <div className={sharedStyles.tableShell}>
                <div className={`${sharedStyles.tableWrap} ${localStyles.detailTableWrap}`}>
                  <table className={`${sharedStyles.table} ${localStyles.detailTable}`}>
                    <colgroup>
                      <col className={localStyles.employeeNameCol} />
                      <col className={localStyles.employeeCountCol} />
                      <col className={localStyles.employeeCountCol} />
                      <col className={localStyles.employeeMoneyCol} />
                      <col className={localStyles.employeeMoneyCol} />
                      <col className={localStyles.employeeDeltaCol} />
                      <col className={localStyles.employeeCountCol} />
                      <col className={localStyles.employeeRateCol} />
                    </colgroup>
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
                          label="현장 수"
                          onChange={setEmployeeSort}
                        />
                        <SortableHeaderCell
                          column={{ key: 'executedRounds' }}
                          current={employeeSort}
                          defaultDirection="desc"
                          label="회차"
                          onChange={setEmployeeSort}
                        />
                        <SortableHeaderCell
                          column={{ key: 'visitRevenue' }}
                          current={employeeSort}
                          defaultDirection="desc"
                          label="매출"
                          onChange={setEmployeeSort}
                        />
                        <SortableHeaderCell
                          column={{ key: 'avgPerVisitAmount' }}
                          current={employeeSort}
                          defaultDirection="desc"
                          label="평균 단가"
                          onChange={setEmployeeSort}
                        />
                        <SortableHeaderCell
                          column={{ key: 'revenueChangeRate' }}
                          current={employeeSort}
                          defaultDirection="desc"
                          label="전기 대비"
                          onChange={setEmployeeSort}
                        />
                        <SortableHeaderCell
                          column={{ key: 'overdueCount' }}
                          current={employeeSort}
                          defaultDirection="desc"
                          label="지연"
                          onChange={setEmployeeSort}
                        />
                        <SortableHeaderCell
                          column={{ key: 'completionRate' }}
                          current={employeeSort}
                          defaultDirection="desc"
                          label="완료율"
                          onChange={setEmployeeSort}
                        />
                      </tr>
                    </thead>
                    <tbody>
                      {sortedEmployeeRows.map((row) => (
                        <tr key={row.userId}>
                          <td className={localStyles.textCell}>
                            <div className={sharedStyles.tablePrimary}>{row.userName}</div>
                          </td>
                          <td className={localStyles.numberCell}>{row.assignedSiteCount}개</td>
                          <td className={localStyles.numberCell}>{row.executedRounds}회</td>
                          <td className={localStyles.numberCell}>{formatCurrencyValue(row.visitRevenue)}</td>
                          <td className={localStyles.numberCell}>{formatCurrencyValue(row.avgPerVisitAmount)}</td>
                          <td className={`${localStyles.numberCell} ${getDeltaClassName(
                            row.revenueChangeRate == null || Math.abs(row.revenueChangeRate) < 0.0005
                              ? 'neutral'
                              : row.revenueChangeRate > 0
                                ? 'positive'
                                : 'negative',
                          )}`}>
                            {formatRevenueChange(row.revenueChangeRate)}
                          </td>
                          <td className={`${localStyles.numberCell} ${row.overdueCount > 0 ? localStyles.overdueCell : ''}`}>
                            {row.overdueCount}건
                          </td>
                          <td>
                            <div className={localStyles.rateCell}>
                              <span className={localStyles.rateValue}>
                                {formatAnalyticsStatValue('percent', row.completionRate)}
                              </span>
                              <span className={localStyles.rateTrack} aria-hidden="true">
                                <span
                                  className={localStyles.rateFill}
                                  style={{ width: `${Math.max(6, row.completionRate * 100)}%` }}
                                />
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={sharedStyles.sectionBody}>
            {sortedSiteRevenueRows.length === 0 ? (
              <div className={sharedStyles.tableEmpty}>조건에 맞는 현장별 실적 데이터가 없습니다.</div>
            ) : (
              <div className={sharedStyles.tableShell}>
                <div className={`${sharedStyles.tableWrap} ${localStyles.detailTableWrap}`}>
                  <table className={`${sharedStyles.table} ${localStyles.detailTable}`}>
                    <colgroup>
                      <col className={localStyles.siteNameCol} />
                      <col className={localStyles.siteBusinessCol} />
                      <col className={localStyles.siteTypeCol} />
                      <col className={localStyles.siteCountCol} />
                      <col className={localStyles.siteMoneyCol} />
                      <col className={localStyles.siteMoneyCol} />
                    </colgroup>
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
                          label="회차"
                          onChange={setSiteRevenueSort}
                        />
                        <SortableHeaderCell
                          column={{ key: 'visitRevenue' }}
                          current={siteRevenueSort}
                          defaultDirection="desc"
                          label="매출"
                          onChange={setSiteRevenueSort}
                        />
                        <SortableHeaderCell
                          column={{ key: 'avgPerVisitAmount' }}
                          current={siteRevenueSort}
                          defaultDirection="desc"
                          label="평균 단가"
                          onChange={setSiteRevenueSort}
                        />
                      </tr>
                    </thead>
                    <tbody>
                      {sortedSiteRevenueRows.map((row) => (
                        <tr key={row.siteId}>
                          <td className={localStyles.textCell}>
                            <Link href={row.href} className={sharedStyles.tableInlineLink}>
                              {row.siteName}
                            </Link>
                          </td>
                          <td className={localStyles.textCell}>{row.headquarterName}</td>
                          <td className={localStyles.textCell}>{row.contractTypeLabel}</td>
                          <td className={localStyles.numberCell}>{row.executedRounds}회</td>
                          <td className={localStyles.numberCell}>{formatCurrencyValue(row.visitRevenue)}</td>
                          <td className={localStyles.numberCell}>{formatCurrencyValue(row.avgPerVisitAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
