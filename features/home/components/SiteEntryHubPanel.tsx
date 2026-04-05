'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import {
  buildSiteBadWorkplaceHref,
  buildSitePhotoAlbumHref,
  buildSiteQuarterlyListHref,
  buildSiteReportsHref,
  buildWorkerCalendarHref,
} from '@/features/home/lib/siteEntry';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { useSiteOperationalReportSummary } from '@/hooks/useSiteOperationalReportSummary';
import {
  createQuarterKey,
  getCurrentReportMonth,
} from '@/lib/erpReports/shared';
import { SiteReportsSummaryBar } from '@/features/site-reports/components/SiteReportsSummaryBar';
import type { InspectionSite } from '@/types/inspectionSession';
import styles from './SiteEntryScreens.module.css';

interface SiteEntryHubPanelProps {
  className?: string;
  currentSite: InspectionSite;
  reportMetaText?: string | null;
}

function TechnicalGuidanceMiniChart({ count }: { count: number }) {
  const bars = Array.from({ length: 6 }, (_, index) => ({
    key: `tech-bar-${index + 1}`,
    height: 24 + index * 10,
    active: count >= index + 1,
  }));

  return (
    <div className={styles.metricVisual} aria-hidden="true">
      <div className={styles.barChart}>
        {bars.map((bar) => (
          <span
            key={bar.key}
            className={`${styles.barChartBar} ${bar.active ? styles.barChartBarActive : ''}`}
            style={{ height: `${bar.height}px` }}
          />
        ))}
      </div>
    </div>
  );
}

function QuarterlyRingChart({
  completedQuarters,
  displayYear,
  isLoading,
}: {
  completedQuarters: number[];
  displayYear: number;
  isLoading?: boolean;
}) {
  const segmentColors = [1, 2, 3, 4].map((quarter) => {
    if (isLoading) return 'var(--erp-line)';
    return completedQuarters.includes(quarter) ? 'var(--entry-accent)' : 'var(--erp-line)';
  });
  const background = `conic-gradient(${segmentColors[0]} 0deg 90deg, ${segmentColors[1]} 90deg 180deg, ${segmentColors[2]} 180deg 270deg, ${segmentColors[3]} 270deg 360deg)`;

  return (
    <div className={styles.metricVisual}>
      <div className={styles.quarterRingWrap}>
        <div
          className={styles.quarterRing}
          style={{ background }}
          role="img"
          aria-label={`${displayYear}년 분기 종합 보고서 작성 현황`}
        >
          <div className={styles.quarterRingCenter}>
            <strong>{isLoading ? '…' : `${completedQuarters.length}/4`}</strong>
            <span>{displayYear}</span>
          </div>
        </div>
        <div className={styles.quarterLabels} aria-hidden="true">
          {[1, 2, 3, 4].map((quarter) => (
            <span
              key={`quarter-${quarter}`}
              className={`${styles.quarterLabel} ${
                !isLoading && completedQuarters.includes(quarter) ? styles.quarterLabelActive : ''
              }`}
            >
              {quarter}Q
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SiteEntryHubPanel({
  className,
  currentSite,
  reportMetaText: _reportMetaText = null,
}: SiteEntryHubPanelProps) {
  void _reportMetaText;

  const { ensureSiteReportIndexLoaded, getReportIndexBySiteId, sessions } =
    useInspectionSessions();
  const { completedQuarterKeys, isLoading: operationalReportsLoading } =
    useSiteOperationalReportSummary(currentSite);

  const snapshot = currentSite.adminSiteSnapshot;
  const siteNameDisplay = currentSite.siteName?.trim() || snapshot.siteName?.trim() || '-';
  const addressDisplay = snapshot.siteAddress?.trim() || '-';
  const periodDisplay = snapshot.constructionPeriod?.trim() || '-';
  const amountDisplay = snapshot.constructionAmount?.trim() || '-';
  const currentReportMonth = getCurrentReportMonth();
  const badWorkplaceHref = buildSiteBadWorkplaceHref(currentSite.id, currentReportMonth);
  const calendarHref = buildWorkerCalendarHref(currentSite.id);
  const photoAlbumHref = buildSitePhotoAlbumHref(currentSite.id);
  const currentYear = new Date().getFullYear();
  const reportIndexState = getReportIndexBySiteId(currentSite.id);

  useEffect(() => {
    void ensureSiteReportIndexLoaded(currentSite.id);
  }, [currentSite.id, ensureSiteReportIndexLoaded]);

  const technicalGuidanceCount = useMemo(() => {
    const remoteItems = reportIndexState?.items ?? [];
    const localSessions = sessions.filter((session) => session.siteKey === currentSite.id);
    return new Set([
      ...remoteItems.map((item) => item.reportKey),
      ...localSessions.map((item) => item.id),
    ]).size;
  }, [currentSite.id, reportIndexState?.items, sessions]);

  const completedQuarters = useMemo(
    () =>
      [1, 2, 3, 4].filter((quarter) =>
        completedQuarterKeys.has(createQuarterKey(currentYear, quarter)),
      ),
    [completedQuarterKeys, currentYear],
  );

  return (
    <div className={className ? `${styles.entryPanel} ${className}` : styles.entryPanel}>
      <SiteReportsSummaryBar
        addressDisplay={addressDisplay}
        amountDisplay={amountDisplay}
        periodDisplay={periodDisplay}
        siteNameDisplay={siteNameDisplay}
      />

      <section className={styles.entryGrid}>
        <article className={styles.entryCard}>
          <div className={styles.entryBody}>
            <h2 className={styles.entryTitle}>기술지도 보고서</h2>
            <p className={styles.entryMetricLead}>작성된 보고서 수</p>
            <div className={styles.entryMetricRow}>
              <div className={styles.entryMetricCopy}>
                <strong className={styles.entryMetricValue}>{technicalGuidanceCount}</strong>
                <span className={styles.entryMetricUnit}>건</span>
              </div>
              <TechnicalGuidanceMiniChart count={technicalGuidanceCount} />
            </div>
          </div>
          <div className={styles.entryActions}>
            <Link
              href={buildSiteReportsHref(currentSite.id)}
              className="app-button app-button-primary"
            >
              보고서 목록 열기
            </Link>
          </div>
        </article>

        <article className={styles.entryCard}>
          <div className={styles.entryBody}>
            <h2 className={styles.entryTitle}>분기 종합 보고서</h2>
            <p className={styles.entryMetricLead}>분기 작성 현황</p>
            <div className={styles.entryMetricRow}>
              <div className={styles.entryMetricCopy}>
                <strong className={styles.entryMetricValue}>
                  {operationalReportsLoading ? '…' : completedQuarters.length}
                </strong>
                <span className={styles.entryMetricUnit}>/ 4분기</span>
              </div>
              <QuarterlyRingChart
                completedQuarters={completedQuarters}
                displayYear={currentYear}
                isLoading={operationalReportsLoading}
              />
            </div>
          </div>
          <div className={styles.entryActions}>
            <Link
              href={buildSiteQuarterlyListHref(currentSite.id)}
              className="app-button app-button-primary"
            >
              분기 종합 보고서 목록
            </Link>
          </div>
        </article>

        <article className={styles.entryCard}>
          <div className={styles.entryBody}>
            <h2 className={styles.entryTitle}>불량사업장 신고</h2>
            <p className={styles.entryMetricLead}>이번 달 신고 진입</p>
            <div className={styles.entryMetricRow}>
              <div className={styles.entryMetricCopy}>
                <strong className={styles.entryMetricValue}>
                  {currentReportMonth.slice(5, 7)}
                </strong>
                <span className={styles.entryMetricUnit}>월</span>
              </div>
              <div className={styles.metricVisual}>
                <div className={styles.badgePanel}>
                  <span className={styles.badgePanelLabel}>신고 문서</span>
                  <strong>{currentReportMonth}</strong>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.entryActions}>
            <Link href={badWorkplaceHref} className="app-button app-button-primary">
              이번 달 신고 작성
            </Link>
          </div>
        </article>

        <article className={styles.entryCard}>
          <div className={styles.entryBody}>
            <h2 className={styles.entryTitle}>내 일정</h2>
            <p className={styles.entryMetricLead}>회차별 허용 구간 안에서 방문 일정을 선택</p>
            <div className={styles.entryMetricRow}>
              <div className={styles.entryMetricCopy}>
                <strong className={styles.entryMetricValue}>15</strong>
                <span className={styles.entryMetricUnit}>일 구간</span>
              </div>
              <div className={styles.metricVisual}>
                <div className={styles.badgePanel}>
                  <span className={styles.badgePanelLabel}>일정 선택</span>
                  <strong>1회차부터 순서대로</strong>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.entryActions}>
            <Link href={calendarHref} className="app-button app-button-primary">
              내 일정 열기
            </Link>
          </div>
        </article>

        <article className={styles.entryCard}>
          <div className={styles.entryBody}>
            <h2 className={styles.entryTitle}>현장 사진첩</h2>
            <p className={styles.entryMetricLead}>원본 보존 업로드와 이전 사진 확인</p>
            <div className={styles.entryMetricRow}>
              <div className={styles.entryMetricCopy}>
                <strong className={styles.entryMetricValue}>PHOTO</strong>
                <span className={styles.entryMetricUnit}>ALBUM</span>
              </div>
              <div className={styles.metricVisual}>
                <div className={styles.badgePanel}>
                  <span className={styles.badgePanelLabel}>업로드</span>
                  <strong>원본 + legacy</strong>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.entryActions}>
            <Link href={photoAlbumHref} className="app-button app-button-primary">
              사진첩 열기
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
