import { NextResponse } from 'next/server';
import {
  fetchAdminDirectoryLookupsServer,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { mapBackendAdminDirectoryLookupsResponse } from '@/server/admin/upstreamMappers';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const directoryLookups = mapBackendAdminDirectoryLookupsResponse(
      await fetchAdminDirectoryLookupsServer(token, request),
    );

    return NextResponse.json({
      contractTypes: directoryLookups.contractTypes,
      headquarters: directoryLookups.headquarters,
      users: directoryLookups.users.map((user) => ({
        id: user.id,
        name: user.name,
      })),
    });
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : '관제 조회 옵션을 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}
