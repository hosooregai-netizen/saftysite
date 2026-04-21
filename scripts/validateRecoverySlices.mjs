import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  findContractsForFile,
  findRecoverySlicesForFile,
  getReverseSpecInventoryPath,
  isGuardedFile,
  loadContractMetadata,
} from './aidlcContractMetadata.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inventoryPath = path.join(repoRoot, getReverseSpecInventoryPath());

function getCommandCandidates(command) {
  if (process.platform !== 'win32') {
    return [command];
  }

  return [command, `${command}.cmd`, `${command}.exe`];
}

function execCommand(command, args, options = {}) {
  let lastError = null;

  for (const candidate of getCommandCandidates(command)) {
    try {
      if (process.platform === 'win32' && candidate.endsWith('.cmd')) {
        return execFileSync('cmd.exe', ['/d', '/s', '/c', candidate, ...args], options);
      }

      return execFileSync(candidate, args, options);
    } catch (error) {
      if (error && typeof error === 'object' && ['ENOENT', 'EINVAL'].includes(error.code)) {
        lastError = error;
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

function run(command, args, options = {}) {
  return execCommand(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  }).trim();
}

function getStagedFiles() {
  const output = run('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR']);
  return output ? output.split('\n').map((line) => line.trim()).filter(Boolean) : [];
}

function assert(condition, message, failures) {
  if (!condition) {
    failures.push(message);
  }
}

function validateStaticMetadata() {
  const metadata = loadContractMetadata();
  const failures = [];
  const sliceIds = new Set();
  const reverseSpecPaths = new Set();
  const inventoryContents = fs.readFileSync(inventoryPath, 'utf8');
  const featureContractIds = JSON.parse(
    run('npx', ['tsx', 'scripts/listFeatureContractIds.ts']),
  ).sort();
  const metadataContractIds = Object.keys(metadata.contracts).sort();

  assert(
    Object.keys(metadata.contracts).length > 0,
    'feature contract metadata does not declare any contracts.',
    failures,
  );
  assert(
    JSON.stringify(featureContractIds) === JSON.stringify(metadataContractIds),
    'feature contract metadata ids must stay in sync with tests/client/featureContracts.ts.',
    failures,
  );

  for (const [contractId, contract] of Object.entries(metadata.contracts)) {
    assert(contract.scope === 'admin' || contract.scope === 'erp', `${contractId} has an invalid scope.`, failures);
    assert(contract.ownedGlobs.length > 0, `${contractId} must declare at least one owned glob.`, failures);
    assert(
      contract.smokeScope?.kind === 'client-smoke',
      `${contractId} must declare a client-smoke scope.`,
      failures,
    );
    assert(
      Array.isArray(contract.smokeScope?.ids) && contract.smokeScope.ids.length > 0,
      `${contractId} must declare at least one smoke id.`,
      failures,
    );

    for (const slice of contract.recoverySlices) {
      assert(!sliceIds.has(slice.id), `recovery slice id "${slice.id}" is duplicated.`, failures);
      sliceIds.add(slice.id);

      assert(slice.ownedGlobs.length > 0, `${slice.id} must declare at least one owned glob.`, failures);
      assert(
        slice.status === 'done' || slice.status === 'seed',
        `${slice.id} has an invalid reverse-spec status.`,
        failures,
      );
      assert(
        slice.criticalInvariants.length > 0,
        `${slice.id} must declare at least one critical invariant.`,
        failures,
      );
      assert(
        slice.targetedChecks.length > 0,
        `${slice.id} must declare at least one targeted check.`,
        failures,
      );

      const absoluteReverseSpecPath = path.join(repoRoot, slice.reverseSpecPath);
      const reverseSpecExists = fs.existsSync(absoluteReverseSpecPath);
      assert(reverseSpecExists, `${slice.id} points to a missing reverse spec: ${slice.reverseSpecPath}`, failures);

      if (!reverseSpecExists) {
        continue;
      }

      assert(
        !reverseSpecPaths.has(slice.reverseSpecPath),
        `reverse spec path "${slice.reverseSpecPath}" is assigned to multiple slices.`,
        failures,
      );
      reverseSpecPaths.add(slice.reverseSpecPath);

      const reverseSpecContents = fs.readFileSync(absoluteReverseSpecPath, 'utf8');
      assert(
        reverseSpecContents.includes(`Recovery Slice ID: \`${slice.id}\``),
        `${slice.reverseSpecPath} must declare Recovery Slice ID \`${slice.id}\`.`,
        failures,
      );
      assert(
        reverseSpecContents.includes(`Top-level contract: \`${contractId}\``),
        `${slice.reverseSpecPath} must declare Top-level contract \`${contractId}\`.`,
        failures,
      );

      if (slice.status === 'done') {
        assert(
          inventoryContents.includes(`\`${slice.id}\``),
          `feature inventory is missing slice id \`${slice.id}\`.`,
          failures,
        );
        assert(
          inventoryContents.includes(slice.reverseSpecPath),
          `feature inventory is missing reverse spec path ${slice.reverseSpecPath}.`,
          failures,
        );
      }
    }
  }

  return failures;
}

function validateChangedFiles(files) {
  const metadata = loadContractMetadata();
  const failures = [];
  const changedFileSet = new Set(files);
  const impactedSlices = new Map();

  for (const file of files) {
    if (!isGuardedFile(file)) {
      continue;
    }

    const matchedContracts = findContractsForFile(file);
    if (matchedContracts.length === 0) {
      failures.push(`guarded file "${file}" is not mapped to any top-level contract.`);
      continue;
    }

    for (const match of findRecoverySlicesForFile(file)) {
      if (!metadata.contracts[match.contractId].enforceRecoverySlices) {
        continue;
      }

      impactedSlices.set(match.slice.id, {
        contractId: match.contractId,
        reverseSpecPath: match.slice.reverseSpecPath,
      });
    }
  }

  for (const { contractId, reverseSpecPath } of impactedSlices.values()) {
    if (!changedFileSet.has(reverseSpecPath)) {
      failures.push(
        `contract "${contractId}" changed inside a managed recovery slice but did not update ${reverseSpecPath}.`,
      );
    }
  }

  return failures;
}

function main() {
  const candidateFiles = process.argv.slice(2);
  const files = candidateFiles.length > 0 ? candidateFiles : getStagedFiles();
  const failures = [
    ...validateStaticMetadata(),
    ...validateChangedFiles(files),
  ];

  if (failures.length === 0) {
    console.log('[recovery-slices] passed.');
    return;
  }

  console.error('[recovery-slices] validation failed:');
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}

main();
