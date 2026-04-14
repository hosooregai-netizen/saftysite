export type {
  AdminAnalyticsChartYearSlice,
  AdminAnalyticsContractTypeRow,
  AdminAnalyticsEmployeeRow,
  SafetyAdminAnalyticsResponse as AdminAnalyticsModel,
  AdminAnalyticsSiteRevenueRow,
  AdminAnalyticsStats,
  AdminAnalyticsSummaryCard,
  AdminAnalyticsTrendRow,
  AdminCoverageRow,
  AdminOverviewAgentRow,
  SafetyAdminOverviewChartEntry as AdminOverviewChartEntry,
  AdminOverviewDeadlineRow,
  SafetyAdminDeadlineSignalSummary as AdminOverviewDeadlineSignalSummary,
  AdminOverviewMetricCard,
  SafetyAdminQuarterlyMaterialRequirement as AdminOverviewQuarterlyMaterialRequirement,
  SafetyAdminQuarterlyMaterialSiteRow as AdminOverviewQuarterlyMaterialSiteRow,
  SafetyAdminQuarterlyMaterialSummary as AdminOverviewQuarterlyMaterialSummary,
  AdminOverviewReviewRow,
  AdminOverviewSiteAlertRow,
  SafetyAdminSiteStatusSummary as AdminOverviewSiteStatusSummary,
  SafetyAdminUnsentReportRow as AdminOverviewUnsentReportRow,
} from '@/types/admin';

export type AdminOverviewModel = Omit<
  import('@/types/admin').SafetyAdminOverviewResponse,
  'alerts' | 'completionRows' | 'scheduleRows'
>;

export type AdminAnalyticsPeriod = 'month' | 'quarter' | 'year' | 'all';
