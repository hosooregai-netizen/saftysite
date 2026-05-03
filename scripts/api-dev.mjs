import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptsDir, '..');

const pythonCandidates =
  process.platform === 'win32'
    ? [
        path.join(projectRoot, '.venv', 'Scripts', 'python.exe'),
        'python',
        'py',
      ]
    : [
        path.join(projectRoot, '.venv', 'bin', 'python'),
        'python3',
        'python',
      ];

function fileExists(candidate) {
  return path.isAbsolute(candidate) && fs.existsSync(candidate);
}

function resolvePython() {
  return pythonCandidates.find((candidate) => !path.isAbsolute(candidate) || fileExists(candidate));
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
        console.log(`[api:dev] Port 8001 is unavailable. Starting API on http://127.0.0.1:${port}`);
      }
      return port;
    }
  }

  console.error(`[api:dev] No available API port found in: ${ports.join(', ')}`);
  process.exit(1);
}

const python = resolvePython();

if (!python) {
  console.error('[api:dev] Python was not found. Create .venv or install Python 3.');
  process.exit(1);
}

const port = await resolvePort();

const child = spawn(
  python,
  ['-m', 'uvicorn', 'app.main:app', '--reload', '--app-dir', 'apps/api', '--port', String(port)],
  {
    cwd: projectRoot,
    env: process.env,
    stdio: 'inherit',
  },
);

child.on('error', (error) => {
  console.error('[api:dev] Failed to start API server:', error);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
