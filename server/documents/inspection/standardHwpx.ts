'server-only';

import fs from 'node:fs/promises';

import JSZip from 'jszip';

import { DEFAULT_GUIDANCE_AGENCY } from '@/constants/inspectionSession/catalog';
import { resolveTemplateAssetPath } from '@/server/documents/shared/documentAssetPaths';
import type {
  CurrentHazardFinding,
  FutureProcessRiskPlan,
} from '@/types/inspectionSession/documents';
import type { InspectionSession } from '@/types/inspectionSession/session';

const HWPX_CONTENT_TYPE = 'application/haansofthwpx';
const STANDARD_TEMPLATE_SOURCE_FILENAME = 'standard-v1.source.hwpx';
const STANDARD_TEMPLATE_RUNTIME_FILENAME = 'standard-v1.annotated.hwpx';
const STANDARD_TEMPLATE_PATH = resolveTemplateAssetPath(STANDARD_TEMPLATE_SOURCE_FILENAME);
const ZIP_STORED_ENTRY_NAMES = ['mimetype', 'version.xml', 'Preview/PrvImage.png'] as const;
const ZIP_LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const ZIP_CENTRAL_DIRECTORY_FILE_HEADER_SIGNATURE = 0x02014b50;
const ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const ZIP_VERSION_MADE_BY = 0x0b17;
const ZIP_VERSION_NEEDED = 20;
const ZIP_DEFAULT_EXTERNAL_ATTR = 0x81800020;
const ZIP_OLE_EXTERNAL_ATTR = 0x81000021;

export interface GeneratedStandardInspectionHwpxDocument {
  buffer: Buffer;
  filename: string;
}

interface StandardInspectionHwpxBuildOptions {
  assetBaseUrl?: string;
}

function normalizeLineBreaks(value: string) {
  return value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function escapeXmlText(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function normalizeHwpxPlainText(value: string) {
  return normalizeLineBreaks(value);
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

function buildRunXml(charPrIDRef: string, text: string) {
  const escaped = escapeXmlText(text).replace(/\n/g, '<hp:lineBreak/>');
  return `<hp:run charPrIDRef="${charPrIDRef}"><hp:t>${escaped}</hp:t></hp:run>`;
}

function replaceParagraphRuns(paragraphXml: string, text: string) {
  const charPrIDRef = paragraphXml.match(/<hp:run charPrIDRef="([^"]+)"/)?.[1] ?? '8';
  return paragraphXml.replace(
    /(<hp:p\b[^>]*>)([\s\S]*?)(<hp:linesegarray>[\s\S]*?<\/hp:linesegarray>)/,
    `$1${buildRunXml(charPrIDRef, text)}$3`,
  );
}

function extractFirstLineSegMetric(paragraphXml: string, name: string): number | null {
  const match = paragraphXml.match(new RegExp(`<hp:lineseg\\b[^>]*\\b${name}="(\\d+)"`));
  if (!match) return null;
  return Number.parseInt(match[1], 10);
}

function buildReflowParagraphs(paragraphTemplate: string, text: string) {
  // Keep a single paragraph and let Hancom recalculate line segments. Duplicating
  // `<hp:p>` blocks for wrapped lines produced HWPX files that desktop COM rejected.
  return replaceParagraphRuns(paragraphTemplate, normalizeHwpxPlainText(text));
}

function stripLineSegArrays(xml: string) {
  return xml.replace(/<hp:linesegarray>[\s\S]*?<\/hp:linesegarray>/g, '');
}

function replaceCellText(
  tableXml: string,
  rowAddr: number,
  colAddr: number,
  text: string,
  options?: { reflow?: boolean; stripLineSeg?: boolean },
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
    : replaceParagraphRuns(paragraphTemplate, text);
  const shouldStripLineSeg = options?.stripLineSeg ?? options?.reflow ?? text.includes('\n');
  const normalizedLeadingParagraph = shouldStripLineSeg
    ? stripLineSegArrays(nextParagraphs)
    : nextParagraphs;
  const normalizedTrailingParagraphs = paragraphMatches
    .slice(1)
    .map((match) => replaceParagraphRuns(match[0], ' '))
    .map((paragraphXml) => (shouldStripLineSeg ? stripLineSegArrays(paragraphXml) : paragraphXml))
    .join('');

  const firstParagraph = paragraphMatches[0];
  const lastParagraph = paragraphMatches[paragraphMatches.length - 1];
  if (!firstParagraph || !lastParagraph || firstParagraph.index == null || lastParagraph.index == null) {
    return tableXml;
  }

  const lastParagraphEnd = lastParagraph.index + lastParagraph[0].length;
  const nextCell =
    cellBlock.slice(0, firstParagraph.index) +
    normalizedLeadingParagraph +
    normalizedTrailingParagraphs +
    cellBlock.slice(lastParagraphEnd);

  return tableXml.replace(cellBlock, nextCell);
}

function getTableRows(tableXml: string) {
  return [...tableXml.matchAll(/<hp:tr\b[\s\S]*?<\/hp:tr>/g)].map((match) => match[0]);
}

function replaceTableRows(tableXml: string, rows: string[]) {
  const firstRowIndex = tableXml.indexOf('<hp:tr');
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
  return resizeTable(replaceTableRows(tableXml, nextRows), nextRows.length, prototypeHeight * cloneCount);
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

function buildZipWriteOptions(
  entry: JSZip.JSZipObject | null | undefined,
  compression: 'STORE' | 'DEFLATE',
): {
  compression: 'STORE' | 'DEFLATE';
  createFolders: false;
  date?: Date;
  comment?: string;
  unixPermissions?: number | string | null;
  dosPermissions?: number | null;
} {
  return {
    compression,
    createFolders: false,
    date: entry?.date,
    comment: entry?.comment,
    unixPermissions: entry?.unixPermissions,
    dosPermissions: entry?.dosPermissions,
  };
}

async function preserveStoredPackageEntries(zip: JSZip): Promise<void> {
  for (const fileName of ZIP_STORED_ENTRY_NAMES) {
    const entry = zip.file(fileName);
    if (!entry) {
      continue;
    }

    const content = await entry.async(fileName === 'mimetype' ? 'string' : 'uint8array');
    zip.file(fileName, content, buildZipWriteOptions(entry, 'STORE'));
  }
}

function readZipHeaderDateMap(buffer: Uint8Array): Map<string, { modTime: number; modDate: number }> {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  let eocdOffset = -1;
  for (let index = buffer.byteLength - 22; index >= 0; index -= 1) {
    if (view.getUint32(index, true) === ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE) {
      eocdOffset = index;
      break;
    }
  }
  if (eocdOffset === -1) {
    throw new Error('Template HWPX ZIP is missing the end of central directory record.');
  }

  const centralDirectoryOffset = view.getUint32(eocdOffset + 16, true);
  const totalEntries = view.getUint16(eocdOffset + 10, true);
  const entries = new Map<string, { modTime: number; modDate: number }>();
  let offset = centralDirectoryOffset;

  for (let entryIndex = 0; entryIndex < totalEntries; entryIndex += 1) {
    if (view.getUint32(offset, true) !== ZIP_CENTRAL_DIRECTORY_FILE_HEADER_SIGNATURE) {
      throw new Error(`Template HWPX ZIP central directory is malformed at entry ${entryIndex}.`);
    }

    const fileNameLength = view.getUint16(offset + 28, true);
    const extraFieldLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const fileNameBytes = buffer.slice(offset + 46, offset + 46 + fileNameLength);
    const fileName = new TextDecoder().decode(fileNameBytes);

    entries.set(fileName, {
      modTime: view.getUint16(offset + 12, true),
      modDate: view.getUint16(offset + 14, true),
    });

    offset += 46 + fileNameLength + extraFieldLength + commentLength;
  }

  return entries;
}

function patchZipHeadersForHwpx(buffer: Uint8Array, templateBuffer?: Uint8Array): Uint8Array {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const templateDates = templateBuffer
    ? readZipHeaderDateMap(templateBuffer)
    : new Map<string, { modTime: number; modDate: number }>();
  let eocdOffset = -1;
  for (let index = buffer.byteLength - 22; index >= 0; index -= 1) {
    if (view.getUint32(index, true) === ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE) {
      eocdOffset = index;
      break;
    }
  }
  if (eocdOffset === -1) {
    throw new Error('Generated HWPX ZIP is missing the end of central directory record.');
  }

  const centralDirectoryOffset = view.getUint32(eocdOffset + 16, true);
  const totalEntries = view.getUint16(eocdOffset + 10, true);
  let offset = centralDirectoryOffset;

  for (let entryIndex = 0; entryIndex < totalEntries; entryIndex += 1) {
    if (view.getUint32(offset, true) !== ZIP_CENTRAL_DIRECTORY_FILE_HEADER_SIGNATURE) {
      throw new Error(`Generated HWPX ZIP central directory is malformed at entry ${entryIndex}.`);
    }

    const compressionMethod = view.getUint16(offset + 10, true);
    const fileNameLength = view.getUint16(offset + 28, true);
    const extraFieldLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    const fileNameBytes = buffer.slice(offset + 46, offset + 46 + fileNameLength);
    const fileName = new TextDecoder().decode(fileNameBytes);
    const generalPurposeFlag = compressionMethod === 8 ? 4 : 0;
    const externalAttr = fileName.endsWith('.ole') ? ZIP_OLE_EXTERNAL_ATTR : ZIP_DEFAULT_EXTERNAL_ATTR;
    const templateDate = templateDates.get(fileName);

    view.setUint16(offset + 4, ZIP_VERSION_MADE_BY, true);
    view.setUint16(offset + 6, ZIP_VERSION_NEEDED, true);
    view.setUint16(offset + 8, generalPurposeFlag, true);
    if (templateDate) {
      view.setUint16(offset + 12, templateDate.modTime, true);
      view.setUint16(offset + 14, templateDate.modDate, true);
    }
    view.setUint16(offset + 36, 0, true);
    view.setUint16(offset + 38, externalAttr & 0xffff, true);
    view.setUint16(offset + 40, (externalAttr >>> 16) & 0xffff, true);

    if (view.getUint32(localHeaderOffset, true) !== ZIP_LOCAL_FILE_HEADER_SIGNATURE) {
      throw new Error(`Generated HWPX ZIP local header is malformed for "${fileName}".`);
    }

    view.setUint16(localHeaderOffset + 4, ZIP_VERSION_NEEDED, true);
    view.setUint16(localHeaderOffset + 6, generalPurposeFlag, true);
    if (templateDate) {
      view.setUint16(localHeaderOffset + 10, templateDate.modTime, true);
      view.setUint16(localHeaderOffset + 12, templateDate.modDate, true);
    }

    offset += 46 + fileNameLength + extraFieldLength + commentLength;
  }

  return buffer;
}

function formatOptionalText(value: string | null | undefined) {
  return normalizeLineBreaks(value ?? '').trim();
}

function formatCellText(value: string | null | undefined) {
  const trimmed = formatOptionalText(value);
  return trimmed || ' ';
}

function sanitizeAgencyName(value: string) {
  const trimmed = formatOptionalText(value);
  return trimmed === DEFAULT_GUIDANCE_AGENCY ? '' : trimmed;
}

function sanitizeFileName(value: string, fallback: string) {
  const normalized = value.replace(/[\\/:*?"<>|]/g, '-').trim();
  return normalized || fallback;
}

function formatDatePair(guidanceDate: string, confirmationDate: string) {
  const left = formatOptionalText(guidanceDate);
  const right = formatOptionalText(confirmationDate);
  if (!left && !right) return ' ';
  if (!right) return left;
  if (!left) return `(${right})`;
  return `${left}\n(${right})`;
}

function buildConstructionTypeText(value: string) {
  const normalized = formatOptionalText(value);
  if (normalized.includes('전기')) {
    return '□ 건설 / ☑ 전기·정보통신';
  }
  if (normalized) {
    return '☑ 건설 / □ 전기·정보통신';
  }
  return '□ 건설 / □ 전기·정보통신';
}

function buildProgressRateText(value: string) {
  const normalized = formatOptionalText(value);
  return normalized ? `( ${normalized} ) %` : '( ) %';
}

function buildVisitCountText(visitCount: string, totalVisitCount: string) {
  const visit = formatOptionalText(visitCount);
  const total = formatOptionalText(totalVisitCount);
  return `( ${visit} ) 회차 / 총 ( ${total} ) 회`;
}

function buildPreviousImplementationStatusText(value: string) {
  switch (value) {
    case 'implemented':
      return '☑ 이행 / □ 불이행';
    case 'partial':
      return '☑ 이행 / ☑ 불이행 (일부 이행)';
    case 'not_implemented':
      return '□ 이행 / ☑ 불이행';
    default:
      return '□ 이행 / □ 불이행';
  }
}

function buildNotificationMethodText(session: InspectionSession) {
  const method = session.document2Overview.notificationMethod;
  const directName = formatOptionalText(session.document2Overview.notificationRecipientName);
  const otherText = formatOptionalText(session.document2Overview.otherNotificationMethod);
  const parts = [
    `${method === 'direct' ? '☑' : '□'} 직접전달 ( 성함 ${directName} )`,
    `${method === 'registered_mail' ? '☑' : '□'} 등기우편`,
    `${method === 'email' ? '☑' : '□'} 전자우편`,
    `${method === 'mobile' ? '☑' : '□'} 모바일`,
    `${method === 'other' ? '☑' : '□'} 기타 ( ${otherText} )`,
  ];
  return parts.join(' ');
}

function buildCurrentHazardRemark(finding: CurrentHazardFinding) {
  const immediate = `${finding.emphasis} ${finding.improvementPlan}`.includes('즉시');
  const base = immediate
    ? '□ 추후 이행여부 확인 필요 / ☑ 즉시 이행가능'
    : '☑ 추후 이행여부 확인 필요 / □ 즉시 이행가능';
  const emphasis = formatOptionalText(finding.emphasis);
  return emphasis ? `${base}\n${emphasis}` : base;
}

function fileNameForSession(session: InspectionSession) {
  const siteName = sanitizeFileName(session.adminSiteSnapshot.siteName || session.meta.siteName, 'technical-guidance');
  const dateToken = sanitizeFileName(session.document2Overview.guidanceDate || session.meta.reportDate, 'report');
  return `${siteName}-${dateToken}-기술지도결과보고서.hwpx`;
}

function getMeaningfulFollowUps(session: InspectionSession) {
  return session.document4FollowUps.filter(
    (item) =>
      formatOptionalText(item.location) ||
      formatOptionalText(item.hazardDescription) ||
      formatOptionalText(item.actionRequired) ||
      formatOptionalText(item.result),
  );
}

function getMeaningfulFindings(session: InspectionSession) {
  return session.document7Findings.filter(
    (item) =>
      formatOptionalText(item.location) ||
      formatOptionalText(item.hazardDescription ?? '') ||
      formatOptionalText(item.improvementPlan),
  );
}

function getMeaningfulPlans(session: InspectionSession) {
  return session.document8Plans.filter(
    (item) =>
      formatOptionalText(item.processName) ||
      formatOptionalText(item.hazard) ||
      formatOptionalText(item.countermeasure),
  );
}

function buildMainProcessSlots(session: InspectionSession, plans: FutureProcessRiskPlan[]) {
  const collected = plans
    .map((item) => formatOptionalText(item.processName))
    .filter(Boolean);
  const extra = formatOptionalText(session.document5Summary.summaryText)
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

  const unique = [...collected, ...extra].filter(
    (value, index, array) => array.indexOf(value) === index,
  );
  return Array.from({ length: 9 }, (_item, index) => unique[index] ?? ' ');
}

function buildSection1And2Table(session: InspectionSession, tableXml: string) {
  const site = session.adminSiteSnapshot;
  const overview = session.document2Overview;
  let nextTable = tableXml;

  nextTable = replaceCellText(nextTable, 1, 2, formatCellText(site.siteName || session.meta.siteName));
  nextTable = replaceCellText(
    nextTable,
    1,
    4,
    formatCellText(
      [formatOptionalText(site.siteManagementNumber), formatOptionalText(site.businessStartNumber)]
        .filter(Boolean)
        .join(' '),
    ),
  );
  nextTable = replaceCellText(nextTable, 2, 2, formatCellText(site.constructionPeriod));
  nextTable = replaceCellText(nextTable, 2, 4, formatCellText(site.constructionAmount));
  nextTable = replaceCellText(nextTable, 3, 2, formatCellText(site.siteManagerName));
  nextTable = replaceCellText(nextTable, 3, 4, formatCellText(site.siteContactEmail || overview.contact));
  nextTable = replaceCellText(nextTable, 4, 2, formatCellText(site.siteAddress), { reflow: true });
  nextTable = replaceCellText(nextTable, 6, 2, formatCellText(site.companyName || site.customerName));
  nextTable = replaceCellText(
    nextTable,
    6,
    4,
    formatCellText(
      [formatOptionalText(site.corporationRegistrationNumber), formatOptionalText(site.businessRegistrationNumber)]
        .filter(Boolean)
        .join(' '),
    ),
  );
  nextTable = replaceCellText(nextTable, 7, 2, formatCellText(site.licenseNumber));
  nextTable = replaceCellText(nextTable, 7, 4, formatCellText(site.headquartersContact));
  nextTable = replaceCellText(nextTable, 8, 2, formatCellText(site.headquartersAddress), {
    reflow: true,
  });
  nextTable = replaceCellText(nextTable, 11, 2, formatCellText(sanitizeAgencyName(overview.guidanceAgencyName)));
  nextTable = replaceCellText(nextTable, 11, 4, formatCellText(overview.guidanceDate || session.meta.reportDate));
  nextTable = replaceCellText(nextTable, 12, 2, buildConstructionTypeText(overview.constructionType));
  nextTable = replaceCellText(nextTable, 12, 4, buildProgressRateText(overview.progressRate));
  nextTable = replaceCellText(nextTable, 13, 2, buildVisitCountText(overview.visitCount, overview.totalVisitCount));
  nextTable = replaceCellText(nextTable, 13, 4, formatCellText(overview.assignee || session.meta.drafter));
  nextTable = replaceCellText(
    nextTable,
    14,
    2,
    buildPreviousImplementationStatusText(overview.previousImplementationStatus),
  );
  nextTable = replaceCellText(nextTable, 14, 4, formatCellText(overview.contact || site.siteContactEmail));
  nextTable = replaceCellText(nextTable, 15, 2, buildNotificationMethodText(session), {
    reflow: true,
  });
  nextTable = replaceCellText(
    nextTable,
    16,
    2,
    formatCellText(overview.processAndNotes || overview.processWorkContent),
    { reflow: true },
  );

  return nextTable;
}

function buildFollowUpTable(session: InspectionSession, tableXml: string) {
  const items = getMeaningfulFollowUps(session);
  const rowCount = Math.max(items.length, 7);
  let nextTable = ensureDataRowCapacity(tableXml, 2, rowCount);

  for (let index = 0; index < rowCount; index += 1) {
    const item = items[index];
    const rowAddr = 2 + index;
    nextTable = replaceCellText(
      nextTable,
      rowAddr,
      0,
      item ? formatDatePair(item.guidanceDate, item.confirmationDate) : ' ',
      { reflow: true },
    );
    nextTable = replaceCellText(nextTable, rowAddr, 1, formatCellText(item?.location), { reflow: true });
    nextTable = replaceCellText(
      nextTable,
      rowAddr,
      2,
      formatCellText(item?.hazardDescription ?? ''),
      { reflow: true },
    );
    nextTable = replaceCellText(
      nextTable,
      rowAddr,
      3,
      formatCellText(item?.actionRequired ?? ''),
      { reflow: true },
    );
    nextTable = replaceCellText(nextTable, rowAddr, 4, formatCellText(item?.result), { reflow: true });
  }

  return nextTable;
}

function buildCurrentHazardsTable(session: InspectionSession, tableXml: string) {
  const items = getMeaningfulFindings(session);
  const rowCount = Math.max(items.length, 7);
  let nextTable = ensureDataRowCapacity(tableXml, 2, rowCount);

  for (let index = 0; index < rowCount; index += 1) {
    const item = items[index];
    const rowAddr = 2 + index;
    nextTable = replaceCellText(nextTable, rowAddr, 0, formatCellText(item?.location), { reflow: true });
    nextTable = replaceCellText(
      nextTable,
      rowAddr,
      1,
      formatCellText(item?.hazardDescription ?? ''),
      { reflow: true },
    );
    nextTable = replaceCellText(
      nextTable,
      rowAddr,
      2,
      formatCellText(item?.improvementPlan),
      { reflow: true },
    );
    nextTable = replaceCellText(nextTable, rowAddr, 3, item ? buildCurrentHazardRemark(item) : ' ', {
      reflow: true,
    });
  }

  return nextTable;
}

function buildFuturePlansTable(session: InspectionSession, tableXml: string) {
  const items = getMeaningfulPlans(session);
  const mainProcessSlots = buildMainProcessSlots(session, items);
  const rowCount = Math.max(items.length, 11);
  let nextTable = ensureDataRowCapacity(tableXml, 5, rowCount);

  const slotTargets: Array<[number, number]> = [
    [1, 2],
    [2, 2],
    [3, 2],
    [1, 3],
    [2, 3],
    [3, 3],
    [1, 5],
    [2, 5],
    [3, 5],
  ];
  slotTargets.forEach(([rowAddr, colAddr], index) => {
    nextTable = replaceCellText(nextTable, rowAddr, colAddr, mainProcessSlots[index] ?? ' ');
  });

  for (let index = 0; index < rowCount; index += 1) {
    const item = items[index];
    const rowAddr = 5 + index;
    nextTable = replaceCellText(nextTable, rowAddr, 0, formatCellText(item?.processName), {
      reflow: true,
    });
    nextTable = replaceCellText(nextTable, rowAddr, 1, formatCellText(item?.hazard), {
      reflow: true,
    });
    nextTable = replaceCellText(nextTable, rowAddr, 4, formatCellText(item?.countermeasure), {
      reflow: true,
    });
    nextTable = replaceCellText(nextTable, rowAddr, 6, formatCellText(item?.note), {
      reflow: true,
    });
  }

  return nextTable;
}

function buildSupportTable(session: InspectionSession, tableXml: string) {
  const education = session.document11EducationRecords[0];
  const support = session.document12Activities[0];
  const memo = session.document14SafetyInfos[0];
  let nextTable = tableXml;

  nextTable = replaceCellText(
    nextTable,
    2,
    1,
    `ㅇ 참석인원 : ${formatOptionalText(education?.attendeeCount) || ''}`,
    { reflow: true },
  );
  nextTable = replaceCellText(
    nextTable,
    3,
    1,
    `ㅇ 교육내용 : ${formatOptionalText(education?.content) || formatOptionalText(education?.topic) || ''}`,
    { reflow: true },
  );
  nextTable = replaceCellText(
    nextTable,
    4,
    1,
    `ㅇ 보급한 교육자료 ${formatOptionalText(support?.activityType) || formatOptionalText(education?.materialName) || ''}`,
    { reflow: true },
  );
  nextTable = replaceCellText(nextTable, 5, 1, formatCellText(support?.content), { reflow: true });
  nextTable = replaceCellText(
    nextTable,
    6,
    1,
    formatCellText(
      [formatOptionalText(memo?.title), formatOptionalText(memo?.body)].filter(Boolean).join('\n'),
    ),
    { reflow: true },
  );

  return nextTable;
}

function renderSectionXml(session: InspectionSession, sectionXml: string) {
  const tableBlocks = matchTableBlocks(sectionXml);
  if (tableBlocks.length < 7) {
    throw new Error('Standard inspection HWPX template table structure was not detected.');
  }

  const nextTables = tableBlocks.map((block) => block.xml);
  nextTables[2] = buildSection1And2Table(session, nextTables[2] ?? tableBlocks[2]!.xml);
  nextTables[3] = buildFollowUpTable(session, nextTables[3] ?? tableBlocks[3]!.xml);
  nextTables[4] = buildCurrentHazardsTable(session, nextTables[4] ?? tableBlocks[4]!.xml);
  nextTables[5] = buildFuturePlansTable(session, nextTables[5] ?? tableBlocks[5]!.xml);
  nextTables[6] = buildSupportTable(session, nextTables[6] ?? tableBlocks[6]!.xml);
  return rebuildSectionXml(sectionXml, tableBlocks, nextTables);
}

export function createStandardInspectionHwpxDownloadResponse(
  document: GeneratedStandardInspectionHwpxDocument,
) {
  return new Response(new Uint8Array(document.buffer), {
    status: 200,
    headers: {
      'Content-Type': HWPX_CONTENT_TYPE,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(document.filename)}`,
    },
  });
}

export async function buildStandardInspectionHwpxDocument(
  session: InspectionSession,
  _siteSessions: InspectionSession[] = [session],
  _options?: StandardInspectionHwpxBuildOptions,
): Promise<GeneratedStandardInspectionHwpxDocument> {
  const templateBuffer = await fs.readFile(STANDARD_TEMPLATE_PATH);
  const zip = await JSZip.loadAsync(templateBuffer);
  const sectionEntry = zip.file('Contents/section0.xml');
  if (!sectionEntry) {
    throw new Error('The standard inspection HWPX template is missing Contents/section0.xml.');
  }
  const sectionXml = await sectionEntry.async('string');

  zip.file(
    'Contents/section0.xml',
    renderSectionXml(session, sectionXml),
    buildZipWriteOptions(sectionEntry, 'DEFLATE'),
  );
  await preserveStoredPackageEntries(zip);
  const buffer = patchZipHeadersForHwpx(
    await zip.generateAsync({
      compression: 'DEFLATE',
      mimeType: 'application/hwp+zip',
      type: 'uint8array',
    }),
    new Uint8Array(templateBuffer),
  );

  return {
    buffer: Buffer.from(buffer),
    filename: fileNameForSession(session).replace(
      '.hwpx',
      `-${STANDARD_TEMPLATE_RUNTIME_FILENAME.replace('.hwpx', '')}.hwpx`,
    ),
  };
}
