import type JSZip from 'jszip';

import {
  applyTemplateTextQuirks,
  bindImagesIntoZip,
  expandRepeatBlocks,
  mapSessionToTemplateBinding,
  replaceTextPlaceholders,
  stripLineSegArrays,
  type TemplateImagePlaceholder,
  validateGeneratedHwpxOrThrow,
} from '@/server/documents/inspection/hwpx';
import type { QuarterlyMergedTemplateImagePlaceholder } from '@/server/documents/quarterly/mergedTemplatePrototype';
import type { InspectionSession } from '@/types/inspectionSession';

const APPENDIX_REPEAT_PATH = 'appendices';
const APPENDIX_REPEAT_START_MARKER = `{#${APPENDIX_REPEAT_PATH}}`;
const APPENDIX_REPEAT_END_MARKER = `{/${APPENDIX_REPEAT_PATH}}`;
const APPENDIX_PROTOTYPE_PREFIX = `${APPENDIX_REPEAT_PATH}[0].`;

interface RenderMergedQuarterlyAppendicesArgs {
  appendixPrototypeXml: string;
  assetBaseUrl?: string;
  contentHpf: string;
  imagePlaceholders: QuarterlyMergedTemplateImagePlaceholder[];
  sectionXml: string;
  selectedSessions: InspectionSession[];
  zip: JSZip;
}

function stripPrefixedTemplateTokens(xml: string, prefix: string) {
  return xml.replace(
    /\{#([^{}]+)\}|\{\/([^{}]+)\}|\{(?![#/])([^{}]+)\}/g,
    (match, repeatStartPath: string | undefined, repeatEndPath: string | undefined, placeholderPath: string | undefined) => {
      const rewritePath = (value: string | undefined) => {
        const normalized = (value ?? '').trim();
        return normalized.startsWith(prefix) ? normalized.slice(prefix.length) : normalized;
      };

      if (repeatStartPath) {
        return `{#${rewritePath(repeatStartPath)}}`;
      }

      if (repeatEndPath) {
        return `{/${rewritePath(repeatEndPath)}}`;
      }

      if (placeholderPath) {
        return `{${rewritePath(placeholderPath)}}`;
      }

      return match;
    },
  );
}

function buildBaseAppendixImagePlaceholders(
  imagePlaceholders: QuarterlyMergedTemplateImagePlaceholder[],
): TemplateImagePlaceholder[] {
  return imagePlaceholders
    .filter((item) => item.placeholderPath.startsWith(APPENDIX_PROTOTYPE_PREFIX))
    .map((item) => ({
      binaryItemId: item.binaryItemId,
      col: -1,
      optional: item.optional,
      placeholderPath: item.placeholderPath.slice(APPENDIX_PROTOTYPE_PREFIX.length),
      repeatBlockPath: item.repeatBlockPath
        ? (item.repeatBlockPath.slice(APPENDIX_PROTOTYPE_PREFIX.length) as TemplateImagePlaceholder['repeatBlockPath'])
        : undefined,
      row: -1,
      table: -1,
    }));
}

function renameBinaryItemRefs(
  xml: string,
  imagePlaceholders: TemplateImagePlaceholder[],
  sessionIndex: number,
): { imagePlaceholders: TemplateImagePlaceholder[]; xml: string } {
  if (sessionIndex === 0) {
    return { imagePlaceholders, xml };
  }

  const binaryIdMap = new Map(
    imagePlaceholders.map((placeholder) => [
      placeholder.binaryItemId,
      `appendix-${sessionIndex + 1}-${placeholder.binaryItemId}`,
    ]),
  );

  const nextXml = xml.replace(/\bbinaryItemIDRef="([^"]+)"/g, (match, binaryItemId: string) => {
    const nextBinaryItemId = binaryIdMap.get(binaryItemId);
    return nextBinaryItemId ? `binaryItemIDRef="${nextBinaryItemId}"` : match;
  });

  return {
    imagePlaceholders: imagePlaceholders.map((placeholder) => ({
      ...placeholder,
      binaryItemId: binaryIdMap.get(placeholder.binaryItemId) ?? placeholder.binaryItemId,
    })),
    xml: nextXml,
  };
}

function countTagOccurrences(xml: string, tagName: string, closing = false) {
  const pattern = new RegExp(closing ? `<\\/${tagName}>` : `<${tagName}\\b`, 'g');
  return Array.from(xml.matchAll(pattern)).length;
}

function assertBalancedAppendixBlockXml(xml: string, sessionIndex: number) {
  for (const tagName of ['hp:subList', 'hp:p']) {
    const openCount = countTagOccurrences(xml, tagName);
    const closeCount = countTagOccurrences(xml, tagName, true);
    if (openCount !== closeCount) {
      throw new Error(
        `Quarterly merged template runtime failed: appendix block ${sessionIndex + 1} has unbalanced ${tagName} tags (${openCount} open / ${closeCount} close).`,
      );
    }
  }
}

export async function renderAppendicesIntoMergedQuarterlySection(
  args: RenderMergedQuarterlyAppendicesArgs,
): Promise<{ contentHpf: string; sectionXml: string }> {
  const sectionPrototypeIndex = args.sectionXml.indexOf(args.appendixPrototypeXml);
  if (sectionPrototypeIndex < 0) {
    throw new Error(
      'Quarterly merged template runtime failed: appendix prototype fragment was not found in section0.xml.',
    );
  }

  const baseBlockXml = stripPrefixedTemplateTokens(
    args.appendixPrototypeXml
      .replace(APPENDIX_REPEAT_START_MARKER, '')
      .replace(APPENDIX_REPEAT_END_MARKER, ''),
    APPENDIX_PROTOTYPE_PREFIX,
  );
  assertBalancedAppendixBlockXml(baseBlockXml, -1);
  const baseImagePlaceholders = buildBaseAppendixImagePlaceholders(args.imagePlaceholders);
  let nextContentHpf = args.contentHpf;
  const renderedBlocks: string[] = [];

  for (let sessionIndex = 0; sessionIndex < args.selectedSessions.length; sessionIndex += 1) {
    const session = args.selectedSessions[sessionIndex];
    const binding = mapSessionToTemplateBinding(session);
    const namespaced = renameBinaryItemRefs(baseBlockXml, baseImagePlaceholders, sessionIndex);
    assertBalancedAppendixBlockXml(namespaced.xml, sessionIndex);
    const expanded = expandRepeatBlocks(
      namespaced.xml,
      binding.repeatCounts,
      namespaced.imagePlaceholders,
    );
    assertBalancedAppendixBlockXml(expanded.xml, sessionIndex);
    const renderedBlockXml = stripLineSegArrays(
      replaceTextPlaceholders(
        applyTemplateTextQuirks(expanded.xml),
        binding.text,
      ),
    );
    assertBalancedAppendixBlockXml(renderedBlockXml, sessionIndex);

    nextContentHpf = await bindImagesIntoZip(
      args.zip,
      nextContentHpf,
      expanded.imagePlaceholders,
      binding,
      args.assetBaseUrl,
      binding.warnings,
    );
    renderedBlocks.push(renderedBlockXml);
  }

  const nextSectionXml = args.sectionXml.replace(
    args.appendixPrototypeXml,
    renderedBlocks.join(''),
  );
  validateGeneratedHwpxOrThrow(args.zip, nextSectionXml, nextContentHpf);

  return {
    contentHpf: nextContentHpf,
    sectionXml: nextSectionXml,
  };
}
