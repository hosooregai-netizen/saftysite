'use client';

import Link from 'next/link';
import { formatCompactDate } from './mobileSiteHomeHelpers';
import styles from '../components/MobileShell.module.css';

interface MobileSiteHomeLatestReportSectionProps {
  latestGuidanceDate: string;
  latestReportHref: string;
  latestReportProgressLabel: string;
  latestReportTitle: string;
}

export function MobileSiteHomeLatestReportSection({
  latestGuidanceDate,
  latestReportHref,
  latestReportProgressLabel,
  latestReportTitle,
}: MobileSiteHomeLatestReportSectionProps) {
  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleWrap}>
          <h2 className={styles.sectionTitle}>기술지도 보고서</h2>
        </div>
      </div>

      {latestReportTitle ? (
        <Link href={latestReportHref} style={{ color: 'inherit', textDecoration: 'none' }}>
          <article className={styles.reportCard} style={{ cursor: 'pointer', padding: '12px' }}>
            <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ alignItems: 'center', display: 'flex', gap: '8px', minWidth: 0 }}>
                <h3
                  className={styles.cardTitle}
                  style={{ fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {latestReportTitle}
                </h3>
              </div>
            </div>

            <div
              style={{
                alignItems: 'center',
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '8px',
              }}
            >
              <div style={{ display: 'flex', gap: '12px' }}>
                <span style={{ color: '#475569', fontSize: '13px' }}>
                  <strong style={{ color: '#0f172a', fontWeight: 600 }}>지도일</strong>{' '}
                  {formatCompactDate(latestGuidanceDate)}
                </span>
              </div>
              <span style={{ color: '#0f172a', fontSize: '13px', fontWeight: 600 }}>
                {latestReportProgressLabel}
              </span>
            </div>
          </article>
        </Link>
      ) : (
        <p className={styles.inlineNotice}>
          아직 이 현장에 작성된 기술지도 보고서가 없습니다. 보고서 목록에서 첫 보고서를 추가해
          주세요.
        </p>
      )}
    </section>
  );
}
