export interface ClientSmokePlaywrightConfig {
  baseURL: string;
  headless: boolean;
  navigationTimeoutMs: number;
  slowMoMs: number;
  testTimeoutMs: number;
  viewport: {
    height: number;
    width: number;
  };
}

function readBooleanEnv(name: string, fallback: boolean) {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) return fallback;
  if (raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on') return true;
  if (raw === '0' || raw === 'false' || raw === 'no' || raw === 'off') return false;
  return fallback;
}

function readNumberEnv(name: string, fallback: number) {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function resolveClientSmokePlaywrightConfig(
  overrides: Partial<ClientSmokePlaywrightConfig> = {},
): ClientSmokePlaywrightConfig {
  return {
    baseURL:
      overrides.baseURL ||
      process.env.PLAYWRIGHT_BASE_URL ||
      process.env.SMOKE_BASE_URL ||
      'http://127.0.0.1:3100',
    headless: overrides.headless ?? readBooleanEnv('PLAYWRIGHT_HEADLESS', true),
    navigationTimeoutMs:
      overrides.navigationTimeoutMs ?? readNumberEnv('PLAYWRIGHT_NAVIGATION_TIMEOUT_MS', 30000),
    slowMoMs: overrides.slowMoMs ?? readNumberEnv('PLAYWRIGHT_SLOW_MO_MS', 0),
    testTimeoutMs: overrides.testTimeoutMs ?? readNumberEnv('PLAYWRIGHT_TEST_TIMEOUT_MS', 30000),
    viewport: overrides.viewport || {
      height: readNumberEnv('PLAYWRIGHT_VIEWPORT_HEIGHT', 1200),
      width: readNumberEnv('PLAYWRIGHT_VIEWPORT_WIDTH', 1440),
    },
  };
}

const config = resolveClientSmokePlaywrightConfig();

export default config;
