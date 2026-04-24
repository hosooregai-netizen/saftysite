import test from 'node:test';
import assert from 'node:assert/strict';

import JSZip from 'jszip';

import { buildQuarterlyMergedTemplatePrototype } from './mergedTemplatePrototype';

function collectManifestIds(contentHpf: string) {
  return new Set(
    Array.from(
      contentHpf.matchAll(/<opf:item\b[^>]*\bid="([^"]+)"[^>]*/g),
      (match) => match[1],
    ),
  );
}

function countBlankParagraphsBetweenTablesByText(xml: string, leftText: string, rightText: string) {
  const tables = xml.match(/<hp:tbl\b[\s\S]*?<\/hp:tbl>/g) ?? [];
  const leftIndex = tables.findIndex((tableXml) =>
    tableXml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').includes(leftText),
  );
  const rightIndex = tables.findIndex((tableXml) =>
    tableXml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').includes(rightText),
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
    !match[0].replace(/<[^>]+>/g, '').trim(),
  ).length;
}

test('buildQuarterlyMergedTemplatePrototype builds a single-section merged template for v9', async () => {
  const document = await buildQuarterlyMergedTemplatePrototype('v9');
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

test('buildQuarterlyMergedTemplatePrototype also supports v9-1 inspection variant', async () => {
  const document = await buildQuarterlyMergedTemplatePrototype('v9-1');
  const zip = await JSZip.loadAsync(document.buffer);
  const sectionXml = await zip.file('Contents/section0.xml')?.async('string');

  assert.equal(document.filename, 'quarterly-merged-template.v9-1.hwpx');
  assert.ok(document.imagePlaceholders.length > 0);
  assert.ok(sectionXml);
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
});
