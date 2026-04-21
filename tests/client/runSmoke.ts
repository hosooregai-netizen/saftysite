import { performance } from 'node:perf_hooks';
import { resolveClientSmokePlaywrightConfig } from '../../playwright.config';
import {
  FEATURE_CONTRACT_IDS,
  getFeatureContract,
  isFeatureContractId,
  type FeatureContractId,
} from './featureContracts';
import { SMOKE_RUNNERS } from './smokeRegistry.generated';

function parseRequestedFeatures(argv: string[]) {
  if (argv.length === 0) return FEATURE_CONTRACT_IDS;

  const unique = new Set<FeatureContractId>();
  for (const raw of argv) {
    const normalized = raw.trim();
    if (!normalized) continue;
    if (!isFeatureContractId(normalized)) {
      throw new Error(
        `Unknown client smoke feature: ${normalized}. Available: ${FEATURE_CONTRACT_IDS.join(', ')}`,
      );
    }
    unique.add(normalized);
  }

  return [...unique];
}

export async function main(argv: string[] = process.argv.slice(2)) {
  const config = resolveClientSmokePlaywrightConfig();
  const requestedFeatures = parseRequestedFeatures(argv);

  console.log(`[client-smoke] Base URL: ${config.baseURL}`);
  console.log(`[client-smoke] Headless: ${config.headless ? 'true' : 'false'}`);
  console.log(`[client-smoke] Features: ${requestedFeatures.join(', ')}`);

  for (const featureId of requestedFeatures) {
    const contract = getFeatureContract(featureId);
    const startedAt = performance.now();
    console.log(`[client-smoke] START ${featureId}: ${contract.description}`);
    await SMOKE_RUNNERS[featureId](config);
    const elapsedMs = Math.round(performance.now() - startedAt);
    console.log(`[client-smoke] PASS ${featureId} (${elapsedMs}ms)`);
  }
}

void main();
