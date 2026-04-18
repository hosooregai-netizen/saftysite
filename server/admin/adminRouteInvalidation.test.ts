import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveAdminRouteInvalidationTargets } from './adminRouteInvalidation';

test('does not invalidate route caches for read-only requests', () => {
  assert.deepEqual(resolveAdminRouteInvalidationTargets(['reports'], 'GET'), {
    overview: false,
    reports: false,
  });
});

test('invalidates overview and reports route caches for report mutations', () => {
  assert.deepEqual(resolveAdminRouteInvalidationTargets(['reports', 'by-key', 'r1'], 'PATCH'), {
    overview: true,
    reports: true,
  });
});

test('invalidates overview and reports route caches for directory mutations', () => {
  assert.deepEqual(resolveAdminRouteInvalidationTargets(['sites', 'site-1', 'dispatch-policy'], 'PATCH'), {
    overview: true,
    reports: true,
  });
  assert.deepEqual(resolveAdminRouteInvalidationTargets(['assignments', 'assignment-1'], 'DELETE'), {
    overview: true,
    reports: true,
  });
});
