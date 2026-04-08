import { NextResponse } from 'next/server';
import {
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { LocalK2bImportError, parseLocalK2bWorkbook } from '@/server/k2b/localImport';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const formData = await request.formData();
    const file = formData.get('file');
    const sourceSection =
      formData.get('sourceSection') === 'sites' ? 'sites' : 'headquarters';
    const headquarterId =
      typeof formData.get('headquarterId') === 'string'
        ? formData.get('headquarterId')
        : null;
    const siteId =
      typeof formData.get('siteId') === 'string'
        ? formData.get('siteId')
        : null;
    if (!(file instanceof File) || !file.name) {
      return NextResponse.json({ error: '업로드할 .xlsx 파일을 선택해 주세요.' }, { status: 400 });
    }

    return NextResponse.json(
      await parseLocalK2bWorkbook(token, file, request, {
        headquarterId,
        siteId,
        sourceSection,
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
      { error: error instanceof Error ? error.message : 'K2B 업로드 파싱에 실패했습니다.' },
      { status: 500 },
    );
  }
}
