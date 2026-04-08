import { NextResponse } from 'next/server';
import {
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { applyLocalK2bWorkbook, LocalK2bImportError } from '@/server/k2b/localImport';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const payload = (await request.json()) as Record<string, unknown>;
    const jobId =
      typeof payload.job_id === 'string'
        ? payload.job_id
        : typeof payload.jobId === 'string'
          ? payload.jobId
          : '';
    const sheetName =
      typeof payload.sheet_name === 'string'
        ? payload.sheet_name
        : typeof payload.sheetName === 'string'
          ? payload.sheetName
          : '';
    const sourceSection =
      payload.source_section === 'sites' || payload.sourceSection === 'sites'
        ? 'sites'
        : 'headquarters';
    const headquarterId =
      typeof payload.headquarter_id === 'string'
        ? payload.headquarter_id
        : typeof payload.headquarterId === 'string'
          ? payload.headquarterId
          : payload.scope && typeof payload.scope === 'object' && payload.scope
            ? typeof (payload.scope as Record<string, unknown>).headquarterId === 'string'
              ? ((payload.scope as Record<string, unknown>).headquarterId as string)
              : null
            : null;
    const siteId =
      typeof payload.site_id === 'string'
        ? payload.site_id
        : typeof payload.siteId === 'string'
          ? payload.siteId
          : payload.scope && typeof payload.scope === 'object' && payload.scope
            ? typeof (payload.scope as Record<string, unknown>).siteId === 'string'
              ? ((payload.scope as Record<string, unknown>).siteId as string)
              : null
            : null;
    if (!jobId || !sheetName) {
      return NextResponse.json(
        { error: 'K2B 작업 ID와 시트 이름이 필요합니다.' },
        { status: 400 },
      );
    }
    return NextResponse.json(
      await applyLocalK2bWorkbook(token, request, {
        jobId,
        scope: {
          headquarterId,
          siteId,
          sourceSection,
        },
        sheetName,
      }),
    );
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof LocalK2bImportError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'K2B 적용에 실패했습니다.' },
      { status: 500 },
    );
  }
}
