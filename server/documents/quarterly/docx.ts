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
    site.siteName || report.siteId || 'quarterly-report',
    'quarterly-report'
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
      1
    ),
  ].join('');
}

function futurePlanTable(report: QuarterlySummaryReport) {
  return gridTable(
    [
      ['향후 주요 작업공정', '유해·위험요인', '안전대책', '비고'],
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
    1
  );
}

function implementationTable(report: QuarterlySummaryReport) {
  return gridTable(
    [
      ['실시일', '차수', '작성자', '공정율', '지적 건수', '개선 건수'],
      ...(report.implementationRows.length > 0
        ? report.implementationRows.map((item) => [
            formatDate(item.reportDate),
            String(item.reportNumber || '-'),
            item.drafter || '-',
            item.progressRate || '-',
            String(item.findingCount),
            String(item.improvedCount),
          ])
        : [['-', '-', '-', '-', '0', '0']]),
    ],
    [1600, 1000, 1800, 1300, 1500, 2000],
    1
  );
}

function measuresBlock(report: QuarterlySummaryReport) {
  if (report.majorMeasures.length === 0) {
    return paragraph('대표 안전대책이 아직 없습니다.');
  }

  return report.majorMeasures
    .map((item, index) => paragraph(`${index + 1}. ${item}`))
    .join('');
}

function buildQuarterlyWordBody(report: QuarterlySummaryReport, site: InspectionSite) {
  const snapshot = site.adminSiteSnapshot;

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
      paragraph(`작성자: ${report.drafter || '-'}`, { align: 'center' }),
      pageBreak(),
      sectionHeading('1. 기술지도 대상사업장'),
      twoColTable([
        { label: '현장명', value: snapshot.siteName || site.siteName || '-' },
        { label: '고객사', value: snapshot.customerName || '-' },
        { label: '사업장관리번호', value: snapshot.siteManagementNumber || '-' },
        { label: '사업개시번호', value: snapshot.businessStartNumber || '-' },
        { label: '공사기간', value: snapshot.constructionPeriod || '-' },
        { label: '공사금액', value: snapshot.constructionAmount || '-' },
        { label: '책임자', value: snapshot.siteManagerName || '-' },
        { label: '연락처', value: snapshot.siteContactEmail || '-' },
        { label: '현장주소', value: snapshot.siteAddress || '-' },
      ]),
      sectionHeading('2. 통계분석(누계)'),
      countTable('재해유형별 분석', report.accidentStats),
      paragraph(' ', { spacingAfter: 80 }),
      countTable('기인물별 분석', report.causativeStats),
      sectionHeading('3. 기술지도 총평'),
      noteBox(report.overallComment || '총평이 아직 없습니다.'),
      sectionHeading('4. 기술지도 이행현황'),
      implementationTable(report),
      sectionHeading('5. 향 후 공정 유해·위험요인 및 대책'),
      futurePlanTable(report),
      sectionHeading('6. 주요 유해·위험작업 안전대책'),
      measuresBlock(report),
    ].join('')
  );
}

export async function buildQuarterlyWordDocument(
  report: QuarterlySummaryReport,
  site: InspectionSite
) {
  return buildWordDocumentArchive({
    body: buildQuarterlyWordBody(report, site),
    filename: fileNameForQuarterlyReport(report, site),
    title: '분기 종합보고서',
  });
}
