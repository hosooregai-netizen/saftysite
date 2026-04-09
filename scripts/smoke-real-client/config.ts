import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export interface SmokeSeed {
  adminEmail: string;
  adminPassword: string;
  workerEmail: string;
  workerPassword: string;
  site1Id: string;
  site2Id: string;
}

const seedPath = process.env.SMOKE_SEED_PATH || '/tmp/safety-e2e-seed.json';
export const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8')) as SmokeSeed;
export const baseUrl = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3100';

export const uploadName = `worker-upload-${Date.now()}.png`;
const k2bSuffix = `${Date.now()}`;
export const k2bHeadquarterName = `테스트 본사 ${k2bSuffix}`;
export const k2bSiteName = `테스트 현장 ${k2bSuffix}`;
export const k2bManagementNumber = `SMOKE-K2B-${k2bSuffix}`;
const k2bBusinessNumber = `111-22-${k2bSuffix.slice(-5)}`;
export const excelImportHeadquarterName = k2bHeadquarterName;
export const excelImportSiteName = k2bSiteName;
export const excelImportManagementNumber = k2bManagementNumber;

export const uploadBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAIAAACQKrqGAAAAGElEQVR42mP8z/CfAQgwYKShoYGJAQoA0CIAjF7Q4x8AAAAASUVORK5CYII=',
  'base64',
);

function buildK2bWorkbookBuffer() {
  const pythonPath =
    process.env.SMOKE_PYTHON_PATH ||
    '/Users/mac_mini/Documents/GitHub/safety-server/.venv/bin/python';
  const workbookPath = path.join(os.tmpdir(), `k2b-smoke-${k2bSuffix}.xlsx`);
  const workbookScript = `
from openpyxl import Workbook

path = ${JSON.stringify(workbookPath)}
workbook = Workbook()
sheet = workbook.active
sheet.title = "K2B"
sheet.append([
    "사업장명", "사업자등록번호", "현장명", "관리번호", "착공일",
    "준공일", "계약일", "총회차", "회차당 금액", "총 계약금액",
])
sheet.append([
    ${JSON.stringify(k2bHeadquarterName)},
    ${JSON.stringify(k2bBusinessNumber)},
    ${JSON.stringify(k2bSiteName)},
    ${JSON.stringify(k2bManagementNumber)},
    "2026-04-01", "2026-04-30", "2026-04-01", 3, 250000, 750000,
])
workbook.save(path)
print(path)
`;

  execFileSync(pythonPath, ['-c', workbookScript], { stdio: 'inherit' });
  return fs.readFileSync(workbookPath);
}

export const k2bWorkbookBuffer = buildK2bWorkbookBuffer();
export const excelImportWorkbookBuffer = k2bWorkbookBuffer;
