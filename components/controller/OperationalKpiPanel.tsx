'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchSafetyReportsBySite, readSafetyAuthToken, SafetyApiError } from '@/lib/safetyApi';
import {
  mapSafetyReportToBadWorkplaceReport,
  mapSafetyReportToQuarterlySummaryReport,
} from '@/lib/erpReports/mappers';
import {
  formatReportMonthLabel,
  getCurrentReportMonth,
  getQuarterTargetsForConstructionPeriod,
} from '@/lib/erpReports/shared';
import { isFieldAgentUserRole } from '@/lib/admin';
import type { SafetySite, SafetyUser } from '@/types/backend';

const FETCH_CONCURRENCY = 6;
const KPI_CACHE_TTL_MS = 1000 * 60 * 5;

interface OperationalKpiPanelProps {
  sites: SafetySite[];
  styles: Record<string, string>;
  users: SafetyUser[];
}

interface QuarterlyStatusRow {
  siteId: string;
  siteName: string;
  targetCount: number;
  completedCount: number;
  draftCount: number;
  missingLabels: string[];
}

interface BadWorkplaceStatusRow {
  userId: string;
  userName: string;
  reportCount: number;
  achieved: boolean;
  linkedSites: string[];
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
  if (error instanceof SafetyApiError || error instanceof Error) return error.message;
  return '운영 KPI 데이터를 불러오지 못했습니다.';
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

          const missingLabels = targets
            .filter(
              (target) =>
                !quarterlyReports.some((report) => report.quarterKey === target.quarterKey)
            )
            .map((target) => target.label);

          return {
            siteId: site.id,
            siteName: site.site_name,
            targetCount: targets.length,
            completedCount: quarterlyReports.filter((report) => report.status === 'completed').length,
            draftCount: quarterlyReports.filter((report) => report.status === 'draft').length,
            missingLabels,
          };
        })
        .filter(isQuarterlyStatusRow)
        .sort(
          (left, right) =>
            right.missingLabels.length - left.missingLabels.length ||
            left.siteName.localeCompare(right.siteName, 'ko')
        );

      const siteNameById = new Map(activeSites.map((site) => [site.id, site.site_name]));
      const allBadReports = siteReports.flatMap((item) => item.badWorkplaceReports);
      const monthlyBadReportSummaryByUserId = allBadReports.reduce(
        (accumulator, report) => {
          if (report.reportMonth !== currentReportMonth) {
            return accumulator;
          }

          const current = accumulator.get(report.reporterUserId) ?? {
            linkedSites: [] as string[],
            reportCount: 0,
          };

          current.reportCount += 1;
          pushUniqueValue(
            current.linkedSites,
            siteNameById.get(report.siteId) || report.siteId
          );
          accumulator.set(report.reporterUserId, current);
          return accumulator;
        },
        new Map<string, { reportCount: number; linkedSites: string[] }>()
      );
      const nextBadRows = activeFieldAgents
        .map((user) => {
          const monthlySummary = monthlyBadReportSummaryByUserId.get(user.id);
          const reportCount = monthlySummary?.reportCount ?? 0;

          return {
            userId: user.id,
            userName: user.name,
            reportCount,
            achieved: reportCount >= 1,
            linkedSites: monthlySummary?.linkedSites ?? [],
          };
        })
        .sort(
          (left, right) =>
            Number(left.achieved) - Number(right.achieved) ||
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
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [activeFieldAgents, activeSites, cacheKey, currentReportMonth]);

  const showTables =
    hasLoaded || isLoading || quarterlyRows.length > 0 || badWorkplaceRows.length > 0;

  return (
    <section className={styles.sectionCard} style={{ marginTop: 16 }}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>운영 KPI 확인</h2>
          <p className={styles.sectionDescription}>
            저장된 분기 종합보고서와 불량사업장 신고서를 기준으로 현장과 요원 실적을
            빠르게 확인합니다.
          </p>
        </div>
        <div className={styles.sectionHeaderActions}>
          <span className="app-chip">분기 대상 현장 {quarterlyRows.length}곳</span>
          <span className="app-chip">{currentMonthLabel} KPI</span>
          <span className="app-chip">{hasLoaded ? '최근 집계 표시 중' : '필요 시 조회'}</span>
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={() => void loadKpi()}
            disabled={isLoading}
          >
            {hasLoaded ? 'KPI 새로고침' : 'KPI 불러오기'}
          </button>
        </div>
      </div>

      <div className={styles.sectionBody}>
        {error ? <div className={styles.bannerError}>{error}</div> : null}

        {!showTables ? (
          <div className={styles.empty}>
            현장별 전체 보고서를 한 번에 집계하는 작업이라 첫 화면에서는 자동으로 실행하지 않습니다.
            필요할 때만 KPI를 불러오면 현재 월 실적과 분기 작성 현황을 바로 확인할 수 있습니다.
          </div>
        ) : null}

        {showTables ? (
          <>
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
                    </tr>
                  </thead>
                  <tbody>
                    {quarterlyRows.length > 0 ? (
                      quarterlyRows.map((row) => (
                        <tr key={row.siteId}>
                          <td>
                            <div className={styles.tablePrimary}>{row.siteName}</div>
                          </td>
                          <td>{row.targetCount}</td>
                          <td>{row.completedCount}</td>
                          <td>{row.draftCount}</td>
                          <td>{row.missingLabels.length > 0 ? row.missingLabels.join(', ') : '없음'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className={styles.tableEmpty}>
                          {isLoading
                            ? '분기 KPI를 집계하는 중입니다.'
                            : '분기 대상 현장이 없거나 저장된 분기 보고서가 아직 없습니다.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={styles.tableShell} style={{ marginTop: 16 }}>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>지도요원</th>
                      <th>{currentMonthLabel} 신고 건수</th>
                      <th>목표 충족</th>
                      <th>연결 현장</th>
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
                          <td>{row.achieved ? '충족' : '미충족'}</td>
                          <td>{row.linkedSites.length > 0 ? row.linkedSites.join(', ') : '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className={styles.tableEmpty}>
                          {isLoading
                            ? '불량사업장 신고 실적을 집계하는 중입니다.'
                            : '저장된 불량사업장 신고 실적이 아직 없습니다.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
