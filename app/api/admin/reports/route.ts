import { NextResponse } from 'next/server';
import { buildControllerReportRows } from '@/lib/admin/controllerReports';
import {
  fetchAdminCoreData,
  fetchAdminReports,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { queryAdminReportRows } from '@/server/admin/reportRows';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const url = new URL(request.url);
    const limit = Math.max(1, Math.min(200, Number(url.searchParams.get('limit') || '100')));
    const offset = Math.max(0, Number(url.searchParams.get('offset') || '0'));
    const sortBy = url.searchParams.get('sort_by') || 'updatedAt';
    const sortDir = url.searchParams.get('sort_dir') || 'desc';
    const query = (url.searchParams.get('query') || '').trim().toLowerCase();

    const [data, reports] = await Promise.all([
      fetchAdminCoreData(token, request),
      fetchAdminReports(token, request),
    ]);

    const sortedRows = queryAdminReportRows(
      buildControllerReportRows(reports, data.sites, data.users),
      {
        assigneeUserId: url.searchParams.get('assignee_user_id') || '',
        dateFrom: url.searchParams.get('date_from') || '',
        dateTo: url.searchParams.get('date_to') || '',
        dispatchStatus: url.searchParams.get('dispatch_status') || '',
        headquarterId: url.searchParams.get('headquarter_id') || '',
        qualityStatus: url.searchParams.get('quality_status') || '',
        query,
        reportType: url.searchParams.get('report_type') || '',
        siteId: url.searchParams.get('site_id') || '',
        sortBy,
        sortDir,
        status: url.searchParams.get('status') || '',
      },
    );

    return NextResponse.json({
      limit,
      offset,
      rows: sortedRows.slice(offset, offset + limit),
      total: sortedRows.length,
    });
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '보고서 목록을 불러오지 못했습니다.',
      },
      { status: 500 },
    );
  }
}
