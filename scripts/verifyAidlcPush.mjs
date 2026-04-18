import { execFileSync } from 'node:child_process';

const DEFAULT_BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3211';
const ALL_ADMIN_SMOKE_IDS = [
  'admin-control-center',
  'admin-headquarters',
  'admin-reports',
  'admin-sites',
  'admin-schedules',
  'admin-users',
];

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
  /^app\/api\/admin\//,
  /^app\/api\/safety\//,
  /^app\/admin\//,
  /^app\/sites\//,
  /^components\/worker\//,
  /^features\/admin\//,
  /^features\/home\//,
  /^features\/inspection-session\//,
  /^features\/mailbox\//,
  /^features\/mobile\//,
  /^features\/site-reports\//,
  /^lib\/admin\/apiClient\.ts$/,
  /^server\/admin\//,
];

const FEATURE_RULES = [
  {
    ids: ALL_ADMIN_SMOKE_IDS,
    patterns: [
      /^features\/admin\/sections\/AdminSectionShared\.module\.css$/,
      /^features\/admin\/components\/AdminDashboard(SectionContent|Screen|Shell.*)\.tsx?$/,
      /^features\/admin\/lib\/adminSessionCache\.ts$/,
      /^features\/admin\/lib\/adminClientCacheInvalidation(\.test)?\.ts$/,
      /^features\/admin\/lib\/adminDashboardBootstrapCache\.ts$/,
      /^features\/admin\/hooks\/useAdminDashboard(DataLoaders|Routing|State)\.ts$/,
      /^features\/admin\/hooks\/buildAdminDashboard(Assignment|Crud)Actions\.ts$/,
      /^features\/admin\/lib\/adminDashboardMutations\.ts$/,
      /^app\/api\/admin\/directory\//,
      /^app\/api\/safety\//,
      /^lib\/admin\/apiClient\.ts$/,
      /^server\/admin\/adminRouteInvalidation(\.test)?\.ts$/,
      /^server\/admin\/adminDirectory(Lists|Snapshot)\.ts$/,
      /^server\/admin\/exportSheets\.ts$/,
      /^server\/admin\/safetyApiServer\.ts$/,
      /^server\/admin\/upstreamMappers\.ts$/,
    ],
  },
  {
    id: 'admin-control-center',
    patterns: [
      /^app\/admin\//,
      /^app\/api\/admin\/dashboard\//,
      /^features\/admin\/components\//,
      /^features\/admin\/lib\/control-center-model\//,
      /^features\/admin\/lib\/buildAdminControlCenterModel\.ts$/,
      /^features\/admin\/lib\/adminDashboardShellState\.ts$/,
      /^features\/admin\/sections\/analytics\//,
      /^features\/admin\/sections\/overview\//,
      /^server\/admin\/analyticsSnapshot\.ts$/,
      /^server\/admin\/overviewPolicyOverlay(\.test)?\.ts$/,
      /^server\/admin\/overviewRouteCache(\.test)?\.ts$/,
    ],
  },
  {
    id: 'admin-headquarters',
    patterns: [
      /^app\/api\/admin\/headquarters\//,
      /^features\/admin\/sections\/headquarters\//,
    ],
  },
  {
    id: 'admin-reports',
    patterns: [
      /^app\/api\/admin\/reports\//,
      /^features\/admin\/sections\/reports\//,
      /^server\/admin\/reportsRouteCache(\.test)?\.ts$/,
    ],
  },
  {
    id: 'admin-sites',
    patterns: [
      /^app\/api\/admin\/sites\/list\//,
      /^features\/admin\/sections\/excelImport\//,
      /^features\/admin\/sections\/sites\//,
    ],
  },
  {
    id: 'admin-schedules',
    patterns: [
      /^app\/api\/admin\/schedules\//,
      /^app\/api\/admin\/sites\/\[siteId\]\/schedules\/generate\//,
      /^features\/admin\/sections\/schedules\//,
      /^server\/admin\/localScheduleNotifications\.ts$/,
      /^server\/admin\/scheduleSnapshot\.ts$/,
    ],
  },
  {
    id: 'admin-users',
    patterns: [
      /^app\/api\/admin\/users\//,
      /^features\/admin\/sections\/users\//,
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
      /^features\/site-reports\/components\/SiteReportsScreen\.module\.css$/,
      /^features\/site-reports\/components\/SiteReportsScreen\.tsx$/,
      /^features\/site-reports\/hooks\/useResolvedSiteRoute\.ts$/,
      /^features\/site-reports\/hooks\/useSiteReportsScreen\.ts$/,
      /^features\/site-reports\/hooks\/useSiteReportListState\.ts$/,
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
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4_000);

    try {
      const response = await fetch(baseUrl, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
      });

      // This guard only checks whether the local app process is listening.
      // Real route regressions should be caught by the smoke suite itself.
      if (response.status >= 100 && response.status < 600) {
        return true;
      }
    } catch {
      // Retry below.
    } finally {
      clearTimeout(timeout);
    }

    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  return false;
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
