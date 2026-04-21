import assert from 'node:assert/strict';
import test from 'node:test';

import JSZip from 'jszip';

import {
  createInspectionSession,
  createInspectionSite,
} from '@/constants/inspectionSession/sessionFactory';
import { buildInspectionHwpxDocument } from './hwpx';

const TRANSPARENT_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aR9kAAAAASUVORK5CYII=';

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

function countBlankParagraphsBetweenTableIndices(xml: string, leftIndex: number, rightIndex: number) {
  const tables = Array.from(xml.matchAll(/<hp:tbl\b[\s\S]*?<\/hp:tbl>/g)).map((match) => ({
    end: (match.index ?? 0) + match[0].length,
    start: match.index ?? 0,
  }));
  const left = tables[leftIndex];
  const right = tables[rightIndex];
  if (!left || !right || left.end >= right.start) {
    return 0;
  }

  const slice = xml.slice(left.end, right.start);
  return Array.from(slice.matchAll(/<hp:p\b[\s\S]*?<\/hp:p>/g)).filter((match) =>
    !match[0].replace(/<[^>]+>/g, '').trim(),
  ).length;
}

function findTableIndexContainingText(xml: string, text: string) {
  return (xml.match(/<hp:tbl\b[\s\S]*?<\/hp:tbl>/g) ?? []).findIndex((tableXml) =>
    tableXml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').includes(text),
  );
}

function buildMeasurementFixture(accidentOccurred: 'no' | 'yes') {
  const site = createInspectionSite({
    clientRepresentativeName: 'client-rep-alpha',
    assigneeName: '담당자',
    customerName: '고객사',
    siteName: '테스트 현장',
  });
  const session = createInspectionSession(
    {
      adminSiteSnapshot: site.adminSiteSnapshot,
      meta: {
        drafter: '작성자',
        reportDate: '2026-04-20',
        reportTitle: '계측점검 테스트',
      },
    },
    site.id,
    1,
  );

  session.document2Overview.accidentOccurred = accidentOccurred;
  session.document10Measurements = [
    {
      ...session.document10Measurements[0],
      instrumentType: '습구흑구온도지수(WBGT) 측정기',
      measurementLocation: '123',
      measuredValue: '29.1℃',
      actionTaken: '양호',
      safetyCriteria: '경작업: 30.0~32.2℃ 이하',
    },
    {
      ...session.document10Measurements[1],
      instrumentType: '조도계',
      measurementLocation: 'B1 통로',
      measuredValue: '750 Lux',
      actionTaken: '개선 필요',
      safetyCriteria: '정밀작업: 300 Lux 이상',
    },
    {
      ...session.document10Measurements[2],
      instrumentType: '가스측정기',
      measurementLocation: '지하층',
      measuredValue: '정상',
      actionTaken: '모니터링',
      safetyCriteria: '허용기준 이내',
    },
  ];

  return session;
}

async function readGeneratedSectionXml(accidentOccurred: 'no' | 'yes') {
  const session = buildMeasurementFixture(accidentOccurred);
  const document = await buildInspectionHwpxDocument(session, [session]);
  const zip = await JSZip.loadAsync(document.buffer);
  const sectionXml = await zip.file('Contents/section0.xml')?.async('string');

  assert.ok(sectionXml);
  return sectionXml;
}

test('buildInspectionHwpxDocument binds the cover client representative for both inspection template variants', async () => {
  for (const accidentOccurred of ['no', 'yes'] as const) {
    const sectionXml = await readGeneratedSectionXml(accidentOccurred);

    assert.match(sectionXml, /client-rep-alpha/);
    assert.doesNotMatch(sectionXml, /\{cover\.client_representative_name\}/);
  }
});

test('buildInspectionHwpxDocument binds doc10 measurement values for both inspection template variants', async () => {
  const expectedValues = [
    '123',
    '29.1℃',
    '양호',
    '경작업: 30.0~32.2℃ 이하',
    'B1 통로',
    '750 Lux',
    '개선 필요',
    '정밀작업: 300 Lux 이상',
    '지하층',
    '정상',
    '모니터링',
    '허용기준 이내',
  ];
  const removedTokens = [
    '{sec10.measurements[0].measurement_location}',
    '{sec10.measurements[0].measured_value}',
    '{sec10.measurements[0].action_taken}',
    '{sec10.measurements[0].safety_criteria}',
    '{sec10.measurements[1].measurement_location}',
    '{sec10.measurements[1].measured_value}',
    '{sec10.measurements[1].action_taken}',
    '{sec10.measurements[1].safety_criteria}',
    '{sec10.measurements[2].measurement_location}',
    '{sec10.measurements[2].measured_value}',
    '{sec10.measurements[2].action_taken}',
    '{sec10.measurements[2].safety_criteria}',
  ];

  for (const accidentOccurred of ['no', 'yes'] as const) {
    const sectionXml = await readGeneratedSectionXml(accidentOccurred);

    for (const value of expectedValues) {
      assert.match(sectionXml, new RegExp(escapeRegExp(value)));
    }

    for (const token of removedTokens) {
      assert.doesNotMatch(sectionXml, new RegExp(escapeRegExp(token)));
    }
  }
});

test('buildInspectionHwpxDocument repeats doc7 findings beyond the first item for both inspection template variants', async () => {
  for (const accidentOccurred of ['no', 'yes'] as const) {
    const session = buildMeasurementFixture(accidentOccurred);
    session.document7Findings = [
      {
        ...session.document7Findings[0],
        location: 'finding-location-1',
        accidentType: 'fall-a',
        causativeAgentKey: 'ladder',
        hazardDescription: 'finding-hazard-1',
        improvementPlan: 'finding-improvement-1',
        improvementRequest: 'finding-improvement-1',
        emphasis: 'finding-emphasis-1',
        legalReferenceTitle: 'finding-law-1',
      },
      {
        ...session.document7Findings[0],
        id: 'finding-2',
        location: 'finding-location-2',
        accidentType: 'fall-b',
        causativeAgentKey: 'ladder',
        hazardDescription: 'finding-hazard-2',
        improvementPlan: 'finding-improvement-2',
        improvementRequest: 'finding-improvement-2',
        emphasis: 'finding-emphasis-2',
        legalReferenceTitle: 'finding-law-2',
      },
    ];

    const document = await buildInspectionHwpxDocument(session, [session]);
    const zip = await JSZip.loadAsync(document.buffer);
    const sectionXml = await zip.file('Contents/section0.xml')?.async('string');

    assert.ok(sectionXml);
    assert.match(sectionXml, /finding-hazard-1/);
    assert.match(sectionXml, /finding-hazard-2/);
    assert.match(sectionXml, /finding-improvement-2/);
    assert.match(sectionXml, /finding-law-2/);
    assert.doesNotMatch(sectionXml, /\{\/sec7\.findings\}/);
    assert.doesNotMatch(sectionXml, /\{sec7\.findings\[1\]\.location\}/);
  }
});

test('buildInspectionHwpxDocument renders doc7 manual reference text and left reference image for both inspection template variants', async () => {
  const expectedImage = Buffer.from(TRANSPARENT_PNG_DATA_URL.split(',')[1], 'base64');

  for (const accidentOccurred of ['no', 'yes'] as const) {
    const session = buildMeasurementFixture(accidentOccurred);
    session.document7Findings = [
      {
        ...session.document7Findings[0],
        location: 'reference-zone',
        hazardDescription: 'reference-hazard',
        improvementPlan: 'reference-improvement',
        improvementRequest: 'reference-improvement',
        referenceMaterial1: '',
        referenceMaterial2: '',
        referenceMaterialImage: TRANSPARENT_PNG_DATA_URL,
        referenceMaterialDescription: 'reference-body-text',
      },
    ];

    const document = await buildInspectionHwpxDocument(session, [session]);
    const zip = await JSZip.loadAsync(document.buffer);
    const sectionXml = await zip.file('Contents/section0.xml')?.async('string');
    const boundImage = await zip.file('BinData/tplimg09.png')?.async('nodebuffer');

    assert.ok(sectionXml);
    assert.ok(boundImage);
    const flattenedText = flattenXmlText(sectionXml);
    assert.match(flattenedText, /reference-body-text/);
    assert.match(sectionXml, /binaryItemIDRef="tplimg09"/);
    assert.doesNotMatch(sectionXml, /\{sec7\.findings\[0\]\.reference_material_2\}/);
    assert.doesNotMatch(sectionXml, /data:image\/png;base64/);
    assert.deepEqual(boundImage, expectedImage);
  }
});

test('buildInspectionHwpxDocument keeps doc7 anchored directly after doc5 for both inspection template variants', async () => {
  for (const accidentOccurred of ['no', 'yes'] as const) {
    const sectionXml = await readGeneratedSectionXml(accidentOccurred);
    const doc5Index = findTableIndexContainingText(sectionXml, '5.현재 공정내 현존하는 유해·위험요인');
    const doc7Index = findTableIndexContainingText(sectionXml, '7.현재 공정내 현존하는 유해·위험요인');

    assert.notEqual(doc5Index, -1);
    assert.notEqual(doc7Index, -1);
    assert.equal(countBlankParagraphsBetweenTableIndices(sectionXml, doc5Index, doc7Index), 0);
  }
});

test('buildInspectionHwpxDocument keeps repeated doc4 follow-up pages page-broken and table ids unique', async () => {
  const session = buildMeasurementFixture('no');
  session.document4FollowUps = Array.from({ length: 4 }, (_, index) => ({
    ...session.document4FollowUps[0],
    afterPhotoUrl: '',
    beforePhotoUrl: '',
    confirmationDate: '2026-04-02',
    guidanceDate: '2026-04-01',
    id: `follow-up-${index + 1}`,
    location: `follow-up-location-${index + 1}`,
    result: `follow-up-result-${index + 1}`,
  }));
  session.document7Findings = [
    {
      ...session.document7Findings[0],
      id: 'finding-1',
      location: 'doc7-location',
    },
  ];

  const document = await buildInspectionHwpxDocument(session, [session]);
  const zip = await JSZip.loadAsync(document.buffer);
  const sectionXml = await zip.file('Contents/section0.xml')?.async('string');

  assert.ok(sectionXml);
  assert.match(sectionXml, /follow-up-location-4/);
  assert.match(sectionXml, /doc7-location/);
  assert.equal(collectDuplicateTableIds(sectionXml).length, 0);
  assert.match(
    sectionXml,
    /<hp:p\b[^>]*pageBreak="1"[^>]*>\s*<hp:run\b[^>]*><hp:tbl\b[\s\S]*follow-up-location-4/,
  );
});

test('buildInspectionHwpxDocument promotes the doc5 anchor directly after doc4 flow', async () => {
  const sectionXml = await readGeneratedSectionXml('no');

  assert.equal(countBlankParagraphsBetweenTableIndices(sectionXml, 3, 4), 0);
  assert.match(sectionXml, /5\.현재 공정내 현존하는 유해·위험요인/);
  assert.match(sectionXml, /7\.현재 공정내 현존하는 유해·위험요인/);
});
test('buildInspectionHwpxDocument keeps doc5 anchored directly after doc4 for both inspection template variants', async () => {
  for (const accidentOccurred of ['no', 'yes'] as const) {
    const sectionXml = await readGeneratedSectionXml(accidentOccurred);

    assert.equal(countBlankParagraphsBetweenTableIndices(sectionXml, 3, 4), 0);
  }
});
