import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGeneratedSmokeRegistrySource,
  collectSmokeRegistryEntries,
  validateSmokeRegistryEntries,
  validateSmokeSpecMetadata,
} from '../../scripts/smokeRegistrySupport.mjs';

test('smoke registry entries stay sorted by contract id', () => {
  const entries = collectSmokeRegistryEntries();
  const ids = entries.map((entry) => entry.contractId);
  const sortedIds = [...ids].sort();

  assert.deepEqual(ids, sortedIds);
});

test('generated smoke registry source is deterministic and includes docs map', () => {
  const first = buildGeneratedSmokeRegistrySource();
  const second = buildGeneratedSmokeRegistrySource();

  assert.equal(first, second);
  assert.match(first, /export const SMOKE_RUNNERS = \{/);
  assert.match(first, /export const SMOKE_DOCS = \{/);
  assert.match(first, /'admin-control-center': \{/);
  assert.match(first, /primaryDocPath:/);
});

test('current smoke metadata validates cleanly', () => {
  assert.deepEqual(validateSmokeSpecMetadata(), []);
});

test('validateSmokeRegistryEntries reports missing smokeSpec requirements with canonical doc context', () => {
  const failures = validateSmokeRegistryEntries([
    {
      contractId: 'demo-contract',
      primaryDocPath: 'tests/client/contracts/smoke-specs/demo-contract.md',
      relatedDocPaths: [],
      runnerExportName: '',
      runnerImportPath: 'tests/client/demo-contract.spec.js',
      scope: 'erp',
      smokeIds: ['wrong-id', 'extra-id'],
    },
  ], {
    fileExists: () => false,
    readText: () => '',
  });

  assert.match(failures.join('\n'), /demo-contract must declare exactly one smoke id/);
  assert.match(failures.join('\n'), /demo-contract must use a single smoke id equal to the contract id/);
  assert.match(failures.join('\n'), /smoke runner path must point to a TypeScript module/);
});

test('validateSmokeRegistryEntries reports missing docs, duplicate related docs, and missing exports', () => {
  const files = new Map([
    ['tests/client/demo-contract.spec.ts', 'export async function differentRunner() {}'],
    ['tests/client/contracts/smoke-specs/demo-contract.md', '# Demo\n\n## Scope\n'],
  ]);
  const failures = validateSmokeRegistryEntries([
    {
      contractId: 'demo-contract',
      primaryDocPath: 'tests/client/contracts/smoke-specs/demo-contract.md',
      relatedDocPaths: [
        'tests/client/docs/related-a.md',
        'tests/client/docs/related-a.md',
        'tests/client/docs/related-b.txt',
      ],
      runnerExportName: 'runDemoContractSmoke',
      runnerImportPath: 'tests/client/demo-contract.spec.ts',
      scope: 'admin',
      smokeIds: ['demo-contract'],
    },
  ], {
    fileExists: (relativePath) => files.has(relativePath),
    readText: (relativePath) => files.get(relativePath) ?? '',
  });

  assert.match(failures.join('\n'), /points to missing runner export "runDemoContractSmoke"/);
  assert.match(failures.join('\n'), /canonical smoke doc must contain one of/);
  assert.match(failures.join('\n'), /has duplicate related smoke docs/);
  assert.match(failures.join('\n'), /points to a missing related smoke doc: tests\/client\/docs\/related-a\.md/);
  assert.match(failures.join('\n'), /related smoke docs must be markdown files: tests\/client\/docs\/related-b\.txt/);
});
