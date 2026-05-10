import { access } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "..");
const projectRoot = path.resolve(workspaceRoot, "..");

const preferredPython = process.env.ANC_ERP_PYTHON_BIN?.trim();
const pythonCandidates = [
  preferredPython,
  path.join(projectRoot, "apps", "api", ".venv", "bin", "python"),
  "python3",
  "python",
].filter(Boolean);

async function resolvePythonCommand() {
  for (const candidate of pythonCandidates) {
    if (path.isAbsolute(candidate)) {
      try {
        await access(candidate);
        return candidate;
      } catch {
        continue;
      }
    }

    return candidate;
  }

  throw new Error("No Python command available for the anc-erp server.");
}

function spawnProcess(label, command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: workspaceRoot,
    env: { ...process.env, ...options.env },
    stdio: "inherit",
  });

  child.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }

    const reason = signal ? `signal ${signal}` : `code ${code ?? 0}`;
    console.error(`[anc-erp:${label}] exited with ${reason}`);
    shutdown(code ?? 1);
  });

  child.on("error", (error) => {
    if (shuttingDown) {
      return;
    }

    console.error(`[anc-erp:${label}] failed to start: ${error.message}`);
    shutdown(1);
  });

  return child;
}

const children = new Set();
let shuttingDown = false;

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }

  setTimeout(() => {
    for (const child of children) {
      if (!child.killed) {
        child.kill("SIGKILL");
      }
    }
  }, 3_000).unref();

  process.exitCode = exitCode;
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

const devTarget = process.env.ANC_ERP_DEV_TARGET ?? "all";

if (!["all", "server"].includes(devTarget)) {
  console.error(`Unsupported ANC_ERP_DEV_TARGET: ${devTarget}`);
  process.exit(1);
}

if (devTarget === "all") {
  const client = spawnProcess("client", "npm", ["run", "dev:client"], {
    env: {
      NEXT_PUBLIC_ANC_ERP_API_BASE_URL:
        process.env.NEXT_PUBLIC_ANC_ERP_API_BASE_URL ?? "http://localhost:8010",
    },
  });
  children.add(client);
}

const pythonCommand = await resolvePythonCommand();
const server = spawnProcess(
  "server",
  pythonCommand,
  ["-m", "uvicorn", "server.app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8010"],
);
children.add(server);
