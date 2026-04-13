'use client';

import Link from 'next/link';
import { buildMobileSessionHref } from '@/features/home/lib/siteEntry';
import type { MobileReportCardModel } from './types';
import styles from '../components/MobileShell.module.css';

interface MobileReportCardProps {
  canArchiveReports: boolean;
  card: MobileReportCardModel;
  onDeleteRequest: (reportKey: string) => void;
}

export function MobileReportCard({
  canArchiveReports,
  card,
  onDeleteRequest,
}: MobileReportCardProps) {
  const { item } = card;

  return (
    <Link href={buildMobileSessionHref(item.reportKey)} style={{ color: 'inherit', textDecoration: 'none' }}>
      <article className={styles.reportCard} style={{ cursor: 'pointer', padding: '12px' }}>
        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ alignItems: 'center', display: 'flex', gap: '8px', minWidth: 0 }}>
            <span
              className={styles.roundBadge}
              style={{ flexShrink: 0, fontSize: '12px', height: '24px', minHeight: '24px', minWidth: 'auto', padding: '0 8px' }}
            >
              {item.visitRound ? `${item.visitRound}차` : '-'}
            </span>
            <h2
              className={styles.cardTitle}
              style={{ fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {item.reportTitle}
            </h2>
          </div>
          {canArchiveReports ? (
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', flexShrink: 0, fontSize: '13px', padding: '4px' }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onDeleteRequest(item.reportKey);
              }}
            >
              삭제
            </button>
          ) : null}
        </div>

        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ color: '#475569', fontSize: '13px' }}>
              <strong style={{ color: '#0f172a', fontWeight: 600 }}>지도일</strong> {card.visitDateLabel}
            </span>
            <span style={{ color: '#475569', fontSize: '13px' }}>
              <strong style={{ color: '#0f172a', fontWeight: 600 }}>작성</strong> {card.drafterDisplay}
            </span>
          </div>
          <span style={{ color: '#0f172a', fontSize: '13px', fontWeight: 600 }}>
            {card.progressLabel}
          </span>
        </div>
      </article>
    </Link>
  );
}
