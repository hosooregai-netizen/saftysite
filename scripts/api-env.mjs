import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import net from 'node:net';

const repoRoot = process.cwd();
const apiDir = path.join(repoRoot, 'apps', 'api');
const venvDir = path.join(apiDir, '.venv');
const isWindows = process.platform === 'win32';
const venvPython = isWindows
  ? path.join(venvDir, 'Scripts', 'python.exe')
  : path.join(venvDir, 'bin', 'python');
const requirementsPath = path.join(apiDir, 'requirements.txt');
const hashPath = path.join(venvDir, '.requirements.sha256');
const pythonCommand = process.env.SAFTYSITE_API_PYTHON || (isWindows ? 'python' : 'python3');

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      cwd: repoRoot,
      env: process.env,
      ...options,
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(' ')} exited with code ${code ?? 1}`));
    });
  });
}

function runQuiet(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'ignore', 'ignore'],
      cwd: repoRoot,
      env: process.env,
    });

    child.on('error', () => resolve(false));
    child.on('exit', (code) => resolve(code === 0));
  });
}

function getRequirementsHash() {
  const contents = readFileSync(requirementsPath, 'utf8');
  return createHash('sha256').update(contents).digest('hex');
}

function readInstalledHash() {
  if (!existsSync(hashPath)) {
    return null;
  }

  return readFileSync(hashPath, 'utf8').trim();
}

async function ensureVenv() {
  if (existsSync(venvPython)) {
    return;
  }

  mkdirSync(apiDir, { recursive: true });
  await run(pythonCommand, ['-m', 'venv', venvDir]);
}

async function hasRequiredModules() {
  if (!existsSync(venvPython)) {
    return false;
  }

  return runQuiet(venvPython, ['-c', 'import fastapi, uvicorn, pydantic']);
}

async function installRequirementsIfNeeded() {
  await ensureVenv();

  const currentHash = getRequirementsHash();
  const installedHash = readInstalledHash();
  const modulesReady = await hasRequiredModules();

  if (modulesReady && installedHash === currentHash) {
    return;
  }

  await run(venvPython, ['-m', 'pip', 'install', '--upgrade', 'pip']);
  await run(venvPython, ['-m', 'pip', 'install', '-r', requirementsPath]);
  writeFileSync(hashPath, `${currentHash}\n`, 'utf8');
}

function parsePort(value) {
  if (!value) return null;
  const port = Number.parseInt(value, 10);
  return Number.isInteger(port) && port > 0 ? port : null;
}

function canListen(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '127.0.0.1');
  });
}

async function resolvePort() {
  const requestedPort = parsePort(process.env.REPORT_SAAS_API_PORT || process.env.API_PORT);
  const ports = requestedPort
    ? [requestedPort]
    : [8001, 8000, ...Array.from({ length: 9 }, (_, index) => 8002 + index)];

  for (const port of ports) {
    if (await canListen(port)) {
      if (port !== 8001) {
        console.log(`[api-env] Port 8001 is unavailable. Starting API on http://127.0.0.1:${port}`);
      }
      return port;
    }
  }

  throw new Error(`No available API port found in: ${ports.join(', ')}`);
}

async function main() {
  const installOnly = process.argv.includes('--install-only');
  const checkOnly = process.argv.includes('--check');
  await installRequirementsIfNeeded();

  if (installOnly) {
    return;
  }

  if (checkOnly) {
    await run(venvPython, ['-m', 'compileall', 'apps/api/app']);
    return;
  }

  const port = await resolvePort();
  const child = spawn(
    venvPython,
    ['-m', 'uvicorn', 'app.main:app', '--reload', '--app-dir', 'apps/api', '--port', String(port)],
    {
      stdio: 'inherit',
      cwd: repoRoot,
      env: process.env,
    },
  );

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });

  child.on('error', (error) => {
    console.error('[api-env] Failed to start API dev server:', error);
    process.exit(1);
  });
}

main().catch((error) => {
  console.error('[api-env]', error instanceof Error ? error.message : error);
  process.exit(1);
});
