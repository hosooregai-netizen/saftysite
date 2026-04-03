import { NextResponse } from 'next/server';

import { buildAdminServerExportSheets } from '@/server/admin/exportSheets';
import { readRequiredAdminToken, SafetyServerApiError } from '@/server/admin/safetyApiServer';
import { buildWorkbookXlsxBuffer } from '@/server/admin/xlsx';
import type { TableExportColumn } from '@/types/admin';

export const runtime = 'nodejs';

interface WorkbookSheetRequest {
  columns: TableExportColumn[];
  name: string;
  rows: Array<Record<string, unknown>>;
}

interface AdminExportRequest {
  filename?: string;
  filters?: Record<string, unknown>;
  sheets?: WorkbookSheetRequest[];
}

function sanitizeFileName(value: string, fallback: string) {
  const normalized = value.replace(/[\\/:*?"<>|]/g, '-').trim();
  return normalized || fallback;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ section: string }> },
): Promise<Response> {
  try {
    const { section } = await context.params;
    const body = (await request.json()) as AdminExportRequest;
    const shouldUseServerData = !Array.isArray(body?.sheets) || body.sheets.length === 0;
    let sheets: WorkbookSheetRequest[] = [];

    if (shouldUseServerData) {
      const token = readRequiredAdminToken(request);
      sheets = await buildAdminServerExportSheets(section, body.filters || {}, token, request);
    } else {
      sheets = body.sheets ?? [];
    }

    if (!Array.isArray(sheets) || sheets.length === 0) {
      return NextResponse.json({ error: '엑셀 생성에 필요한 시트 데이터가 없습니다.' }, { status: 400 });
    }

    const buffer = await buildWorkbookXlsxBuffer({
      sheets: sheets.map((sheet) => ({
        columns: Array.isArray(sheet.columns) ? sheet.columns : [],
        name: sheet.name || 'Sheet1',
        rows: Array.isArray(sheet.rows) ? sheet.rows : [],
      })),
    });
    const timestamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
    const fallbackName = `admin-${sanitizeFileName(section, 'export')}-${timestamp}.xlsx`;
    const filename = sanitizeFileName(body.filename || fallbackName, fallbackName);

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '엑셀 생성 중 알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}
