import { execFileSync } from 'node:child_process';
import {
  REQUIRED_ADAPTER_DOC_SECTIONS,
  REQUIRED_COMPOSITION_DOC_SECTIONS,
  REQUIRED_MODULE_DOC_SECTIONS,
  REQUIRED_PACK_DOC_SECTIONS,
  loadCompositions,
  loadIndustryPacks,
  loadRecoverySliceIds,
  loadReverseAdapters,
  loadReverseModules,
  loadReverseProvenance,
  listTouchedReverseModuleIds,
  readText,
  type CompositionManifest,
  type IndustryPackManifest,
  type ReverseAdapterManifest,
  type ReverseModuleManifest,
} from './erpReversePlatform';
import { findRecoverySlicesForFile, isGuardedFile } from './aidlcContractMetadata.mjs';

interface ValidationFailureBucket {
  push: (message: string) => void;
}

function assert(condition: unknown, message: string, failures: ValidationFailureBucket) {
  if (!condition) {
    failures.push(message);
  }
}

function getCommandCandidates(command: string) {
  if (process.platform !== 'win32') {
    return [command];
  }

  return [command, `${command}.cmd`, `${command}.exe`];
}

function execCommand(command: string, args: string[], options: any = {}) {
  let lastError: unknown = null;

  for (const candidate of getCommandCandidates(command)) {
    try {
      if (process.platform === 'win32' && candidate.endsWith('.cmd')) {
        return execFileSync('cmd.exe', ['/d', '/s', '/c', candidate, ...args], options);
      }

      return execFileSync(candidate, args, options);
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error.code === 'ENOENT' || error.code === 'EINVAL')
      ) {
        lastError = error;
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

function run(command: string, args: string[]) {
  return String(
    execCommand(command, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }),
  ).trim();
}

function getStagedFiles() {
  const output = run('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR']);
  return output ? output.split('\n').map((line) => line.trim()).filter(Boolean) : [];
}

function validateDocSections(relativePath: string, requiredSections: readonly string[], failures: string[]) {
  const contents = readText(relativePath);
  for (const heading of requiredSections) {
    assert(
      contents.includes(heading),
      `${relativePath} must include the section heading "${heading}".`,
      failures,
    );
  }
}

function validateModuleManifest(
  manifest: ReverseModuleManifest,
  dirName: string,
  moduleIds: Set<string>,
  knownSlices: Set<string>,
  failures: string[],
) {
  assert(manifest.id === dirName, `module "${dirName}" must match manifest id "${manifest.id}".`, failures);
  assert(manifest.id.includes('.'), `module "${manifest.id}" must use a capability namespace with dots.`, failures);
  assert(manifest.capability === manifest.id, `module "${manifest.id}" capability must equal its id.`, failures);
  assert(
    manifest.category === 'platform-primitive' || manifest.category === 'business-module',
    `module "${manifest.id}" has an invalid category.`,
    failures,
  );
  assert(manifest.sourceSlices.length > 0, `module "${manifest.id}" must declare at least one source slice.`, failures);
  assert(manifest.entities.length > 0, `module "${manifest.id}" must declare at least one entity.`, failures);
  assert(manifest.views.length > 0, `module "${manifest.id}" must declare at least one view.`, failures);
  assert(manifest.commands.length > 0, `module "${manifest.id}" must declare at least one command.`, failures);
  assert(manifest.apiContracts.length > 0, `module "${manifest.id}" must declare at least one API contract.`, failures);
  assert(manifest.serverTouchpoints.length > 0, `module "${manifest.id}" must declare server touchpoints.`, failures);
  assert(
    manifest.performanceGuardrails.length > 0,
    `module "${manifest.id}" must declare at least one performance guardrail.`,
    failures,
  );
  assert(
    ['core', 'adaptable', 'industry-bound'].includes(manifest.portabilityTier),
    `module "${manifest.id}" has an invalid portability tier.`,
    failures,
  );
  assert(
    ['draft', 'validated', 'published'].includes(manifest.status),
    `module "${manifest.id}" has an invalid status.`,
    failures,
  );

  for (const sliceId of manifest.sourceSlices) {
    assert(knownSlices.has(sliceId), `module "${manifest.id}" points to unknown source slice "${sliceId}".`, failures);
  }

  for (const dependencyId of manifest.platformDependencies) {
    assert(moduleIds.has(dependencyId), `module "${manifest.id}" depends on missing module "${dependencyId}".`, failures);
  }

  for (const apiContract of manifest.apiContracts) {
    assert(Boolean(apiContract.name), `module "${manifest.id}" has an API contract without a name.`, failures);
    assert(
      ['next-route', 'proxy-route', 'server-service'].includes(apiContract.owner),
      `module "${manifest.id}" API contract "${apiContract.name}" has an invalid owner.`,
      failures,
    );
    assert(
      ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(apiContract.method),
      `module "${manifest.id}" API contract "${apiContract.name}" has an invalid method.`,
      failures,
    );
    assert(Boolean(apiContract.path), `module "${manifest.id}" API contract "${apiContract.name}" must declare a path.`, failures);
    assert(
      apiContract.requestShape.length > 0,
      `module "${manifest.id}" API contract "${apiContract.name}" must declare request shape notes.`,
      failures,
    );
    assert(
      apiContract.responseShape.length > 0,
      `module "${manifest.id}" API contract "${apiContract.name}" must declare response shape notes.`,
      failures,
    );
    assert(
      apiContract.touchpoints.length > 0,
      `module "${manifest.id}" API contract "${apiContract.name}" must declare touchpoints.`,
      failures,
    );
  }

  for (const guardrail of manifest.performanceGuardrails) {
    assert(Boolean(guardrail.name), `module "${manifest.id}" has a performance guardrail without a name.`, failures);
    assert(
      Boolean(guardrail.appliesTo),
      `module "${manifest.id}" performance guardrail "${guardrail.name}" must declare an appliesTo value.`,
      failures,
    );
    assert(
      Number.isFinite(guardrail.maxLatencyMs) && guardrail.maxLatencyMs > 0,
      `module "${manifest.id}" performance guardrail "${guardrail.name}" must declare a positive maxLatencyMs.`,
      failures,
    );
    assert(
      Boolean(guardrail.cacheStrategy),
      `module "${manifest.id}" performance guardrail "${guardrail.name}" must declare a cache strategy.`,
      failures,
    );
    assert(
      guardrail.invalidationTriggers.length > 0,
      `module "${manifest.id}" performance guardrail "${guardrail.name}" must declare invalidation triggers.`,
      failures,
    );
    if (guardrail.maxResponseBytes != null) {
      assert(
        Number.isFinite(guardrail.maxResponseBytes) && guardrail.maxResponseBytes > 0,
        `module "${manifest.id}" performance guardrail "${guardrail.name}" must declare a positive maxResponseBytes when present.`,
        failures,
      );
    }
  }
}

function validateAdapterManifest(
  manifest: ReverseAdapterManifest,
  dirName: string,
  failures: string[],
) {
  assert(manifest.id === dirName, `adapter "${dirName}" must match manifest id "${manifest.id}".`, failures);
  assert(manifest.inputContracts.length > 0, `adapter "${manifest.id}" must declare input contracts.`, failures);
  assert(manifest.outputEntities.length > 0, `adapter "${manifest.id}" must declare output entities.`, failures);
  assert(
    ['draft', 'validated', 'published'].includes(manifest.status),
    `adapter "${manifest.id}" has an invalid status.`,
    failures,
  );
}

function validateIndustryPackManifest(
  manifest: IndustryPackManifest,
  dirName: string,
  moduleManifests: Map<string, ReverseModuleManifest>,
  adapterIds: Set<string>,
  failures: string[],
) {
  assert(manifest.id === dirName, `industry pack "${dirName}" must match manifest id "${manifest.id}".`, failures);
  assert(manifest.baseModules.length > 0, `industry pack "${manifest.id}" must declare base modules.`, failures);

  const overrideablePolicies = new Set<string>();
  for (const moduleId of manifest.baseModules) {
    const module = moduleManifests.get(moduleId);
    assert(Boolean(module), `industry pack "${manifest.id}" references missing module "${moduleId}".`, failures);
    if (!module) {
      continue;
    }
    for (const policy of module.industryOverridesAllowed) {
      overrideablePolicies.add(policy);
    }
  }

  for (const adapterId of manifest.requiredAdapters) {
    assert(adapterIds.has(adapterId), `industry pack "${manifest.id}" references missing adapter "${adapterId}".`, failures);
  }

  for (const policy of manifest.policyOverrides) {
    assert(
      overrideablePolicies.has(policy),
      `industry pack "${manifest.id}" overrides disallowed policy "${policy}".`,
      failures,
    );
  }
}

function validateCompositionManifest(
  manifest: CompositionManifest,
  dirName: string,
  packs: Map<string, IndustryPackManifest>,
  moduleManifests: Map<string, ReverseModuleManifest>,
  adapterIds: Set<string>,
  failures: string[],
) {
  assert(manifest.id === dirName, `composition "${dirName}" must match manifest id "${manifest.id}".`, failures);
  assert(packs.has(manifest.industryPack), `composition "${manifest.id}" references missing industry pack "${manifest.industryPack}".`, failures);
  assert(manifest.enabledModules.length > 0, `composition "${manifest.id}" must enable at least one module.`, failures);
  assert(manifest.navigationLayout.length > 0, `composition "${manifest.id}" must declare navigation layout entries.`, failures);

  const tenantSurface = new Set<string>();
  for (const moduleId of manifest.enabledModules) {
    const module = moduleManifests.get(moduleId);
    assert(Boolean(module), `composition "${manifest.id}" references missing module "${moduleId}".`, failures);
    if (!module) {
      continue;
    }
    for (const key of module.tenantConfigSurface) {
      tenantSurface.add(key);
    }
  }

  for (const binding of manifest.adapterBindings) {
    assert(adapterIds.has(binding), `composition "${manifest.id}" references missing adapter binding "${binding}".`, failures);
  }

  for (const binding of manifest.tenantBindings) {
    assert(
      tenantSurface.has(binding),
      `composition "${manifest.id}" binds tenant key "${binding}" outside the enabled module surfaces.`,
      failures,
    );
  }

  const pack = packs.get(manifest.industryPack);
  if (pack) {
    for (const adapterId of pack.requiredAdapters) {
      assert(
        manifest.adapterBindings.includes(adapterId),
        `composition "${manifest.id}" must bind required adapter "${adapterId}" from industry pack "${pack.id}".`,
        failures,
      );
    }
  }
}

function validateStaticPlatform() {
  const failures: string[] = [];
  const modules = loadReverseModules();
  const adapters = loadReverseAdapters();
  const packs = loadIndustryPacks();
  const compositions = loadCompositions();
  const provenance = loadReverseProvenance();
  const knownSlices = loadRecoverySliceIds();

  const moduleIds = new Set<string>();
  const moduleManifests = new Map<string, ReverseModuleManifest>();
  for (const module of modules) {
    assert(!moduleIds.has(module.manifest.id), `module id "${module.manifest.id}" is duplicated.`, failures);
    moduleIds.add(module.manifest.id);
    moduleManifests.set(module.manifest.id, module.manifest);
  }

  for (const module of modules) {
    validateModuleManifest(module.manifest, module.dirName, moduleIds, knownSlices, failures);
    validateDocSections(module.docPath, REQUIRED_MODULE_DOC_SECTIONS, failures);
  }

  const adapterIds = new Set<string>();
  for (const adapter of adapters) {
    assert(!adapterIds.has(adapter.manifest.id), `adapter id "${adapter.manifest.id}" is duplicated.`, failures);
    adapterIds.add(adapter.manifest.id);
    validateAdapterManifest(adapter.manifest, adapter.dirName, failures);
    validateDocSections(adapter.docPath, REQUIRED_ADAPTER_DOC_SECTIONS, failures);
  }

  const packsById = new Map<string, IndustryPackManifest>();
  for (const pack of packs) {
    packsById.set(pack.manifest.id, pack.manifest);
    validateIndustryPackManifest(pack.manifest, pack.dirName, moduleManifests, adapterIds, failures);
    validateDocSections(pack.docPath, REQUIRED_PACK_DOC_SECTIONS, failures);
  }

  for (const composition of compositions) {
    validateCompositionManifest(
      composition.manifest,
      composition.dirName,
      packsById,
      moduleManifests,
      adapterIds,
      failures,
    );
    validateDocSections(composition.docPath, REQUIRED_COMPOSITION_DOC_SECTIONS, failures);
  }

  const sliceToModules = new Map<string, Set<string>>();
  for (const entry of provenance.manifest.entries) {
    assert(knownSlices.has(entry.recoverySliceId), `provenance maps unknown recovery slice "${entry.recoverySliceId}".`, failures);
    assert(entry.reverseModuleIds.length > 0, `provenance entry "${entry.recoverySliceId}" must map at least one module.`, failures);
    assert(['low', 'medium', 'high'].includes(entry.confidence), `provenance entry "${entry.recoverySliceId}" has an invalid confidence.`, failures);
    assert(!Number.isNaN(Date.parse(entry.lastVerifiedAt)), `provenance entry "${entry.recoverySliceId}" must use an ISO-like verification date.`, failures);

    const moduleSet = sliceToModules.get(entry.recoverySliceId) ?? new Set<string>();
    for (const moduleId of entry.reverseModuleIds) {
      assert(moduleIds.has(moduleId), `provenance entry "${entry.recoverySliceId}" references missing module "${moduleId}".`, failures);
      moduleSet.add(moduleId);
    }
    sliceToModules.set(entry.recoverySliceId, moduleSet);
  }

  for (const module of modules) {
    for (const sliceId of module.manifest.sourceSlices) {
      const mappedModules = sliceToModules.get(sliceId);
      assert(
        Boolean(mappedModules && mappedModules.has(module.manifest.id)),
        `module "${module.manifest.id}" must be mirrored in provenance for source slice "${sliceId}".`,
        failures,
      );
    }

    if (module.manifest.status === 'published') {
      assert(
        readText(module.docPath).includes(`Module ID: \`${module.manifest.id}\``),
        `${module.docPath} must declare Module ID \`${module.manifest.id}\`.`,
        failures,
      );
    }
  }

  return failures;
}

function validateChangedFiles(files: string[]) {
  const failures: string[] = [];
  const provenance = loadReverseProvenance();
  const sliceToModules = new Map<string, string[]>();
  for (const entry of provenance.manifest.entries) {
    sliceToModules.set(entry.recoverySliceId, entry.reverseModuleIds);
  }

  const touchedModuleIds = listTouchedReverseModuleIds(files);
  const touchedProvenance = files.includes(provenance.manifestPath);
  const reviewNeededModules = new Set<string>();

  for (const file of files) {
    if (!isGuardedFile(file)) {
      continue;
    }

    for (const match of findRecoverySlicesForFile(file)) {
      const reverseModuleIds = sliceToModules.get(match.slice.id) ?? [];
      for (const moduleId of reverseModuleIds) {
        reviewNeededModules.add(moduleId);
      }
    }
  }

  if (reviewNeededModules.size === 0) {
    return failures;
  }

  const untouched = [...reviewNeededModules].filter((moduleId) => !touchedModuleIds.has(moduleId));
  if (untouched.length > 0 && !touchedProvenance) {
    failures.push(
      `source slices changed but the ERP reverse platform was not refreshed. Review-needed modules: ${untouched.join(', ')}. Update their module docs/manifests or the provenance map.`,
    );
  }

  return failures;
}

function main() {
  const candidateFiles = process.argv.slice(2);
  const files = candidateFiles.length > 0 ? candidateFiles : getStagedFiles();
  const failures = [
    ...validateStaticPlatform(),
    ...validateChangedFiles(files),
  ];

  if (failures.length === 0) {
    console.log('[erp-reverse-platform] passed.');
    return;
  }

  console.error('[erp-reverse-platform] validation failed:');
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}

main();
