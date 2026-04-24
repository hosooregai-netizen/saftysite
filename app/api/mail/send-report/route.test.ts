import assert from 'node:assert/strict';
import test from 'node:test';

import { SafetyServerApiError } from '@/server/admin/safetyApiServer';
import { handleSendReportPost } from './routeHandler';
import {
  buildOversizeReportFallbackBody,
  buildQueuedMailMessage,
  getMailAttachmentPayloadSizeBytes,
  isOversizeMailAttachmentError,
  MAIL_ATTACHMENT_TOTAL_LIMIT_BYTES,
  materializeMailAttachmentDownload,
  shouldSendReportAsDownloadLink,
} from './routeHelpers';
import { readMailReportDownloadToken } from '@/server/mail/reportDownloadLink';

test('POST /api/mail/send-report waits for oversized link sends and returns the real sent message', async () => {
  const sendCalls: Array<{
    payload: Record<string, unknown>;
    request: Request | null;
    token: string;
  }> = [];
  let materializeCalls = 0;
  const request = new Request('https://app.example.com/api/mail/send-report', {
    body: JSON.stringify({
      account_id: 'account-1',
      attachments: [{ filename: 'note.txt', data_base64: 'bm90ZQ==', content_type: 'text/plain' }],
      body: '<p>body</p>',
      headquarter_id: 'hq-1',
      original_pdf_available: true,
      original_pdf_download_path: '/uploads/content-items/oversized-report.pdf',
      report_key: 'legacy:technical_guidance:427520',
      report_title: 'Oversized report',
      site_id: 'site-1',
      subject: 'Oversized send',
      to: [{ email: 'receiver@example.com', name: 'Receiver' }],
    }),
    headers: {
      authorization: 'Bearer route-token',
      'content-type': 'application/json',
    },
    method: 'POST',
  });

  const response = await handleSendReportPost(request, {
    buildMailReportAttachment: async () => ({
      content_type: 'application/pdf',
      download_headers: {
        Authorization: 'Bearer route-token',
      },
      download_url: 'https://app.example.com/api/admin/reports/legacy%3Atechnical_guidance%3A427520/original-pdf',
      filename: 'oversized-report.pdf',
      size_bytes: MAIL_ATTACHMENT_TOTAL_LIMIT_BYTES + 1,
    }),
    buildOversizeReportFallbackBody: () => '<p>download-link-body</p>',
    isOversizeMailAttachmentError,
    mapBackendMailMessage: (message) => ({
      accountId: message.account_id,
      body: message.body,
      bodyPreview: message.body_preview,
      createdAt: message.created_at,
      deliveredAt: message.delivered_at,
      direction: 'outgoing',
      fromEmail: message.from_email,
      fromName: message.from_name,
      headquarterId: message.headquarter_id,
      id: message.id,
      readAt: message.read_at,
      reportKey: message.report_key,
      sentAt: message.sent_at,
      siteId: message.site_id,
      subject: message.subject,
      threadId: message.thread_id,
      to: message.to.map((recipient) => ({
        email: recipient.email,
        name: recipient.name ?? null,
      })),
      updatedAt: message.updated_at,
    }),
    materializeMailAttachmentDownload: async () => {
      materializeCalls += 1;
      return {
        content_type: 'application/pdf',
        data_base64: 'JVBERg==',
        filename: 'oversized-report.pdf',
        size_bytes: 4,
      };
    },
    readRequiredAdminToken: () => 'route-token',
    sendSafetyMailServer: async (token, payload, currentRequest = null) => {
      sendCalls.push({
        payload,
        request: currentRequest ?? null,
        token,
      });
      return {
        account_id: 'account-1',
        body: String(payload.body || ''),
        body_preview: 'download-link-body',
        created_at: '2026-04-24T10:00:00.000Z',
        delivered_at: '2026-04-24T10:00:02.000Z',
        direction: 'outgoing',
        from_email: 'sender@example.com',
        from_name: 'Sender',
        headquarter_id: 'hq-1',
        id: 'message-1',
        read_at: null,
        report_key: 'legacy:technical_guidance:427520',
        sent_at: '2026-04-24T10:00:01.000Z',
        site_id: 'site-1',
        subject: 'Oversized send',
        thread_id: 'thread-1',
        to: [{ email: 'receiver@example.com', name: 'Receiver' }],
        updated_at: '2026-04-24T10:00:02.000Z',
      };
    },
    shouldSendReportAsDownloadLink: () => true,
  });

  assert.equal(materializeCalls, 0);
  assert.equal(sendCalls.length, 1);
  assert.equal(sendCalls[0]?.token, 'route-token');
  assert.equal(sendCalls[0]?.request, request);
  assert.deepEqual(sendCalls[0]?.payload.attachments, [
    { filename: 'note.txt', data_base64: 'bm90ZQ==', content_type: 'text/plain' },
  ]);
  assert.equal(sendCalls[0]?.payload.body, '<p>download-link-body</p>');
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    accountId: 'account-1',
    body: '<p>download-link-body</p>',
    bodyPreview: 'download-link-body',
    createdAt: '2026-04-24T10:00:00.000Z',
    deliveredAt: '2026-04-24T10:00:02.000Z',
    direction: 'outgoing',
    fromEmail: 'sender@example.com',
    fromName: 'Sender',
    headquarterId: 'hq-1',
    id: 'message-1',
    readAt: null,
    reportKey: 'legacy:technical_guidance:427520',
    sentAt: '2026-04-24T10:00:01.000Z',
    siteId: 'site-1',
    subject: 'Oversized send',
    threadId: 'thread-1',
    to: [{ email: 'receiver@example.com', name: 'Receiver' }],
    updatedAt: '2026-04-24T10:00:02.000Z',
  });
});

test('isOversizeMailAttachmentError matches backend attachment limit failures', () => {
  assert.equal(
    isOversizeMailAttachmentError(
      new SafetyServerApiError('첨부 파일 총 용량이 너무 큽니다. 15MB 이하로 줄여 주세요.', 400),
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
  const originalSecret = process.env.MAIL_REPORT_DOWNLOAD_SECRET;
  process.env.MAIL_REPORT_DOWNLOAD_SECRET = 'mail-report-download-test-secret';

  try {
  const body = buildOversizeReportFallbackBody({
    accessToken: 'token-123',
    body: '<p>본문</p>',
    reportAttachment: {
      content_type: 'application/pdf',
      download_url: 'https://app.example.com/api/admin/reports/legacy%3Atechnical_guidance%3A427520/original-pdf?download=1',
      filename: 'legacy-admin-report-2025-05-23-427520.pdf',
    },
    reportFilename: '2025년 교통안전시설(안전표지) 유지보수공사(연간단가) 2025-05-23 2차 기술지도 보고서.pdf',
    requestUrl: 'https://app.example.com/api/mail/send-report',
  });

  assert.match(body, /첨부 파일 용량이 커서 외부 다운로드 링크로 대체/);
  assert.match(body, /일정 기간 뒤 만료될 수 있습니다/);
  assert.match(body, /2025년 교통안전시설\(안전표지\) 유지보수공사\(연간단가\)/);
  const hrefMatch = body.match(/href="([^"]+)"/);
  assert.ok(hrefMatch?.[1]);
  const downloadUrl = new URL(hrefMatch[1]);
  assert.equal(downloadUrl.origin, 'https://app.example.com');
  assert.equal(downloadUrl.pathname, '/api/mail/report-download');
  const payload = readMailReportDownloadToken(downloadUrl.searchParams.get('token') || '');
  assert.equal(payload.reportKey, 'legacy:technical_guidance:427520');
  assert.equal(payload.accessToken, 'token-123');
  } finally {
    if (originalSecret === undefined) {
      delete process.env.MAIL_REPORT_DOWNLOAD_SECRET;
    } else {
      process.env.MAIL_REPORT_DOWNLOAD_SECRET = originalSecret;
    }
  }
});

test('buildOversizeReportFallbackBody falls back to report-open when the report attachment uses a raw asset url', () => {
  const originalSecret = process.env.MAIL_REPORT_DOWNLOAD_SECRET;
  process.env.MAIL_REPORT_DOWNLOAD_SECRET = 'mail-report-download-test-secret';

  try {
  const body = buildOversizeReportFallbackBody({
    accessToken: 'token-raw-asset',
    body: '<p>본문</p>',
    reportAttachment: {
      content_type: 'application/pdf',
      download_url: 'http://52.64.85.49/uploads/content-items/legacy-report-427520.pdf',
      filename: 'legacy-admin-report-2025-05-23-427520.pdf',
    },
    reportKey: 'legacy:technical_guidance:427520',
    reportTitle: '2025년 교통안전시설(안전표지) 유지보수공사(연간단가) 2025-05-23 2차 기술지도 보고서',
    requestUrl: 'http://127.0.0.1:3211/api/mail/send-report',
  });

  const hrefMatch = body.match(/href="([^"]+)"/);
  assert.ok(hrefMatch?.[1]);
  const downloadUrl = new URL(hrefMatch[1]);
  assert.equal(downloadUrl.origin, 'http://127.0.0.1:3211');
  assert.equal(downloadUrl.pathname, '/api/mail/report-download');
  const payload = readMailReportDownloadToken(downloadUrl.searchParams.get('token') || '');
  assert.equal(payload.reportKey, 'legacy:technical_guidance:427520');
  assert.equal(payload.accessToken, 'token-raw-asset');
  } finally {
    if (originalSecret === undefined) {
      delete process.env.MAIL_REPORT_DOWNLOAD_SECRET;
    } else {
      process.env.MAIL_REPORT_DOWNLOAD_SECRET = originalSecret;
    }
  }
});

test('buildOversizeReportFallbackBody falls back to report-open when the public download secret is missing', () => {
  const originalSecret = process.env.MAIL_REPORT_DOWNLOAD_SECRET;
  const originalAdminPassword = process.env.SAFETY_ADMIN_PASSWORD;
  const originalLivePassword = process.env.LIVE_SAFETY_PASSWORD;
  delete process.env.MAIL_REPORT_DOWNLOAD_SECRET;
  delete process.env.SAFETY_ADMIN_PASSWORD;
  delete process.env.LIVE_SAFETY_PASSWORD;

  try {
    const body = buildOversizeReportFallbackBody({
      accessToken: 'token-no-secret',
      body: '<p>본문</p>',
      reportAttachment: {
        content_type: 'application/pdf',
        download_url: 'https://app.example.com/api/admin/reports/legacy%3Atechnical_guidance%3A440160/original-pdf',
        filename: 'legacy-admin-report-2025-06-23-440160.pdf',
      },
      reportKey: 'legacy:technical_guidance:440160',
      reportTitle: '2025년 교통안전시설(안전표지) 유지보수공사(연간단가) 2025-06-23 3차 기술지도 보고서',
      requestUrl: 'https://app.example.com/api/mail/send-report',
    });

    assert.match(body, /앱에서 여는 링크로 대체/);
    assert.match(body, /앱 로그인 후 보고서를 확인/);
    const hrefMatch = body.match(/href="([^"]+)"/);
    assert.ok(hrefMatch?.[1]);
    const downloadUrl = new URL(hrefMatch[1]);
    assert.equal(downloadUrl.origin, 'https://app.example.com');
    assert.equal(downloadUrl.pathname, '/admin/report-open');
    assert.equal(downloadUrl.searchParams.get('reportKey'), 'legacy:technical_guidance:440160');
  } finally {
    if (originalSecret === undefined) {
      delete process.env.MAIL_REPORT_DOWNLOAD_SECRET;
    } else {
      process.env.MAIL_REPORT_DOWNLOAD_SECRET = originalSecret;
    }
    if (originalAdminPassword === undefined) {
      delete process.env.SAFETY_ADMIN_PASSWORD;
    } else {
      process.env.SAFETY_ADMIN_PASSWORD = originalAdminPassword;
    }
    if (originalLivePassword === undefined) {
      delete process.env.LIVE_SAFETY_PASSWORD;
    } else {
      process.env.LIVE_SAFETY_PASSWORD = originalLivePassword;
    }
  }
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

test('buildQueuedMailMessage returns a mailbox-safe placeholder response for queued oversized sends', () => {
  const message = buildQueuedMailMessage({
    accountId: 'account-1',
    body: '<p>본문</p><hr /><p>보고서 첨부 파일 용량이 커서 다운로드 링크로 대체했습니다.</p>',
    fromEmail: 'sender@example.com',
    fromName: '관제',
    headquarterId: 'hq-1',
    id: 'queued:mail-report:test-1',
    queuedAt: '2026-04-24T00:30:00.000Z',
    reportKey: 'legacy:technical_guidance:427520',
    siteId: 'site-1',
    subject: '링크 메일 접수',
    to: [{ email: 'rlqls505@naver.com', name: null }],
  });

  assert.equal(message.id, 'queued:mail-report:test-1');
  assert.equal(message.threadId, 'queued:mail-report:test-1');
  assert.equal(message.sentAt, '2026-04-24T00:30:00.000Z');
  assert.match(message.bodyPreview, /다운로드 링크로 대체/);
  assert.equal(message.to[0]?.email, 'rlqls505@naver.com');
});
