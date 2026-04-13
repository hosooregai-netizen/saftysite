'use client';

import Link from 'next/link';
import { getSessionGuidanceDate } from '@/constants/inspectionSession';
import { buildMobileSiteHomeHref } from '@/features/home/lib/siteEntry';
import type { HomeSiteSummary } from '@/features/home/lib/buildHomeSiteSummaries';
import styles from '@/features/mobile/components/MobileShell.module.css';

function formatCompactDate(value: string | null | undefined) {
  if (!value?.trim()) {
    return '미기록';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
  }).format(parsed);
}

function getProgressLabel(progress: number) {
  if (progress >= 100) {
    return '완료';
  }
  if (progress > 0) {
    return '작성중';
  }
  return '미작성';
}

interface MobileSiteCardProps {
  summary: HomeSiteSummary;
}

export function MobileSiteCard({ summary }: MobileSiteCardProps) {
  const latestGuidanceDate = summary.latestSession
    ? getSessionGuidanceDate(summary.latestSession)
    : '';
  const siteAddress = summary.site.adminSiteSnapshot?.siteAddress;

  return (
    <Link
      href={buildMobileSiteHomeHref(summary.site.id)}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <article className={styles.siteCard} style={{ cursor: 'pointer', padding: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <h2
              className={styles.cardTitle}
              style={{
                fontSize: '15px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {summary.site.siteName}
            </h2>
            <span
              style={{
                fontSize: '12px',
                color: '#64748b',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {summary.site.assigneeName || '미배정'}
            </span>
          </div>
          <span
            className={styles.roundBadge}
            style={{ minWidth: 'auto', height: '24px', minHeight: '24px', padding: '0 8px', fontSize: '12px' }}
          >
            {summary.sessionCount}건
          </span>
        </div>

        {siteAddress ? (
          <div
            style={{
              fontSize: '12px',
              color: '#64748b',
              marginTop: '4px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {siteAddress}
          </div>
        ) : null}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '8px',
          }}
        >
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: '#475569' }}>
              <strong style={{ fontWeight: 600, color: '#0f172a' }}>최근 지도</strong>{' '}
              {formatCompactDate(latestGuidanceDate)}
            </span>
          </div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
            {getProgressLabel(summary.latestProgress)}
          </span>
        </div>
      </article>
    </Link>
  );
}
