import 'server-only';

import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

import { getSafetyApiUpstreamBaseUrl } from '@/lib/safetyApi/upstream';

const execFileAsync = promisify(execFile);
const POWERSHELL_PATH = 'powershell.exe';
const HWP_AUTOMATION_MODULE = 'FilePathCheckerModuleExample';
const CONVERSION_TIMEOUT_MS = 120000;
const HANCOM_PDF_SAVE_OPTION_REGISTRY_KEY =
  'HKCU:\\Software\\HNC\\Hwp\\11.0\\PdfSaveOption\\00000207';
const HANCOM_PDF_SAVE_RANGE_VALUE_NAME = '00004001';
const HANCOM_PDF_IMAGE_QUALITY_VALUE_NAME = '0000403C';
const HANCOM_PDF_SAVE_RANGE_CURRENT_DOCUMENT = 6;
const HANCOM_PDF_IMAGE_QUALITY_MAX = 100;
const REMOTE_CONVERTER_URL_ENV_KEYS = [
  'HWPX_PDF_CONVERTER_URL',
  'WINDOWS_HWPX_PDF_CONVERTER_URL',
] as const;
const REMOTE_CONVERTER_UPSTREAM_ENV_KEYS = [
  'INSPECTION_PDF_UPSTREAM_BASE_URL',
  'NEXT_PUBLIC_INSPECTION_PDF_UPSTREAM_BASE_URL',
] as const;
const REMOTE_CONVERTER_API_KEY_ENV_KEYS = [
  'HWPX_PDF_API_KEY',
  'WINDOWS_HWPX_PDF_API_KEY',
  'SAFETY_INTERNAL_API_KEY',
  'INTERNAL_API_KEY',
] as const;
const REMOTE_WARNING_HEADER = 'x-inspection-pdf-warnings';

let conversionQueue: Promise<unknown> = Promise.resolve();
let fallbackEnvCache: Map<string, string> | null = null;

function ensureWindowsEnvironment(): void {
  if (process.platform !== 'win32') {
    throw new Error('HWPX PDF conversion is only available on Windows with Hancom Office installed.');
  }
}

function toPdfFilename(filename: string): string {
  const trimmed = filename.trim() || 'inspection-report.hwpx';
  const ext = path.extname(trimmed);
  const stem = ext ? trimmed.slice(0, -ext.length) : trimmed;
  return `${stem || 'inspection-report'}.pdf`;
}

function normalizeUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function parseEnvFileContent(content: string): Map<string, string> {
  const result = new Map<string, string>();
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }
    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }
    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result.set(key, value);
  }
  return result;
}

async function loadFallbackEnvCache(): Promise<Map<string, string>> {
  if (fallbackEnvCache) {
    return fallbackEnvCache;
  }

  const searchRoots = new Set<string>();
  let currentDir = process.cwd();
  for (let index = 0; index < 6; index += 1) {
    searchRoots.add(currentDir);
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }

  const merged = new Map<string, string>();
  for (const rootDir of searchRoots) {
    for (const fileName of ['.env.local', '.env']) {
      const candidatePath = path.join(rootDir, fileName);
      if (!(await pathExists(candidatePath))) {
        continue;
      }
      const parsed = parseEnvFileContent(await fs.readFile(candidatePath, 'utf8'));
      for (const [key, value] of parsed.entries()) {
        if (!merged.has(key)) {
          merged.set(key, value);
        }
      }
    }
  }

  fallbackEnvCache = merged;
  return merged;
}

async function readEnvValueWithFallback(envKey: string): Promise<string | null> {
  const directValue = process.env[envKey]?.trim();
  if (directValue) {
    return directValue;
  }

  const fallbackEnv = await loadFallbackEnvCache();
  const fallbackValue = fallbackEnv.get(envKey)?.trim();
  return fallbackValue || null;
}

function buildRemoteConverterUrl(baseUrl: string): string | null {
  try {
    const origin = new URL(baseUrl).origin;
    return `${origin}/api/v1/documents/inspection/pdf`;
  } catch {
    return null;
  }
}

async function getRemoteConverterUrl(): Promise<string | null> {
  for (const envKey of REMOTE_CONVERTER_URL_ENV_KEYS) {
    const configured = await readEnvValueWithFallback(envKey);
    if (configured) {
      return normalizeUrl(configured);
    }
  }

  for (const envKey of REMOTE_CONVERTER_UPSTREAM_ENV_KEYS) {
    const configured = await readEnvValueWithFallback(envKey);
    if (configured) {
      const derived = buildRemoteConverterUrl(configured);
      if (derived) {
        return derived;
      }
    }
  }

  return buildRemoteConverterUrl(getSafetyApiUpstreamBaseUrl());
}

async function getRemoteConverterApiKey(): Promise<string | null> {
  for (const envKey of REMOTE_CONVERTER_API_KEY_ENV_KEYS) {
    const configured = await readEnvValueWithFallback(envKey);
    if (configured) {
      return configured;
    }
  }

  return null;
}

async function parseRemoteConverterError(response: Response): Promise<string> {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    try {
      const payload = (await response.json()) as { error?: unknown; detail?: unknown };
      if (typeof payload.error === 'string' && payload.error.trim()) {
        return payload.error;
      }
      if (typeof payload.detail === 'string' && payload.detail.trim()) {
        return payload.detail;
      }
    } catch {
      return response.statusText || 'Remote converter request failed.';
    }
  }

  const text = await response.text();
  return text || response.statusText || 'Remote converter request failed.';
}

function getFilenameFromDisposition(header: string | null, fallback: string): string {
  if (!header) {
    return fallback;
  }

  const encodedMatch = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (encodedMatch) {
    try {
      return decodeURIComponent(encodedMatch[1]);
    } catch {
      return fallback;
    }
  }

  const match = header.match(/filename=\"([^\"]+)\"/i);
  return match?.[1]?.trim() || fallback;
}

function buildConversionScript(inputPath: string, outputPath: string): string {
  const escapedInput = inputPath.replace(/'/g, "''");
  const escapedOutput = outputPath.replace(/'/g, "''");

  return `
$ErrorActionPreference = 'Stop'
$inputPath = '${escapedInput}'
$outputPath = '${escapedOutput}'
$hwp = $null

try {
  $outputDir = Split-Path -Parent $outputPath
  if (-not (Test-Path -LiteralPath $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
  }

  $pdfOptionKey = '${HANCOM_PDF_SAVE_OPTION_REGISTRY_KEY}'
  New-Item -Path $pdfOptionKey -Force | Out-Null
  New-ItemProperty -Path $pdfOptionKey -Name '${HANCOM_PDF_SAVE_RANGE_VALUE_NAME}' -Value ${HANCOM_PDF_SAVE_RANGE_CURRENT_DOCUMENT} -PropertyType DWord -Force | Out-Null
  New-ItemProperty -Path $pdfOptionKey -Name '${HANCOM_PDF_IMAGE_QUALITY_VALUE_NAME}' -Value ${HANCOM_PDF_IMAGE_QUALITY_MAX} -PropertyType DWord -Force | Out-Null

  $hwp = New-Object -ComObject HWPFrame.HwpObject
  $null = $hwp.RegisterModule('FilePathCheckDLL', '${HWP_AUTOMATION_MODULE}')
  $null = $hwp.SetMessageBoxMode(131072)

  try {
    $hwp.XHwpWindows.Item(0).Visible = $false
  } catch {
  }

  if (-not $hwp.Open($inputPath, 'HWPX', '')) {
    throw 'Failed to open the HWPX document in Hancom Office.'
  }

  if (Test-Path -LiteralPath $outputPath) {
    Remove-Item -LiteralPath $outputPath -Force
  }

  if (-not $hwp.SaveAs($outputPath, 'PDF', '')) {
    throw 'Hancom Office did not complete the PDF SaveAs operation.'
  }

  $deadline = [DateTime]::UtcNow.AddSeconds(20)
  while ([DateTime]::UtcNow -lt $deadline) {
    if ((Test-Path -LiteralPath $outputPath) -and ((Get-Item -LiteralPath $outputPath).Length -gt 0)) {
      break
    }
    Start-Sleep -Milliseconds 250
  }

  if (-not (Test-Path -LiteralPath $outputPath)) {
    throw 'The converted PDF file was not created.'
  }

  if ((Get-Item -LiteralPath $outputPath).Length -le 0) {
    throw 'The converted PDF file is empty.'
  }
} finally {
  if ($null -ne $hwp) {
    try { $hwp.Clear(3) } catch {}
    try { $hwp.Quit() } catch {}
    try { [void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($hwp) } catch {}
  }
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}
`;
}

async function cleanupTempDir(tempDir: string): Promise<void> {
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup failures from transient Hancom file locks.
  }
}

async function convertHwpxBufferToPdfInternal(
  hwpxBuffer: Buffer,
  originalFilename: string,
): Promise<{ buffer: Buffer; filename: string }> {
  ensureWindowsEnvironment();

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'inspection-hwpx-pdf-'));
  const inputPath = path.join(tempDir, 'input.hwpx');
  const outputPath = path.join(tempDir, 'output.pdf');

  try {
    await fs.writeFile(inputPath, hwpxBuffer);

    const script = buildConversionScript(inputPath, outputPath);
    const { stderr } = await execFileAsync(
      POWERSHELL_PATH,
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script],
      {
        timeout: CONVERSION_TIMEOUT_MS,
        windowsHide: true,
      },
    );

    if (stderr?.trim()) {
      throw new Error(stderr.trim());
    }

    const pdfBuffer = await fs.readFile(outputPath);
    return {
      buffer: pdfBuffer,
      filename: toPdfFilename(originalFilename),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to convert the HWPX report to PDF.';
    throw new Error(`HWPX PDF conversion failed: ${message}`);
  } finally {
    await cleanupTempDir(tempDir);
  }
}

async function convertHwpxBufferToPdfRemotely(
  remoteUrl: string,
  apiKey: string,
  hwpxBuffer: Buffer,
  originalFilename: string,
): Promise<{ buffer: Buffer; filename: string }> {
  const formData = new FormData();
  formData.append(
    'file',
    new File([new Uint8Array(hwpxBuffer)], originalFilename || 'inspection-report.hwpx', {
      type: 'application/haansofthwpx',
    }),
  );
  formData.append('filename', originalFilename || 'inspection-report.hwpx');

  const response = await fetch(remoteUrl, {
    method: 'POST',
    headers: {
      'X-Internal-Api-Key': apiKey,
    },
    body: formData,
    cache: 'no-store',
  });

  if (!response.ok) {
    const message = await parseRemoteConverterError(response);
    throw new Error(`HWPX PDF conversion failed: ${message}`);
  }

  const warningHeader = response.headers.get(REMOTE_WARNING_HEADER);
  if (warningHeader) {
    try {
      console.warn(
        '[inspection/pdf] remote converter warnings:',
        decodeURIComponent(warningHeader),
      );
    } catch {
      console.warn('[inspection/pdf] remote converter warnings:', warningHeader);
    }
  }

  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    filename: getFilenameFromDisposition(
      response.headers.get('content-disposition'),
      toPdfFilename(originalFilename),
    ),
  };
}

export async function convertHwpxBufferToPdf(
  hwpxBuffer: Buffer,
  originalFilename: string,
): Promise<{ buffer: Buffer; filename: string }> {
  const remoteUrl = await getRemoteConverterUrl();
  if (remoteUrl) {
    const apiKey = await getRemoteConverterApiKey();
    if (!apiKey) {
      throw new Error(
        'HWPX_PDF_API_KEY or WINDOWS_HWPX_PDF_API_KEY must be configured for the remote converter.',
      );
    }
    return convertHwpxBufferToPdfRemotely(remoteUrl, apiKey, hwpxBuffer, originalFilename);
  }

  if (process.platform !== 'win32') {
    throw new Error(
      'Remote HWPX PDF converter is required outside Windows. Set HWPX_PDF_CONVERTER_URL and HWPX_PDF_API_KEY.',
    );
  }

  const task = conversionQueue.then(() =>
    convertHwpxBufferToPdfInternal(hwpxBuffer, originalFilename),
  );

  conversionQueue = task.catch(() => undefined);
  return task;
}
