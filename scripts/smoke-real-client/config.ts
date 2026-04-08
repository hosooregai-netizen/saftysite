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
export const assistUploadName = `assist-upload-${Date.now()}.png`;
const excelImportSuffix = `${Date.now()}`;
export const excelImportHeadquarterName = `테스트 본사 ${excelImportSuffix}`;
export const excelImportSiteName = `테스트 현장 ${excelImportSuffix}`;
export const excelImportManagementNumber = `SMOKE-EXCEL-${excelImportSuffix}`;
const excelImportBusinessNumber = `111-22-${excelImportSuffix.slice(-5)}`;

export const uploadBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAIAAACQKrqGAAAAGElEQVR42mP8z/CfAQgwYKShoYGJAQoA0CIAjF7Q4x8AAAAASUVORK5CYII=',
  'base64',
);

function buildExcelImportWorkbookBuffer() {
  const pythonPath =
    process.env.SMOKE_PYTHON_PATH ||
    '/Users/mac_mini/Documents/GitHub/safety-server/.venv/bin/python';
  const workbookPath = path.join(os.tmpdir(), `excel-import-smoke-${excelImportSuffix}.xlsx`);
  const workbookScript = `
from openpyxl import Workbook

path = ${JSON.stringify(workbookPath)}
workbook = Workbook()
sheet = workbook.active
sheet.title = "업로드"
sheet.append([
    "사업장명", "사업자등록번호", "현장명", "관리번호", "착공일",
    "준공일", "계약일", "총회차", "회차당 금액", "총 계약금액",
])
sheet.append([
    ${JSON.stringify(excelImportHeadquarterName)},
    ${JSON.stringify(excelImportBusinessNumber)},
    ${JSON.stringify(excelImportSiteName)},
    ${JSON.stringify(excelImportManagementNumber)},
    "2026-04-01", "2026-04-30", "2026-04-01", 3, 250000, 750000,
])
workbook.save(path)
print(path)
`;

  execFileSync(pythonPath, ['-c', workbookScript], { stdio: 'inherit' });
  return fs.readFileSync(workbookPath);
}

export const excelImportWorkbookBuffer = buildExcelImportWorkbookBuffer();
