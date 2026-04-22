import { createHash } from 'crypto';
import os from 'os';
import { promises as fs } from 'fs';
import path from 'path';

export interface GeneratedReportPdfCacheKey {
  documentKind: 'bad_workplace' | 'quarterly_report' | 'technical_guidance';
  reportKey: string;
  updatedAt: string;
  version?: string;
}

interface GeneratedReportPdfCacheEntry {
  buffer: Buffer;
  downloadPath?: string;
  filename: string;
}

interface GeneratedReportPdfCacheMeta extends GeneratedReportPdfCacheKey {
  cachedAt: string;
  downloadPath?: string;
  filename: string;
}

function getCacheRoot() {
  const configured = process.env.GENERATED_REPORT_PDF_CACHE_DIR?.trim();
  return configured || path.join(os.tmpdir(), 'generated-report-pdf-cache');
}

function buildCacheStem(input: GeneratedReportPdfCacheKey) {
  const version = input.version?.trim();
  const parts = [
    input.documentKind.trim(),
    input.reportKey.trim(),
    input.updatedAt.trim() || 'unknown',
  ];
  if (version) {
    parts.push(version);
  }

  return createHash('sha1')
    .update(parts.join('::'))
    .digest('hex');
}

function resolveCachePaths(input: GeneratedReportPdfCacheKey) {
  const stem = buildCacheStem(input);
  const root = getCacheRoot();
  return {
    metaPath: path.join(root, `${stem}.json`),
    pdfPath: path.join(root, `${stem}.pdf`),
    root,
  };
}

export async function readGeneratedReportPdfCache(
  input: GeneratedReportPdfCacheKey,
): Promise<GeneratedReportPdfCacheEntry | null> {
  const { metaPath, pdfPath } = resolveCachePaths(input);
  try {
    const [metaText, buffer] = await Promise.all([
      fs.readFile(metaPath, 'utf8'),
      fs.readFile(pdfPath),
    ]);
    const meta = JSON.parse(metaText) as Partial<GeneratedReportPdfCacheMeta>;
    if (typeof meta.filename !== 'string' || !meta.filename.trim()) {
      return null;
    }
    return {
      buffer,
      downloadPath:
        typeof meta.downloadPath === 'string' && meta.downloadPath.trim()
          ? meta.downloadPath.trim()
          : undefined,
      filename: meta.filename.trim(),
    };
  } catch {
    return null;
  }
}

export async function writeGeneratedReportPdfCache(
  input: GeneratedReportPdfCacheKey,
  entry: GeneratedReportPdfCacheEntry,
): Promise<void> {
  const { metaPath, pdfPath, root } = resolveCachePaths(input);
  const meta: GeneratedReportPdfCacheMeta = {
    ...input,
    cachedAt: new Date().toISOString(),
    downloadPath: entry.downloadPath?.trim() || undefined,
    filename: entry.filename,
  };
  await fs.mkdir(root, { recursive: true });
  await Promise.all([
    fs.writeFile(pdfPath, entry.buffer),
    fs.writeFile(metaPath, JSON.stringify(meta)),
  ]);
}
