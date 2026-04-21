const ZERO_OID_PATTERN = /^0+$/;

const ADMIN_SCOPE = 'admin';
const ERP_SCOPE = 'erp';
const BOTH_SCOPES = [ADMIN_SCOPE, ERP_SCOPE];

const VERIFY_CONFIG_PATTERNS = [
  /^tests\/client\/contracts\/adminContracts\.ts$/,
  /^tests\/client\/contracts\/erpContracts\.ts$/,
  /^tests\/client\/contracts\/featureContractMetadata\.json$/,
  /^tests\/client\/contracts\/metadata\.ts$/,
  /^tests\/client\/contracts\/shared\.ts$/,
  /^tests\/client\/featureContracts\.ts$/,
  /^tests\/client\/fixtures\/adminSmokeHarness\.ts$/,
  /^tests\/client\/fixtures\/erpSmokeHarness\.ts$/,
  /^tests\/client\/runSmoke\.ts$/,
  /^scripts\/aidlcAudit\.mjs$/,
  /^scripts\/aidlcContractMetadata\.mjs$/,
  /^scripts\/installGitHooks\.mjs$/,
  /^scripts\/smokeClient\.ts$/,
  /^scripts\/smokeRealAdmin\.ts$/,
  /^scripts\/validateRecoverySlices\.mjs$/,
  /^scripts\/verifyAidlc\.mjs$/,
  /^scripts\/verifyAidlcPush\.mjs$/,
  /^tooling\/internal\/smokeClient_impl\.ts$/,
  /^\.githooks\/pre-commit$/,
  /^\.githooks\/pre-push$/,
];

const FULL_SMOKE_SCOPE_RULES = [
  { pattern: /^tests\/client\/contracts\/adminContracts\.ts$/, scopes: [ADMIN_SCOPE] },
  { pattern: /^tests\/client\/contracts\/erpContracts\.ts$/, scopes: [ERP_SCOPE] },
  { pattern: /^tests\/client\/contracts\/featureContractMetadata\.json$/, scopes: BOTH_SCOPES },
  { pattern: /^tests\/client\/contracts\/metadata\.ts$/, scopes: BOTH_SCOPES },
  { pattern: /^tests\/client\/contracts\/shared\.ts$/, scopes: BOTH_SCOPES },
  { pattern: /^tests\/client\/featureContracts\.ts$/, scopes: BOTH_SCOPES },
  { pattern: /^tests\/client\/fixtures\/adminSmokeHarness\.ts$/, scopes: [ADMIN_SCOPE] },
  { pattern: /^tests\/client\/fixtures\/erpSmokeHarness\.ts$/, scopes: [ERP_SCOPE] },
  { pattern: /^tests\/client\/runSmoke\.ts$/, scopes: BOTH_SCOPES },
  { pattern: /^scripts\/smokeClient\.ts$/, scopes: [ERP_SCOPE] },
  { pattern: /^scripts\/smokeRealAdmin\.ts$/, scopes: [ADMIN_SCOPE] },
  { pattern: /^tooling\/internal\/smokeClient_impl\.ts$/, scopes: BOTH_SCOPES },
];

export function matchesAny(file, patterns) {
  return patterns.some((pattern) => pattern.test(file));
}

export function collectVerificationConfigFiles(files) {
  return files.filter((file) => matchesAny(file, VERIFY_CONFIG_PATTERNS));
}

export function collectFullSmokeConfigFiles(files) {
  return files.filter((file) =>
    FULL_SMOKE_SCOPE_RULES.some(({ pattern }) => pattern.test(file)),
  );
}

export function collectFullSmokeScopes(files) {
  const scopes = new Set();

  for (const file of files) {
    for (const rule of FULL_SMOKE_SCOPE_RULES) {
      if (!rule.pattern.test(file)) {
        continue;
      }

      for (const scope of rule.scopes) {
        scopes.add(scope);
      }
    }
  }

  return [...scopes].sort();
}

export function isZeroOid(value) {
  return ZERO_OID_PATTERN.test(value);
}

export function parsePrePushUpdates(rawText) {
  return rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [localRef, localOid, remoteRef, remoteOid] = line.split(/\s+/);
      return {
        localRef,
        localOid,
        remoteRef,
        remoteOid,
      };
    })
    .filter((update) => update.localRef && update.localOid && update.remoteRef && update.remoteOid);
}
