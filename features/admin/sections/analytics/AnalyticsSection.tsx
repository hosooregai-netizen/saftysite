'use client';

import { AnalyticsCharts } from '@/features/admin/sections/analytics/AnalyticsCharts';
import sharedStyles from '@/features/admin/sections/AdminSectionShared.module.css';
import { AnalyticsDetailSection } from './AnalyticsDetailSection';
import { AnalyticsSectionHeader } from './AnalyticsSectionHeader';
import { AnalyticsSummarySection } from './AnalyticsSummarySection';
import { useAnalyticsSectionState } from './useAnalyticsSectionState';
import localStyles from './AnalyticsSection.module.css';

function shiftMonthToken(month: string, delta: number) {
  const [year, monthValue] = month.split('-').map(Number);
  if (!year || !monthValue) return month;
  const nextDate = new Date(year, monthValue - 1 + delta, 1);
  return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(month: string) {
  const [year, monthValue] = month.split('-').map(Number);
  if (!year || !monthValue) return month;
  return `${year}년 ${monthValue}월`;
}

interface AnalyticsSectionProps {
  currentUserId: string;
}

export function AnalyticsSection({ currentUserId }: AnalyticsSectionProps) {
  const state = useAnalyticsSectionState(currentUserId);
  return (
    <div className={sharedStyles.dashboardStack}>
      <section className={sharedStyles.sectionCard}>
        <AnalyticsSectionHeader
          activeFilterCount={state.activeFilterCount}
          contractType={state.contractType}
          contractTypeOptions={state.contractTypeOptions}
          exportAnalytics={state.exportAnalytics}
          headquarterId={state.headquarterId}
          headquarterOptions={state.headquarterOptions}
          isBusy={state.isLoading}
          period={state.period}
          query={state.queryInput}
          resetHeaderFilters={state.resetHeaderFilters}
          setContractType={state.setContractType}
          setHeadquarterId={state.setHeadquarterId}
          setPeriod={state.setPeriod}
          setQuery={state.setQueryInput}
          submitQuery={state.submitQuery}
          setUserId={state.setUserId}
          userId={state.userId}
          userOptions={state.userOptions}
        />
        <AnalyticsSummarySection
          analytics={state.summaryAnalytics}
          isInitialLoading={state.isSummaryInitialLoading}
          isLoading={state.isSummaryLoading}
          isRefreshing={state.isSummaryRefreshing}
          loadError={state.loadError}
          scopeChips={state.scopeChips}
        />
      </section>

      <section className={sharedStyles.sectionCard}>
        <div className={sharedStyles.sectionHeader}>
          <div>
            <h2 className={sharedStyles.sectionTitle}>추이 및 기여도</h2>
            <div className={sharedStyles.sectionHeaderMeta}>차트와 기여도 카드, 상세표를 선택한 기준월로 볼 수 있습니다.</div>
          </div>
          <div className={localStyles.analyticsMonthNav}>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => state.setBasisMonth(shiftMonthToken(state.basisMonth, -1))}
            >
              이전 달
            </button>
            <span className={localStyles.analyticsMonthBadge}>
              {formatMonthLabel(state.basisMonth)}
            </span>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => state.setBasisMonth(shiftMonthToken(state.basisMonth, 1))}
            >
              다음 달
            </button>
            <input
              type="month"
              className="app-input"
              value={state.basisMonth}
              onChange={(event) => state.setBasisMonth(event.target.value)}
            />
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => state.setBasisMonth(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`)}
            >
              이번 달
            </button>
          </div>
        </div>
        <div className={sharedStyles.sectionBody}>
          <AnalyticsCharts
            basisMonth={state.basisMonth}
            chartYear={state.chartYear}
            detailError={state.chartDetailError}
            employeeRows={state.chartDetail.employeeRows}
            isDetailInitialLoading={state.isChartDetailInitialLoading}
            isInitialLoading={state.isSummaryInitialLoading}
            isRefreshing={state.isChartDetailRefreshing}
            siteRevenueRows={state.chartDetail.siteRevenueRows}
            trendRows={state.activeChartSlice.trendRows}
          />
        </div>
      </section>

      <AnalyticsDetailSection
        basisMonth={state.basisMonth}
        detailScope={state.detailScope}
        detailView={state.detailView}
        employeePage={state.employeePage}
        employeeRows={state.pagedEmployeeRows}
        employeeSort={state.employeeSort}
        employeeTotalPages={state.employeeTotalPages}
        isInitialLoading={state.isAnalyticsDetailInitialLoading}
        isRefreshing={state.isAnalyticsDetailRefreshing}
        loadError={state.analyticsDetailError}
        setDetailScope={state.setDetailScope}
        setDetailView={state.setDetailView}
        setEmployeePage={state.setEmployeePage}
        setEmployeeSort={state.setEmployeeSort}
        setSiteRevenuePage={state.setSiteRevenuePage}
        setSiteRevenueSort={state.setSiteRevenueSort}
        siteRevenuePage={state.siteRevenuePage}
        siteRevenueRows={state.pagedSiteRevenueRows}
        siteRevenueSort={state.siteRevenueSort}
        siteRevenueTotalPages={state.siteRevenueTotalPages}
      />
    </div>
  );
}
