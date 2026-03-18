import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(): Promise<Response> {
  return NextResponse.json(
    {
      error:
        '문서 다운로드는 새 HWPX 템플릿 정리 후 다시 연결할 예정입니다. 현재는 입력 워크스페이스만 우선 제공됩니다.',
    },
    { status: 501 }
  );
}
