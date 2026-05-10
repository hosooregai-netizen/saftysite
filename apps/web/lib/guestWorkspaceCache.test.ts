import assert from 'node:assert/strict';
import test from 'node:test';
import { buildGuestWorkspaceCacheSummary } from './guestWorkspaceCache';

test('buildGuestWorkspaceCacheSummary counts each guest cache section independently', () => {
  const summary = buildGuestWorkspaceCacheSummary({
    directory: {
      headquarters: [{ id: 'hq-1' } as never, { id: 'hq-2' } as never],
      sites: [{ id: 'site-1' } as never],
      updatedAt: '2026-05-05T00:00:00.000Z',
    },
    mailboxDrafts: [{ id: 'draft-1' } as never, { id: 'draft-2' } as never],
    photoAlbum: [{ id: 'photo-1' } as never],
    drive: {
      items: [{ id: 'item-1' } as never, { id: 'item-2' } as never, { id: 'item-3' } as never],
      shares: [{ id: 'share-1' } as never],
      updatedAt: '2026-05-05T00:00:00.000Z',
    },
    sync: {
      lastImportedAt: null,
      lastImportedWorkspaceId: null,
    },
  });

  assert.deepEqual(summary, {
    headquarters: 2,
    sites: 1,
    mailboxDrafts: 2,
    photoAlbum: 1,
    driveItems: 3,
    driveShares: 1,
  });
});
