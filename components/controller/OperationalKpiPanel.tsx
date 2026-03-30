'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SafetyApiError, fetchSafetyReportsBySite, readSafetyAuthToken } from '@/lib/safetyApi';
import { getControllerSectionHref, isFieldAgentUserRole } from '@/lib/admin/adminShared';
import {
  mapSafetyReportToBadWorkplaceReport,
  mapSafetyReportToQuarterlySummaryReport,
} from '@/lib/erpReports/mappers';
import {
  formatReportMonthLabel,
  getCurrentReportMonth,
  getQuarterTargetsForConstructionPeriod,
} from '@/lib/erpReports/shared';
import type { SafetySite, SafetyUser } from '@/types/backend';

const FETCH_CONCURRENCY = 6;
const KPI_CACHE_TTL_MS = 1000 * 60 * 5;

interface OperationalKpiPanelProps {
  sites: SafetySite[];
  styles: Record<string, string>;
  users: SafetyUser[];
}

interface SiteQuickLink {
  siteId: string;
  siteName: string;
  headquarterName: string | null;
  href: string;
}

interface QuarterlyStatusRow {
  siteId: string;
  siteName: string;
  headquarterName: string | null;
  targetCount: number;
  completedCount: number;
  draftCount: number;
  missingLabels: string[];
  detailHref: string;
}

interface BadWorkplaceStatusRow {
  userId: string;
  userName: string;
  reportCount: number;
  achieved: boolean;
  assignedSites: SiteQuickLink[];
  reportedSites: SiteQuickLink[];
}

interface OperationalKpiCacheEntry {
  key: string;
  loadedAt: number;
  quarterlyRows: QuarterlyStatusRow[];
  badWorkplaceRows: BadWorkplaceStatusRow[];
}

let operationalKpiCache: OperationalKpiCacheEntry | null = null;

function isQuarterlyStatusRow(
  value: QuarterlyStatusRow | null
): value is QuarterlyStatusRow {
  return Boolean(value);
}

function isQuarterlyReport(
  value: ReturnType<typeof mapSafetyReportToQuarterlySummaryReport>
): value is NonNullable<ReturnType<typeof mapSafetyReportToQuarterlySummaryReport>> {
  return Boolean(value);
}

function isBadWorkplaceReport(
  value: ReturnType<typeof mapSafetyReportToBadWorkplaceReport>
): value is NonNullable<ReturnType<typeof mapSafetyReportToBadWorkplaceReport>> {
  return Boolean(value);
}

function pushUniqueValue(values: string[], value: string) {
  if (!values.includes(value)) {
    values.push(value);
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof SafetyApiError || error instanceof Error) {
    return error.message;
  }

  return '운영 현황 데이터를 불러오지 못했습니다.';
}

function buildKpiCacheKey(
  sites: SafetySite[],
  users: SafetyUser[],
  reportMonth: string
) {
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

function buildSiteQuickLink(site: SafetySite): SiteQuickLink {
  return {
    siteId: site.id,
    siteName: site.site_name,
    headquarterName:
      site.headquarter_detail?.name ??
      site.headquarter?.name ??
      null,
    href: getControllerSectionHref('headquarters', {
      headquarterId: site.headquarter_id,
      siteId: site.id,
    }),
  };
}

function renderSiteLinks(
  siteLinks: SiteQuickLink[],
  styles: Record<string, string>,
  emptyLabel = '-'
) {
  if (siteLinks.length === 0) {
    return emptyLabel;
  }

  const visibleLinks = siteLinks.slice(0, 3);
  const remainingCount = siteLinks.length - visibleLinks.length;

  return (
    <div className={styles.tableInlineLinks}>
      {visibleLinks.map((site) => (
        <Link key={site.siteId} href={site.href} className={styles.tableChipLink}>
          {site.siteName}
        </Link>
      ))}
      {remainingCount > 0 ? (
        <span className="app-chip">외 {remainingCount}개</span>
      ) : null}
    </div>
  );
}

export default function OperationalKpiPanel({
  sites,
  styles,
  users,
}: OperationalKpiPanelProps) {
  const [quarterlyRows, setQuarterlyRows] = useState<QuarterlyStatusRow[]>([]);
  const [badWorkplaceRows, setBadWorkplaceRows] = useState<BadWorkplaceStatusRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeSites = useMemo(
    () => sites.filter((site) => site.status === 'active'),
    [sites]
  );
  const activeFieldAgents = useMemo(
    () => users.filter((user) => user.is_active && isFieldAgentUserRole(user.role)),
    [users]
  );
  const currentReportMonth = getCurrentReportMonth();
  const currentMonthLabel = formatReportMonthLabel(currentReportMonth);
  const cacheKey = useMemo(
    () => buildKpiCacheKey(activeSites, activeFieldAgents, currentReportMonth),
    [activeFieldAgents, activeSites, currentReportMonth]
  );

  useEffect(() => {
    if (
      operationalKpiCache &&
      operationalKpiCache.key === cacheKey &&
      Date.now() - operationalKpiCache.loadedAt < KPI_CACHE_TTL_MS
    ) {
      setQuarterlyRows(operationalKpiCache.quarterlyRows);
      setBadWorkplaceRows(operationalKpiCache.badWorkplaceRows);
      setHasLoaded(true);
      return;
    }

    setQuarterlyRows([]);
    setBadWorkplaceRows([]);
    setHasLoaded(false);
  }, [cacheKey]);

  const loadKpi = useCallback(async () => {
    const token = readSafetyAuthToken();
    if (!token || activeSites.length === 0) {
      setQuarterlyRows([]);
      setBadWorkplaceRows([]);
      setHasLoaded(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const pendingSites = [...activeSites];
      const siteQuickLinkById = new Map(activeSites.map((site) => [site.id, buildSiteQuickLink(site)]));
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
        site: SafetySite;
        quarterlyReports: NonNullable<ReturnType<typeof mapSafetyReportToQuarterlySummaryReport>>[];
        badWorkplaceReports: NonNullable<ReturnType<typeof mapSafetyReportToBadWorkplaceReport>>[];
      }> = [];

      const workerCount = Math.min(FETCH_CONCURRENCY, pendingSites.length);
      await Promise.all(
        Array.from({ length: workerCount }, async () => {
          while (pendingSites.length > 0) {
            const site = pendingSites.shift();
            if (!site) return;

            const reports = await fetchSafetyReportsBySite(token, site.id);
            siteReports.push({
              site,
              quarterlyReports: reports
                .map(mapSafetyReportToQuarterlySummaryReport)
                .filter(isQuarterlyReport),
              badWorkplaceReports: reports
                .map(mapSafetyReportToBadWorkplaceReport)
                .filter(isBadWorkplaceReport),
            });
          }
        })
      );

      const nextQuarterlyRows = siteReports
        .map(({ site, quarterlyReports }) => {
          const periodText = [site.project_start_date, site.project_end_date]
            .filter(Boolean)
            .join(' ~ ');
          const targets = getQuarterTargetsForConstructionPeriod(periodText);
          if (targets.length === 0) return null;

          const targetQuarterKeys = new Set(targets.map((target) => target.quarterKey));
          const targetQuarterlyReports = quarterlyReports.filter((report) =>
            targetQuarterKeys.has(report.quarterKey)
          );
          const missingLabels = targets
            .filter(
              (target) =>
                !targetQuarterlyReports.some((report) => report.quarterKey === target.quarterKey)
            )
            .map((target) => target.label);

          return {
            siteId: site.id,
            siteName: site.site_name,
            headquarterName:
              site.headquarter_detail?.name ??
              site.headquarter?.name ??
              null,
            targetCount: targets.length,
            completedCount: targetQuarterlyReports.filter((report) => report.status === 'completed')
              .length,
            draftCount: targetQuarterlyReports.filter((report) => report.status === 'draft').length,
            missingLabels,
            detailHref: getControllerSectionHref('headquarters', {
              headquarterId: site.headquarter_id,
              siteId: site.id,
            }),
          };
        })
        .filter(isQuarterlyStatusRow)
        .sort(
          (left, right) =>
            right.missingLabels.length - left.missingLabels.length ||
            right.draftCount - left.draftCount ||
            left.siteName.localeCompare(right.siteName, 'ko')
        );

      const allBadReports = siteReports.flatMap((item) => item.badWorkplaceReports);
      const monthlyBadReportSummaryByUserId = allBadReports.reduce(
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
        new Map<string, { reportCount: number; siteIds: string[] }>()
      );

      const nextBadRows = activeFieldAgents
        .map((user) => {
          const monthlySummary = monthlyBadReportSummaryByUserId.get(user.id);
          const reportCount = monthlySummary?.reportCount ?? 0;
          const assignedSites = Array.from(assignedSiteIdsByUserId.get(user.id) ?? [])
            .map((siteId) => siteQuickLinkById.get(siteId))
            .filter((site): site is SiteQuickLink => Boolean(site))
            .sort((left, right) => left.siteName.localeCompare(right.siteName, 'ko'));
          const reportedSites = (monthlySummary?.siteIds ?? [])
            .map((siteId) => siteQuickLinkById.get(siteId))
            .filter((site): site is SiteQuickLink => Boolean(site))
            .sort((left, right) => left.siteName.localeCompare(right.siteName, 'ko'));

          return {
            userId: user.id,
            userName: user.name,
            reportCount,
            achieved: reportCount >= 1,
            assignedSites,
            reportedSites,
          };
        })
        .sort(
          (left, right) =>
            Number(left.achieved) - Number(right.achieved) ||
            left.reportCount - right.reportCount ||
            left.userName.localeCompare(right.userName, 'ko')
        );

      operationalKpiCache = {
        key: cacheKey,
        loadedAt: Date.now(),
        quarterlyRows: nextQuarterlyRows,
        badWorkplaceRows: nextBadRows,
      };
      setQuarterlyRows(nextQuarterlyRows);
      setBadWorkplaceRows(nextBadRows);
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

  const quarterlyMissingSiteCount = useMemo(
    () => quarterlyRows.filter((row) => row.missingLabels.length > 0).length,
    [quarterlyRows]
  );
  const quarterlyMissingQuarterCount = useMemo(
    () => quarterlyRows.reduce((total, row) => total + row.missingLabels.length, 0),
    [quarterlyRows]
  );
  const completedQuarterlySiteCount = useMemo(
    () =>
      quarterlyRows.filter(
        (row) => row.targetCount > 0 && row.completedCount === row.targetCount
      ).length,
    [quarterlyRows]
  );
  const badWorkplaceAchievedCount = useMemo(
    () => badWorkplaceRows.filter((row) => row.achieved).length,
    [badWorkplaceRows]
  );
  const badWorkplacePendingRows = useMemo(
    () => badWorkplaceRows.filter((row) => !row.achieved),
    [badWorkplaceRows]
  );
  const quarterlyUrgentRows = useMemo(
    () => quarterlyRows.filter((row) => row.missingLabels.length > 0).slice(0, 3),
    [quarterlyRows]
  );
  const badWorkplaceUrgentRows = useMemo(
    () => badWorkplacePendingRows.slice(0, 3),
    [badWorkplacePendingRows]
  );
  const showContent =
    hasLoaded || isLoading || quarterlyRows.length > 0 || badWorkplaceRows.length > 0;

  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>ERP 운영 현황</h2>
          <p className={styles.hint}>
            현장별 분기 보고서 진행 상태와 지도요원별 이번 달 불량사업장 신고 실적을
            빠르게 확인할 수 있습니다.
          </p>
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
            {hasLoaded ? '운영 현황 새로고침' : '운영 현황 불러오기'}
          </button>
        </div>
      </div>

      <div className={styles.sectionBody}>
        {error ? <div className={styles.bannerError}>{error}</div> : null}

        {!showContent ? (
          <div className={styles.empty}>
            운영 현황을 준비하고 있습니다. 첫 집계는 현장별 보고서를 순차적으로 확인하므로
            잠시 시간이 걸릴 수 있습니다.
          </div>
        ) : (
          <div className={styles.contentStack}>
            <div className={styles.kpiSummaryGrid}>
              <article className={styles.kpiSummaryCard}>
                <p className={styles.kpiSummaryLabel}>분기 대상 현장</p>
                <p className={styles.kpiSummaryValue}>{quarterlyRows.length}</p>
                <p className={styles.kpiSummaryMeta}>
                  완료 {completedQuarterlySiteCount}개 / 미작성 현장 {quarterlyMissingSiteCount}개
                </p>
              </article>

              <article className={styles.kpiSummaryCard}>
                <p className={styles.kpiSummaryLabel}>미작성 분기</p>
                <p className={styles.kpiSummaryValue}>{quarterlyMissingQuarterCount}</p>
                <p className={styles.kpiSummaryMeta}>
                  미작성 분기가 있는 현장 {quarterlyMissingSiteCount}개
                </p>
              </article>

              <article className={styles.kpiSummaryCard}>
                <p className={styles.kpiSummaryLabel}>불량사업장 신고 달성</p>
                <p className={styles.kpiSummaryValue}>
                  {badWorkplaceAchievedCount}/{activeFieldAgents.length}
                </p>
                <p className={styles.kpiSummaryMeta}>
                  이번 달 신고 기준을 채운 지도요원 수
                </p>
              </article>

              <article className={styles.kpiSummaryCard}>
                <p className={styles.kpiSummaryLabel}>즉시 확인 필요</p>
                <p className={styles.kpiSummaryValue}>
                  {quarterlyMissingSiteCount + badWorkplacePendingRows.length}
                </p>
                <p className={styles.kpiSummaryMeta}>
                  분기 미작성 현장과 신고 미달 요원을 함께 집계
                </p>
              </article>
            </div>

            <div className={styles.kpiHighlightGrid}>
              <article className={styles.recordCard}>
                <div className={styles.recordTop}>
                  <strong className={styles.recordTitle}>분기 점검 우선 현장</strong>
                  <button
                    type="button"
                    className="app-button app-button-secondary"
                    onClick={() => void loadKpi()}
                    disabled={isLoading}
                  >
                    다시 집계
                  </button>
                </div>
                {quarterlyUrgentRows.length > 0 ? (
                  <div className={styles.kpiQuickList}>
                    {quarterlyUrgentRows.map((row) => (
                      <div key={row.siteId} className={styles.kpiQuickItem}>
                        <div className={styles.kpiQuickMeta}>
                          <strong className={styles.kpiQuickTitle}>{row.siteName}</strong>
                          <p className={styles.kpiQuickText}>
                            {row.headquarterName ? `${row.headquarterName} · ` : ''}
                            미작성 {row.missingLabels.length}개
                            {row.missingLabels.length > 0
                              ? ` (${row.missingLabels.join(', ')})`
                              : ''}
                          </p>
                        </div>
                        <Link href={row.detailHref} className="app-button app-button-secondary">
                          보고서 목록
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.empty}>
                    현재 확인이 급한 분기 누락 현장이 없습니다.
                  </div>
                )}
              </article>

              <article className={styles.recordCard}>
                <div className={styles.recordTop}>
                  <strong className={styles.recordTitle}>{currentMonthLabel} 신고 미달 요원</strong>
                  <Link
                    href={getControllerSectionHref('users')}
                    className="app-button app-button-secondary"
                  >
                    사용자 관리
                  </Link>
                </div>
                {badWorkplaceUrgentRows.length > 0 ? (
                  <div className={styles.kpiQuickList}>
                    {badWorkplaceUrgentRows.map((row) => (
                      <div key={row.userId} className={styles.kpiQuickItem}>
                        <div className={styles.kpiQuickMeta}>
                          <strong className={styles.kpiQuickTitle}>{row.userName}</strong>
                          <p className={styles.kpiQuickText}>
                            이번 달 신고 {row.reportCount}건 · 담당 현장 {row.assignedSites.length}개
                          </p>
                          {row.assignedSites.length > 0 ? (
                            <div className={styles.tableInlineLinks}>
                              {row.assignedSites.slice(0, 2).map((site) => (
                                <Link
                                  key={`${row.userId}-${site.siteId}`}
                                  href={site.href}
                                  className={styles.tableChipLink}
                                >
                                  {site.siteName}
                                </Link>
                              ))}
                              {row.assignedSites.length > 2 ? (
                                <span className="app-chip">
                                  외 {row.assignedSites.length - 2}개
                                </span>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.empty}>
                    이번 달 신고 실적이 기준에 미달한 지도요원이 없습니다.
                  </div>
                )}
              </article>
            </div>

            <div className={styles.kpiTableStack}>
              <div>
                <div className={styles.kpiTableHeader}>
                  <div>
                    <h3 className={styles.kpiTableTitle}>현장별 분기 작성 현황</h3>
                    <p className={styles.kpiTableDescription}>
                      공사기간 기준으로 분기 대상이 계산된 현장만 표시합니다.
                    </p>
                  </div>
                </div>
                <div className={styles.tableShell}>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>현장</th>
                          <th>대상 분기</th>
                          <th>완료</th>
                          <th>작성 중</th>
                          <th>미작성 분기</th>
                          <th>바로가기</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quarterlyRows.length > 0 ? (
                          quarterlyRows.map((row) => (
                            <tr key={row.siteId}>
                              <td>
                                <div className={styles.tablePrimary}>{row.siteName}</div>
                                <div className={styles.tableSecondary}>
                                  {row.headquarterName ?? '본사 정보 없음'}
                                </div>
                              </td>
                              <td>{row.targetCount}</td>
                              <td>{row.completedCount}</td>
                              <td>{row.draftCount}</td>
                              <td>
                                {row.missingLabels.length > 0
                                  ? row.missingLabels.join(', ')
                                  : '없음'}
                              </td>
                              <td>
                                <div className={styles.tableActions}>
                                  <Link
                                    href={row.detailHref}
                                    className="app-button app-button-secondary"
                                  >
                                    이동
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className={styles.tableEmpty}>
                              {isLoading
                                ? '분기 현황을 집계하는 중입니다.'
                                : '분기 대상 현장 또는 분기 보고서 데이터가 없습니다.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div>
                <div className={styles.kpiTableHeader}>
                  <div>
                    <h3 className={styles.kpiTableTitle}>지도요원별 불량사업장 신고 실적</h3>
                    <p className={styles.kpiTableDescription}>
                      {currentMonthLabel} 기준 신고 작성 건수와 관련 현장을 함께 확인합니다.
                    </p>
                  </div>
                </div>
                <div className={styles.tableShell}>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>지도요원</th>
                          <th>이번 달 신고</th>
                          <th>달성 상태</th>
                          <th>신고한 현장</th>
                          <th>담당 현장</th>
                        </tr>
                      </thead>
                      <tbody>
                        {badWorkplaceRows.length > 0 ? (
                          badWorkplaceRows.map((row) => (
                            <tr key={row.userId}>
                              <td>
                                <div className={styles.tablePrimary}>{row.userName}</div>
                              </td>
                              <td>{row.reportCount}</td>
                              <td>{row.achieved ? '달성' : '미달'}</td>
                              <td>{renderSiteLinks(row.reportedSites, styles, '-')}</td>
                              <td>{renderSiteLinks(row.assignedSites, styles, '-')}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className={styles.tableEmpty}>
                              {isLoading
                                ? '불량사업장 신고 실적을 집계하는 중입니다.'
                                : '이번 달 불량사업장 신고 실적 데이터가 없습니다.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
