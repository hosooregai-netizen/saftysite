import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import {
  fetchAdminReportByKey,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';

export const runtime = 'nodejs';

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function readMetaText(meta: Record<string, unknown>, key: string) {
  return normalizeText(meta[key]);
}

function encodeDownloadName(value: string) {
  return `attachment; filename*=UTF-8''${encodeURIComponent(value)}`;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ reportKey: string }> },
): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const { reportKey } = await context.params;
    const report = await fetchAdminReportByKey(token, reportKey, request);
    const meta = report.meta && typeof report.meta === 'object' ? (report.meta as Record<string, unknown>) : {};
    const archivePath =
      readMetaText(meta, 'original_pdf_archive_path') ||
      readMetaText(meta, 'originalPdfArchivePath');

    if (!archivePath) {
      return NextResponse.json({ error: '원본 PDF가 등록되지 않았습니다.' }, { status: 404 });
    }

    const resolvedPath = path.resolve(archivePath);
    const buffer = await fs.readFile(resolvedPath);
    const fileName =
      readMetaText(meta, 'original_pdf_filename') ||
      readMetaText(meta, 'originalPdfFilename') ||
      `${reportKey}.pdf`;

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Disposition': encodeDownloadName(fileName),
        'Content-Type': 'application/pdf',
      },
      status: 200,
    });
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if ((error as NodeJS.ErrnoException | null)?.code === 'ENOENT') {
      return NextResponse.json({ error: '원본 PDF 파일을 찾지 못했습니다.' }, { status: 404 });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '원본 PDF 다운로드에 실패했습니다.',
      },
      { status: 500 },
    );
  }
}
