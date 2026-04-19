import { NextResponse } from 'next/server';
import {
  fetchAdminAnalyticsMonthDetailServer,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { mapBackendAnalyticsMonthDetailResponse } from '@/server/admin/upstreamMappers';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const url = new URL(request.url);
    const response = await fetchAdminAnalyticsMonthDetailServer(
      token,
      {
        contract_type: url.searchParams.get('contract_type') || '',
        headquarter_id: url.searchParams.get('headquarter_id') || '',
        basis_month: url.searchParams.get('basis_month') || '',
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
            : '실적/매출 기준월 상세를 불러오지 못했습니다.',
      },
      { status: 500 },
    );
  }
}
