import fs from 'node:fs/promises';
import path from 'node:path';

import JSZip from 'jszip';

import { sanitizeWordFileName } from '@/server/documents/sharedDocx';
import type { QuarterlyCounter, QuarterlySummaryReport } from '@/types/erpReports';
import type { InspectionSite } from '@/types/inspectionSession';

export interface GeneratedHwpxDocument {
  buffer: Buffer;
  filename: string;
}

const TEMPLATE_FILENAME = '\uBD84\uAE30 \uC885\uD569\uBCF4\uACE0\uC11C2.hwpx';
const TEMPLATE_PATH = path.resolve(
  process.cwd(),
  'public',
  'templates',
  'quarterly',
  TEMPLATE_FILENAME,
);
const HWPX_CONTENT_TYPE = 'application/haansofthwpx';
const EMPTY_CHART_LABEL = '\uC790\uB8CC \uC5C6\uC74C';
const EMPTY_COMMENT = '\uCD1D\uD3C9\uC774 \uC544\uC9C1 \uC791\uC131\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.';
const OPS_PENDING_TITLE = '\uAD00\uB9AC\uC790 \uBCF4\uC644 \uB300\uAE30';
const OPS_PENDING_BODY = '\uAD00\uB9AC\uC790\uAC00 OPS \uC790\uB8CC\uB97C \uC544\uC9C1 \uC5F0\uACB0\uD558\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.';
const OPS_FILE_LABEL = '\uCCA8\uBD80\uC790\uB8CC';
const OPS_ASSIGNED_BY_LABEL = '\uC5F0\uACB0\uC790';
const NO_DATA_VALUE = '-';
const SECTION_TITLE_INDEX = 1;

function fileNameForQuarterlyReport(report: QuarterlySummaryReport, site: InspectionSite) {
  const siteName = sanitizeWordFileName(
    report.siteSnapshot.siteName || site.siteName || report.siteId || 'quarterly-report',
    'quarterly-report',
  );
  return `${siteName}-${report.quarterKey}-quarterly-report.hwpx`;
}

export function createHwpxDownloadResponse(document: GeneratedHwpxDocument): Response {
  return new Response(new Uint8Array(document.buffer), {
    status: 200,
    headers: {
      'Content-Type': HWPX_CONTENT_TYPE,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(document.filename)}`,
    },
  });
}

function escapeXmlText(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function normalizeLineBreaks(value: string) {
  return value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function formatText(value: string | null | undefined, fallback = NO_DATA_VALUE) {
  const trimmed = normalizeLineBreaks(value ?? '').trim();
  return trimmed || fallback;
}

function formatOptionalText(value: string | null | undefined) {
  return normalizeLineBreaks(value ?? '').trim();
}

function combineDistinctValues(values: Array<string | null | undefined>) {
  const normalized = values.map((item) => formatOptionalText(item)).filter(Boolean);
  const unique = normalized.filter((item, index) => normalized.indexOf(item) === index);
  return unique.join(' / ');
}

function normalizeHwpxPlainText(value: string) {
  return value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function estimateHwpxMaxCharsPerLine(horzSize: number, textHeight: number) {
  const safeHeight = Math.max(textHeight, 900);
  return Math.max(8, Math.floor(horzSize / (safeHeight * 1.05)));
}

function charWidthUnits(char: string) {
  return /[ -~]/.test(char) ? 0.6 : 1;
}

function wrapHwpxLine(text: string, maxCharsPerLine: number): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [' '];

  const lines: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    let width = 0;
    let end = start;
    let lastWhitespace = -1;

    while (end < normalized.length) {
      const nextWidth = width + charWidthUnits(normalized[end]);
      if (nextWidth > maxCharsPerLine) break;
      width = nextWidth;
      if (/\s/.test(normalized[end])) lastWhitespace = end;
      end += 1;
    }

    if (end === normalized.length) {
      lines.push(normalized.slice(start));
      break;
    }

    if (lastWhitespace >= start) {
      lines.push(normalized.slice(start, lastWhitespace).trimEnd());
      start = lastWhitespace + 1;
      while (start < normalized.length && /\s/.test(normalized[start])) {
        start += 1;
      }
      continue;
    }

    lines.push(normalized.slice(start, end));
    start = end;
  }

  return lines.length > 0 ? lines : [' '];
}

function extractFirstLineSegMetric(paragraphXml: string, name: string): number | null {
  const match = paragraphXml.match(new RegExp(`<hp:lineseg\\b[^>]*\\b${name}="(\\d+)"`));
  if (!match) return null;
  return Number.parseInt(match[1], 10);
}

function buildRunXml(charPrIDRef: string, text: string) {
  const escaped = escapeXmlText(text).replace(/\n/g, '<hp:lineBreak/>');
  return `<hp:run charPrIDRef="${charPrIDRef}"><hp:t>${escaped}</hp:t></hp:run>`;
}

function wrapHwpxText(text: string, maxChars: number) {
  const sourceLines = normalizeLineBreaks(text).split('\n');
  const wrapped = sourceLines.flatMap((line) => wrapHwpxLine(line, maxChars));
  return wrapped.length > 0 ? wrapped : [' '];
}

function replaceParagraphRuns(paragraphXml: string, text: string) {
  const charPrIDRef = paragraphXml.match(/<hp:run charPrIDRef="([^"]+)"/)?.[1] ?? '8';
  return paragraphXml.replace(
    /(<hp:p\b[^>]*>)([\s\S]*?)(<hp:linesegarray>[\s\S]*?<\/hp:linesegarray>)/,
    `$1${buildRunXml(charPrIDRef, text)}$3`,
  );
}

function buildReflowParagraphs(paragraphTemplate: string, text: string) {
  const paragraphMatch = paragraphTemplate.match(
    /^(<hp:p\b[^>]*>)([\s\S]*?)(<hp:linesegarray>[\s\S]*?<\/hp:linesegarray>)<\/hp:p>$/,
  );
  if (!paragraphMatch) {
    return replaceParagraphRuns(paragraphTemplate, text);
  }

  const [, paragraphOpen, paragraphBody, lineSegArrayXml] = paragraphMatch;
  const textRunMatch = paragraphBody.match(/^([\s\S]*?<hp:t>)([\s\S]*?)(<\/hp:t>[\s\S]*)$/);
  if (!textRunMatch) {
    return replaceParagraphRuns(paragraphTemplate, text);
  }

  const [, textPrefix, , textSuffix] = textRunMatch;
  const lineSegMatch = lineSegArrayXml.match(
    /^(<hp:linesegarray>\s*)(<hp:lineseg\b[^>]*\bvertpos="(\d+)"[^>]*\bvertsize="(\d+)"[^>]*\btextheight="(\d+)"[^>]*\bspacing="(\d+)"[^>]*\bhorzsize="(\d+)"[^>]*\/>)([\s\S]*<\/hp:linesegarray>)$/,
  );
  if (!lineSegMatch) {
    return replaceParagraphRuns(paragraphTemplate, text);
  }

  const [
    ,
    lineSegArrayOpen,
    lineSegTemplate,
    baseVertPosText,
    vertSizeText,
    textHeightText,
    spacingText,
    horzSizeText,
    lineSegArrayClose,
  ] = lineSegMatch;

  const baseVertPos = Number.parseInt(baseVertPosText, 10);
  const vertSize = Number.parseInt(vertSizeText, 10);
  const textHeight = Number.parseInt(textHeightText, 10);
  const spacing = Number.parseInt(spacingText, 10);
  const horzSize = Number.parseInt(horzSizeText, 10);
  const lineStep = extractFirstLineSegMetric(paragraphTemplate, 'vertpos') !== null
    ? vertSize + spacing
    : vertSize + spacing;

  const logicalLines = normalizeHwpxPlainText(text).split('\n');
  const wrappedLines = logicalLines.flatMap((line) =>
    wrapHwpxLine(line, estimateHwpxMaxCharsPerLine(horzSize, textHeight)),
  );
  const finalLines = wrappedLines.length > 0 ? wrappedLines : [' '];

  return finalLines
    .map((line, lineIndex) => {
      const nextVertPos = baseVertPos + lineStep * lineIndex;
      const nextLineSeg = lineSegTemplate.replace(/\bvertpos="\d+"/, `vertpos="${nextVertPos}"`);
      return `${paragraphOpen}${textPrefix}${escapeXmlText(line)}${textSuffix}${lineSegArrayOpen}${nextLineSeg}${lineSegArrayClose}</hp:p>`;
    })
    .join('');
}

function stripLineSegArrays(xml: string) {
  return xml.replace(/<hp:linesegarray>[\s\S]*?<\/hp:linesegarray>/g, '');
}

function replaceCellText(
  tableXml: string,
  rowAddr: number,
  colAddr: number,
  text: string,
  options?: { multiline?: boolean; wrapAt?: number; reflow?: boolean; stripLineSeg?: boolean },
) {
  const targetMarker = `<hp:cellAddr colAddr="${colAddr}" rowAddr="${rowAddr}"/>`;
  const cellBlock = [...tableXml.matchAll(/<hp:tc\b[\s\S]*?<\/hp:tc>/g)]
    .map((match) => match[0])
    .find((candidate) => candidate.includes(targetMarker));
  if (!cellBlock) return tableXml;

  const paragraphTemplate = cellBlock.match(/<hp:p\b[\s\S]*?<\/hp:p>/)?.[0];
  if (!paragraphTemplate) return tableXml;

  const nextParagraphs = options?.reflow
    ? buildReflowParagraphs(paragraphTemplate, text)
    : options?.multiline
    ? wrapHwpxText(text, options.wrapAt ?? 44)
        .map((line) => replaceParagraphRuns(paragraphTemplate, line))
        .join('')
    : replaceParagraphRuns(paragraphTemplate, text);

  const nextCell = cellBlock.replace(
    /<hp:p\b[\s\S]*?<\/hp:p>/,
    options?.stripLineSeg ? stripLineSegArrays(nextParagraphs) : nextParagraphs,
  );

  return tableXml.replace(cellBlock, nextCell);
}

function getTableRows(tableXml: string) {
  return [...tableXml.matchAll(/<hp:tr>[\s\S]*?<\/hp:tr>/g)].map((match) => match[0]);
}

function replaceTableRows(tableXml: string, rows: string[]) {
  const firstRowIndex = tableXml.indexOf('<hp:tr>');
  const lastRowEnd = tableXml.lastIndexOf('</hp:tr>') + '</hp:tr>'.length;
  if (firstRowIndex < 0 || lastRowEnd < 0) return tableXml;

  const prefix = tableXml.slice(0, firstRowIndex);
  const suffix = tableXml.slice(lastRowEnd);
  return `${prefix}${rows.join('')}${suffix}`;
}

function resizeTable(tableXml: string, rowCount: number, addedHeight: number) {
  let nextTable = tableXml.replace(/rowCnt="\d+"/, `rowCnt="${rowCount}"`);
  if (addedHeight > 0) {
    nextTable = nextTable.replace(
      /(<hp:sz\b[^>]*height=")(\d+)(")/,
      (_match, start, value, end) => `${start}${Number(value) + addedHeight}${end}`,
    );
  }
  return nextTable;
}

function ensureDataRowCapacity(tableXml: string, firstDataRowAddr: number, desiredRowCount: number) {
  const rows = getTableRows(tableXml);
  const currentDataRows = rows.length - firstDataRowAddr;
  if (desiredRowCount <= currentDataRows) return tableXml;

  const prototypeRow = rows[rows.length - 1];
  const prototypeHeight = Number(prototypeRow.match(/<hp:cellSz\b[^>]*height="(\d+)"/)?.[1] ?? 0);
  const cloneCount = desiredRowCount - currentDataRows;
  const extraRows = Array.from({ length: cloneCount }, (_item, cloneIndex) => {
    const nextRowAddr = firstDataRowAddr + currentDataRows + cloneIndex;
    return prototypeRow.replace(/rowAddr="\d+"/g, `rowAddr="${nextRowAddr}"`);
  });
  const nextRows = [...rows, ...extraRows];
  const resized = replaceTableRows(tableXml, nextRows);
  return resizeTable(resized, nextRows.length, prototypeHeight * cloneCount);
}

function matchTableBlocks(sectionXml: string) {
  return [...sectionXml.matchAll(/<hp:tbl\b[\s\S]*?<\/hp:tbl>/g)].map((match) => ({
    start: match.index ?? 0,
    end: (match.index ?? 0) + match[0].length,
    xml: match[0],
  }));
}

function rebuildSectionXml(
  sectionXml: string,
  tableBlocks: ReturnType<typeof matchTableBlocks>,
  tables: string[],
) {
  let cursor = 0;
  let output = '';

  tableBlocks.forEach((block, index) => {
    output += sectionXml.slice(cursor, block.start);
    output += tables[index] ?? block.xml;
    cursor = block.end;
  });

  output += sectionXml.slice(cursor);
  return output;
}

function replaceNthTextNode(sectionXml: string, targetIndex: number, nextText: string) {
  let currentIndex = -1;
  return sectionXml.replace(/<hp:t>([\s\S]*?)<\/hp:t>/g, (match) => {
    currentIndex += 1;
    if (currentIndex !== targetIndex) return match;
    return `<hp:t>${escapeXmlText(nextText)}</hp:t>`;
  });
}

function formatChartRows(rows: QuarterlyCounter[]) {
  if (rows.length > 0) return rows;
  return [{ label: EMPTY_CHART_LABEL, count: 0 }];
}

function updateChartXml(chartXml: string, rows: QuarterlyCounter[]) {
  const normalizedRows = formatChartRows(rows);
  const cellRangeEnd = normalizedRows.length + 1;
  const categoryPoints = normalizedRows
    .map(
      (item, index) =>
        `<c:pt idx="${index}"><c:v>${escapeXmlText(item.label)}</c:v></c:pt>`,
    )
    .join('');
  const valuePoints = normalizedRows
    .map((item, index) => `<c:pt idx="${index}"><c:v>${item.count}</c:v></c:pt>`)
    .join('');

  const nextCategories = `<c:cat><c:strRef><c:f>Sheet1!$A$2:$A$${cellRangeEnd}</c:f><c:strCache><c:ptCount val="${normalizedRows.length}"/>${categoryPoints}</c:strCache></c:strRef></c:cat>`;
  const nextValues = `<c:val><c:numRef><c:f>Sheet1!$B$2:$B$${cellRangeEnd}</c:f><c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="${normalizedRows.length}"/>${valuePoints}</c:numCache></c:numRef></c:val>`;

  return chartXml
    .replace(/<c:cat>[\s\S]*?<\/c:cat>/, nextCategories)
    .replace(/<c:val>[\s\S]*?<\/c:val>/, nextValues);
}

function buildOpsDetailLines(report: QuarterlySummaryReport) {
  const lines: string[] = [];

  if (report.majorMeasures.length > 0) {
    lines.push(...report.majorMeasures.map((item) => `- ${item}`));
  }
  if (formatOptionalText(report.opsAssetDescription)) {
    lines.push(report.opsAssetDescription.trim());
  }
  if (formatOptionalText(report.opsAssetFileName)) {
    lines.push(`${OPS_FILE_LABEL}: ${report.opsAssetFileName.trim()}`);
  }
  if (formatOptionalText(report.opsAssetFileUrl)) {
    lines.push(report.opsAssetFileUrl.trim());
  }
  if (formatOptionalText(report.opsAssignedBy)) {
    lines.push(
      `${OPS_ASSIGNED_BY_LABEL}: ${report.opsAssignedBy.trim()}${report.opsAssignedAt ? ` / ${report.opsAssignedAt}` : ''}`,
    );
  }

  if (lines.length === 0) {
    lines.push(OPS_PENDING_BODY);
  }

  return lines.join('\n');
}

function updateSnapshotTable(tableXml: string, report: QuarterlySummaryReport, site: InspectionSite) {
  const snapshot = report.siteSnapshot;
  const siteManagement = combineDistinctValues([
    snapshot.siteManagementNumber,
    snapshot.businessStartNumber,
  ]);
  const corporationRegistration = combineDistinctValues([
    snapshot.corporationRegistrationNumber,
    snapshot.businessRegistrationNumber,
  ]);

  let nextTable = tableXml;
  nextTable = replaceCellText(nextTable, 1, 2, formatText(snapshot.siteName || site.siteName));
  nextTable = replaceCellText(nextTable, 1, 4, formatText(siteManagement));
  nextTable = replaceCellText(nextTable, 2, 2, formatText(snapshot.constructionPeriod));
  nextTable = replaceCellText(nextTable, 2, 4, formatText(snapshot.constructionAmount));
  nextTable = replaceCellText(nextTable, 3, 2, formatText(snapshot.siteManagerName));
  nextTable = replaceCellText(nextTable, 3, 4, formatText(snapshot.siteContactEmail));
  nextTable = replaceCellText(nextTable, 4, 2, formatText(snapshot.siteAddress));
  nextTable = replaceCellText(nextTable, 6, 2, formatText(snapshot.companyName));
  nextTable = replaceCellText(nextTable, 6, 4, formatText(corporationRegistration));
  nextTable = replaceCellText(nextTable, 7, 2, formatText(snapshot.licenseNumber));
  nextTable = replaceCellText(nextTable, 7, 4, formatText(snapshot.headquartersContact));
  nextTable = replaceCellText(nextTable, 8, 2, formatText(snapshot.headquartersAddress));

  return nextTable;
}

function updateOverallCommentTable(tableXml: string, report: QuarterlySummaryReport) {
  return replaceCellText(tableXml, 1, 0, formatText(report.overallComment, EMPTY_COMMENT), {
    stripLineSeg: true,
  });
}

function updateImplementationTable(tableXml: string, report: QuarterlySummaryReport) {
  const rows =
    report.implementationRows.length > 0
      ? report.implementationRows
      : [
          {
            sessionId: '',
            reportTitle: '',
            reportDate: '',
            reportNumber: 0,
            drafter: '',
            progressRate: '',
            findingCount: 0,
            improvedCount: 0,
            note: '',
          },
        ];

  let nextTable = ensureDataRowCapacity(tableXml, 3, rows.length);

  rows.forEach((item, index) => {
    const rowAddr = 3 + index;
    nextTable = replaceCellText(
      nextTable,
      rowAddr,
      0,
      item.reportNumber > 0 ? String(item.reportNumber) : NO_DATA_VALUE,
    );
    nextTable = replaceCellText(nextTable, rowAddr, 1, formatText(item.drafter));
    nextTable = replaceCellText(nextTable, rowAddr, 2, formatText(item.reportDate));
    nextTable = replaceCellText(nextTable, rowAddr, 3, formatText(item.progressRate));
    nextTable = replaceCellText(nextTable, rowAddr, 4, String(item.findingCount));
    nextTable = replaceCellText(nextTable, rowAddr, 5, String(item.improvedCount));
    nextTable = replaceCellText(
      nextTable,
      rowAddr,
      6,
      formatText(item.note || item.reportTitle, NO_DATA_VALUE),
    );
  });

  return nextTable;
}

function updateFuturePlanTable(tableXml: string, report: QuarterlySummaryReport) {
  const rows =
    report.futurePlans.length > 0
      ? report.futurePlans
      : [{ processName: '', hazard: '', countermeasure: '', note: '', source: 'api' as const }];

  let nextTable = ensureDataRowCapacity(tableXml, 2, rows.length);

  rows.forEach((item, index) => {
    const rowAddr = 2 + index;
    const leftText = formatOptionalText(item.hazard);
    const rightText = formatOptionalText(item.countermeasure);

    nextTable = replaceCellText(nextTable, rowAddr, 0, formatText(leftText), {
      multiline: true,
      wrapAt: 22,
    });
    nextTable = replaceCellText(nextTable, rowAddr, 1, formatText(rightText), {
      multiline: true,
      wrapAt: 28,
    });
  });

  return nextTable;
}

function updateOpsTable(tableXml: string, report: QuarterlySummaryReport) {
  const opsTitle =
    formatOptionalText(report.opsAssetTitle) ||
    report.majorMeasures[0] ||
    OPS_PENDING_TITLE;

  let nextTable = tableXml;
  nextTable = replaceCellText(nextTable, 1, 0, `\u25A0${opsTitle}`);
  nextTable = replaceCellText(nextTable, 2, 0, buildOpsDetailLines(report), {
    multiline: true,
    wrapAt: 42,
  });
  return nextTable;
}

function updateSectionXml(sectionXml: string, report: QuarterlySummaryReport, site: InspectionSite) {
  const tableBlocks = matchTableBlocks(sectionXml);
  if (tableBlocks.length < 6) {
    throw new Error('Quarterly HWPX template table structure was not detected.');
  }

  const tables = tableBlocks.map((block) => block.xml);
  tables[0] = updateSnapshotTable(tables[0], report, site);
  tables[2] = updateOverallCommentTable(tables[2], report);
  tables[3] = updateImplementationTable(tables[3], report);
  tables[4] = updateFuturePlanTable(tables[4], report);
  tables[5] = updateOpsTable(tables[5], report);

  const rebuilt = rebuildSectionXml(sectionXml, tableBlocks, tables);
  return replaceNthTextNode(rebuilt, SECTION_TITLE_INDEX, report.title);
}

export async function buildQuarterlyHwpxDocument(
  report: QuarterlySummaryReport,
  site: InspectionSite,
): Promise<GeneratedHwpxDocument> {
  const templateBuffer = await fs.readFile(TEMPLATE_PATH);
  const zip = await JSZip.loadAsync(templateBuffer);

  const sectionXmlFile = zip.file('Contents/section0.xml');
  const accidentChartFile = zip.file('Chart/chart1.xml');
  const causativeChartFile = zip.file('Chart/chart2.xml');

  if (!sectionXmlFile || !accidentChartFile || !causativeChartFile) {
    throw new Error('Quarterly HWPX template is missing required assets.');
  }

  const sectionXml = await sectionXmlFile.async('string');
  const accidentChartXml = await accidentChartFile.async('string');
  const causativeChartXml = await causativeChartFile.async('string');

  zip.file('Contents/section0.xml', updateSectionXml(sectionXml, report, site));
  zip.file('Chart/chart1.xml', updateChartXml(accidentChartXml, report.accidentStats));
  zip.file('Chart/chart2.xml', updateChartXml(causativeChartXml, report.causativeStats));

  return {
    buffer: await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }),
    filename: fileNameForQuarterlyReport(report, site),
  };
}
