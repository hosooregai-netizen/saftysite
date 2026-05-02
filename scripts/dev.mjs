import { spawn } from 'node:child_process';

const isWindows = process.platform === 'win32';
const npmCommand = isWindows ? 'npm.cmd' : 'npm';

function startProcess(label, args) {
  const child = spawn(npmCommand, args, {
    stdio: 'inherit',
    env: process.env,
  });

  child.on('error', (error) => {
    console.error(`[dev] Failed to start ${label}:`, error);
  });

  return child;
}

const api = startProcess('api', ['run', 'api:dev']);
const web = startProcess('web', ['run', 'dev:web']);

let shuttingDown = false;

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  if (api.pid) {
    api.kill('SIGTERM');
  }
  if (web.pid) {
    web.kill('SIGTERM');
  }

  setTimeout(() => {
    process.exit(exitCode);
  }, 200);
}

function forwardSignal(signal) {
  process.on(signal, () => {
    shutdown(0);
  });
}

forwardSignal('SIGINT');
forwardSignal('SIGTERM');

api.on('exit', (code) => {
  if (!shuttingDown) {
    console.log(`[dev] API process exited with code ${code ?? 0}. Shutting down web dev server.`);
    shutdown(code ?? 0);
  }
});

web.on('exit', (code) => {
  if (!shuttingDown) {
    console.log(`[dev] Web process exited with code ${code ?? 0}. Shutting down API dev server.`);
    shutdown(code ?? 0);
  }
});
