import { NextResponse } from 'next/server';
import {
  readRequiredAdminToken,
  SafetyServerApiError,
  sendSafetyMailServer,
} from '@/server/admin/safetyApiServer';
import { invalidateAdminOverviewAndReportsRouteCaches } from '@/server/admin/adminRouteInvalidation';
import { mapBackendMailMessage } from '@/server/admin/upstreamMappers';
import {
  isOversizeMailAttachmentError,
} from '../send-report/routeHelpers';
import { materializeMailSendAttachments } from './routeHelpers';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const payload = (await request.json()) as Record<string, unknown>;
    const attachments = await materializeMailSendAttachments(
      Array.isArray(payload.attachments) ? payload.attachments : [],
    );
    const result = await sendSafetyMailServer(
      token,
      {
        ...payload,
        attachments,
      },
      request,
    );
    const hasReportPayload =
      Boolean(payload.report_key || payload.reportKey) ||
      (Array.isArray(payload.report_keys) && payload.report_keys.length > 0) ||
      (Array.isArray(payload.reportKeys) && payload.reportKeys.length > 0);
    if (hasReportPayload) {
      invalidateAdminOverviewAndReportsRouteCaches();
    }
    return NextResponse.json(mapBackendMailMessage(result));
  } catch (error) {
    if (error instanceof SafetyServerApiError && isOversizeMailAttachmentError(error)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '메일 발송에 실패했습니다.' },
      { status: 500 },
    );
  }
}
