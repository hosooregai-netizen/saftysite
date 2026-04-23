import assert from 'node:assert/strict';
import test from 'node:test';

import { readOriginalPdfFilenameFromHeaders } from './originalPdfClient';

test('readOriginalPdfFilenameFromHeaders decodes UTF-8 filenames', () => {
  const headers = new Headers({
    'content-disposition': "inline; filename*=UTF-8''%EB%B3%B4%EA%B3%A0%EC%84%9C.pdf",
  });

  assert.equal(readOriginalPdfFilenameFromHeaders(headers, 'fallback.pdf'), '보고서.pdf');
});

test('readOriginalPdfFilenameFromHeaders falls back when disposition is missing', () => {
  assert.equal(readOriginalPdfFilenameFromHeaders(new Headers(), 'fallback.pdf'), 'fallback.pdf');
});
