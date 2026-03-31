'use client';

import Link from 'next/link';
import {
  buildSiteBadWorkplaceHref,
  buildSiteQuarterlyListHref,
  buildSiteReportsHref,
  type WorkerSitePickerIntent,
} from '@/features/home/lib/siteEntry';
import { SiteReportsSummaryBar } from '@/features/site-reports/components/SiteReportsSummaryBar';
import { getCurrentReportMonth } from '@/lib/erpReports/shared';
import type { InspectionSite } from '@/types/inspectionSession';
import styles from './SiteEntryScreens.module.css';

interface SiteEntryHubPanelProps {
  className?: string;
  currentSite: InspectionSite;
  reportMetaText?: string | null;
  selectedEntryIntent?: WorkerSitePickerIntent | null;
}

export function SiteEntryHubPanel({
  className,
  currentSite,
  reportMetaText: _reportMetaText = null,
  selectedEntryIntent = null,
}: SiteEntryHubPanelProps) {
  void _reportMetaText;

  const snapshot = currentSite.adminSiteSnapshot;
  const siteNameDisplay = currentSite.siteName?.trim() || snapshot.siteName?.trim() || '-';
  const addressDisplay = snapshot.siteAddress?.trim() || '-';
  const periodDisplay = snapshot.constructionPeriod?.trim() || '-';
  const amountDisplay = snapshot.constructionAmount?.trim() || '-';
  const badWorkplaceHref = buildSiteBadWorkplaceHref(currentSite.id, getCurrentReportMonth());

  return (
    <div className={className ? `${styles.entryPanel} ${className}` : styles.entryPanel}>
      <SiteReportsSummaryBar
        addressDisplay={addressDisplay}
        amountDisplay={amountDisplay}
        periodDisplay={periodDisplay}
        siteNameDisplay={siteNameDisplay}
      />

      <section className={styles.entryGrid}>
        <article
          className={`${styles.entryCard} ${
            !selectedEntryIntent ? styles.entryCardActive : ''
          }`}
        >
          <div className={styles.entryBody}>
            <h2 className={styles.entryTitle}>기술지도 보고서</h2>
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

        <article
          className={`${styles.entryCard} ${
            selectedEntryIntent === 'quarterly' ? styles.entryCardActive : ''
          }`}
        >
          <div className={styles.entryBody}>
            <h2 className={styles.entryTitle}>분기 종합 보고서</h2>
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

        <article
          className={`${styles.entryCard} ${
            selectedEntryIntent === 'bad-workplace' ? styles.entryCardActive : ''
          }`}
        >
          <div className={styles.entryBody}>
            <h2 className={styles.entryTitle}>불량사업장 신고</h2>
          </div>
          <div className={styles.entryActions}>
            <Link href={badWorkplaceHref} className="app-button app-button-primary">
              이번 달 신고 작성
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
