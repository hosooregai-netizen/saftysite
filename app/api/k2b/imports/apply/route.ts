import { NextResponse } from 'next/server';
import {
  applyK2bImportServer,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { applyLocalK2bWorkbook, LocalK2bImportError } from '@/server/k2b/localImport';
import { mapBackendK2bApplyResult } from '@/server/admin/upstreamMappers';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const payload = (await request.json()) as Record<string, unknown>;
    try {
      return NextResponse.json(
        mapBackendK2bApplyResult(await applyK2bImportServer(token, payload, request)),
      );
    } catch (error) {
      if (
        error instanceof SafetyServerApiError &&
        error.status === 404 &&
        typeof payload.job_id === 'string' &&
        typeof payload.sheet_name === 'string'
      ) {
        return NextResponse.json(
          await applyLocalK2bWorkbook(token, request, {
            jobId: payload.job_id,
            sheetName: payload.sheet_name,
          }),
        );
      }
      throw error;
    }
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
