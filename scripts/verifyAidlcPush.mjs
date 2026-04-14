import { execFileSync } from 'node:child_process';

const DEFAULT_BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3211';
const ADMIN_SHARED_SMOKE_IDS = ['admin-control-center', 'admin-reports', 'admin-sites'];

const IGNORED_FILE_PATTERNS = [
  /^\.tmp-ui\//,
  /^docs\//,
  /^skills\//,
  /^next-env\.d\.ts$/,
  /^package-lock\.json$/,
  /^package\.json$/,
  /^scripts\/installGitHooks\.mjs$/,
  /^scripts\/verifyAidlc\.mjs$/,
  /^scripts\/verifyAidlcPush\.mjs$/,
  /^\.githooks\//,
];

const GUARDED_SOURCE_PATTERNS = [
  /^app\/admin\//,
  /^app\/sites\//,
  /^components\/worker\//,
  /^features\/admin\//,
  /^features\/home\//,
  /^features\/inspection-session\//,
  /^features\/mailbox\//,
  /^features\/mobile\//,
  /^features\/site-reports\//,
];

const FEATURE_RULES = [
  {
    ids: ADMIN_SHARED_SMOKE_IDS,
    patterns: [/^features\/admin\/sections\/AdminSectionShared\.module\.css$/],
  },
  {
    id: 'admin-control-center',
    patterns: [
      /^app\/admin\//,
      /^features\/admin\/components\//,
      /^features\/admin\/hooks\//,
      /^features\/admin\/lib\/control-center-model\//,
      /^features\/admin\/lib\/buildAdminControlCenterModel\.ts$/,
      /^features\/admin\/lib\/adminDashboardShellState\.ts$/,
      /^features\/admin\/sections\/analytics\//,
      /^features\/admin\/sections\/overview\//,
    ],
  },
  {
    id: 'admin-reports',
    patterns: [/^features\/admin\/sections\/reports\//],
  },
  {
    id: 'admin-sites',
    patterns: [
      /^features\/admin\/sections\/excelImport\//,
      /^features\/admin\/sections\/headquarters\//,
      /^features\/admin\/sections\/sites\//,
    ],
  },
  {
    id: 'site-hub',
    patterns: [
      /^components\/worker\//,
      /^features\/home\//,
    ],
  },
  {
    id: 'site-report-list',
    patterns: [
      /^features\/site-reports\/components\/ReportList\.tsx$/,
      /^features\/site-reports\/components\/SiteReportListPanel\.tsx$/,
      /^features\/site-reports\/components\/SiteReportsScreen\.tsx$/,
      /^features\/site-reports\/report-list\//,
    ],
  },
  {
    id: 'quarterly-report',
    patterns: [
      /^app\/sites\/\[siteKey\]\/quarterly\/\[quarterKey\]\//,
      /^features\/site-reports\/components\/SiteQuarterlyReportsScreen\.tsx$/,
      /^features\/site-reports\/quarterly-report\//,
      /^features\/site-reports\/quarterly-list\//,
    ],
  },
  {
    id: 'bad-workplace-report',
    patterns: [
      /^app\/sites\/\[siteKey\]\/bad-workplace\/\[reportMonth\]\//,
      /^features\/site-reports\/bad-workplace\//,
    ],
  },
  {
    id: 'mobile-quarterly-list',
    patterns: [
      /^features\/mobile\/components\/MobileSiteQuarterlyReportsScreen\.tsx$/,
      /^features\/mobile\/quarterly-list\//,
    ],
  },
  {
    id: 'mobile-quarterly-report',
    patterns: [
      /^features\/mobile\/components\/MobileQuarterlyReportScreen\.tsx$/,
      /^features\/mobile\/quarterly-report\//,
    ],
  },
  {
    id: 'mobile-site-home',
    patterns: [
      /^features\/mobile\/components\/MobileSiteHomeScreen\.tsx$/,
      /^features\/mobile\/site-home\//,
    ],
  },
  {
    id: 'mobile-site-reports',
    patterns: [
      /^features\/mobile\/components\/MobileSiteReportsScreen\.tsx$/,
      /^features\/mobile\/report-list\//,
    ],
  },
  {
    id: 'mobile-bad-workplace',
    patterns: [
      /^features\/mobile\/bad-workplace\//,
      /^features\/mobile\/components\/MobileBadWorkplaceReportScreen\.tsx$/,
    ],
  },
  {
    id: 'mobile-link',
    patterns: [
      /^features\/inspection-session\//,
      /^features\/mobile\/components\/MobileInspectionSessionScreen\.tsx$/,
      /^features\/mobile\/inspection-session\//,
    ],
  },
];

function getCommandCandidates(command) {
  if (process.platform !== 'win32') {
    return [command];
  }

  return [command, `${command}.cmd`, `${command}.exe`];
}

function execCommand(command, args, options = {}) {
  let lastError = null;

  for (const candidate of getCommandCandidates(command)) {
    try {
      if (process.platform === 'win32' && candidate.endsWith('.cmd')) {
        return execFileSync('cmd.exe', ['/d', '/s', '/c', candidate, ...args], options);
      }

      return execFileSync(candidate, args, options);
    } catch (error) {
      if (error && typeof error === 'object' && ['ENOENT', 'EINVAL'].includes(error.code)) {
        lastError = error;
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

function run(command, args, options = {}) {
  return execCommand(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  }).trim();
}

function getPushedFiles() {
  const explicitFiles = process.argv.slice(2).map((value) => value.trim()).filter(Boolean);
  if (explicitFiles.length > 0) {
    return explicitFiles;
  }

  try {
    const output = run('git', ['diff', '--name-only', '@{upstream}...HEAD']);
    return output ? output.split('\n').map((line) => line.trim()).filter(Boolean) : [];
  } catch {
    const fallback = run('git', ['diff', '--name-only', 'HEAD~1..HEAD']);
    return fallback ? fallback.split('\n').map((line) => line.trim()).filter(Boolean) : [];
  }
}

function matchesAny(file, patterns) {
  return patterns.some((pattern) => pattern.test(file));
}

async function ensureBaseUrlReachable(baseUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4_000);

  try {
    const response = await fetch(baseUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function buildRequiredSmokes(files) {
  const relevantFiles = files.filter((file) => !matchesAny(file, IGNORED_FILE_PATTERNS));
  const guardedFiles = relevantFiles.filter((file) => matchesAny(file, GUARDED_SOURCE_PATTERNS));
  if (guardedFiles.length === 0) {
    return { guardedFiles, smokeIds: [] };
  }

  const smokeIds = new Set();
  const unmappedFiles = [];

  for (const file of guardedFiles) {
    const matchedRule = FEATURE_RULES.find((rule) => matchesAny(file, rule.patterns));
    if (matchedRule) {
      const ids = matchedRule.ids ?? [matchedRule.id];
      for (const id of ids) {
        smokeIds.add(id);
      }
      continue;
    }

    if (file.startsWith('features/mailbox/')) {
      unmappedFiles.push(
        `${file} (mailbox smoke mapping is not defined yet; add a mailbox feature contract/smoke first)`,
      );
      continue;
    }

    unmappedFiles.push(file);
  }

  if (unmappedFiles.length > 0) {
    console.error('[aidlc-push] push blocked because some guarded source files do not have a smoke mapping:');
    for (const file of unmappedFiles) {
      console.error(`  - ${file}`);
    }
    process.exit(1);
  }

  const finalSmokeIds = new Set(smokeIds);
  const hasErpSmoke = Array.from(smokeIds).some((id) => !id.startsWith('admin-'));
  if (hasErpSmoke) {
    finalSmokeIds.add('auth');
  }

  return { guardedFiles, smokeIds: [...finalSmokeIds] };
}

async function main() {
  const files = getPushedFiles();
  const { guardedFiles, smokeIds } = buildRequiredSmokes(files);

  if (guardedFiles.length === 0) {
    console.log('[aidlc-push] no guarded source files changed; skipping smoke verification.');
    return;
  }

  if (smokeIds.length === 0) {
    console.log('[aidlc-push] no smoke features were required for this push; skipping.');
    return;
  }

  const reachable = await ensureBaseUrlReachable(DEFAULT_BASE_URL);
  if (!reachable) {
    console.error('[aidlc-push] push blocked because the local app is not reachable for smoke tests.');
    console.error(`  - expected app url: ${DEFAULT_BASE_URL}`);
    console.error('  - start the app first, for example: PORT=3211 npm run dev');
    process.exit(1);
  }

  console.log(`[aidlc-push] running smoke features: ${smokeIds.join(', ')}`);
  execCommand(
    'npm',
    ['run', 'test:client:smoke', '--', ...smokeIds],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        PLAYWRIGHT_BASE_URL: DEFAULT_BASE_URL,
      },
    },
  );

  console.log('[aidlc-push] smoke verification passed.');
}

await main();
