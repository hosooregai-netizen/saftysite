import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContractMetadata } from './aidlcContractMetadata.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const generatedRegistryPath = path.join(repoRoot, 'tests', 'client', 'smokeRegistry.generated.ts');
const REQUIRED_PRIMARY_DOC_HEADINGS = ['## Verification', '## Manual Check'];

function toPosixPath(value) {
  return value.replace(/\\/g, '/');
}

function escapeForSingleQuotedString(value) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function readText(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

function hasNamedExport(moduleContents, exportName) {
  const escapedName = exportName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`export\\s+(?:async\\s+)?function\\s+${escapedName}\\b`),
    new RegExp(`export\\s+(?:const|let|var)\\s+${escapedName}\\b`),
    new RegExp(`export\\s*\\{[^}]*\\b${escapedName}\\b[^}]*\\}`),
  ];

  return patterns.some((pattern) => pattern.test(moduleContents));
}

export function getGeneratedSmokeRegistryPath() {
  return toPosixPath(path.relative(repoRoot, generatedRegistryPath));
}

export function getSmokeDocRequiredHeadings() {
  return [...REQUIRED_PRIMARY_DOC_HEADINGS];
}

export function collectSmokeRegistryEntries() {
  const metadata = loadContractMetadata();

  return Object.entries(metadata.contracts)
    .map(([contractId, contract]) => ({
      contractId,
      primaryDocPath: contract.smokeSpec.primaryDocPath,
      relatedDocPaths: contract.smokeSpec.relatedDocPaths,
      runnerExportName: contract.smokeSpec.runnerExportName,
      runnerImportPath: contract.smokeSpec.runnerImportPath,
      scope: contract.scope,
      smokeIds: contract.smokeScope.ids,
    }))
    .sort((left, right) => left.contractId.localeCompare(right.contractId));
}

export function validateSmokeRegistryEntries(
  entries,
  {
    fileExists: doesFileExist = fileExists,
    readText: readFileText = readText,
    requiredPrimaryDocHeadings = REQUIRED_PRIMARY_DOC_HEADINGS,
  } = {},
) {
  const failures = [];

  for (const entry of entries) {
    const {
      contractId,
      primaryDocPath,
      relatedDocPaths,
      runnerExportName,
      runnerImportPath,
      smokeIds,
    } = entry;

    if (smokeIds.length !== 1) {
      failures.push(`${contractId} must declare exactly one smoke id. canonical doc: ${primaryDocPath}`);
    }

    if (smokeIds[0] !== contractId) {
      failures.push(
        `${contractId} must use a single smoke id equal to the contract id. canonical doc: ${primaryDocPath}`,
      );
    }

    if (!runnerImportPath || !runnerImportPath.startsWith('tests/client/')) {
      failures.push(`${contractId} must use a repo-relative smoke runner path under tests/client/. canonical doc: ${primaryDocPath}`);
    } else if (!/\.(ts|tsx)$/.test(runnerImportPath)) {
      failures.push(`${contractId} smoke runner path must point to a TypeScript module: ${runnerImportPath}. canonical doc: ${primaryDocPath}`);
    } else if (!doesFileExist(runnerImportPath)) {
      failures.push(`${contractId} points to a missing smoke runner module: ${runnerImportPath}. canonical doc: ${primaryDocPath}`);
    } else {
      const moduleContents = readFileText(runnerImportPath);
      if (!runnerExportName) {
        failures.push(`${contractId} must declare smokeSpec.runnerExportName. canonical doc: ${primaryDocPath}`);
      } else if (!hasNamedExport(moduleContents, runnerExportName)) {
        failures.push(
          `${contractId} points to missing runner export "${runnerExportName}" in ${runnerImportPath}. canonical doc: ${primaryDocPath}`,
        );
      }
    }

    if (!primaryDocPath || !primaryDocPath.startsWith('tests/client/')) {
      failures.push(`${contractId} must declare a canonical smoke doc under tests/client/.`);
    } else if (!primaryDocPath.endsWith('.md')) {
      failures.push(`${contractId} canonical smoke doc must be a markdown file: ${primaryDocPath}`);
    } else if (!doesFileExist(primaryDocPath)) {
      failures.push(`${contractId} points to a missing canonical smoke doc: ${primaryDocPath}`);
    } else {
      const primaryDocContents = readFileText(primaryDocPath);
      if (!requiredPrimaryDocHeadings.some((heading) => primaryDocContents.includes(heading))) {
        failures.push(
          `${contractId} canonical smoke doc must contain one of ${requiredPrimaryDocHeadings.join(', ')}: ${primaryDocPath}`,
        );
      }
    }

    if (!Array.isArray(relatedDocPaths)) {
      failures.push(`${contractId} must declare smokeSpec.relatedDocPaths as an array. canonical doc: ${primaryDocPath}`);
      continue;
    }

    const duplicateRelatedDocPaths = relatedDocPaths.filter(
      (docPath, index) => relatedDocPaths.indexOf(docPath) !== index,
    );
    if (duplicateRelatedDocPaths.length > 0) {
      failures.push(
        `${contractId} has duplicate related smoke docs: ${[...new Set(duplicateRelatedDocPaths)].join(', ')}. canonical doc: ${primaryDocPath}`,
      );
    }

    for (const docPath of relatedDocPaths) {
      if (!docPath.startsWith('tests/client/')) {
        failures.push(`${contractId} related smoke docs must live under tests/client/: ${docPath}. canonical doc: ${primaryDocPath}`);
        continue;
      }
      if (!docPath.endsWith('.md')) {
        failures.push(`${contractId} related smoke docs must be markdown files: ${docPath}. canonical doc: ${primaryDocPath}`);
        continue;
      }
      if (!doesFileExist(docPath)) {
        failures.push(`${contractId} points to a missing related smoke doc: ${docPath}. canonical doc: ${primaryDocPath}`);
      }
    }
  }

  return failures;
}

export function validateSmokeSpecMetadata() {
  return validateSmokeRegistryEntries(collectSmokeRegistryEntries());
}

export function buildGeneratedSmokeRegistrySource() {
  const entries = collectSmokeRegistryEntries();
  const importLines = entries.map((entry) => {
    const relativeImportPath = toPosixPath(
      path.relative(path.join(repoRoot, 'tests', 'client'), path.join(repoRoot, entry.runnerImportPath)),
    ).replace(/\.(ts|tsx)$/, '');
    const normalizedImportPath = relativeImportPath.startsWith('.') ? relativeImportPath : `./${relativeImportPath}`;
    return `import { ${entry.runnerExportName} } from '${normalizedImportPath}';`;
  });

  const runnerLines = entries.map(
    (entry) => `  '${entry.contractId}': ${entry.runnerExportName},`,
  );
  const docLines = entries.map((entry) => {
    const relatedDocs = entry.relatedDocPaths
      .map((docPath) => `'${escapeForSingleQuotedString(docPath)}'`)
      .join(', ');
    return `  '${entry.contractId}': { primaryDocPath: '${escapeForSingleQuotedString(entry.primaryDocPath)}', relatedDocPaths: [${relatedDocs}] },`;
  });

  return [
    "import type { ClientSmokePlaywrightConfig } from '../../playwright.config';",
    "import type { FeatureContractId } from './featureContracts';",
    ...importLines,
    '',
    'export type FeatureRunner = (config: ClientSmokePlaywrightConfig) => Promise<void>;',
    '',
    'export interface SmokeDocLinks {',
    '  primaryDocPath: string;',
    '  relatedDocPaths: string[];',
    '}',
    '',
    'export const SMOKE_RUNNERS = {',
    ...runnerLines,
    '} as const satisfies Record<FeatureContractId, FeatureRunner>;',
    '',
    'export const SMOKE_DOCS = {',
    ...docLines,
    '} as const satisfies Record<FeatureContractId, SmokeDocLinks>;',
    '',
    'export const SMOKE_REGISTRY_CONTRACT_IDS = Object.keys(SMOKE_RUNNERS) as FeatureContractId[];',
    '',
  ].join('\n');
}

export function readGeneratedSmokeRegistrySource() {
  if (!fs.existsSync(generatedRegistryPath)) {
    return '';
  }

  return fs.readFileSync(generatedRegistryPath, 'utf8');
}

export function writeGeneratedSmokeRegistrySource() {
  const nextSource = buildGeneratedSmokeRegistrySource();
  fs.writeFileSync(generatedRegistryPath, nextSource, 'utf8');
  return getGeneratedSmokeRegistryPath();
}

export function checkGeneratedSmokeRegistrySource() {
  return readGeneratedSmokeRegistrySource() === buildGeneratedSmokeRegistrySource();
}
