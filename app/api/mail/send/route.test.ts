import assert from 'node:assert/strict';
import test from 'node:test';

import { SafetyServerApiError } from '@/server/admin/safetyApiServer';
import { MAIL_ATTACHMENT_TOTAL_LIMIT_BYTES } from '../send-report/routeHelpers';
import { materializeMailSendAttachments } from './routeHelpers';

test('materializeMailSendAttachments converts download_url attachments into base64 payloads before send', async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    assert.equal(String(input), 'https://assets.example.com/uploads/content-items/report.pdf');
    return new Response(new Uint8Array([37, 80, 68, 70]), {
      headers: {
        'content-type': 'application/pdf',
      },
    });
  }) as typeof fetch;

  try {
    const attachments = await materializeMailSendAttachments([
      {
        content_type: 'application/pdf',
        download_url: 'https://assets.example.com/uploads/content-items/report.pdf',
        filename: 'report.pdf',
        size_bytes: 4,
      },
      {
        content_type: 'text/plain',
        data_base64: Buffer.from('hello').toString('base64'),
        filename: 'memo.txt',
      },
    ]);

    assert.equal(attachments.length, 2);
    assert.equal(attachments[0]?.download_url, undefined);
    assert.equal(attachments[0]?.data_base64, 'JVBERg==');
    assert.equal(attachments[0]?.size_bytes, 4);
    assert.equal(attachments[1]?.filename, 'memo.txt');
    assert.equal(attachments[1]?.data_base64, Buffer.from('hello').toString('base64'));
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('materializeMailSendAttachments rejects oversized attachment totals before backend send', async () => {
  await assert.rejects(
    materializeMailSendAttachments([
      {
        content_type: 'application/octet-stream',
        data_base64: 'AA==',
        filename: 'huge.bin',
        size_bytes: MAIL_ATTACHMENT_TOTAL_LIMIT_BYTES + 1,
      },
    ]),
    (error: unknown) => {
      assert.ok(error instanceof SafetyServerApiError);
      assert.equal(error.status, 400);
      assert.match(error.message, /20MB 이하/);
      return true;
    },
  );
});
