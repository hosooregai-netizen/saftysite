import { execFileSync } from 'node:child_process';

const ADMIN_FEATURES = [
  'admin-control-center',
  'admin-headquarters',
  'admin-reports',
  'admin-sites',
  'admin-schedules',
  'admin-users',
];

const ERP_FEATURES = [
  'auth',
  'site-hub',
  'site-report-list',
  'quarterly-report',
  'bad-workplace-report',
  'mobile-site-home',
  'mobile-site-reports',
  'mobile-quarterly-list',
  'mobile-quarterly-report',
  'mobile-bad-workplace',
  'mobile-link',
];

const ADMIN_PATTERNS = [/^app\/api\/admin\//, /^app\/api\/safety\//, /^app\/admin\//, /^features\/admin\//, /^lib\/admin\/apiClient\.ts$/, /^server\/admin\//];
const ERP_PATTERNS = [/^app\/sites\//, /^components\/worker\//, /^features\/home\//, /^features\/inspection-session\//, /^features\/mailbox\//, /^features\/mobile\//, /^features\/site-reports\//];

function exec(command, args) {
  execFileSync(command, args, { stdio: 'inherit' });
}

function run(command, args) {
  return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function getChangedFiles() {
  try {
    const output = run('git', ['diff', '--name-only', '@{upstream}...HEAD']);
    return output ? output.split('\n').map((line) => line.trim()).filter(Boolean) : [];
  } catch {
    const output = run('git', ['diff', '--name-only', 'HEAD~1..HEAD']);
    return output ? output.split('\n').map((line) => line.trim()).filter(Boolean) : [];
  }
}

function resolveScope(scope) {
  if (!scope || scope === 'all') return [...new Set([...ADMIN_FEATURES, ...ERP_FEATURES])];
  if (scope === 'admin') return ADMIN_FEATURES;
  if (scope === 'erp') return ERP_FEATURES;
  return [scope];
}

function resolvePrFeatures() {
  const files = getChangedFiles();
  const selected = new Set();
  if (files.some((file) => ADMIN_PATTERNS.some((pattern) => pattern.test(file)))) {
    ADMIN_FEATURES.forEach((feature) => selected.add(feature));
  }
  if (files.some((file) => ERP_PATTERNS.some((pattern) => pattern.test(file)))) {
    ERP_FEATURES.forEach((feature) => selected.add(feature));
  }
  if (selected.size === 0) {
    selected.add('auth');
  }
  return [...selected];
}

function runSmoke(features) {
  exec('npx', ['tsx', 'tests/client/runSmoke.ts', ...features]);
}

function runNightly() {
  exec('npx', ['tsc', '--noEmit', '--pretty', 'false']);
  exec('npm', ['run', 'verify:aidlc']);
  runSmoke([...ADMIN_FEATURES, ...ERP_FEATURES]);
  exec('npm', ['run', 'smoke:real:admin']);
  exec('npm', ['run', 'smoke:real:client']);
  exec('npm', ['run', 'verify:erp-live']);
}

function main() {
  const [mode = 'scope', ...args] = process.argv.slice(2);
  const scopeIndex = args.indexOf('--scope');
  const scope = scopeIndex >= 0 ? args[scopeIndex + 1] : '';

  if (mode === 'nightly') {
    runNightly();
    return;
  }

  exec('npx', ['tsc', '--noEmit', '--pretty', 'false']);
  exec('npm', ['run', 'verify:aidlc']);

  const features = mode === 'pr' ? resolvePrFeatures() : resolveScope(scope || args[0]);
  runSmoke(features);
}

main();
