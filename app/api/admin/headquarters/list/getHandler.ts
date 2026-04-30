import { NextResponse } from 'next/server';
import {
  fetchAdminHeadquartersListServer,
  fetchSafetyHeadquartersServer,
  fetchSafetySitesServer,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { buildAdminHeadquartersListResponse } from '@/server/admin/adminDirectoryLists';
import { mapBackendAdminHeadquartersListResponse } from '@/server/admin/upstreamMappers';

export const runtime = 'nodejs';

const defaultDeps = {
  buildAdminHeadquartersListResponse,
  fetchAdminHeadquartersListServer,
  fetchSafetyHeadquartersServer,
  fetchSafetySitesServer,
  mapBackendAdminHeadquartersListResponse,
  readRequiredAdminToken,
};

type HeadquartersListRouteDeps = typeof defaultDeps;

function parseFilters(url: URL) {
  return {
    headquarterId: url.searchParams.get('id') || '',
    limit: Number(url.searchParams.get('limit') || '30'),
    offset: Number(url.searchParams.get('offset') || '0'),
    query: url.searchParams.get('query') || '',
    sortBy: url.searchParams.get('sort_by') || 'created_at',
    sortDir: url.searchParams.get('sort_dir') === 'asc' ? 'asc' : 'desc',
  } as const;
}

async function buildLocalFallbackResponse(
  deps: HeadquartersListRouteDeps,
  token: string,
  request: Request,
  filters: ReturnType<typeof parseFilters>,
) {
  const [headquarters, sites] = await Promise.all([
    deps.fetchSafetyHeadquartersServer(token, request),
    deps.fetchSafetySitesServer(token, request),
  ]);
  return deps.buildAdminHeadquartersListResponse(
    {
      assignments: [],
      headquarters,
      refreshedAt: new Date().toISOString(),
      sites,
      users: [],
    },
    {
      limit: filters.limit,
      offset: filters.offset,
      query: filters.query,
      sortBy: filters.sortBy,
      sortDir: filters.sortDir,
    },
  );
}

export function createGetHandler(deps: HeadquartersListRouteDeps = defaultDeps) {
  return async function GET(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const filters = parseFilters(url);

    try {
      const token = deps.readRequiredAdminToken(request);
      const response = await deps.fetchAdminHeadquartersListServer(
        token,
        {
          active_only: filters.headquarterId ? undefined : true,
          id: filters.headquarterId,
          limit: filters.limit,
          offset: filters.offset,
          query: filters.query,
          sort_by: filters.sortBy,
          sort_dir: filters.sortDir,
        },
        request,
      );
      return NextResponse.json(deps.mapBackendAdminHeadquartersListResponse(response));
    } catch (error) {
      if (error instanceof SafetyServerApiError) {
        if (!filters.headquarterId && error.status >= 500) {
          try {
            const token = deps.readRequiredAdminToken(request);
            return NextResponse.json(
              await buildLocalFallbackResponse(deps, token, request, filters),
            );
          } catch {
            return NextResponse.json({ error: error.message }, { status: error.status });
          }
        }
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      return NextResponse.json(
        { error: error instanceof Error ? error.message : '건설사 목록을 불러오지 못했습니다.' },
        { status: 500 },
      );
    }
  };
}

export const GET = createGetHandler();
