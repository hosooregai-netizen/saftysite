import { NextResponse } from 'next/server';
import {
  fetchSafetyMailRecipientSuggestionsServer,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';

export const runtime = 'nodejs';

function parseLimit(value: string | null) {
  const parsed = Number(value || '8');
  if (!Number.isFinite(parsed)) return 8;
  return Math.max(1, Math.min(50, parsed));
}

export async function GET(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const { searchParams } = new URL(request.url);
    const response = await fetchSafetyMailRecipientSuggestionsServer(
      token,
      {
        account_id: searchParams.get('accountId') || '',
        limit: parseLimit(searchParams.get('limit')),
        query: searchParams.get('query') || '',
      },
      request,
    );

    return NextResponse.json({ rows: response.rows });
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load mail recipient suggestions.' },
      { status: 500 },
    );
  }
}
