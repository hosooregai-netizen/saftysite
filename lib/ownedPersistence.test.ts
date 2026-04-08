import assert from 'node:assert/strict';
import test from 'node:test';

import {
  unwrapOwnedPersistedValue,
  type PersistedOwnedCacheRecord,
} from './ownedPersistence';

test('returns owned cache values only when the owner matches', () => {
  const cached: PersistedOwnedCacheRecord<{ reportKeys: string[] }> = {
    ownerId: 'user-1',
    savedAt: '2026-04-09T00:00:00.000Z',
    value: {
      reportKeys: ['report-1'],
    },
  };

  assert.deepEqual(unwrapOwnedPersistedValue(cached, 'user-1'), {
    reportKeys: ['report-1'],
  });
  assert.equal(unwrapOwnedPersistedValue(cached, 'user-2'), null);
  assert.equal(unwrapOwnedPersistedValue({ value: {} }, 'user-1'), null);
});
