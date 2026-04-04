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
  deadlineRows: AdminOverviewDeadlineRow[];
  metricCards: AdminOverviewMetricCard[];
  overdueSiteRows: AdminOverviewSiteAlertRow[];
  pendingReviewRows: AdminOverviewReviewRow[];
  scheduleRows: SafetyInspectionSchedule[];
  summaryRows: Array<{ label: string; meta: string; value: string }>;
  workerLoadRows: AdminOverviewAgentRow[];
}

export interface AdminAnalyticsSummaryCard {
  label: string;
  meta: string;
  value: string;
}

export interface AdminAnalyticsEmployeeRow {
  assignedSiteCount: number;
  badWorkplaceSubmittedCount: number;
  completedReportCount: number;
  contractContributionRevenue: number;
  overdueCount: number;
  quarterlyCompletedCount: number;
  totalAssignedRounds: number;
  userId: string;
  userName: string;
  visitRevenue: number;
  executedRounds: number;
}

export interface AdminAnalyticsSiteRevenueRow {
  contractContributionRevenue: number;
  contractTypeLabel: string;
  executedRounds: number;
  headquarterName: string;
  href: string;
  siteName: string;
  visitRevenue: number;
}

export interface AdminAnalyticsContractTypeRow {
  avgPerVisitAmount: number;
  label: string;
  siteCount: number;
  totalContractAmount: number;
}

export interface AdminAnalyticsStats {
  averagePerVisitAmount: number;
  completionRate: number;
  countedSiteCount: number;
  delayRate: number;
  excludedSiteCount: number;
}

export interface SafetyAdminAnalyticsResponse {
  contractTypeRows: AdminAnalyticsContractTypeRow[];
  employeeRows: AdminAnalyticsEmployeeRow[];
  siteRevenueRows: AdminAnalyticsSiteRevenueRow[];
  stats: AdminAnalyticsStats;
  summaryCards: AdminAnalyticsSummaryCard[];
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
