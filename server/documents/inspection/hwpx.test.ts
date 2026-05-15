import assert from 'node:assert/strict';
import test from 'node:test';

import JSZip from 'jszip';
import sharp from 'sharp';

import {
  createInspectionSession,
  createInspectionSite,
} from '@/constants/inspectionSession/sessionFactory';
import { buildInspectionHwpxDocument, mapSessionToTemplateBinding } from './hwpx';

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

function countStandaloneBlankPageBreakParagraphs(xml: string) {
  return Array.from(xml.matchAll(/<hp:p\b[^>]*pageBreak="1"[\s\S]*?<\/hp:p>/g)).filter((match) => {
    const paragraphXml = match[0];
    return !/<hp:tbl\b/.test(paragraphXml) && !paragraphXml.replace(/<[^>]+>/g, '').trim();
  }).length;
}

function findTableIndexContainingText(xml: string, text: string) {
  return (xml.match(/<hp:tbl\b[\s\S]*?<\/hp:tbl>/g) ?? []).findIndex((tableXml) =>
    tableXml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').includes(text),
  );
}

function findCellContainingText(xml: string, text: string): string | null {
  return (
    (xml.match(/<hp:tc\b[\s\S]*?<\/hp:tc>/g) ?? []).find((cellXml) =>
      cellXml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').includes(text),
    ) ?? null
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

test('mapSessionToTemplateBinding leaves empty report values blank instead of rendering dashes', () => {
  const session = createInspectionSession(
    {
      adminSiteSnapshot: {
        businessRegistrationNumber: '',
        clientRepresentativeName: '',
        corporationRegistrationNumber: '',
        headquartersAddress: '',
        licenseNumber: '',
        siteContactEmail: '',
        siteManagerName: '',
      },
      document13Cases: [
        { id: 'blank-case', imageUrl: '', summary: '', title: '' },
        { id: 'not-applicable-case', imageUrl: '', summary: '', title: '\uD574\uB2F9\uC5C6\uC74C' },
      ],
      meta: {
        approver: '',
        reviewer: '',
      },
    },
    'empty-output-site',
    1,
  );
  session.document2Overview.accidentSummary = '';
  session.document2Overview.accidentType = '';
  session.document2Overview.contact = '';
  session.document5Summary.summaryText = '';

  const binding = mapSessionToTemplateBinding(session);

  assert.equal(binding.text['cover.client_representative_name'], '');
  assert.equal(binding.text['cover.reviewer'], '');
  assert.equal(binding.text['cover.approver'], '');
  assert.equal(binding.text['sec1.business_registration_number'], '');
  assert.equal(binding.text['sec1.corporation_registration_number'], '');
  assert.equal(binding.text['sec1.license_number'], '');
  assert.equal(binding.text['sec2.contact'], '');
  assert.equal(binding.text['sec2.accident_type'], '');
  assert.equal(binding.text['sec2.accident_summary'], '');
  assert.equal(binding.text['sec5.summary_text'], '');
  assert.equal(binding.text['sec13.cases[0].title'], '');
  assert.equal(binding.text['sec13.cases[1].title'], '');
});

test('mapSessionToTemplateBinding keeps cover signature fields blank even when meta names exist', () => {
  const session = createInspectionSession(
    {
      meta: {
        drafter: 'cover-drafter-alpha',
        reviewer: 'cover-reviewer-alpha',
        approver: 'cover-approver-alpha',
      },
    },
    'cover-signature-site',
    1,
  );

  const binding = mapSessionToTemplateBinding(session);

  assert.equal(binding.text['cover.drafter'], '');
  assert.equal(binding.text['cover.reviewer'], '');
  assert.equal(binding.text['cover.approver'], '');
});

test('mapSessionToTemplateBinding appends percent sign to progress rate values', () => {
  const session = createInspectionSession({}, 'progress-rate-site', 1);

  session.document2Overview.progressRate = '50';
  assert.equal(mapSessionToTemplateBinding(session).text['sec2.progress_rate'], '50%');

  session.document2Overview.progressRate = '50%';
  assert.equal(mapSessionToTemplateBinding(session).text['sec2.progress_rate'], '50%');

  session.document2Overview.progressRate = '50 %';
  assert.equal(mapSessionToTemplateBinding(session).text['sec2.progress_rate'], '50%');

  session.document2Overview.progressRate = '';
  assert.equal(mapSessionToTemplateBinding(session).text['sec2.progress_rate'], '');
});

test('mapSessionToTemplateBinding appends compact visit round to the cover site name', () => {
  const session = createInspectionSession(
    {
      adminSiteSnapshot: {
        siteName: 'Snapshot Site',
      },
      meta: {
        siteName: 'Final Test Site , 1 \uD68C\uCC28',
      },
    },
    'cover-round-site',
    1,
  );
  session.document2Overview.visitCount = '1 \uD68C\uCC28';

  const binding = mapSessionToTemplateBinding(session);

  assert.equal(binding.text['cover.site_name'], 'Final Test Site - 1\uD68C\uCC28');
  assert.equal(binding.text['sec1.site_name'], 'Snapshot Site');
});

test('buildInspectionHwpxDocument binds the cover client representative for both inspection template variants', async () => {
  for (const accidentOccurred of ['no', 'yes'] as const) {
    const sectionXml = await readGeneratedSectionXml(accidentOccurred);

    assert.match(sectionXml, /client-rep-alpha/);
    assert.doesNotMatch(sectionXml, /\{cover\.client_representative_name\}/);
  }
});

test('buildInspectionHwpxDocument clears cover signature placeholders for both inspection template variants', async () => {
  const signatureTokens = ['cover.drafter', 'cover.reviewer', 'cover.approver'];

  for (const accidentOccurred of ['no', 'yes'] as const) {
    const session = createInspectionSession(
      {
        meta: {
          drafter: 'cover-drafter-alpha',
          reviewer: 'cover-reviewer-alpha',
          approver: 'cover-approver-alpha',
        },
      },
      `cover-signature-site-${accidentOccurred}`,
      1,
    );
    session.document2Overview.accidentOccurred = accidentOccurred;

    const document = await buildInspectionHwpxDocument(session, [session]);
    const zip = await JSZip.loadAsync(document.buffer);
    const sectionXml = await zip.file('Contents/section0.xml')?.async('string');

    assert.ok(sectionXml);
    for (const token of signatureTokens) {
      assert.doesNotMatch(sectionXml, new RegExp(escapeRegExp(`{${token}}`)));
    }
  }
});

test('buildInspectionHwpxDocument appends percent sign to progress rate for both inspection template variants', async () => {
  for (const accidentOccurred of ['no', 'yes'] as const) {
    const session = createInspectionSession({}, `progress-rate-site-${accidentOccurred}`, 1);
    session.document2Overview.accidentOccurred = accidentOccurred;
    session.document2Overview.progressRate = '73';

    const document = await buildInspectionHwpxDocument(session, [session]);
    const zip = await JSZip.loadAsync(document.buffer);
    const sectionXml = await zip.file('Contents/section0.xml')?.async('string');

    assert.ok(sectionXml);
    assert.match(sectionXml, />73%<\/hp:t>/);
    assert.doesNotMatch(sectionXml, /\{sec2\.progress_rate\}/);
  }
});

test('buildInspectionHwpxDocument appends the visit round to the cover site name for both inspection template variants', async () => {
  const expectedCoverSiteName = 'Final Test Site - 1\uD68C\uCC28';

  for (const accidentOccurred of ['no', 'yes'] as const) {
    const session = createInspectionSession(
      {
        adminSiteSnapshot: {
          siteName: 'Final Test Site',
        },
        meta: {
          siteName: 'Final Test Site',
        },
      },
      `cover-round-site-${accidentOccurred}`,
      1,
    );
    session.document2Overview.accidentOccurred = accidentOccurred;
    session.document2Overview.visitCount = '1 \uD68C\uCC28';

    const document = await buildInspectionHwpxDocument(session, [session]);
    const zip = await JSZip.loadAsync(document.buffer);
    const sectionXml = await zip.file('Contents/section0.xml')?.async('string');

    assert.ok(sectionXml);
    assert.match(sectionXml, new RegExp(escapeRegExp(expectedCoverSiteName)));
    assert.doesNotMatch(sectionXml, /Final Test Site , 1/);
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

test('buildInspectionHwpxDocument applies text layout policy for single-line and multiline fields in both template variants', async () => {
  for (const accidentOccurred of ['no', 'yes'] as const) {
    const session = buildMeasurementFixture(accidentOccurred);
    const oneLineValue = `CORP SINGLE LINE VALUE ${accidentOccurred} 1234567890 ABCDEFGHIJ`;
    const multilineFirst = `MULTILINE PROCESS FIELD ${accidentOccurred} ALPHA`;
    const multilineSecond = `MULTILINE PROCESS FIELD ${accidentOccurred} BETA`;
    const multilineNoWrapValue =
      `MULTILINE NO AUTO WRAP ${accidentOccurred} ALPHA BETA GAMMA DELTA EPSILON ZETA ETA THETA IOTA KAPPA LAMBDA`;

    session.adminSiteSnapshot.corporationRegistrationNumber = oneLineValue;
    session.document8Plans = [
      {
        ...session.document8Plans[0],
        countermeasure: 'MULTILINE COUNTERMEASURE SAMPLE',
        hazard: multilineNoWrapValue,
        processName: `${multilineFirst}\n${multilineSecond}`,
      },
    ];

    const document = await buildInspectionHwpxDocument(session, [session]);
    const zip = await JSZip.loadAsync(document.buffer);
    const sectionXml = await zip.file('Contents/section0.xml')?.async('string');

    assert.ok(sectionXml);
    const singleLineCell = findCellContainingText(sectionXml, oneLineValue);
    const multilineCell = findCellContainingText(sectionXml, multilineFirst);
    const multilineNoWrapCell = findCellContainingText(sectionXml, multilineNoWrapValue);
    assert.ok(singleLineCell);
    assert.ok(multilineCell);
    assert.ok(multilineNoWrapCell);
    assert.match(singleLineCell, /<hp:subList\b[^>]*\blineWrap="SQUEEZE"/);
    assert.equal((singleLineCell.match(new RegExp(escapeRegExp(oneLineValue), 'g')) ?? []).length, 1);
    assert.match(multilineNoWrapCell, /<hp:subList\b[^>]*\blineWrap="BREAK"/);
    assert.equal(
      (multilineNoWrapCell.match(new RegExp(escapeRegExp(multilineNoWrapValue), 'g')) ?? []).length,
      1,
    );
    assert.match(multilineCell, /MULTILINE/);
    assert.match(multilineCell, /FIELD/);
    assert.match(multilineCell, /ALPHA/);
    assert.match(multilineCell, /BETA/);
    for (const paragraphXml of multilineCell.match(/<hp:p\b[\s\S]*?<\/hp:p>/g) ?? []) {
      assert.match(paragraphXml, /\bparaPrIDRef="0"/);
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
    /<hp:p\b[^>]*pageBreak="1"[\s\S]*?<hp:tbl\b[\s\S]*follow-up-location-4/,
  );
  const doc4Index = findTableIndexContainingText(sectionXml, 'follow-up-location-4');
  const doc5Index = findTableIndexContainingText(sectionXml, 'tplimg23');
  const doc7Index = findTableIndexContainingText(sectionXml, 'doc7-location');
  assert.notEqual(doc4Index, -1);
  assert.notEqual(doc5Index, -1);
  assert.notEqual(doc7Index, -1);
  assert.equal(countBlankParagraphsBetweenTableIndices(sectionXml, doc4Index, doc5Index), 0);
  assert.equal(countBlankParagraphsBetweenTableIndices(sectionXml, doc5Index, doc7Index), 0);
});

test('buildInspectionHwpxDocument renders single-category doc5 chart slices as visible opaque images', async () => {
  const session = buildMeasurementFixture('no');
  session.document7Findings = [
    {
      ...session.document7Findings[0],
      id: 'single-chart-finding',
      location: 'single-chart-location',
      accidentType: '추락',
      causativeAgentKey: 'scaffold_platform',
      hazardDescription: 'single-chart-hazard',
      improvementPlan: 'single-chart-plan',
      improvementRequest: 'single-chart-plan',
    },
  ];

  const document = await buildInspectionHwpxDocument(session, [session]);
  const zip = await JSZip.loadAsync(document.buffer);
  const chartImage = await zip.file('BinData/tplimg23.png')?.async('nodebuffer');

  assert.ok(chartImage);

  const metadata = await sharp(chartImage).metadata();
  const outerRingPixel = await sharp(chartImage)
    .extract({ left: 575, top: 340, width: 1, height: 1 })
    .raw()
    .toBuffer();

  assert.equal(metadata.hasAlpha, false);
  assert.notDeepEqual(Array.from(outerRingPixel), [255, 255, 255]);
});

test('buildInspectionHwpxDocument keeps multi-section repeated tables free of blank page-break paragraphs', async () => {
  for (const accidentOccurred of ['no', 'yes'] as const) {
    const session = buildMeasurementFixture(accidentOccurred);
    session.document4FollowUps = Array.from({ length: 10 }, (_, index) => ({
      ...session.document4FollowUps[0],
      afterPhotoUrl: '',
      beforePhotoUrl: '',
      id: `follow-up-many-${index + 1}`,
      location: `FUPM${index + 1}`,
      result: `FUPR${index + 1}`,
    }));
    session.document7Findings = Array.from({ length: 6 }, (_, index) => ({
      ...session.document7Findings[0],
      id: `finding-many-${index + 1}`,
      location: `FINDM${index + 1}`,
      photoUrl: '',
      photoUrl2: '',
    }));
    session.document8Plans = Array.from({ length: 10 }, (_, index) => ({
      ...session.document8Plans[0],
      countermeasure: `PLANC${index + 1}`,
      hazard: `PLANH${index + 1}`,
      id: `future-plan-${index + 1}`,
      processName: `PLANP${index + 1}`,
    }));
    session.document10Measurements = Array.from({ length: 10 }, (_, index) => ({
      ...session.document10Measurements[0],
      id: `measurement-many-${index + 1}`,
      measuredValue: `MEASV${index + 1}`,
      measurementLocation: `MEASM${index + 1}`,
    }));

    const document = await buildInspectionHwpxDocument(session, [session]);
    const zip = await JSZip.loadAsync(document.buffer);
    const sectionXml = await zip.file('Contents/section0.xml')?.async('string');

    assert.ok(sectionXml);
    assert.equal(countStandaloneBlankPageBreakParagraphs(sectionXml), 0);
    assert.match(sectionXml, /FUPM10/);
    assert.match(sectionXml, /FINDM6/);
    assert.match(sectionXml, /PLANP10/);
    assert.match(sectionXml, /MEASM10/);

    const repeatedPairs = [
      ['FUPM4', 'FUPM7'],
      ['FINDM2', 'FINDM3'],
      ['FINDM6', 'PLANP1'],
      ['PLANP4', 'PLANP7'],
      ['MEASM4', 'MEASM7'],
    ] as const;

    for (const [leftText, rightText] of repeatedPairs) {
      const leftIndex = findTableIndexContainingText(sectionXml, leftText);
      const rightIndex = findTableIndexContainingText(sectionXml, rightText);
      assert.notEqual(leftIndex, -1);
      assert.notEqual(rightIndex, -1);
      assert.equal(countBlankParagraphsBetweenTableIndices(sectionXml, leftIndex, rightIndex), 0);
    }
  }
});
