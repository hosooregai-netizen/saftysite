import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { findContractsForFile, getAllSmokeIds, isGuardedFile } from './aidlcContractMetadata.mjs';
import {
  collectFullSmokeConfigFiles,
  isZeroOid,
  matchesAny,
  parsePrePushUpdates,
} from './aidlcHookUtils.mjs';

const DEFAULT_BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3211';

const IGNORED_FILE_PATTERNS = [
  /^\.tmp-ui\//,
  /^docs\//,
  /^skills\//,
  /^next-env\.d\.ts$/,
  /^package-lock\.json$/,
  /^package\.json$/,
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

function hasLiveApiProbeEnv() {
  return Boolean(
    process.env.LIVE_NEXT_BASE_URL &&
      process.env.LIVE_SAFETY_EMAIL &&
      process.env.LIVE_SAFETY_PASSWORD &&
      process.env.LIVE_SAFETY_SITE_ID,
  );
}

function run(command, args, options = {}) {
  return execCommand(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  }).trim();
}

function parseArgs(argv) {
  const positional = [];
  const options = {
    remoteName: '',
    remoteUrl: '',
    stdinFile: '',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--remote-name') {
      options.remoteName = argv[index + 1] ?? '';
      index += 1;
      continue;
    }

    if (value === '--remote-url') {
      options.remoteUrl = argv[index + 1] ?? '';
      index += 1;
      continue;
    }

    if (value === '--stdin-file') {
      options.stdinFile = argv[index + 1] ?? '';
      index += 1;
      continue;
    }

    positional.push(value);
  }

  return { positional, options };
}

function collectChangedFilesFromCommit(commitOid) {
  const output = run('git', ['show', '--pretty=format:', '--name-only', commitOid]);
  return output ? output.split('\n').map((line) => line.trim()).filter(Boolean) : [];
}

function collectFilesForUpdate(update, remoteName) {
  if (isZeroOid(update.localOid)) {
    return [];
  }

  if (!isZeroOid(update.remoteOid)) {
    const output = run('git', ['diff', '--name-only', `${update.remoteOid}..${update.localOid}`]);
    return output ? output.split('\n').map((line) => line.trim()).filter(Boolean) : [];
  }

  const commitArgs = ['rev-list', update.localOid];
  if (remoteName) {
    commitArgs.push('--not', `--remotes=${remoteName}`);
  } else {
    commitArgs.push('--not', '--remotes');
  }

  const commitOutput = run('git', commitArgs);
  const commits = commitOutput ? commitOutput.split('\n').map((line) => line.trim()).filter(Boolean) : [];
  if (commits.length === 0) {
    return collectChangedFilesFromCommit(update.localOid);
  }

  const files = new Set();
  for (const commitOid of commits) {
    for (const file of collectChangedFilesFromCommit(commitOid)) {
      files.add(file);
    }
  }

  return [...files];
}

function getPushedFiles() {
  const { positional, options } = parseArgs(process.argv.slice(2));
  const explicitFiles = positional.map((value) => value.trim()).filter(Boolean);
  if (explicitFiles.length > 0) {
    return explicitFiles;
  }

  if (options.stdinFile) {
    const rawInput = fs.readFileSync(options.stdinFile, 'utf8');
    const updates = parsePrePushUpdates(rawInput);
    if (updates.length > 0) {
      const files = new Set();
      for (const update of updates) {
        for (const file of collectFilesForUpdate(update, options.remoteName)) {
          files.add(file);
        }
      }
      return [...files];
    }
  }

  try {
    const output = run('git', ['diff', '--name-only', '@{upstream}...HEAD']);
    return output ? output.split('\n').map((line) => line.trim()).filter(Boolean) : [];
  } catch {
    const fallback = run('git', ['diff', '--name-only', 'HEAD~1..HEAD']);
    return fallback ? fallback.split('\n').map((line) => line.trim()).filter(Boolean) : [];
  }
}

function finalizeSmokeIds(smokeIds) {
  const finalSmokeIds = new Set(smokeIds);
  const hasErpSmoke = Array.from(smokeIds).some((id) => !id.startsWith('admin-'));
  if (hasErpSmoke) {
    finalSmokeIds.add('auth');
  }
  return [...finalSmokeIds];
}

async function ensureBaseUrlReachable(baseUrl) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4_000);

    try {
      const response = await fetch(baseUrl, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
      });

      // This guard only checks whether the local app process is listening.
      // Real route regressions should be caught by the smoke suite itself.
      if (response.status >= 100 && response.status < 600) {
        return true;
      }
    } catch {
      // Retry below.
    } finally {
      clearTimeout(timeout);
    }

    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  return false;
}

function buildRequiredSmokes(files) {
  const relevantFiles = files.filter((file) => !matchesAny(file, IGNORED_FILE_PATTERNS));
  const guardedFiles = relevantFiles.filter((file) => isGuardedFile(file));
  const fullSmokeConfigFiles = collectFullSmokeConfigFiles(relevantFiles);
  if (guardedFiles.length === 0 && fullSmokeConfigFiles.length === 0) {
    return { guardedFiles, fullSmokeConfigFiles, smokeIds: [] };
  }

  if (fullSmokeConfigFiles.length > 0) {
    return {
      guardedFiles,
      fullSmokeConfigFiles,
      smokeIds: finalizeSmokeIds(getAllSmokeIds()),
    };
  }

  const smokeIds = new Set();
  const unmappedFiles = [];

  for (const file of guardedFiles) {
    const matchedContracts = findContractsForFile(file);
    if (matchedContracts.length > 0) {
      for (const { metadata } of matchedContracts) {
        for (const id of metadata.smokeScope.ids) {
          smokeIds.add(id);
        }
      }
      continue;
    }

    unmappedFiles.push(file);
  }

  if (unmappedFiles.length > 0) {
    console.error('[aidlc-push] push blocked because some guarded source files do not have a smoke mapping:');
    for (const file of unmappedFiles) {
      console.error(`  - ${file}`);
    }
    process.exit(1);
  }

  return {
    guardedFiles,
    fullSmokeConfigFiles,
    smokeIds: finalizeSmokeIds(smokeIds),
  };
}

async function main() {
  const files = getPushedFiles();
  const { guardedFiles, fullSmokeConfigFiles, smokeIds } = buildRequiredSmokes(files);

  if (guardedFiles.length === 0 && fullSmokeConfigFiles.length === 0) {
    console.log('[aidlc-push] no guarded source files changed; skipping smoke verification.');
    return;
  }

  if (smokeIds.length === 0) {
    console.log('[aidlc-push] no smoke features were required for this push; skipping.');
    return;
  }

  if (fullSmokeConfigFiles.length > 0) {
    console.log(
      `[aidlc-push] smoke guardrail config changed; running full smoke set: ${fullSmokeConfigFiles.join(', ')}`,
    );
  }

  const reachable = await ensureBaseUrlReachable(DEFAULT_BASE_URL);
  if (!reachable) {
    console.error('[aidlc-push] push blocked because the local app is not reachable for smoke tests.');
    console.error(`  - expected app url: ${DEFAULT_BASE_URL}`);
    console.error('  - start the app first, for example: PORT=3211 npm run dev');
    process.exit(1);
  }

  console.log(`[aidlc-push] running smoke features: ${smokeIds.join(', ')}`);
  execCommand(
    'npm',
    ['run', 'test:client:smoke', '--', ...smokeIds],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        PLAYWRIGHT_BASE_URL: DEFAULT_BASE_URL,
      },
    },
  );

  console.log('[aidlc-push] smoke verification passed.');

  if (hasLiveApiProbeEnv()) {
    console.log('[aidlc-push] running live API probe budgets.');
    execCommand('npm', ['run', 'verify:api-live-budgets'], {
      stdio: 'inherit',
      env: {
        ...process.env,
      },
    });
    console.log('[aidlc-push] live API probe budgets passed.');
  }
}

await main();
