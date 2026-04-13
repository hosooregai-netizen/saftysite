'use client';

import Link from 'next/link';
import styles from './SiteEntryScreens.module.css';
import { QuarterlyRingChart, TechnicalGuidanceMiniChart } from './siteEntryHubMetrics';

interface SiteEntryHubCardsProps {
  badWorkplaceHref: string;
  calendarHref: string;
  completedQuarters: number[];
  currentReportMonth: string;
  currentYear: number;
  operationalReportsLoading: boolean;
  photoAlbumHref: string;
  reportsHref: string;
  quarterlyHref: string;
  technicalGuidanceCount: number;
}

export function SiteEntryHubCards({
  badWorkplaceHref,
  calendarHref,
  completedQuarters,
  currentReportMonth,
  currentYear,
  operationalReportsLoading,
  photoAlbumHref,
  quarterlyHref,
  reportsHref,
  technicalGuidanceCount,
}: SiteEntryHubCardsProps) {
  return (
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
          <Link href={reportsHref} className="app-button app-button-primary">
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
          <Link href={quarterlyHref} className="app-button app-button-primary">
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
              <strong className={styles.entryMetricValue}>{currentReportMonth.slice(5, 7)}</strong>
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
  );
}
