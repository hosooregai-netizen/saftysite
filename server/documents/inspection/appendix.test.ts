import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createInspectionSession,
  createInspectionSite,
} from '@/constants/inspectionSession/sessionFactory';
import { buildInspectionHwpxDocument } from './hwpx';
import { extractInspectionAppendixSourceFromHwpxBuffer } from './appendix';

function buildSiteSessions() {
  const site = createInspectionSite({
    assigneeName: '담당자',
    customerName: '고객사',
    siteName: '테스트 현장',
  });
  const first = createInspectionSession(
    {
      adminSiteSnapshot: site.adminSiteSnapshot,
      meta: {
        drafter: '작성자',
        reportDate: '2026-04-10',
        reportTitle: '1차 기술지도 보고서',
      },
    },
    site.id,
    1,
  );
  const second = createInspectionSession(
    {
      adminSiteSnapshot: site.adminSiteSnapshot,
      meta: {
        drafter: '작성자',
        reportDate: '2026-04-24',
        reportTitle: '2차 기술지도 보고서',
      },
    },
    site.id,
    2,
  );

  return { first, second, site };
}

test('extractInspectionAppendixSourceFromHwpxBuffer strips the cover and keeps referenced assets', async () => {
  const { first, second } = buildSiteSessions();
  const document = await buildInspectionHwpxDocument(first, [first, second]);
  const appendix = await extractInspectionAppendixSourceFromHwpxBuffer(document.buffer, document);

  assert.ok(appendix.sectionXml.startsWith('<hs:sec'));
  assert.doesNotMatch(appendix.sectionXml, /\{cover\.site_name\}/);
  assert.doesNotMatch(appendix.sectionXml, /hidePageNum="1"/);
  assert.match(appendix.sectionXml, /<hp:tbl\b/);
  assert.ok(appendix.manifestItems.length > 0);
  assert.ok(appendix.manifestItems.every((item) => item.href.startsWith('BinData/')));
});
