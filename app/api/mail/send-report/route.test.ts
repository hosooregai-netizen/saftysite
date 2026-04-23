import assert from 'node:assert/strict';
import test from 'node:test';

import { SafetyServerApiError } from '@/server/admin/safetyApiServer';
import {
  buildOversizeReportFallbackBody,
  getMailAttachmentPayloadSizeBytes,
  isOversizeMailAttachmentError,
  MAIL_ATTACHMENT_TOTAL_LIMIT_BYTES,
  materializeMailAttachmentDownload,
  shouldSendReportAsDownloadLink,
} from './routeHelpers';

test('isOversizeMailAttachmentError matches backend attachment limit failures', () => {
  assert.equal(
    isOversizeMailAttachmentError(
      new SafetyServerApiError('첨부 파일 총 용량이 너무 큽니다. 20MB 이하로 줄여 주세요.', 400),
    ),
    true,
  );
  assert.equal(
    isOversizeMailAttachmentError(new SafetyServerApiError('다른 오류', 400)),
    false,
  );
  assert.equal(
    isOversizeMailAttachmentError(new Error('첨부 파일 총 용량이 너무 큽니다.')),
    false,
  );
});

test('buildOversizeReportFallbackBody appends a safe download link for oversized report attachments', () => {
  const body = buildOversizeReportFallbackBody({
    body: '<p>본문</p>',
    reportAttachment: {
      content_type: 'application/pdf',
      download_url: 'https://app.example.com/api/admin/reports/legacy%3Atechnical_guidance%3A427520/original-pdf?download=1',
      filename: 'legacy-admin-report-2025-05-23-427520.pdf',
    },
    reportFilename: '2025년 교통안전시설(안전표지) 유지보수공사(연간단가) 2025-05-23 2차 기술지도 보고서.pdf',
  });

  assert.match(body, /첨부 파일 용량이 커서 다운로드 링크로 대체/);
  assert.match(body, /2025년 교통안전시설\(안전표지\) 유지보수공사\(연간단가\)/);
  assert.match(body, /href="https:\/\/app\.example\.com\/api\/admin\/reports\//);
});

test('getMailAttachmentPayloadSizeBytes prefers size_bytes and decodes base64 payloads', () => {
  assert.equal(getMailAttachmentPayloadSizeBytes({ size_bytes: 1234 }), 1234);
  assert.equal(
    getMailAttachmentPayloadSizeBytes({ data_base64: Buffer.from('hello').toString('base64') }),
    5,
  );
  assert.equal(getMailAttachmentPayloadSizeBytes({ filename: 'report.pdf' }), null);
});

test('shouldSendReportAsDownloadLink switches oversized report attachments to a link before send', () => {
  assert.equal(
    shouldSendReportAsDownloadLink({
      attachments: [],
      reportAttachment: {
        content_type: 'application/pdf',
        download_url: 'https://app.example.com/api/admin/reports/report-1/original-pdf',
        filename: 'report.pdf',
        size_bytes: MAIL_ATTACHMENT_TOTAL_LIMIT_BYTES + 1,
      },
    }),
    true,
  );

  assert.equal(
    shouldSendReportAsDownloadLink({
      attachments: [
        {
          content_type: 'application/pdf',
          data_base64: Buffer.alloc(2 * 1024 * 1024, 0).toString('base64'),
          filename: 'photo.pdf',
        },
      ],
      reportAttachment: {
        content_type: 'application/pdf',
        download_url: 'https://app.example.com/api/admin/reports/report-2/original-pdf',
        filename: 'report.pdf',
        size_bytes: 19 * 1024 * 1024,
      },
    }),
    true,
  );

  assert.equal(
    shouldSendReportAsDownloadLink({
      attachments: [],
      reportAttachment: {
        content_type: 'application/pdf',
        filename: 'report.pdf',
        size_bytes: MAIL_ATTACHMENT_TOTAL_LIMIT_BYTES + 1,
      },
    }),
    false,
  );
});

test('materializeMailAttachmentDownload converts download_url attachments into base64 payloads', async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    assert.equal(String(input), 'https://app.example.com/api/admin/reports/report-1/original-pdf');
    assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer token-1');
    return new Response(new Uint8Array([37, 80, 68, 70]), {
      headers: {
        'content-type': 'application/pdf',
      },
    });
  }) as typeof fetch;

  try {
    const attachment = await materializeMailAttachmentDownload({
      content_type: 'application/pdf',
      download_headers: {
        Authorization: 'Bearer token-1',
      },
      download_url: 'https://app.example.com/api/admin/reports/report-1/original-pdf',
      filename: 'report.pdf',
      size_bytes: 4,
    });

    assert.equal(attachment.download_url, undefined);
    assert.equal(attachment.filename, 'report.pdf');
    assert.equal(attachment.data_base64, 'JVBERg==');
    assert.equal(attachment.size_bytes, 4);
  } finally {
    globalThis.fetch = previousFetch;
  }
});
