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

export interface QuarterlyMergedTemplateAppendixPrototype {
  appendixPrototypeXml: string;
  binaryItemIds: string[];
  imagePlaceholders: QuarterlyMergedTemplateImagePlaceholder[];
  variant: InspectionTemplateVariant;
}

export interface QuarterlyMergedTemplatePrototype
  extends QuarterlyMergedTemplateAppendixPrototype {
  buffer: Buffer;
  filename: string;
}

export interface QuarterlyMergedTemplatePrototypeBundle {
  appendixPrototypeXml: string;
  buffer: Buffer;
  filename: string;
  prototypes: Partial<Record<InspectionTemplateVariant, QuarterlyMergedTemplateAppendixPrototype>>;
  variants: InspectionTemplateVariant[];
}

export interface QuarterlyMergedTemplateImagePlaceholder
  extends Pick<TemplateImagePlaceholder, 'binaryItemId' | 'optional' | 'placeholderPath'> {
  repeatBlockPath?: string;
}

const OUTPUT_FILENAME_BY_VARIANT: Record<InspectionTemplateVariant, string> = {
  v10: 'quarterly-merged-template.v10.hwpx',
  'v10-1': 'quarterly-merged-template.v10-1.hwpx',
};
export const QUARTERLY_MERGED_TEMPLATE_VARIANTS: readonly InspectionTemplateVariant[] = [
  'v10',
  'v10-1',
];
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

function mergedTemplatePath(variant: InspectionTemplateVariant) {
  return path.resolve(
    process.cwd(),
    'public',
    'templates',
    'quarterly',
    OUTPUT_FILENAME_BY_VARIANT[variant],
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

function extractAppendixPrototypeXmlFromMergedTemplate(sectionXml: string) {
  const markerIndex = sectionXml.indexOf(`{#${APPENDIX_REPEAT_PATH}}`);
  const closeTagIndex = sectionXml.lastIndexOf('</hs:sec>');
  if (markerIndex < 0 || closeTagIndex < 0) {
    throw new Error(
      'Quarterly merged template prototype failed: merged template is missing appendix markers.',
    );
  }

  const prototypeParagraph = balancedTagSpans(sectionXml, 'hp:p').find(
    (span) => span.start <= markerIndex && markerIndex <= span.end,
  );
  if (!prototypeParagraph || prototypeParagraph.start >= closeTagIndex) {
    throw new Error(
      'Quarterly merged template prototype failed: could not isolate the appendix prototype fragment.',
    );
  }

  return sectionXml.slice(prototypeParagraph.start, closeTagIndex);
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

function ensureManifestBinaryEntries(zip: JSZip, contentHpf: string) {
  for (const item of parseManifestItems(contentHpf)) {
    if (!item.href.startsWith('BinData/') || zip.file(item.href)) {
      continue;
    }

    zip.file(item.href, BLANK_PNG_ASSET.buffer, { compression: 'STORE' });
  }
}

async function buildAppendixPrototypeForVariant(args: {
  contentHpf: string;
  destinationHeaderXml: string;
  quarterlyZip: JSZip;
  variant: InspectionTemplateVariant;
}): Promise<{
  contentHpf: string;
  headerXml: string;
  prototype: QuarterlyMergedTemplateAppendixPrototype;
}> {
  const inspectionBuffer = await fs.readFile(inspectionTemplatePath(args.variant));
  const inspectionTemplate = await loadTemplateParts(inspectionBuffer);
  const normalizedInspectionSectionXml = normalizeInspectionFloatingTableGapPages(
    inspectionTemplate.sectionXml,
  );

  let contentHpf = args.contentHpf;
  const mergedHeader = mergeHeaderDefinitions(
    args.destinationHeaderXml,
    inspectionTemplate.headerXml,
  );
  const appendixSectionXml = extractInspectionAppendixSection(normalizedInspectionSectionXml);
  const appendixToken = `appendix-prototype-${args.variant}`;
  const appendixManifestItems = parseManifestItems(inspectionTemplate.contentHpf);
  const templateImagePlaceholders = getTemplateImagePlaceholders(args.variant);
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
    args.quarterlyZip.file(
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

  return {
    contentHpf,
    headerXml: mergedHeader.headerXml,
    prototype: {
      appendixPrototypeXml: appendixBodyFragment,
      binaryItemIds: Array.from(binaryIdMap.values()),
      imagePlaceholders,
      variant: args.variant,
    },
  };
}

async function buildStaticHolderAppendixPrototype(args: {
  contentHpf: string;
  headerXml: string;
  prototypeXml: string;
  templateBuffer: Buffer;
  variant: InspectionTemplateVariant;
}): Promise<QuarterlyMergedTemplateAppendixPrototype> {
  const manifestIds = new Set(parseManifestItems(args.contentHpf).map((item) => item.id));
  const prefix = `appendix-prototype-${args.variant}-`;
  const remapStaticBinaryItemId = (binaryItemId: string) => {
    const unprefixed = binaryItemId.startsWith(prefix)
      ? binaryItemId.slice(prefix.length)
      : binaryItemId;
    return manifestIds.has(unprefixed) ? unprefixed : binaryItemId;
  };
  const metadataTemplate = await loadTemplateParts(Buffer.from(args.templateBuffer));
  const built = await buildAppendixPrototypeForVariant({
    contentHpf: args.contentHpf,
    destinationHeaderXml: args.headerXml,
    quarterlyZip: metadataTemplate.zip,
    variant: args.variant,
  });

  return {
    ...built.prototype,
    appendixPrototypeXml: args.prototypeXml,
    binaryItemIds: Array.from(
      new Set(built.prototype.binaryItemIds.map(remapStaticBinaryItemId)),
    ),
    imagePlaceholders: built.prototype.imagePlaceholders.map((placeholder) => ({
      ...placeholder,
      binaryItemId: remapStaticBinaryItemId(placeholder.binaryItemId),
    })),
  };
}

export async function buildQuarterlyMergedTemplatePrototypeBundle(
  variants: readonly InspectionTemplateVariant[] = QUARTERLY_MERGED_TEMPLATE_VARIANTS,
  holderVariant: InspectionTemplateVariant = variants[0] ?? 'v10',
): Promise<QuarterlyMergedTemplatePrototypeBundle> {
  const uniqueVariants = Array.from(new Set(variants)) as InspectionTemplateVariant[];
  if (uniqueVariants.length === 0) {
    throw new Error('Quarterly merged template prototype failed: at least one variant is required.');
  }
  if (!uniqueVariants.includes(holderVariant)) {
    throw new Error(
      `Quarterly merged template prototype failed: holder variant "${holderVariant}" is not included.`,
    );
  }

  const quarterlyBuffer = await fs.readFile(mergedTemplatePath(holderVariant));
  const quarterlyTemplate = await loadTemplateParts(quarterlyBuffer);
  ensureManifestBinaryEntries(quarterlyTemplate.zip, quarterlyTemplate.contentHpf);
  const holderAppendixPrototypeXml = extractAppendixPrototypeXmlFromMergedTemplate(
    quarterlyTemplate.sectionXml,
  );
  let contentHpf = quarterlyTemplate.contentHpf;
  let headerXml = quarterlyTemplate.headerXml;
  const prototypes: Partial<Record<InspectionTemplateVariant, QuarterlyMergedTemplateAppendixPrototype>> = {};

  prototypes[holderVariant] = await buildStaticHolderAppendixPrototype({
    contentHpf,
    headerXml,
    prototypeXml: holderAppendixPrototypeXml,
    templateBuffer: quarterlyBuffer,
    variant: holderVariant,
  });

  for (const variant of uniqueVariants) {
    if (variant === holderVariant) {
      continue;
    }

    const built = await buildAppendixPrototypeForVariant({
      contentHpf,
      destinationHeaderXml: headerXml,
      quarterlyZip: quarterlyTemplate.zip,
      variant,
    });
    contentHpf = built.contentHpf;
    headerXml = built.headerXml;
    prototypes[variant] = built.prototype;
  }

  quarterlyTemplate.zip.file(
    'Contents/header.xml',
    headerXml,
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
    quarterlyTemplate.sectionXml,
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
    appendixPrototypeXml: holderAppendixPrototypeXml,
    buffer: await quarterlyTemplate.zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    }),
    filename: OUTPUT_FILENAME_BY_VARIANT[holderVariant],
    prototypes,
    variants: uniqueVariants,
  };
}

export async function buildQuarterlyMergedTemplatePrototype(
  variant: InspectionTemplateVariant,
): Promise<QuarterlyMergedTemplatePrototype> {
  const bundle = await buildQuarterlyMergedTemplatePrototypeBundle([variant], variant);
  const prototype = bundle.prototypes[variant];
  if (!prototype) {
    throw new Error(
      `Quarterly merged template prototype failed: missing prototype "${variant}".`,
    );
  }

  return {
    ...prototype,
    buffer: bundle.buffer,
    filename: OUTPUT_FILENAME_BY_VARIANT[variant],
  };
}
