import { NextResponse } from 'next/server';
import {
  fetchSafetyMailMessageServer,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { mapBackendMailMessage } from '@/server/admin/upstreamMappers';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  context: { params: Promise<{ messageId: string }> },
): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const { messageId } = await context.params;
    return NextResponse.json(
      mapBackendMailMessage(await fetchSafetyMailMessageServer(token, messageId, request)),
    );
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '메일을 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}
