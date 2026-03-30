'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useSiteOperationalReports } from '@/hooks/useSiteOperationalReports';
import {
  formatQuarterLabel,
  formatReportMonthLabel,
  getCurrentReportMonth,
  getQuarterTargetsForConstructionPeriod,
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
  const {
    quarterlyReports,
    badWorkplaceReports,
    isLoading,
    error,
  } = useSiteOperationalReports(currentSite, enabled);
  const quarterTargets = useMemo(
    () =>
      getQuarterTargetsForConstructionPeriod(
        currentSite.adminSiteSnapshot.constructionPeriod
      ),
    [currentSite.adminSiteSnapshot.constructionPeriod]
  );
  const quarterlyByKey = useMemo(
    () =>
      new Map(quarterlyReports.map((item) => [item.quarterKey, item])),
    [quarterlyReports]
  );
  const currentReportMonth = getCurrentReportMonth();
  const currentMonthReport =
    badWorkplaceReports.find(
      (item) =>
        item.reportMonth === currentReportMonth &&
        item.reporterUserId === currentUser?.id
    ) || null;
  const recentBadReports = badWorkplaceReports
    .filter((item) => !currentUser || item.reporterUserId === currentUser.id)
    .slice(0, 3);

  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>추가 업무 문서</h2>
          <p className={styles.sectionDescription}>
            기술지도 보고서를 바탕으로 분기 종합보고서와 불량사업장 신고서를 이어서 작성할 수 있습니다.
          </p>
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
            <p className={styles.reportCardDescription}>
              공사기간이 3개월 이상인 현장은 자동으로 대상 분기가 계산되고, 분기별 기술지도 내용을
              이어받아 초안을 만들 수 있습니다.
            </p>

            {quarterTargets.length === 0 ? (
              <div className={styles.emptyState}>
                공사기간 정보가 3개월 미만이거나 기간 정보가 없어 자동 대상 분기를 계산하지 못했습니다.
              </div>
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
                      <div className={styles.reportActions}>
                        <Link href={href} className={styles.linkButton}>
                          {existing ? '이어서 작성' : '초안 만들기'}
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
            <p className={styles.reportCardDescription}>
              최근 기술지도 보고서의 지적사항을 불러와 신고서 초안을 만들고, 필요하면 바로 수정할 수 있습니다.
            </p>
            <div className={styles.reportActions}>
              <Link
                href={`/sites/${encodeURIComponent(currentSite.id)}/bad-workplace/${encodeURIComponent(currentReportMonth)}`}
                className={styles.linkButton}
              >
                {currentMonthReport ? '이번 달 신고서 이어서 작성' : '이번 달 신고서 작성'}
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
                      <span className="app-chip">
                        {getOperationalStatusLabel(item.status)}
                      </span>
                    </div>
                    <p className={styles.reportCardDescription}>
                      신고 항목 {item.violations.length}건
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
                아직 등록된 불량사업장 신고서가 없습니다. 최근 기술지도 보고서에서 지적사항을 선택해 바로 초안을
                만들 수 있습니다.
              </div>
            )}
          </article>
        </div>
      ) : null}
    </section>
  );
}
