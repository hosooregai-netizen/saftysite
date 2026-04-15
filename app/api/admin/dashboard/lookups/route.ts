import { NextResponse } from 'next/server';
import { SITE_CONTRACT_TYPE_LABELS } from '@/lib/admin';
import { parseSiteContractProfile } from '@/lib/admin/siteContractProfile';
import {
  fetchAdminDirectoryLookupsServer,
  fetchAdminSitesListServer,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import {
  mapBackendAdminDirectoryLookupsResponse,
  mapBackendAdminSitesListResponse,
} from '@/server/admin/upstreamMappers';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const [directoryLookups, sitesResponse] = await Promise.all([
      fetchAdminDirectoryLookupsServer(token, request).then((response) =>
        mapBackendAdminDirectoryLookupsResponse(response),
      ),
      fetchAdminSitesListServer(
        token,
        { limit: 5000, offset: 0, sort_by: 'last_visit_date', sort_dir: 'desc' },
        request,
      ).then((response) => mapBackendAdminSitesListResponse(response)),
    ]);
    const contractTypeMap = new Map<string, string>();

    sitesResponse.rows.forEach((site) => {
      const profile = parseSiteContractProfile(site);
      const value = profile.technicalGuidanceKind || profile.contractType || '';
      if (!value || contractTypeMap.has(value)) return;
      contractTypeMap.set(value, value);
    });

    return NextResponse.json({
      contractTypes: Array.from(contractTypeMap.values()).map((value) => ({
        label: SITE_CONTRACT_TYPE_LABELS[value as keyof typeof SITE_CONTRACT_TYPE_LABELS] || value,
        value,
      })),
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
