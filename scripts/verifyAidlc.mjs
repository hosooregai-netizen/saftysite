import { execFileSync } from 'node:child_process';

const ADMIN_SOURCE_PATTERNS = [
  /^app\/api\/admin\//,
  /^app\/api\/safety\//,
  /^app\/admin\//,
  /^features\/admin\//,
  /^lib\/admin\/apiClient\.ts$/,
  /^server\/admin\//,
];

const ERP_SOURCE_PATTERNS = [
  /^app\/sites\//,
  /^components\/worker\//,
  /^features\/home\//,
  /^features\/inspection-session\//,
  /^features\/mailbox\//,
  /^features\/mobile\//,
  /^features\/site-reports\//,
];

const ADMIN_DOC_PATTERNS = [/^docs\/admin-aidlc\//];
const ADMIN_PROOF_PATTERNS = [
  /^tests\/client\/admin\//,
  /^tests\/client\/contracts\/adminContracts\.ts$/,
  /^tests\/client\/contracts\/shared\.ts$/,
  /^tests\/client\/featureContracts\.ts$/,
  /^tests\/client\/fixtures\/adminSmokeHarness\.ts$/,
  /^scripts\/smoke-real-client\/admin-sections\//,
  /^scripts\/smokeRealAdmin\.ts$/,
];

const ERP_PROOF_PATTERNS = [
  /^tests\/client\/erp\//,
  /^tests\/client\/contracts\/erpContracts\.ts$/,
  /^tests\/client\/contracts\/shared\.ts$/,
  /^tests\/client\/featureContracts\.ts$/,
  /^tests\/client\/fixtures\/erpSmokeHarness\.ts$/,
  /^scripts\/smokeClient\.ts$/,
  /^tests\/client\/runSmoke\.ts$/,
  /^tooling\/internal\/smokeClient_impl\.ts$/,
];

const IGNORED_FILE_PATTERNS = [
  /^\.tmp-ui\//,
  /^next-env\.d\.ts$/,
];

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

function matchesAny(file, patterns) {
  return patterns.some((pattern) => pattern.test(file));
}

function collectMatching(files, patterns) {
  return files.filter((file) => matchesAny(file, patterns));
}

function printFailure(title, details) {
  console.error(`[aidlc-verify] ${title}`);
  for (const detail of details) {
    console.error(`  - ${detail}`);
  }
}

function verifyScope({
  files,
  scopeName,
  sourcePatterns,
  proofPatterns,
  docPatterns = [],
}) {
  const sourceFiles = collectMatching(files, sourcePatterns);
  if (sourceFiles.length === 0) return { active: false, sourceFiles };

  const proofFiles = collectMatching(files, proofPatterns);
  const docFiles = collectMatching(files, docPatterns);
  const failures = [];

  if (docPatterns.length > 0 && docFiles.length === 0) {
    failures.push(`${scopeName} source changed but no batch record/doc file was staged.`);
  }

  if (proofFiles.length === 0) {
    failures.push(`${scopeName} source changed but no contract/smoke proof file was staged.`);
  }

  if (failures.length > 0) {
    printFailure(`${scopeName} scope is missing required AIDLC companions.`, [
      `source files: ${sourceFiles.join(', ')}`,
      ...(docPatterns.length > 0 ? [`doc files: ${docFiles.join(', ') || '(none)'}`] : []),
      `proof files: ${proofFiles.join(', ') || '(none)'}`,
      ...failures,
    ]);
    process.exit(1);
  }

  return { active: true, sourceFiles };
}

function runValidation(command, args, label) {
  console.log(`[aidlc-verify] running ${label}...`);
  execCommand(command, args, { stdio: 'inherit' });
}

function main() {
  const candidateFiles = process.argv.slice(2);
  const rawFiles = candidateFiles.length > 0 ? candidateFiles : getStagedFiles();
  const files = rawFiles.filter((file) => !matchesAny(file, IGNORED_FILE_PATTERNS));

  if (files.length === 0) {
    console.log('[aidlc-verify] no relevant staged files found; skipping.');
    return;
  }

  const admin = verifyScope({
    files,
    scopeName: 'admin',
    sourcePatterns: ADMIN_SOURCE_PATTERNS,
    proofPatterns: ADMIN_PROOF_PATTERNS,
    docPatterns: ADMIN_DOC_PATTERNS,
  });
  const erp = verifyScope({
    files,
    scopeName: 'erp',
    sourcePatterns: ERP_SOURCE_PATTERNS,
    proofPatterns: ERP_PROOF_PATTERNS,
  });

  if (!admin.active && !erp.active) {
    console.log('[aidlc-verify] no guarded AIDLC source files changed; skipping.');
    return;
  }

  runValidation('npx', ['tsc', '--noEmit', '--pretty', 'false'], 'TypeScript check');

  if (admin.active) {
    runValidation('npm', ['run', 'aidlc:audit:admin'], 'admin audit');
  }

  if (erp.active) {
    runValidation('npm', ['run', 'aidlc:audit'], 'erp audit');
  }

  console.log('[aidlc-verify] passed.');
}

main();
