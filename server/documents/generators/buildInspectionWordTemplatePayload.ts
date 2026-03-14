import 'server-only';

import { createEmptyReport, DEFAULT_IMPLEMENTATION_PERIOD } from '@/constants/hazard';
import { createEmptyCausativeAgentMap } from '@/constants/siteOverview';
import type { InspectionWordData } from '@/server/documents/mappers/mapInspectionSessionToWordData';
import { MimeType, type ImageContent, type TemplateData } from 'easy-template-x';
import { imageSize } from 'image-size';

const DEFAULT_LOCATION_LABEL = createEmptyReport().location;

const SITE_OVERVIEW_IMAGE_BOUNDS = {
  width: 420,
  height: 260,
};

const SECTION_IMAGE_BOUNDS = {
  width: 240,
  height: 180,
};

const CHECKED_MARK = '\u2611';
const UNCHECKED_MARK = '\u2610';

const FATAL_ACCIDENT_CAUSE_CODES = [
  'openEdge',
  'steel',
  'roof',
  'scaffoldWorkPlatform',
  'excavator',
  'aerialWorkPlatform',
  'ladder',
  'suspendedScaffold',
  'truck',
  'mobileScaffold',
  'formworkSupport',
  'mobileCrane',
  'fireExplosion',
  'otherHazard',
] as const;

const DATA_URL_MIME_FORMATS: Record<string, ImageContent['format']> = {
  'image/png': MimeType.Png,
  'image/jpeg': MimeType.Jpeg,
  'image/jpg': MimeType.Jpeg,
  'image/gif': MimeType.Gif,
  'image/bmp': MimeType.Bmp,
  'image/svg+xml': MimeType.Svg,
};

interface ImageBounds {
  width: number;
  height: number;
}

interface ParsedDataUrl {
  buffer: Buffer;
  format: ImageContent['format'];
}

function normalizeText(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

function normalizeLocation(value: string | null | undefined): string {
  const normalized = normalizeText(value);
  return normalized === DEFAULT_LOCATION_LABEL ? '' : normalized;
}

function hasAnyStringContent<T extends object>(
  item: T,
  ignoredKeys: string[] = ['id']
): boolean {
  return Object.entries(item as Record<string, unknown>).some(([key, value]) => {
    if (ignoredKeys.includes(key)) return false;
    return typeof value === 'string' ? Boolean(normalizeText(value)) : false;
  });
}

function shouldIncludeHazardItem(item: {
  processName?: string;
  locationDetail?: string;
  likelihood?: string;
  severity?: string;
  hazardFactors?: string;
  improvementItems?: string;
  photoUrl?: string;
  legalInfo?: string;
  implementationPeriod?: string;
}): boolean {
  const implementationPeriod = normalizeText(item.implementationPeriod);

  return Boolean(
    normalizeText(item.processName) ||
      normalizeText(item.locationDetail) ||
      normalizeText(item.likelihood) ||
      normalizeText(item.severity) ||
      normalizeText(item.hazardFactors) ||
      normalizeText(item.improvementItems) ||
      normalizeText(item.photoUrl) ||
      normalizeText(item.legalInfo) ||
      (implementationPeriod && implementationPeriod !== DEFAULT_IMPLEMENTATION_PERIOD)
  );
}

function parseImageDataUrl(dataUrl: string): ParsedDataUrl | null {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/i);
  if (!match) return null;

  const mime = match[1].toLowerCase();
  const format = DATA_URL_MIME_FORMATS[mime];
  if (!format) return null;

  try {
    return {
      buffer: Buffer.from(match[2], 'base64'),
      format,
    };
  } catch {
    return null;
  }
}

function fitImageDimensions(
  originalWidth: number,
  originalHeight: number,
  bounds: ImageBounds
): ImageBounds {
  if (!originalWidth || !originalHeight) {
    return bounds;
  }

  const scale = Math.min(
    bounds.width / originalWidth,
    bounds.height / originalHeight,
    1
  );

  return {
    width: Math.max(1, Math.round(originalWidth * scale)),
    height: Math.max(1, Math.round(originalHeight * scale)),
  };
}

function buildImageContent(
  dataUrl: string,
  bounds: ImageBounds
): ImageContent | '' {
  const normalized = normalizeText(dataUrl);
  if (!normalized) return '';

  const parsed = parseImageDataUrl(normalized);
  if (!parsed) return '';

  try {
    const dimensions = imageSize(parsed.buffer);
    const fitted = fitImageDimensions(
      dimensions.width ?? bounds.width,
      dimensions.height ?? bounds.height,
      bounds
    );

    return {
      _type: 'image',
      source: parsed.buffer,
      format: parsed.format,
      width: fitted.width,
      height: fitted.height,
    };
  } catch {
    return '';
  }
}

function buildCoverPayload(
  cover: InspectionWordData['cover']
): Record<string, string> {
  return {
    'cover.businessName': normalizeText(cover.businessName),
    'cover.projectName': normalizeText(cover.projectName),
    'cover.inspectionDate': normalizeText(cover.inspectionDate),
    'cover.consultantName': normalizeText(cover.consultantName),
    'cover.processSummary': normalizeText(cover.processSummary),
    'cover.siteAddress': normalizeText(cover.siteAddress),
    'cover.contractorName': normalizeText(cover.contractorName),
    'cover.notes': normalizeText(cover.notes),
  };
}

function buildFutureProcessSummaryPayload(
  items: InspectionWordData['futureProcessRisks']
): Record<string, string> {
  const processNames = items
    .map((item) => normalizeText(item.processName) || normalizeText(item.locationDetail))
    .filter(Boolean)
    .slice(0, 9);

  return Object.fromEntries(
    Array.from({ length: 9 }, (_, index) => [
      `futureProcessSummary.item${index + 1}`,
      processNames[index] ?? '',
    ])
  );
}

function buildFatalAccidentCauseChecksPayload(
  agents: InspectionWordData['siteOverview']['agents']
): Record<string, string> {
  const causativeAgentKeys = Object.keys(
    createEmptyCausativeAgentMap()
  ) as Array<keyof typeof agents>;

  return Object.fromEntries(
    FATAL_ACCIDENT_CAUSE_CODES.map((code, index) => {
      const agentKey = causativeAgentKeys[index];
      return [
        `fatalAccidentCauseChecks.${code}`,
        agentKey && agents[agentKey] ? CHECKED_MARK : UNCHECKED_MARK,
      ];
    })
  );
}

export async function buildInspectionWordTemplatePayload(
  data: InspectionWordData
): Promise<TemplateData> {
  return {
    ...buildCoverPayload(data.cover),
    ...buildFutureProcessSummaryPayload(data.futureProcessRisks),
    ...buildFatalAccidentCauseChecksPayload(data.siteOverview.agents),
    'image:siteOverview.photoUrl': buildImageContent(
      data.siteOverview.photoUrl,
      SITE_OVERVIEW_IMAGE_BOUNDS
    ),
    previousGuidanceItems: data.previousGuidanceItems.map((item) => ({
      'previousGuidanceItems.location': normalizeLocation(item.location),
      'previousGuidanceItems.locationDetail': normalizeText(item.locationDetail),
      'previousGuidanceItems.guidanceDate': normalizeText(item.guidanceDate),
      'previousGuidanceItems.confirmationDate': normalizeText(item.confirmationDate),
      'previousGuidanceItems.hazardFactors': normalizeText(item.hazardFactors),
      'previousGuidanceItems.improvementItems': normalizeText(item.improvementItems),
      'previousGuidanceItems.legalInfo': normalizeText(item.legalInfo),
      'previousGuidanceItems.implementationResult': normalizeText(
        item.implementationResult
      ),
      'image:previousGuidanceItems.currentPhotoUrl': buildImageContent(
        item.currentPhotoUrl,
        SECTION_IMAGE_BOUNDS
      ),
    })),
    currentHazards: data.currentHazards
      .filter((item) => shouldIncludeHazardItem(item))
      .map((item) => ({
        'currentHazards.location': normalizeLocation(item.location),
        'currentHazards.locationDetail': normalizeText(item.locationDetail),
        'currentHazards.likelihood': normalizeText(item.likelihood),
        'currentHazards.severity': normalizeText(item.severity),
        'currentHazards.riskAssessmentResult': normalizeText(
          item.riskAssessmentResult
        ),
        'currentHazards.hazardFactors': normalizeText(item.hazardFactors),
        'currentHazards.improvementItems': normalizeText(item.improvementItems),
        'currentHazards.legalInfo': normalizeText(item.legalInfo),
        'currentHazards.implementationPeriod': normalizeText(
          item.implementationPeriod
        ),
        'image:currentHazards.photoUrl': buildImageContent(
          item.photoUrl,
          SECTION_IMAGE_BOUNDS
        ),
      })),
    futureProcessRisks: data.futureProcessRisks
      .filter((item) => shouldIncludeHazardItem(item))
      .map((item) => ({
        'futureProcessRisks.processName': normalizeText(item.processName),
        'futureProcessRisks.locationDetail': normalizeText(item.locationDetail),
        'futureProcessRisks.likelihood': normalizeText(item.likelihood),
        'futureProcessRisks.severity': normalizeText(item.severity),
        'futureProcessRisks.riskAssessmentResult': normalizeText(
          item.riskAssessmentResult
        ),
        'futureProcessRisks.hazardFactors': normalizeText(item.hazardFactors),
        'futureProcessRisks.improvementItems': normalizeText(item.improvementItems),
        'futureProcessRisks.legalInfo': normalizeText(item.legalInfo),
        'futureProcessRisks.implementationPeriod': normalizeText(
          item.implementationPeriod
        ),
      })),
    'supportItems.technicalMaterials': data.supportItems.technicalMaterials
      .filter((item) => hasAnyStringContent(item))
      .map((item) => ({
        'supportItems.technicalMaterials.materialName': normalizeText(
          item.materialName
        ),
        'supportItems.technicalMaterials.providedKinds': normalizeText(
          item.providedKinds
        ),
        'supportItems.technicalMaterials.participantCount': normalizeText(
          item.participantCount
        ),
        'supportItems.technicalMaterials.educationContent': normalizeText(
          item.educationContent
        ),
        'supportItems.technicalMaterials.note': normalizeText(item.note),
        'image:supportItems.technicalMaterials.photoUrl': buildImageContent(
          item.photoUrl,
          SECTION_IMAGE_BOUNDS
        ),
      })),
    'supportItems.equipmentChecks': data.supportItems.equipmentChecks
      .filter((item) => hasAnyStringContent(item))
      .map((item) => ({
        'supportItems.equipmentChecks.equipmentName': normalizeText(
          item.equipmentName
        ),
        'supportItems.equipmentChecks.measurementLocation': normalizeText(
          item.measurementLocation
        ),
        'supportItems.equipmentChecks.measurementCriteria': normalizeText(
          item.measurementCriteria
        ),
        'supportItems.equipmentChecks.measuredValue': normalizeText(
          item.measuredValue
        ),
        'supportItems.equipmentChecks.suitability': normalizeText(
          item.suitability
        ),
        'supportItems.equipmentChecks.note': normalizeText(item.note),
        'image:supportItems.equipmentChecks.photoUrl': buildImageContent(
          item.photoUrl,
          SECTION_IMAGE_BOUNDS
        ),
      })),
    'supportItems.educationSupports': data.supportItems.educationSupports
      .filter((item) => hasAnyStringContent(item))
      .map((item) => ({
        'supportItems.educationSupports.supportItem': normalizeText(
          item.supportItem
        ),
        'supportItems.educationSupports.details': normalizeText(item.details),
        'supportItems.educationSupports.note': normalizeText(item.note),
        'image:supportItems.educationSupports.photoUrl': buildImageContent(
          item.photoUrl,
          SECTION_IMAGE_BOUNDS
        ),
      })),
    'supportItems.otherSupports': data.supportItems.otherSupports
      .filter((item) => hasAnyStringContent(item))
      .map((item) => ({
        'supportItems.otherSupports.supportItem': normalizeText(item.supportItem),
        'supportItems.otherSupports.details': normalizeText(item.details),
        'supportItems.otherSupports.note': normalizeText(item.note),
        'image:supportItems.otherSupports.photoUrl': buildImageContent(
          item.photoUrl,
          SECTION_IMAGE_BOUNDS
        ),
      })),
    'supportItems.accidentSummary.periodStart': normalizeText(
      data.supportItems.accidentSummary.periodStart
    ),
    'supportItems.accidentSummary.periodEnd': normalizeText(
      data.supportItems.accidentSummary.periodEnd
    ),
    'supportItems.accidentSummary.accidentDescription': normalizeText(
      data.supportItems.accidentSummary.accidentDescription
    ),
    'supportItems.accidentSummary.occurred': data.supportItems.accidentSummary.occurred
      ? '\uC720'
      : '\uBB34',
  };
}
