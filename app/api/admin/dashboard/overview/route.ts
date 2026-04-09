import { NextResponse } from 'next/server';
import {
  fetchAdminCoreData,
  fetchAdminReportByKey,
  fetchAdminReports,
  fetchAdminOverviewServer,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { buildAdminOverviewResponse } from '@/server/admin/automation';
import { mapBackendOverviewResponse } from '@/server/admin/upstreamMappers';
import type { SafetyReportListItem } from '@/types/backend';

export const runtime = 'nodejs';

function parseDateValue(value: string | null | undefined): Date | null {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized) return null;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function formatQuarterKey(date: Date) {
  return `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`;
}

function resolveReportKind(report: SafetyReportListItem) {
  if (report.report_type) return report.report_type;
  const meta = report.meta;
  if (!meta || typeof meta !== 'object') return '';
  const reportKind = (meta as Record<string, unknown>).reportKind;
  return typeof reportKind === 'string' ? reportKind.trim() : '';
}

function isCurrentQuarterTechnicalGuidanceReport(
  report: SafetyReportListItem,
  quarterKey: string,
) {
  if (resolveReportKind(report) !== 'technical_guidance') return false;
  const referenceDate = parseDateValue(report.visit_date) ?? parseDateValue(report.updated_at);
  return Boolean(referenceDate && formatQuarterKey(referenceDate) === quarterKey);
}

export async function GET(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const [rawOverview, data, reports] = await Promise.all([
      fetchAdminOverviewServer(token, request),
      fetchAdminCoreData(token, request),
      fetchAdminReports(token, request),
    ]);
    const upstreamOverview = mapBackendOverviewResponse(rawOverview);
    const currentQuarterKey = formatQuarterKey(new Date());
    const materialReportKeys = reports
      .filter((report) => isCurrentQuarterTechnicalGuidanceReport(report, currentQuarterKey))
      .map((report) => report.report_key);
    const materialSourceReports = await Promise.all(
      materialReportKeys.map((reportKey) => fetchAdminReportByKey(token, reportKey, request)),
    );
    const normalizedOverview = buildAdminOverviewResponse(
      data,
      reports,
      materialSourceReports,
    );
    const visibleSiteIds = new Set(data.sites.map((site) => site.id));

    return NextResponse.json({
      ...upstreamOverview,
      alerts: upstreamOverview.alerts.filter(
        (alert) => !alert.siteId || visibleSiteIds.has(alert.siteId),
      ),
      completionRows: upstreamOverview.completionRows.filter((row) => visibleSiteIds.has(row.siteId)),
      scheduleRows: upstreamOverview.scheduleRows.filter((row) => visibleSiteIds.has(row.siteId)),
      coverageRows: normalizedOverview.coverageRows,
      deadlineSignalSummary: normalizedOverview.deadlineSignalSummary,
      deadlineRows: normalizedOverview.deadlineRows,
      metricCards: normalizedOverview.metricCards,
      overdueSiteRows: normalizedOverview.overdueSiteRows,
      pendingReviewRows: normalizedOverview.pendingReviewRows,
      quarterlyMaterialSummary: normalizedOverview.quarterlyMaterialSummary,
      siteStatusSummary: normalizedOverview.siteStatusSummary,
      summaryRows: normalizedOverview.summaryRows,
      unsentReportRows: normalizedOverview.unsentReportRows,
      workerLoadRows: normalizedOverview.workerLoadRows,
    });
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : '관제 대시보드를 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}
