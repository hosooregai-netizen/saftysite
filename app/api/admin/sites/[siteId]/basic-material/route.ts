import { NextResponse } from 'next/server';

import {
  downloadAdminSiteBasicMaterialServer,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  context: { params: Promise<{ siteId: string }> },
): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const { siteId } = await context.params;
    const response = await downloadAdminSiteBasicMaterialServer(
      token,
      decodeURIComponent(siteId),
      request,
    );
    const buffer = await response.arrayBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type':
          response.headers.get('content-type') ||
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition':
          response.headers.get('content-disposition') ||
          `attachment; filename*=UTF-8''${encodeURIComponent('기초자료.xlsx')}`,
      },
    });
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '기초자료를 다운로드하지 못했습니다.',
      },
      { status: 500 },
    );
  }
}
