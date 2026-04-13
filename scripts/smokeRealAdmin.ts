import { chromium } from 'playwright';

import { runAdminControlCenterSection } from './smoke-real-client/admin-sections/control-center';
import { runAdminReportsSection } from './smoke-real-client/admin-sections/reports';
import { runAdminSitesSection } from './smoke-real-client/admin-sections/sites';
import { baseUrl, seed } from './smoke-real-client/config';
import {
  attachPageDiagnostics,
  ensureNoDiagnostics,
  login,
} from './smoke-real-client/helpers';

type AdminSmokeSection = 'control-center' | 'reports' | 'sites';

const SECTION_RUNNERS: Record<AdminSmokeSection, (page: import('playwright').Page) => Promise<void>> = {
  'control-center': runAdminControlCenterSection,
  reports: runAdminReportsSection,
  sites: runAdminSitesSection,
};

function parseSections(argv: string[]) {
  const flagIndex = argv.indexOf('--sections');
  if (flagIndex < 0) {
    return Object.keys(SECTION_RUNNERS) as AdminSmokeSection[];
  }
  const value = argv[flagIndex + 1] || '';
  const requested = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean) as AdminSmokeSection[];
  return requested.length > 0 ? requested : (Object.keys(SECTION_RUNNERS) as AdminSmokeSection[]);
}

async function main() {
  const sections = parseSections(process.argv.slice(2));
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1440, height: 1200 },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30_000);
  const diagnostics = attachPageDiagnostics(page);

  try {
    await login(page, context, {
      baseUrl,
      email: seed.adminEmail,
      entryPath: '/admin?section=overview',
      password: seed.adminPassword,
    });

    for (const section of sections) {
      await SECTION_RUNNERS[section](page);
    }

    ensureNoDiagnostics(diagnostics);
    console.log(JSON.stringify({ sections, status: 'ok' }, null, 2));
  } finally {
    await browser.close();
  }
}

void main();
