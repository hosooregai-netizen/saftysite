const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const projectRoot = process.cwd();
const lockPath = path.join(projectRoot, ".next", "dev", "lock");

function isBusyLock(filePath) {
  try {
    const fd = fs.openSync(filePath, "r+");
    fs.closeSync(fd);
    return false;
  } catch (error) {
    return error && (error.code === "EBUSY" || error.code === "EPERM");
  }
}

if (fs.existsSync(lockPath)) {
  if (isBusyLock(lockPath)) {
    console.log("Next dev is already running for this project.");
    console.log("Use the existing dev server instead of starting a second one.");
    process.exit(0);
  }

  fs.rmSync(lockPath, { force: true });
}

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const child = spawn(npmCommand, ["run", "dev"], {
  cwd: projectRoot,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
