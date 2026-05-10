import { execFileSync, spawn } from 'node:child_process';

const isWindows = process.platform === 'win32';
const WEB_PORT = 3000;

function safeExec(command, args) {
  try {
    return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
}

function getListeningPids(port) {
  if (isWindows) {
    return safeExec('netstat', ['-ano', '-p', 'tcp'])
      .split(/\r?\n/)
      .map((line) => line.trim().split(/\s+/))
      .filter((parts) => parts.length >= 5 && parts[0] === 'TCP')
      .filter((parts) => parts[1]?.endsWith(`:${port}`))
      .filter((parts) => parts[3]?.toUpperCase() === 'LISTENING')
      .map((parts) => Number.parseInt(parts[4], 10))
      .filter((value) => Number.isInteger(value) && value > 0);
  }

  return safeExec('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-Fp'])
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('p'))
    .map((line) => Number.parseInt(line.slice(1), 10))
    .filter((value) => Number.isInteger(value) && value > 0);
}

function terminatePid(pid) {
  if (!Number.isInteger(pid) || pid <= 0) {
    return;
  }

  try {
    if (isWindows) {
      execFileSync('taskkill', ['/PID', String(pid), '/T', '/F'], {
        stdio: ['ignore', 'ignore', 'ignore'],
      });
      return;
    }
    process.kill(pid, 'SIGTERM');
  } catch {}
}

function sleep(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function reclaimPort(port) {
  const pids = [...new Set(getListeningPids(port))];
  if (pids.length === 0) {
    return;
  }

  console.log(`[dev] Reclaiming port ${port} from pid${pids.length > 1 ? 's' : ''} ${pids.join(', ')}.`);
  for (const pid of pids) {
    terminatePid(pid);
  }

  for (let attempt = 0; attempt < 10; attempt += 1) {
    if (getListeningPids(port).length === 0) {
      return;
    }
    sleep(150);
  }

  if (!isWindows) {
    for (const pid of [...new Set(getListeningPids(port))]) {
      try {
        process.kill(pid, 'SIGKILL');
      } catch {}
    }
  }
}

function startProcess(label, args, env = process.env) {
  const command = isWindows ? 'cmd.exe' : 'npm';
  const commandArgs = isWindows ? ['/d', '/s', '/c', 'npm', ...args] : args;
  const child = spawn(command, commandArgs, {
    stdio: 'inherit',
    env,
  });

  child.on('error', (error) => {
    console.error(`[dev] Failed to start ${label}:`, error);
  });

  return child;
}

reclaimPort(WEB_PORT);

const api = startProcess('api', ['run', 'api:dev']);
const web = startProcess('web', ['run', 'dev:web'], {
  ...process.env,
  PORT: String(WEB_PORT),
});

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
