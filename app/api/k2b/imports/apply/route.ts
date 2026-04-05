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
    if (!jobId || !sheetName) {
      return NextResponse.json(
        { error: 'K2B 작업 ID와 시트 이름이 필요합니다.' },
        { status: 400 },
      );
    }
    return NextResponse.json(
      await applyLocalK2bWorkbook(token, request, {
        jobId,
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
