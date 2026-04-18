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
import { applyOverviewUpstreamFallbacks } from './routeFallbacks';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  try {
    const mergedOverview = await readOrCreateAdminOverviewRouteResponse(request, async () => {
      const token = readRequiredAdminToken(request);
      const response = await fetchAdminOverviewServer(token, request);
      const mappedOverview = mapBackendOverviewResponse(response);
      const upstreamPreservedOverview = applyOverviewUpstreamFallbacks(response, mappedOverview);
      const overlay = buildAdminOverviewPolicyOverlay(upstreamPreservedOverview);
      const nextOverview = mergeAdminOverviewPolicyOverlay(upstreamPreservedOverview, overlay);
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
