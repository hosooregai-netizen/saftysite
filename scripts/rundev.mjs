import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';

const DEFAULT_PORT = 3100;
const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_UPSTREAM_BASE_URL = 'http://35.76.230.177:8011/api/v1';
const DEFAULT_ASSET_BASE_URL = 'http://35.76.230.177:8011';
const MAX_PORT_SCAN = 10;

const projectRoot = process.cwd();
const lockPath = path.join(projectRoot, '.next', 'dev', 'lock');

function isBusyLock(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r+');
    fs.closeSync(fd);
    return false;
  } catch (error) {
    return Boolean(
      error &&
        typeof error === 'object' &&
        'code' in error &&
        (error.code === 'EBUSY' || error.code === 'EPERM'),
    );
  }
}

function safeExec(command, args) {
  try {
    return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
}

function getListeningPids(port) {
  return safeExec('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-Fp'])
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('p'))
    .map((line) => Number(line.slice(1)))
    .filter((value) => Number.isInteger(value) && value > 0);
}

function getProcessCwd(pid) {
  const output = safeExec('lsof', ['-a', '-p', String(pid), '-d', 'cwd', '-Fn']);
  const cwdLine = output
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.startsWith('n'));
  return cwdLine ? cwdLine.slice(1) : '';
}

function getPortOwner(port) {
  const [pid] = getListeningPids(port);
  if (!pid) return null;
  return {
    cwd: getProcessCwd(pid),
    pid,
  };
}

function isSameProject(cwd) {
  return Boolean(cwd) && path.resolve(cwd) === projectRoot;
}

function parseRequestedPort() {
  const rawPort = process.env.PORT?.trim();
  if (!rawPort) return DEFAULT_PORT;
  const parsed = Number.parseInt(rawPort, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_PORT;
}

function resolvePort() {
  const requestedPort = parseRequestedPort();
  const owner3000 = getPortOwner(3000);

  if (owner3000 && !isSameProject(owner3000.cwd)) {
    console.log(
      `[dev] Port 3000 is already used by another project: ${owner3000.cwd} (pid ${owner3000.pid}).`,
    );
    console.log('[dev] safetysite will run on port 3100 or the next available port.');
  }

  for (let index = 0; index <= MAX_PORT_SCAN; index += 1) {
    const candidatePort = requestedPort + index;
    const owner = getPortOwner(candidatePort);
    if (!owner) return candidatePort;
    if (isSameProject(owner.cwd)) {
      console.log(`[dev] safetysite is already running on port ${candidatePort} (pid ${owner.pid}).`);
      console.log(`[dev] Use http://${DEFAULT_HOST}:${candidatePort} and confirm K2B API there.`);
      process.exit(0);
    }
    console.log(
      `[dev] Port ${candidatePort} is already in use by ${owner.cwd || 'another process'} (pid ${owner.pid}).`,
    );
  }

  throw new Error(`No available dev port found between ${requestedPort} and ${requestedPort + MAX_PORT_SCAN}.`);
}

function prepareLockFile() {
  if (!fs.existsSync(lockPath)) return;
  if (isBusyLock(lockPath)) {
    console.log('[dev] Another safetysite next dev instance still owns .next/dev/lock.');
    console.log('[dev] Stop that instance first, or reuse the existing port shown above.');
    process.exit(0);
  }
  fs.rmSync(lockPath, { force: true });
}

function buildChildEnv(port) {
  return {
    ...process.env,
    HOSTNAME: process.env.HOSTNAME || DEFAULT_HOST,
    NEXT_PUBLIC_INSPECTION_PDF_UPSTREAM_BASE_URL:
      process.env.NEXT_PUBLIC_INSPECTION_PDF_UPSTREAM_BASE_URL || DEFAULT_UPSTREAM_BASE_URL,
    NEXT_PUBLIC_SAFETY_API_UPSTREAM_BASE_URL:
      process.env.NEXT_PUBLIC_SAFETY_API_UPSTREAM_BASE_URL || DEFAULT_UPSTREAM_BASE_URL,
    NEXT_PUBLIC_SAFETY_ASSET_BASE_URL:
      process.env.NEXT_PUBLIC_SAFETY_ASSET_BASE_URL || DEFAULT_ASSET_BASE_URL,
    PORT: String(port),
    SAFETY_API_UPSTREAM_BASE_URL:
      process.env.SAFETY_API_UPSTREAM_BASE_URL || DEFAULT_UPSTREAM_BASE_URL,
  };
}

prepareLockFile();
const port = resolvePort();
const env = buildChildEnv(port);

console.log(`[dev] Starting safetysite on http://${DEFAULT_HOST}:${port}`);
console.log(`[dev] Safety API upstream: ${env.SAFETY_API_UPSTREAM_BASE_URL}`);
console.log('[dev] To use a local safety-server instead, set SAFETY_API_UPSTREAM_BASE_URL=http://127.0.0.1:8011/api/v1');
console.log(`[dev] K2B parse check: http://${DEFAULT_HOST}:${port}/api/k2b/imports/parse`);

const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const child = spawn(command, ['next', 'dev', '--hostname', DEFAULT_HOST, '--port', String(port), '--webpack'], {
  cwd: projectRoot,
  env,
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
