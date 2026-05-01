import { spawn } from 'node:child_process';
import { mkdir, writeFile, appendFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { FEATURE_CONTRACT_IDS, isFeatureContractId, type FeatureContractId } from '../tests/client/featureContracts';

type CommandResult = {
  elapsedMs: number;
  exitCode: number | null;
  stderr: string;
  stdout: string;
};

type SmokeMeasurement = {
  baseUrl: string;
  elapsedMs: number;
  endedAt: string;
  exitCode: number | null;
  feature: FeatureContractId;
  iteration: number;
  ok: boolean;
  reportedElapsedMs: number | null;
  startedAt: string;
  stderrTail: string;
  stdoutTail: string;
  type: 'client-smoke';
};

type LiveProbeMeasurement = {
  elapsedMs: number;
  endedAt: string;
  exitCode: number | null;
  iteration: number;
  missingEnv?: string[];
  ok: boolean;
  skipped?: boolean;
  startedAt: string;
  stderrTail: string;
  stdoutTail: string;
  type: 'api-live-probe';
};

type Measurement = SmokeMeasurement | LiveProbeMeasurement;

type CliOptions = {
  baseUrl: string;
  durationMs: number;
  features: FeatureContractId[];
  includeLiveProbe: boolean;
  maxIterations: number | null;
  outputDir: string;
  sleepMs: number;
  stopOnFailure: boolean;
};

const DEFAULT_BASE_URL = 'http://127.0.0.1:3100';
const DEFAULT_SLEEP_MS = 15_000;
const LIVE_PROBE_ENV = ['LIVE_SAFETY_EMAIL', 'LIVE_SAFETY_PASSWORD', 'LIVE_SAFETY_SITE_ID'];

function readNumberEnv(name: string): number | null {
  const raw = process.env[name]?.trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function splitFeatures(raw: string): FeatureContractId[] {
  const features: FeatureContractId[] = [];
  for (const value of raw.split(',').map((item) => item.trim()).filter(Boolean)) {
    if (!isFeatureContractId(value)) {
      throw new Error(`Unknown feature "${value}". Available: ${FEATURE_CONTRACT_IDS.join(', ')}`);
    }
    features.push(value);
  }
  return [...new Set(features)];
}

function readFlagEnv(name: string): boolean {
  return process.env[name]?.trim() === '1';
}

function hasLiveProbeEnv() {
  return LIVE_PROBE_ENV.every((name) => Boolean(process.env[name]?.trim()));
}

function parseArgs(argv: string[]): CliOptions {
  const positional: string[] = [];
  let baseUrl = process.env.PLAYWRIGHT_BASE_URL?.trim() || DEFAULT_BASE_URL;
  let durationMs = readNumberEnv('QA_BOTTLENECK_DURATION_MS') ?? 0;
  let features = process.env.QA_BOTTLENECK_FEATURES?.trim()
    ? splitFeatures(process.env.QA_BOTTLENECK_FEATURES)
    : [...FEATURE_CONTRACT_IDS];
  let includeLiveProbe = readFlagEnv('QA_BOTTLENECK_INCLUDE_LIVE_PROBE') || hasLiveProbeEnv();
  let maxIterations = readNumberEnv('QA_BOTTLENECK_MAX_ITERATIONS');
  let outputDir = process.env.QA_BOTTLENECK_OUTPUT_DIR?.trim() || '.qa-bottleneck';
  let sleepMs = readNumberEnv('QA_BOTTLENECK_SLEEP_MS') ?? DEFAULT_SLEEP_MS;
  let stopOnFailure = readFlagEnv('QA_BOTTLENECK_STOP_ON_FAILURE');

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      const value = argv[index + 1];
      if (!value) throw new Error(`Missing value for ${arg}`);
      index += 1;
      return value;
    };

    if (arg === '--base-url') {
      baseUrl = next();
    } else if (arg.startsWith('--base-url=')) {
      baseUrl = arg.slice('--base-url='.length);
    } else if (arg === '--duration-ms') {
      durationMs = Number(next());
    } else if (arg.startsWith('--duration-ms=')) {
      durationMs = Number(arg.slice('--duration-ms='.length));
    } else if (arg === '--features') {
      features = splitFeatures(next());
    } else if (arg.startsWith('--features=')) {
      features = splitFeatures(arg.slice('--features='.length));
    } else if (arg === '--include-live-probe') {
      includeLiveProbe = true;
    } else if (arg === '--max-iterations') {
      maxIterations = Number(next());
    } else if (arg.startsWith('--max-iterations=')) {
      maxIterations = Number(arg.slice('--max-iterations='.length));
    } else if (arg === '--output-dir') {
      outputDir = next();
    } else if (arg.startsWith('--output-dir=')) {
      outputDir = arg.slice('--output-dir='.length);
    } else if (arg === '--sleep-ms') {
      sleepMs = Number(next());
    } else if (arg.startsWith('--sleep-ms=')) {
      sleepMs = Number(arg.slice('--sleep-ms='.length));
    } else if (arg === '--stop-on-failure') {
      stopOnFailure = true;
    } else {
      positional.push(arg);
    }
  }

  if (positional.length > 0) {
    features = splitFeatures(positional.join(','));
  }

  if (!Number.isFinite(durationMs) || durationMs < 0) {
    throw new Error('--duration-ms must be a positive number or 0.');
  }
  if (maxIterations != null && (!Number.isFinite(maxIterations) || maxIterations <= 0)) {
    throw new Error('--max-iterations must be a positive number.');
  }
  if (!Number.isFinite(sleepMs) || sleepMs < 0) {
    throw new Error('--sleep-ms must be a positive number or 0.');
  }
  if (features.length === 0) {
    throw new Error('At least one feature must be selected.');
  }
  if (maxIterations == null && durationMs === 0) {
    maxIterations = 1;
  }

  return {
    baseUrl,
    durationMs,
    features,
    includeLiveProbe,
    maxIterations,
    outputDir,
    sleepMs,
    stopOnFailure,
  };
}

function bin(name: string) {
  return process.platform === 'win32' ? `${name}.cmd` : name;
}

function tail(value: string, maxLength = 4_000) {
  return value.length <= maxLength ? value : value.slice(value.length - maxLength);
}

async function runProcess(command: string, args: string[], env: NodeJS.ProcessEnv): Promise<CommandResult> {
  const startedAt = performance.now();

  return await new Promise((resolvePromise) => {
    const spawnCommand = process.platform === 'win32' && command.endsWith('.cmd') ? 'cmd.exe' : command;
    const spawnArgs =
      process.platform === 'win32' && command.endsWith('.cmd')
        ? ['/d', '/s', '/c', command, ...args]
        : args;
    const child = spawn(spawnCommand, spawnArgs, {
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', (error) => {
      stderr += `${error instanceof Error ? error.message : String(error)}\n`;
      resolvePromise({
        elapsedMs: Math.round(performance.now() - startedAt),
        exitCode: 1,
        stderr,
        stdout,
      });
    });
    child.on('close', (exitCode) => {
      resolvePromise({
        elapsedMs: Math.round(performance.now() - startedAt),
        exitCode,
        stderr,
        stdout,
      });
    });
  });
}

function parseReportedSmokeDuration(stdout: string, feature: FeatureContractId): number | null {
  const pattern = new RegExp(`\\[client-smoke\\] PASS ${feature} \\((\\d+)ms\\)`);
  const match = stdout.match(pattern);
  return match ? Number(match[1]) : null;
}

async function runSmokeFeature(input: {
  baseUrl: string;
  feature: FeatureContractId;
  iteration: number;
}): Promise<SmokeMeasurement> {
  const startedAt = new Date();
  const result = await runProcess(bin('npx'), ['tsx', 'tests/client/runSmoke.ts', input.feature], {
    ...process.env,
    PLAYWRIGHT_BASE_URL: input.baseUrl,
  });
  const endedAt = new Date();

  return {
    baseUrl: input.baseUrl,
    elapsedMs: result.elapsedMs,
    endedAt: endedAt.toISOString(),
    exitCode: result.exitCode,
    feature: input.feature,
    iteration: input.iteration,
    ok: result.exitCode === 0,
    reportedElapsedMs: parseReportedSmokeDuration(result.stdout, input.feature),
    startedAt: startedAt.toISOString(),
    stderrTail: tail(result.stderr),
    stdoutTail: tail(result.stdout),
    type: 'client-smoke',
  };
}

function missingLiveProbeEnv() {
  return LIVE_PROBE_ENV.filter((name) => !process.env[name]?.trim());
}

async function runLiveProbe(iteration: number): Promise<LiveProbeMeasurement> {
  const missingEnv = missingLiveProbeEnv();
  const startedAt = new Date();

  if (missingEnv.length > 0) {
    return {
      elapsedMs: 0,
      endedAt: new Date().toISOString(),
      exitCode: null,
      iteration,
      missingEnv,
      ok: true,
      skipped: true,
      startedAt: startedAt.toISOString(),
      stderrTail: '',
      stdoutTail: `[qa-bottleneck] skipped api live probe; missing ${missingEnv.join(', ')}`,
      type: 'api-live-probe',
    };
  }

  const result = await runProcess(bin('npx'), ['tsx', 'scripts/probeSafetyApiLive.ts'], {
    ...process.env,
  });
  return {
    elapsedMs: result.elapsedMs,
    endedAt: new Date().toISOString(),
    exitCode: result.exitCode,
    iteration,
    ok: result.exitCode === 0,
    startedAt: startedAt.toISOString(),
    stderrTail: tail(result.stderr),
    stdoutTail: tail(result.stdout),
    type: 'api-live-probe',
  };
}

async function sleep(ms: number) {
  await new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

function percentile(values: number[], ratio: number) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.max(0, Math.ceil(sorted.length * ratio) - 1);
  return sorted[index];
}

function summarize(records: Measurement[], input: {
  baseUrl: string;
  durationMs: number;
  features: FeatureContractId[];
  jsonlPath: string;
  startedAt: string;
}) {
  const smoke = records.filter((record): record is SmokeMeasurement => record.type === 'client-smoke');
  const liveProbes = records.filter((record): record is LiveProbeMeasurement => record.type === 'api-live-probe');
  const byFeature = input.features.map((feature) => {
    const featureRecords = smoke.filter((record) => record.feature === feature);
    const elapsed = featureRecords.map((record) => record.reportedElapsedMs ?? record.elapsedMs);
    return {
      avgMs: elapsed.length > 0
        ? Math.round(elapsed.reduce((sum, value) => sum + value, 0) / elapsed.length)
        : null,
      failureCount: featureRecords.filter((record) => !record.ok).length,
      feature,
      maxMs: elapsed.length > 0 ? Math.max(...elapsed) : null,
      minMs: elapsed.length > 0 ? Math.min(...elapsed) : null,
      p95Ms: percentile(elapsed, 0.95),
      runCount: featureRecords.length,
    };
  });

  const slowestRuns = [...smoke]
    .sort((left, right) => {
      const leftElapsed = left.reportedElapsedMs ?? left.elapsedMs;
      const rightElapsed = right.reportedElapsedMs ?? right.elapsedMs;
      return rightElapsed - leftElapsed;
    })
    .slice(0, 10)
    .map((record) => ({
      elapsedMs: record.reportedElapsedMs ?? record.elapsedMs,
      feature: record.feature,
      iteration: record.iteration,
      ok: record.ok,
      startedAt: record.startedAt,
    }));

  return {
    baseUrl: input.baseUrl,
    durationMs: input.durationMs,
    endedAt: new Date().toISOString(),
    failureCount: records.filter((record) => !record.ok).length,
    features: input.features,
    jsonlPath: input.jsonlPath,
    liveProbe: {
      failureCount: liveProbes.filter((record) => !record.ok).length,
      runCount: liveProbes.length,
      skippedCount: liveProbes.filter((record) => record.skipped).length,
    },
    smoke: {
      byFeature,
      failureCount: smoke.filter((record) => !record.ok).length,
      runCount: smoke.length,
      slowestRuns,
    },
    startedAt: input.startedAt,
  };
}

function printSummary(summary: ReturnType<typeof summarize>) {
  console.log('[qa-bottleneck] summary');
  console.log(`[qa-bottleneck] smoke runs=${summary.smoke.runCount}, failures=${summary.smoke.failureCount}`);
  for (const row of summary.smoke.byFeature) {
    console.log(
      `[qa-bottleneck] ${row.feature}: runs=${row.runCount}, avg=${row.avgMs ?? '-'}ms, p95=${row.p95Ms ?? '-'}ms, max=${row.maxMs ?? '-'}ms, failures=${row.failureCount}`,
    );
  }
  if (summary.liveProbe.runCount > 0) {
    console.log(
      `[qa-bottleneck] api live probe runs=${summary.liveProbe.runCount}, skipped=${summary.liveProbe.skippedCount}, failures=${summary.liveProbe.failureCount}`,
    );
  }
  console.log(`[qa-bottleneck] logs=${summary.jsonlPath}`);
}

function makeStamp(date: Date) {
  return date.toISOString().replace(/[:.]/g, '-');
}

async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  const outputDir = resolve(options.outputDir);
  await mkdir(outputDir, { recursive: true });

  const startedAt = new Date();
  const jsonlPath = join(outputDir, `qa-bottleneck-${makeStamp(startedAt)}.jsonl`);
  const summaryPath = join(outputDir, `qa-bottleneck-${makeStamp(startedAt)}.summary.json`);
  const records: Measurement[] = [];
  const deadline = options.durationMs > 0 ? Date.now() + options.durationMs : null;
  let iteration = 0;

  console.log(`[qa-bottleneck] baseUrl=${options.baseUrl}`);
  console.log(`[qa-bottleneck] features=${options.features.join(', ')}`);
  console.log(`[qa-bottleneck] output=${jsonlPath}`);

  while (true) {
    iteration += 1;
    console.log(`[qa-bottleneck] iteration ${iteration} start`);

    for (const feature of options.features) {
      console.log(`[qa-bottleneck] smoke start ${feature}`);
      const record = await runSmokeFeature({
        baseUrl: options.baseUrl,
        feature,
        iteration,
      });
      records.push(record);
      await appendFile(jsonlPath, `${JSON.stringify(record)}\n`);
      console.log(
        `[qa-bottleneck] smoke ${record.ok ? 'pass' : 'fail'} ${feature} ${record.reportedElapsedMs ?? record.elapsedMs}ms`,
      );
      if (!record.ok && options.stopOnFailure) {
        break;
      }
    }

    if (options.includeLiveProbe) {
      const record = await runLiveProbe(iteration);
      records.push(record);
      await appendFile(jsonlPath, `${JSON.stringify(record)}\n`);
      console.log(
        `[qa-bottleneck] api-live ${record.skipped ? 'skip' : record.ok ? 'pass' : 'fail'} ${record.elapsedMs}ms`,
      );
    }

    if (options.stopOnFailure && records.some((record) => !record.ok)) {
      break;
    }
    if (options.maxIterations != null && iteration >= options.maxIterations) {
      break;
    }
    if (deadline != null && Date.now() >= deadline) {
      break;
    }
    await sleep(options.sleepMs);
  }

  const summary = summarize(records, {
    baseUrl: options.baseUrl,
    durationMs: options.durationMs,
    features: options.features,
    jsonlPath,
    startedAt: startedAt.toISOString(),
  });
  await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
  printSummary(summary);

  if (summary.failureCount > 0) {
    process.exitCode = 1;
  }
}

void main().catch((error) => {
  console.error('[qa-bottleneck] failed', error);
  process.exitCode = 1;
});
