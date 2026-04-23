import assert from 'node:assert/strict';
import test from 'node:test';

import { SafetyApiError } from './client';
import {
  buildProxyUploadOversizeErrorMessage,
  canUseDirectUploadUrl,
  getProxyUploadWarningMessage,
  resolveUploadTransport,
  shouldFallbackDirectUploadToProxy,
} from './uploadTransport';

const FOUR_POINT_FIVE_MB = Math.floor(4.5 * 1024 * 1024);

test('allows direct upload only when the target URL is valid for the current page protocol', () => {
  assert.equal(
    canUseDirectUploadUrl('https://uploads.example.com/photo-assets/upload', 'https:'),
    true,
  );
  assert.equal(
    canUseDirectUploadUrl('http://uploads.example.com/photo-assets/upload', 'https:'),
    false,
  );
  assert.equal(canUseDirectUploadUrl('http://uploads.example.com/photo-assets/upload', 'http:'), true);
});

test('falls back to proxy transport only when no usable direct upload URL exists and the proxy base is local', () => {
  assert.deepEqual(
    resolveUploadTransport({
      directUploadUrl: 'http://uploads.example.com/photo-assets/upload',
      proxyBaseUrl: '/api/safety',
      pageProtocol: 'https:',
    }),
    {
      directUploadUrl: null,
      usesProxyUpload: true,
    },
  );

  assert.deepEqual(
    resolveUploadTransport({
      directUploadUrl: null,
      proxyBaseUrl: 'https://api.example.com/api/safety',
      pageProtocol: 'https:',
    }),
    {
      directUploadUrl: null,
      usesProxyUpload: false,
    },
  );
});

test('blocks proxy fallback for oversized uploads and only allows limited direct failures', () => {
  assert.equal(
    shouldFallbackDirectUploadToProxy(
      new SafetyApiError('missing', 404),
      1024,
      FOUR_POINT_FIVE_MB,
    ),
    true,
  );
  assert.equal(
    shouldFallbackDirectUploadToProxy(
      new Error('콘텐츠 파일 업로드가 실패했습니다 (500). broken'),
      1024,
      FOUR_POINT_FIVE_MB,
    ),
    false,
  );
  assert.equal(
    shouldFallbackDirectUploadToProxy(
      new Error('network down'),
      FOUR_POINT_FIVE_MB + 1,
      FOUR_POINT_FIVE_MB,
    ),
    false,
  );
});

test('builds consistent proxy upload guidance messages', () => {
  assert.match(
    buildProxyUploadOversizeErrorMessage('파일'),
    /NEXT_PUBLIC_SAFETY_UPLOAD_UPSTREAM_BASE_URL/,
  );
  assert.match(
    getProxyUploadWarningMessage('파일'),
    /NEXT_PUBLIC_SAFETY_UPLOAD_UPSTREAM_BASE_URL/,
  );
});
