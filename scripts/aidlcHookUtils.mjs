const ZERO_OID_PATTERN = /^0+$/;

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

const FULL_SMOKE_PATTERNS = [
  /^tests\/client\/contracts\/adminContracts\.ts$/,
  /^tests\/client\/contracts\/erpContracts\.ts$/,
  /^tests\/client\/contracts\/featureContractMetadata\.json$/,
  /^tests\/client\/contracts\/metadata\.ts$/,
  /^tests\/client\/contracts\/shared\.ts$/,
  /^tests\/client\/featureContracts\.ts$/,
  /^tests\/client\/fixtures\/adminSmokeHarness\.ts$/,
  /^tests\/client\/fixtures\/erpSmokeHarness\.ts$/,
  /^tests\/client\/runSmoke\.ts$/,
  /^scripts\/smokeClient\.ts$/,
  /^scripts\/smokeRealAdmin\.ts$/,
  /^tooling\/internal\/smokeClient_impl\.ts$/,
];

export function matchesAny(file, patterns) {
  return patterns.some((pattern) => pattern.test(file));
}

export function collectVerificationConfigFiles(files) {
  return files.filter((file) => matchesAny(file, VERIFY_CONFIG_PATTERNS));
}

export function collectFullSmokeConfigFiles(files) {
  return files.filter((file) => matchesAny(file, FULL_SMOKE_PATTERNS));
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
