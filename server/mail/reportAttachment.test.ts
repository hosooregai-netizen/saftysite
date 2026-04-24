import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildMailReportFilename,
  buildMailReportAttachment,
  prepareMailReportAttachment,
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

test('buildMailReportAttachment returns an authenticated original PDF download URL for legacy reports', async () => {
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
        reportUpdatedAt: '2026-04-24T12:34:56.000Z',
      },
    );

    assert.equal(attachment.filename, '하왕십리동 890-93 다세대 신축공사 기술지도 보고서.pdf');
    assert.equal(attachment.content_type, 'application/pdf');
    assert.ok(attachment.download_url);
    assert.match(
      attachment.download_url,
      /\/uploads\/content-items\/014b5e89d6a04950ac574e03d33a5c4f-legacy-admin-report-2025-04-25-351093\.pdf$/,
    );
    assert.deepEqual(attachment.download_headers, { Authorization: 'Bearer token-1' });
    assert.equal(attachment.data_base64, undefined);
    assert.equal(attachment.size_bytes, 71241257);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('buildMailReportAttachment upgrades manifest-backed legacy reports to original PDF attachments even when the row metadata is stale', async () => {
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

    assert.ok(attachment.download_url);
    assert.match(
      attachment.download_url,
      /\/uploads\/content-items\/6e85aa9a264e4b69a375053a66411250-legacy-admin-report-2025-05-23-427520\.pdf$/,
    );
    assert.equal(attachment.data_base64, undefined);
    assert.equal(attachment.size_bytes, 71241257);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('buildMailReportAttachment keeps manifest-backed legacy original PDFs on the original-pdf route for 440160 without calling generated PDF endpoints', async () => {
  const previousFetch = globalThis.fetch;
  let fetchCount = 0;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    fetchCount += 1;
    assert.match(
      String(input),
      /\/uploads\/content-items\/d327feccfffb47ba999ea8f3ce51e13f-legacy-admin-report-2025-06-23-440160\.pdf$/,
    );
    assert.equal(init?.method, 'HEAD');
    return new Response(null, {
      headers: {
        'content-length': '24504008',
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
        reportKey: 'legacy:technical_guidance:440160',
        reportTitle:
          '2025년 교통안전시설(안전표지) 유지보수공사(연간단가) 2025-06-23 3차 기술지도 보고서',
      },
    );

    assert.equal(fetchCount, 1);
    assert.ok(attachment.download_url);
    assert.match(
      attachment.download_url,
      /\/uploads\/content-items\/d327feccfffb47ba999ea8f3ce51e13f-legacy-admin-report-2025-06-23-440160\.pdf$/,
    );
    assert.equal(attachment.data_base64, undefined);
    assert.equal(attachment.size_bytes, 24504008);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('buildMailReportAttachment inlines small original PDFs during attachment preparation', async () => {
  const previousFetch = globalThis.fetch;
  let fetchCount = 0;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    fetchCount += 1;
    assert.match(
      String(input),
      /\/uploads\/content-items\/014b5e89d6a04950ac574e03d33a5c4f-legacy-admin-report-2025-04-25-351093\.pdf$/,
    );
    if (init?.method === 'HEAD') {
      return new Response(null, {
        headers: {
          'content-length': '4161717',
          'content-type': 'application/pdf',
        },
      });
    }

    assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer token-1');
    return new Response(new Uint8Array([37, 80, 68, 70]), {
      headers: {
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
        reportUpdatedAt: '2026-04-24T13:30:00.000Z',
      },
    );

    assert.equal(fetchCount, 2);
    assert.equal(attachment.download_url, undefined);
    assert.equal(attachment.data_base64, 'JVBERg==');
    assert.equal(attachment.size_bytes, 4);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('buildMailReportAttachment uses the provided originalPdfDownloadPath without refetching report metadata', async () => {
  const previousFetch = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push(`${init?.method || 'GET'} ${url}`);
    assert.match(url, /\/uploads\/legacy\/reports\/report-direct-path\.pdf$/);
    assert.equal(init?.method, 'HEAD');
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
        originalPdfDownloadPath: '/uploads/legacy/reports/report-direct-path.pdf',
        reportKey: 'report-direct-path',
        reportTitle: '직접 경로 보고서',
      },
    );

    assert.equal(calls.length, 1);
    assert.ok(attachment.download_url);
    assert.match(
      attachment.download_url,
      /\/uploads\/legacy\/reports\/report-direct-path\.pdf$/,
    );
    assert.deepEqual(attachment.download_headers, { Authorization: 'Bearer token-1' });
    assert.equal(attachment.size_bytes, 71241257);
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

test('buildMailReportAttachment posts non-legacy technical guidance reports to the generated inspection PDF route', async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    assert.equal(String(input), 'https://app.example.com/api/documents/inspection/pdf');
    assert.equal(init?.method, 'POST');
    assert.equal(init?.body, JSON.stringify({ reportKey: 'report-current-draft-1' }));
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
        reportKey: 'report-current-draft-1',
        reportTitle: 'Current inspection report',
        reportType: 'technical_guidance',
      },
    );

    assert.equal(attachment.filename, 'Current inspection report.pdf');
    assert.equal(attachment.data_base64, 'JVBERg==');
    assert.equal(attachment.download_url, undefined);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('buildMailReportAttachment falls back to generated PDF when a legacy original PDF lookup returns 404', async () => {
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

test('buildMailReportAttachment keeps the original-pdf attachment when descriptor lookup times out', async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    const error = new Error('timed out');
    (error as Error & { name: string }).name = 'AbortError';
    throw error;
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

    assert.equal(
      attachment.download_url,
      'https://app.example.com/api/admin/reports/legacy%3Atechnical_guidance%3A351093/original-pdf',
    );
    assert.deepEqual(attachment.download_headers, { Authorization: 'Bearer token-1' });
    assert.equal(attachment.data_base64, undefined);
    assert.equal(attachment.size_bytes, undefined);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('prepareMailReportAttachment reuses the warmed original PDF descriptor for send', async () => {
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
    assert.ok(attachment.download_url);
    assert.match(
      attachment.download_url,
      /\/uploads\/content-items\/014b5e89d6a04950ac574e03d33a5c4f-legacy-admin-report-2025-04-25-351093\.pdf$/,
    );
    assert.deepEqual(attachment.download_headers, { Authorization: 'Bearer token-1' });
    assert.equal(attachment.size_bytes, 71241257);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('prepareMailReportAttachment reuses warmed small original PDFs for send', async () => {
  const previousFetch = globalThis.fetch;
  let fetchCount = 0;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    fetchCount += 1;
    assert.match(
      String(input),
      /\/uploads\/content-items\/014b5e89d6a04950ac574e03d33a5c4f-legacy-admin-report-2025-04-25-351093\.pdf$/,
    );
    if (init?.method === 'HEAD') {
      return new Response(null, {
        headers: {
          'content-length': '4161717',
          'content-type': 'application/pdf',
        },
      });
    }

    return new Response(new Uint8Array([37, 80, 68, 70]), {
      headers: {
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
        reportUpdatedAt: '2026-04-24T13:35:00.000Z',
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
        reportUpdatedAt: '2026-04-24T13:35:00.000Z',
      },
    );

    assert.deepEqual(prepared, { prepared: true, skipped: null });
    assert.equal(fetchCount, 2);
    assert.equal(attachment.download_url, undefined);
    assert.equal(attachment.data_base64, 'JVBERg==');
    assert.equal(attachment.size_bytes, 4);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('prepareMailReportAttachment reuses generated PDFs only for the same report revision', async () => {
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
    const first = await prepareMailReportAttachment(
      new Request('https://app.example.com/api/mail/prepare-report'),
      'token-1',
      {
        preferredFilename: '기술지도 보고서',
        reportKey: 'inspection-1',
        reportTitle: '기술지도 보고서',
        reportType: 'technical_guidance',
        reportUpdatedAt: '2026-04-24T09:00:00.000Z',
      },
    );
    const second = await prepareMailReportAttachment(
      new Request('https://app.example.com/api/mail/prepare-report'),
      'token-1',
      {
        preferredFilename: '기술지도 보고서',
        reportKey: 'inspection-1',
        reportTitle: '기술지도 보고서',
        reportType: 'technical_guidance',
        reportUpdatedAt: '2026-04-24T09:00:00.000Z',
      },
    );
    const third = await prepareMailReportAttachment(
      new Request('https://app.example.com/api/mail/prepare-report'),
      'token-1',
      {
        preferredFilename: '기술지도 보고서',
        reportKey: 'inspection-1',
        reportTitle: '기술지도 보고서',
        reportType: 'technical_guidance',
        reportUpdatedAt: '2026-04-24T09:05:00.000Z',
      },
    );

    assert.deepEqual(first, { prepared: true, skipped: null });
    assert.deepEqual(second, { prepared: true, skipped: null });
    assert.deepEqual(third, { prepared: true, skipped: null });
    assert.equal(fetchCount, 2);
  } finally {
    globalThis.fetch = previousFetch;
  }
});
