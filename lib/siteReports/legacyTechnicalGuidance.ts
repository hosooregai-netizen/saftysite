import type { InspectionReportListItem } from '@/types/inspectionSession';

export const LEGACY_TECHNICAL_GUIDANCE_REPORT_KEY_PREFIX =
  'legacy:technical_guidance:';

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function isLegacyTechnicalGuidanceReportKey(value: unknown): value is string {
  return normalizeText(value).startsWith(LEGACY_TECHNICAL_GUIDANCE_REPORT_KEY_PREFIX);
}

export function isLegacyTechnicalGuidanceReportItem(
  item: Pick<InspectionReportListItem, 'reportIndexSource' | 'reportKey'>,
) {
  return (
    item.reportIndexSource === 'legacy' &&
    isLegacyTechnicalGuidanceReportKey(item.reportKey)
  );
}

export function isLegacyTechnicalGuidanceCreateTarget(
  item: Pick<
    InspectionReportListItem,
    'originalPdfAvailable' | 'reportIndexSource' | 'reportKey'
  >,
) {
  return (
    isLegacyTechnicalGuidanceReportItem(item) &&
    item.originalPdfAvailable !== true
  );
}

export function getLegacyTechnicalGuidanceReportId(reportKey: string) {
  if (!isLegacyTechnicalGuidanceReportKey(reportKey)) {
    return null;
  }

  return reportKey.slice(LEGACY_TECHNICAL_GUIDANCE_REPORT_KEY_PREFIX.length) || null;
}

export function getSourceLegacyReportKey(
  item: Pick<InspectionReportListItem, 'meta'>,
) {
  const sourceLegacyReportKey = normalizeText(item.meta.sourceLegacyReportKey);
  return isLegacyTechnicalGuidanceReportKey(sourceLegacyReportKey)
    ? sourceLegacyReportKey
    : null;
}

function isRegularSessionReportItem(item: InspectionReportListItem) {
  return (
    !item.reportKey.startsWith('legacy:') &&
    item.reportIndexSource !== 'legacy' &&
    item.reportOpenMode !== 'original_pdf'
  );
}

function hasSameVisitTarget(
  item: InspectionReportListItem,
  legacyItem: InspectionReportListItem,
) {
  return Boolean(
    item.siteId &&
      item.siteId === legacyItem.siteId &&
      item.visitDate &&
      item.visitDate === legacyItem.visitDate &&
      typeof item.visitRound === 'number' &&
      item.visitRound === legacyItem.visitRound,
  );
}

export function findReportGeneratedFromLegacyTarget(
  items: InspectionReportListItem[],
  legacyItem: InspectionReportListItem,
) {
  if (!isLegacyTechnicalGuidanceCreateTarget(legacyItem)) {
    return null;
  }

  return (
    items.find((item) => {
      if (item.reportKey === legacyItem.reportKey || !isRegularSessionReportItem(item)) {
        return false;
      }

      return (
        getSourceLegacyReportKey(item) === legacyItem.reportKey ||
        hasSameVisitTarget(item, legacyItem)
      );
    }) ?? null
  );
}

export function suppressGeneratedLegacyTechnicalGuidancePlaceholders(
  items: InspectionReportListItem[],
) {
  return items.filter((item) => {
    if (!isLegacyTechnicalGuidanceCreateTarget(item)) {
      return true;
    }

    return !findReportGeneratedFromLegacyTarget(items, item);
  });
}
