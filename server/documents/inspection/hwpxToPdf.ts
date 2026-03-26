import 'server-only';

import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const POWERSHELL_PATH = 'powershell.exe';
const HWP_AUTOMATION_MODULE = 'FilePathCheckerModuleExample';
const CONVERSION_TIMEOUT_MS = 120000;

let conversionQueue: Promise<unknown> = Promise.resolve();

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

export async function convertHwpxBufferToPdf(
  hwpxBuffer: Buffer,
  originalFilename: string,
): Promise<{ buffer: Buffer; filename: string }> {
  const task = conversionQueue.then(() =>
    convertHwpxBufferToPdfInternal(hwpxBuffer, originalFilename),
  );

  conversionQueue = task.catch(() => undefined);
  return task;
}
