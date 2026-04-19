import { getAdminSectionHref } from '@/lib/admin';
import {
  buildSiteQuarterlyListHref,
  buildSiteReportsHref,
} from '@/features/home/lib/siteEntry';
import { getControllerReportTypeLabel } from '@/lib/admin/controllerReports';
import { getDispatchStatusLabel, getQualityStatusLabel } from '@/lib/admin/reportMeta';
import {
  countFilledQuarterlyMaterials,
  getSiteQuarterlyMaterialRecord,
  hasSiteContractProfile,
  parseSiteContractProfile,
  QUARTERLY_MATERIAL_REQUIRED_COUNT,
} from '@/lib/admin/siteContractProfile';
import type { SafetyReport, SafetyReportListItem } from '@/types/backend';
import type { ControllerDashboardData } from '@/types/controller';
import {
  formatDateOnly,
  formatDateTime,
  formatQuarterKey,
  formatQuarterLabel,
  getDaysUntil,
} from './dates';
import { buildQuarterlyMaterialCountsBySite } from './quarterlyMaterials';
import {
  buildOverviewMetricCards,
  buildSiteStatusSummary,
} from './overviewSummary';
import {
  buildAssignedSiteIdsByUser,
  buildEnrichedRows,
  resolveVisitDispatchState,
  type EnrichedControllerReportRow,
} from './rowEnrichment';
import {
  buildDeadlineSignalSummaryFromRows,
  buildDispatchManagementRows,
  compareDispatchManagementUnsentRows,
  getUnsentDays,
  isDispatchManagementUnsentRow,
  isCurrentSiteManagementWindow,
  isPriorityQuarterlySiteScope,
} from './overviewPolicies';
import type { AdminOverviewModel } from './types';
import type { SafetyAdminPriorityQuarterlyManagementRow } from '@/types/admin';

const PRIORITY_QUARTERLY_EXCEPTION_ORDER: Record<
  SafetyAdminPriorityQuarterlyManagementRow['exceptionStatus'],
  number
> = {
  reflection_missing: 0,
  dispatch_overdue: 1,
  dispatch_pending: 2,
  ok: 3,
};

function buildSiteReportListHref(
  siteId: string,
  reportType: EnrichedControllerReportRow['reportType'],
) {
  return reportType === 'quarterly_report'
    ? buildSiteQuarterlyListHref(siteId)
    : buildSiteReportsHref(siteId);
}

function buildAdminSiteMainHref(siteId: string, headquarterId?: string | null) {
  return getAdminSectionHref('headquarters', {
    headquarterId,
    siteId,
  });
}

function resolveSiteEndingDate(site: ControllerDashboardData['sites'][number]) {
  const contractEndDate = site.contract_end_date?.trim() || '';
  if (contractEndDate) {
    return { endDate: contractEndDate, endDateSource: 'contract_end_date' as const };
  }
  const projectEndDate = site.project_end_date?.trim() || '';
  if (projectEndDate) {
    return { endDate: projectEndDate, endDateSource: 'project_end_date' as const };
  }
  return { endDate: '', endDateSource: '' as const };
}

function pickLatestGuidanceRow(
  current: EnrichedControllerReportRow | undefined,
  candidate: EnrichedControllerReportRow,
) {
  if (!current) return candidate;
  const currentDate = current.visitDate || '';
  const candidateDate = candidate.visitDate || '';
  if (candidateDate !== currentDate) {
    return candidateDate > currentDate ? candidate : current;
  }
  const currentRound = current.visitRound ?? 0;
  const candidateRound = candidate.visitRound ?? 0;
  if (candidateRound !== currentRound) {
    return candidateRound > currentRound ? candidate : current;
  }
  return candidate.updatedAt > current.updatedAt ? candidate : current;
}

function pickLatestQuarterlyRow(
  current: EnrichedControllerReportRow | undefined,
  candidate: EnrichedControllerReportRow,
) {
  if (!current) return candidate;
  return candidate.updatedAt > current.updatedAt ? candidate : current;
}

function extractQuarterKeyFromText(value: string) {
  const directMatched = value.match(/\b(\d{4})-Q([1-4])\b/i);
  if (directMatched) {
    return `${directMatched[1]}-Q${directMatched[2]}`;
  }

  const labelMatched = value.match(/(\d{4})\s*년\s*([1-4])\s*분기/);
  if (labelMatched) {
    return `${labelMatched[1]}-Q${labelMatched[2]}`;
  }

  return '';
}

function inferQuarterKeyFromRow(row: EnrichedControllerReportRow) {
  return extractQuarterKeyFromText(
    [row.routeParam, row.periodLabel, row.reportTitle].filter(Boolean).join(' '),
  );
}

function buildPriorityQuarterlyManagementRows(
  candidateSites: ControllerDashboardData['sites'],
  overviewRows: EnrichedControllerReportRow[],
  today: Date,
): SafetyAdminPriorityQuarterlyManagementRow[] {
  const currentQuarterKey = formatQuarterKey(today);
  const currentQuarterLabel = formatQuarterLabel(today);
  const latestGuidanceRowBySite = new Map<string, EnrichedControllerReportRow>();
  const currentQuarterlyRowBySite = new Map<string, EnrichedControllerReportRow>();

  overviewRows.forEach((row) => {
    if (row.reportType === 'technical_guidance') {
      latestGuidanceRowBySite.set(
        row.siteId,
        pickLatestGuidanceRow(latestGuidanceRowBySite.get(row.siteId), row),
      );
      return;
    }
    if (row.reportType !== 'quarterly_report') return;

    const inferredQuarterKey = inferQuarterKeyFromRow(row);
    const matchesCurrentQuarter =
      inferredQuarterKey === currentQuarterKey ||
      (!inferredQuarterKey &&
        (row.routeParam === currentQuarterKey || row.periodLabel === currentQuarterLabel));
    if (!matchesCurrentQuarter) return;

    currentQuarterlyRowBySite.set(
      row.siteId,
      pickLatestQuarterlyRow(currentQuarterlyRowBySite.get(row.siteId), row),
    );
  });

  return candidateSites
    .map((site) => {
      const latestGuidanceRow = latestGuidanceRowBySite.get(site.id);
      const quarterlyRow = currentQuarterlyRowBySite.get(site.id);
      if (!isPriorityQuarterlySiteScope({ site, today })) {
        return null;
      }
      const quarterlyReflectionStatus = quarterlyRow ? 'created' : 'missing';
      const quarterlyDispatchStatus = !quarterlyRow
        ? 'report_missing'
        : quarterlyRow.dispatchStatus === 'sent'
          ? 'sent'
          : quarterlyRow.dispatchStatus === 'overdue'
            ? 'overdue'
            : 'pending';
      const exceptionStatus =
        quarterlyReflectionStatus === 'missing'
          ? 'reflection_missing'
          : quarterlyDispatchStatus === 'overdue'
            ? 'dispatch_overdue'
            : quarterlyDispatchStatus === 'pending'
              ? 'dispatch_pending'
              : 'ok';
      const exceptionLabel =
        exceptionStatus === 'reflection_missing'
          ? '분기 미반영'
          : exceptionStatus === 'dispatch_overdue'
            ? '발송 지연'
            : exceptionStatus === 'dispatch_pending'
              ? '발송 대기'
              : '정상';

      return {
        currentQuarterKey,
        currentQuarterLabel,
        exceptionLabel,
        exceptionStatus,
        headquarterName: site.headquarter_detail?.name || site.headquarter?.name || '-',
        href: buildSiteQuarterlyListHref(site.id),
        latestGuidanceDate: latestGuidanceRow?.visitDate || '',
        latestGuidanceRound: latestGuidanceRow?.visitRound ?? null,
        projectAmount: site.project_amount ?? null,
        quarterlyDispatchStatus,
        quarterlyReflectionStatus,
        quarterlyReportHref: quarterlyRow?.href || '',
        quarterlyReportKey: quarterlyRow?.reportKey || '',
        siteId: site.id,
        siteName: site.site_name,
      } satisfies SafetyAdminPriorityQuarterlyManagementRow;
    })
    .filter((row): row is SafetyAdminPriorityQuarterlyManagementRow => Boolean(row))
    .sort(
      (left, right) =>
        PRIORITY_QUARTERLY_EXCEPTION_ORDER[left.exceptionStatus] -
          PRIORITY_QUARTERLY_EXCEPTION_ORDER[right.exceptionStatus] ||
        (right.projectAmount ?? 0) - (left.projectAmount ?? 0) ||
        left.siteName.localeCompare(right.siteName, 'ko'),
    )
    .slice(0, 12);
}

function buildQuarterlySummary(
  activeSites: ControllerDashboardData['sites'],
  materialSourceReports: SafetyReport[],
  today: Date,
) {
  const quarterKey = formatQuarterKey(today);
  const quarterLabel = formatQuarterLabel(today);
  const materialCountsBySite = buildQuarterlyMaterialCountsBySite(materialSourceReports, quarterKey);
  const materialBucketCounts = { both_missing: 0, complete: 0, education_missing: 0, measurement_missing: 0 };
  let educationReadyCount = 0;
  let measurementReadyCount = 0;

  const missingSiteRows = activeSites.flatMap((site) => {
    const reportMaterialCounts = materialCountsBySite.get(site.id);
    const materialRecord = reportMaterialCounts == null ? getSiteQuarterlyMaterialRecord(site, quarterKey) : null;
    const educationFilledCount =
      reportMaterialCounts?.educationKeys.size ??
      countFilledQuarterlyMaterials(materialRecord?.educationMaterials ?? []);
    const measurementFilledCount =
      reportMaterialCounts?.measurementKeys.size ??
      countFilledQuarterlyMaterials(materialRecord?.measurementMaterials ?? []);
    const educationMissingCount = Math.max(0, QUARTERLY_MATERIAL_REQUIRED_COUNT - educationFilledCount);
    const measurementMissingCount = Math.max(0, QUARTERLY_MATERIAL_REQUIRED_COUNT - measurementFilledCount);

    if (educationMissingCount === 0) educationReadyCount += 1;
    if (measurementMissingCount === 0) measurementReadyCount += 1;

    if (educationMissingCount === 0 && measurementMissingCount === 0) materialBucketCounts.complete += 1;
    else if (educationMissingCount > 0 && measurementMissingCount > 0) materialBucketCounts.both_missing += 1;
    else if (educationMissingCount > 0) materialBucketCounts.education_missing += 1;
    else materialBucketCounts.measurement_missing += 1;

    if (educationMissingCount === 0 && measurementMissingCount === 0) return [];

    return [{
      education: { filledCount: educationFilledCount, missingCount: educationMissingCount, requiredCount: QUARTERLY_MATERIAL_REQUIRED_COUNT },
      headquarterName: site.headquarter_detail?.name || site.headquarter?.name || '-',
      href: getAdminSectionHref('headquarters', {
        headquarterId: site.headquarter_id,
        siteId: site.id,
      }),
      measurement: { filledCount: measurementFilledCount, missingCount: measurementMissingCount, requiredCount: QUARTERLY_MATERIAL_REQUIRED_COUNT },
      missingLabels: [
        educationMissingCount > 0 ? `교육자료 ${educationFilledCount}/${QUARTERLY_MATERIAL_REQUIRED_COUNT}` : '',
        measurementMissingCount > 0 ? `계측자료 ${measurementFilledCount}/${QUARTERLY_MATERIAL_REQUIRED_COUNT}` : '',
      ].filter(Boolean),
      quarterKey,
      quarterLabel,
      siteId: site.id,
      siteName: site.site_name,
    }];
  }).sort(
    (left, right) =>
      right.education.missingCount +
        right.measurement.missingCount -
        (left.education.missingCount + left.measurement.missingCount) ||
      left.siteName.localeCompare(right.siteName, 'ko'),
  );

  return {
    coverageRows: [
      { itemCount: educationReadyCount, label: '교육자료', missingSiteCount: Math.max(0, activeSites.length - educationReadyCount) },
      { itemCount: measurementReadyCount, label: '계측자료', missingSiteCount: Math.max(0, activeSites.length - measurementReadyCount) },
      {
        itemCount: activeSites.length - activeSites.filter((site) => !hasSiteContractProfile(parseSiteContractProfile(site))).length,
        label: '계약정보',
        missingSiteCount: activeSites.filter((site) => !hasSiteContractProfile(parseSiteContractProfile(site))).length,
      },
    ],
    metricMeta: `${quarterLabel} 교육/계측 각 4건 기준`,
    quarterLabel,
    quarterlyMaterialSummary: {
      entries: [
        { count: materialBucketCounts.complete, href: getAdminSectionHref('headquarters', { siteStatus: 'active' }), key: 'complete', label: '모두 충족' },
        { count: materialBucketCounts.education_missing, href: getAdminSectionHref('headquarters', { siteStatus: 'active' }), key: 'education_missing', label: '교육자료 부족' },
        { count: materialBucketCounts.measurement_missing, href: getAdminSectionHref('headquarters', { siteStatus: 'active' }), key: 'measurement_missing', label: '계측자료 부족' },
        { count: materialBucketCounts.both_missing, href: getAdminSectionHref('headquarters', { siteStatus: 'active' }), key: 'both_missing', label: '교육/계측 모두 부족' },
      ],
      missingSiteRows,
      quarterKey,
      quarterLabel,
      totalSiteCount: activeSites.length,
    },
  };
}

function buildAttentionRows(
  data: ControllerDashboardData,
  overviewRows: EnrichedControllerReportRow[],
  dispatchOverviewRows: EnrichedControllerReportRow[],
  today: Date,
) {
  const inspectorNameBySiteId = new Map(
    data.sites.map((site) => [site.id, site.inspector_name || ''] as const),
  );

  const overdueSiteRows = Array.from(
    [...dispatchOverviewRows.filter((row) => row.reportType === 'quarterly_report' && row.dispatchStatus === 'overdue'), ...overviewRows.filter((row) => row.isBadWorkplaceOverdue)].reduce(
      (map, row) => {
        const current = map.get(row.siteId) ?? {
          badWorkplaceOverdueCount: 0,
          headquarterId: row.headquarterId,
          headquarterName: row.headquarterName,
          quarterlyOverdueCount: 0,
          siteName: row.siteName,
        };
        if (!current.headquarterId && row.headquarterId) current.headquarterId = row.headquarterId;
        if (row.reportType === 'quarterly_report') current.quarterlyOverdueCount += 1;
        if (row.reportType === 'bad_workplace') current.badWorkplaceOverdueCount += 1;
        map.set(row.siteId, current);
        return map;
      },
      new Map<string, { badWorkplaceOverdueCount: number; headquarterId: string; headquarterName: string; quarterlyOverdueCount: number; siteName: string }>(),
    ).entries(),
  )
    .map(([siteId, value]) => ({
      badWorkplaceOverdueCount: value.badWorkplaceOverdueCount,
      headquarterName: value.headquarterName || '-',
      href: buildAdminSiteMainHref(siteId, value.headquarterId),
      overdueCount: value.quarterlyOverdueCount + value.badWorkplaceOverdueCount,
      quarterlyOverdueCount: value.quarterlyOverdueCount,
      reportKindsLabel: [
        value.quarterlyOverdueCount > 0 ? `분기 ${value.quarterlyOverdueCount}건` : '',
        value.badWorkplaceOverdueCount > 0 ? `불량사업장 ${value.badWorkplaceOverdueCount}건` : '',
      ].filter(Boolean).join(' / '),
      siteName: value.siteName,
    }))
    .sort((left, right) => right.overdueCount - left.overdueCount || left.siteName.localeCompare(right.siteName, 'ko'))
    .slice(0, 8);

  const pendingReviewRows = overviewRows
    .filter((row) => row.qualityStatus !== 'ok')
    .sort((left, right) => {
      const qualityWeight = (value: EnrichedControllerReportRow['qualityStatus']) =>
        value === 'issue' ? 0 : value === 'unchecked' ? 1 : 2;
      return qualityWeight(left.qualityStatus) - qualityWeight(right.qualityStatus) || right.updatedAt.localeCompare(left.updatedAt);
    })
    .slice(0, 8)
    .map((row) => ({
      assigneeName: row.assigneeName || '-',
      headquarterName: row.headquarterName || '-',
      href: row.href,
      qualityLabel: getQualityStatusLabel(row.qualityStatus),
      reportTitle: row.reportTitle || row.periodLabel || row.reportKey,
      reportTypeLabel: getControllerReportTypeLabel(row.reportType),
      siteName: row.siteName,
      updatedAt: formatDateTime(row.updatedAt),
    }));

  const assignedSiteIdsByUser = buildAssignedSiteIdsByUser(data);
  const workerLoadRows = data.users
    .map((user) => {
      const assignedSiteCount = assignedSiteIdsByUser.get(user.id)?.size ?? 0;
      const overdueCount = overviewRows.filter((row) => row.assigneeUserId === user.id && row.isOverdue).length;
      const loadLabel = assignedSiteCount === 0 ? '미배정' : overdueCount >= 2 ? '지연 집중' : '과부하';
      const visible = assignedSiteCount === 0 || assignedSiteCount >= 7 || overdueCount >= 2;
      return { assignedSiteCount, href: getAdminSectionHref('reports', { assigneeUserId: user.id }), loadLabel, overdueCount, userName: user.name, visible };
    })
    .filter((row) => row.visible)
    .sort((left, right) => {
      const weight = (value: string) => (value === '미배정' ? 0 : value === '지연 집중' ? 1 : 2);
      return weight(left.loadLabel) - weight(right.loadLabel) || right.overdueCount - left.overdueCount || right.assignedSiteCount - left.assignedSiteCount;
    })
    .slice(0, 8)
    .map(({ visible, ...row }) => {
      void visible;
      return row;
    });

  const technicalGuidanceDispatchRows = dispatchOverviewRows.filter(
    (row) => row.reportType === 'technical_guidance',
  );

  const dispatchManagementUnsentReportRows = technicalGuidanceDispatchRows
    .map((row) => {
      const referenceDate = row.visitDate || row.updatedAt.slice(0, 10);
      const visitDispatch = resolveVisitDispatchState(row.visitDate, row.deadlineDate, row.dispatchStatus, row.updatedAt, today);
      return {
        assigneeName: row.assigneeName || inspectorNameBySiteId.get(row.siteId) || '-',
        deadlineDate: formatDateOnly(visitDispatch.deadlineDate),
        dispatchStatus: visitDispatch.dispatchStatus,
        headquarterName: row.headquarterName || '-',
        href: buildSiteReportListHref(row.siteId, row.reportType),
        referenceDate: formatDateOnly(referenceDate),
        reportKey: row.reportKey,
        reportTitle: row.reportTitle || row.periodLabel || row.reportKey,
        reportTypeLabel: getControllerReportTypeLabel(row.reportType),
        siteId: row.siteId,
        siteName: row.siteName,
        unsentDays: getUnsentDays(referenceDate, today),
        visitDate: formatDateOnly(row.visitDate || referenceDate),
      };
    })
    .filter(isDispatchManagementUnsentRow)
    .sort(compareDispatchManagementUnsentRows);

  return {
    dispatchManagementUnsentReportRows,
    deadlineRows: dispatchOverviewRows
      .filter((row) => row.reportType === 'quarterly_report' && row.dispatchStatus !== 'sent')
      .map((row) => ({ daysUntil: getDaysUntil(today, row.deadlineDate), row }))
      .filter((item) => item.daysUntil != null && item.daysUntil >= 0 && item.daysUntil <= 7)
      .sort((left, right) => (left.daysUntil ?? 99) - (right.daysUntil ?? 99))
      .slice(0, 8)
      .map(({ daysUntil, row }) => ({
        deadlineDate: formatDateOnly(row.deadlineDate),
        deadlineLabel: daysUntil === 0 ? '오늘' : `D-${daysUntil}`,
        href: buildSiteQuarterlyListHref(row.siteId),
        reportTitle: row.reportTitle || row.periodLabel || row.reportKey,
        reportTypeLabel: getControllerReportTypeLabel(row.reportType),
        siteName: row.siteName,
        statusLabel: getDispatchStatusLabel(row.dispatchStatus),
      })),
    deadlineSignalSummary: buildDeadlineSignalSummaryFromRows(dispatchManagementUnsentReportRows, {
      entries: [
        { count: 0, href: getAdminSectionHref('reports', { dispatchStatus: 'normal' }), key: 'd_plus_0_3', label: 'D+0~3' },
        { count: 0, href: getAdminSectionHref('reports', { dispatchStatus: 'warning' }), key: 'd_plus_4_6', label: 'D+4~6' },
        { count: 0, href: getAdminSectionHref('reports', { dispatchStatus: 'overdue' }), key: 'd_plus_7_plus', label: 'D+7 이상' },
      ],
      totalReportCount: 0,
    }),
    overdueSiteRows,
    pendingReviewRows,
    unsentReportRows: dispatchManagementUnsentReportRows,
    workerLoadRows,
  };
}

function buildEndingSoonSummary(
  activeSites: ControllerDashboardData['sites'],
  today: Date,
) {
  const endingSoonRows = activeSites
    .map((site) => {
      const { endDate, endDateSource } = resolveSiteEndingDate(site);
      const daysUntilEnd = getDaysUntil(today, endDate);
      if (daysUntilEnd == null || daysUntilEnd < 0 || daysUntilEnd > 14) {
        return null;
      }
      return {
        deadlineLabel: daysUntilEnd === 0 ? '오늘' : `D-${daysUntilEnd}`,
        daysUntilEnd,
        endDate: formatDateOnly(endDate),
        endDateSource,
        headquarterName: site.headquarter_detail?.name || site.headquarter?.name || '-',
        href: getAdminSectionHref('headquarters', { headquarterId: site.headquarter_id, siteId: site.id }),
        siteId: site.id,
        siteName: site.site_name,
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .sort((left, right) => left.daysUntilEnd - right.daysUntilEnd || left.siteName.localeCompare(right.siteName, 'ko'));

  return {
    endingSoonRows,
    endingSoonSummary: {
      entries: [
        { count: endingSoonRows.filter((row) => row.daysUntilEnd <= 7).length, href: getAdminSectionHref('headquarters', { siteStatus: 'active' }), key: 'd_0_7', label: 'D-0~7' },
        { count: endingSoonRows.filter((row) => row.daysUntilEnd >= 8 && row.daysUntilEnd <= 14).length, href: getAdminSectionHref('headquarters', { siteStatus: 'active' }), key: 'd_8_14', label: 'D-8~14' },
      ],
      totalSiteCount: endingSoonRows.length,
    },
  };
}

export function buildAdminOverviewModel(
  data: ControllerDashboardData,
  reports: SafetyReportListItem[],
  materialSourceReports: SafetyReport[] = [],
  today = new Date(),
): AdminOverviewModel {
  const overviewRows = buildEnrichedRows(data, reports, today);
  const siteById = new Map(data.sites.map((site) => [site.id, site]));
  const dispatchOverviewRows = buildDispatchManagementRows(overviewRows, siteById, today);
  const overviewSites = data.sites.filter((site) => isCurrentSiteManagementWindow(site, today));
  const siteStatusSummary = buildSiteStatusSummary(data, overviewSites);
  const activeSites = overviewSites.filter((site) => site.status === 'active');
  const { coverageRows, metricMeta, quarterlyMaterialSummary } = buildQuarterlySummary(
    activeSites,
    materialSourceReports,
    today,
  );
  const attention = buildAttentionRows(data, overviewRows, dispatchOverviewRows, today);
  const { endingSoonRows, endingSoonSummary } = buildEndingSoonSummary(activeSites, today);
  const priorityQuarterlyManagementRows = buildPriorityQuarterlyManagementRows(
    data.sites,
    overviewRows,
    today,
  );
  const metricCards = buildOverviewMetricCards({
    dispatchManagementUnsentReportRows: attention.dispatchManagementUnsentReportRows,
    metricMeta,
    quarterlyMaterialSummary,
    siteStatusSummary,
    totalSiteCount: siteStatusSummary.totalSiteCount,
  });

  return {
    coverageRows,
    deadlineSignalSummary: attention.deadlineSignalSummary,
    deadlineRows: attention.deadlineRows,
    endingSoonRows,
    endingSoonSummary,
    metricCards,
    overdueSiteRows: attention.overdueSiteRows,
    pendingReviewRows: attention.pendingReviewRows,
    priorityQuarterlyManagementRows,
    quarterlyMaterialSummary,
    siteStatusSummary,
    summaryRows: metricCards.map((card) => ({ label: card.label, meta: card.meta, value: card.value })),
    unsentReportRows: attention.unsentReportRows,
    workerLoadRows: attention.workerLoadRows,
  };
}
