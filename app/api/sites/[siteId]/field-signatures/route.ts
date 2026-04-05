import { NextResponse } from 'next/server';
import {
  createSiteFieldSignatureServer,
  fetchSiteFieldSignaturesServer,
  readRequiredSafetyAuthToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { mapBackendFieldSignatureRecord } from '@/server/admin/upstreamMappers';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  context: { params: Promise<{ siteId: string }> },
): Promise<Response> {
  try {
    const token = readRequiredSafetyAuthToken(request);
    const { siteId } = await context.params;
    const { searchParams } = new URL(request.url);
    const response = await fetchSiteFieldSignaturesServer(
      token,
      siteId,
      { limit: searchParams.get('limit') || '' },
      request,
    );
    return NextResponse.json(response.map((item) => mapBackendFieldSignatureRecord(item)));
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '현장 사인 목록을 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ siteId: string }> },
): Promise<Response> {
  try {
    const token = readRequiredSafetyAuthToken(request);
    const { siteId } = await context.params;
    const payload = (await request.json()) as Record<string, unknown>;
    return NextResponse.json(
      mapBackendFieldSignatureRecord(
        await createSiteFieldSignatureServer(token, siteId, payload, request),
      ),
    );
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '현장 사인을 저장하지 못했습니다.' },
      { status: 500 },
    );
  }
}
