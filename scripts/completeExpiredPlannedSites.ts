import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type SiteStatus = 'planned' | 'active' | 'paused' | 'closed' | 'deleted';
type SiteContractStatus = 'ready' | 'active' | 'paused' | 'completed';
type EndDateSource = 'contract_end_date' | 'project_end_date';
type StartDateSource = 'contract_start_date' | 'contract_date' | 'contract_signed_date' | 'project_start_date' | '';

interface SafetySite {
  id: string;
  site_name: string;
  headquarter?: { name?: string | null } | null;
  headquarter_detail?: { name?: string | null } | null;
  project_start_date?: string | null;
  project_end_date?: string | null;
  contract_start_date?: string | null;
  contract_date?: string | null;
  contract_signed_date?: string | null;
  contract_end_date?: string | null;
  status?: string | null;
  contract_status?: string | null;
  is_active?: boolean | null;
}

interface ReconcileCandidate {
  action: 'activate' | 'close';
  endDate: string;
  endDateSource: EndDateSource;
  site: SafetySite;
  startDate: string;
  startDateSource: StartDateSource;
}

interface ScriptOptions {
  apply: boolean;
  baseUrl: string;
  email: string;
  limit: number;
  password: string;
  today: string;
  token: string;
  verbose: boolean;
}

const DEFAULT_BASE_URL = 'http://52.64.85.49:8011/api/v1';
const DEFAULT_LIMIT = 200;

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

function getKoreanTodayToken(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Seoul',
    year: 'numeric',
  }).formatToParts(date);
  const byType = new Map(parts.map((part) => [part.type, part.value]));
  return `${byType.get('year')}-${byType.get('month')}-${byType.get('day')}`;
}

function readEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) return {};

  const entries: Record<string, string> = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const normalized = line.trim();
    if (!normalized || normalized.startsWith('#')) continue;

    const match = normalized.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    entries[key] = rawValue.replace(/^['"]|['"]$/g, '').trim();
  }

  return entries;
}

function readConfiguredBaseUrl(): string {
  const envFile = readEnvFile(resolve(process.cwd(), '.env.local'));
  return normalizeBaseUrl(
    process.env.SAFETY_API_UPSTREAM_BASE_URL ||
      process.env.NEXT_PUBLIC_SAFETY_API_UPSTREAM_BASE_URL ||
      envFile.SAFETY_API_UPSTREAM_BASE_URL ||
      envFile.NEXT_PUBLIC_SAFETY_API_UPSTREAM_BASE_URL ||
      DEFAULT_BASE_URL,
  );
}

function getArgValue(args: string[], name: string): string | null {
  const inlinePrefix = `${name}=`;
  const inline = args.find((arg) => arg.startsWith(inlinePrefix));
  if (inline) return inline.slice(inlinePrefix.length);

  const index = args.indexOf(name);
  if (index === -1 || index + 1 >= args.length) return null;
  return args[index + 1] ?? null;
}

function hasArg(args: string[], name: string): boolean {
  return args.includes(name);
}

function printHelp(): void {
  console.log(`
Reconcile site period statuses.

Default mode is dry-run. Add --apply to PATCH matching sites.

Policy:
  - contract period is preferred over project period.
  - if end date is before --today: status=closed, contract_status=completed.
  - if start date is empty or before/equal --today, and end date is after/equal --today:
    status=active, contract_status=active.
  - paused, deleted, and already completed sites are not reopened.

Usage:
  npm run sites:complete-expired -- --email <email> --password <password>
  npm run sites:complete-expired -- --email <email> --password <password> --apply

Options:
  --token <token>       Admin bearer token. Also supports SAFETY_API_TOKEN.
  --email <email>       Login email. Also supports SAFETY_API_EMAIL.
  --password <password> Login password. Also supports SAFETY_API_PASSWORD.
  --apply               Apply PATCH updates. Omit for dry-run.
  --today <YYYY-MM-DD>  Date basis. Default: ${getKoreanTodayToken()}.
  --base-url <url>      Safety API base URL. Defaults to .env.local or ${DEFAULT_BASE_URL}.
  --limit <number>      Page size. Default: ${DEFAULT_LIMIT}.
  --verbose             Print all matched candidates.
`);
}

function parseOptions(): ScriptOptions {
  const args = process.argv.slice(2);
  if (hasArg(args, '--help') || hasArg(args, '-h')) {
    printHelp();
    process.exit(0);
  }

  const today = (getArgValue(args, '--today') || getKoreanTodayToken()).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) {
    throw new Error(`Invalid --today date: ${today}`);
  }

  const limitText = getArgValue(args, '--limit') || String(DEFAULT_LIMIT);
  const limit = Number(limitText);
  if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
    throw new Error(`Invalid --limit: ${limitText}`);
  }

  return {
    apply: hasArg(args, '--apply'),
    baseUrl: normalizeBaseUrl(getArgValue(args, '--base-url') || readConfiguredBaseUrl()),
    email: (getArgValue(args, '--email') || process.env.SAFETY_API_EMAIL || '').trim(),
    limit,
    password: getArgValue(args, '--password') || process.env.SAFETY_API_PASSWORD || '',
    today,
    token: (getArgValue(args, '--token') || process.env.SAFETY_API_TOKEN || '').trim(),
    verbose: hasArg(args, '--verbose'),
  };
}

async function login(options: ScriptOptions): Promise<string> {
  if (options.token) return options.token;
  if (!options.email || !options.password) {
    printHelp();
    throw new Error('Missing auth. Pass --token or --email/--password.');
  }

  const body = new URLSearchParams();
  body.set('username', options.email);
  body.set('password', options.password);

  const response = await fetch(`${options.baseUrl}/auth/token`, {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`POST /auth/token failed (${response.status}): ${text || response.statusText}`);
  }

  const payload = JSON.parse(text) as { access_token?: string };
  if (!payload.access_token) {
    throw new Error('POST /auth/token response did not include access_token.');
  }
  return payload.access_token;
}

async function requestJson<T>(
  options: ScriptOptions,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${options.baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${options.token}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`${init.method || 'GET'} ${path} failed (${response.status}): ${text || response.statusText}`);
  }

  return text ? (JSON.parse(text) as T) : (undefined as T);
}

function buildSitesPath(limit: number, offset: number): string {
  const params = new URLSearchParams({
    active_only: 'true',
    include_assigned_user: 'true',
    include_headquarter_detail: 'true',
    limit: String(limit),
    offset: String(offset),
  });
  return `/sites?${params.toString()}`;
}

async function fetchAllSites(options: ScriptOptions): Promise<SafetySite[]> {
  const sites: SafetySite[] = [];
  let offset = 0;

  while (true) {
    const page = await requestJson<SafetySite[]>(options, buildSitesPath(options.limit, offset));
    sites.push(...page);

    if (page.length < options.limit) return sites;
    offset += page.length;
  }
}

function normalizeDate(value: string | null | undefined): string {
  const normalized = String(value ?? '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : '';
}

function resolvePeriod(site: SafetySite): {
  endDate: string;
  endDateSource: EndDateSource | '';
  startDate: string;
  startDateSource: StartDateSource;
} {
  const contractStartDate =
    normalizeDate(site.contract_start_date) ||
    normalizeDate(site.contract_date) ||
    normalizeDate(site.contract_signed_date);
  const projectStartDate = normalizeDate(site.project_start_date);
  const contractEndDate = normalizeDate(site.contract_end_date);
  const projectEndDate = normalizeDate(site.project_end_date);

  return {
    endDate: contractEndDate || projectEndDate,
    endDateSource: contractEndDate ? 'contract_end_date' as const : projectEndDate ? 'project_end_date' as const : '',
    startDate: contractStartDate || projectStartDate,
    startDateSource: contractStartDate
      ? normalizeDate(site.contract_start_date)
        ? 'contract_start_date' as const
        : normalizeDate(site.contract_date)
          ? 'contract_date' as const
          : 'contract_signed_date' as const
      : projectStartDate
        ? 'project_start_date' as const
        : '',
  };
}

function resolveCandidate(site: SafetySite, today: string): ReconcileCandidate | null {
  if (site.is_active === false) return null;
  if (site.status === 'deleted' || site.status === 'paused') return null;
  if (site.contract_status === 'paused') return null;

  const period = resolvePeriod(site);
  if (!period.endDate || !period.endDateSource) return null;

  if (period.endDate < today) {
    if (site.status === 'closed' && site.contract_status === 'completed') return null;
    return { action: 'close', endDate: period.endDate, endDateSource: period.endDateSource, site, startDate: period.startDate, startDateSource: period.startDateSource };
  }

  const started = !period.startDate || period.startDate <= today;
  if (started && site.contract_status !== 'completed') {
    if (site.status === 'active' && site.contract_status === 'active') return null;
    return { action: 'activate', endDate: period.endDate, endDateSource: period.endDateSource, site, startDate: period.startDate, startDateSource: period.startDateSource };
  }

  return null;
}

function formatSiteLine(candidate: ReconcileCandidate, index: number): string {
  const site = candidate.site;
  const headquarterName = site.headquarter_detail?.name || site.headquarter?.name || '-';
  return [
    `${String(index + 1).padStart(4, ' ')}.`,
    candidate.action,
    site.id,
    site.site_name,
    `headquarter=${headquarterName}`,
    `status=${site.status || '-'}`,
    `contract_status=${site.contract_status || '-'}`,
    `start=${candidate.startDate || '-'}`,
    `start_source=${candidate.startDateSource || '-'}`,
    `end=${candidate.endDate}`,
    `end_source=${candidate.endDateSource}`,
  ].join(' | ');
}

async function updateCandidate(options: ScriptOptions, candidate: ReconcileCandidate): Promise<void> {
  const payload =
    candidate.action === 'close'
      ? {
          contract_status: 'completed' satisfies SiteContractStatus,
          status: 'closed' satisfies SiteStatus,
        }
      : {
          contract_status: 'active' satisfies SiteContractStatus,
          status: 'active' satisfies SiteStatus,
        };

  await requestJson<SafetySite | undefined>(
    options,
    `/sites/${encodeURIComponent(candidate.site.id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}

function countByAction(candidates: ReconcileCandidate[]) {
  return {
    activate: candidates.filter((candidate) => candidate.action === 'activate').length,
    close: candidates.filter((candidate) => candidate.action === 'close').length,
  };
}

async function main(): Promise<void> {
  const options = parseOptions();
  options.token = await login(options);

  console.log(`[site-periods] mode=${options.apply ? 'apply' : 'dry-run'}`);
  console.log(`[site-periods] baseUrl=${options.baseUrl}`);
  console.log(`[site-periods] today=${options.today}`);

  const sites = await fetchAllSites(options);
  const candidates = sites
    .map((site) => resolveCandidate(site, options.today))
    .filter((candidate): candidate is ReconcileCandidate => Boolean(candidate));
  const counts = countByAction(candidates);

  console.log(`[site-periods] fetched=${sites.length}`);
  console.log(`[site-periods] candidates=${candidates.length}`);
  console.log(`[site-periods] activate=${counts.activate}`);
  console.log(`[site-periods] close=${counts.close}`);

  if (candidates.length === 0) return;

  const previewRows = options.verbose ? candidates : candidates.slice(0, 40);
  previewRows.forEach((candidate, index) => console.log(formatSiteLine(candidate, index)));
  if (!options.verbose && candidates.length > previewRows.length) {
    console.log(`[site-periods] ...and ${candidates.length - previewRows.length} more. Use --verbose to print all.`);
  }

  if (!options.apply) {
    console.log('[site-periods] dry-run only. Re-run with --apply to update candidates.');
    return;
  }

  let updatedCount = 0;
  const failures: Array<{ candidate: ReconcileCandidate; message: string }> = [];

  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    try {
      await updateCandidate(options, candidate);
      updatedCount += 1;
      console.log(`[site-periods] updated ${index + 1}/${candidates.length}: ${candidate.action} ${candidate.site.id} ${candidate.site.site_name}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push({ candidate, message });
      console.error(`[site-periods] failed ${index + 1}/${candidates.length}: ${candidate.action} ${candidate.site.id} ${candidate.site.site_name} - ${message}`);
    }
  }

  console.log(`[site-periods] updated=${updatedCount}`);
  console.log(`[site-periods] failed=${failures.length}`);
  failures.forEach(({ candidate, message }) => {
    console.error(`[site-periods] failure | ${candidate.action} | ${candidate.site.id} | ${candidate.site.site_name} | ${message}`);
  });

  const afterSites = await fetchAllSites(options);
  const remaining = afterSites
    .map((site) => resolveCandidate(site, options.today))
    .filter((candidate): candidate is ReconcileCandidate => Boolean(candidate));
  const remainingCounts = countByAction(remaining);
  console.log(`[site-periods] remaining_candidates=${remaining.length}`);
  console.log(`[site-periods] remaining_activate=${remainingCounts.activate}`);
  console.log(`[site-periods] remaining_close=${remainingCounts.close}`);
}

main().catch((error) => {
  console.error(`[site-periods] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
