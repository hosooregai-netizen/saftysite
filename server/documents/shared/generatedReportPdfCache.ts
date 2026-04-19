import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

export interface GeneratedReportPdfCacheKey {
  documentKind: 'bad_workplace' | 'quarterly_report' | 'technical_guidance';
  reportKey: string;
  updatedAt: string;
}

interface GeneratedReportPdfCacheEntry {
  buffer: Buffer;
  filename: string;
}

interface GeneratedReportPdfCacheMeta extends GeneratedReportPdfCacheKey {
  cachedAt: string;
  filename: string;
}

function getCacheRoot() {
  const configured = process.env.GENERATED_REPORT_PDF_CACHE_DIR?.trim();
  return configured || path.join(process.cwd(), '.artifacts', 'generated-report-pdf-cache');
}

function buildCacheStem(input: GeneratedReportPdfCacheKey) {
  return createHash('sha1')
    .update(
      [
        input.documentKind.trim(),
        input.reportKey.trim(),
        input.updatedAt.trim() || 'unknown',
      ].join('::'),
    )
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
    filename: entry.filename,
  };
  await fs.mkdir(root, { recursive: true });
  await Promise.all([
    fs.writeFile(pdfPath, entry.buffer),
    fs.writeFile(metaPath, JSON.stringify(meta)),
  ]);
}
