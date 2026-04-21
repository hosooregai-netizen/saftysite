import test from 'node:test';
import assert from 'node:assert/strict';
import {
  collectFullSmokeConfigFiles,
  collectFullSmokeScopes,
  collectVerificationConfigFiles,
  isZeroOid,
  parsePrePushUpdates,
} from '../../scripts/aidlcHookUtils.mjs';

test('parsePrePushUpdates parses standard hook input lines', () => {
  const updates = parsePrePushUpdates(
    [
      'refs/heads/feature abcdef refs/heads/feature 123456',
      'refs/heads/main fedcba refs/heads/main 654321',
    ].join('\n'),
  );

  assert.deepEqual(updates, [
    {
      localRef: 'refs/heads/feature',
      localOid: 'abcdef',
      remoteRef: 'refs/heads/feature',
      remoteOid: '123456',
    },
    {
      localRef: 'refs/heads/main',
      localOid: 'fedcba',
      remoteRef: 'refs/heads/main',
      remoteOid: '654321',
    },
  ]);
});

test('collectVerificationConfigFiles includes hook and metadata changes', () => {
  const files = [
    '.githooks/pre-commit',
    'tests/client/contracts/featureContractMetadata.json',
    'app/(admin)/page.tsx',
  ];

  assert.deepEqual(collectVerificationConfigFiles(files), [
    '.githooks/pre-commit',
    'tests/client/contracts/featureContractMetadata.json',
  ]);
});

test('collectFullSmokeConfigFiles narrows to smoke-affecting guardrail files', () => {
  const files = [
    'tests/client/fixtures/erpSmokeHarness.ts',
    'scripts/validateRecoverySlices.mjs',
    'tests/client/contracts/featureContractMetadata.json',
  ];

  assert.deepEqual(collectFullSmokeConfigFiles(files), [
    'tests/client/fixtures/erpSmokeHarness.ts',
    'tests/client/contracts/featureContractMetadata.json',
  ]);
});

test('collectFullSmokeScopes infers admin/erp scope from smoke-affecting files', () => {
  const files = [
    'tests/client/fixtures/adminSmokeHarness.ts',
    'scripts/smokeClient.ts',
    'tests/client/contracts/featureContractMetadata.json',
  ];

  assert.deepEqual(collectFullSmokeScopes(files), ['admin', 'erp']);
});

test('isZeroOid recognizes deleted remote refs', () => {
  assert.equal(isZeroOid('0000000000000000000000000000000000000000'), true);
  assert.equal(isZeroOid('1234567890abcdef'), false);
});
