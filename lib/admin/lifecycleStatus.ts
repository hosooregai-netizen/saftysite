import type { ControllerReportRow } from '@/types/admin';
import type {
  SafetyHeadquarterLifecycleStatus,
  SafetyLifecycleStatus,
  SafetyReport,
  SafetyReportListItem,
  SafetyReportWorkflowStatus,
  SafetySite,
  SafetySiteLifecycleStatus,
} from '@/types/backend';
import type { SafetyHeadquarter } from '@/types/controller';

type HeadquarterLike = Pick<SafetyHeadquarter, 'is_active' | 'lifecycle_status'>;
type SiteLike = Pick<
  SafetySite,
  | 'contract_date'
  | 'contract_end_date'
  | 'contract_signed_date'
  | 'contract_start_date'
  | 'project_end_date'
  | 'project_start_date'
  | 'status'
  | 'lifecycle_status'
  | 'contract_status'
> & {
  is_active?: boolean | null;
};
type ReportLike = Pick<
  SafetyReportListItem,
  'status' | 'progress_rate' | 'submitted_at' | 'published_at'
> & {
  lifecycle_status?: string | null;
  workflow_status?: string | null;
};
type ReportRowLike = Pick<ControllerReportRow, 'status' | 'progressRate'> & {
  lifecycleStatus?: string | null;
  workflowStatus?: string | null;
};

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function normalizeProgress(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function isLifecycleStatus(value: string): value is SafetyLifecycleStatus {
  return value === 'planned' || value === 'active' || value === 'closed' || value === 'deleted';
}

function isSiteLifecycleStatus(value: string): value is SafetySiteLifecycleStatus {
  return value === 'planned' || value === 'active' || value === 'paused' || value === 'closed' || value === 'deleted';
}

function isHeadquarterLifecycleStatus(value: string): value is SafetyHeadquarterLifecycleStatus {
  return value === 'active' || value === 'closed' || value === 'deleted';
}

function isWorkflowStatus(value: string): value is SafetyReportWorkflowStatus {
  return value === 'draft' || value === 'submitted' || value === 'published';
}

function normalizeDateText(value: unknown): string {
  const normalized = normalizeText(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : '';
}

function getKoreanTodayToken(date: Date | string = new Date()): string {
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }

  const nextDate = typeof date === 'string' ? new Date(date) : date;
  const parts = new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Seoul',
    year: 'numeric',
  }).formatToParts(nextDate);
  const byType = new Map(parts.map((part) => [part.type, part.value]));
  return `${byType.get('year')}-${byType.get('month')}-${byType.get('day')}`;
}

function resolveSitePeriodStatus(
  site: SiteLike | null | undefined,
  today: Date | string = new Date(),
): Extract<SafetySiteLifecycleStatus, 'planned' | 'active' | 'closed'> | null {
  const contractEndDate = normalizeDateText(site?.contract_end_date);
  const projectEndDate = normalizeDateText(site?.project_end_date);
  const endDate = contractEndDate || projectEndDate;
  if (!endDate) return null;

  const contractStartDate =
    normalizeDateText(site?.contract_start_date) ||
    normalizeDateText(site?.contract_date) ||
    normalizeDateText(site?.contract_signed_date);
  const projectStartDate = normalizeDateText(site?.project_start_date);
  const startDate = contractStartDate || projectStartDate;
  const todayToken = getKoreanTodayToken(today);

  if (endDate < todayToken) return 'closed';
  if (startDate && startDate > todayToken) return 'planned';
  return 'active';
}

export function normalizeHeadquarterLifecycleStatus(
  headquarter: HeadquarterLike | null | undefined,
): SafetyHeadquarterLifecycleStatus {
  const lifecycleStatus = normalizeText(headquarter?.lifecycle_status);
  if (isHeadquarterLifecycleStatus(lifecycleStatus)) {
    return lifecycleStatus;
  }

  return normalizeBoolean(headquarter?.is_active) === false ? 'deleted' : 'active';
}

export function applyHeadquarterLifecycleStatus<T extends HeadquarterLike>(
  headquarter: T,
): T & {
  is_active: boolean;
  lifecycle_status: SafetyHeadquarterLifecycleStatus;
} {
  const lifecycleStatus = normalizeHeadquarterLifecycleStatus(headquarter);
  return {
    ...headquarter,
    is_active: lifecycleStatus !== 'deleted',
    lifecycle_status: lifecycleStatus,
  };
}

export function normalizeSiteLifecycleStatus(
  site: SiteLike | null | undefined,
  today: Date | string = new Date(),
): SafetySiteLifecycleStatus {
  const contractStatus = normalizeText(site?.contract_status);
  const legacyStatus = normalizeText(site?.status);
  if (legacyStatus === 'deleted') {
    return 'deleted';
  }

  if (contractStatus === 'completed') {
    return 'closed';
  }
  if (contractStatus === 'paused' || legacyStatus === 'paused') {
    return 'paused';
  }
  if (normalizeBoolean(site?.is_active) === false) {
    return 'deleted';
  }

  const periodStatus = resolveSitePeriodStatus(site, today);
  if (periodStatus) {
    return periodStatus;
  }

  const lifecycleStatus = normalizeText(site?.lifecycle_status);
  if (isSiteLifecycleStatus(lifecycleStatus)) {
    return lifecycleStatus;
  }

  if (isSiteLifecycleStatus(legacyStatus)) {
    return legacyStatus;
  }

  if (legacyStatus === 'planned') {
    return 'planned';
  }
  if (legacyStatus === 'closed') {
    return 'closed';
  }

  return 'active';
}

export function applySiteLifecycleStatus<T extends SiteLike>(
  site: T,
  today: Date | string = new Date(),
): T & {
  is_active: boolean;
  lifecycle_status: SafetySiteLifecycleStatus;
  status: SafetySiteLifecycleStatus;
} {
  const lifecycleStatus = normalizeSiteLifecycleStatus(site, today);
  return {
    ...site,
    is_active: lifecycleStatus !== 'deleted',
    lifecycle_status: lifecycleStatus,
    status: lifecycleStatus,
  };
}

export function normalizeReportWorkflowStatus(
  report: ReportLike | ReportRowLike | null | undefined,
): SafetyReportWorkflowStatus {
  const record = asRecord(report);
  const workflowStatus = normalizeText(record.workflow_status ?? record.workflowStatus);
  if (isWorkflowStatus(workflowStatus)) {
    return workflowStatus;
  }

  const legacyStatus = normalizeText(record.status);
  if (isWorkflowStatus(legacyStatus)) {
    return legacyStatus;
  }

  const publishedAt = normalizeText(record.published_at);
  if (publishedAt) {
    return 'published';
  }

  const submittedAt = normalizeText(record.submitted_at);
  if (submittedAt) {
    return 'submitted';
  }

  return 'draft';
}

export function normalizeReportLifecycleStatus(
  report: ReportLike | ReportRowLike | null | undefined,
): SafetyLifecycleStatus {
  const record = asRecord(report);
  const lifecycleStatus = normalizeText(record.lifecycle_status ?? record.lifecycleStatus);
  if (isLifecycleStatus(lifecycleStatus)) {
    return lifecycleStatus;
  }

  const legacyStatus = normalizeText(record.status);
  if (isLifecycleStatus(legacyStatus)) {
    return legacyStatus;
  }
  if (legacyStatus === 'archived') {
    return 'deleted';
  }

  const workflowStatus = normalizeReportWorkflowStatus(report);
  if (workflowStatus === 'submitted' || workflowStatus === 'published') {
    return 'closed';
  }

  const progressRate = normalizeProgress(record.progress_rate ?? record.progressRate);
  if (progressRate != null && progressRate >= 100) {
    return 'closed';
  }
  if (progressRate != null && progressRate > 0) {
    return 'active';
  }

  return 'planned';
}

export function applyReportLifecycleStatus<T extends ReportLike>(
  report: T,
): T & {
  lifecycle_status: SafetyLifecycleStatus;
  status: SafetyReportWorkflowStatus;
  workflow_status: SafetyReportWorkflowStatus;
} {
  const workflowStatus = normalizeReportWorkflowStatus(report);
  const lifecycleStatus = normalizeReportLifecycleStatus({
    ...report,
    status: workflowStatus,
    workflow_status: workflowStatus,
  });

  return {
    ...report,
    lifecycle_status: lifecycleStatus,
    status: workflowStatus,
    workflow_status: workflowStatus,
  };
}

export function applyControllerReportRowStatus<T extends ReportRowLike>(
  row: T,
): T & {
  lifecycleStatus: SafetyLifecycleStatus;
  status: SafetyReportWorkflowStatus;
  workflowStatus: SafetyReportWorkflowStatus;
} {
  const workflowStatus = normalizeReportWorkflowStatus(row);
  const lifecycleStatus = normalizeReportLifecycleStatus({
    ...row,
    status: workflowStatus,
    workflowStatus,
  });

  return {
    ...row,
    lifecycleStatus,
    status: workflowStatus,
    workflowStatus,
  };
}

export function isVisibleHeadquarter(headquarter: HeadquarterLike | null | undefined): boolean {
  return normalizeHeadquarterLifecycleStatus(headquarter) !== 'deleted';
}

export function isVisibleSite(site: SiteLike | null | undefined): boolean {
  return normalizeSiteLifecycleStatus(site) !== 'deleted';
}

export function isVisibleReport(report: ReportLike | ReportRowLike | null | undefined): boolean {
  return normalizeReportLifecycleStatus(report) !== 'deleted';
}

export function isClosedReport(report: ReportLike | ReportRowLike | null | undefined): boolean {
  return normalizeReportLifecycleStatus(report) === 'closed';
}

export function normalizeSafetyReportRecord<T extends SafetyReport | SafetyReportListItem>(
  report: T,
): T & {
  lifecycle_status: SafetyLifecycleStatus;
  status: SafetyReportWorkflowStatus;
  workflow_status: SafetyReportWorkflowStatus;
} {
  return applyReportLifecycleStatus(report);
}
