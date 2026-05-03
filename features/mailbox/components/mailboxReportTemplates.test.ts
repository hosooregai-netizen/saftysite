import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getMailReportTemplate,
  renderMailReportTemplate,
} from './mailboxReportTemplates';
import type { SelectedReportContext } from './mailboxPanelTypes';

function buildReport(overrides: Partial<SelectedReportContext> = {}): SelectedReportContext {
  return {
    assigneeName: '홍길동',
    attachmentReady: true,
    attachmentUnavailableReason: '',
    documentKind: null,
    headquarterId: 'hq-1',
    headquarterName: '시공사',
    meta: {},
    originalPdfAvailable: true,
    originalPdfDownloadPath: '',
    recipientEmail: 'site@example.com',
    reportKey: 'report-1',
    reportType: 'technical_guidance',
    reportTitle: '기술지도 보고서',
    siteId: 'site-1',
    siteName: '구의동 신축공사',
    totalRound: 8,
    updatedAt: '2026-05-04T09:00:00+09:00',
    visitDate: '2026-05-04',
    visitRound: 3,
    workflowStatus: 'submitted',
    ...overrides,
  };
}

test('default report mail template renders the requested guidance report format', () => {
  const rendered = renderMailReportTemplate(getMailReportTemplate('default'), [buildReport()]);

  assert.equal(
    rendered.subject,
    '한국종합안전(홍길동)구의동 신축공사 - 기술지도 결과보고서(03회차)',
  );
  assert.match(rendered.body, /안녕하세요, 한국종합안전\(주\) 홍길동 입니다\./);
  assert.match(rendered.body, /① 현장명 : 구의동 신축공사/);
  assert.match(rendered.body, /② 회차 : 지도회차 3 \/ 계약회차 8/);
  assert.match(rendered.body, /③ 지도일자 : 2026\.  05\.  04\./);
  assert.match(rendered.body, /T\. 02-454-4541/);
  assert.match(rendered.body, /E\. hts27@safetysite\.co\.kr/);
});
