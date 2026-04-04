import { NextResponse } from 'next/server';
import {
  fetchSafetyMailAccountsServer,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { mapBackendMailAccount } from '@/server/admin/upstreamMappers';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const response = await fetchSafetyMailAccountsServer(token, request);
    return NextResponse.json({
      rows: response.rows.map((item) => mapBackendMailAccount(item)),
    });
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '메일 계정 목록을 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}
