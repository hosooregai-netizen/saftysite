'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useSiteOperationalReports } from '@/hooks/useSiteOperationalReports';
import {
  formatQuarterLabel,
  formatReportMonthLabel,
  getCurrentReportMonth,
  getQuarterKeyForDate,
  getQuarterTargetsForConstructionPeriod,
  normalizeQuarterlyReportPeriod,
} from '@/lib/erpReports/shared';
import type { SafetyUser } from '@/types/backend';
import type { InspectionSite } from '@/types/inspectionSession';
import styles from './OperationalReports.module.css';

interface OperationalReportsPanelProps {
  currentSite: InspectionSite;
  currentUser: SafetyUser | null;
  enabled?: boolean;
  siteReportCount: number;
}

function getOperationalStatusLabel(status?: 'draft' | 'completed') {
  if (status === 'completed') return '완료';
  if (status === 'draft') return '작성 중';
  return '미작성';
}

export default function OperationalReportsPanel({
  currentSite,
  currentUser,
  enabled = true,
  siteReportCount,
}: OperationalReportsPanelProps) {
  const { quarterlyReports, badWorkplaceReports, isLoading, error } =
    useSiteOperationalReports(currentSite, enabled);
  const quarterTargets = useMemo(
    () =>
      getQuarterTargetsForConstructionPeriod(
        currentSite.adminSiteSnapshot.constructionPeriod,
      ),
    [currentSite.adminSiteSnapshot.constructionPeriod],
  );
  const manualQuarterKey = useMemo(() => getQuarterKeyForDate(new Date()), []);
  const quarterlyByKey = useMemo(
    () =>
      new Map(
        quarterlyReports.flatMap((item) => {
          const normalized = normalizeQuarterlyReportPeriod(item);
          return normalized.quarterKey ? [[normalized.quarterKey, item] as const] : [];
        }),
      ),
    [quarterlyReports],
  );
  const currentReportMonth = getCurrentReportMonth();
  const currentMonthReport =
    badWorkplaceReports.find(
      (item) =>
        item.reportMonth === currentReportMonth &&
        item.reporterUserId === currentUser?.id,
    ) || null;
  const recentBadReports = badWorkplaceReports
    .filter((item) => !currentUser || item.reporterUserId === currentUser.id)
    .slice(0, 3);

  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>추가 업무 문서</h2>
        </div>
        <div className={styles.statusRow}>
          <span className="app-chip">기술지도 {siteReportCount}건</span>
          {isLoading ? <span className="app-chip">추가 문서 불러오는 중</span> : null}
        </div>
      </div>

      {!enabled ? (
        <div className={styles.emptyState}>추가 업무 문서를 준비하는 중입니다.</div>
      ) : null}
      {enabled && error ? <div className={styles.bannerError}>{error}</div> : null}

      {enabled ? (
        <div className={styles.cardGrid}>
          <article className={styles.reportCard}>
            <div className={styles.reportCardHeader}>
              <strong className={styles.reportCardTitle}>분기 종합보고서</strong>
              <span className="app-chip">대상 분기 {quarterTargets.length}개</span>
            </div>

            {quarterTargets.length === 0 ? (
              <>
              <div className={styles.emptyState}>
                공사기간 정보가 3개월 미만이거나 기간 정보가 없어 대상 분기를 계산하지 못했습니다.
              </div>
              {manualQuarterKey ? (
                <div className={styles.reportActions}>
                  <Link
                    href={`/sites/${encodeURIComponent(currentSite.id)}/quarterly/${encodeURIComponent(manualQuarterKey)}`}
                    className={styles.linkButton}
                  >
                    보고서 직접 선택
                  </Link>
                </div>
              ) : null}
              </>
            ) : (
              <div className={styles.cardGrid}>
                {quarterTargets.map((target) => {
                  const existing = quarterlyByKey.get(target.quarterKey);
                  const href = `/sites/${encodeURIComponent(currentSite.id)}/quarterly/${encodeURIComponent(target.quarterKey)}`;
                  return (
                    <article key={target.quarterKey} className={styles.reportCard}>
                      <div className={styles.reportCardHeader}>
                        <strong className={styles.reportCardTitle}>
                          {formatQuarterLabel(target)}
                        </strong>
                        <span className="app-chip">
                          {getOperationalStatusLabel(existing?.status)}
                        </span>
                      </div>
                      <p className={styles.reportCardDescription}>
                        대상 기간: {target.startDate} ~ {target.endDate}
                      </p>
                      {existing ? (
                        <p className={styles.reportCardDescription}>
                          현재 초안에 반영된 기준 보고서 {existing.generatedFromSessionIds.length}건
                        </p>
                      ) : null}
                      <div className={styles.reportActions}>
                        <Link href={href} className={styles.linkButton}>
                          {existing ? '기준 보고서 확인 후 이어서 작성' : '대상 보고서 고르고 초안 만들기'}
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </article>

          <article className={styles.reportCard}>
            <div className={styles.reportCardHeader}>
              <strong className={styles.reportCardTitle}>불량사업장 신고</strong>
              <span className="app-chip">{formatReportMonthLabel(currentReportMonth)}</span>
            </div>
            <div className={styles.reportActions}>
              <Link
                href={`/sites/${encodeURIComponent(currentSite.id)}/bad-workplace/${encodeURIComponent(currentReportMonth)}`}
                className={styles.linkButton}
              >
                {currentMonthReport ? '원본 보고서 다시 확인하고 이어서 작성' : '원본 보고서 고르고 초안 만들기'}
              </Link>
            </div>

            {recentBadReports.length > 0 ? (
              <div className={styles.cardGrid}>
                {recentBadReports.map((item) => (
                  <article key={item.id} className={styles.reportCard}>
                    <div className={styles.reportCardHeader}>
                      <strong className={styles.reportCardTitle}>
                        {formatReportMonthLabel(item.reportMonth)}
                      </strong>
                      <span className="app-chip">{getOperationalStatusLabel(item.status)}</span>
                    </div>
                    <p className={styles.reportCardDescription}>
                      원본 지적사항 {item.sourceFindingIds.length}건 / 신고 항목 {item.violations.length}건
                      {item.reporterName ? ` / 작성자 ${item.reporterName}` : ''}
                    </p>
                    <div className={styles.reportActions}>
                      <Link
                        href={`/sites/${encodeURIComponent(currentSite.id)}/bad-workplace/${encodeURIComponent(item.reportMonth)}`}
                        className={`${styles.linkButton} ${styles.linkButtonSecondary}`}
                      >
                        열기
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                아직 등록된 불량사업장 신고서가 없습니다. 원본 기술지도 보고서를 고른 뒤 바로 초안을 만들 수 있습니다.
              </div>
            )}
          </article>
        </div>
      ) : null}
    </section>
  );
}
