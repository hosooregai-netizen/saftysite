import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildMailReportDownloadUrl,
  readMailReportDownloadToken,
  resolveMailReportPublicBaseUrl,
} from './reportDownloadLink';

test('resolveMailReportPublicBaseUrl prefers configured public base urls over localhost request origins', () => {
  const originalEnv = process.env.MAIL_REPORT_PUBLIC_BASE_URL;
  process.env.MAIL_REPORT_PUBLIC_BASE_URL = 'https://safetysite-psi.vercel.app';

  try {
    assert.equal(
      resolveMailReportPublicBaseUrl('http://127.0.0.1:3211/api/mail/send-report'),
      'https://safetysite-psi.vercel.app',
    );
  } finally {
    if (originalEnv === undefined) {
      delete process.env.MAIL_REPORT_PUBLIC_BASE_URL;
    } else {
      process.env.MAIL_REPORT_PUBLIC_BASE_URL = originalEnv;
    }
  }
});

test('buildMailReportDownloadUrl creates a signed public download link that round-trips the report payload', () => {
  const originalSecret = process.env.MAIL_REPORT_DOWNLOAD_SECRET;
  process.env.MAIL_REPORT_DOWNLOAD_SECRET = 'mail-report-download-test-secret';

  try {
    const url = buildMailReportDownloadUrl({
      accessToken: 'token-123',
      filename: 'legacy-report.pdf',
      publicBaseUrl: 'https://app.example.com',
      reportKey: 'legacy:technical_guidance:427520',
    });
    const parsed = new URL(url);
    assert.equal(parsed.origin, 'https://app.example.com');
    assert.equal(parsed.pathname, '/api/mail/report-download');

    const payload = readMailReportDownloadToken(parsed.searchParams.get('token') || '');
    assert.equal(payload.accessToken, 'token-123');
    assert.equal(payload.filename, 'legacy-report.pdf');
    assert.equal(payload.reportKey, 'legacy:technical_guidance:427520');
    assert.ok(payload.expiresAt > Date.now());
  } finally {
    if (originalSecret === undefined) {
      delete process.env.MAIL_REPORT_DOWNLOAD_SECRET;
    } else {
      process.env.MAIL_REPORT_DOWNLOAD_SECRET = originalSecret;
    }
  }
});
