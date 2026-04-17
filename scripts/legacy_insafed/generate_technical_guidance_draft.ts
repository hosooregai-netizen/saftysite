import fs from 'node:fs/promises';
import path from 'node:path';
import { createInspectionSession } from '@/constants/inspectionSession/sessionFactory';
import {
  createActivityRecord,
  createCurrentHazardFinding,
  createMeasurementCheckItem,
  createPreviousGuidanceFollowUpItem,
  createSafetyEducationRecord,
  createSiteScenePhoto,
  padDocument12Activities,
} from '@/constants/inspectionSession/itemFactory';
import type {
  GenerateTechnicalGuidanceDraftOutput,
  TechnicalGuidanceCanonicalReport,
  TechnicalGuidanceFormatContract,
} from '@/types/legacyTechnicalGuidance';

const FORMAT_CONTRACT: TechnicalGuidanceFormatContract = {
  id: 'inspection-hwpx-v8',
  rendererPath: 'server/documents/inspection/hwpx.ts',
  templatePath: 'public/templates/inspection/기술지도 수동보고서 앱 - 서식_4.annotated.v8.hwpx',
  pdfRoute: '/api/documents/inspection/pdf',
  requiredSectionOrder: ['report_meta', 'doc2', 'doc3', 'doc4', 'doc7', 'doc8'],
  requiredMetaFields: ['siteName', 'reportDate', 'drafter', 'visitRound', 'totalRounds'],
  requiredSiteSnapshotFields: [
    'siteName',
    'siteManagerName',
    'siteManagerPhone',
    'siteContactEmail',
  ],
  notes: [
    'Business-format PDF output must be rendered through the existing inspection HWPX template.',
    'Canonical JSON is a content-normalization layer, not a replacement renderer.',
    'Any production PDF should keep the template section order and slot structure deterministic.',
  ],
};

function parseArgs(argv: string[]) {
  const args = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];
    if (key.startsWith('--') && value) args.set(key, value);
  }
  return args;
}

function getSection(report: TechnicalGuidanceCanonicalReport, key: string) {
  return report.sections.find((section) => section.sectionKey === key) ?? null;
}

function getEstimatedCount(report: TechnicalGuidanceCanonicalReport, key: string, fallback: number) {
  const count = Number(getSection(report, key)?.structuredData?.estimatedItemCount ?? fallback);
  return Number.isFinite(count) && count > 0 ? Math.min(count, 12) : fallback;
}

function getFieldValue(record: Record<string, unknown>, key: string): unknown {
  return record[key];
}

function getTextValue(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'object' && 'value' in (value as Record<string, unknown>)) {
    return String((value as { value?: unknown }).value ?? '').trim();
  }
  return '';
}

function getNumberValue(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'object' && value && 'value' in (value as Record<string, unknown>)) {
    const nested = Number((value as { value?: unknown }).value ?? fallback);
    return Number.isFinite(nested) ? nested : fallback;
  }
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const canonicalPath = args.get('--canonical');
  const outputPath = args.get('--output');
  if (!canonicalPath || !outputPath) {
    throw new Error('Usage: tsx ... --canonical <file> --output <file>');
  }

  const canonical = JSON.parse(
    await fs.readFile(path.resolve(canonicalPath), 'utf-8'),
  ) as TechnicalGuidanceCanonicalReport;
  const meta = (canonical.reportMeta ?? {}) as Record<string, unknown>;
  const siteSnapshot = (canonical.siteSnapshot ?? {}) as Record<string, unknown>;
  const reportNumber = getNumberValue(getFieldValue(meta, 'visitRound'), 1) || 1;
  const session = createInspectionSession(
    {
      meta: {
        siteName: getTextValue(getFieldValue(meta, 'siteName')),
        reportDate: getTextValue(getFieldValue(meta, 'reportDate')),
        reportTitle: getTextValue(getFieldValue(meta, 'reportTitle')),
        drafter: getTextValue(getFieldValue(meta, 'drafter')),
      },
      adminSiteSnapshot: {
        siteName: getTextValue(getFieldValue(siteSnapshot, 'siteName')),
        assigneeName: getTextValue(getFieldValue(siteSnapshot, 'assigneeName')),
        siteManagerName: getTextValue(getFieldValue(siteSnapshot, 'siteManagerName')),
        siteManagerPhone: getTextValue(getFieldValue(siteSnapshot, 'siteManagerPhone')),
        siteContactEmail: getTextValue(getFieldValue(siteSnapshot, 'siteContactEmail')),
        siteAddress: getTextValue(getFieldValue(siteSnapshot, 'siteAddress')),
        companyName: getTextValue(getFieldValue(siteSnapshot, 'companyName')),
        constructionPeriod: getTextValue(getFieldValue(siteSnapshot, 'constructionPeriod')),
        constructionAmount: getTextValue(getFieldValue(siteSnapshot, 'constructionAmount')),
        corporationRegistrationNumber: getTextValue(
          getFieldValue(siteSnapshot, 'corporationRegistrationNumber'),
        ),
        businessRegistrationNumber: getTextValue(
          getFieldValue(siteSnapshot, 'businessRegistrationNumber'),
        ),
        licenseNumber: getTextValue(getFieldValue(siteSnapshot, 'licenseNumber')),
      },
    },
    `legacy-site-${canonical.legacyReportId}`,
    reportNumber,
  );

  session.document3Scenes = Array.from({ length: getEstimatedCount(canonical, 'doc3', 1) }, (_, index) =>
    createSiteScenePhoto(`전경사진 ${index + 1}`),
  );
  session.document4FollowUps = Array.from({ length: getEstimatedCount(canonical, 'doc4', 1) }, () =>
    createPreviousGuidanceFollowUpItem(),
  );
  session.document5Summary.summaryText = String(getSection(canonical, 'doc5')?.evidence?.snippetRefs?.[0]?.text ?? '');
  session.document7Findings = Array.from({ length: getEstimatedCount(canonical, 'doc7', 1) }, () =>
    createCurrentHazardFinding({ inspector: session.meta.drafter }),
  );
  session.document10Measurements = Array.from({ length: getEstimatedCount(canonical, 'doc10', 3) }, () =>
    createMeasurementCheckItem(),
  );
  session.document11EducationRecords = Array.from({ length: getEstimatedCount(canonical, 'doc11', 1) }, () =>
    createSafetyEducationRecord(),
  );
  session.document12Activities = padDocument12Activities(
    Array.from({ length: getEstimatedCount(canonical, 'doc12', 4) }, () => createActivityRecord()),
  );

  const lowConfidenceFields = [...(canonical.extractionMeta.unresolvedFields ?? [])];
  const warnings = [...(canonical.extractionMeta.qualityFlags ?? [])];
  const reviewChecklist = [
    '현장명, 지도일, 담당요원을 원본 PDF와 대조해 확인합니다.',
    '현장 기본정보(주소, 공사기간, 공사금액, 책임자 연락처)를 원본 PDF 1쪽과 대조합니다.',
    'doc5 총평 문장을 수동으로 다듬습니다.',
    'doc7 유해위험요인 건수와 주요 항목을 원본 PDF와 대조합니다.',
    '사진 슬롯(doc3/doc7/doc10/doc11/doc12)에 실제 현장 사진을 다시 연결합니다.',
  ];

  const payload: GenerateTechnicalGuidanceDraftOutput = {
    session,
    formatContract: FORMAT_CONTRACT,
    reviewChecklist,
    lowConfidenceFields,
    warnings,
  };
  await fs.mkdir(path.dirname(path.resolve(outputPath)), { recursive: true });
  await fs.writeFile(path.resolve(outputPath), `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
}

void main();
