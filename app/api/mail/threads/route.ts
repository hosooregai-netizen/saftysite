import { NextResponse } from 'next/server';
import {
  fetchSafetyMailThreadsServer,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { mapBackendMailThread } from '@/server/admin/upstreamMappers';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const { searchParams } = new URL(request.url);
    const response = await fetchSafetyMailThreadsServer(
      token,
      {
        account_id: searchParams.get('accountId') || '',
        box: searchParams.get('box') || '',
        headquarter_id: searchParams.get('headquarterId') || '',
        query: searchParams.get('query') || '',
        report_key: searchParams.get('reportKey') || '',
        site_id: searchParams.get('siteId') || '',
      },
      request,
    );
    return NextResponse.json({
      rows: response.rows.map((item) => mapBackendMailThread(item)),
      total: response.total,
    });
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '메일 스레드 목록을 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}
