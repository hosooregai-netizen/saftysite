import {
  contentBodyToAssetName,
  contentBodyToAssetUrl,
  contentBodyToImageUrl,
  contentBodyToText,
} from '@/lib/safetyApiMappers/utils';
import type { SafetyContentItem } from '@/types/backend';
import type { QuarterlySummaryReport } from '@/types/erpReports';
import type { OpsAssetOption } from './types';

function normalizeOpsDateValue(value: string | null | undefined): string {
  if (!value) return '';
  const normalized = value.trim();
  if (!normalized) return '';

  const directMatch = normalized.match(/^(\d{4}-\d{2}-\d{2})/);
  if (directMatch) {
    return directMatch[1];
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toISOString().slice(0, 10);
}

export function mapContentItemToOpsAsset(item: SafetyContentItem): OpsAssetOption {
  return {
    id: item.id,
    title: item.title,
    description: contentBodyToText(item.body),
    previewUrl: contentBodyToImageUrl(item.body) || contentBodyToAssetUrl(item.body),
    fileUrl: contentBodyToAssetUrl(item.body),
    fileName: contentBodyToAssetName(item.body),
    type: item.content_type,
    sortOrder: item.sort_order,
    effectiveFrom: item.effective_from,
    effectiveTo: item.effective_to,
    isActive: item.is_active,
  };
}

function isOpsAssetEffectiveForDate(asset: OpsAssetOption, reportDate: string): boolean {
  if (!asset.isActive) {
    return false;
  }

  const target = normalizeOpsDateValue(reportDate);
  if (!target) {
    return true;
  }

  const start = normalizeOpsDateValue(asset.effectiveFrom);
  const end = normalizeOpsDateValue(asset.effectiveTo);

  if (start && target < start) {
    return false;
  }
  if (end && target > end) {
    return false;
  }

  return true;
}

function getQuarterlyOpsMatchDate(report: QuarterlySummaryReport): string {
  return report.periodEndDate || report.periodStartDate || report.updatedAt || '';
}

export function getAutoMatchedOpsAsset(
  items: OpsAssetOption[],
  report: QuarterlySummaryReport,
): OpsAssetOption | null {
  const reportDate = getQuarterlyOpsMatchDate(report);

  return (
    [...items]
      .filter((item) => isOpsAssetEffectiveForDate(item, reportDate))
      .sort(
        (left, right) =>
          left.sortOrder - right.sortOrder || left.title.localeCompare(right.title, 'ko'),
      )[0] ?? null
  );
}

function clearQuarterlyOpsAsset(report: QuarterlySummaryReport): QuarterlySummaryReport {
  return {
    ...report,
    opsAssetId: '',
    opsAssetTitle: '',
    opsAssetDescription: '',
    opsAssetPreviewUrl: '',
    opsAssetFileUrl: '',
    opsAssetFileName: '',
    opsAssetType: '',
    opsAssignedBy: '',
    opsAssignedAt: '',
  };
}

export function applyQuarterlyOpsAsset(
  report: QuarterlySummaryReport,
  asset: OpsAssetOption | null,
): QuarterlySummaryReport {
  if (!asset) {
    return clearQuarterlyOpsAsset(report);
  }

  return {
    ...report,
    opsAssetId: asset.id,
    opsAssetTitle: asset.title,
    opsAssetDescription: asset.description,
    opsAssetPreviewUrl: asset.previewUrl,
    opsAssetFileUrl: asset.fileUrl,
    opsAssetFileName: asset.fileName,
    opsAssetType: asset.type,
    opsAssignedBy: '',
    opsAssignedAt: '',
  };
}

export function hasSameQuarterlyOpsAsset(
  report: QuarterlySummaryReport,
  asset: OpsAssetOption | null,
): boolean {
  if (!asset) {
    return !(
      report.opsAssetId ||
      report.opsAssetTitle ||
      report.opsAssetDescription ||
      report.opsAssetPreviewUrl ||
      report.opsAssetFileUrl ||
      report.opsAssetFileName ||
      report.opsAssetType ||
      report.opsAssignedBy ||
      report.opsAssignedAt
    );
  }

  return (
    report.opsAssetId === asset.id &&
    report.opsAssetTitle === asset.title &&
    report.opsAssetDescription === asset.description &&
    report.opsAssetPreviewUrl === asset.previewUrl &&
    report.opsAssetFileUrl === asset.fileUrl &&
    report.opsAssetFileName === asset.fileName &&
    report.opsAssetType === asset.type &&
    report.opsAssignedBy === '' &&
    report.opsAssignedAt === ''
  );
}
