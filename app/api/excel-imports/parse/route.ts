import { NextResponse } from 'next/server';
import {
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import {
  LocalExcelImportError,
  parseLocalExcelWorkbook,
} from '@/server/excelImport/localImport';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const formData = await request.formData();
    const file = formData.get('file');
    const headquarterIdEntry = formData.get('headquarterId');
    const siteIdEntry = formData.get('siteId');
    const sourceSection =
      formData.get('sourceSection') === 'sites' ? 'sites' : 'headquarters';
    const headquarterId =
      typeof headquarterIdEntry === 'string' ? headquarterIdEntry : null;
    const siteId = typeof siteIdEntry === 'string' ? siteIdEntry : null;
    if (!(file instanceof File) || !file.name) {
      return NextResponse.json({ error: '업로드할 .xlsx 파일을 선택해 주세요.' }, { status: 400 });
    }

    return NextResponse.json(
      await parseLocalExcelWorkbook(token, file, request, {
        headquarterId,
        siteId,
        sourceSection,
      }),
    );
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof LocalExcelImportError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '엑셀 업로드 파싱에 실패했습니다.' },
      { status: 500 },
    );
  }
}
