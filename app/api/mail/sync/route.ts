import { NextResponse } from 'next/server';
import {
  readRequiredAdminToken,
  SafetyServerApiError,
  syncSafetyMailServer,
} from '@/server/admin/safetyApiServer';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    return NextResponse.json(await syncSafetyMailServer(token, request));
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '메일 동기화에 실패했습니다.' },
      { status: 500 },
    );
  }
}
