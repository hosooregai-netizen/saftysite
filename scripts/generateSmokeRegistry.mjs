import {
  checkGeneratedSmokeRegistrySource,
  getGeneratedSmokeRegistryPath,
  validateSmokeSpecMetadata,
  writeGeneratedSmokeRegistrySource,
} from './smokeRegistrySupport.mjs';

const isCheckMode = process.argv.includes('--check');
const failures = validateSmokeSpecMetadata();

if (failures.length > 0) {
  console.error('[smoke-registry] validation failed before generation:');
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}

if (isCheckMode) {
  if (!checkGeneratedSmokeRegistrySource()) {
    console.error('[smoke-registry] generated registry is stale.');
    console.error(`  - expected file: ${getGeneratedSmokeRegistryPath()}`);
    console.error('  - run: npm run generate:smoke-registry');
    process.exit(1);
  }

  console.log(`[smoke-registry] up to date: ${getGeneratedSmokeRegistryPath()}`);
  process.exit(0);
}

process.stdout.write(`${writeGeneratedSmokeRegistrySource()}\n`);
