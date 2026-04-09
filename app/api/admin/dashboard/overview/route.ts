import { NextResponse } from 'next/server';
import {
  fetchAdminCoreData,
  fetchAdminReports,
  fetchAdminOverviewServer,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { buildAdminOverviewResponse } from '@/server/admin/automation';
import { mapBackendOverviewResponse } from '@/server/admin/upstreamMappers';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const [rawOverview, data, reports] = await Promise.all([
      fetchAdminOverviewServer(token, request),
      fetchAdminCoreData(token, request),
      fetchAdminReports(token, request),
    ]);
    const upstreamOverview = mapBackendOverviewResponse(rawOverview);
    const normalizedOverview = buildAdminOverviewResponse(data, reports);
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
