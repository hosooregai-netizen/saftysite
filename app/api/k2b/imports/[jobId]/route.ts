import { NextResponse } from 'next/server';
import {
  fetchK2bImportPreviewServer,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { fetchLocalK2bPreview, LocalK2bImportError } from '@/server/k2b/localImport';
import { mapBackendK2bImportPreview } from '@/server/admin/upstreamMappers';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  context: { params: Promise<{ jobId: string }> },
): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const { jobId } = await context.params;
    try {
      return NextResponse.json(
        mapBackendK2bImportPreview(await fetchK2bImportPreviewServer(token, jobId, request)),
      );
    } catch (error) {
      if (error instanceof SafetyServerApiError && error.status === 404) {
        return NextResponse.json(await fetchLocalK2bPreview(jobId));
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
      { error: error instanceof Error ? error.message : 'K2B 작업을 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}
