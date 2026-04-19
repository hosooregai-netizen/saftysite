import { NextResponse } from 'next/server';
import {
  fetchAdminAnalyticsDetailServer,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { mapBackendAnalyticsMonthDetailResponse } from '@/server/admin/upstreamMappers';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const url = new URL(request.url);
    const response = await fetchAdminAnalyticsDetailServer(
      token,
      {
        basis_month: url.searchParams.get('basis_month') || '',
        contract_type: url.searchParams.get('contract_type') || '',
        detail_scope: url.searchParams.get('detail_scope') || 'month',
        headquarter_id: url.searchParams.get('headquarter_id') || '',
        period: url.searchParams.get('period') || 'month',
        query: url.searchParams.get('query') || '',
        user_id: url.searchParams.get('user_id') || '',
      },
      request,
    );
    return NextResponse.json(mapBackendAnalyticsMonthDetailResponse(response));
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '실적/매출 상세표 데이터를 불러오지 못했습니다.',
      },
      { status: 500 },
    );
  }
}
