import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';

const DEFAULT_PORT = 3100;
const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_UPSTREAM_BASE_URL = 'http://52.64.85.49:8011/api/v1';
const DEFAULT_ASSET_BASE_URL = 'http://52.64.85.49:8011';
const MAX_PORT_SCAN = 10;

const projectRoot = process.cwd();
const lockPath = path.join(projectRoot, '.next', 'dev', 'lock');
const nextCliPath = path.join(projectRoot, 'node_modules', 'next', 'dist', 'bin', 'next');

function loadDotEnvFile(filename) {
  const filePath = path.join(projectRoot, filename);
  if (!fs.existsSync(filePath)) {
    return;
  }

  const source = fs.readFileSync(filePath, 'utf8');
  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }

    let value = trimmed.slice(separatorIndex + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

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

function safePowerShell(command) {
  return safeExec('powershell.exe', [
    '-NoProfile',
    '-Command',
    `$OutputEncoding = [System.Text.Encoding]::UTF8; [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; ${command}`,
  ]);
}

function normalizeForSearch(value) {
  return String(value || '')
    .replace(/\\/g, '/')
    .toLowerCase();
}

function parsePortFromAddress(address) {
  const match = String(address || '').match(/:(\d+)$/);
  if (!match) return null;
  const port = Number.parseInt(match[1], 10);
  return Number.isInteger(port) && port > 0 ? port : null;
}

function parsePortFromCommandLine(commandLine) {
  const match = String(commandLine || '').match(/--port(?:=|\s+)"?(\d+)"?/);
  if (!match) return null;
  const port = Number.parseInt(match[1], 10);
  return Number.isInteger(port) && port > 0 ? port : null;
}

function getWindowsListeningPids(port) {
  const fromPowerShell = safePowerShell(
    `Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess`,
  )
    .split(/\r?\n/)
    .map((line) => Number.parseInt(line.trim(), 10))
    .filter((value) => Number.isInteger(value) && value > 0);

  if (fromPowerShell.length > 0) return fromPowerShell;

  return safeExec('netstat', ['-ano', '-p', 'tcp'])
    .split(/\r?\n/)
    .map((line) => line.trim().split(/\s+/))
    .filter((parts) => parts.length >= 5 && parts[0] === 'TCP')
    .filter((parts) => parts[3]?.toUpperCase() === 'LISTENING')
    .filter((parts) => parsePortFromAddress(parts[1]) === port)
    .map((parts) => Number.parseInt(parts[4], 10))
    .filter((value) => Number.isInteger(value) && value > 0);
}

function getListeningPids(port) {
  if (process.platform === 'win32') {
    return getWindowsListeningPids(port);
  }

  return safeExec('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-Fp'])
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('p'))
    .map((line) => Number(line.slice(1)))
    .filter((value) => Number.isInteger(value) && value > 0);
}

function getProcessCwd(pid) {
  if (process.platform === 'win32') {
    return '';
  }

  const output = safeExec('lsof', ['-a', '-p', String(pid), '-d', 'cwd', '-Fn']);
  const cwdLine = output
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.startsWith('n'));
  return cwdLine ? cwdLine.slice(1) : '';
}

function getProcessCommandLine(pid) {
  if (process.platform === 'win32') {
    return safePowerShell(`(Get-CimInstance Win32_Process -Filter "ProcessId = ${pid}").CommandLine`).trim();
  }

  return safeExec('ps', ['-p', String(pid), '-o', 'command=']).trim();
}

function getPortOwner(port) {
  const [pid] = getListeningPids(port);
  if (!pid) return null;
  return {
    commandLine: getProcessCommandLine(pid),
    cwd: getProcessCwd(pid),
    pid,
  };
}

function isSameProject(cwd) {
  return Boolean(cwd) && path.resolve(cwd) === projectRoot;
}

function commandBelongsToProject(commandLine) {
  return normalizeForSearch(commandLine).includes(normalizeForSearch(projectRoot));
}

function isSameProjectOwner(owner) {
  return Boolean(owner) && (isSameProject(owner.cwd) || commandBelongsToProject(owner.commandLine));
}

function describeOwner(owner) {
  if (!owner) return 'another process';
  if (owner.cwd) return owner.cwd;
  if (owner.commandLine) {
    return owner.commandLine.replace(/\s+/g, ' ').slice(0, 120);
  }
  return 'another process';
}

function getProcessSnapshot() {
  if (process.platform === 'win32') {
    const output = safePowerShell(
      'Get-CimInstance Win32_Process -Filter "name = \'node.exe\'" | Select-Object ProcessId,ParentProcessId,CommandLine | ConvertTo-Json -Compress',
    ).trim();

    if (!output) return [];

    try {
      const parsed = JSON.parse(output);
      const records = Array.isArray(parsed) ? parsed : [parsed];
      return records.map((record) => ({
        commandLine: record.CommandLine || '',
        parentPid: Number(record.ParentProcessId),
        pid: Number(record.ProcessId),
      }));
    } catch {
      return [];
    }
  }

  return safeExec('ps', ['-eo', 'pid=,ppid=,command='])
    .split(/\r?\n/)
    .map((line) => line.trim().match(/^(\d+)\s+(\d+)\s+(.+)$/))
    .filter(Boolean)
    .map((match) => ({
      commandLine: match[3],
      parentPid: Number(match[2]),
      pid: Number(match[1]),
    }));
}

function getRunningProjectDevServers() {
  const nextCliNeedle = normalizeForSearch(nextCliPath);

  return getProcessSnapshot()
    .map((processInfo) => ({
      ...processInfo,
      port: parsePortFromCommandLine(processInfo.commandLine),
    }))
    .filter((processInfo) => {
      const commandLine = normalizeForSearch(processInfo.commandLine);
      return (
        Number.isInteger(processInfo.port) &&
        commandBelongsToProject(commandLine) &&
        commandLine.includes(nextCliNeedle) &&
        /\bdev\b/.test(commandLine)
      );
    });
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

  if (owner3000 && !isSameProjectOwner(owner3000)) {
    console.log(
      `[dev] Port 3000 is already used by another project: ${describeOwner(owner3000)} (pid ${owner3000.pid}).`,
    );
    console.log('[dev] safetysite will run on port 3100 or the next available port.');
  }

  for (let index = 0; index <= MAX_PORT_SCAN; index += 1) {
    const candidatePort = requestedPort + index;
    const owner = getPortOwner(candidatePort);
    if (!owner) return candidatePort;
    if (isSameProjectOwner(owner)) {
      console.log(`[dev] safetysite is already running on port ${candidatePort} (pid ${owner.pid}).`);
      console.log(`[dev] Use http://${DEFAULT_HOST}:${candidatePort} and confirm the Excel import API there.`);
      process.exit(0);
    }
    console.log(
      `[dev] Port ${candidatePort} is already in use by ${describeOwner(owner)} (pid ${owner.pid}).`,
    );
  }

  throw new Error(`No available dev port found between ${requestedPort} and ${requestedPort + MAX_PORT_SCAN}.`);
}

function prepareLockFile() {
  if (!fs.existsSync(lockPath)) return;
  if (isBusyLock(lockPath)) {
    const [runningServer] = getRunningProjectDevServers();
    if (runningServer) {
      console.log(`[dev] safetysite is already running on port ${runningServer.port} (pid ${runningServer.pid}).`);
      console.log(`[dev] Use http://${DEFAULT_HOST}:${runningServer.port} and confirm the Excel import API there.`);
      process.exit(0);
    }

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

loadDotEnvFile('.env');
loadDotEnvFile('.env.local');
prepareLockFile();
const port = resolvePort();
const env = buildChildEnv(port);

console.log(`[dev] Starting safetysite on http://${DEFAULT_HOST}:${port}`);
console.log(`[dev] Safety API upstream: ${env.SAFETY_API_UPSTREAM_BASE_URL}`);
console.log('[dev] To use a local safety-server instead, set SAFETY_API_UPSTREAM_BASE_URL=http://127.0.0.1:8011/api/v1');
console.log(`[dev] Excel import parse check: http://${DEFAULT_HOST}:${port}/api/excel-imports/parse`);

if (!fs.existsSync(nextCliPath)) {
  throw new Error(`[dev] Next CLI not found at ${nextCliPath}. Run npm install first.`);
}

const child = spawn(
  process.execPath,
  [nextCliPath, 'dev', '--hostname', DEFAULT_HOST, '--port', String(port), '--webpack'],
  {
    cwd: projectRoot,
    env,
    stdio: 'inherit',
  },
);

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
