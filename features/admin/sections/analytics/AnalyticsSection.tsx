'use client';

import { AnalyticsCharts } from '@/features/admin/sections/analytics/AnalyticsCharts';
import sharedStyles from '@/features/admin/sections/AdminSectionShared.module.css';
import { AnalyticsDetailSection } from './AnalyticsDetailSection';
import { AnalyticsSectionHeader } from './AnalyticsSectionHeader';
import { AnalyticsSummarySection } from './AnalyticsSummarySection';
import { useAnalyticsSectionState } from './useAnalyticsSectionState';
import localStyles from './AnalyticsSection.module.css';

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
          analytics={state.analytics}
          isInitialLoading={state.isInitialLoading}
          isLoading={state.isLoading}
          isRefreshing={state.isRefreshing}
          loadError={state.loadError}
          scopeChips={state.scopeChips}
        />
      </section>

      <section className={sharedStyles.sectionCard}>
        <div className={sharedStyles.sectionHeader}>
          <div>
            <h2 className={sharedStyles.sectionTitle}>추이 및 기여도</h2>
            <div className={sharedStyles.sectionHeaderMeta}>차트와 기여도 카드만 연도 기준으로 전환됩니다.</div>
          </div>
          <div className={localStyles.detailTabs}>
            {state.analytics.availableTrendYears.map((year) => (
              <button
                key={year}
                type="button"
                className={`${localStyles.detailTabButton} ${state.chartYear === year ? localStyles.detailTabButtonActive : ''}`}
                onClick={() => state.setChartYear(year)}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
        <div className={sharedStyles.sectionBody}>
          <AnalyticsCharts
            chartYear={state.chartYear}
            employeeRows={state.activeChartSlice.employeeRows}
            isInitialLoading={state.isInitialLoading}
            isRefreshing={state.isRefreshing}
            siteRevenueRows={state.activeChartSlice.siteRevenueRows}
            trendRows={state.activeChartSlice.trendRows}
          />
        </div>
      </section>

      <AnalyticsDetailSection
        detailView={state.detailView}
        employeeRows={state.sortedEmployeeRows}
        employeeSort={state.employeeSort}
        isInitialLoading={state.isInitialLoading}
        isRefreshing={state.isRefreshing}
        setDetailView={state.setDetailView}
        setEmployeeSort={state.setEmployeeSort}
        setSiteRevenueSort={state.setSiteRevenueSort}
        siteRevenueRows={state.sortedSiteRevenueRows}
        siteRevenueSort={state.siteRevenueSort}
      />
    </div>
  );
}
