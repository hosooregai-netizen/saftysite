import { NextResponse } from 'next/server';
import {
  fetchAdminOverviewServer,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { mapBackendOverviewResponse } from '@/server/admin/upstreamMappers';
import {
  buildAdminOverviewPolicyOverlay,
  mergeAdminOverviewPolicyOverlay,
} from '@/server/admin/overviewPolicyOverlay';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const [response, policyOverlay] = await Promise.all([
      fetchAdminOverviewServer(token, request),
      buildAdminOverviewPolicyOverlay(token, request).catch((error) => {
        console.warn('Failed to build admin overview policy overlay.', error);
        return null;
      }),
    ]);
    const mappedResponse = mapBackendOverviewResponse(response);

    return NextResponse.json(
      policyOverlay
        ? mergeAdminOverviewPolicyOverlay(mappedResponse, policyOverlay)
        : mappedResponse,
    );
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
