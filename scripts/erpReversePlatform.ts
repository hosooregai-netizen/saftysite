import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type ReverseModuleCategory = 'platform-primitive' | 'business-module';
export type ReverseModulePortabilityTier = 'core' | 'adaptable' | 'industry-bound';
export type ReverseModuleStatus = 'draft' | 'validated' | 'published';
export type ReverseAdapterStatus = 'draft' | 'validated' | 'published';
export type ReverseConfidence = 'low' | 'medium' | 'high';
export type ReverseHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type ReverseApiOwner = 'next-route' | 'proxy-route' | 'server-service';

export interface ReverseApiContract {
  name: string;
  owner: ReverseApiOwner;
  method: ReverseHttpMethod;
  path: string;
  requestShape: string[];
  responseShape: string[];
  touchpoints: string[];
}

export interface ReversePerformanceGuardrail {
  name: string;
  appliesTo: string;
  maxLatencyMs: number;
  maxResponseBytes?: number;
  cacheStrategy: string;
  invalidationTriggers: string[];
}

export interface ReverseModuleManifest {
  id: string;
  version: string;
  capability: string;
  category: ReverseModuleCategory;
  sourceSlices: string[];
  platformDependencies: string[];
  entities: string[];
  commands: string[];
  events: string[];
  views: string[];
  policies: string[];
  extensionPoints: string[];
  industryOverridesAllowed: string[];
  tenantConfigSurface: string[];
  outputArtifacts: string[];
  apiContracts: ReverseApiContract[];
  serverTouchpoints: string[];
  performanceGuardrails: ReversePerformanceGuardrail[];
  portabilityTier: ReverseModulePortabilityTier;
  status: ReverseModuleStatus;
}

export interface ReverseAdapterManifest {
  id: string;
  version: string;
  target: string;
  inputContracts: string[];
  outputEntities: string[];
  extensionSurface: string[];
  status: ReverseAdapterStatus;
}

export interface IndustryPackManifest {
  id: string;
  version: string;
  baseModules: string[];
  policyOverrides: string[];
  requiredAdapters: string[];
  vocabularyOverrides: string[];
  complianceRules: string[];
  defaultTenantConfig: string[];
}

export interface CompositionManifest {
  id: string;
  version: string;
  industryPack: string;
  enabledModules: string[];
  adapterBindings: string[];
  tenantBindings: string[];
  documentTemplates: string[];
  navigationLayout: string[];
}

export interface ReverseProvenanceMapEntry {
  recoverySliceId: string;
  reverseModuleIds: string[];
  confidence: ReverseConfidence;
  lastVerifiedAt: string;
}

export interface ReverseProvenanceManifest {
  version: string;
  entries: ReverseProvenanceMapEntry[];
}

export interface ReverseSpecFile<TManifest> {
  dirName: string;
  docPath: string;
  manifest: TManifest;
  manifestPath: string;
}

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, '..');

export const REVERSE_PLATFORM_ROOT = path.join(repoRoot, 'docs', 'erp-reverse-platform');

const FEATURE_CONTRACT_METADATA_PATH = path.join(
  repoRoot,
  'tests',
  'client',
  'contracts',
  'featureContractMetadata.json',
);

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function normalizeRelative(filePath: string) {
  return path.relative(repoRoot, filePath).replace(/\\/g, '/');
}

function listSpecFiles<TManifest>(
  relativeDir: string,
  manifestName: string,
  docName: string,
): ReverseSpecFile<TManifest>[] {
  const absoluteDir = path.join(REVERSE_PLATFORM_ROOT, relativeDir);
  if (!fs.existsSync(absoluteDir)) {
    return [];
  }

  return fs.readdirSync(absoluteDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const manifestPath = path.join(absoluteDir, entry.name, manifestName);
      const docPath = path.join(absoluteDir, entry.name, docName);
      return {
        dirName: entry.name,
        docPath: normalizeRelative(docPath),
        manifest: readJson<TManifest>(manifestPath),
        manifestPath: normalizeRelative(manifestPath),
      };
    });
}

export function loadReverseModules() {
  return listSpecFiles<ReverseModuleManifest>('modules', 'module.manifest.json', 'module.md');
}

export function loadReverseAdapters() {
  return listSpecFiles<ReverseAdapterManifest>('adapters', 'adapter.manifest.json', 'adapter.md');
}

export function loadIndustryPacks() {
  return listSpecFiles<IndustryPackManifest>('industry-packs', 'pack.manifest.json', 'pack.md');
}

export function loadCompositions() {
  return listSpecFiles<CompositionManifest>('compositions', 'composition.manifest.json', 'composition.md');
}

export function loadReverseProvenance() {
  const provenancePath = path.join(REVERSE_PLATFORM_ROOT, 'provenance', 'recovery-slice-map.json');
  return {
    manifestPath: normalizeRelative(provenancePath),
    manifest: readJson<ReverseProvenanceManifest>(provenancePath),
  };
}

export function loadRecoverySliceIds() {
  const metadata = readJson<{
    contracts: Record<string, { recoverySlices: { id: string }[] }>;
  }>(FEATURE_CONTRACT_METADATA_PATH);

  const sliceIds = new Set<string>();
  for (const contract of Object.values(metadata.contracts)) {
    for (const slice of contract.recoverySlices) {
      sliceIds.add(slice.id);
    }
  }

  return sliceIds;
}

export const REQUIRED_MODULE_DOC_SECTIONS = [
  '## Purpose',
  '## User Roles',
  '## Entry Conditions',
  '## State Model',
  '## User Journeys',
  '## API Contracts',
  '## Server Touchpoints',
  '## Performance Guardrails',
  '## Invariants',
  '## Failure Modes',
  '## Industry Variability',
  '## Composition Examples',
  '## Non-portable Areas',
] as const;

export const REQUIRED_ADAPTER_DOC_SECTIONS = [
  '## Purpose',
  '## Input Contracts',
  '## Output Entities',
  '## Mapping Rules',
  '## Failure Modes',
] as const;

export const REQUIRED_PACK_DOC_SECTIONS = [
  '## Purpose',
  '## Base Modules',
  '## Policy Overrides',
  '## Vocabulary Overrides',
  '## Compliance Rules',
  '## Default Tenant Config',
] as const;

export const REQUIRED_COMPOSITION_DOC_SECTIONS = [
  '## Purpose',
  '## Industry Pack',
  '## Enabled Modules',
  '## Adapter Bindings',
  '## Tenant Bindings',
  '## Navigation Layout',
] as const;

export function readText(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

export function listTouchedReverseModuleIds(files: string[]) {
  const ids = new Set<string>();
  for (const file of files) {
    const normalized = file.replace(/\\/g, '/');
    const match = normalized.match(/^docs\/erp-reverse-platform\/modules\/([^/]+)\//);
    if (match) {
      ids.add(match[1]);
    }
  }
  return ids;
}
