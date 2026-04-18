import { NextResponse } from 'next/server';
import {
  fetchAdminOverviewServer,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import {
  buildAdminOverviewPolicyOverlay,
  mergeAdminOverviewPolicyOverlay,
} from '@/server/admin/overviewPolicyOverlay';
import { readOrCreateAdminOverviewRouteResponse } from '@/server/admin/overviewRouteCache';
import { mapBackendOverviewResponse } from '@/server/admin/upstreamMappers';
import type { SafetyAdminOverviewResponse } from '@/types/admin';
import type { SafetyBackendAdminOverviewResponse } from '@/types/backend';
import { applyOverviewUpstreamFallbacks } from './routeFallbacks';

export const runtime = 'nodejs';

function roundDurationMs(startedAt: number) {
  return Math.round((performance.now() - startedAt) * 10) / 10;
}

function trimLogContext(context: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(context).filter(([, value]) => value !== '' && value !== null && value !== undefined),
  );
}

function logOverviewRouteStage(stage: string, startedAt: number, context: Record<string, unknown>) {
  console.info('admin-overview-route-stage', {
    stage,
    duration_ms: roundDurationMs(startedAt),
    ...trimLogContext(context),
  });
}

function summarizeBackendOverview(response: SafetyBackendAdminOverviewResponse) {
  return {
    alerts: response.alerts.length,
    completion_rows: response.completion_rows.length,
    deadline_rows: response.deadline_rows.length,
    priority_quarterly_rows: response.priority_quarterly_management_rows?.length ?? 0,
    schedule_rows: response.schedule_rows.length,
    unsent_report_rows: response.unsent_report_rows.length,
    worker_load_rows: response.worker_load_rows.length,
  };
}

function summarizeOverview(response: SafetyAdminOverviewResponse) {
  return {
    alerts: response.alerts.length,
    completion_rows: response.completionRows.length,
    deadline_rows: response.deadlineRows.length,
    priority_quarterly_rows: response.priorityQuarterlyManagementRows?.length ?? 0,
    schedule_rows: response.scheduleRows.length,
    unsent_report_rows: response.unsentReportRows.length,
    worker_load_rows: response.workerLoadRows.length,
  };
}

export async function GET(request: Request): Promise<Response> {
  try {
    const mergedOverview = await readOrCreateAdminOverviewRouteResponse(request, async () => {
      const routeStartedAt = performance.now();
      const token = readRequiredAdminToken(request);

      const upstreamStartedAt = performance.now();
      const response = await fetchAdminOverviewServer(token, request);
      logOverviewRouteStage('upstream_fetch', upstreamStartedAt, summarizeBackendOverview(response));

      const mergeStartedAt = performance.now();
      const mappedOverview = mapBackendOverviewResponse(response);
      const upstreamPreservedOverview = applyOverviewUpstreamFallbacks(response, mappedOverview);
      const overlay = buildAdminOverviewPolicyOverlay(upstreamPreservedOverview);
      const nextOverview = mergeAdminOverviewPolicyOverlay(upstreamPreservedOverview, overlay);

      logOverviewRouteStage('merge_response', mergeStartedAt, {
        mapped_priority_quarterly_rows: mappedOverview.priorityQuarterlyManagementRows?.length ?? 0,
        mapped_unsent_report_rows: mappedOverview.unsentReportRows.length,
        overlay_site_status_entries: overlay.siteStatusSummary.entries.length,
        overlay_total_sites: overlay.siteStatusSummary.totalSiteCount,
        overlay_strategy: 'site_status_only',
        raw_priority_quarterly_rows: response.priority_quarterly_management_rows?.length ?? 0,
        raw_unsent_report_rows: response.unsent_report_rows.length,
        upstream_preserved_priority_quarterly_rows:
          upstreamPreservedOverview.priorityQuarterlyManagementRows?.length ?? 0,
        upstream_preserved_unsent_report_rows: upstreamPreservedOverview.unsentReportRows.length,
        ...summarizeOverview(nextOverview),
      });
      logOverviewRouteStage('route_total', routeStartedAt, summarizeOverview(nextOverview));
      return nextOverview;
    });

    return NextResponse.json(mergedOverview);
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : '관리자 대시보드를 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}
