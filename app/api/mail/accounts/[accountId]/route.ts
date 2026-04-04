import { NextResponse } from 'next/server';
import {
  disconnectMailAccountServer,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';

export const runtime = 'nodejs';

export async function DELETE(
  request: Request,
  context: { params: Promise<{ accountId: string }> },
): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const { accountId } = await context.params;
    await disconnectMailAccountServer(token, accountId, request);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '메일 계정 연결 해제에 실패했습니다.' },
      { status: 500 },
    );
  }
}
