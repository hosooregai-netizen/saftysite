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
import {
  buildQuarterlyHwpxDocument,
  selectQuarterlyMergedTemplateHolderVariant,
} from './hwpx';

const TRANSPARENT_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aR9kAAAAASUVORK5CYII=';
const TRANSPARENT_GIF_DATA_URL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
const COVER_SITE_NAME_LABEL = '\uD604\uC7A5\uBA85 : ';

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function flattenXmlText(xml: string) {
  return xml.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');
}

function collectDuplicateTableIds(xml: string) {
  const tableIds = Array.from(
    xml.matchAll(/<hp:tbl\b[^>]*\bid="(\d+)"/g),
    (match) => match[1],
  );
  return Array.from(new Set(tableIds.filter((id, index) => tableIds.indexOf(id) !== index)));
}

function findTableByText(xml: string, text: string) {
  return (
    (xml.match(/<hp:tbl\b[\s\S]*?<\/hp:tbl>/g) ?? []).find((tableXml) =>
      tableXml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').includes(text),
    ) ?? null
  );
}

function findTableCell(tableXml: string, rowAddr: number, colAddr: number) {
  const targetMarker = `<hp:cellAddr colAddr="${colAddr}" rowAddr="${rowAddr}"/>`;
  return (
    [...tableXml.matchAll(/<hp:tc\b[\s\S]*?<\/hp:tc>/g)]
      .map((match) => match[0])
      .find((cellXml) => cellXml.includes(targetMarker)) ?? null
  );
}

function findCellContainingText(xml: string, text: string): string | null {
  return (
    (xml.match(/<hp:tc\b[\s\S]*?<\/hp:tc>/g) ?? []).find((cellXml) =>
      cellXml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').includes(text),
    ) ?? null
  );
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

function assertCoverSiteLine(sectionXml: string, siteName: string) {
  assert.match(
    sectionXml,
    new RegExp(`<hp:t>${escapeRegExp(`${COVER_SITE_NAME_LABEL}${siteName}`)}<\\/hp:t>`),
  );
  assert.doesNotMatch(sectionXml, /<hp:t>현장명 : [^<]*ㅇㅇㅇ/);
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
      hazardCountermeasureItemId: '',
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
      hazardCountermeasureItemId: '',
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

test('selectQuarterlyMergedTemplateHolderVariant follows inspection accident template rules', () => {
  const fixture = buildQuarterlyFixture();
  assert.equal(selectQuarterlyMergedTemplateHolderVariant(fixture.sessions), 'v10');

  fixture.sessions[1].document2Overview.accidentOccurred = 'yes';
  assert.equal(selectQuarterlyMergedTemplateHolderVariant(fixture.sessions), 'v10-1');
});

test('buildQuarterlyHwpxDocument keeps the standalone quarterly structure when no appendix is selected', async () => {
  const fixture = buildQuarterlyFixture();
  const zip = await loadGeneratedZip(fixture, {});
  const contentHpf = await zip.file('Contents/content.hpf')?.async('string');
  const sectionXml = await zip.file('Contents/section0.xml')?.async('string');

  assert.ok(contentHpf);
  assert.ok(sectionXml);
  assert.match(contentHpf, /href="Contents\/section0\.xml"/);
  assert.doesNotMatch(contentHpf, /href="Contents\/section1\.xml"/);
  assertCoverSiteLine(sectionXml, fixture.report.siteSnapshot.siteName);
  assert.match(
    findTableByText(sectionXml, '3.기술지도 이행현황') ?? '',
    /<hp:pos\b[^>]*treatAsChar="1"/,
  );
});

test('buildQuarterlyHwpxDocument leaves empty quarterly fields blank instead of rendering dashes', async () => {
  const fixture = buildQuarterlyFixture();
  const report = {
    ...fixture.report,
    implementationRows: [
      {
        drafter: '',
        findingCount: 0,
        improvedCount: 0,
        note: '',
        progressRate: '',
        reportDate: '',
        reportNumber: 0,
        reportTitle: '',
        sessionId: '',
      },
    ],
    siteSnapshot: {
      ...fixture.report.siteSnapshot,
      siteManagementNumber: '',
    },
  };

  const document = await buildQuarterlyHwpxDocument(report, fixture.site);
  const zip = await JSZip.loadAsync(document.buffer);
  const sectionXml = await zip.file('Contents/section0.xml')?.async('string');

  assert.ok(sectionXml);
  const snapshotTable = findTableByText(sectionXml, report.siteSnapshot.siteName);
  assert.ok(snapshotTable);
  const siteManagementNumberCell = findTableCell(snapshotTable, 1, 4);
  assert.ok(siteManagementNumberCell);
  assert.doesNotMatch(siteManagementNumberCell, /<hp:t>-<\/hp:t>/);
  assert.doesNotMatch(sectionXml, /<hp:t>-<\/hp:t>/);
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
  assertCoverSiteLine(sectionXml, fixture.report.siteSnapshot.siteName);
  const firstAppendixSlice = extractAppendixSlice(sectionXml, 'appendix-hazard-one');
  assert.doesNotMatch(firstAppendixSlice, /hidePageNum="1"/);
  assert.doesNotMatch(firstAppendixSlice, /www\.safetysite\.co\.kr/);
  assert.match(
    findTableByText(sectionXml, 'appendix-hazard-one') ?? '',
    /<hp:tbl\b[^>]*textWrap="TOP_AND_BOTTOM"[\s\S]*?<hp:pos\b[^>]*treatAsChar="0"/,
  );
});

test('buildQuarterlyHwpxDocument applies merged appendix text layout policy', async () => {
  const fixture = buildQuarterlyFixture();
  const longAppendixText =
    'QUARTERLY APPENDIX NO AUTO WRAP ALPHA BETA GAMMA DELTA EPSILON ZETA ETA THETA IOTA KAPPA LAMBDA';
  fixture.sessions[0].document8Plans = [
    {
      ...fixture.sessions[0].document8Plans[0],
      countermeasure: 'quarterly appendix countermeasure',
      hazard: longAppendixText,
      processName: 'quarterly appendix process',
    },
  ];

  const zip = await loadGeneratedZip(fixture, {
    selectedSessions: fixture.sessions,
    siteSessions: fixture.sessions,
  });
  const sectionXml = await zip.file('Contents/section0.xml')?.async('string');

  assert.ok(sectionXml);
  const appendixCell = findCellContainingText(sectionXml, longAppendixText);
  assert.ok(appendixCell);
  assert.match(appendixCell, /<hp:subList\b[^>]*\blineWrap="BREAK"/);
  assert.equal(
    (appendixCell.match(new RegExp(escapeRegExp(longAppendixText), 'g')) ?? []).length,
    1,
  );
});

test('buildQuarterlyHwpxDocument renders doc7 manual reference text inside the merged inspection appendix', async () => {
  const fixture = buildQuarterlyFixture();
  fixture.sessions[0].document7Findings = [
    {
      ...fixture.sessions[0].document7Findings[0],
      hazardDescription: 'appendix-reference-hazard',
      referenceMaterial1: '',
      referenceMaterial2: '',
      referenceMaterialImage: TRANSPARENT_PNG_DATA_URL,
      referenceMaterialDescription: 'appendix-reference-body',
    },
  ];

  const zip = await loadGeneratedZip(fixture, {
    selectedSessions: fixture.sessions,
    siteSessions: fixture.sessions,
  });
  const sectionXml = await zip.file('Contents/section0.xml')?.async('string');
  const flattenedText = flattenXmlText(sectionXml ?? '');

  assert.ok(sectionXml);
  assert.match(flattenedText, /appendix-reference-body/);
  assert.doesNotMatch(sectionXml, /\{sec7\.findings\[0\]\.reference_material_2\}/);
  assert.match(flattenedText, /appendix-reference-hazard[\s\S]*appendix-reference-body/);
});

test('buildQuarterlyHwpxDocument renders v10-1 appendix content into the merged section template', async () => {
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
      hazardDescription: 'appendix-v101-hazard',
      id: 'finding-v101',
      improvementPlan: 'appendix-v101-plan',
      improvementRequest: '',
      inspector: '',
      hazardCountermeasureItemId: '',
      legalReferenceId: '',
      legalReferenceTitle: 'law-v101',
      likelihood: '',
      location: 'zone-v101',
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
  assert.match(sectionXml, /appendix-v101-hazard/);
  assert.doesNotMatch(sectionXml, /\{#appendices\}/);
  const appendixSlice = extractAppendixSlice(sectionXml, 'appendix-v101-hazard');
  assert.doesNotMatch(appendixSlice, /hidePageNum="1"/);
  assert.doesNotMatch(appendixSlice, /www\.safetysite\.co\.kr/);
});

test('buildQuarterlyHwpxDocument renders mixed v10 and v10-1 appendices per selected session', async () => {
  const fixture = buildQuarterlyFixture();
  const noAccidentSession = fixture.sessions[0];
  const accidentSession = fixture.sessions[1];

  noAccidentSession.document10Measurements = [
    {
      actionTaken: '',
      id: 'measurement-no-accident',
      instrumentType: 'normal-measure-marker',
      measuredValue: '',
      measurementLocation: '',
      photoUrl: '',
      safetyCriteria: '',
    },
  ];
  accidentSession.document2Overview.accidentOccurred = 'yes';
  accidentSession.document2Overview.accidentPhotoUrl = '';
  accidentSession.document2Overview.accidentPhotoUrl2 = '';
  accidentSession.document10Measurements = [
    {
      actionTaken: '',
      id: 'measurement-accident',
      instrumentType: 'accident-measure-marker',
      measuredValue: '',
      measurementLocation: '',
      photoUrl: '',
      safetyCriteria: '',
    },
  ];

  const zip = await loadGeneratedZip(fixture, {
    selectedSessions: [noAccidentSession, accidentSession],
    siteSessions: fixture.sessions,
  });
  const contentHpf = await zip.file('Contents/content.hpf')?.async('string');
  const sectionXml = await zip.file('Contents/section0.xml')?.async('string');

  assert.ok(contentHpf);
  assert.ok(sectionXml);
  assert.doesNotMatch(contentHpf, /href="Contents\/section1\.xml"/);
  assert.match(sectionXml, /normal-measure-marker/);
  assert.match(sectionXml, /accident-measure-marker/);

  const noAccidentSlice = extractAppendixSlice(sectionXml, 'normal-measure-marker');
  const accidentSlice = extractAppendixSlice(sectionXml, 'accident-measure-marker');
  assert.doesNotMatch(noAccidentSlice, /산업재해 추적관리/);
  assert.match(accidentSlice, /산업재해 추적관리/);
});

test('buildQuarterlyHwpxDocument keeps merged appendix table ids unique', async () => {
  const fixture = buildQuarterlyFixture();
  fixture.sessions[0].document4FollowUps = Array.from({ length: 4 }, (_, index) => ({
    ...fixture.sessions[0].document4FollowUps[0],
    afterPhotoUrl: '',
    beforePhotoUrl: '',
    confirmationDate: '2026-04-02',
    guidanceDate: '2026-04-01',
    id: `quarterly-follow-up-${index + 1}`,
    location: `quarterly-follow-up-location-${index + 1}`,
    result: `quarterly-follow-up-result-${index + 1}`,
  }));

  const zip = await loadGeneratedZip(fixture, {
    selectedSessions: fixture.sessions,
    siteSessions: fixture.sessions,
  });
  const sectionXml = await zip.file('Contents/section0.xml')?.async('string');

  assert.ok(sectionXml);
  assert.equal(collectDuplicateTableIds(sectionXml).length, 0);
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

test('buildQuarterlyHwpxDocument keeps long future plan text on source lines', async () => {
  const fixture = buildQuarterlyFixture();
  const hazard =
    'QUARTERLY FUTURE PLAN HAZARD NO AUTO WRAP ALPHA BETA GAMMA DELTA EPSILON ZETA ETA THETA IOTA KAPPA';
  const countermeasure =
    'QUARTERLY FUTURE PLAN COUNTERMEASURE NO AUTO WRAP ALPHA BETA GAMMA DELTA EPSILON ZETA ETA THETA IOTA KAPPA';
  const report = {
    ...fixture.report,
    futurePlans: [
      {
        id: 'future-plan-long-text',
        hazardCountermeasureItemId: '',
        processName: '',
        hazard,
        countermeasure,
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
  assert.equal((hazardCell.match(new RegExp(escapeRegExp(hazard), 'g')) ?? []).length, 1);
  assert.equal(
    (countermeasureCell.match(new RegExp(escapeRegExp(countermeasure), 'g')) ?? []).length,
    1,
  );
});
