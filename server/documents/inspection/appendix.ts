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

function extractInspectionAppendixSection(sectionXml: string): string {
  const rootTag = sectionXml.match(/<hs:sec\b[^>]*>/)?.[0] ?? '';
  const sectionCloseIndex = sectionXml.lastIndexOf('</hs:sec>');
  const coverMarkerIndex = [
    sectionXml.indexOf('hidePageNum="1"'),
    sectionXml.indexOf('hideFooter="1"'),
  ].find((index) => index >= 0) ?? -1;
  const firstTableIndex =
    coverMarkerIndex >= 0 ? sectionXml.indexOf('<hp:tbl', coverMarkerIndex) : -1;
  const bodyStartIndex =
    firstTableIndex >= 0 ? sectionXml.lastIndexOf('<hp:p ', firstTableIndex) : -1;

  if (!rootTag || sectionCloseIndex < 0 || bodyStartIndex < 0) {
    throw new Error('Inspection appendix extraction failed: could not isolate the coverless body.');
  }

  return `${rootTag}${sectionXml.slice(bodyStartIndex, sectionCloseIndex)}</hs:sec>`;
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
