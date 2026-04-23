import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeOriginalPdfRouteReportKey } from './originalPdfRouteHelpers';

test('normalizeOriginalPdfRouteReportKey decodes encoded legacy report keys', () => {
  assert.equal(
    normalizeOriginalPdfRouteReportKey('legacy%3Atechnical_guidance%3A435681'),
    'legacy:technical_guidance:435681',
  );
});

test('normalizeOriginalPdfRouteReportKey keeps malformed encodings usable', () => {
  assert.equal(normalizeOriginalPdfRouteReportKey('legacy%3Atechnical_guidance%'), 'legacy%3Atechnical_guidance%');
});
