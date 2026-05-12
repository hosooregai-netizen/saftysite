import test from 'node:test';
import assert from 'node:assert/strict';

import JSZip from 'jszip';

import {
  buildQuarterlyMergedTemplatePrototype,
  buildQuarterlyMergedTemplatePrototypeBundle,
} from './mergedTemplatePrototype';

const SAFETY_SLOGAN_PREFIX = '\uD568\uAED8\uD574\uC694 \uC548\uC804\uC791\uC5C5';
const COMPANY_NAME = '\uD55C\uAD6D\uC885\uD569\uC548\uC804\uC8FC\uC2DD\uD68C\uC0AC';
const GUIDANCE_AGENCY_LABEL = '\uC9C0\uB3C4\uAE30\uAD00\uBA85';
const COMPANY_ADDRESS_PREFIX = '\uC11C\uC6B8\uC2DC \uAD11\uC9C4\uAD6C';
const COMPANY_PHONE = '02-454-4541';

function collectManifestIds(contentHpf: string) {
  return new Set(
    Array.from(
      contentHpf.matchAll(/<opf:item\b[^>]*\bid="([^"]+)"[^>]*/g),
      (match) => match[1],
    ),
  );
}

function flattenXmlText(xml: string) {
  return xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function balancedTagSpans(xml: string, tagName: string): Array<{ start: number; end: number }> {
  const tokenPattern = new RegExp(`<${tagName}\\b[^>]*\\/?>|<\\/${tagName}>`, 'g');
  const spans: Array<{ start: number; end: number }> = [];
  const stack: number[] = [];

  for (const match of xml.matchAll(tokenPattern)) {
    const token = match[0];
    const index = match.index ?? 0;
    const isClosing = token.startsWith(`</${tagName}`);
    const isSelfClosing = !isClosing && token.endsWith('/>');

    if (isClosing) {
      const start = stack.pop();
      if (start != null) {
        spans.push({ start, end: index + token.length });
      }
      continue;
    }

    if (isSelfClosing) {
      spans.push({ start: index, end: index + token.length });
      continue;
    }

    stack.push(index);
  }

  return spans.sort((left, right) => left.start - right.start);
}

function findTableByText(xml: string, text: string) {
  return (
    (xml.match(/<hp:tbl\b[\s\S]*?<\/hp:tbl>/g) ?? []).find((tableXml) =>
      flattenXmlText(tableXml).includes(text),
    ) ?? null
  );
}

function assertAppendixBrandingPolicy(appendixPrototypeXml: string) {
  assert.doesNotMatch(appendixPrototypeXml, new RegExp(SAFETY_SLOGAN_PREFIX));
  assert.doesNotMatch(appendixPrototypeXml, new RegExp(COMPANY_ADDRESS_PREFIX));

  for (const tagName of ['hp:ctrl', 'hp:rect']) {
    for (const span of balancedTagSpans(appendixPrototypeXml, tagName)) {
      const blockText = flattenXmlText(appendixPrototypeXml.slice(span.start, span.end));
      assert.ok(!blockText.includes(SAFETY_SLOGAN_PREFIX));
      assert.ok(!blockText.includes(COMPANY_NAME));
      assert.ok(!blockText.includes(COMPANY_ADDRESS_PREFIX));
      assert.ok(!blockText.includes(COMPANY_PHONE));
    }
  }

  assert.ok(findTableByText(appendixPrototypeXml, `${GUIDANCE_AGENCY_LABEL} ${COMPANY_NAME}`));
}

function countBlankParagraphsBetweenTablesByText(xml: string, leftText: string, rightText: string) {
  const tables = xml.match(/<hp:tbl\b[\s\S]*?<\/hp:tbl>/g) ?? [];
  const leftIndex = tables.findIndex((tableXml) =>
    flattenXmlText(tableXml).includes(leftText),
  );
  const rightIndex = tables.findIndex((tableXml) =>
    flattenXmlText(tableXml).includes(rightText),
  );

  assert.notEqual(leftIndex, -1, `expected table containing "${leftText}"`);
  assert.notEqual(rightIndex, -1, `expected table containing "${rightText}"`);

  const spans = Array.from(xml.matchAll(/<hp:tbl\b[\s\S]*?<\/hp:tbl>/g)).map((match) => ({
    end: (match.index ?? 0) + match[0].length,
    start: match.index ?? 0,
  }));
  const left = spans[leftIndex];
  const right = spans[rightIndex];
  if (!left || !right || left.end >= right.start) {
    return 0;
  }

  return Array.from(xml.slice(left.end, right.start).matchAll(/<hp:p\b[\s\S]*?<\/hp:p>/g)).filter((match) =>
    !flattenXmlText(match[0]),
  ).length;
}

test('buildQuarterlyMergedTemplatePrototype builds a single-section merged template with the v9 quarterly holder', async () => {
  const document = await buildQuarterlyMergedTemplatePrototype('v10');
  const zip = await JSZip.loadAsync(document.buffer);
  const [sectionXml, contentHpf] = await Promise.all([
    zip.file('Contents/section0.xml')?.async('string'),
    zip.file('Contents/content.hpf')?.async('string'),
  ]);

  assert.equal(document.filename, 'quarterly-merged-template.v9.hwpx');
  assert.ok(document.imagePlaceholders.length > 0);
  assert.ok(sectionXml);
  assert.ok(contentHpf);
  assert.equal(zip.file('Contents/section1.xml'), null);
  assert.match(sectionXml, /\{#appendices\}/);
  assert.match(sectionXml, /\{\/appendices\}/);
  assert.match(sectionXml, /\{appendices\[0\]\.sec1\.site_name\}/);
  assert.match(sectionXml, /\{#appendices\[0\]\.sec7\.findings\}/);
  assert.match(document.appendixPrototypeXml, /pageBreak="1"/);
  assert.doesNotMatch(sectionXml, /www\.safetysite\.co\.kr/);
  assert.doesNotMatch(sectionXml, /070-4106-6051|02-2299-1996/);
  assert.match(sectionXml, /02-454-4541/);
  assert.equal(
    countBlankParagraphsBetweenTablesByText(
      document.appendixPrototypeXml,
      'appendices[0].sec4.follow_ups[0].location',
      'auto_aggregation_required',
    ),
    0,
  );
  assert.equal(
    countBlankParagraphsBetweenTablesByText(
      document.appendixPrototypeXml,
      'auto_aggregation_required',
      'appendices[0].sec7.findings[0].location',
    ),
    0,
  );
  assert.equal(
    countBlankParagraphsBetweenTablesByText(
      document.appendixPrototypeXml,
      'appendices[0].sec7.findings[0].location',
      'appendices[0].sec8.plans[0].process_name',
    ),
    0,
  );
  assert.doesNotMatch(document.appendixPrototypeXml, /hidePageNum="1"/);
  assert.doesNotMatch(document.appendixPrototypeXml, /www\.safetysite\.co\.kr/);
  assert.doesNotMatch(document.appendixPrototypeXml, /070-4106-6051/);
  assertAppendixBrandingPolicy(document.appendixPrototypeXml);
  assert.ok(!contentHpf.includes('Contents/section1.xml'));

  const manifestIds = collectManifestIds(contentHpf);
  for (const binaryId of document.binaryItemIds) {
    assert.ok(manifestIds.has(binaryId), `expected manifest item for ${binaryId}`);
  }

  const binaryRefs = Array.from(
    sectionXml.matchAll(/\bbinaryItemIDRef="([^"]+)"/g),
    (match) => match[1],
  );
  for (const binaryRef of binaryRefs) {
    assert.ok(manifestIds.has(binaryRef), `expected manifest entry for ${binaryRef}`);
  }
});

test('buildQuarterlyMergedTemplatePrototype also supports v10-1 inspection variant', async () => {
  const document = await buildQuarterlyMergedTemplatePrototype('v10-1');
  const zip = await JSZip.loadAsync(document.buffer);
  const sectionXml = await zip.file('Contents/section0.xml')?.async('string');

  assert.equal(document.filename, 'quarterly-merged-template.v9-1.hwpx');
  assert.ok(document.imagePlaceholders.length > 0);
  assert.ok(sectionXml);
  assert.doesNotMatch(sectionXml, /www\.safetysite\.co\.kr/);
  assert.doesNotMatch(sectionXml, /070-4106-6051|02-2299-1996/);
  assert.match(sectionXml, /02-454-4541/);
  assert.match(sectionXml, /\{appendices\[0\]\.sec2\.guidance_date\}/);
  assert.match(sectionXml, /\{#appendices\[0\]\.sec8\.plans\}/);
  assert.equal(
    countBlankParagraphsBetweenTablesByText(
      document.appendixPrototypeXml,
      'appendices[0].sec4.follow_ups[0].location',
      'auto_aggregation_required',
    ),
    0,
  );
  assert.equal(
    countBlankParagraphsBetweenTablesByText(
      document.appendixPrototypeXml,
      'auto_aggregation_required',
      'appendices[0].sec7.findings[0].location',
    ),
    0,
  );
  assert.equal(
    countBlankParagraphsBetweenTablesByText(
      document.appendixPrototypeXml,
      'appendices[0].sec7.findings[0].location',
      'appendices[0].sec8.plans[0].process_name',
    ),
    0,
  );
  assert.doesNotMatch(document.appendixPrototypeXml, /hidePageNum="1"/);
  assert.doesNotMatch(document.appendixPrototypeXml, /www\.safetysite\.co\.kr/);
  assert.doesNotMatch(document.appendixPrototypeXml, /070-4106-6051/);
  assertAppendixBrandingPolicy(document.appendixPrototypeXml);
});

test('buildQuarterlyMergedTemplatePrototypeBundle prepares v10 and v10-1 appendices in one quarterly v9 holder package', async () => {
  const document = await buildQuarterlyMergedTemplatePrototypeBundle(['v10', 'v10-1'], 'v10');
  const zip = await JSZip.loadAsync(document.buffer);
  const sectionXml = await zip.file('Contents/section0.xml')?.async('string');

  assert.equal(document.filename, 'quarterly-merged-template.v9.hwpx');
  assert.ok(sectionXml);
  assert.ok(document.prototypes.v10);
  assert.ok(document.prototypes['v10-1']);
  assert.match(document.prototypes.v10.appendixPrototypeXml, /\{#appendices\}/);
  assert.doesNotMatch(document.prototypes.v10.appendixPrototypeXml, /sec10\.accident_tracking/);
  assertAppendixBrandingPolicy(document.prototypes.v10.appendixPrototypeXml);
  assert.match(
    document.prototypes['v10-1'].appendixPrototypeXml,
    /sec10\.accident_tracking/,
  );
  assertAppendixBrandingPolicy(document.prototypes['v10-1'].appendixPrototypeXml);
  assert.match(sectionXml, /\{appendices\[0\]\.sec2\.guidance_date\}/);
  assert.doesNotMatch(sectionXml, /www\.safetysite\.co\.kr/);
  assert.doesNotMatch(sectionXml, /070-4106-6051|02-2299-1996/);
});

test('buildQuarterlyMergedTemplatePrototypeBundle can hold mixed appendices in the v9-1 quarterly holder', async () => {
  const document = await buildQuarterlyMergedTemplatePrototypeBundle(['v10', 'v10-1'], 'v10-1');
  const zip = await JSZip.loadAsync(document.buffer);
  const sectionXml = await zip.file('Contents/section0.xml')?.async('string');

  assert.equal(document.filename, 'quarterly-merged-template.v9-1.hwpx');
  assert.ok(sectionXml);
  assert.ok(document.prototypes.v10);
  assert.ok(document.prototypes['v10-1']);
  assert.match(document.prototypes.v10.appendixPrototypeXml, /\{#appendices\}/);
  assert.doesNotMatch(document.prototypes.v10.appendixPrototypeXml, /sec10\.accident_tracking/);
  assert.match(document.prototypes['v10-1'].appendixPrototypeXml, /sec10\.accident_tracking/);
  assertAppendixBrandingPolicy(document.prototypes.v10.appendixPrototypeXml);
  assertAppendixBrandingPolicy(document.prototypes['v10-1'].appendixPrototypeXml);
  assert.match(sectionXml, /sec10\.accident_tracking/);
});
