import type JSZip from 'jszip';

import { buildInspectionAppendixSource } from '@/server/documents/inspection/appendix';
import type { InspectionSession } from '@/types/inspectionSession';

interface NumericIdMaps {
  borderFill: Map<string, string>;
  charPr: Map<string, string>;
  memo: Map<string, string>;
  numbering: Map<string, string>;
  paraPr: Map<string, string>;
  style: Map<string, string>;
  tabPr: Map<string, string>;
}

interface HeaderMergeResult {
  headerXml: string;
  maps: NumericIdMaps;
}

interface XmlContainer {
  closeTag: string;
  inner: string;
  matchEnd: number;
  matchStart: number;
  openTag: string;
}

interface ParsedCollectionItem {
  id: string;
  xml: string;
}

interface ParsedManifestItem {
  href: string;
  id: string;
  isEmbedded: boolean;
  mediaType: string;
}

interface ParsedFontItem {
  face: string;
  id: string;
  signature: string;
  type: string;
  xml: string;
}

interface ParsedFontFace {
  fontCount: number;
  fonts: ParsedFontItem[];
  lang: string;
  xml: string;
}

const HEADER_COLLECTION_SPECS = [
  { containerTag: 'borderFills', itemTag: 'borderFill', mapKey: 'borderFill' },
  { containerTag: 'tabProperties', itemTag: 'tabPr', mapKey: 'tabPr' },
  { containerTag: 'numberings', itemTag: 'numbering', mapKey: 'numbering' },
  { containerTag: 'charProperties', itemTag: 'charPr', mapKey: 'charPr' },
  { containerTag: 'paraProperties', itemTag: 'paraPr', mapKey: 'paraPr' },
  { containerTag: 'styles', itemTag: 'style', mapKey: 'style' },
  { containerTag: 'memoProperties', itemTag: 'memoPr', mapKey: 'memo' },
] as const;

const FONT_REF_ATTRIBUTE_TO_LANG = {
  hangul: 'HANGUL',
  hanja: 'HANJA',
  japanese: 'JAPANESE',
  latin: 'LATIN',
  other: 'OTHER',
  symbol: 'SYMBOL',
  user: 'USER',
} as const;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findXmlContainer(xml: string, tagName: string): XmlContainer {
  const pattern = new RegExp(`<hh:${tagName}\\b[^>]*>[\\s\\S]*?<\\/hh:${tagName}>`);
  const match = pattern.exec(xml);
  if (!match || typeof match.index !== 'number') {
    throw new Error(`Quarterly appendix merge failed: could not find <hh:${tagName}>.`);
  }

  const full = match[0];
  const openTagEnd = full.indexOf('>') + 1;
  const closeTag = `</hh:${tagName}>`;

  return {
    closeTag,
    inner: full.slice(openTagEnd, full.length - closeTag.length),
    matchEnd: match.index + full.length,
    matchStart: match.index,
    openTag: full.slice(0, openTagEnd),
  };
}

function replaceXmlContainer(
  xml: string,
  tagName: string,
  inner: string,
  itemCount?: number,
): string {
  const container = findXmlContainer(xml, tagName);
  const nextOpenTag =
    typeof itemCount === 'number'
      ? container.openTag.replace(/\bitemCnt="[^"]*"/, `itemCnt="${itemCount}"`)
      : container.openTag;

  return (
    xml.slice(0, container.matchStart) +
    nextOpenTag +
    inner +
    container.closeTag +
    xml.slice(container.matchEnd)
  );
}

function parseCollectionItems(inner: string, itemTag: string): ParsedCollectionItem[] {
  const pattern = new RegExp(
    `(<hh:${itemTag}\\b[\\s\\S]*?<\\/hh:${itemTag}>|<hh:${itemTag}\\b[^>]*/>)`,
    'g',
  );

  return Array.from(inner.matchAll(pattern), (match) => {
    const xml = match[1];
    const id = xml.match(/\bid="(\d+)"/)?.[1] ?? '';
    if (!id) {
      throw new Error(`Quarterly appendix merge failed: <hh:${itemTag}> is missing an id.`);
    }
    return { id, xml };
  });
}

function replaceNumericId(xml: string, nextId: string) {
  return xml.replace(/\bid="(\d+)"/, `id="${nextId}"`);
}

function replaceMappedNumericAttribute(
  xml: string,
  attributeName: string,
  idMap: Map<string, string>,
): string {
  return xml.replace(
    new RegExp(`\\b${escapeRegExp(attributeName)}="(\\d+)"`, 'g'),
    (match, id) => {
      const nextId = idMap.get(id);
      return nextId ? `${attributeName}="${nextId}"` : match;
    },
  );
}

function replaceMappedStringAttribute(
  xml: string,
  attributeName: string,
  idMap: Map<string, string>,
): string {
  return xml.replace(
    new RegExp(`\\b${escapeRegExp(attributeName)}="([^"]+)"`, 'g'),
    (match, id) => {
      const nextId = idMap.get(id);
      return nextId ? `${attributeName}="${nextId}"` : match;
    },
  );
}

function parseFontFaces(inner: string): ParsedFontFace[] {
  return Array.from(
    inner.matchAll(/(<hh:fontface\b[^>]*lang="([^"]+)"[^>]*fontCnt="(\d+)"[^>]*>[\s\S]*?<\/hh:fontface>)/g),
    (match) => {
      const xml = match[1];
      const fonts = Array.from(
        xml.matchAll(/(<hh:font\b[^>]*id="(\d+)"[^>]*face="([^"]+)"[^>]*type="([^"]+)"[^>]*>[\s\S]*?<\/hh:font>)/g),
        (fontMatch) => ({
          face: fontMatch[3],
          id: fontMatch[2],
          signature: `${fontMatch[3]}::${fontMatch[4]}`,
          type: fontMatch[4],
          xml: fontMatch[1],
        }),
      );

      return {
        fontCount: Number.parseInt(match[3], 10),
        fonts,
        lang: match[2],
        xml,
      };
    },
  );
}

function rebuildFontFace(face: ParsedFontFace, fonts: string[]) {
  const nextFontCount = fonts.length;
  const nextOpenTag = face.xml
    .slice(0, face.xml.indexOf('>') + 1)
    .replace(/\bfontCnt="[^"]*"/, `fontCnt="${nextFontCount}"`);
  return `${nextOpenTag}${fonts.join('')}</hh:fontface>`;
}

function mergeFontFaces(
  destinationHeaderXml: string,
  sourceHeaderXml: string,
): {
  fontMapsByLang: Map<string, Map<string, string>>;
  headerXml: string;
} {
  const destinationContainer = findXmlContainer(destinationHeaderXml, 'fontfaces');
  const sourceContainer = findXmlContainer(sourceHeaderXml, 'fontfaces');
  const destinationFaces = parseFontFaces(destinationContainer.inner);
  const sourceFaces = parseFontFaces(sourceContainer.inner);
  const destinationByLang = new Map(destinationFaces.map((face) => [face.lang, face]));
  const sourceByLang = new Map(sourceFaces.map((face) => [face.lang, face]));
  const nextFaces: string[] = [];
  const fontMapsByLang = new Map<string, Map<string, string>>();

  destinationFaces.forEach((destinationFace) => {
    const sourceFace = sourceByLang.get(destinationFace.lang);
    if (!sourceFace) {
      nextFaces.push(destinationFace.xml);
      return;
    }

    const nextMap = new Map<string, string>();
    const fonts = [...destinationFace.fonts.map((font) => font.xml)];
    const existingFontIdBySignature = new Map(
      destinationFace.fonts.map((font) => [font.signature, font.id]),
    );
    let nextFontId = destinationFace.fonts.reduce(
      (maxId, font) => Math.max(maxId, Number.parseInt(font.id, 10)),
      -1,
    );

    sourceFace.fonts.forEach((font) => {
      const existingId = existingFontIdBySignature.get(font.signature);
      if (existingId) {
        nextMap.set(font.id, existingId);
        return;
      }

      nextFontId += 1;
      const newId = String(nextFontId);
      nextMap.set(font.id, newId);
      existingFontIdBySignature.set(font.signature, newId);
      fonts.push(replaceNumericId(font.xml, newId));
    });

    fontMapsByLang.set(destinationFace.lang, nextMap);
    nextFaces.push(rebuildFontFace(destinationFace, fonts));
    sourceByLang.delete(destinationFace.lang);
  });

  sourceByLang.forEach((sourceFace, lang) => {
    fontMapsByLang.set(
      lang,
      new Map(sourceFace.fonts.map((font) => [font.id, font.id])),
    );
    nextFaces.push(sourceFace.xml);
  });

  return {
    fontMapsByLang,
    headerXml: replaceXmlContainer(
      destinationHeaderXml,
      'fontfaces',
      nextFaces.join(''),
      nextFaces.length,
    ),
  };
}

function assignCollectionIds(
  destinationHeaderXml: string,
  sourceHeaderXml: string,
  containerTag: string,
  itemTag: string,
): {
  destinationItems: ParsedCollectionItem[];
  idMap: Map<string, string>;
  sourceItems: ParsedCollectionItem[];
} {
  const destinationItems = parseCollectionItems(
    findXmlContainer(destinationHeaderXml, containerTag).inner,
    itemTag,
  );
  const sourceItems = parseCollectionItems(findXmlContainer(sourceHeaderXml, containerTag).inner, itemTag);
  const idMap = new Map<string, string>();
  let nextId = destinationItems.reduce(
    (maxId, item) => Math.max(maxId, Number.parseInt(item.id, 10)),
    -1,
  );

  sourceItems.forEach((item) => {
    nextId += 1;
    idMap.set(item.id, String(nextId));
  });

  return {
    destinationItems,
    idMap,
    sourceItems,
  };
}

function remapHeadingNumberingId(xml: string, numberingMap: Map<string, string>) {
  return xml.replace(/<hh:heading\b([^>]*)\bidRef="(\d+)"/g, (match, prefix, id) => {
    const nextId = numberingMap.get(id);
    return nextId ? `<hh:heading${prefix}idRef="${nextId}"` : match;
  });
}

function remapCharPrXml(
  xml: string,
  borderFillMap: Map<string, string>,
  fontMapsByLang: Map<string, Map<string, string>>,
): string {
  let nextXml = replaceMappedNumericAttribute(xml, 'borderFillIDRef', borderFillMap);

  nextXml = nextXml.replace(/<hh:fontRef\b([^>]*)\/>/g, (match, attrs) => {
    let nextAttrs = attrs;

    Object.entries(FONT_REF_ATTRIBUTE_TO_LANG).forEach(([attributeName, lang]) => {
      const langMap = fontMapsByLang.get(lang);
      if (!langMap) {
        return;
      }

      nextAttrs = nextAttrs.replace(
        new RegExp(`\\b${attributeName}="(\\d+)"`, 'g'),
        (attrMatch: string, id: string) => {
          const nextId = langMap.get(id);
          return nextId ? `${attributeName}="${nextId}"` : attrMatch;
        },
      );
    });

    return `<hh:fontRef${nextAttrs}/>`;
  });

  return nextXml;
}

function remapNumberingXml(
  xml: string,
  borderFillMap: Map<string, string>,
  charPrMap: Map<string, string>,
): string {
  let nextXml = replaceMappedNumericAttribute(xml, 'borderFillIDRef', borderFillMap);
  nextXml = replaceMappedNumericAttribute(nextXml, 'charPrIDRef', charPrMap);
  return nextXml;
}

function remapParaPrXml(
  xml: string,
  borderFillMap: Map<string, string>,
  numberingMap: Map<string, string>,
  tabPrMap: Map<string, string>,
): string {
  let nextXml = replaceMappedNumericAttribute(xml, 'borderFillIDRef', borderFillMap);
  nextXml = replaceMappedNumericAttribute(nextXml, 'tabPrIDRef', tabPrMap);
  nextXml = remapHeadingNumberingId(nextXml, numberingMap);
  return nextXml;
}

function remapStyleXml(
  xml: string,
  charPrMap: Map<string, string>,
  paraPrMap: Map<string, string>,
  styleMap: Map<string, string>,
): string {
  let nextXml = replaceMappedNumericAttribute(xml, 'charPrIDRef', charPrMap);
  nextXml = replaceMappedNumericAttribute(nextXml, 'paraPrIDRef', paraPrMap);
  nextXml = replaceMappedNumericAttribute(nextXml, 'nextStyleIDRef', styleMap);
  return nextXml;
}

function mergeHeaderDefinitions(
  destinationHeaderXml: string,
  sourceHeaderXml: string,
): HeaderMergeResult {
  const { fontMapsByLang, headerXml: withMergedFonts } = mergeFontFaces(
    destinationHeaderXml,
    sourceHeaderXml,
  );
  let headerXml = withMergedFonts;
  const maps: NumericIdMaps = {
    borderFill: new Map(),
    charPr: new Map(),
    memo: new Map(),
    numbering: new Map(),
    paraPr: new Map(),
    style: new Map(),
    tabPr: new Map(),
  };

  HEADER_COLLECTION_SPECS.forEach((spec) => {
    const assigned = assignCollectionIds(
      headerXml,
      sourceHeaderXml,
      spec.containerTag,
      spec.itemTag,
    );
    maps[spec.mapKey] = assigned.idMap;

    const appendedItems = assigned.sourceItems.map((item) => {
      const nextId = assigned.idMap.get(item.id) ?? item.id;
      let nextXml = replaceNumericId(item.xml, nextId);

      if (spec.mapKey === 'charPr') {
        nextXml = remapCharPrXml(nextXml, maps.borderFill, fontMapsByLang);
      } else if (spec.mapKey === 'numbering') {
        nextXml = remapNumberingXml(nextXml, maps.borderFill, maps.charPr);
      } else if (spec.mapKey === 'paraPr') {
        nextXml = remapParaPrXml(nextXml, maps.borderFill, maps.numbering, maps.tabPr);
      } else if (spec.mapKey === 'style') {
        nextXml = remapStyleXml(nextXml, maps.charPr, maps.paraPr, maps.style);
      }

      return nextXml;
    });

    headerXml = replaceXmlContainer(
      headerXml,
      spec.containerTag,
      [...assigned.destinationItems.map((item) => item.xml), ...appendedItems].join(''),
      assigned.destinationItems.length + assigned.sourceItems.length,
    );
  });

  return {
    headerXml,
    maps,
  };
}

function normalizeHwpxMediaType(mediaType: string, href: string) {
  const normalized = mediaType.toLowerCase();
  const extension = href.split(/[?#]/)[0].split('.').pop()?.toLowerCase() ?? '';
  if (
    normalized === 'image/jpeg' ||
    normalized === 'image/jpg' ||
    extension === 'jpg' ||
    extension === 'jpeg'
  ) {
    return 'image/jpg';
  }
  return normalized;
}

function parseManifestItems(contentHpf: string): ParsedManifestItem[] {
  return Array.from(
    contentHpf.matchAll(/<opf:item\b([^>]*)\/>/g),
    (match): ParsedManifestItem | null => {
      const attrs = match[1];
      const id = attrs.match(/\bid="([^"]+)"/)?.[1]?.trim() ?? '';
      const href = attrs.match(/\bhref="([^"]+)"/)?.[1]?.trim() ?? '';
      const mediaType = attrs.match(/\bmedia-type="([^"]+)"/)?.[1]?.trim() ?? '';
      const embedded = attrs.match(/\bisEmbeded="([^"]+)"/)?.[1]?.trim() ?? '';

      if (!id || !href || !mediaType) {
        return null;
      }

      return {
        href,
        id,
        isEmbedded: embedded !== '0',
        mediaType,
      };
    },
  ).filter((item): item is ParsedManifestItem => item !== null);
}

function upsertManifestItem(
  contentHpf: string,
  itemId: string,
  href: string,
  mediaType: string,
  isEmbedded = true,
) {
  const manifestItem = `<opf:item id="${itemId}" href="${href}" media-type="${mediaType}" isEmbeded="${isEmbedded ? '1' : '0'}" />`;
  const itemPattern = new RegExp(
    `<opf:item\\b[^>]*\\bid="${escapeRegExp(itemId)}"[^>]*/>`,
    'g',
  );
  const withoutExisting = contentHpf.replace(itemPattern, '');
  return withoutExisting.replace('</opf:manifest>', `${manifestItem}</opf:manifest>`);
}

function appendSpineItemRef(contentHpf: string, itemId: string) {
  const itemRef = `<opf:itemref idref="${itemId}"/>`;
  return contentHpf.replace('</opf:spine>', `${itemRef}</opf:spine>`);
}

function getNextSectionIndex(contentHpf: string) {
  const currentIndexes = Array.from(
    contentHpf.matchAll(/href="Contents\/section(\d+)\.xml"/g),
    (match) => Number.parseInt(match[1], 10),
  ).filter(Number.isFinite);

  return currentIndexes.length > 0 ? Math.max(...currentIndexes) + 1 : 0;
}

function buildUniqueManifestItemId(contentHpf: string, preferredId: string) {
  const existingIds = new Set(parseManifestItems(contentHpf).map((item) => item.id));
  let nextId = preferredId;
  let suffix = 1;

  while (existingIds.has(nextId)) {
    nextId = `${preferredId}-${suffix}`;
    suffix += 1;
  }

  return nextId;
}

function buildUniqueManifestHref(contentHpf: string, preferredHref: string) {
  const existingHrefs = new Set(parseManifestItems(contentHpf).map((item) => item.href));
  if (!existingHrefs.has(preferredHref)) {
    return preferredHref;
  }

  const extension = preferredHref.includes('.') ? preferredHref.slice(preferredHref.lastIndexOf('.')) : '';
  const stem = extension ? preferredHref.slice(0, -extension.length) : preferredHref;
  let nextHref = preferredHref;
  let suffix = 1;

  while (existingHrefs.has(nextHref)) {
    nextHref = `${stem}-${suffix}${extension}`;
    suffix += 1;
  }

  return nextHref;
}

function remapAppendixSectionXml(sectionXml: string, maps: NumericIdMaps, binaryIdMap: Map<string, string>) {
  let nextXml = sectionXml;

  nextXml = replaceMappedNumericAttribute(nextXml, 'styleIDRef', maps.style);
  nextXml = replaceMappedNumericAttribute(nextXml, 'paraPrIDRef', maps.paraPr);
  nextXml = replaceMappedNumericAttribute(nextXml, 'charPrIDRef', maps.charPr);
  nextXml = replaceMappedNumericAttribute(nextXml, 'borderFillIDRef', maps.borderFill);
  nextXml = replaceMappedNumericAttribute(nextXml, 'memoShapeIDRef', maps.memo);
  nextXml = replaceMappedStringAttribute(nextXml, 'binaryItemIDRef', binaryIdMap);

  return nextXml;
}

export async function appendInspectionAppendixSections(args: {
  assetBaseUrl?: string;
  contentHpf: string;
  headerXml: string;
  selectedSessions: InspectionSession[];
  siteSessions: InspectionSession[];
  zip: JSZip;
}): Promise<Pick<HeaderMergeResult, 'headerXml'> & { contentHpf: string }> {
  const {
    assetBaseUrl,
    selectedSessions,
    siteSessions,
    zip,
  } = args;
  let contentHpf = args.contentHpf;
  let headerXml = args.headerXml;
  let nextSectionIndex = getNextSectionIndex(contentHpf);

  for (let appendixIndex = 0; appendixIndex < selectedSessions.length; appendixIndex += 1) {
    const session = selectedSessions[appendixIndex];
    const appendixToken = `appendix-${appendixIndex + 1}`;
    const appendix = await buildInspectionAppendixSource(session, siteSessions, {
      assetBaseUrl,
    });
    const mergedHeader = mergeHeaderDefinitions(headerXml, appendix.headerXml);
    const binaryIdMap = new Map<string, string>();

    headerXml = mergedHeader.headerXml;

    appendix.manifestItems.forEach((item) => {
      const preferredId = `${appendixToken}-${item.id}`;
      const preferredHref = item.href.replace(/^BinData\//, `BinData/${appendixToken}-`);
      const nextId = buildUniqueManifestItemId(contentHpf, preferredId);
      const nextHref = buildUniqueManifestHref(contentHpf, preferredHref);

      binaryIdMap.set(item.id, nextId);
      zip.file(nextHref, item.buffer, { compression: 'STORE' });
      contentHpf = upsertManifestItem(
        contentHpf,
        nextId,
        nextHref,
        normalizeHwpxMediaType(item.mediaType, nextHref),
        item.isEmbedded,
      );
    });

    const sectionItemId = `section${nextSectionIndex}`;
    const sectionHref = `Contents/section${nextSectionIndex}.xml`;
    const appendixSectionXml = remapAppendixSectionXml(
      appendix.sectionXml,
      mergedHeader.maps,
      binaryIdMap,
    );

    zip.file(sectionHref, appendixSectionXml);
    contentHpf = upsertManifestItem(contentHpf, sectionItemId, sectionHref, 'application/xml', false);
    contentHpf = appendSpineItemRef(contentHpf, sectionItemId);
    nextSectionIndex += 1;
  }

  return {
    contentHpf,
    headerXml,
  };
}
