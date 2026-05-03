import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeSiteLifecycleStatus } from './lifecycleStatus';
import type { SafetySite } from '@/types/backend';

function buildSite(overrides: Partial<SafetySite> = {}): SafetySite {
  return {
    contract_date: null,
    contract_end_date: null,
    contract_signed_date: null,
    contract_start_date: null,
    contract_status: null,
    lifecycle_status: 'planned',
    project_end_date: null,
    project_start_date: null,
    status: 'planned',
    ...overrides,
  } as SafetySite;
}

test('site period normalization promotes in-period planned sites to active', () => {
  assert.equal(
    normalizeSiteLifecycleStatus(
      buildSite({
        contract_start_date: '2026-04-01',
        contract_end_date: '2026-06-01',
        status: 'planned',
      }),
      '2026-05-03',
    ),
    'active',
  );
});

test('site period normalization closes expired non-completed sites', () => {
  assert.equal(
    normalizeSiteLifecycleStatus(
      buildSite({
        contract_start_date: '2026-01-01',
        contract_end_date: '2026-05-02',
        status: 'active',
      }),
      '2026-05-03',
    ),
    'closed',
  );
});

test('site period normalization keeps future-start sites planned', () => {
  assert.equal(
    normalizeSiteLifecycleStatus(
      buildSite({
        contract_start_date: '2026-05-04',
        contract_end_date: '2026-07-01',
        lifecycle_status: 'active',
        status: 'active',
      }),
      '2026-05-03',
    ),
    'planned',
  );
});

test('site period normalization does not reopen paused sites', () => {
  assert.equal(
    normalizeSiteLifecycleStatus(
      buildSite({
        contract_start_date: '2026-04-01',
        contract_end_date: '2026-06-01',
        contract_status: 'paused',
        status: 'planned',
      }),
      '2026-05-03',
    ),
    'paused',
  );
});
