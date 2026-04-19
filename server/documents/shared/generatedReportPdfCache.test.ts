import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

import {
  readGeneratedReportPdfCache,
  writeGeneratedReportPdfCache,
} from './generatedReportPdfCache';

test('generated report pdf cache round-trips by revision key', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'generated-report-pdf-cache-'));
  process.env.GENERATED_REPORT_PDF_CACHE_DIR = tempRoot;

  try {
    const key = {
      documentKind: 'technical_guidance' as const,
      reportKey: 'report-1',
      updatedAt: '2026-04-20T09:10:11.000Z',
    };
    const missing = await readGeneratedReportPdfCache(key);
    assert.equal(missing, null);

    await writeGeneratedReportPdfCache(key, {
      buffer: Buffer.from('%PDF-1.4 cache'),
      filename: 'guide.pdf',
    });

    const cached = await readGeneratedReportPdfCache(key);
    assert.ok(cached);
    assert.equal(cached?.filename, 'guide.pdf');
    assert.equal(cached?.buffer.toString('utf8'), '%PDF-1.4 cache');

    const nextRevision = await readGeneratedReportPdfCache({
      ...key,
      updatedAt: '2026-04-21T00:00:00.000Z',
    });
    assert.equal(nextRevision, null);
  } finally {
    delete process.env.GENERATED_REPORT_PDF_CACHE_DIR;
    await fs.rm(tempRoot, { force: true, recursive: true });
  }
});
