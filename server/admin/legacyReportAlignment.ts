import type { ControllerReportRow, SafetyInspectionSchedule } from '@/types/admin';
import type { SafetyReportWorkflowStatus, SafetySite } from '@/types/backend';
import {
  buildLegacySiteMatchKey,
  normalizeLegacyLooseMatchText,
  parseLegacySiteId,
} from '@/lib/admin/legacySiteMatching';
import type { LegacyAdminReportSnapshotRow } from './legacyAdminReportsSnapshot';

type LegacyAlignedReportMeta = {
  headquarterId: string;
  headquarterName: string;
  legacyStatus: string;
  legacySiteId: string;
  reportKey: string;
  roundNo: number;
  siteId: string;
  siteName: string;
  visitDate: string;
  workflowStatus: SafetyReportWorkflowStatus;
};

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function buildLegacyReportKey(legacyReportId: string) {
  return `legacy:technical_guidance:${legacyReportId}`;
}

function normalizeLegacyWorkflowStatus(value: string): SafetyReportWorkflowStatus {
  return normalizeText(value) === '완료' ? 'submitted' : 'draft';
}

function resolveLegacySchedulePhase(value: string) {
  const normalized = normalizeText(value);
  if (normalized === '완료') {
    return 'completed' as const;
  }
  if (normalized === '진행') {
    return 'in_progress' as const;
  }
  return 'planned' as const;
}

function isLegacyTechnicalGuidanceKey(value: string) {
  return normalizeText(value).startsWith('legacy:technical_guidance:');
}

function isDateOutsideWindow(plannedDate: string, windowStart: string, windowEnd: string) {
  return Boolean(
    plannedDate &&
      windowStart &&
      windowEnd &&
      (plannedDate < windowStart || plannedDate > windowEnd),
  );
}

function isDateOverdue(
  plannedDate: string,
  today: Date,
  status: SafetyInspectionSchedule['status'],
) {
  if (status !== 'planned' || !plannedDate) {
    return false;
  }

  const parsed = new Date(`${plannedDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  const current = new Date(today);
  current.setHours(0, 0, 0, 0);
  return parsed.getTime() < current.getTime();
}

function buildLegacyReportAlignmentIndex(
  legacyRows: LegacyAdminReportSnapshotRow[],
  sites: SafetySite[],
) {
  const siteByLegacyId = new Map<string, SafetySite>();
  const siteByMatchKey = new Map<string, SafetySite>();
  const sitesByName = new Map<string, SafetySite[]>();

  sites.forEach((site) => {
    const siteNameKey = normalizeLegacyLooseMatchText(site.site_name);
    if (siteNameKey) {
      sitesByName.set(siteNameKey, [...(sitesByName.get(siteNameKey) || []), site]);
    }

    const legacySiteId = parseLegacySiteId(site.memo);
    if (legacySiteId && !siteByLegacyId.has(legacySiteId)) {
      siteByLegacyId.set(legacySiteId, site);
    }

    const siteMatchKey = buildLegacySiteMatchKey(
      normalizeText(site.headquarter_detail?.name) || normalizeText(site.headquarter?.name),
      site.site_name,
    );
    if (siteMatchKey && !siteByMatchKey.has(siteMatchKey)) {
      siteByMatchKey.set(siteMatchKey, site);
    }
  });

  const byReportKey = new Map<string, LegacyAlignedReportMeta>();
  const bySiteRound = new Map<string, LegacyAlignedReportMeta>();

  legacyRows.forEach((row) => {
    const sameNameSites = sitesByName.get(normalizeLegacyLooseMatchText(row.siteName)) || [];
    const matchedSite =
      siteByLegacyId.get(normalizeText(row.legacySiteId)) ||
      siteByMatchKey.get(buildLegacySiteMatchKey(row.headquarterName, row.siteName)) ||
      (sameNameSites.length === 1 ? sameNameSites[0] : null) ||
      null;
    if (!matchedSite) {
      return;
    }

    const meta: LegacyAlignedReportMeta = {
      headquarterId: normalizeText(matchedSite.headquarter_id),
      headquarterName:
        normalizeText(matchedSite.headquarter_detail?.name) ||
        normalizeText(matchedSite.headquarter?.name) ||
        normalizeText(row.headquarterName),
      legacyStatus: normalizeText(row.status),
      legacySiteId: normalizeText(row.legacySiteId),
      reportKey: buildLegacyReportKey(row.legacyReportId),
      roundNo: row.roundNo,
      siteId: normalizeText(matchedSite.id),
      siteName: normalizeText(matchedSite.site_name) || normalizeText(row.siteName),
      visitDate: normalizeText(row.visitDate),
      workflowStatus: normalizeLegacyWorkflowStatus(row.status),
    };

    byReportKey.set(meta.reportKey, meta);
    bySiteRound.set(`${meta.siteId}:${meta.roundNo}`, meta);
  });

  return {
    byReportKey,
    bySiteRound,
  };
}

export function alignAdminReportRowsWithLegacySites(
  rows: ControllerReportRow[],
  input: {
    legacyRows: LegacyAdminReportSnapshotRow[];
    sites: SafetySite[];
  },
) {
  const index = buildLegacyReportAlignmentIndex(input.legacyRows, input.sites);

  return rows.map((row) => {
    if (!row.reportKey.startsWith('legacy:technical_guidance:')) {
      return row;
    }

    const matched = index.byReportKey.get(row.reportKey);
    if (!matched) {
      return row;
    }

    const siteName = matched.siteName || row.siteName;
    const title = row.reportTitle || row.periodLabel || row.reportKey;

    return {
      ...row,
      headquarterId: matched.headquarterId || row.headquarterId,
      headquarterName: matched.headquarterName || row.headquarterName,
      siteId: matched.siteId || row.siteId,
      siteName,
      sortLabel: `${siteName} ${title}`.trim(),
      visitDate: row.visitDate || matched.visitDate,
    };
  });
}

export function alignScheduleRowsWithLegacyReports(
  rows: SafetyInspectionSchedule[],
  input: {
    legacyRows: LegacyAdminReportSnapshotRow[];
    sites: SafetySite[];
    today?: Date;
  }
): SafetyInspectionSchedule[] {
  const index = buildLegacyReportAlignmentIndex(input.legacyRows, input.sites);
  const today = input.today ?? new Date();

  return rows.map((row) => {
    const matched = index.bySiteRound.get(`${row.siteId}:${row.roundNo}`);
    if (!matched) {
      return row;
    }

    const phase = resolveLegacySchedulePhase(matched.legacyStatus);
    const plannedDate = matched.visitDate || row.plannedDate;
    const linkedReportKey =
      phase === 'planned'
        ? isLegacyTechnicalGuidanceKey(row.linkedReportKey)
          ? ''
          : row.linkedReportKey
        : row.linkedReportKey || matched.reportKey;

    if (phase === 'completed' || matched.workflowStatus === 'submitted') {
      return {
        ...row,
        actualVisitDate: row.actualVisitDate || matched.visitDate || plannedDate,
        isOverdue: false,
        isOutOfWindow: isDateOutsideWindow(plannedDate, row.windowStart, row.windowEnd),
        linkedReportKey,
        plannedDate,
        status: 'completed',
      };
    }

    if (phase === 'in_progress') {
      return {
        ...row,
        isOutOfWindow: isDateOutsideWindow(plannedDate, row.windowStart, row.windowEnd),
        isOverdue: false,
        linkedReportKey,
        plannedDate,
      };
    }

    return {
      ...row,
      isOutOfWindow: isDateOutsideWindow(plannedDate, row.windowStart, row.windowEnd),
      isOverdue: isDateOverdue(plannedDate, today, row.status),
      linkedReportKey,
      plannedDate,
    };
  });
}
