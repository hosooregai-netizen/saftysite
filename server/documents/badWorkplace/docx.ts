import 'server-only';

import type { BadWorkplaceReport } from '@/types/erpReports';
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
  titleBox,
  twoColTable,
} from '@/server/documents/inspection/ooxml';
import { formatDate } from '@/server/documents/inspection/format';

function fileNameForBadWorkplaceReport(report: BadWorkplaceReport, site: InspectionSite) {
  const siteName = sanitizeWordFileName(
    site.siteName || report.siteId || 'bad-workplace-report',
    'bad-workplace-report'
  );
  return `${siteName}-${report.reportMonth}-불량사업장신고서.docx`;
}

function violationTable(report: BadWorkplaceReport) {
  return gridTable(
    [
      ['관련 법칙', '유해위험요인', '개선지시 사항', '불이행 사항', '확인일'],
      ...(report.violations.length > 0
        ? report.violations.map((item) => [
            item.legalReference || '-',
            item.hazardFactor || '-',
            item.improvementMeasure || '-',
            item.nonCompliance || '-',
            formatDate(item.confirmationDate),
          ])
        : [['-', '-', '-', '-', '-']]),
    ],
    [1800, 1900, 2200, 2200, 1100],
    1
  );
}

function buildBadWorkplaceWordBody(report: BadWorkplaceReport, site: InspectionSite) {
  const snapshot = site.adminSiteSnapshot;

  return buildDocumentXml(
    [
      titleBox('기술지도 개선지시 불이행 사항 통보'),
      paragraph(' ', { spacingAfter: 200 }),
      paragraph(report.title, { align: 'center', bold: true, size: 28, spacingAfter: 120 }),
      paragraph(snapshot.siteName || site.siteName || '-', {
        align: 'center',
        spacingAfter: 80,
      }),
      paragraph(`작성월 ${report.reportMonth}`, { align: 'center', spacingAfter: 80 }),
      paragraph(`작성자 ${report.reporterName || '-'}`, { align: 'center' }),
      pageBreak(),
      sectionHeading('1. 기본 정보'),
      twoColTable([
        { label: '기술지도 대상사업장', value: snapshot.customerName || '-' },
        { label: '현장명', value: snapshot.siteName || site.siteName || '-' },
        { label: '사업장관리번호', value: snapshot.siteManagementNumber || '-' },
        { label: '사업개시번호', value: snapshot.businessStartNumber || '-' },
        { label: '공사기간', value: report.contractPeriod || snapshot.constructionPeriod || '-' },
        { label: '공정률', value: report.progressRate || '-' },
        { label: '공사금액', value: snapshot.constructionAmount || '-' },
        { label: '책임자/수신처', value: report.receiverName || snapshot.siteManagerName || '-' },
        { label: '연락처', value: snapshot.siteContactEmail || '-' },
        { label: '현장주소', value: snapshot.siteAddress || '-' },
      ]),
      sectionHeading('2. 지도기관 정보'),
      twoColTable([
        { label: '기관명', value: report.agencyName || '-' },
        { label: '대표자', value: report.agencyRepresentative || '-' },
        { label: '소재지', value: report.agencyAddress || '-' },
        { label: '연락처', value: report.agencyContact || '-' },
        { label: '기술지도 실시 횟수', value: report.implementationCount || '-' },
        { label: '원본 보고서', value: report.sourceSessionId || '-' },
      ]),
      sectionHeading('3. 불이행 사항'),
      violationTable(report),
      sectionHeading('4. 비고'),
      noteBox(report.note || '비고 없음'),
    ].join('')
  );
}

export async function buildBadWorkplaceWordDocument(
  report: BadWorkplaceReport,
  site: InspectionSite
) {
  return buildWordDocumentArchive({
    body: buildBadWorkplaceWordBody(report, site),
    filename: fileNameForBadWorkplaceReport(report, site),
    title: '기술지도 개선지시 불이행 사항 통보',
  });
}
