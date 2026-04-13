import { performance } from 'node:perf_hooks';
import { resolveClientSmokePlaywrightConfig } from '../../playwright.config';
import {
  FEATURE_CONTRACT_IDS,
  getFeatureContract,
  isFeatureContractId,
  type FeatureContractId,
} from './featureContracts';
import { runAuthSmoke } from './erp/auth.spec';
import { runMobileSiteReportsSmoke } from './erp/mobile-site-reports.spec';
import { runMobileQuarterlyListSmoke } from './erp/mobile-quarterly-list.spec';
import { runMobileQuarterlyReportSmoke } from './erp/mobile-quarterly-report.spec';
import { runMobileLinkSmoke } from './erp/mobile-link.spec';
import { runQuarterlyReportSmoke } from './erp/quarterly-report.spec';
import { runSiteHubSmoke } from './erp/site-hub.spec';

type FeatureRunner = (config: ReturnType<typeof resolveClientSmokePlaywrightConfig>) => Promise<void>;

const FEATURE_RUNNERS: Record<FeatureContractId, FeatureRunner> = {
  auth: runAuthSmoke,
  'mobile-site-reports': runMobileSiteReportsSmoke,
  'mobile-quarterly-list': runMobileQuarterlyListSmoke,
  'mobile-quarterly-report': runMobileQuarterlyReportSmoke,
  'mobile-link': runMobileLinkSmoke,
  'quarterly-report': runQuarterlyReportSmoke,
  'site-hub': runSiteHubSmoke,
};

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
    await FEATURE_RUNNERS[featureId](config);
    const elapsedMs = Math.round(performance.now() - startedAt);
    console.log(`[client-smoke] PASS ${featureId} (${elapsedMs}ms)`);
  }
}

void main();
