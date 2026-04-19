export {};

import fs from 'node:fs/promises';
import path from 'node:path';
import JSZip from 'jszip';

const TEMPLATE_DIR = path.resolve(process.cwd(), 'public', 'templates', 'inspection');
const COVER_PLACEHOLDER = '{cover.client_representative_name}';

function tableSpans(xml: string) {
  const spans: Array<{ start: number; end: number }> = [];
  const tablePattern = /<hp:tbl\b[\s\S]*?<\/hp:tbl>/g;

  for (const match of xml.matchAll(tablePattern)) {
    const start = match.index ?? 0;
    spans.push({ start, end: start + match[0].length });
  }

  return spans;
}

function locateTemplateCell(
  xml: string,
  descriptor: { table: number; row: number; col: number },
): {
  tableSpan: { start: number; end: number };
  tableXml: string;
  cellXml: string;
  cellStart: number;
  cellEnd: number;
} | null {
  const spans = tableSpans(xml);
  const tableSpan = spans[descriptor.table];
  if (!tableSpan) {
    return null;
  }

  const tableXml = xml.slice(tableSpan.start, tableSpan.end);
  const cellPattern = /<hp:tc\b[\s\S]*?<\/hp:tc>/g;
  const marker = `<hp:cellAddr colAddr="${descriptor.col}" rowAddr="${descriptor.row}"`;

  for (const match of tableXml.matchAll(cellPattern)) {
    const cellXml = match[0];
    if (!cellXml.includes(marker)) {
      continue;
    }

    const cellStart = match.index ?? 0;
    return {
      tableSpan,
      tableXml,
      cellXml,
      cellStart,
      cellEnd: cellStart + cellXml.length,
    };
  }

  return null;
}

function replaceLocatedTemplateCell(
  xml: string,
  located: {
    tableSpan: { start: number; end: number };
    tableXml: string;
    cellStart: number;
    cellEnd: number;
  },
  nextCellXml: string,
) {
  const patchedTableXml =
    `${located.tableXml.slice(0, located.cellStart)}${nextCellXml}${located.tableXml.slice(located.cellEnd)}`;
  return `${xml.slice(0, located.tableSpan.start)}${patchedTableXml}${xml.slice(located.tableSpan.end)}`;
}

function extractCellSubListXml(cellXml: string) {
  return cellXml.match(/<hp:subList\b[\s\S]*?<\/hp:subList>/)?.[0] ?? null;
}

function ensureCoverClientRepresentativePlaceholder(sectionXml: string) {
  if (sectionXml.includes(COVER_PLACEHOLDER)) {
    return sectionXml;
  }

  return sectionXml.replace(
    /(<hp:t>발주자 :<\/hp:t>[\s\S]*?<hp:t>)([\s\S]*?)(<\/hp:t>)/,
    (_match: string, prefix: string, _currentValue: string, suffix: string) =>
      `${prefix}${COVER_PLACEHOLDER}${suffix}`,
  );
}

function stripPlaceholderFromTemplateCell(
  sectionXml: string,
  descriptor: { table: number; row: number; col: number },
  placeholder: string,
) {
  const located = locateTemplateCell(sectionXml, descriptor);
  if (!located || !located.cellXml.includes(placeholder)) {
    return sectionXml;
  }

  const patchedCellXml = located.cellXml
    .replace(new RegExp(`\\s*\\{${placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}`), '')
    .replace(/\s+<\/hp:t>/g, '</hp:t>');
  return replaceLocatedTemplateCell(sectionXml, located, patchedCellXml);
}

function copyImageSlotWithinTemplate(
  sectionXml: string,
  source: { table: number; row: number; col: number },
  target: { table: number; row: number; col: number },
) {
  const sourceCell = locateTemplateCell(sectionXml, source);
  const targetCell = locateTemplateCell(sectionXml, target);
  if (!sourceCell || !targetCell || targetCell.cellXml.includes('binaryItemIDRef="')) {
    return sectionXml;
  }

  const sourceSubList = extractCellSubListXml(sourceCell.cellXml);
  const targetSubList = extractCellSubListXml(targetCell.cellXml);
  if (!sourceSubList || !targetSubList) {
    return sectionXml;
  }

  const patchedCellXml = targetCell.cellXml.replace(targetSubList, sourceSubList);
  return replaceLocatedTemplateCell(sectionXml, targetCell, patchedCellXml);
}

async function patchTemplate(name: string) {
  const filePath = path.join(TEMPLATE_DIR, name);
  const buffer = await fs.readFile(filePath);
  const zip = await JSZip.loadAsync(buffer);
  const sectionEntry = zip.file('Contents/section0.xml');
  if (!sectionEntry) {
    throw new Error(`Missing Contents/section0.xml in ${name}`);
  }

  let sectionXml = await sectionEntry.async('string');
  sectionXml = ensureCoverClientRepresentativePlaceholder(sectionXml);

  if (name.endsWith('.annotated.v9-1.hwpx')) {
    sectionXml = copyImageSlotWithinTemplate(
      sectionXml,
      { table: 5, row: 8, col: 0 },
      { table: 7, row: 18, col: 0 },
    );
    sectionXml = copyImageSlotWithinTemplate(
      sectionXml,
      { table: 5, row: 8, col: 5 },
      { table: 7, row: 18, col: 2 },
    );
    sectionXml = stripPlaceholderFromTemplateCell(
      sectionXml,
      { table: 7, row: 19, col: 0 },
      'sec10.accident_tracking.occurrence_part',
    );
    sectionXml = stripPlaceholderFromTemplateCell(
      sectionXml,
      { table: 7, row: 19, col: 2 },
      'sec10.accident_tracking.implementation_status',
    );
  }

  zip.file('Contents/section0.xml', sectionXml);
  const nextBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  await fs.writeFile(filePath, nextBuffer);
}

async function main() {
  const templateNames = (await fs.readdir(TEMPLATE_DIR)).filter((name: string) =>
    name.includes('.annotated.v9'),
  );

  if (templateNames.length === 0) {
    throw new Error('No v9 inspection templates found.');
  }

  for (const name of templateNames) {
    await patchTemplate(name);
    console.log(`patched: ${name}`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
