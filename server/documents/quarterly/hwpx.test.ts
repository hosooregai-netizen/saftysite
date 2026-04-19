import assert from 'node:assert/strict';
import test from 'node:test';

import JSZip from 'jszip';

import {
  createInspectionSession,
  createInspectionSite,
} from '@/constants/inspectionSession/sessionFactory';
import {
  createQuarterlySummaryDraft,
  syncQuarterlySummaryReportSources,
} from '@/lib/erpReports/quarterly';
import type { QuarterlySummaryReport } from '@/types/erpReports';
import { buildQuarterlyHwpxDocument } from './hwpx';

function buildQuarterlyFixture(): {
  report: QuarterlySummaryReport;
  sessions: ReturnType<typeof buildSiteSessions>['sessions'];
  site: ReturnType<typeof buildSiteSessions>['site'];
} {
  const { site, sessions } = buildSiteSessions();
  const draft = createQuarterlySummaryDraft(site, '작성자');
  const report = syncQuarterlySummaryReportSources(
    {
      ...draft,
      periodEndDate: '2026-06-30',
      periodStartDate: '2026-04-01',
      quarter: 2,
      quarterKey: '2026-Q2',
      title: '2026년 2분기 종합보고서',
      year: 2026,
    },
    site,
    sessions,
    sessions.map((session) => session.id),
    sessions,
  );

  return { report, sessions, site };
}

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

  return {
    sessions: [first, second],
    site,
  };
}

async function loadGeneratedZip(
  fixture: ReturnType<typeof buildQuarterlyFixture>,
  options: Parameters<typeof buildQuarterlyHwpxDocument>[2],
) {
  const { report, site } = fixture;
  const document = await buildQuarterlyHwpxDocument(report, site, options);
  return JSZip.loadAsync(document.buffer);
}

test('buildQuarterlyHwpxDocument keeps the standalone quarterly structure when no appendix is selected', async () => {
  const fixture = buildQuarterlyFixture();
  const zip = await loadGeneratedZip(fixture, {});
  const contentHpf = await zip.file('Contents/content.hpf')?.async('string');

  assert.ok(contentHpf);
  assert.match(contentHpf, /href="Contents\/section0\.xml"/);
  assert.doesNotMatch(contentHpf, /href="Contents\/section1\.xml"/);
});

test('buildQuarterlyHwpxDocument appends selected inspection bodies as extra sections', async () => {
  const fixture = buildQuarterlyFixture();
  const zip = await loadGeneratedZip(fixture, {
    selectedSessions: fixture.sessions,
    siteSessions: fixture.sessions,
  });
  const contentHpf = await zip.file('Contents/content.hpf')?.async('string');
  const headerXml = await zip.file('Contents/header.xml')?.async('string');
  const appendixSection = await zip.file('Contents/section1.xml')?.async('string');
  const secondAppendixSection = await zip.file('Contents/section2.xml')?.async('string');

  assert.ok(contentHpf);
  assert.ok(headerXml);
  assert.ok(appendixSection);
  assert.ok(secondAppendixSection);
  assert.match(contentHpf, /href="Contents\/section1\.xml"/);
  assert.match(contentHpf, /href="Contents\/section2\.xml"/);
  assert.match(contentHpf, /href="BinData\/appendix-1-/);
  assert.match(contentHpf, /href="BinData\/appendix-2-/);
  assert.doesNotMatch(appendixSection, /\{cover\.site_name\}/);
  assert.doesNotMatch(appendixSection, /hidePageNum="1"/);
  assert.doesNotMatch(secondAppendixSection, /\{cover\.site_name\}/);
  assert.match(appendixSection, /<hp:tbl\b/);
  assert.ok((headerXml.match(/<hh:style\b/g) ?? []).length > 22);
});
