import { NextResponse } from 'next/server';
import {
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { fetchLocalK2bPreview, LocalK2bImportError } from '@/server/k2b/localImport';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  context: { params: Promise<{ jobId: string }> },
): Promise<Response> {
  try {
    readRequiredAdminToken(request);
    const { jobId } = await context.params;
    return NextResponse.json(await fetchLocalK2bPreview(jobId));
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof LocalK2bImportError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'K2B 작업을 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}
