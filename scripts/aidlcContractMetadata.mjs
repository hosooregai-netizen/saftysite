import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const metadataPath = path.join(
  repoRoot,
  'tests',
  'client',
  'contracts',
  'featureContractMetadata.json',
);

let metadataCache = null;

function escapeRegex(value) {
  return value.replace(/[|\\{}()[\]^$+?.*]/g, '\\$&');
}

function globToRegex(glob) {
  let pattern = escapeRegex(glob);
  pattern = pattern.replace(/\\\*\\\*/g, '::DOUBLE_STAR::');
  pattern = pattern.replace(/\\\*/g, '[^/]*');
  pattern = pattern.replace(/::DOUBLE_STAR::/g, '.*');
  return new RegExp(`^${pattern}$`);
}

function compileGlobs(globs) {
  return globs.map((glob) => ({
    glob,
    regex: globToRegex(glob),
  }));
}

function normalizeContractMetadata(rawMetadata) {
  const contracts = Object.fromEntries(
    Object.entries(rawMetadata.contracts).map(([contractId, metadata]) => [
      contractId,
      {
        ...metadata,
        _ownedGlobMatchers: compileGlobs(metadata.ownedGlobs),
        recoverySlices: metadata.recoverySlices.map((slice) => ({
          ...slice,
          _ownedGlobMatchers: compileGlobs(slice.ownedGlobs),
        })),
      },
    ]),
  );

  return {
    ...rawMetadata,
    contracts,
    _guardedScopeMatchers: Object.fromEntries(
      Object.entries(rawMetadata.guardedGlobsByScope).map(([scope, globs]) => [
        scope,
        compileGlobs(globs),
      ]),
    ),
  };
}

export function loadContractMetadata() {
  if (metadataCache) {
    return metadataCache;
  }

  const raw = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  metadataCache = normalizeContractMetadata(raw);
  return metadataCache;
}

function matchesCompiledMatchers(file, matchers) {
  return matchers.some((matcher) => matcher.regex.test(file));
}

export function isGuardedFile(file) {
  const metadata = loadContractMetadata();
  return Object.values(metadata._guardedScopeMatchers).some((matchers) =>
    matchesCompiledMatchers(file, matchers),
  );
}

export function getGuardedScopesForFile(file) {
  const metadata = loadContractMetadata();
  return Object.entries(metadata._guardedScopeMatchers)
    .filter(([, matchers]) => matchesCompiledMatchers(file, matchers))
    .map(([scope]) => scope);
}

export function findContractsForFile(file) {
  const metadata = loadContractMetadata();
  return Object.entries(metadata.contracts)
    .filter(([, contract]) => matchesCompiledMatchers(file, contract._ownedGlobMatchers))
    .map(([contractId, contract]) => ({
      contractId,
      metadata: contract,
    }));
}

export function findRecoverySlicesForFile(file) {
  const metadata = loadContractMetadata();
  const matches = [];

  for (const [contractId, contract] of Object.entries(metadata.contracts)) {
    for (const slice of contract.recoverySlices) {
      if (!matchesCompiledMatchers(file, slice._ownedGlobMatchers)) {
        continue;
      }

      matches.push({
        contractId,
        contract,
        slice,
      });
    }
  }

  return matches;
}

export function getManagedRecoverySlices() {
  const metadata = loadContractMetadata();
  const slices = [];

  for (const [contractId, contract] of Object.entries(metadata.contracts)) {
    for (const slice of contract.recoverySlices) {
      slices.push({
        contractId,
        contract,
        slice,
      });
    }
  }

  return slices;
}

export function getAllSmokeIds() {
  const metadata = loadContractMetadata();
  const smokeIds = new Set();

  for (const contract of Object.values(metadata.contracts)) {
    for (const id of contract.smokeScope.ids) {
      smokeIds.add(id);
    }
  }

  return [...smokeIds];
}

export function getSmokeIdsForScopes(scopes) {
  const metadata = loadContractMetadata();
  const requestedScopes = new Set(scopes);
  const smokeIds = new Set();

  for (const contract of Object.values(metadata.contracts)) {
    if (!requestedScopes.has(contract.scope)) {
      continue;
    }

    for (const id of contract.smokeScope.ids) {
      smokeIds.add(id);
    }
  }

  return [...smokeIds];
}

export function getContractMetadataPath() {
  return path.relative(repoRoot, metadataPath).replace(/\\/g, '/');
}

export function getReverseSpecInventoryPath() {
  return 'docs/reverse-specs/feature-inventory.md';
}
