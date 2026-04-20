import JSZip from 'jszip';

import {
  buildInspectionHwpxDocument,
  type GeneratedInspectionHwpxDocument,
} from '@/server/documents/inspection/hwpx';
import type { InspectionSession } from '@/types/inspectionSession';

export interface InspectionAppendixManifestItem {
  buffer: Uint8Array;
  href: string;
  id: string;
  isEmbedded: boolean;
  mediaType: string;
}

export interface InspectionAppendixSource {
  contentHpf: string;
  deferred: string[];
  filename: string;
  headerXml: string;
  manifestItems: InspectionAppendixManifestItem[];
  sectionXml: string;
  warnings: string[];
}

interface ParsedManifestItem {
  href: string;
  id: string;
  isEmbedded: boolean;
  mediaType: string;
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

export function extractInspectionAppendixSection(sectionXml: string): string {
  const rootTag = sectionXml.match(/<hs:sec\b[^>]*>/)?.[0] ?? '';
  const sectionCloseIndex = sectionXml.lastIndexOf('</hs:sec>');
  const coverMarkerIndex = [
    sectionXml.indexOf('hidePageNum="1"'),
    sectionXml.indexOf('hideFooter="1"'),
  ].find((index) => index >= 0) ?? -1;
  const firstTableIndex = coverMarkerIndex >= 0 ? sectionXml.indexOf('<hp:tbl', coverMarkerIndex) : -1;
  const bodyStartIndex =
    firstTableIndex >= 0
      ? ((balancedTagSpans(sectionXml, 'hp:p').find(
          (span) => firstTableIndex >= span.start && firstTableIndex <= span.end,
        ) ?? null))
      : -1;

  if (!rootTag || sectionCloseIndex < 0 || bodyStartIndex === -1 || bodyStartIndex === null) {
    throw new Error('Inspection appendix extraction failed: could not isolate the coverless body.');
  }

  const firstParagraphXml = sectionXml.slice(bodyStartIndex.start, bodyStartIndex.end);
  const tableIndexWithinParagraph = firstTableIndex - bodyStartIndex.start;
  const pageHidingIndexWithinParagraph = firstParagraphXml.lastIndexOf(
    '<hp:ctrl><hp:pageHiding',
    tableIndexWithinParagraph,
  );
  const paragraphOpenTag = firstParagraphXml.match(/^<hp:p\b[^>]*>/)?.[0] ?? '';
  const runMatches = Array.from(firstParagraphXml.matchAll(/<hp:run\b[^>]*>/g));
  const runOpenTag =
    runMatches
      .filter((match) => (match.index ?? -1) < tableIndexWithinParagraph)
      .at(-1)?.[0] ?? '';
  const pageHidingCtrlCloseWithinParagraph =
    pageHidingIndexWithinParagraph >= 0
      ? firstParagraphXml.indexOf('</hp:ctrl>', pageHidingIndexWithinParagraph)
      : -1;
  const trimmedParagraphBodyStart =
    pageHidingCtrlCloseWithinParagraph >= 0
      ? pageHidingCtrlCloseWithinParagraph + '</hp:ctrl>'.length
      : tableIndexWithinParagraph;

  if (!paragraphOpenTag || !runOpenTag || trimmedParagraphBodyStart < 0) {
    throw new Error('Inspection appendix extraction failed: could not trim the first body paragraph.');
  }

  const firstBodyParagraphXml =
    paragraphOpenTag +
    runOpenTag +
    firstParagraphXml.slice(trimmedParagraphBodyStart);

  return (
    `${rootTag}` +
    firstBodyParagraphXml +
    sectionXml.slice(bodyStartIndex.end, sectionCloseIndex) +
    '</hs:sec>'
  );
}

export async function extractInspectionAppendixSourceFromHwpxBuffer(
  buffer: Buffer,
  metadata: Pick<GeneratedInspectionHwpxDocument, 'deferred' | 'filename' | 'warnings'>,
): Promise<InspectionAppendixSource> {
  const zip = await JSZip.loadAsync(buffer);
  const sectionEntry = zip.file('Contents/section0.xml');
  const headerEntry = zip.file('Contents/header.xml');
  const contentEntry = zip.file('Contents/content.hpf');

  if (!sectionEntry || !headerEntry || !contentEntry) {
    throw new Error('Inspection appendix extraction failed: the generated HWPX is incomplete.');
  }

  const [sectionXml, headerXml, contentHpf] = await Promise.all([
    sectionEntry.async('string'),
    headerEntry.async('string'),
    contentEntry.async('string'),
  ]);
  const appendixSectionXml = extractInspectionAppendixSection(sectionXml);
  const referencedBinaryIds = new Set(
    Array.from(
      appendixSectionXml.matchAll(/\bbinaryItemIDRef="([^"]+)"/g),
      (match) => match[1],
    ),
  );
  const manifestItems = await Promise.all(
    parseManifestItems(contentHpf)
      .filter((item) => referencedBinaryIds.has(item.id))
      .map(async (item) => {
        const entry = zip.file(item.href);
        if (!entry) {
          throw new Error(
            `Inspection appendix extraction failed: missing binary asset "${item.href}".`,
          );
        }

        return {
          ...item,
          buffer: await entry.async('uint8array'),
        };
      }),
  );

  return {
    contentHpf,
    deferred: [...metadata.deferred],
    filename: metadata.filename,
    headerXml,
    manifestItems,
    sectionXml: appendixSectionXml,
    warnings: [...metadata.warnings],
  };
}

export async function buildInspectionAppendixSource(
  session: InspectionSession,
  siteSessions: InspectionSession[] = [session],
  options: {
    assetBaseUrl?: string;
  } = {},
): Promise<InspectionAppendixSource> {
  const document = await buildInspectionHwpxDocument(session, siteSessions, options);
  return extractInspectionAppendixSourceFromHwpxBuffer(document.buffer, document);
}
