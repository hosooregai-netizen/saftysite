import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildMailReportFilename,
  buildMailReportAttachment,
  prepareGeneratedMailReportPdf,
  readMailReportFilenameFromHeaders,
  shouldUseOriginalPdfForMailReport,
} from './reportAttachment';

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

test('buildMailReportAttachment fetches original PDF for legacy reports', async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    assert.equal(
      String(input),
      'https://app.example.com/api/admin/reports/legacy%3Atechnical_guidance%3A9001/original-pdf',
    );
    assert.equal(init?.method, 'GET');
    assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer token-1');
    return new Response(new Uint8Array([37, 80, 68, 70]), {
      headers: {
        'content-disposition': "attachment; filename*=UTF-8''legacy.pdf",
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
        reportKey: 'legacy:technical_guidance:9001',
        reportTitle: '하왕십리동 890-93 다세대 신축공사 기술지도 보고서',
      },
    );

    assert.equal(attachment.filename, '하왕십리동 890-93 다세대 신축공사 기술지도 보고서.pdf');
    assert.equal(attachment.content_type, 'application/pdf');
    assert.equal(attachment.data_base64, 'JVBERg==');
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('buildMailReportAttachment posts reportKey to current quarterly PDF route', async () => {
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

test('buildMailReportAttachment falls back to generated PDF when original PDF is missing', async () => {
  const previousFetch = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push(String(input));
    if (String(input).endsWith('/api/admin/reports/legacy%3Atechnical_guidance%3A9001/original-pdf')) {
      return new Response(JSON.stringify({ error: '원본 PDF가 등록되지 않았습니다.' }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      });
    }
    assert.equal(String(input), 'https://app.example.com/api/documents/inspection/pdf');
    assert.equal(init?.method, 'POST');
    assert.equal(init?.body, JSON.stringify({ reportKey: 'legacy:technical_guidance:9001' }));
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
        originalPdfAvailable: true,
        reportKey: 'legacy:technical_guidance:9001',
        reportTitle: '하왕십리동 890-93 다세대 신축공사 기술지도 보고서',
        reportType: 'technical_guidance',
      },
    );

    assert.deepEqual(calls, [
      'https://app.example.com/api/admin/reports/legacy%3Atechnical_guidance%3A9001/original-pdf',
      'https://app.example.com/api/documents/inspection/pdf',
    ]);
    assert.equal(attachment.filename, '하왕십리동 890-93 다세대 신축공사 기술지도 보고서.pdf');
    assert.equal(attachment.data_base64, 'JVBERg==');
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('prepareGeneratedMailReportPdf warms generated PDF route without base64 encoding', async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
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
    const result = await prepareGeneratedMailReportPdf(
      new Request('https://app.example.com/api/mail/prepare-report'),
      'token-1',
      { reportKey: 'inspection-1', reportType: 'technical_guidance' },
    );

    assert.deepEqual(result, { prepared: true, skipped: null });
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('prepareGeneratedMailReportPdf skips only reports that explicitly expose an original PDF', async () => {
  const result = await prepareGeneratedMailReportPdf(
    new Request('https://app.example.com/api/mail/prepare-report'),
    'token-1',
    { originalPdfAvailable: true, reportKey: 'legacy:technical_guidance:9001' },
  );

  assert.deepEqual(result, { prepared: false, skipped: 'original_pdf' });
});
