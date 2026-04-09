export type TableSortDirection = 'asc' | 'desc';

export interface TableSortState {
  direction: TableSortDirection;
  key: string;
}

export interface SortableColumnConfig<Key extends string = string> {
  defaultDirection?: TableSortDirection;
  key: Key;
  label: string;
  serverDriven?: boolean;
}

export type TableFilterState = Record<
  string,
  string | number | boolean | null | undefined
>;

export interface TableExportColumn {
  key: string;
  label: string;
}

export type SiteContractType =
  | 'private'
  | 'negotiated'
  | 'bid'
  | 'maintenance'
  | 'other'
  | '';

export type SiteContractStatus =
  | 'ready'
  | 'active'
  | 'paused'
  | 'completed'
  | '';

export interface SiteContractProfile {
  contractDate: string;
  contractStatus: SiteContractStatus;
  contractType: SiteContractType;
  perVisitAmount: number | null;
  totalContractAmount: number | null;
  totalRounds: number | null;
}

export type ControllerQualityStatus =
  | 'unchecked'
  | 'ok'
  | 'issue';

export interface ReportControllerReview {
  checkedAt: string;
  checkerUserId: string;
  note: string;
  ownerUserId: string;
  qualityStatus: ControllerQualityStatus;
}

export type ControllerReportType =
  | 'technical_guidance'
  | 'quarterly_report'
  | 'bad_workplace';

export type ReportDispatchStatus =
  | 'normal'
  | 'warning'
  | 'overdue'
  | 'sent'
  | '';

export interface ReportDispatchHistoryEntry {
  id: string;
  memo: string;
  sentAt: string;
  sentByUserId: string;
}

export interface ReportDispatchMeta {
  deadlineDate: string;
  dispatchStatus: ReportDispatchStatus;
  sentCompletedAt: string;
  sentHistory: ReportDispatchHistoryEntry[];
  mailboxAccountId: string;
  mailThreadId: string;
  messageId: string;
  recipient: string;
  readAt: string;
  replyAt: string;
  replySummary: string;
}

export interface ControllerReportRow {
  assigneeName: string;
  assigneeUserId: string;
  checkerUserId: string;
  deadlineDate: string;
  dispatchStatus: ReportDispatchStatus;
  headquarterId: string;
  headquarterName: string;
  lifecycleStatus: import('@/types/backend').SafetyLifecycleStatus;
  qualityStatus: ControllerQualityStatus;
  reportKey: string;
  reportType: ControllerReportType;
  siteId: string;
  siteName: string;
  status: string;
  updatedAt: string;
  visitDate: string;
  controllerReview: ReportControllerReview | null;
  dispatch: ReportDispatchMeta | null;
  periodLabel: string;
  progressRate: number | null;
  reportMonth: string;
  reportTitle: string;
  routeParam: string;
  sortLabel: string;
  workflowStatus: import('@/types/backend').SafetyReportWorkflowStatus;
}

export type SafetyInspectionScheduleStatus =
  | 'planned'
  | 'completed'
  | 'canceled';

export interface SafetyInspectionSchedule {
  id: string;
  siteId: string;
  roundNo: number;
  plannedDate: string;
  windowStart: string;
  windowEnd: string;
  assigneeUserId: string;
  assigneeName: string;
  status: SafetyInspectionScheduleStatus;
  exceptionReasonCode: string;
  exceptionMemo: string;
  linkedReportKey: string;
  siteName: string;
  headquarterId: string;
  headquarterName: string;
  isConflicted: boolean;
  isOutOfWindow: boolean;
  isOverdue: boolean;
}

export type SafetyAdminAlertSeverity = 'info' | 'warning' | 'danger';

export type SafetyAdminAlertType =
  | 'quarterly_dispatch_overdue'
  | 'quarterly_deadline'
  | 'quality_review_pending'
  | 'contract_missing'
  | 'assignment_missing'
  | 'schedule_conflict'
  | 'schedule_out_of_window';

export interface SafetyAdminAlert {
  id: string;
  type: SafetyAdminAlertType;
  severity: SafetyAdminAlertSeverity;
  title: string;
  description: string;
  href: string;
  siteId: string;
  reportKey: string;
  scheduleId: string;
  createdAt: string;
}

export interface AdminOverviewMetricCard {
  href: string;
  label: string;
  meta: string;
  tone: 'default' | 'warning' | 'danger';
  value: string;
}

export interface AdminOverviewSiteAlertRow {
  badWorkplaceOverdueCount: number;
  headquarterName: string;
  href: string;
  overdueCount: number;
  quarterlyOverdueCount: number;
  reportKindsLabel: string;
  siteName: string;
}

export interface AdminOverviewReviewRow {
  assigneeName: string;
  headquarterName: string;
  href: string;
  qualityLabel: string;
  reportTitle: string;
  reportTypeLabel: string;
  siteName: string;
  updatedAt: string;
}

export interface AdminOverviewAgentRow {
  assignedSiteCount: number;
  href: string;
  loadLabel: string;
  overdueCount: number;
  userName: string;
}

export interface AdminOverviewDeadlineRow {
  deadlineDate: string;
  deadlineLabel: string;
  href: string;
  reportTitle: string;
  reportTypeLabel: string;
  siteName: string;
  statusLabel: string;
}

export interface AdminCoverageRow {
  itemCount: number;
  label: string;
  missingSiteCount: number;
}

export interface SafetyAdminOverviewChartEntry {
  count: number;
  href: string;
  key: string;
  label: string;
}

export interface SafetyAdminSiteStatusSummary {
  entries: SafetyAdminOverviewChartEntry[];
  totalSiteCount: number;
}

export interface SafetyAdminQuarterlyMaterialRequirement {
  filledCount: number;
  missingCount: number;
  requiredCount: number;
}

export interface SafetyAdminQuarterlyMaterialSiteRow {
  education: SafetyAdminQuarterlyMaterialRequirement;
  headquarterName: string;
  href: string;
  measurement: SafetyAdminQuarterlyMaterialRequirement;
  missingLabels: string[];
  quarterKey: string;
  quarterLabel: string;
  siteId: string;
  siteName: string;
}

export interface SafetyAdminQuarterlyMaterialSummary {
  entries: SafetyAdminOverviewChartEntry[];
  missingSiteRows: SafetyAdminQuarterlyMaterialSiteRow[];
  quarterKey: string;
  quarterLabel: string;
  totalSiteCount: number;
}

export interface SafetyAdminDeadlineSignalSummary {
  entries: SafetyAdminOverviewChartEntry[];
  totalReportCount: number;
}

export interface SafetyAdminUnsentReportRow {
  assigneeName: string;
  deadlineDate: string;
  dispatchStatus: ReportDispatchStatus;
  headquarterName: string;
  href: string;
  referenceDate: string;
  reportKey: string;
  reportTitle: string;
  reportTypeLabel: string;
  siteId: string;
  siteName: string;
  unsentDays: number;
  visitDate: string;
}

export interface SafetyAdminDataCompletionRow {
  href: string;
  headquarterName: string;
  missingItems: string[];
  siteId: string;
  siteName: string;
}

export interface SafetyAdminOverviewResponse {
  alerts: SafetyAdminAlert[];
  completionRows: SafetyAdminDataCompletionRow[];
  coverageRows: AdminCoverageRow[];
  deadlineSignalSummary: SafetyAdminDeadlineSignalSummary;
  deadlineRows: AdminOverviewDeadlineRow[];
  metricCards: AdminOverviewMetricCard[];
  overdueSiteRows: AdminOverviewSiteAlertRow[];
  pendingReviewRows: AdminOverviewReviewRow[];
  quarterlyMaterialSummary: SafetyAdminQuarterlyMaterialSummary;
  scheduleRows: SafetyInspectionSchedule[];
  siteStatusSummary: SafetyAdminSiteStatusSummary;
  summaryRows: Array<{ label: string; meta: string; value: string }>;
  unsentReportRows: SafetyAdminUnsentReportRow[];
  workerLoadRows: AdminOverviewAgentRow[];
}

export interface AdminAnalyticsSummaryCard {
  deltaLabel: string;
  deltaTone: 'negative' | 'neutral' | 'positive';
  deltaValue: string;
  label: string;
  meta: string;
  value: string;
}

export interface AdminAnalyticsTrendRow {
  avgPerVisitAmount: number;
  executedRounds: number;
  label: string;
  monthKey: string;
  revenue: number;
}

export interface AdminAnalyticsEmployeeRow {
  assignedSiteCount: number;
  avgPerVisitAmount: number;
  completionRate: number;
  overdueCount: number;
  primaryContractTypeLabel: string;
  revenueChangeRate: number | null;
  totalAssignedRounds: number;
  userId: string;
  userName: string;
  visitRevenue: number;
  executedRounds: number;
}

export interface AdminAnalyticsSiteRevenueRow {
  avgPerVisitAmount: number;
  contractTypeLabel: string;
  executedRounds: number;
  headquarterName: string;
  href: string;
  siteId: string;
  siteName: string;
  visitRevenue: number;
}

export interface AdminAnalyticsContractTypeRow {
  avgPerVisitAmount: number;
  executedRounds: number;
  label: string;
  siteCount: number;
  shareRate: number;
  totalContractAmount: number;
  visitRevenue: number;
}

export interface AdminAnalyticsStats {
  averagePerVisitAmount: number;
  completionRate: number;
  countedSiteCount: number;
  delayRate: number;
  excludedSiteCount: number;
  includedEmployeeCount: number;
  overdueCount: number;
  totalExecutedRounds: number;
  totalVisitRevenue: number;
}

export interface SafetyAdminAnalyticsResponse {
  contractTypeRows: AdminAnalyticsContractTypeRow[];
  employeeRows: AdminAnalyticsEmployeeRow[];
  siteRevenueRows: AdminAnalyticsSiteRevenueRow[];
  stats: AdminAnalyticsStats;
  summaryCards: AdminAnalyticsSummaryCard[];
  trendRows: AdminAnalyticsTrendRow[];
}

export interface SafetyAdminReportsResponse {
  limit: number;
  offset: number;
  rows: ControllerReportRow[];
  total: number;
}

export interface SafetyAdminScheduleListResponse {
  limit: number;
  month: string;
  offset: number;
  rows: SafetyInspectionSchedule[];
  total: number;
}
