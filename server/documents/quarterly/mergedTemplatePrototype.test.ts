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
  assert.doesNotMatch(document.appendixPrototypeXml, /hidePageNum="1"/);
  assert.doesNotMatch(document.appendixPrototypeXml, /www\.safetysite\.co\.kr/);
  assert.doesNotMatch(document.appendixPrototypeXml, /070-4106-6051/);
});
