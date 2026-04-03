import { NextResponse } from 'next/server';
import {
  fetchAdminAnalyticsServer,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { mapBackendAnalyticsResponse } from '@/server/admin/upstreamMappers';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const url = new URL(request.url);
    return NextResponse.json(
      mapBackendAnalyticsResponse(
        await fetchAdminAnalyticsServer(
          token,
          {
            contract_type: url.searchParams.get('contract_type') || '',
            headquarter_id: url.searchParams.get('headquarter_id') || '',
            period: url.searchParams.get('period') || 'month',
            query: url.searchParams.get('query') || '',
            user_id: url.searchParams.get('user_id') || '',
          },
          request,
        ),
      ),
    );
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : '실적/매출 대시보드를 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}
