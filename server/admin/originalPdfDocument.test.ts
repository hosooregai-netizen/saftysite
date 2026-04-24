import assert from 'node:assert/strict';
import test from 'node:test';
import {
  fetchAdminOriginalPdfDescriptor,
  fetchAdminOriginalPdfDocument,
} from './originalPdfDocument';

test('fetchAdminOriginalPdfDocument reads legacy manifest uploads through the direct asset path', async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    assert.match(
      String(input),
      /\/uploads\/content-items\/014b5e89d6a04950ac574e03d33a5c4f-legacy-admin-report-2025-04-25-351093\.pdf$/,
    );
    assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer token-1');
    return new Response(new Uint8Array([37, 80, 68, 70]), {
      headers: {
        'content-type': 'application/pdf',
      },
    });
  }) as typeof fetch;

  try {
    const document = await fetchAdminOriginalPdfDocument({
      reportKey: 'legacy:technical_guidance:351093',
      request: new Request('https://app.example.com/api/admin/reports/legacy%3Atechnical_guidance%3A351093/original-pdf'),
      token: 'token-1',
    });

    assert.equal(document.filename, 'legacy-admin-report-2025-04-25-351093.pdf');
    assert.equal(document.contentType, 'application/pdf');
    assert.equal(document.source.endsWith('/uploads/content-items/014b5e89d6a04950ac574e03d33a5c4f-legacy-admin-report-2025-04-25-351093.pdf'), true);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('fetchAdminOriginalPdfDescriptor reads legacy manifest upload size through HEAD', async () => {
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
    const descriptor = await fetchAdminOriginalPdfDescriptor({
      reportKey: 'legacy:technical_guidance:351093',
      request: new Request('https://app.example.com/api/admin/reports/legacy%3Atechnical_guidance%3A351093/original-pdf'),
      token: 'token-1',
    });

    assert.equal(descriptor.filename, 'legacy-admin-report-2025-04-25-351093.pdf');
    assert.equal(descriptor.contentType, 'application/pdf');
    assert.equal(descriptor.sizeBytes, 71241257);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('fetchAdminOriginalPdfDescriptor falls back to a ranged GET when the asset endpoint does not support HEAD', async () => {
  const previousFetch = globalThis.fetch;
  const calls: Array<{ headers: Headers; method: string; url: string }> = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method || 'GET';
    const headers = new Headers(init?.headers);
    calls.push({ headers, method, url });

    if (url.includes('/uploads/content-items/014b5e89d6a04950ac574e03d33a5c4f-legacy-admin-report-2025-04-25-351093.pdf')) {
      assert.equal(method, 'HEAD');
      return new Response(null, { status: 404 });
    }

    if (url.includes('/api/v1/content-items/assets/014b5e89d6a04950ac574e03d33a5c4f-legacy-admin-report-2025-04-25-351093.pdf')) {
      if (method === 'HEAD') {
        return new Response(null, { status: 405 });
      }

      assert.equal(method, 'GET');
      assert.equal(headers.get('range'), 'bytes=0-0');
      return new Response(new Uint8Array([37]), {
        status: 206,
        headers: {
          'content-length': '1',
          'content-range': 'bytes 0-0/71241257',
          'content-type': 'application/pdf',
        },
      });
    }

    throw new Error(`unexpected fetch: ${url}`);
  }) as typeof fetch;

  try {
    const descriptor = await fetchAdminOriginalPdfDescriptor({
      reportKey: 'legacy:technical_guidance:351093',
      request: new Request('https://app.example.com/api/admin/reports/legacy%3Atechnical_guidance%3A351093/original-pdf'),
      token: 'token-1',
    });

    assert.equal(descriptor.filename, 'legacy-admin-report-2025-04-25-351093.pdf');
    assert.equal(descriptor.contentType, 'application/pdf');
    assert.equal(descriptor.sizeBytes, 71241257);
    assert.match(
      descriptor.source,
      /\/api\/v1\/content-items\/assets\/014b5e89d6a04950ac574e03d33a5c4f-legacy-admin-report-2025-04-25-351093\.pdf$/,
    );
    assert.equal(calls.length, 3);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('fetchAdminOriginalPdfDescriptor falls through to the next candidate when the first HEAD probe times out', async () => {
  const previousFetch = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push(`${init?.method || 'GET'} ${url}`);

    if (url.includes('/uploads/content-items/014b5e89d6a04950ac574e03d33a5c4f-legacy-admin-report-2025-04-25-351093.pdf')) {
      const error = new Error('timed out');
      (error as Error & { name: string }).name = 'AbortError';
      throw error;
    }

    if (url.includes('/api/v1/content-items/assets/014b5e89d6a04950ac574e03d33a5c4f-legacy-admin-report-2025-04-25-351093.pdf')) {
      return new Response(null, {
        headers: {
          'content-length': '71241257',
          'content-type': 'application/pdf',
        },
      });
    }

    throw new Error(`unexpected fetch: ${url}`);
  }) as typeof fetch;

  try {
    const descriptor = await fetchAdminOriginalPdfDescriptor({
      reportKey: 'legacy:technical_guidance:351093',
      request: new Request('https://app.example.com/api/admin/reports/legacy%3Atechnical_guidance%3A351093/original-pdf'),
      token: 'token-1',
    });

    assert.equal(descriptor.sizeBytes, 71241257);
    assert.match(
      descriptor.source,
      /\/api\/v1\/content-items\/assets\/014b5e89d6a04950ac574e03d33a5c4f-legacy-admin-report-2025-04-25-351093\.pdf$/,
    );
    assert.equal(calls.length, 2);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('fetchAdminOriginalPdfDescriptor can skip report metadata lookup when a direct download path is provided', async () => {
  const previousFetch = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push(`${init?.method || 'GET'} ${url}`);
    assert.match(url, /\/uploads\/legacy\/reports\/report-direct-path\.pdf$/);
    assert.equal(init?.method, 'HEAD');
    assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer token-1');
    return new Response(null, {
      headers: {
        'content-length': '4161717',
        'content-type': 'application/pdf',
      },
    });
  }) as typeof fetch;

  try {
    const descriptor = await fetchAdminOriginalPdfDescriptor({
      preferredDownloadPath: '/uploads/legacy/reports/report-direct-path.pdf',
      reportKey: 'report-direct-path',
      request: new Request('https://app.example.com/api/mail/send-report'),
      token: 'token-1',
    });

    assert.equal(descriptor.sizeBytes, 4161717);
    assert.equal(descriptor.contentType, 'application/pdf');
    assert.equal(calls.length, 1);
    assert.match(
      calls[0],
      /^HEAD http:\/\/52\.64\.85\.49:8011\/uploads\/legacy\/reports\/report-direct-path\.pdf$/,
    );
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('fetchAdminOriginalPdfDocument raises 504 when every direct asset lookup times out', async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    const error = new Error('timed out');
    (error as Error & { name: string }).name = 'AbortError';
    throw error;
  }) as typeof fetch;

  try {
    await assert.rejects(
      fetchAdminOriginalPdfDocument({
        reportKey: 'legacy:technical_guidance:351093',
        request: new Request('https://app.example.com/api/admin/reports/legacy%3Atechnical_guidance%3A351093/original-pdf'),
        token: 'token-1',
      }),
      (error: unknown) => {
        assert.equal((error as { status?: number })?.status, 504);
        assert.match(String((error as Error).message), /시간 안에 완료되지 않았습니다/);
        return true;
      },
    );
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('fetchAdminOriginalPdfDocument keeps arbitrary uploads paths from report metadata', async () => {
  const previousFetch = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push(url);
    if (url.includes('/reports/by-key/report-uploads/original-pdf')) {
      return new Response(JSON.stringify({ error: 'missing' }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (url.includes('/reports/by-key/report-uploads')) {
      assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer token-1');
      return new Response(
        JSON.stringify({
          id: 'report-uploads',
          report_key: 'report-uploads',
          report_title: '업로드 경로 보고서',
          site_id: 'site-1',
          headquarter_id: 'hq-1',
          assigned_user_id: null,
          visit_date: '2026-04-20',
          visit_round: 1,
          total_round: 1,
          progress_rate: 100,
          status: 'submitted',
          workflow_status: 'submitted',
          payload_version: 1,
          latest_revision_no: 0,
          submitted_at: '2026-04-20T09:00:00+09:00',
          published_at: null,
          last_autosaved_at: '2026-04-20T09:00:00+09:00',
          report_type: 'technical_guidance',
          meta: {
            original_pdf_download_path: '/uploads/legacy/reports/report-uploads.pdf',
            original_pdf_filename: 'legacy-direct.pdf',
          },
          created_at: '2026-04-20T09:00:00+09:00',
          updated_at: '2026-04-20T09:00:00+09:00',
          payload: {},
        }),
        { headers: { 'content-type': 'application/json' } },
      );
    }
    if (url.endsWith('/uploads/legacy/reports/report-uploads.pdf')) {
      return new Response(new Uint8Array([37, 80, 68, 70]), {
        headers: { 'content-type': 'application/pdf' },
      });
    }

    throw new Error(`unexpected fetch: ${url}`);
  }) as typeof fetch;

  try {
    const document = await fetchAdminOriginalPdfDocument({
      reportKey: 'report-uploads',
      request: new Request('https://app.example.com/api/mail/send-report'),
      token: 'token-1',
    });

    assert.deepEqual(calls.map((url) => url.replace(/^https?:\/\/[^/]+/, '')), [
      '/api/v1/reports/by-key/report-uploads',
      '/uploads/legacy/reports/report-uploads.pdf',
    ]);
    assert.equal(document.filename, 'legacy-direct.pdf');
  } finally {
    globalThis.fetch = previousFetch;
  }
});
