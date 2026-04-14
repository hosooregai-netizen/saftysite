'use client';

import { AnalyticsCharts } from '@/features/admin/sections/analytics/AnalyticsCharts';
import sharedStyles from '@/features/admin/sections/AdminSectionShared.module.css';
import type { SafetyReportListItem } from '@/types/backend';
import type { ControllerDashboardData } from '@/types/controller';
import { AnalyticsDetailSection } from './AnalyticsDetailSection';
import { AnalyticsSectionHeader } from './AnalyticsSectionHeader';
import { AnalyticsSummarySection } from './AnalyticsSummarySection';
import { useAnalyticsSectionState } from './useAnalyticsSectionState';

interface AnalyticsSectionProps {
  data: ControllerDashboardData;
  isReportsLoading: boolean;
  reportList: SafetyReportListItem[];
}

export function AnalyticsSection({ data, isReportsLoading, reportList }: AnalyticsSectionProps) {
  const state = useAnalyticsSectionState(data, reportList, isReportsLoading);
  const headquarterOptions = data.headquarters.map((headquarter) => ({
    label: headquarter.name,
    value: headquarter.id,
  }));
  const userOptions = data.users.map((user) => ({
    label: user.name,
    value: user.id,
  }));

  return (
    <div className={sharedStyles.dashboardStack}>
      <section className={sharedStyles.sectionCard}>
        <AnalyticsSectionHeader
          activeFilterCount={state.activeFilterCount}
          contractType={state.contractType}
          contractTypeOptions={state.contractTypeOptions}
          exportAnalytics={state.exportAnalytics}
          headquarterId={state.headquarterId}
          headquarterOptions={headquarterOptions}
          period={state.period}
          query={state.query}
          resetHeaderFilters={state.resetHeaderFilters}
          setContractType={state.setContractType}
          setHeadquarterId={state.setHeadquarterId}
          setPeriod={state.setPeriod}
          setQuery={state.setQuery}
          setUserId={state.setUserId}
          userId={state.userId}
          userOptions={userOptions}
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
          <h2 className={sharedStyles.sectionTitle}>추이 및 기여도</h2>
        </div>
        <div className={sharedStyles.sectionBody}>
          <AnalyticsCharts
            employeeRows={state.sortedEmployeeRows}
            isInitialLoading={state.isInitialLoading}
            isRefreshing={state.isRefreshing}
            siteRevenueRows={state.sortedSiteRevenueRows}
            trendRows={state.analytics.trendRows}
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
