'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  buildDonutSlices,
  fullDonutRing,
} from '@/components/session/workspace/chartDonutUtils';
import {
  buildOverviewSiteQuickLink,
  type AdminOverviewAsyncKpiState,
  type AdminOverviewChartEntry,
  type AdminOverviewPendingAgentRow,
  type AdminOverviewSiteLink,
  type AdminOverviewUrgentSiteRow,
} from '@/features/admin/lib/buildAdminOverviewModel';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import { getControllerSectionHref, isFieldAgentUserRole } from '@/lib/admin/adminShared';
import {
  mapSafetyReportToBadWorkplaceReport,
  mapSafetyReportToQuarterlySummaryReport,
} from '@/lib/erpReports/mappers';
import {
  formatReportMonthLabel,
  getCurrentReportMonth,
  getQuarterTargetsForConstructionPeriod,
  getStoredReportKind,
  TECHNICAL_GUIDANCE_REPORT_KIND,
} from '@/lib/erpReports/shared';
import { SafetyApiError, fetchSafetyReportsBySite, readSafetyAuthToken } from '@/lib/safetyApi';
import type { SafetyReport, SafetySite, SafetyUser } from '@/types/backend';

const FETCH_CONCURRENCY = 6;
const KPI_CACHE_TTL_MS = 1000 * 60 * 5;
const EMPTY_DONUT_RING = fullDonutRing(0, 0, 22, 40);

interface OperationalKpiPanelProps {
  coverageEntries: AdminOverviewChartEntry[];
  onDataChange?: (state: AdminOverviewAsyncKpiState) => void;
  reportProgressEntries: AdminOverviewChartEntry[];
  sites: SafetySite[];
  users: SafetyUser[];
}

interface QuarterlyStatusRow {
  detailHref: string;
  headquarterName: string | null;
  missingCount: number;
  missingLabels: string[];
  siteId: string;
  siteName: string;
}

interface OperationalKpiCacheEntry {
  key: string;
  loadedAt: number;
  pendingAgentRows: AdminOverviewPendingAgentRow[];
  reportProgressEntries: AdminOverviewChartEntry[];
  urgentSiteRows: AdminOverviewUrgentSiteRow[];
}

let operationalKpiCache: OperationalKpiCacheEntry | null = null;

const EMPTY_REPORT_PROGRESS_ENTRIES: AdminOverviewChartEntry[] = [
  { count: 0, label: '완료' },
  { count: 0, label: '작성 중' },
  { count: 0, label: '미착수' },
];

function isQuarterlyReport(
  value: ReturnType<typeof mapSafetyReportToQuarterlySummaryReport>,
): value is NonNullable<ReturnType<typeof mapSafetyReportToQuarterlySummaryReport>> {
  return Boolean(value);
}

function isBadWorkplaceReport(
  value: ReturnType<typeof mapSafetyReportToBadWorkplaceReport>,
): value is NonNullable<ReturnType<typeof mapSafetyReportToBadWorkplaceReport>> {
  return Boolean(value);
}

function getErrorMessage(error: unknown) {
  if (error instanceof SafetyApiError || error instanceof Error) {
    return error.message;
  }

  return '운영 현황 데이터를 불러오지 못했습니다.';
}

function buildKpiCacheKey(sites: SafetySite[], users: SafetyUser[], reportMonth: string) {
  const siteKey = sites
    .map((site) => site.id)
    .sort()
    .join(',');
  const userKey = users
    .map((user) => user.id)
    .sort()
    .join(',');

  return `${reportMonth}::${siteKey}::${userKey}`;
}

function pushUniqueValue(values: string[], value: string) {
  if (!values.includes(value)) {
    values.push(value);
  }
}

function buildReportProgressEntriesFromReports(
  reports: SafetyReport[],
): AdminOverviewChartEntry[] {
  const stats = reports.reduce(
    (accumulator, report) => {
      const progressRate = typeof report.progress_rate === 'number' ? report.progress_rate : 0;

      if (progressRate >= 100) accumulator.completed += 1;
      else if (progressRate > 0) accumulator.inProgress += 1;
      else accumulator.notStarted += 1;

      return accumulator;
    },
    { completed: 0, inProgress: 0, notStarted: 0 },
  );

  return [
    { count: stats.completed, label: '완료' },
    { count: stats.inProgress, label: '작성 중' },
    { count: stats.notStarted, label: '미착수' },
  ];
}

function renderSiteLinks(siteLinks: AdminOverviewSiteLink[], emptyLabel = '-') {
  if (siteLinks.length === 0) {
    return emptyLabel;
  }

  return (
    <div className={styles.tableInlineLinks}>
      {siteLinks.map((site) => (
        <Link key={site.siteId} href={site.href} className={styles.tableChipLink}>
          {site.siteName}
        </Link>
      ))}
    </div>
  );
}

function DonutChartCard({
  entries,
  title,
}: {
  entries: AdminOverviewChartEntry[];
  title: string;
}) {
  const total = entries.reduce((sum, item) => sum + item.count, 0);
  const populatedEntries = entries.filter((item) => item.count > 0);
  const slices = total > 0 ? buildDonutSlices(populatedEntries, total) : [];
  const colorByLabel = new Map(slices.map((slice) => [slice.label, slice.color]));

  return (
    <article className={styles.kpiVisualCard}>
      <div className={styles.kpiVisualHeader}>
        <div>
          <h3 className={styles.kpiVisualTitle}>{title}</h3>
        </div>
      </div>

      <div className={styles.kpiDonutLayout}>
        <div className={styles.kpiDonutFigure}>
          <svg
            className={styles.kpiDonutSvg}
            viewBox="-50 -50 100 100"
            role="img"
            aria-label={`${title}: 총 ${total}건`}
          >
            <title>{`${title}: 총 ${total}건`}</title>
            <path d={EMPTY_DONUT_RING} fill="#e8edf3" />
            {slices.map((slice) => (
              <path key={slice.label} d={slice.path} fill={slice.color} stroke="none" />
            ))}
          </svg>
          <div className={styles.kpiDonutCenter} aria-hidden="true">
            <strong>{total}</strong>
            <span>건</span>
          </div>
        </div>

        <ul className={styles.kpiLegend}>
          {entries.map((item) => (
            <li key={item.label} className={styles.kpiLegendItem}>
              <span
                className={styles.kpiLegendSwatch}
                style={{
                  backgroundColor:
                    total > 0 && item.count > 0
                      ? colorByLabel.get(item.label) ?? '#4f8ae8'
                      : '#d7e0e8',
                }}
                aria-hidden="true"
              />
              <span className={styles.kpiLegendLabel}>{item.label}</span>
              <span className={styles.kpiLegendValue}>{item.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function MissingSitesBarCard({
  isLoading,
  rows,
}: {
  isLoading: boolean;
  rows: AdminOverviewUrgentSiteRow[];
}) {
  const topRows = rows.slice(0, 5);
  const maxValue = topRows.reduce((currentMax, row) => Math.max(currentMax, row.missingCount), 0);

  return (
    <article className={styles.kpiVisualCard}>
      <div className={styles.kpiVisualHeader}>
        <div>
          <h3 className={styles.kpiVisualTitle}>분기 누락 현장 Top 5</h3>
        </div>
      </div>

      {topRows.length > 0 ? (
        <div className={styles.kpiBarList}>
          {topRows.map((row) => {
            const width = maxValue > 0 ? `${(row.missingCount / maxValue) * 100}%` : '0%';

            return (
              <div key={row.siteId} className={styles.kpiBarItem}>
                <div className={styles.kpiBarHeader}>
                  <div className={styles.kpiBarHeading}>
                    <Link href={row.detailHref} className={styles.kpiBarTitleLink}>
                      {row.siteName}
                    </Link>
                    <span className={styles.kpiBarMeta}>
                      {row.headquarterName ?? '본사 정보 없음'}
                    </span>
                  </div>
                  <strong className={styles.kpiBarValue}>{row.missingCount}</strong>
                </div>
                <div className={styles.kpiBarTrack} aria-hidden="true">
                  <span className={styles.kpiBarFill} style={{ width }} />
                </div>
                <p className={styles.kpiBarDescription}>{row.missingLabels.join(', ')}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.empty}>
          {isLoading
            ? '분기 누락 현장을 집계하고 있습니다.'
            : '지금 확인이 필요한 분기 누락 현장이 없습니다.'}
        </div>
      )}
    </article>
  );
}

function PendingAgentsPanel({
  currentMonthLabel,
  isLoading,
  rows,
}: {
  currentMonthLabel: string;
  isLoading: boolean;
  rows: AdminOverviewPendingAgentRow[];
}) {
  return (
    <article className={styles.kpiAlertPanel}>
      <div className={styles.kpiAlertHeader}>
        <div>
          <h3 className={styles.kpiAlertTitle}>{currentMonthLabel} 신고 미달 지도요원</h3>
        </div>
        <Link href={getControllerSectionHref('users')} className="app-button app-button-secondary">
          사용자 관리
        </Link>
      </div>

      {rows.length > 0 ? (
        <div className={styles.kpiAlertList}>
          {rows.map((row) => (
            <div key={row.userId} className={styles.kpiAlertItem}>
              <div className={styles.kpiAlertItemHeader}>
                <strong className={styles.kpiAlertItemTitle}>{row.userName}</strong>
                <span className="app-chip">신고 {row.reportCount}건</span>
              </div>
              <p className={styles.kpiAlertItemText}>
                담당 현장 {row.assignedSites.length}개. 우선 배정 현장을 확인해 주세요.
              </p>
              {row.assignedSites.length > 0 ? renderSiteLinks(row.assignedSites) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          {isLoading
            ? '월간 신고 현황을 집계하고 있습니다.'
            : '이번 달 신고 기준 미달인 지도요원이 없습니다.'}
        </div>
      )}
    </article>
  );
}

export default function OperationalKpiPanel({
  coverageEntries,
  onDataChange,
  reportProgressEntries,
  sites,
  users,
}: OperationalKpiPanelProps) {
  const [asyncReportProgressEntries, setAsyncReportProgressEntries] =
    useState<AdminOverviewChartEntry[] | null>(null);
  const [urgentSiteRows, setUrgentSiteRows] = useState<AdminOverviewUrgentSiteRow[]>([]);
  const [pendingAgentRows, setPendingAgentRows] = useState<AdminOverviewPendingAgentRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeSites = useMemo(() => sites.filter((site) => site.status === 'active'), [sites]);
  const activeFieldAgents = useMemo(
    () => users.filter((user) => user.is_active && isFieldAgentUserRole(user.role)),
    [users],
  );
  const currentReportMonth = getCurrentReportMonth();
  const currentMonthLabel = formatReportMonthLabel(currentReportMonth);
  const cacheKey = useMemo(
    () => buildKpiCacheKey(activeSites, activeFieldAgents, currentReportMonth),
    [activeFieldAgents, activeSites, currentReportMonth],
  );
  const effectiveReportProgressEntries = asyncReportProgressEntries ?? reportProgressEntries;

  useEffect(() => {
    if (!onDataChange) return;

    onDataChange({
      pendingAgentRows,
      urgentSiteRows,
    });
  }, [onDataChange, pendingAgentRows, urgentSiteRows]);

  useEffect(() => {
    if (
      operationalKpiCache &&
      operationalKpiCache.key === cacheKey &&
      Date.now() - operationalKpiCache.loadedAt < KPI_CACHE_TTL_MS
    ) {
      setAsyncReportProgressEntries(operationalKpiCache.reportProgressEntries);
      setUrgentSiteRows(operationalKpiCache.urgentSiteRows);
      setPendingAgentRows(operationalKpiCache.pendingAgentRows);
      setHasLoaded(true);
      setError(null);
      return;
    }

    setAsyncReportProgressEntries(null);
    setUrgentSiteRows([]);
    setPendingAgentRows([]);
    setHasLoaded(false);
    setError(null);
  }, [cacheKey]);

  const loadKpi = useCallback(async () => {
    const token = readSafetyAuthToken();
    if (!token || activeSites.length === 0) {
      setAsyncReportProgressEntries(EMPTY_REPORT_PROGRESS_ENTRIES);
      setUrgentSiteRows([]);
      setPendingAgentRows([]);
      setHasLoaded(true);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const pendingSites = [...activeSites];
      const siteQuickLinkById = new Map(
        activeSites.map((site) => [site.id, buildOverviewSiteQuickLink(site)]),
      );
      const assignedSiteIdsByUserId = activeSites.reduce((accumulator, site) => {
        const linkedUsers = site.assigned_users?.length
          ? site.assigned_users
          : site.assigned_user
            ? [site.assigned_user]
            : [];

        linkedUsers.forEach((user) => {
          const current = accumulator.get(user.id) ?? new Set<string>();
          current.add(site.id);
          accumulator.set(user.id, current);
        });

        return accumulator;
      }, new Map<string, Set<string>>());

      const siteReports: Array<{
        badWorkplaceReports: NonNullable<ReturnType<typeof mapSafetyReportToBadWorkplaceReport>>[];
        technicalGuidanceReports: SafetyReport[];
        quarterlyReports: NonNullable<ReturnType<typeof mapSafetyReportToQuarterlySummaryReport>>[];
        site: SafetySite;
      }> = [];

      const workerCount = Math.min(FETCH_CONCURRENCY, pendingSites.length);
      await Promise.all(
        Array.from({ length: workerCount }, async () => {
          while (pendingSites.length > 0) {
            const site = pendingSites.shift();
            if (!site) return;

            const reports = await fetchSafetyReportsBySite(token, site.id);
            siteReports.push({
              badWorkplaceReports: reports
                .map(mapSafetyReportToBadWorkplaceReport)
                .filter(isBadWorkplaceReport),
              technicalGuidanceReports: reports.filter(
                (report) => getStoredReportKind(report) === TECHNICAL_GUIDANCE_REPORT_KIND,
              ),
              quarterlyReports: reports
                .map(mapSafetyReportToQuarterlySummaryReport)
                .filter(isQuarterlyReport),
              site,
            });
          }
        }),
      );

      const nextUrgentSiteRows = siteReports
        .map(({ quarterlyReports, site }): QuarterlyStatusRow | null => {
          const periodText = [site.project_start_date, site.project_end_date]
            .filter(Boolean)
            .join(' ~ ');
          const targets = getQuarterTargetsForConstructionPeriod(periodText);
          if (targets.length === 0) return null;

          const targetQuarterKeys = new Set(targets.map((target) => target.quarterKey));
          const targetQuarterlyReports = quarterlyReports.filter((report) =>
            targetQuarterKeys.has(report.quarterKey),
          );
          const missingLabels = targets
            .filter(
              (target) =>
                !targetQuarterlyReports.some((report) => report.quarterKey === target.quarterKey),
            )
            .map((target) => target.label);

          if (missingLabels.length === 0) {
            return null;
          }

          return {
            detailHref: getControllerSectionHref('headquarters', {
              headquarterId: site.headquarter_id,
              siteId: site.id,
            }),
            headquarterName: site.headquarter_detail?.name ?? site.headquarter?.name ?? null,
            missingCount: missingLabels.length,
            missingLabels,
            siteId: site.id,
            siteName: site.site_name,
          };
        })
        .filter((row): row is QuarterlyStatusRow => Boolean(row))
        .sort(
          (left, right) =>
            right.missingCount - left.missingCount ||
            left.siteName.localeCompare(right.siteName, 'ko'),
        );

      const monthlyBadReportSummaryByUserId = siteReports
        .flatMap((item) => item.badWorkplaceReports)
        .reduce(
          (accumulator, report) => {
            if (report.reportMonth !== currentReportMonth) {
              return accumulator;
            }

            const current = accumulator.get(report.reporterUserId) ?? {
              reportCount: 0,
              siteIds: [] as string[],
            };

            current.reportCount += 1;
            pushUniqueValue(current.siteIds, report.siteId);
            accumulator.set(report.reporterUserId, current);
            return accumulator;
          },
          new Map<string, { reportCount: number; siteIds: string[] }>(),
        );

      const nextPendingAgentRows = activeFieldAgents
        .map((user) => {
          const monthlySummary = monthlyBadReportSummaryByUserId.get(user.id);
          const reportCount = monthlySummary?.reportCount ?? 0;
          const assignedSites = Array.from(assignedSiteIdsByUserId.get(user.id) ?? [])
            .map((siteId) => siteQuickLinkById.get(siteId))
            .filter((site): site is AdminOverviewSiteLink => Boolean(site))
            .sort((left, right) => left.siteName.localeCompare(right.siteName, 'ko'));
          const reportedSites = (monthlySummary?.siteIds ?? [])
            .map((siteId) => siteQuickLinkById.get(siteId))
            .filter((site): site is AdminOverviewSiteLink => Boolean(site))
            .sort((left, right) => left.siteName.localeCompare(right.siteName, 'ko'));

          if (reportCount >= 1) {
            return null;
          }

          return {
            assignedSites,
            reportCount,
            reportedSites,
            userId: user.id,
            userName: user.name,
          };
        })
        .filter((row): row is AdminOverviewPendingAgentRow => Boolean(row))
        .sort((left, right) => left.userName.localeCompare(right.userName, 'ko'));
      const nextReportProgressEntries = buildReportProgressEntriesFromReports(
        siteReports.flatMap((item) => item.technicalGuidanceReports),
      );

      operationalKpiCache = {
        key: cacheKey,
        loadedAt: Date.now(),
        pendingAgentRows: nextPendingAgentRows,
        reportProgressEntries: nextReportProgressEntries,
        urgentSiteRows: nextUrgentSiteRows,
      };
      setAsyncReportProgressEntries(nextReportProgressEntries);
      setUrgentSiteRows(nextUrgentSiteRows);
      setPendingAgentRows(nextPendingAgentRows);
      setHasLoaded(true);
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setIsLoading(false);
    }
  }, [activeFieldAgents, activeSites, cacheKey, currentReportMonth]);

  useEffect(() => {
    if (hasLoaded || isLoading || error) {
      return;
    }

    const timerId = window.setTimeout(() => {
      void loadKpi();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [error, hasLoaded, isLoading, loadKpi]);

  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>ERP 운영 현황</h2>
        </div>
        <div className={styles.sectionHeaderActions}>
          <span className="app-chip">{currentMonthLabel} 기준</span>
          {isLoading ? <span className="app-chip">집계 중</span> : null}
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={() => void loadKpi()}
            disabled={isLoading}
          >
            운영 현황 새로고침
          </button>
        </div>
      </div>

      <div className={`${styles.sectionBody} ${styles.kpiPanelBody}`}>
        {error ? <div className={styles.bannerError}>{error}</div> : null}

        <div className={styles.kpiVisualGrid}>
          <DonutChartCard
            title="현장 배정 커버리지"
            entries={coverageEntries}
          />
          <DonutChartCard
            title="보고서 진행률"
            entries={effectiveReportProgressEntries}
          />
          <MissingSitesBarCard isLoading={isLoading && !hasLoaded} rows={urgentSiteRows} />
        </div>

        <PendingAgentsPanel
          currentMonthLabel={currentMonthLabel}
          isLoading={isLoading && !hasLoaded}
          rows={pendingAgentRows}
        />
      </div>
    </section>
  );
}
