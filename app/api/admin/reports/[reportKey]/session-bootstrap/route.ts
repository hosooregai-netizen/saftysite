import { NextResponse } from 'next/server';
import {
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { resolveInspectionSessionBootstrapByReportKey } from '@/server/documents/inspection/requestResolver';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  context: { params: Promise<{ reportKey: string }> },
): Promise<Response> {
  try {
    readRequiredAdminToken(request);
    const { reportKey } = await context.params;
    const payload = await resolveInspectionSessionBootstrapByReportKey(request, reportKey);
    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '레거시 보고서 세션을 불러오지 못했습니다.',
      },
      { status: 500 },
    );
  }
}
