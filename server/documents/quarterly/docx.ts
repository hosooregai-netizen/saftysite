import 'server-only';

import type { QuarterlySummaryReport } from '@/types/erpReports';
import type { InspectionSite } from '@/types/inspectionSession';
import {
  buildWordDocumentArchive,
  sanitizeWordFileName,
} from '@/server/documents/sharedDocx';
import {
  buildDocumentXml,
  gridTable,
  noteBox,
  pageBreak,
  paragraph,
  sectionHeading,
  subsectionHeading,
  titleBox,
  twoColTable,
} from '@/server/documents/inspection/ooxml';
import { formatDate } from '@/server/documents/inspection/format';

function fileNameForQuarterlyReport(report: QuarterlySummaryReport, site: InspectionSite) {
  const siteName = sanitizeWordFileName(
    report.siteSnapshot.siteName || site.siteName || report.siteId || 'quarterly-report',
    'quarterly-report',
  );
  return `${siteName}-${report.quarterKey}-분기종합보고서.docx`;
}

function countTable(title: string, rows: Array<{ label: string; count: number }>) {
  return [
    subsectionHeading(title),
    gridTable(
      [
        ['구분', '건수'],
        ...(rows.length > 0
          ? rows.map((item) => [item.label, String(item.count)])
          : [['자료 없음', '0']]),
      ],
      [6200, 3000],
      1,
    ),
  ].join('');
}

function futurePlanTable(report: QuarterlySummaryReport) {
  return gridTable(
    [
      ['향후 주요 작업공정', '유해위험요인', '안전대책', '비고'],
      ...(report.futurePlans.length > 0
        ? report.futurePlans.map((item) => [
            item.processName || '-',
            item.hazard || '-',
            item.countermeasure || '-',
            item.note || '-',
          ])
        : [['-', '-', '-', '-']]),
    ],
    [1800, 2500, 3300, 1600],
    1,
  );
}

function implementationTable(report: QuarterlySummaryReport) {
  return gridTable(
    [
      ['실시일', '차수', '담당자', '공정률', '지적 건수', '개선 건수', '비고'],
      ...(report.implementationRows.length > 0
        ? report.implementationRows.map((item) => [
            formatDate(item.reportDate),
            String(item.reportNumber || '-'),
            item.drafter || '-',
            item.progressRate || '-',
            String(item.findingCount),
            String(item.improvedCount),
            item.note || '-',
          ])
        : [['-', '-', '-', '-', '0', '0', '-']]),
    ],
    [1400, 900, 1600, 1200, 1300, 1400, 1800],
    1,
  );
}

function opsSection(report: QuarterlySummaryReport) {
  if (!report.opsAssetId) {
    return noteBox('관리자 보완 대기 중입니다. 연결된 OPS / One Point Sheet 자료가 없습니다.');
  }

  return [
    paragraph(report.opsAssetTitle || 'OPS 자료', { bold: true, spacingAfter: 80 }),
    report.opsAssetDescription
      ? noteBox(report.opsAssetDescription)
      : noteBox('설명 없이 자료만 연결되었습니다.'),
    paragraph(
      report.opsAssetFileUrl
        ? `자료 링크: ${report.opsAssetFileUrl}`
        : '자료 링크 정보가 없습니다.',
      { spacingBefore: 80 },
    ),
    paragraph(
      report.opsAssignedBy
        ? `연결자 ${report.opsAssignedBy} / 연결 시각: ${report.opsAssignedAt || '-'}`
        : '연결 정보 없음',
    ),
  ].join('');
}

function buildQuarterlyWordBody(report: QuarterlySummaryReport, site: InspectionSite) {
  const snapshot = report.siteSnapshot;

  return buildDocumentXml(
    [
      titleBox('분기 종합보고서'),
      paragraph(' ', { spacingAfter: 200 }),
      paragraph(report.title, { align: 'center', bold: true, size: 30, spacingAfter: 120 }),
      paragraph(snapshot.siteName || site.siteName || '-', {
        align: 'center',
        spacingAfter: 80,
      }),
      paragraph(`${report.year}년 ${report.quarter}분기`, {
        align: 'center',
        spacingAfter: 160,
      }),
      paragraph(`작성자 ${report.drafter || '-'}`, { align: 'center' }),
      pageBreak(),
      sectionHeading('1. 기술지도 대상사업장'),
      twoColTable([
        { label: '현장명', value: snapshot.siteName || '-' },
        { label: '고객사', value: snapshot.customerName || '-' },
        { label: '사업장관리번호', value: snapshot.siteManagementNumber || '-' },
        { label: '사업개시번호', value: snapshot.businessStartNumber || '-' },
        { label: '공사기간', value: snapshot.constructionPeriod || '-' },
        { label: '공사금액', value: snapshot.constructionAmount || '-' },
        { label: '책임자', value: snapshot.siteManagerName || '-' },
        { label: '연락처(이메일)', value: snapshot.siteContactEmail || '-' },
        { label: '현장주소', value: snapshot.siteAddress || '-' },
        { label: '회사명', value: snapshot.companyName || '-' },
        { label: '법인등록번호', value: snapshot.corporationRegistrationNumber || '-' },
        { label: '사업자등록번호', value: snapshot.businessRegistrationNumber || '-' },
        { label: '면허번호', value: snapshot.licenseNumber || '-' },
        { label: '본사 연락처', value: snapshot.headquartersContact || '-' },
        { label: '본사 주소', value: snapshot.headquartersAddress || '-' },
      ]),
      sectionHeading('2. 통계분석(누계)'),
      countTable('지적유형별 분석', report.accidentStats),
      paragraph(' ', { spacingAfter: 80 }),
      countTable('기인물별 분석', report.causativeStats),
      sectionHeading('3. 기술지도 총평'),
      noteBox(report.overallComment || '총평이 아직 없습니다.'),
      sectionHeading('4. 기술지도 이행현황'),
      implementationTable(report),
      sectionHeading('5. 향후 공정 유해위험요인 및 대책'),
      futurePlanTable(report),
      sectionHeading('6. OPS / One Point Sheet'),
      opsSection(report),
    ].join(''),
  );
}

export async function buildQuarterlyWordDocument(
  report: QuarterlySummaryReport,
  site: InspectionSite,
) {
  return buildWordDocumentArchive({
    body: buildQuarterlyWordBody(report, site),
    filename: fileNameForQuarterlyReport(report, site),
    title: '분기 종합보고서',
  });
}
