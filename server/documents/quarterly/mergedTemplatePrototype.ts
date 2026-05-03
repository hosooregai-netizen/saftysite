import fs from 'node:fs/promises';
import path from 'node:path';

import JSZip from 'jszip';

import {
  extractInspectionAppendixSection,
} from '@/server/documents/inspection/appendix';
import {
  getTemplateImagePlaceholders,
  normalizeInspectionFloatingTableGapPages,
  type TemplateImagePlaceholder,
} from '@/server/documents/inspection/hwpx';
import {
  buildUniqueManifestHref,
  buildUniqueManifestItemId,
  mergeHeaderDefinitions,
  normalizeHwpxMediaType,
  parseManifestItems,
  remapAppendixSectionXml,
  upsertManifestItem,
} from '@/server/documents/quarterly/inspectionAppendixMerge';
import {
  getInspectionTemplateFilename,
  type InspectionTemplateVariant,
} from '@/lib/documents/inspection/templateVariant';

export interface QuarterlyMergedTemplatePrototype {
  appendixPrototypeXml: string;
  binaryItemIds: string[];
  buffer: Buffer;
  filename: string;
  imagePlaceholders: QuarterlyMergedTemplateImagePlaceholder[];
  variant: InspectionTemplateVariant;
}

export interface QuarterlyMergedTemplateImagePlaceholder
  extends Pick<TemplateImagePlaceholder, 'binaryItemId' | 'optional' | 'placeholderPath'> {
  repeatBlockPath?: string;
}

const QUARTERLY_TEMPLATE_FILENAME = '\uBD84\uAE30 \uC885\uD569\uBCF4\uACE0\uC11C2.hwpx';
const QUARTERLY_TEMPLATE_PATH = path.resolve(
  process.cwd(),
  'public',
  'templates',
  'quarterly',
  QUARTERLY_TEMPLATE_FILENAME,
);
const OUTPUT_FILENAME_BY_VARIANT: Record<InspectionTemplateVariant, string> = {
  v10: 'quarterly-merged-template.v10.hwpx',
  'v10-1': 'quarterly-merged-template.v10-1.hwpx',
};
const APPENDIX_REPEAT_PATH = 'appendices';
const BLANK_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5cH7QAAAAASUVORK5CYII=';

function decodeBase64ToBytes(base64: string) {
  return Uint8Array.from(Buffer.from(base64, 'base64'));
}

const BLANK_PNG_ASSET = {
  buffer: decodeBase64ToBytes(BLANK_PNG_BASE64),
  extension: 'png',
  mediaType: 'image/png',
};

function inspectionTemplatePath(variant: InspectionTemplateVariant) {
  return path.resolve(
    process.cwd(),
    'public',
    'templates',
    'inspection',
    getInspectionTemplateFilename(variant),
  );
}

function tableSpans(xml: string): Array<{ start: number; end: number }> {
  return Array.from(xml.matchAll(/<hp:tbl\b[\s\S]*?<\/hp:tbl>/g)).map((match) => ({
    start: match.index ?? 0,
    end: (match.index ?? 0) + match[0].length,
  }));
}

function balancedTagSpans(xml: string, tagName: string): Array<{ start: number; end: number }> {
  const escapedTagName = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tokenPattern = new RegExp(`<${escapedTagName}\\b[^>]*\\/?>|<\\/${escapedTagName}>`, 'g');
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

function locateTemplateCell(
  xml: string,
  descriptor: Pick<TemplateImagePlaceholder, 'table' | 'row' | 'col'>,
) {
  const spans = tableSpans(xml);
  const tableSpan = spans[descriptor.table];
  if (!tableSpan) {
    return null;
  }

  const tableXml = xml.slice(tableSpan.start, tableSpan.end);
  const marker = `<hp:cellAddr colAddr="${descriptor.col}" rowAddr="${descriptor.row}"/>`;

  for (const match of tableXml.matchAll(/<hp:tc\b[\s\S]*?<\/hp:tc>/g)) {
    const cellXml = match[0];
    if (!cellXml.includes(marker)) {
      continue;
    }

    return {
      cellXml,
      cellStart: tableSpan.start + (match.index ?? 0),
      tableSpan,
    };
  }

  return null;
}

function extractCellBinaryItemId(cellXml: string) {
  return cellXml.match(/\bbinaryItemIDRef="([^"]+)"/)?.[1] ?? null;
}

function stripSectionRoot(sectionXml: string) {
  const openTagEnd = sectionXml.indexOf('>');
  const closeTagStart = sectionXml.lastIndexOf('</hs:sec>');

  if (openTagEnd < 0 || closeTagStart < 0 || closeTagStart <= openTagEnd) {
    throw new Error('Quarterly merged template prototype failed: appendix section root is malformed.');
  }

  return sectionXml.slice(openTagEnd + 1, closeTagStart);
}

function prefixInspectionTemplateTokens(xml: string, prefix: string) {
  return xml.replace(
    /\{#([^{}]+)\}|\{\/([^{}]+)\}|\{(?![#/])([^{}]+)\}/g,
    (_match, repeatStartPath: string | undefined, repeatEndPath: string | undefined, placeholderPath: string | undefined) => {
      if (repeatStartPath) {
        return `{#${prefix}.${repeatStartPath.trim()}}`;
      }

      if (repeatEndPath) {
        return `{/${prefix}.${repeatEndPath.trim()}}`;
      }

      return `{${prefix}.${(placeholderPath ?? '').trim()}}`;
    },
  );
}

function replaceFirstTextNode(fragment: string, marker: string) {
  const selfClosingMatch = /<hp:t\s*\/>/.exec(fragment);
  const standardMatch = /<hp:t\b([^>]*)>/.exec(fragment);

  if (selfClosingMatch && (!standardMatch || selfClosingMatch.index < standardMatch.index)) {
    return (
      fragment.slice(0, selfClosingMatch.index) +
      `<hp:t>${marker}</hp:t>` +
      fragment.slice(selfClosingMatch.index + selfClosingMatch[0].length)
    );
  }

  if (!standardMatch || typeof standardMatch.index !== 'number') {
    throw new Error('Quarterly merged template prototype failed: no appendix text node found for repeat start marker.');
  }

  return (
    fragment.slice(0, standardMatch.index) +
    `<hp:t${standardMatch[1]}>${marker}` +
    fragment.slice(standardMatch.index + standardMatch[0].length)
  );
}

function replaceLastTextNode(fragment: string, marker: string) {
  const matches = Array.from(fragment.matchAll(/<hp:t\s*\/>|<hp:t\b[^>]*>[\s\S]*?<\/hp:t>/g));
  const last = matches.at(-1);

  if (!last || typeof last.index !== 'number') {
    throw new Error('Quarterly merged template prototype failed: no appendix text node found for repeat end marker.');
  }

  if (last[0].startsWith('<hp:t') && last[0].endsWith('/>')) {
    return (
      fragment.slice(0, last.index) +
      `<hp:t>${marker}</hp:t>` +
      fragment.slice(last.index + last[0].length)
    );
  }

  const closingTagIndex = last[0].lastIndexOf('</hp:t>');
  return (
    fragment.slice(0, last.index) +
    `${last[0].slice(0, closingTagIndex)}${marker}</hp:t>` +
    fragment.slice(last.index + last[0].length)
  );
}

function wrapWithAppendixRepeatMarkers(fragment: string) {
  const withStartMarker = replaceFirstTextNode(fragment, `{#${APPENDIX_REPEAT_PATH}}`);
  return replaceLastTextNode(withStartMarker, `{/${APPENDIX_REPEAT_PATH}}`);
}

function forceFirstParagraphPageBreak(fragment: string) {
  return fragment.replace(/<hp:p\b[^>]*>/, (paragraphTag) =>
    /pageBreak=/.test(paragraphTag)
      ? paragraphTag.replace(/pageBreak="[^"]*"/, 'pageBreak="1"')
      : paragraphTag.replace(/>$/, ' pageBreak="1">'),
  );
}

function normalizeAppendixLayoutForMergedQuarterly(fragment: string) {
  return splitTopLevelTableParagraphs(
    fragment.replace(/<hp:ctrl><hp:pageHiding\b[^>]*\/><\/hp:ctrl>/g, ''),
  );
}

function setParagraphPageBreak(paragraphTag: string, value: '0' | '1'): string {
  return /pageBreak=/.test(paragraphTag)
    ? paragraphTag.replace(/pageBreak="[^"]*"/, `pageBreak="${value}"`)
    : paragraphTag.replace(/>$/, ` pageBreak="${value}">`);
}

function topLevelParagraphSpans(xml: string): Array<{ start: number; end: number }> {
  const paragraphs = balancedTagSpans(xml, 'hp:p');
  return paragraphs.filter((candidate) =>
    !paragraphs.some((span) =>
      span !== candidate && span.start < candidate.start && candidate.end < span.end,
    ),
  );
}

function openRunTagBefore(content: string, index: number): string | null {
  const runTagPattern = /<hp:run\b[^>]*\/?>|<\/hp:run>/g;
  const stack: string[] = [];

  for (const match of content.slice(0, index).matchAll(runTagPattern)) {
    const token = match[0];
    const isClosing = token.startsWith('</hp:run');
    const isSelfClosing = !isClosing && token.endsWith('/>');

    if (isClosing) {
      stack.pop();
    } else if (!isSelfClosing) {
      stack.push(token);
    }
  }

  return stack.at(-1) ?? null;
}

function splitTopLevelTableParagraph(paragraphXml: string): string {
  const paragraphOpenTag = paragraphXml.match(/^<hp:p\b[^>]*>/)?.[0] ?? '';
  if (!paragraphOpenTag) {
    return paragraphXml;
  }

  const contentStart = paragraphOpenTag.length;
  const contentEnd = paragraphXml.endsWith('</hp:p>')
    ? paragraphXml.length - '</hp:p>'.length
    : paragraphXml.length;
  const content = paragraphXml.slice(contentStart, contentEnd);
  const tables = tableSpans(content);

  if (tables.length <= 1) {
    return paragraphXml;
  }

  const firstRunTag = openRunTagBefore(content, tables[0].start);
  if (!firstRunTag) {
    return paragraphXml;
  }

  return tables.map((table, index) => {
    const runTag = openRunTagBefore(content, table.start) ?? firstRunTag;
    const prefix = index === 0 ? content.slice(0, table.start) : runTag;
    const nextParagraphOpenTag = index === 0
      ? paragraphOpenTag
      : setParagraphPageBreak(paragraphOpenTag, '0');

    return `${nextParagraphOpenTag}${prefix}${content.slice(table.start, table.end)}<hp:t/></hp:run></hp:p>`;
  }).join('');
}

function splitTopLevelTableParagraphs(fragment: string): string {
  let result = '';
  let cursor = 0;

  for (const paragraph of topLevelParagraphSpans(fragment)) {
    result += fragment.slice(cursor, paragraph.start);
    result += splitTopLevelTableParagraph(fragment.slice(paragraph.start, paragraph.end));
    cursor = paragraph.end;
  }

  return result + fragment.slice(cursor);
}

function ensureUniqueTableObjectIds(sectionXml: string) {
  const tableTagPattern = /<hp:tbl\b[^>]*>/g;
  const currentTableIds = Array.from(
    sectionXml.matchAll(/<hp:tbl\b[^>]*\bid="(\d+)"/g),
    (match) => Number.parseInt(match[1], 10),
  ).filter(Number.isFinite);
  let nextTableId = Math.max(2107269000, ...currentTableIds, 0);

  return sectionXml.replace(tableTagPattern, (tableTag) => {
    if (!/\bid="\d+"/.test(tableTag)) {
      return tableTag;
    }

    nextTableId += 1;
    return tableTag.replace(/\bid="\d+"/, `id="${nextTableId}"`);
  });
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

function ensureUniqueRenderableObjectIds(sectionXml: string) {
  return ensureUniquePictureObjectIds(ensureUniqueTableObjectIds(sectionXml));
}

function appendFragmentToQuarterlySection(sectionXml: string, fragment: string) {
  const closeTag = '</hs:sec>';
  const closeTagIndex = sectionXml.lastIndexOf(closeTag);

  if (closeTagIndex < 0) {
    throw new Error('Quarterly merged template prototype failed: quarterly section root is malformed.');
  }

  return ensureUniqueRenderableObjectIds(
    `${sectionXml.slice(0, closeTagIndex)}${fragment}${sectionXml.slice(closeTagIndex)}`,
  );
}

async function loadTemplateParts(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const [sectionEntry, headerEntry, contentEntry] = [
    zip.file('Contents/section0.xml'),
    zip.file('Contents/header.xml'),
    zip.file('Contents/content.hpf'),
  ];

  if (!sectionEntry || !headerEntry || !contentEntry) {
    throw new Error(
      'Quarterly merged template prototype failed: template is missing Contents/section0.xml, Contents/header.xml, or Contents/content.hpf.',
    );
  }

  const [sectionXml, headerXml, contentHpf] = await Promise.all([
    sectionEntry.async('string'),
    headerEntry.async('string'),
    contentEntry.async('string'),
  ]);

  return { contentEntry, contentHpf, headerEntry, headerXml, sectionEntry, sectionXml, zip };
}

export async function buildQuarterlyMergedTemplatePrototype(
  variant: InspectionTemplateVariant,
): Promise<QuarterlyMergedTemplatePrototype> {
  const [quarterlyBuffer, inspectionBuffer] = await Promise.all([
    fs.readFile(QUARTERLY_TEMPLATE_PATH),
    fs.readFile(inspectionTemplatePath(variant)),
  ]);
  const quarterlyTemplate = await loadTemplateParts(quarterlyBuffer);
  const inspectionTemplate = await loadTemplateParts(inspectionBuffer);
  const normalizedInspectionSectionXml = normalizeInspectionFloatingTableGapPages(
    inspectionTemplate.sectionXml,
  );

  let contentHpf = quarterlyTemplate.contentHpf;
  const mergedHeader = mergeHeaderDefinitions(
    quarterlyTemplate.headerXml,
    inspectionTemplate.headerXml,
  );
  const appendixSectionXml = extractInspectionAppendixSection(normalizedInspectionSectionXml);
  const appendixToken = `appendix-prototype-${variant}`;
  const appendixManifestItems = parseManifestItems(inspectionTemplate.contentHpf);
  const templateImagePlaceholders = getTemplateImagePlaceholders(variant);
  const referencedBinaryIds = new Set(
    Array.from(appendixSectionXml.matchAll(/\bbinaryItemIDRef="([^"]+)"/g), (match) => match[1]),
  );
  const binaryIdMap = new Map<string, string>();

  for (const item of appendixManifestItems) {
    if (!referencedBinaryIds.has(item.id)) {
      continue;
    }

    const preferredId = `${appendixToken}-${item.id}`;
    const sourceEntry = inspectionTemplate.zip.file(item.href);
    const preferredHref = sourceEntry
      ? item.href.replace(/^BinData\//, `BinData/${appendixToken}-`)
      : `BinData/${appendixToken}-${item.id}.${BLANK_PNG_ASSET.extension}`;
    const nextId = buildUniqueManifestItemId(contentHpf, preferredId);
    const nextHref = buildUniqueManifestHref(contentHpf, preferredHref);

    binaryIdMap.set(item.id, nextId);
    quarterlyTemplate.zip.file(
      nextHref,
      sourceEntry ? await sourceEntry.async('uint8array') : BLANK_PNG_ASSET.buffer,
      {
        compression: 'STORE',
      },
    );
    contentHpf = upsertManifestItem(
      contentHpf,
      nextId,
      nextHref,
      normalizeHwpxMediaType(sourceEntry ? item.mediaType : BLANK_PNG_ASSET.mediaType, nextHref),
      item.isEmbedded,
    );
  }

  const remappedAppendixSectionXml = remapAppendixSectionXml(
    appendixSectionXml,
    mergedHeader.maps,
    binaryIdMap,
  );
  const imagePlaceholders = templateImagePlaceholders
    .map<QuarterlyMergedTemplateImagePlaceholder | null>((placeholder) => {
      const located = locateTemplateCell(normalizedInspectionSectionXml, placeholder);
      if (!located) {
        if (placeholder.optional) {
          return null;
        }
        throw new Error(
          `Quarterly merged template prototype failed: missing image cell for ${placeholder.placeholderPath}.`,
        );
      }

      const sourceBinaryItemId = extractCellBinaryItemId(located.cellXml);
      if (!sourceBinaryItemId) {
        if (placeholder.optional) {
          return null;
        }
        throw new Error(
          `Quarterly merged template prototype failed: missing binaryItemIDRef for ${placeholder.placeholderPath}.`,
        );
      }

      const binaryItemId = binaryIdMap.get(sourceBinaryItemId);
      if (!binaryItemId) {
        if (placeholder.optional) {
          return null;
        }
        throw new Error(
          `Quarterly merged template prototype failed: missing manifest remap for ${placeholder.placeholderPath}.`,
        );
      }

      return {
        binaryItemId,
        optional: placeholder.optional,
        placeholderPath: `${APPENDIX_REPEAT_PATH}[0].${placeholder.placeholderPath}`,
        repeatBlockPath: placeholder.repeatBlockPath
          ? `${APPENDIX_REPEAT_PATH}[0].${placeholder.repeatBlockPath}`
          : undefined,
      };
    })
    .filter((item): item is QuarterlyMergedTemplateImagePlaceholder => item !== null);
  const appendixPrototypePrefix = `${APPENDIX_REPEAT_PATH}[0]`;
  const appendixBodyFragment = forceFirstParagraphPageBreak(
    wrapWithAppendixRepeatMarkers(
      prefixInspectionTemplateTokens(
        normalizeAppendixLayoutForMergedQuarterly(stripSectionRoot(remappedAppendixSectionXml)),
        appendixPrototypePrefix,
      ),
    ),
  );
  const mergedSectionXml = appendFragmentToQuarterlySection(
    quarterlyTemplate.sectionXml,
    appendixBodyFragment,
  );
  const quarterlySectionCloseIndex = quarterlyTemplate.sectionXml.lastIndexOf('</hs:sec>');
  const normalizedAppendixPrototypeXml = mergedSectionXml.slice(
    quarterlySectionCloseIndex,
    mergedSectionXml.length - '</hs:sec>'.length,
  );

  quarterlyTemplate.zip.file(
    'Contents/header.xml',
    mergedHeader.headerXml,
    {
      compression: 'DEFLATE',
      createFolders: false,
      date: quarterlyTemplate.headerEntry.date,
      comment: quarterlyTemplate.headerEntry.comment,
      dosPermissions: quarterlyTemplate.headerEntry.dosPermissions,
      unixPermissions: quarterlyTemplate.headerEntry.unixPermissions,
    },
  );
  quarterlyTemplate.zip.file(
    'Contents/content.hpf',
    contentHpf,
    {
      compression: 'DEFLATE',
      createFolders: false,
      date: quarterlyTemplate.contentEntry.date,
      comment: quarterlyTemplate.contentEntry.comment,
      dosPermissions: quarterlyTemplate.contentEntry.dosPermissions,
      unixPermissions: quarterlyTemplate.contentEntry.unixPermissions,
    },
  );
  quarterlyTemplate.zip.file(
    'Contents/section0.xml',
    mergedSectionXml,
    {
      compression: 'DEFLATE',
      createFolders: false,
      date: quarterlyTemplate.sectionEntry.date,
      comment: quarterlyTemplate.sectionEntry.comment,
      dosPermissions: quarterlyTemplate.sectionEntry.dosPermissions,
      unixPermissions: quarterlyTemplate.sectionEntry.unixPermissions,
    },
  );

  return {
    appendixPrototypeXml: normalizedAppendixPrototypeXml,
    binaryItemIds: Array.from(binaryIdMap.values()),
    buffer: await quarterlyTemplate.zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    }),
    filename: OUTPUT_FILENAME_BY_VARIANT[variant],
    imagePlaceholders,
    variant,
  };
}
