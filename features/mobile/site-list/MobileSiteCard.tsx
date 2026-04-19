'use client';

import Link from 'next/link';
import { buildMobileSiteHomeHref } from '@/features/home/lib/siteEntry';
import type { HomeSiteSummary } from '@/features/home/lib/buildHomeSiteSummaries';
import styles from '@/features/mobile/components/MobileShell.module.css';

const LABEL_NO_RECORD = '\uBBF8\uAE30\uB85D';
const LABEL_COMPLETE = '\uC644\uB8CC';
const LABEL_EDITING = '\uC791\uC131\uC911';
const LABEL_NOT_STARTED = '\uBBF8\uC791\uC131';
const LABEL_SYNCING = '\uB3D9\uAE30\uD654 \uC911';
const LABEL_NEEDS_ATTENTION = '\uD655\uC778 \uD544\uC694';
const LABEL_UNASSIGNED = '\uBBF8\uBC30\uC815';
const LABEL_LATEST_GUIDANCE = '\uCD5C\uADFC \uC9C0\uB3C4';

function formatCompactDate(value: string | null | undefined) {
  if (!value?.trim()) {
    return LABEL_NO_RECORD;
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
    return LABEL_COMPLETE;
  }
  if (progress > 0) {
    return LABEL_EDITING;
  }
  return LABEL_NOT_STARTED;
}

interface MobileSiteCardProps {
  summary: HomeSiteSummary;
}

export function MobileSiteCard({ summary }: MobileSiteCardProps) {
  const hasResolvedReportIndex = summary.reportSyncStatus === 'loaded';
  const unresolvedLabel =
    summary.reportSyncStatus === 'error' ? LABEL_NEEDS_ATTENTION : LABEL_SYNCING;
  const latestGuidanceDate = hasResolvedReportIndex
    ? summary.latestReportVisitDate
    : unresolvedLabel;
  const siteAddress = summary.site.adminSiteSnapshot?.siteAddress;
  const countLabel = hasResolvedReportIndex ? `${summary.reportCount}\uAC74` : unresolvedLabel;
  const progressLabel = hasResolvedReportIndex
    ? getProgressLabel(summary.latestReportProgressRate ?? 0)
    : unresolvedLabel;

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
              {summary.site.assigneeName || LABEL_UNASSIGNED}
            </span>
          </div>
          <span
            className={styles.roundBadge}
            style={{ minWidth: 'auto', height: '24px', minHeight: '24px', padding: '0 8px', fontSize: '12px' }}
          >
            {countLabel}
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
              <strong style={{ fontWeight: 600, color: '#0f172a' }}>{LABEL_LATEST_GUIDANCE}</strong>{' '}
              {formatCompactDate(latestGuidanceDate)}
            </span>
          </div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
            {progressLabel}
          </span>
        </div>
      </article>
    </Link>
  );
}
