'use client';

import Link from 'next/link';
import {
  buildSiteBadWorkplaceHref,
  buildSiteQuarterlyListHref,
  buildSiteReportsHref,
  getWorkerSiteEntryTitle,
  type WorkerSitePickerIntent,
} from '@/features/home/lib/siteEntry';
import { SiteReportsSummaryBar } from '@/features/site-reports/components/SiteReportsSummaryBar';
import { getCurrentReportMonth } from '@/lib/erpReports/shared';
import type { InspectionSite, ReportIndexStatus } from '@/types/inspectionSession';
import styles from './SiteEntryScreens.module.css';

interface SiteEntryHubPanelProps {
  className?: string;
  currentSite: InspectionSite;
  reportCount?: number;
  reportIndexStatus?: ReportIndexStatus | null;
  reportMetaText?: string | null;
  selectedEntryIntent?: WorkerSitePickerIntent | null;
}

function getReportSummaryText({
  reportCount = 0,
  reportIndexStatus,
  reportMetaText,
}: Pick<SiteEntryHubPanelProps, 'reportCount' | 'reportIndexStatus' | 'reportMetaText'>) {
  if (reportMetaText) {
    return reportMetaText;
  }

  if (reportIndexStatus === 'loading') {
    return '보고서 목록을 불러오고 있습니다.';
  }

  if (reportIndexStatus === 'loaded') {
    return reportCount > 0
      ? `등록된 기술지도 보고서 ${reportCount}건`
      : '아직 등록된 기술지도 보고서가 없습니다.';
  }

  return '기술지도 보고서 목록과 추가 업무 문서로 이동할 수 있습니다.';
}

export function SiteEntryHubPanel({
  className,
  currentSite,
  reportCount = 0,
  reportIndexStatus = null,
  reportMetaText = null,
  selectedEntryIntent = null,
}: SiteEntryHubPanelProps) {
  const snapshot = currentSite.adminSiteSnapshot;
  const siteNameDisplay = currentSite.siteName?.trim() || snapshot.siteName?.trim() || '-';
  const addressDisplay = snapshot.siteAddress?.trim() || '-';
  const periodDisplay = snapshot.constructionPeriod?.trim() || '-';
  const amountDisplay = snapshot.constructionAmount?.trim() || '-';
  const badWorkplaceHref = buildSiteBadWorkplaceHref(currentSite.id, getCurrentReportMonth());
  const reportSummaryText = getReportSummaryText({
    reportCount,
    reportIndexStatus,
    reportMetaText,
  });

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
            <p className={styles.entryDescription}>
              이 현장의 기술지도 보고서 목록을 확인하고 새 보고서를 작성합니다.
            </p>
            <p className={styles.entryMeta}>{reportSummaryText}</p>
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
            <p className={styles.entryDescription}>
              공사기간을 기준으로 대상 분기를 고른 뒤 기술지도 보고서를 묶어 분기 종합보고서를 작성합니다.
            </p>
            <p className={styles.entryMeta}>
              {selectedEntryIntent === 'quarterly'
                ? `${getWorkerSiteEntryTitle('quarterly')} 업무로 바로 이어집니다.`
                : '대상 분기 목록을 확인하고 분기 종합보고서 작업으로 이동합니다.'}
            </p>
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
            <p className={styles.entryDescription}>
              최근 기술지도 보고서의 지적사항을 바탕으로 이번 달 신고 초안을 작성합니다.
            </p>
            <p className={styles.entryMeta}>
              기술지도 보고서를 먼저 확인한 뒤 필요한 지적사항을 이어서 가져올 수 있습니다.
            </p>
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
