import { chromium } from 'playwright';

import { runAdminFlow } from './smoke-real-client/admin-flow';
import { baseUrl, seed } from './smoke-real-client/config';
import {
  attachPageDiagnostics,
  dismissImportantModalIfPresent,
  ensureNoDiagnostics,
  login,
  logout,
  waitHeading,
} from './smoke-real-client/helpers';
import { runWorkerFlow } from './smoke-real-client/worker-flow';

async function main() {
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

    const { initialPhotoCount } = await runAdminFlow(page);

    await logout(page, context);
    await login(page, context, {
      baseUrl,
      email: seed.workerEmail,
      entryPath: '/calendar',
      password: seed.workerPassword,
    });

    const workerResult = await runWorkerFlow(page);

    await logout(page, context);
    await login(page, context, {
      baseUrl,
      email: seed.adminEmail,
      entryPath: '/admin?section=photos',
      password: seed.adminPassword,
    });
    await page.goto(`${baseUrl}/admin?section=photos`, { waitUntil: 'load' });
    await waitHeading(page, '사진첩');
    await dismissImportantModalIfPresent(page);
    await page.getByText(workerResult.uploadName).first().waitFor({ timeout: 30_000 });

    await browser.close();
    ensureNoDiagnostics(diagnostics);

    console.log(
      JSON.stringify(
        {
          counts: {
            afterCount: workerResult.afterCount,
            beforeCount: workerResult.beforeCount,
            initialPhotoCount,
          },
          downloadName: workerResult.downloadName,
          status: 'ok',
          uploadedPreviewSrc: workerResult.previewSrc,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    await browser.close();
    throw error;
  }
}

void main();
