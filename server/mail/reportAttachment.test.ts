import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  buildMailReportFilename,
  buildMailReportAttachment,
  prepareMailReportAttachment,
  readMailReportFilenameFromHeaders,
  shouldUseOriginalPdfForMailReport,
} from './reportAttachment';

async function withAttachmentCacheDir(callback: () => Promise<void>) {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'mail-report-attachment-cache-'));
  const previous = process.env.MAIL_REPORT_ATTACHMENT_CACHE_DIR;
  process.env.MAIL_REPORT_ATTACHMENT_CACHE_DIR = tempRoot;

  try {
    await callback();
  } finally {
    if (previous === undefined) {
      delete process.env.MAIL_REPORT_ATTACHMENT_CACHE_DIR;
    } else {
      process.env.MAIL_REPORT_ATTACHMENT_CACHE_DIR = previous;
    }
    await fs.rm(tempRoot, { force: true, recursive: true });
  }
}

test('shouldUseOriginalPdfForMailReport only enables rows that explicitly expose an original PDF', () => {
  assert.equal(
    shouldUseOriginalPdfForMailReport({ reportKey: 'legacy:technical_guidance:9001' }),
    false,
  );
  assert.equal(
    shouldUseOriginalPdfForMailReport({ originalPdfAvailable: true, reportKey: 'report-1' }),
    true,
  );
  assert.equal(shouldUseOriginalPdfForMailReport({ reportKey: 'report-1' }), false);
});

test('readMailReportFilenameFromHeaders decodes UTF-8 filenames', () => {
  const headers = new Headers({
    'content-disposition': "attachment; filename*=UTF-8''%EB%B3%B4%EA%B3%A0%EC%84%9C.pdf",
  });

  assert.equal(readMailReportFilenameFromHeaders(headers, 'fallback.pdf'), '보고서.pdf');
});

test('buildMailReportFilename prefers report display names and appends pdf extension', () => {
  assert.equal(
    buildMailReportFilename(
      {
        preferredFilename: '',
        reportKey: 'legacy:technical_guidance:9001',
        reportTitle: '하왕십리동 890-93 다세대 신축공사 기술지도 보고서',
      },
      'legacy.pdf',
    ),
    '하왕십리동 890-93 다세대 신축공사 기술지도 보고서.pdf',
  );
});

test('buildMailReportAttachment returns an authenticated original PDF download URL for legacy reports', async () => {
  await withAttachmentCacheDir(async () => {
    const previousFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      assert.match(
        String(input),
        /\/uploads\/content-items\/014b5e89d6a04950ac574e03d33a5c4f-legacy-admin-report-2025-04-25-351093\.pdf$/,
      );
      assert.equal(init?.method, 'HEAD');
      assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer token-1');
      return new Response(null, {
        headers: {
          'content-length': '71241257',
          'content-type': 'application/pdf',
        },
      });
    }) as typeof fetch;

    try {
      const attachment = await buildMailReportAttachment(
        new Request('https://app.example.com/api/mail/send-report'),
        'token-1',
        {
          originalPdfAvailable: true,
          reportKey: 'legacy:technical_guidance:351093',
          reportTitle: '하왕십리동 890-93 다세대 신축공사 기술지도 보고서',
        },
      );

      assert.equal(attachment.filename, '하왕십리동 890-93 다세대 신축공사 기술지도 보고서.pdf');
      assert.equal(attachment.content_type, 'application/pdf');
      assert.equal(
        attachment.download_url,
        'https://app.example.com/api/admin/reports/legacy%3Atechnical_guidance%3A351093/original-pdf',
      );
      assert.deepEqual(attachment.download_headers, { Authorization: 'Bearer token-1' });
      assert.equal(attachment.data_base64, undefined);
      assert.equal(attachment.size_bytes, 71241257);
    } finally {
      globalThis.fetch = previousFetch;
    }
  });
});

test('buildMailReportAttachment upgrades manifest-backed legacy reports to original PDF attachments even when the row metadata is stale', async () => {
  await withAttachmentCacheDir(async () => {
    const previousFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      assert.match(
        String(input),
        /\/uploads\/content-items\/6e85aa9a264e4b69a375053a66411250-legacy-admin-report-2025-05-23-427520\.pdf$/,
      );
      assert.equal(init?.method, 'HEAD');
      assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer token-1');
      return new Response(null, {
        headers: {
          'content-length': '71241257',
          'content-type': 'application/pdf',
        },
      });
    }) as typeof fetch;

    try {
      const attachment = await buildMailReportAttachment(
        new Request('https://app.example.com/api/mail/send-report'),
        'token-1',
        {
          originalPdfAvailable: false,
          reportKey: 'legacy:technical_guidance:427520',
          reportTitle:
            '2025년 교통안전시설(안전표지) 유지보수공사(연간단가) 2025-05-23 2차 기술지도 보고서',
        },
      );

      assert.equal(
        attachment.download_url,
        'https://app.example.com/api/admin/reports/legacy%3Atechnical_guidance%3A427520/original-pdf',
      );
      assert.equal(attachment.data_base64, undefined);
      assert.equal(attachment.size_bytes, 71241257);
    } finally {
      globalThis.fetch = previousFetch;
    }
  });
});

test('buildMailReportAttachment posts reportKey to current quarterly PDF route', async () => {
  await withAttachmentCacheDir(async () => {
    const previousFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      assert.equal(String(input), 'https://app.example.com/api/documents/quarterly/pdf');
      assert.equal(init?.method, 'POST');
      assert.equal(init?.body, JSON.stringify({ reportKey: 'quarterly-1' }));
      return new Response(new Uint8Array([37, 80, 68, 70]), {
        headers: {
          'content-disposition': "attachment; filename*=UTF-8''quarterly.pdf",
          'content-type': 'application/pdf',
        },
      });
    }) as typeof fetch;

    try {
      const attachment = await buildMailReportAttachment(
        new Request('https://app.example.com/api/mail/send-report'),
        'token-1',
        {
          reportKey: 'quarterly-1',
          reportTitle: '2026년 1분기 보고서',
          reportType: 'quarterly_report',
        },
      );

      assert.equal(attachment.filename, '2026년 1분기 보고서.pdf');
      assert.equal(attachment.data_base64, 'JVBERg==');
    } finally {
      globalThis.fetch = previousFetch;
    }
  });
});

test('buildMailReportAttachment falls back to generated PDF when a legacy original PDF lookup returns 404', async () => {
  await withAttachmentCacheDir(async () => {
    const previousFetch = globalThis.fetch;
    let fetchCount = 0;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      fetchCount += 1;
      if (fetchCount === 1) {
        assert.match(
          String(input),
          /\/uploads\/content-items\/6e85aa9a264e4b69a375053a66411250-legacy-admin-report-2025-05-23-427520\.pdf$/,
        );
        assert.equal(init?.method, 'HEAD');
        return new Response(null, { status: 404 });
      }

      assert.equal(String(input), 'https://app.example.com/api/documents/inspection/pdf');
      assert.equal(init?.method, 'POST');
      assert.equal(init?.body, JSON.stringify({ reportKey: 'legacy:technical_guidance:427520' }));
      return new Response(new Uint8Array([37, 80, 68, 70]), {
        headers: {
          'content-disposition': "attachment; filename*=UTF-8''inspection.pdf",
          'content-type': 'application/pdf',
        },
      });
    }) as typeof fetch;

    try {
      const attachment = await buildMailReportAttachment(
        new Request('https://app.example.com/api/mail/send-report'),
        'token-1',
        {
          originalPdfAvailable: false,
          reportKey: 'legacy:technical_guidance:427520',
          reportTitle:
            '2025년 교통안전시설(안전표지) 유지보수공사(연간단가) 2025-05-23 2차 기술지도 보고서',
          reportType: 'technical_guidance',
        },
      );

      assert.equal(attachment.download_url, undefined);
      assert.equal(attachment.data_base64, 'JVBERg==');
      assert.equal(fetchCount >= 2, true);
    } finally {
      globalThis.fetch = previousFetch;
    }
  });
});

test('prepareMailReportAttachment caches original PDF download references after reading only HEAD metadata', async () => {
  await withAttachmentCacheDir(async () => {
    const previousFetch = globalThis.fetch;
    let fetchCount = 0;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      fetchCount += 1;
      assert.match(
        String(input),
        /\/uploads\/content-items\/014b5e89d6a04950ac574e03d33a5c4f-legacy-admin-report-2025-04-25-351093\.pdf$/,
      );
      assert.equal(init?.method, 'HEAD');
      return new Response(null, {
        headers: {
          'content-length': '71241257',
          'content-type': 'application/pdf',
        },
      });
    }) as typeof fetch;

    try {
      const prepared = await prepareMailReportAttachment(
        new Request('https://app.example.com/api/mail/prepare-report'),
        'token-1',
        {
          originalPdfAvailable: true,
          preferredFilename: '하왕십리동 890-93 다세대 신축공사 기술지도 보고서',
          reportKey: 'legacy:technical_guidance:351093',
          reportTitle: '하왕십리동 890-93 다세대 신축공사 기술지도 보고서',
          reportType: 'technical_guidance',
        },
      );
      const attachment = await buildMailReportAttachment(
        new Request('https://app.example.com/api/mail/send-report'),
        'token-1',
        {
          originalPdfAvailable: true,
          preferredFilename: '하왕십리동 890-93 다세대 신축공사 기술지도 보고서',
          reportKey: 'legacy:technical_guidance:351093',
          reportTitle: '하왕십리동 890-93 다세대 신축공사 기술지도 보고서',
          reportType: 'technical_guidance',
        },
      );

      assert.deepEqual(prepared, { prepared: true, skipped: null });
      assert.equal(fetchCount, 1);
      assert.equal(attachment.filename, '하왕십리동 890-93 다세대 신축공사 기술지도 보고서.pdf');
      assert.equal(
        attachment.download_url,
        'https://app.example.com/api/admin/reports/legacy%3Atechnical_guidance%3A351093/original-pdf',
      );
      assert.deepEqual(attachment.download_headers, { Authorization: 'Bearer token-1' });
      assert.equal(attachment.size_bytes, 71241257);
    } finally {
      globalThis.fetch = previousFetch;
    }
  });
});

test('prepareMailReportAttachment caches the attachment before send', async () => {
  await withAttachmentCacheDir(async () => {
    const previousFetch = globalThis.fetch;
    let fetchCount = 0;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      fetchCount += 1;
      assert.equal(String(input), 'https://app.example.com/api/documents/inspection/pdf');
      assert.equal(init?.method, 'POST');
      assert.equal(init?.body, JSON.stringify({ reportKey: 'inspection-1' }));
      return new Response(new Uint8Array([37, 80, 68, 70]), {
        headers: {
          'content-disposition': "attachment; filename*=UTF-8''inspection.pdf",
          'content-type': 'application/pdf',
        },
      });
    }) as typeof fetch;

    try {
      const prepared = await prepareMailReportAttachment(
        new Request('https://app.example.com/api/mail/prepare-report'),
        'token-1',
        {
          preferredFilename: '기술지도 보고서',
          reportKey: 'inspection-1',
          reportTitle: '기술지도 보고서',
          reportType: 'technical_guidance',
          reportUpdatedAt: '2026-04-23T09:00:00+09:00',
        },
      );
      const attachment = await buildMailReportAttachment(
        new Request('https://app.example.com/api/mail/send-report'),
        'token-1',
        {
          preferredFilename: '기술지도 보고서',
          reportKey: 'inspection-1',
          reportTitle: '기술지도 보고서',
          reportType: 'technical_guidance',
          reportUpdatedAt: '2026-04-23T09:00:00+09:00',
        },
      );

      assert.deepEqual(prepared, { prepared: true, skipped: null });
      assert.equal(fetchCount, 1);
      assert.equal(attachment.filename, '기술지도 보고서.pdf');
      assert.equal(attachment.data_base64, 'JVBERg==');
    } finally {
      globalThis.fetch = previousFetch;
    }
  });
});

test('prepareMailReportAttachment reuses an already prepared cache entry', async () => {
  await withAttachmentCacheDir(async () => {
    const previousFetch = globalThis.fetch;
    let fetchCount = 0;
    globalThis.fetch = (async () => {
      fetchCount += 1;
      return new Response(new Uint8Array([37, 80, 68, 70]), {
        headers: {
          'content-disposition': "attachment; filename*=UTF-8''inspection.pdf",
          'content-type': 'application/pdf',
        },
      });
    }) as typeof fetch;

    try {
      const first = await prepareMailReportAttachment(
        new Request('https://app.example.com/api/mail/prepare-report'),
        'token-1',
        { reportKey: 'inspection-2', reportType: 'technical_guidance' },
      );
      const second = await prepareMailReportAttachment(
        new Request('https://app.example.com/api/mail/prepare-report'),
        'token-1',
        { reportKey: 'inspection-2', reportType: 'technical_guidance' },
      );

      assert.deepEqual(first, { prepared: true, skipped: null });
      assert.deepEqual(second, { prepared: false, skipped: 'cached' });
      assert.equal(fetchCount, 1);
    } finally {
      globalThis.fetch = previousFetch;
    }
  });
});
