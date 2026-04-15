import { NextResponse } from 'next/server';
import { buildAdminDirectoryLookupsResponse } from '@/server/admin/adminDirectoryLists';
import { getAdminDirectorySnapshot } from '@/server/admin/adminDirectorySnapshot';
import { readRequiredAdminToken, SafetyServerApiError } from '@/server/admin/safetyApiServer';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const snapshot = await getAdminDirectorySnapshot(token, request);
    return NextResponse.json(
      buildAdminDirectoryLookupsResponse({
        ...snapshot.data,
        refreshedAt: snapshot.refreshedAt,
      }),
    );
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '관제 디렉터리 조회 옵션을 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}
