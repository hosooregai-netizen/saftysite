'use client';

import Link from 'next/link';
import styles from '@/features/mobile/components/MobileShell.module.css';
import type { MobileQuarterlyListRow } from './types';

interface MobileQuarterlyReportCardProps {
  canArchiveReports: boolean;
  row: MobileQuarterlyListRow;
  onDeleteRequest: (reportId: string) => void;
}

export function MobileQuarterlyReportCard({
  canArchiveReports,
  row,
  onDeleteRequest,
}: MobileQuarterlyReportCardProps) {
  return (
    <Link href={row.href} style={{ color: 'inherit', textDecoration: 'none' }}>
      <article className={styles.reportCard} style={{ cursor: 'pointer', padding: '12px' }}>
        <div
          style={{
            alignItems: 'flex-start',
            display: 'flex',
            gap: '10px',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'grid', flex: 1, gap: '4px', minWidth: 0 }}>
            <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 700 }}>
              {row.quarterLabel}
            </span>
            <h2
              className={styles.cardTitle}
              style={{
                fontSize: '15px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {row.reportTitle}
            </h2>
          </div>
          {canArchiveReports ? (
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: '#ef4444',
                cursor: 'pointer',
                flexShrink: 0,
                fontSize: '13px',
                padding: '4px',
              }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onDeleteRequest(row.reportId);
              }}
            >
              삭제
            </button>
          ) : null}
        </div>

        <div style={{ color: '#475569', display: 'grid', fontSize: '13px', gap: '6px' }}>
          <span>
            <strong style={{ color: '#0f172a', fontWeight: 700 }}>기간</strong> {row.periodLabel}
          </span>
        </div>
      </article>
    </Link>
  );
}
