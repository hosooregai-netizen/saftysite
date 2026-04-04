import fs from 'node:fs/promises';
import path from 'node:path';

import { imageSize } from 'image-size';
import JSZip from 'jszip';

import type { QuarterlyCounter, QuarterlySummaryReport } from '@/types/erpReports';
import type { InspectionSite } from '@/types/inspectionSession';

export interface GeneratedHwpxDocument {
  buffer: Buffer;
  filename: string;
}

interface QuarterlyHwpxBuildOptions {
  assetBaseUrl?: string;
}

interface ResolvedHwpxImageAsset {
  buffer: Uint8Array;
  extension: string;
  height: number;
  mediaType: string;
  width: number;
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
const OPS_IMAGE_ITEM_ID = 'opsAssetImage';
const NO_DATA_VALUE = '-';
const SECTION_TITLE_INDEX = 1;
const IMAGE_EXTENSION_TO_MEDIA_TYPE: Record<string, string> = {
  bmp: 'image/bmp',
  gif: 'image/gif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

function sanitizeDocumentFileName(value: string | null | undefined, fallback: string) {
  const normalized = (value ?? '').replace(/[\\/:*?"<>|]/g, '-').trim();
  return normalized || fallback;
}

function fileNameForQuarterlyReport(report: QuarterlySummaryReport, site: InspectionSite) {
  const siteName = sanitizeDocumentFileName(
    report.siteSnapshot.siteName || site.siteName || report.siteId || 'quarterly-report',
    'quarterly-report',
  );
  const periodToken = sanitizeDocumentFileName(
    report.periodStartDate && report.periodEndDate
      ? `${report.periodStartDate}_${report.periodEndDate}`
      : report.quarterKey || report.id,
    'quarterly-report',
  );
  return `${siteName}-${periodToken}-quarterly-report.hwpx`;
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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

function parseDataUrl(value: string) {
  const match = value.match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) return null;
  return {
    buffer: Buffer.from(match[2], 'base64'),
    mediaType: match[1].toLowerCase(),
  };
}

function normalizeHwpxMediaType(mediaType: string, href: string) {
  const normalized = mediaType.toLowerCase();
  const extension = href.split(/[?#]/)[0].split('.').pop()?.toLowerCase() ?? '';
  if (normalized === 'image/jpeg' || normalized === 'image/jpg' || extension === 'jpg' || extension === 'jpeg') {
    return 'image/jpg';
  }
  return normalized;
}

function upsertManifestItem(contentHpf: string, itemId: string, href: string, mediaType: string) {
  const manifestItem = `<opf:item id="${itemId}" href="${href}" media-type="${mediaType}" isEmbeded="1" />`;
  const itemPattern = new RegExp(`<opf:item\\b[^>]*\\bid="${escapeRegExp(itemId)}"[^>]*/>`, 'g');
  const withoutExisting = contentHpf.replace(itemPattern, '');
  return withoutExisting.replace('</opf:manifest>', `${manifestItem}</opf:manifest>`);
}

function ensureUniquePictureObjectIds(sectionXml: string) {
  const pictureTagPattern = /<hp:pic\b[^>]*>/g;
  const currentPictureIds = Array.from(
    sectionXml.matchAll(/<hp:pic\b[^>]*\bid="(\d+)"/g),
    (match) => Number.parseInt(match[1], 10),
  ).filter(Number.isFinite);
  const currentInstanceIds = Array.from(
    sectionXml.matchAll(/<hp:pic\b[^>]*\binstid="(\d+)"/g),
    (match) => Number.parseInt(match[1], 10),
  ).filter(Number.isFinite);
  let nextPictureId = Math.max(2110926000, ...currentPictureIds, 0);
  let nextInstanceId = Math.max(1037185000, ...currentInstanceIds, 0);

  return sectionXml.replace(pictureTagPattern, (pictureTag) => {
    nextPictureId += 1;
    nextInstanceId += 1;

    return pictureTag
      .replace(/\bid="\d+"/, `id="${nextPictureId}"`)
      .replace(/\binstid="\d+"/, `instid="${nextInstanceId}"`);
  });
}

function resolveDocumentAssetUrl(value: string | null | undefined, baseUrl?: string) {
  const normalized = formatOptionalText(value);
  if (!normalized) {
    return null;
  }

  if (normalized.startsWith('data:')) {
    return normalized;
  }

  try {
    return new URL(normalized).toString();
  } catch {
    if (!baseUrl) {
      return null;
    }

    try {
      return new URL(normalized, baseUrl).toString();
    } catch {
      return null;
    }
  }
}

function fitImageToBounds(
  sourceWidth: number,
  sourceHeight: number,
  maxWidth: number,
  maxHeight: number,
) {
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return {
      height: Math.max(1, maxHeight),
      width: Math.max(1, maxWidth),
    };
  }

  let width = Math.max(1, maxWidth);
  let height = Math.max(1, Math.round((width * sourceHeight) / sourceWidth));

  if (height > maxHeight) {
    height = Math.max(1, maxHeight);
    width = Math.max(1, Math.round((height * sourceWidth) / sourceHeight));
  }

  return { height, width };
}

async function fetchImageAssetFromUrl(url: string): Promise<ResolvedHwpxImageAsset | null> {
  if (url.startsWith('data:')) {
    const parsed = parseDataUrl(url);
    if (!parsed) {
      return null;
    }

    const extension = IMAGE_EXTENSION_TO_MEDIA_TYPE[parsed.mediaType.split('/')[1] ?? ''] ? parsed.mediaType.split('/')[1] : '';
    const normalizedExtension =
      extension && extension in IMAGE_EXTENSION_TO_MEDIA_TYPE
        ? extension === 'jpeg'
          ? 'jpg'
          : extension
        : '';
    if (!normalizedExtension) {
      return null;
    }

    const size = imageSize(parsed.buffer);
    if (!size.width || !size.height) {
      return null;
    }

    return {
      buffer: new Uint8Array(parsed.buffer),
      extension: normalizedExtension,
      height: size.height,
      mediaType: parsed.mediaType,
      width: size.width,
    };
  }

  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    return null;
  }

  const contentType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase() ?? '';
  if (!contentType.startsWith('image/')) {
    return null;
  }

  const extensionFromType = Object.entries(IMAGE_EXTENSION_TO_MEDIA_TYPE).find(
    ([, mediaType]) => mediaType === contentType,
  )?.[0];
  const extensionFromUrl = url.split(/[?#]/)[0].split('.').pop()?.toLowerCase() ?? '';
  const extension =
    (extensionFromType || extensionFromUrl || '').replace('jpeg', 'jpg');
  if (!(extension in IMAGE_EXTENSION_TO_MEDIA_TYPE)) {
    return null;
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const size = imageSize(buffer);
  if (!size.width || !size.height) {
    return null;
  }

  return {
    buffer: new Uint8Array(buffer),
    extension,
    height: size.height,
    mediaType: contentType,
    width: size.width,
  };
}

async function resolveOpsImageAsset(
  report: QuarterlySummaryReport,
  options?: QuarterlyHwpxBuildOptions,
) {
  const candidates = [report.opsAssetFileUrl, report.opsAssetPreviewUrl]
    .map((value) => resolveDocumentAssetUrl(value, options?.assetBaseUrl))
    .filter((value, index, array): value is string => Boolean(value) && array.indexOf(value) === index);

  for (const candidate of candidates) {
    const resolved = await fetchImageAssetFromUrl(candidate);
    if (resolved) {
      return resolved;
    }
  }

  return null;
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

function extractCellImageBounds(cellXml: string) {
  const sizeMatch = cellXml.match(/<hp:cellSz\b[^>]*width="(\d+)"[^>]*height="(\d+)"/);
  if (!sizeMatch) {
    return null;
  }

  const marginMatch = cellXml.match(
    /<hp:cellMargin\b[^>]*left="(\d+)"[^>]*right="(\d+)"[^>]*top="(\d+)"[^>]*bottom="(\d+)"/,
  );
  const left = Number.parseInt(marginMatch?.[1] ?? '0', 10);
  const right = Number.parseInt(marginMatch?.[2] ?? '0', 10);
  const top = Number.parseInt(marginMatch?.[3] ?? '0', 10);
  const bottom = Number.parseInt(marginMatch?.[4] ?? '0', 10);
  const width = Number.parseInt(sizeMatch[1], 10);
  const height = Number.parseInt(sizeMatch[2], 10);

  return {
    height: Math.max(1200, height - top - bottom),
    width: Math.max(1200, width - left - right),
  };
}

function buildHwpxImageRun(
  charPrIDRef: string,
  binaryItemId: string,
  width: number,
  height: number,
) {
  return (
    `<hp:run charPrIDRef="${charPrIDRef}">` +
    '<hp:pic id="2110926001" zOrder="0" numberingType="PICTURE" textWrap="TOP_AND_BOTTOM" textFlow="BOTH_SIDES" lock="0" dropcapstyle="None" href="" groupLevel="0" instid="1037185001" reverse="0">' +
    '<hp:offset x="0" y="0"/>' +
    `<hp:orgSz width="${width}" height="${height}"/>` +
    `<hp:curSz width="${width}" height="${height}"/>` +
    '<hp:flip horizontal="0" vertical="0"/>' +
    `<hp:rotationInfo angle="0" centerX="${Math.floor(width / 2)}" centerY="${Math.floor(height / 2)}" rotateimage="1"/>` +
    '<hp:renderingInfo>' +
    '<hc:transMatrix e1="1" e2="0" e3="0" e4="0" e5="1" e6="0"/>' +
    '<hc:scaMatrix e1="1" e2="0" e3="0" e4="0" e5="1" e6="0"/>' +
    '<hc:rotMatrix e1="1" e2="0" e3="0" e4="0" e5="1" e6="0"/>' +
    '</hp:renderingInfo>' +
    `<hp:imgRect><hc:pt0 x="0" y="0"/><hc:pt1 x="${width}" y="0"/><hc:pt2 x="${width}" y="${height}"/><hc:pt3 x="0" y="${height}"/></hp:imgRect>` +
    '<hp:imgClip left="0" right="0" top="0" bottom="0"/>' +
    '<hp:inMargin left="0" right="0" top="0" bottom="0"/>' +
    '<hp:imgDim dimwidth="0" dimheight="0"/>' +
    `<hc:img binaryItemIDRef="${binaryItemId}" bright="0" contrast="0" effect="REAL_PIC" alpha="0"/>` +
    '<hp:effects/>' +
    `<hp:sz width="${width}" widthRelTo="ABSOLUTE" height="${height}" heightRelTo="ABSOLUTE" protect="0"/>` +
    '<hp:pos treatAsChar="1" affectLSpacing="0" flowWithText="1" allowOverlap="0" holdAnchorAndSO="0" vertRelTo="PARA" horzRelTo="COLUMN" vertAlign="CENTER" horzAlign="CENTER" vertOffset="0" horzOffset="0"/>' +
    '<hp:outMargin left="0" right="0" top="0" bottom="0"/>' +
    `<hp:shapeComment>${binaryItemId}</hp:shapeComment>` +
    '</hp:pic><hp:t/></hp:run>'
  );
}

function replaceCellImage(
  tableXml: string,
  rowAddr: number,
  colAddr: number,
  binaryItemId: string,
  image: ResolvedHwpxImageAsset,
) {
  const targetMarker = `<hp:cellAddr colAddr="${colAddr}" rowAddr="${rowAddr}"/>`;
  const cellBlock = [...tableXml.matchAll(/<hp:tc\b[\s\S]*?<\/hp:tc>/g)]
    .map((match) => match[0])
    .find((candidate) => candidate.includes(targetMarker));
  if (!cellBlock) return tableXml;

  const paragraphTemplate = cellBlock.match(/<hp:p\b[\s\S]*?<\/hp:p>/)?.[0];
  if (!paragraphTemplate) return tableXml;

  const paragraphMatch = paragraphTemplate.match(
    /^(<hp:p\b[^>]*>)([\s\S]*?)(<hp:linesegarray>[\s\S]*?<\/hp:linesegarray>)<\/hp:p>$/,
  );
  if (!paragraphMatch) return tableXml;

  const bounds = extractCellImageBounds(cellBlock);
  if (!bounds) return tableXml;

  const [, paragraphOpen, , lineSegArrayXml] = paragraphMatch;
  const charPrIDRef = paragraphTemplate.match(/<hp:run\b[^>]*charPrIDRef="(\d+)"/)?.[1] ?? '1';
  const fittedSize = fitImageToBounds(image.width, image.height, bounds.width, bounds.height);
  const nextParagraph = `${paragraphOpen}${buildHwpxImageRun(
    charPrIDRef,
    binaryItemId,
    fittedSize.width,
    fittedSize.height,
  )}${lineSegArrayXml}</hp:p>`;
  const nextCell = cellBlock.replace(/<hp:p\b[\s\S]*?<\/hp:p>/, nextParagraph);

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

  if (report.majorMeasures.length > 1) {
    lines.push(...report.majorMeasures.slice(1).map((item) => `- ${item}`));
  }
  if (formatOptionalText(report.opsAssetDescription)) {
    lines.push(report.opsAssetDescription.trim());
  }

  if (lines.length === 0) {
    lines.push(OPS_PENDING_BODY);
  }

  return lines.join('\n');
}

function updateSnapshotTable(tableXml: string, report: QuarterlySummaryReport, site: InspectionSite) {
  const snapshot = report.siteSnapshot;

  let nextTable = tableXml;
  nextTable = replaceCellText(nextTable, 1, 2, formatText(snapshot.siteName || site.siteName));
  nextTable = replaceCellText(nextTable, 1, 4, formatText(snapshot.siteManagementNumber));
  nextTable = replaceCellText(nextTable, 2, 2, formatText(snapshot.constructionPeriod));
  nextTable = replaceCellText(nextTable, 2, 4, formatText(snapshot.constructionAmount));
  nextTable = replaceCellText(nextTable, 3, 2, formatText(snapshot.siteManagerName));
  nextTable = replaceCellText(nextTable, 3, 4, formatText(snapshot.siteContactEmail));
  nextTable = replaceCellText(nextTable, 4, 2, formatText(snapshot.siteAddress));
  nextTable = replaceCellText(nextTable, 6, 2, formatText(snapshot.companyName));
  nextTable = replaceCellText(nextTable, 6, 4, formatText(snapshot.corporationRegistrationNumber));
  nextTable = replaceCellText(nextTable, 7, 2, formatText(snapshot.licenseNumber));
  nextTable = replaceCellText(nextTable, 7, 4, formatText(snapshot.headquartersContact));
  nextTable = replaceCellText(nextTable, 8, 2, formatText(snapshot.headquartersAddress));

  return nextTable;
}

function clearRemovedCommentTable(tableXml: string) {
  return replaceCellText(tableXml, 1, 0, formatText('', EMPTY_COMMENT), {
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
    nextTable = replaceCellText(nextTable, rowAddr, 6, formatText(item.note, NO_DATA_VALUE));
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
    const leftText = formatOptionalText(item.processName || item.hazard);
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

function updateOpsTable(
  tableXml: string,
  report: QuarterlySummaryReport,
  opsImageAsset: ResolvedHwpxImageAsset | null,
) {
  const opsTitle =
    formatOptionalText(report.opsAssetTitle) ||
    report.majorMeasures[0] ||
    OPS_PENDING_TITLE;

  let nextTable = tableXml;
  nextTable = replaceCellText(nextTable, 1, 0, `\u25A0${opsTitle}`);
  nextTable = opsImageAsset
    ? replaceCellImage(nextTable, 2, 0, OPS_IMAGE_ITEM_ID, opsImageAsset)
    : replaceCellText(nextTable, 2, 0, buildOpsDetailLines(report), {
        multiline: true,
        wrapAt: 42,
      });
  return nextTable;
}

function updateSectionXml(
  sectionXml: string,
  report: QuarterlySummaryReport,
  site: InspectionSite,
  opsImageAsset: ResolvedHwpxImageAsset | null,
) {
  const tableBlocks = matchTableBlocks(sectionXml);
  if (tableBlocks.length < 6) {
    throw new Error('Quarterly HWPX template table structure was not detected.');
  }

  const tables = tableBlocks.map((block) => block.xml);
  tables[0] = updateSnapshotTable(tables[0], report, site);
  tables[2] = clearRemovedCommentTable(tables[2]);
  tables[3] = updateImplementationTable(tables[3], report);
  tables[4] = updateFuturePlanTable(tables[4], report);
  tables[5] = updateOpsTable(tables[5], report, opsImageAsset);

  const rebuilt = rebuildSectionXml(sectionXml, tableBlocks, tables);
  return ensureUniquePictureObjectIds(
    replaceNthTextNode(rebuilt, SECTION_TITLE_INDEX, report.title),
  );
}

export async function buildQuarterlyHwpxDocument(
  report: QuarterlySummaryReport,
  site: InspectionSite,
  options?: QuarterlyHwpxBuildOptions,
): Promise<GeneratedHwpxDocument> {
  const templateBuffer = await fs.readFile(TEMPLATE_PATH);
  const zip = await JSZip.loadAsync(templateBuffer);

  const sectionXmlFile = zip.file('Contents/section0.xml');
  const contentHpfFile = zip.file('Contents/content.hpf');
  const accidentChartFile = zip.file('Chart/chart1.xml');
  const causativeChartFile = zip.file('Chart/chart2.xml');

  if (!sectionXmlFile || !contentHpfFile || !accidentChartFile || !causativeChartFile) {
    throw new Error('Quarterly HWPX template is missing required assets.');
  }

  const sectionXml = await sectionXmlFile.async('string');
  let contentHpf = await contentHpfFile.async('string');
  const accidentChartXml = await accidentChartFile.async('string');
  const causativeChartXml = await causativeChartFile.async('string');
  const opsImageAsset = await resolveOpsImageAsset(report, options);

  if (opsImageAsset) {
    const href = `BinData/${OPS_IMAGE_ITEM_ID}.${opsImageAsset.extension}`;
    zip.file(href, opsImageAsset.buffer, { compression: 'STORE' });
    contentHpf = upsertManifestItem(
      contentHpf,
      OPS_IMAGE_ITEM_ID,
      href,
      normalizeHwpxMediaType(opsImageAsset.mediaType, href),
    );
  }

  zip.file('Contents/section0.xml', updateSectionXml(sectionXml, report, site, opsImageAsset));
  zip.file('Contents/content.hpf', contentHpf);
  zip.file('Chart/chart1.xml', updateChartXml(accidentChartXml, report.accidentStats));
  zip.file('Chart/chart2.xml', updateChartXml(causativeChartXml, report.causativeStats));

  return {
    buffer: await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }),
    filename: fileNameForQuarterlyReport(report, site),
  };
}
