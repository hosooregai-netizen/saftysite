import { NextResponse } from 'next/server';
import {
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';

export const runtime = 'nodejs';

export async function PATCH(request: Request): Promise<Response> {
  try {
    readRequiredAdminToken(request);
    return NextResponse.json(
      { error: '관리자는 일정 확인만 가능합니다. 일정 등록과 수정은 작업자 계정에서 진행해 주세요.' },
      { status: 403 },
    );
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : '일정 수정 권한을 확인하지 못했습니다.' },
      { status: 500 },
    );
  }
}
