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

const TRANSPARENT_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aR9kAAAAASUVORK5CYII=';
const TRANSPARENT_GIF_DATA_URL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

function findTableCell(tableXml: string, rowAddr: number, colAddr: number) {
  const targetMarker = `<hp:cellAddr colAddr="${colAddr}" rowAddr="${rowAddr}"/>`;
  return (
    [...tableXml.matchAll(/<hp:tc\b[\s\S]*?<\/hp:tc>/g)]
      .map((match) => match[0])
      .find((cellXml) => cellXml.includes(targetMarker)) ?? null
  );
}

function extractVertPositions(cellXml: string) {
  return Array.from(
    cellXml.matchAll(/\bvertpos="(\d+)"/g),
    (match) => Number.parseInt(match[1], 10),
  ).filter(Number.isFinite);
}

function extractAppendixSlice(sectionXml: string, marker: string) {
  const markerIndex = sectionXml.indexOf(marker);
  assert.notEqual(markerIndex, -1, `expected appendix marker "${marker}" to be rendered`);
  const appendixStartIndex = sectionXml.lastIndexOf('pageBreak="1"', markerIndex);
  return sectionXml.slice(
    appendixStartIndex >= 0 ? appendixStartIndex : markerIndex,
    markerIndex + 4000,
  );
}

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

  first.document7Findings = [
    {
      accidentType: '',
      carryForward: false,
      causativeAgentKey: '',
      emphasis: '',
      hazardDescription: 'appendix-hazard-one',
      id: 'finding-1',
      improvementPlan: 'appendix-plan-one',
      improvementRequest: '',
      inspector: '',
      legalReferenceId: '',
      legalReferenceTitle: 'law-one',
      likelihood: '',
      location: 'zone-one',
      photoUrl: '',
      photoUrl2: '',
      referenceCatalogAccidentType: '',
      referenceCatalogCausativeAgentKey: '',
      referenceLawTitles: [],
      referenceMaterial1: '',
      referenceMaterial2: '',
      referenceMaterialDescription: '',
      referenceMaterialImage: '',
      riskLevel: '',
      severity: '',
    },
  ];
  second.document7Findings = [
    {
      accidentType: '',
      carryForward: false,
      causativeAgentKey: '',
      emphasis: '',
      hazardDescription: 'appendix-hazard-two',
      id: 'finding-2',
      improvementPlan: 'appendix-plan-two',
      improvementRequest: '',
      inspector: '',
      legalReferenceId: '',
      legalReferenceTitle: 'law-two',
      likelihood: '',
      location: 'zone-two',
      photoUrl: '',
      photoUrl2: '',
      referenceCatalogAccidentType: '',
      referenceCatalogCausativeAgentKey: '',
      referenceLawTitles: [],
      referenceMaterial1: '',
      referenceMaterial2: '',
      referenceMaterialDescription: '',
      referenceMaterialImage: '',
      riskLevel: '',
      severity: '',
    },
  ];

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

test('buildQuarterlyHwpxDocument renders selected inspection bodies into the merged section template', async () => {
  const fixture = buildQuarterlyFixture();
  const zip = await loadGeneratedZip(fixture, {
    selectedSessions: fixture.sessions,
    siteSessions: fixture.sessions,
  });
  const contentHpf = await zip.file('Contents/content.hpf')?.async('string');
  const sectionXml = await zip.file('Contents/section0.xml')?.async('string');

  assert.ok(contentHpf);
  assert.ok(sectionXml);
  assert.doesNotMatch(contentHpf, /href="Contents\/section1\.xml"/);
  assert.doesNotMatch(contentHpf, /href="Contents\/section2\.xml"/);
  assert.match(sectionXml, /appendix-hazard-one/);
  assert.match(sectionXml, /appendix-hazard-two/);
  assert.doesNotMatch(sectionXml, /\{#appendices\}/);
  assert.doesNotMatch(sectionXml, /\{\/appendices\}/);
  const firstAppendixSlice = extractAppendixSlice(sectionXml, 'appendix-hazard-one');
  assert.doesNotMatch(firstAppendixSlice, /hidePageNum="1"/);
  assert.doesNotMatch(firstAppendixSlice, /www\.safetysite\.co\.kr/);
});

test('buildQuarterlyHwpxDocument renders v9-1 appendix content into the merged section template', async () => {
  const fixture = buildQuarterlyFixture();
  const accidentSession = fixture.sessions[0];
  accidentSession.document2Overview.accidentOccurred = 'yes';
  accidentSession.document2Overview.accidentPhotoUrl = '';
  accidentSession.document2Overview.accidentPhotoUrl2 = '';
  accidentSession.document7Findings = [
    {
      accidentType: '',
      carryForward: false,
      causativeAgentKey: '',
      emphasis: '',
      hazardDescription: 'appendix-v91-hazard',
      id: 'finding-v91',
      improvementPlan: 'appendix-v91-plan',
      improvementRequest: '',
      inspector: '',
      legalReferenceId: '',
      legalReferenceTitle: 'law-v91',
      likelihood: '',
      location: 'zone-v91',
      photoUrl: '',
      photoUrl2: '',
      referenceCatalogAccidentType: '',
      referenceCatalogCausativeAgentKey: '',
      referenceLawTitles: [],
      referenceMaterial1: '',
      referenceMaterial2: '',
      referenceMaterialDescription: '',
      referenceMaterialImage: '',
      riskLevel: '',
      severity: '',
    },
  ];

  const zip = await loadGeneratedZip(fixture, {
    selectedSessions: [accidentSession],
    siteSessions: fixture.sessions,
  });
  const contentHpf = await zip.file('Contents/content.hpf')?.async('string');
  const sectionXml = await zip.file('Contents/section0.xml')?.async('string');

  assert.ok(contentHpf);
  assert.ok(sectionXml);
  assert.doesNotMatch(contentHpf, /href="Contents\/section1\.xml"/);
  assert.match(sectionXml, /appendix-v91-hazard/);
  assert.doesNotMatch(sectionXml, /\{#appendices\}/);
  const appendixSlice = extractAppendixSlice(sectionXml, 'appendix-v91-hazard');
  assert.doesNotMatch(appendixSlice, /hidePageNum="1"/);
  assert.doesNotMatch(appendixSlice, /www\.safetysite\.co\.kr/);
});

test('buildQuarterlyHwpxDocument binds the OPS image into the dedicated template slot', async () => {
  const fixture = buildQuarterlyFixture();
  const report = {
    ...fixture.report,
    opsAssetDescription: 'should not be rendered when an OPS image is available',
    opsAssetFileUrl: TRANSPARENT_PNG_DATA_URL,
    opsAssetPreviewUrl: TRANSPARENT_PNG_DATA_URL,
  };
  const document = await buildQuarterlyHwpxDocument(report, fixture.site);
  const zip = await JSZip.loadAsync(document.buffer);
  const sectionXml = await zip.file('Contents/section0.xml')?.async('string');
  const contentHpf = await zip.file('Contents/content.hpf')?.async('string');

  assert.ok(sectionXml);
  assert.ok(contentHpf);
  assert.match(sectionXml, /binaryItemIDRef="opsAssetImage"/);
  assert.doesNotMatch(sectionXml, /binaryItemIDRef="tplopsimg01"/);
  assert.match(contentHpf, /id="opsAssetImage"/);
  assert.doesNotMatch(
    sectionXml,
    /should not be rendered when an OPS image is available/,
  );
});

test('buildQuarterlyHwpxDocument prefers OPS preview images over file assets for export', async () => {
  const fixture = buildQuarterlyFixture();
  const report = {
    ...fixture.report,
    opsAssetFileUrl: TRANSPARENT_GIF_DATA_URL,
    opsAssetPreviewUrl: TRANSPARENT_PNG_DATA_URL,
  };
  const document = await buildQuarterlyHwpxDocument(report, fixture.site);
  const zip = await JSZip.loadAsync(document.buffer);
  const contentHpf = await zip.file('Contents/content.hpf')?.async('string');

  assert.ok(contentHpf);
  assert.match(contentHpf, /href="BinData\/opsAssetImage\.png"/);
  assert.doesNotMatch(contentHpf, /href="BinData\/opsAssetImage\.gif"/);
});

test('buildQuarterlyHwpxDocument embeds OPS images even when the response is an opaque image download', async () => {
  const fixture = buildQuarterlyFixture();
  const report = {
    ...fixture.report,
    opsAssetFileUrl: 'https://example.com/assets/download',
    opsAssetPreviewUrl: 'https://example.com/assets/download',
  };
  const pngBuffer = Buffer.from(TRANSPARENT_PNG_DATA_URL.split(',')[1], 'base64');
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input, init) => {
    if (typeof input === 'string' && input === report.opsAssetPreviewUrl) {
      return new Response(pngBuffer, {
        headers: {
          'content-type': 'application/octet-stream',
        },
      });
    }

    return originalFetch(input, init);
  };

  try {
    const document = await buildQuarterlyHwpxDocument(report, fixture.site);
    const zip = await JSZip.loadAsync(document.buffer);
    const contentHpf = await zip.file('Contents/content.hpf')?.async('string');

    assert.ok(contentHpf);
    assert.match(contentHpf, /href="BinData\/opsAssetImage\.png"/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('buildQuarterlyHwpxDocument reflows long future plan text inside the table cells', async () => {
  const fixture = buildQuarterlyFixture();
  const report = {
    ...fixture.report,
    futurePlans: [
      {
        id: 'future-plan-long-text',
        processName: '',
        hazard: '위험요인 첫 줄\n위험요인 둘째 줄\n위험요인 셋째 줄',
        countermeasure: '대책 첫 줄\n대책 둘째 줄\n대책 셋째 줄',
        note: '',
        source: 'manual' as const,
      },
    ],
  };
  const document = await buildQuarterlyHwpxDocument(report, fixture.site);
  const zip = await JSZip.loadAsync(document.buffer);
  const sectionXml = await zip.file('Contents/section0.xml')?.async('string');

  assert.ok(sectionXml);
  const tables = sectionXml.match(/<hp:tbl\b[\s\S]*?<\/hp:tbl>/g) ?? [];
  assert.ok(tables.length >= 5);

  const futurePlanTable = tables[4];
  const hazardCell = findTableCell(futurePlanTable, 2, 0);
  const countermeasureCell = findTableCell(futurePlanTable, 2, 1);

  assert.ok(hazardCell);
  assert.ok(countermeasureCell);
  assert.ok(new Set(extractVertPositions(hazardCell)).size > 1);
  assert.ok(new Set(extractVertPositions(countermeasureCell)).size > 1);
});
