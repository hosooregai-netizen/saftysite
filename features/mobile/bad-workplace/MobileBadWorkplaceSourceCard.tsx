'use client';

import { getSessionTitle } from '@/constants/inspectionSession';
import type { InspectionSession } from '@/types/inspectionSession';
import styles from '@/features/mobile/components/MobileShell.module.css';
import { buildBadWorkplaceSourceSessionMeta } from './mobileBadWorkplaceHelpers';

interface MobileBadWorkplaceSourceCardProps {
  actionDisabled?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  session: InspectionSession;
}

export function MobileBadWorkplaceSourceCard({
  actionDisabled = false,
  actionLabel,
  onAction,
  session,
}: MobileBadWorkplaceSourceCardProps) {
  return (
    <article className={styles.reportCard} style={{ padding: '12px' }}>
      <div style={{ display: 'grid', gap: '10px' }}>
        <div style={{ display: 'grid', gap: '6px' }}>
          <strong className={styles.cardTitle} style={{ fontSize: '15px' }}>
            {getSessionTitle(session)}
          </strong>
          <div
            style={{
              color: '#475569',
              display: 'flex',
              flexWrap: 'wrap',
              fontSize: '13px',
              gap: '10px',
            }}
          >
            {buildBadWorkplaceSourceSessionMeta(session).map((item) => (
              <span key={`${session.id}-${item}`}>{item}</span>
            ))}
          </div>
        </div>
        {actionLabel && onAction ? (
          <button
            type="button"
            className={`app-button ${
              actionDisabled ? 'app-button-primary' : 'app-button-secondary'
            }`}
            disabled={actionDisabled}
            onClick={onAction}
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </article>
  );
}
