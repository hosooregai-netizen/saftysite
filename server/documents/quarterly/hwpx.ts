import fs from 'node:fs/promises';
import path from 'node:path';

import { imageSize } from 'image-size';
import JSZip from 'jszip';

import {
  buildQuarterlyTitleForPeriod,
  normalizeQuarterlyReportPeriod,
} from '@/lib/erpReports/shared';
import { appendInspectionAppendixSections } from '@/server/documents/quarterly/inspectionAppendixMerge';
import type { QuarterlyCounter, QuarterlySummaryReport } from '@/types/erpReports';
import type { InspectionSession, InspectionSite } from '@/types/inspectionSession';

export interface GeneratedHwpxDocument {
  buffer: Buffer;
  filename: string;
}

interface QuarterlyHwpxBuildOptions {
  assetBaseUrl?: string;
  selectedSessions?: InspectionSession[];
  siteSessions?: InspectionSession[];
}

interface ResolvedHwpxImageAsset {
  buffer: Uint8Array;
  extension: string;
  height: number;
  mediaType: string;
  width: number;
}

interface QuarterlyChartImageAssets {
  accident: ResolvedHwpxImageAsset;
  causative: ResolvedHwpxImageAsset;
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
const OPS_PENDING_TITLE = '\uAD00\uB9AC\uC790 \uBCF4\uC644 \uB300\uAE30';
const OPS_PENDING_BODY = '\uAD00\uB9AC\uC790\uAC00 OPS \uC790\uB8CC\uB97C \uC544\uC9C1 \uC5F0\uACB0\uD558\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.';
const OPS_IMAGE_ITEM_ID = 'opsAssetImage';
const OPS_TEMPLATE_IMAGE_ITEM_ID = 'tplopsimg01';
const ACCIDENT_CHART_IMAGE_ITEM_ID = 'quarterlyAccidentChartImage';
const CAUSATIVE_CHART_IMAGE_ITEM_ID = 'quarterlyCausativeChartImage';
const NO_DATA_VALUE = '-';
const COVER_TITLE_TEXT_INDEX = 2;
const COVER_SITE_NAME_TEXT_INDEX = 4;
const COVER_REPORT_DATE_TEXT_INDEX = 5;
const BODY_TITLE_TEXT_INDEX = 12;
const QUARTERLY_CHART_WIDTH = 1560;
const QUARTERLY_CHART_HEIGHT = 640;
const QUARTERLY_CHART_CENTER_X = 280;
const QUARTERLY_CHART_CENTER_Y = 320;
const QUARTERLY_CHART_OUTER_RADIUS = 210;
const QUARTERLY_CHART_INNER_RADIUS = 118;
const QUARTERLY_CHART_LEGEND_LEFT = 560;
const QUARTERLY_CHART_LEGEND_RIGHT = 1504;
const QUARTERLY_CHART_LEGEND_TOP = 48;
const QUARTERLY_CHART_LEGEND_BOTTOM = 592;
const QUARTERLY_CHART_LEGEND_LABEL_GAP = 26;
const QUARTERLY_CHART_SEGMENT_COLORS = [
  '#4f86df',
  '#25a6c8',
  '#2ea99e',
  '#46b96a',
  '#dcb227',
  '#eb8f2d',
  '#8c6de9',
  '#d95b94',
  '#6a7ae8',
  '#40afd9',
] as const;
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

function formatQuarterlyCoverDate(value: Date = new Date()) {
  const formatter = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(value);
  const year = parts.find((part) => part.type === 'year')?.value ?? '0000';
  const month = parts.find((part) => part.type === 'month')?.value ?? '00';
  const day = parts.find((part) => part.type === 'day')?.value ?? '00';
  return `${year}.${month}.${day}`;
}

function getQuarterlyDocumentTitle(report: QuarterlySummaryReport) {
  const normalizedPeriod = normalizeQuarterlyReportPeriod(report);
  if (normalizedPeriod.year > 0 && normalizedPeriod.quarter >= 1 && normalizedPeriod.quarter <= 4) {
    return `${normalizedPeriod.year}년 ${normalizedPeriod.quarter}/4분기 기술지도 종합보고서`;
  }

  const explicitTitle = formatOptionalText(report.title);
  if (explicitTitle) {
    return explicitTitle;
  }

  return buildQuarterlyTitleForPeriod(
    normalizedPeriod.periodStartDate,
    normalizedPeriod.periodEndDate,
  );
}

function buildQuarterlyCoverTitle(report: QuarterlySummaryReport) {
  const normalizedPeriod = normalizeQuarterlyReportPeriod(report);
  if (normalizedPeriod.quarter >= 1 && normalizedPeriod.quarter <= 4) {
    return `기술지도 (${normalizedPeriod.quarter}/4)분기 종합보고서`;
  }

  return '기술지도 분기 종합보고서';
}

function getQuarterlyCoverSiteName(report: QuarterlySummaryReport, site: InspectionSite) {
  return formatOptionalText(report.siteSnapshot.siteName || site.siteName || report.siteId);
}

function getQuarterlyCoverReportDate() {
  return formatQuarterlyCoverDate();
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

function replaceTemplateCellImageBinaryRef(
  tableXml: string,
  rowAddr: number,
  colAddr: number,
  targetBinaryItemId: string,
  nextBinaryItemId: string,
) {
  const targetMarker = `<hp:cellAddr colAddr="${colAddr}" rowAddr="${rowAddr}"/>`;
  const cellBlock = [...tableXml.matchAll(/<hp:tc\b[\s\S]*?<\/hp:tc>/g)]
    .map((match) => match[0])
    .find((candidate) => candidate.includes(targetMarker));
  if (!cellBlock) {
    throw new Error(
      `Quarterly HWPX template cell was not found for row=${rowAddr}, col=${colAddr}.`,
    );
  }

  if (!cellBlock.includes(`binaryItemIDRef="${targetBinaryItemId}"`)) {
    throw new Error(
      `Quarterly HWPX template image slot "${targetBinaryItemId}" is missing for row=${rowAddr}, col=${colAddr}.`,
    );
  }

  const nextCell = cellBlock.replace(
    new RegExp(`binaryItemIDRef="${escapeRegExp(targetBinaryItemId)}"`, 'g'),
    `binaryItemIDRef="${nextBinaryItemId}"`,
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

function formatQuarterlyChartPercent(count: number, total: number) {
  if (total <= 0) {
    return '0%';
  }

  const percent = (count / total) * 100;
  const rounded = Math.round(percent * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`;
}

function formatQuarterlyChartStatText(count: number, total: number) {
  return `${count}건 · ${formatQuarterlyChartPercent(count, total)}`;
}

function escapeQuarterlyChartSvgText(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function truncateQuarterlyChartLabel(label: string, maxLength: number) {
  return label.length > maxLength ? `${label.slice(0, Math.max(1, maxLength - 3))}...` : label;
}

function quarterlyChartPolarPoint(centerX: number, centerY: number, radius: number, angle: number) {
  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius,
  };
}

function buildQuarterlyChartSlicePath(
  centerX: number,
  centerY: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
) {
  const outerStart = quarterlyChartPolarPoint(centerX, centerY, outerRadius, startAngle);
  const outerEnd = quarterlyChartPolarPoint(centerX, centerY, outerRadius, endAngle);
  const innerEnd = quarterlyChartPolarPoint(centerX, centerY, innerRadius, endAngle);
  const innerStart = quarterlyChartPolarPoint(centerX, centerY, innerRadius, startAngle);
  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

  return [
    `M ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`,
    `L ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

function buildQuarterlyChartSvg(rows: QuarterlyCounter[]) {
  const entries = formatChartRows(rows);
  const total = entries.reduce((sum, item) => sum + item.count, 0);
  const visibleEntries = entries.filter((item) => item.count > 0);
  const availableLegendHeight = QUARTERLY_CHART_LEGEND_BOTTOM - QUARTERLY_CHART_LEGEND_TOP;
  const rowHeight = Math.max(76, Math.min(132, Math.floor(availableLegendHeight / Math.max(entries.length, 1))));
  const legendBlockHeight = rowHeight * Math.max(entries.length, 1);
  const legendStartY =
    QUARTERLY_CHART_LEGEND_TOP + Math.max(0, Math.floor((availableLegendHeight - legendBlockHeight) / 2));
  const fontSize = Math.max(30, Math.min(40, Math.floor(rowHeight * 0.4)));
  const markerSize = Math.max(22, Math.min(30, Math.floor(fontSize * 0.82)));
  const labelX = QUARTERLY_CHART_LEGEND_LEFT + markerSize + QUARTERLY_CHART_LEGEND_LABEL_GAP;
  const countX = QUARTERLY_CHART_LEGEND_RIGHT;
  const labelMaxChars = entries.length >= 5 ? 15 : entries.length >= 3 ? 16 : 18;
  const svgParts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${QUARTERLY_CHART_WIDTH}" height="${QUARTERLY_CHART_HEIGHT}" viewBox="0 0 ${QUARTERLY_CHART_WIDTH} ${QUARTERLY_CHART_HEIGHT}">`,
    `<rect width="${QUARTERLY_CHART_WIDTH}" height="${QUARTERLY_CHART_HEIGHT}" fill="#ffffff"/>`,
  ];

  if (entries.length === 0 || total === 0) {
    svgParts.push(
      '<text x="88" y="320" fill="#6b7280" font-size="34" font-family="Malgun Gothic, Apple SD Gothic Neo, Noto Sans KR, sans-serif">집계된 통계 데이터가 없습니다.</text>',
    );
    svgParts.push('</svg>');
    return svgParts.join('');
  }

  if (visibleEntries.length <= 1) {
    const firstVisibleIndex = Math.max(
      0,
      entries.findIndex((item) => item.count > 0),
    );
    const fullSliceColor =
      QUARTERLY_CHART_SEGMENT_COLORS[firstVisibleIndex % QUARTERLY_CHART_SEGMENT_COLORS.length];
    svgParts.push(
      `<circle cx="${QUARTERLY_CHART_CENTER_X}" cy="${QUARTERLY_CHART_CENTER_Y}" r="${QUARTERLY_CHART_OUTER_RADIUS}" fill="${fullSliceColor}"/>`,
    );
  } else {
    let angle = -Math.PI / 2;
    for (let index = 0; index < entries.length; index += 1) {
      const item = entries[index];
      if (item.count <= 0) {
        continue;
      }

      const sliceAngle = (item.count / total) * Math.PI * 2;
      const nextAngle = angle + sliceAngle;
      svgParts.push(
        `<path d="${buildQuarterlyChartSlicePath(
          QUARTERLY_CHART_CENTER_X,
          QUARTERLY_CHART_CENTER_Y,
          QUARTERLY_CHART_OUTER_RADIUS,
          QUARTERLY_CHART_INNER_RADIUS,
          angle,
          nextAngle,
        )}" fill="${QUARTERLY_CHART_SEGMENT_COLORS[index % QUARTERLY_CHART_SEGMENT_COLORS.length]}"/>`,
      );
      angle = nextAngle;
    }
  }

  svgParts.push(
    `<circle cx="${QUARTERLY_CHART_CENTER_X}" cy="${QUARTERLY_CHART_CENTER_Y}" r="${QUARTERLY_CHART_INNER_RADIUS}" fill="#ffffff"/>`,
  );

  for (let index = 0; index < entries.length; index += 1) {
    const item = entries[index];
    const rowCenterY = legendStartY + rowHeight * index + rowHeight / 2;
    const safeLabel = escapeQuarterlyChartSvgText(
      truncateQuarterlyChartLabel(item.label, labelMaxChars),
    );
    const safeStat = escapeQuarterlyChartSvgText(
      formatQuarterlyChartStatText(item.count, total),
    );
    const color = QUARTERLY_CHART_SEGMENT_COLORS[index % QUARTERLY_CHART_SEGMENT_COLORS.length];

    svgParts.push(
      `<rect x="${QUARTERLY_CHART_LEGEND_LEFT}" y="${(rowCenterY - markerSize / 2).toFixed(1)}" width="${markerSize}" height="${markerSize}" rx="4" ry="4" fill="${color}"/>`,
    );
    svgParts.push(
      `<text x="${labelX}" y="${rowCenterY}" fill="#5b6a84" font-size="${fontSize}" font-weight="500" dominant-baseline="middle" font-family="Malgun Gothic, Apple SD Gothic Neo, Noto Sans KR, sans-serif">${safeLabel}</text>`,
    );
    svgParts.push(
      `<text x="${countX}" y="${rowCenterY}" fill="#111827" font-size="${fontSize}" font-weight="700" text-anchor="end" dominant-baseline="middle" font-family="Malgun Gothic, Apple SD Gothic Neo, Noto Sans KR, sans-serif">${safeStat}</text>`,
    );
  }

  svgParts.push('</svg>');
  return svgParts.join('');
}

async function renderQuarterlyChartImageAsset(
  rows: QuarterlyCounter[],
): Promise<ResolvedHwpxImageAsset> {
  const sharp = (await import('sharp')).default;
  const pngBuffer = await sharp(Buffer.from(buildQuarterlyChartSvg(rows))).png().toBuffer();

  return {
    buffer: new Uint8Array(pngBuffer),
    extension: 'png',
    height: QUARTERLY_CHART_HEIGHT,
    mediaType: 'image/png',
    width: QUARTERLY_CHART_WIDTH,
  };
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

function updateStatsTable(tableXml: string, chartImages: QuarterlyChartImageAssets) {
  let nextTable = tableXml;
  nextTable = replaceCellImage(nextTable, 2, 0, ACCIDENT_CHART_IMAGE_ITEM_ID, chartImages.accident);
  nextTable = replaceCellImage(nextTable, 2, 1, CAUSATIVE_CHART_IMAGE_ITEM_ID, chartImages.causative);
  return nextTable;
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

function updateApprovalTable(tableXml: string, report: QuarterlySummaryReport) {
  let nextTable = tableXml;
  nextTable = replaceCellText(nextTable, 1, 0, formatOptionalText(report.drafter) || ' ');
  nextTable = replaceCellText(nextTable, 1, 1, formatOptionalText(report.reviewer) || ' ');
  nextTable = replaceCellText(nextTable, 1, 2, formatOptionalText(report.approver) || ' ');
  return nextTable;
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
    const leftText = formatOptionalText(item.hazard || item.processName);
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
    ? replaceTemplateCellImageBinaryRef(
        nextTable,
        2,
        0,
        OPS_TEMPLATE_IMAGE_ITEM_ID,
        OPS_IMAGE_ITEM_ID,
      )
    : replaceCellText(nextTable, 2, 0, buildOpsDetailLines(report), {
        multiline: true,
        wrapAt: 42,
      });
  return nextTable;
}

function replaceQuarterlyCoverTextNodes(
  sectionXml: string,
  report: QuarterlySummaryReport,
  site: InspectionSite,
) {
  let nextSection = replaceNthTextNode(
    sectionXml,
    COVER_TITLE_TEXT_INDEX,
    buildQuarterlyCoverTitle(report),
  );
  nextSection = replaceNthTextNode(
    nextSection,
    COVER_SITE_NAME_TEXT_INDEX,
    getQuarterlyCoverSiteName(report, site),
  );
  nextSection = replaceNthTextNode(
    nextSection,
    COVER_REPORT_DATE_TEXT_INDEX,
    getQuarterlyCoverReportDate(),
  );
  return replaceNthTextNode(
    nextSection,
    BODY_TITLE_TEXT_INDEX,
    getQuarterlyDocumentTitle(report),
  );
}

function updateSectionXml(
  sectionXml: string,
  report: QuarterlySummaryReport,
  site: InspectionSite,
  opsImageAsset: ResolvedHwpxImageAsset | null,
  chartImages: QuarterlyChartImageAssets,
) {
  const textUpdatedSection = replaceQuarterlyCoverTextNodes(sectionXml, report, site);
  const tableBlocks = matchTableBlocks(textUpdatedSection);
  if (tableBlocks.length < 6) {
    throw new Error('Quarterly HWPX template table structure was not detected.');
  }

  const tables = tableBlocks.map((block) => block.xml);
  tables[0] = updateApprovalTable(tables[0], report);
  tables[1] = updateSnapshotTable(tables[1], report, site);
  tables[2] = updateStatsTable(tables[2], chartImages);
  tables[3] = updateImplementationTable(tables[3], report);
  tables[4] = updateFuturePlanTable(tables[4], report);
  tables[5] = updateOpsTable(tables[5], report, opsImageAsset);

  return ensureUniquePictureObjectIds(
    rebuildSectionXml(textUpdatedSection, tableBlocks, tables),
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

  if (!sectionXmlFile || !contentHpfFile) {
    throw new Error('Quarterly HWPX template is missing required assets.');
  }

  const sectionXml = await sectionXmlFile.async('string');
  let contentHpf = await contentHpfFile.async('string');
  const accidentChartXml = accidentChartFile
    ? await accidentChartFile.async('string')
    : null;
  const causativeChartXml = causativeChartFile
    ? await causativeChartFile.async('string')
    : null;
  const [opsImageAsset, accidentChartImage, causativeChartImage] = await Promise.all([
    resolveOpsImageAsset(report, options),
    renderQuarterlyChartImageAsset(report.accidentStats),
    renderQuarterlyChartImageAsset(report.causativeStats),
  ]);
  const chartImages: QuarterlyChartImageAssets = {
    accident: accidentChartImage,
    causative: causativeChartImage,
  };

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

  for (const [itemId, asset] of [
    [ACCIDENT_CHART_IMAGE_ITEM_ID, chartImages.accident],
    [CAUSATIVE_CHART_IMAGE_ITEM_ID, chartImages.causative],
  ] as const) {
    const href = `BinData/${itemId}.${asset.extension}`;
    zip.file(href, asset.buffer, { compression: 'STORE' });
    contentHpf = upsertManifestItem(
      contentHpf,
      itemId,
      href,
      normalizeHwpxMediaType(asset.mediaType, href),
    );
  }

  const selectedSessions = options?.selectedSessions ?? [];
  let nextHeaderXml = '';
  if (selectedSessions.length > 0) {
    const headerXmlFile = zip.file('Contents/header.xml');
    if (!headerXmlFile) {
      throw new Error('Quarterly HWPX template is missing Contents/header.xml.');
    }
    nextHeaderXml = await headerXmlFile.async('string');
    const mergedAppendices = await appendInspectionAppendixSections({
      assetBaseUrl: options?.assetBaseUrl,
      contentHpf,
      headerXml: nextHeaderXml,
      selectedSessions,
      siteSessions: options?.siteSessions?.length ? options.siteSessions : selectedSessions,
      zip,
    });
    contentHpf = mergedAppendices.contentHpf;
    nextHeaderXml = mergedAppendices.headerXml;
  }

  zip.file(
    'Contents/section0.xml',
    updateSectionXml(sectionXml, report, site, opsImageAsset, chartImages),
  );
  zip.file('Contents/content.hpf', contentHpf);
  if (nextHeaderXml) {
    zip.file('Contents/header.xml', nextHeaderXml);
  }
  if (accidentChartFile && accidentChartXml) {
    zip.file('Chart/chart1.xml', updateChartXml(accidentChartXml, report.accidentStats));
  }
  if (causativeChartFile && causativeChartXml) {
    zip.file('Chart/chart2.xml', updateChartXml(causativeChartXml, report.causativeStats));
  }

  return {
    buffer: await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }),
    filename: fileNameForQuarterlyReport(report, site),
  };
}
