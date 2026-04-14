import { execFileSync } from 'node:child_process';

function canConfigureGitHooks() {
  try {
    execFileSync('git', ['rev-parse', '--git-dir'], {
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

if (!canConfigureGitHooks()) {
  console.log('[hooks] skipping hook install because this directory is not a git worktree.');
  process.exit(0);
}

execFileSync('git', ['config', '--local', 'core.hooksPath', '.githooks'], {
  stdio: 'inherit',
});
console.log('[hooks] core.hooksPath set to .githooks');
