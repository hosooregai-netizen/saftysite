import assert from 'node:assert/strict';
import test from 'node:test';
import { canArchiveReportsForSite } from './reportArchivePermissions';
import type { SafetyUser } from '@/types/backend';
import type { InspectionSite } from '@/types/inspectionSession';

const site = { id: 'site-1' } as InspectionSite;

function user(role: SafetyUser['role']) {
  return { role } as SafetyUser;
}

test('admins can archive reports without a site-specific gate', () => {
  assert.equal(canArchiveReportsForSite({ currentSite: null, currentUser: user('admin') }), true);
  assert.equal(
    canArchiveReportsForSite({ currentSite: null, currentUser: user('controller') }),
    true,
  );
});

test('field agents can archive reports only when a current site is resolved', () => {
  assert.equal(
    canArchiveReportsForSite({ currentSite: site, currentUser: user('field_agent') }),
    true,
  );
  assert.equal(
    canArchiveReportsForSite({ currentSite: null, currentUser: user('field_agent') }),
    false,
  );
});

test('client viewers cannot archive reports', () => {
  assert.equal(
    canArchiveReportsForSite({ currentSite: site, currentUser: user('client_viewer') }),
    false,
  );
});
