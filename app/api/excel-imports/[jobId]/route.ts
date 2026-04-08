import { NextResponse } from 'next/server';
import {
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import {
  fetchLocalExcelImportPreview,
  LocalExcelImportError,
} from '@/server/excelImport/localImport';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  context: { params: Promise<{ jobId: string }> },
): Promise<Response> {
  try {
    readRequiredAdminToken(request);
    const { jobId } = await context.params;
    return NextResponse.json(await fetchLocalExcelImportPreview(jobId));
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof LocalExcelImportError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '엑셀 업로드 작업을 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}
