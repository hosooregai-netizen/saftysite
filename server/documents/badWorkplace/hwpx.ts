import 'server-only';

import fs from 'node:fs/promises';
import path from 'node:path';

import JSZip from 'jszip';

import {
  normalizeBadWorkplaceAgencyName,
  normalizeBadWorkplaceAgencyRepresentative,
} from '@/lib/erpReports/badWorkplace';
import type { BadWorkplaceReport } from '@/types/erpReports';
import type { InspectionSite } from '@/types/inspectionSession';

export interface GeneratedHwpxDocument {
  buffer: Buffer;
  filename: string;
}

const TEMPLATE_FILENAME =
  '기술지도 미이행 등 사망사고 고위험 취약 현장 통보서.hwpx';
const TEMPLATE_PATH = path.resolve(
  process.cwd(),
  'public',
  'templates',
  'bad-workplace',
  TEMPLATE_FILENAME,
);
const HWPX_CONTENT_TYPE = 'application/haansofthwpx';

function sanitizeDocumentFileName(value: string | null | undefined, fallback: string) {
  const normalized = (value ?? '').replace(/[\\/:*?"<>|]/g, '-').trim();
  return normalized || fallback;
}

function fileNameForBadWorkplaceReport(report: BadWorkplaceReport, site: InspectionSite) {
  const siteName = sanitizeDocumentFileName(
    report.siteSnapshot.siteName || site.siteName || report.siteId,
    'bad-workplace-report',
  );
  const monthToken = sanitizeDocumentFileName(
    report.reportMonth || report.notificationDate || report.id,
    'bad-workplace',
  );
  return `${siteName}-${monthToken}-bad-workplace-report.hwpx`;
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

function formatOptionalText(value: string | null | undefined) {
  return normalizeLineBreaks(value ?? '').trim();
}

function formatText(value: string | null | undefined) {
  return formatOptionalText(value);
}

function formatNoticeDate(value: string | null | undefined) {
  const normalized = formatOptionalText(value);
  const matched = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (matched) {
    return `${matched[1]}년 ${matched[2]}월 ${matched[3]}일`;
  }
  return normalized;
}

function formatInlineDate(value: string | null | undefined) {
  const normalized = formatOptionalText(value);
  const matched = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (matched) {
    return `${matched[1]}.${matched[2]}.${matched[3]}.`;
  }
  return normalized;
}

function buildPersonContactLine(name: string | null | undefined, contact: string | null | undefined) {
  const normalizedName = formatOptionalText(name);
  const normalizedContact = formatOptionalText(contact);

  if (normalizedName && normalizedContact) {
    return `${normalizedName} (${normalizedContact})`;
  }

  return normalizedName || normalizedContact;
}

function buildRecipientOfficeLine(value: string | null | undefined) {
  const normalized = formatOptionalText(value).replace(/\s*귀하$/, '');
  return normalized ? `${normalized} 귀하` : '지방노동청(지청)장 귀하';
}

function buildAgencyRepresentativeLabel(report: BadWorkplaceReport) {
  const agencyName = formatOptionalText(normalizeBadWorkplaceAgencyName(report.agencyName));
  return `${agencyName || '건설재해예방전문지도기관'} 대표자`;
}

function buildViolationCellText(text: string | null | undefined, date: string | null | undefined) {
  const body = formatOptionalText(text);
  const dateText = formatInlineDate(date);

  if (body && dateText) {
    return `${body}\n(${dateText})`;
  }

  if (body) {
    return body;
  }

  return dateText ? `(${dateText})` : '';
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

function replaceParagraphRuns(paragraphXml: string, text: string) {
  const paragraphMatch = paragraphXml.match(
    /^(<hp:p\b[^>]*>)([\s\S]*?)(<hp:linesegarray>[\s\S]*?<\/hp:linesegarray>)<\/hp:p>$/,
  );
  if (!paragraphMatch) {
    return paragraphXml;
  }

  const [, paragraphOpen, , lineSegArrayXml] = paragraphMatch;
  const charPrIDRef = paragraphXml.match(/<hp:run charPrIDRef="([^"]+)"/)?.[1] ?? '8';
  return `${paragraphOpen}${buildRunXml(charPrIDRef, text)}${lineSegArrayXml}</hp:p>`;
}

function buildReflowParagraphs(paragraphTemplate: string, text: string) {
  const paragraphMatch = paragraphTemplate.match(
    /^(<hp:p\b[^>]*>)([\s\S]*?)(<hp:linesegarray>[\s\S]*?<\/hp:linesegarray>)<\/hp:p>$/,
  );
  if (!paragraphMatch) {
    return replaceParagraphRuns(paragraphTemplate, text);
  }

  const [, paragraphOpen, , lineSegArrayXml] = paragraphMatch;
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
  const charPrIDRef = paragraphTemplate.match(/<hp:run charPrIDRef="([^"]+)"/)?.[1] ?? '8';
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
      return `${paragraphOpen}${buildRunXml(charPrIDRef, line)}${lineSegArrayOpen}${nextLineSeg}${lineSegArrayClose}</hp:p>`;
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

  const paragraphMatches = [...cellBlock.matchAll(/<hp:p\b[\s\S]*?<\/hp:p>/g)];
  const paragraphTemplate = paragraphMatches[0]?.[0];
  if (!paragraphTemplate) return tableXml;

  const nextParagraphs = options?.reflow
    ? buildReflowParagraphs(paragraphTemplate, text)
    : options?.multiline
      ? normalizeLineBreaks(text)
          .split('\n')
          .flatMap((line) => wrapHwpxLine(line, options.wrapAt ?? 44))
          .map((line) => replaceParagraphRuns(paragraphTemplate, line))
          .join('')
      : replaceParagraphRuns(paragraphTemplate, text);

  const firstParagraph = paragraphMatches[0];
  const lastParagraph = paragraphMatches[paragraphMatches.length - 1];
  if (!firstParagraph || !lastParagraph || firstParagraph.index == null || lastParagraph.index == null) {
    return tableXml;
  }

  const lastParagraphEnd = lastParagraph.index + lastParagraph[0].length;
  const nextCell =
    cellBlock.slice(0, firstParagraph.index) +
    (options?.stripLineSeg ? stripLineSegArrays(nextParagraphs) : nextParagraphs) +
    cellBlock.slice(lastParagraphEnd);

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

function renumberRows(rows: string[]) {
  return rows.map((row, rowIndex) => row.replace(/rowAddr="\d+"/g, `rowAddr="${rowIndex}"`));
}

function ensureDataRowCapacityBeforeFooter(
  tableXml: string,
  firstDataRowAddr: number,
  footerRowCount: number,
  desiredRowCount: number,
) {
  const rows = getTableRows(tableXml);
  const currentDataRows = rows.length - firstDataRowAddr - footerRowCount;
  if (desiredRowCount <= currentDataRows) {
    return tableXml;
  }

  const prototypeIndex = rows.length - footerRowCount - 1;
  const prototypeRow = rows[prototypeIndex];
  const prototypeHeight = Number(
    prototypeRow.match(/<hp:cellSz\b[^>]*height="(\d+)"/)?.[1] ?? 0,
  );
  const cloneCount = desiredRowCount - currentDataRows;
  const extraRows = Array.from({ length: cloneCount }, () => prototypeRow);
  const nextRows = renumberRows([
    ...rows.slice(0, rows.length - footerRowCount),
    ...extraRows,
    ...rows.slice(rows.length - footerRowCount),
  ]);

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

function normalizePreviewCellText(value: string) {
  return normalizeLineBreaks(value)
    .replace(/\s+/g, ' ')
    .trim();
}

function decodePreviewText(value: string) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function buildPreviewTextFromSection(sectionXml: string) {
  const tableBlocks = matchTableBlocks(sectionXml);
  const lines = tableBlocks.flatMap((table) => {
    const rows = getTableRows(table.xml);

    return rows.map((row) => {
      const cells = [...row.matchAll(/<hp:tc\b[\s\S]*?<\/hp:tc>/g)].map((match) => match[0]);
      const parts = cells.map((cell) => {
        const text = [...cell.matchAll(/<hp:t>([\s\S]*?)<\/hp:t>/g)]
          .map((match) => decodePreviewText(match[1].replace(/<[^>]+>/g, ' ')))
          .map(normalizePreviewCellText)
          .filter(Boolean)
          .join(' ');
        return `<${text}>`;
      });

      return parts.join('');
    });
  });

  return `${lines.join('\n')}\n`;
}

function updateInfoTable(tableXml: string, report: BadWorkplaceReport, site: InspectionSite) {
  const snapshot = report.siteSnapshot;

  let nextTable = tableXml;
  nextTable = replaceCellText(nextTable, 3, 3, formatText(snapshot.siteName || site.siteName), {
    reflow: true,
  });
  nextTable = replaceCellText(nextTable, 3, 6, formatText(snapshot.businessStartNumber), {
    reflow: true,
  });
  nextTable = replaceCellText(nextTable, 4, 3, formatText(snapshot.constructionPeriod), {
    reflow: true,
  });
  nextTable = replaceCellText(nextTable, 4, 6, formatText(report.progressRate), {
    reflow: true,
  });
  nextTable = replaceCellText(nextTable, 5, 3, formatText(snapshot.constructionAmount), {
    reflow: true,
  });
  nextTable = replaceCellText(
    nextTable,
    5,
    6,
    buildPersonContactLine(snapshot.siteManagerName, snapshot.siteManagerPhone),
    { reflow: true },
  );
  nextTable = replaceCellText(nextTable, 6, 3, formatText(snapshot.siteAddress), {
    reflow: true,
  });
  nextTable = replaceCellText(nextTable, 8, 3, formatText(snapshot.companyName), {
    reflow: true,
  });
  nextTable = replaceCellText(nextTable, 8, 6, formatText(snapshot.licenseNumber), {
    reflow: true,
  });
  nextTable = replaceCellText(
    nextTable,
    9,
    3,
    formatText(snapshot.businessRegistrationNumber),
    { reflow: true },
  );
  nextTable = replaceCellText(nextTable, 9, 6, formatText(snapshot.siteManagementNumber), {
    reflow: true,
  });
  nextTable = replaceCellText(nextTable, 10, 3, formatText(snapshot.headquartersAddress), {
    reflow: true,
  });
  nextTable = replaceCellText(nextTable, 12, 3, formatInlineDate(report.guidanceDate), {
    reflow: true,
  });
  nextTable = replaceCellText(nextTable, 12, 6, formatInlineDate(report.confirmationDate), {
    reflow: true,
  });
  nextTable = replaceCellText(
    nextTable,
    13,
    3,
    buildPersonContactLine(report.reporterName, report.assigneeContact),
    { reflow: true },
  );
  nextTable = replaceCellText(nextTable, 16, 0, formatNoticeDate(report.notificationDate), {
    reflow: true,
  });
  nextTable = replaceCellText(nextTable, 18, 2, buildAgencyRepresentativeLabel(report), {
    reflow: true,
  });
  nextTable = replaceCellText(
    nextTable,
    18,
    5,
    formatText(normalizeBadWorkplaceAgencyRepresentative(report.agencyRepresentative)),
    {
      reflow: true,
    },
  );
  nextTable = replaceCellText(nextTable, 20, 0, buildRecipientOfficeLine(report.recipientOfficeName), {
    reflow: true,
  });
  nextTable = replaceCellText(nextTable, 22, 3, formatText(report.attachmentDescription), {
    reflow: true,
  });

  return nextTable;
}

function updateViolationsTable(tableXml: string, report: BadWorkplaceReport) {
  const minimumRows = 5;
  const violations = report.violations;
  const desiredRowCount = Math.max(minimumRows, violations.length);

  let nextTable = ensureDataRowCapacityBeforeFooter(tableXml, 1, 1, desiredRowCount);

  for (let index = 0; index < desiredRowCount; index += 1) {
    const rowAddr = 1 + index;
    const item = violations[index];

    nextTable = replaceCellText(nextTable, rowAddr, 0, formatText(item?.legalReference), {
      reflow: true,
    });
    nextTable = replaceCellText(nextTable, rowAddr, 1, formatText(item?.hazardFactor), {
      reflow: true,
    });
    nextTable = replaceCellText(
      nextTable,
      rowAddr,
      2,
      buildViolationCellText(item?.improvementMeasure, item?.guidanceDate),
      { reflow: true },
    );
    nextTable = replaceCellText(
      nextTable,
      rowAddr,
      3,
      buildViolationCellText(item?.nonCompliance, item?.confirmationDate),
      { reflow: true },
    );
  }

  return nextTable;
}

function updateSectionXml(sectionXml: string, report: BadWorkplaceReport, site: InspectionSite) {
  const tableBlocks = matchTableBlocks(sectionXml);
  if (tableBlocks.length < 3) {
    throw new Error('Bad workplace HWPX template table structure was not detected.');
  }

  const tables = tableBlocks.map((block) => block.xml);
  tables[1] = updateInfoTable(tables[1], report, site);
  tables[2] = updateViolationsTable(tables[2], report);

  return rebuildSectionXml(sectionXml, tableBlocks, tables);
}

export async function buildBadWorkplaceHwpxDocument(
  report: BadWorkplaceReport,
  site: InspectionSite,
): Promise<GeneratedHwpxDocument> {
  const templateBuffer = await fs.readFile(TEMPLATE_PATH);
  const zip = await JSZip.loadAsync(templateBuffer);
  const sectionXmlFile = zip.file('Contents/section0.xml');

  if (!sectionXmlFile) {
    throw new Error('Bad workplace HWPX template is missing Contents/section0.xml.');
  }

  const sectionXml = await sectionXmlFile.async('string');
  const nextSectionXml = updateSectionXml(sectionXml, report, site);
  zip.file('Contents/section0.xml', nextSectionXml);
  if (zip.file('Preview/PrvText.txt')) {
    zip.file('Preview/PrvText.txt', buildPreviewTextFromSection(nextSectionXml));
  }

  return {
    buffer: await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }),
    filename: fileNameForBadWorkplaceReport(report, site),
  };
}
