'use client';

import Link from 'next/link';
import styles from '@/components/webhard/WebhardShared.module.css';
import { buildShareUrl } from '@/lib/webhard/drivePreview';
import type { DriveShareViewModel } from '@/lib/webhard/driveTypes';

export function DriveSharePanel({
  onRevokeShare,
  shares,
}: {
  onRevokeShare: (shareId: string) => void;
  shares: DriveShareViewModel[];
}) {
  if (shares.length === 0) return null;

  return (
    <div className={styles.shareList}>
      {shares.map((share) => {
        if (!share.token) return null;
        return (
          <article key={share.id} className={styles.shareItem}>
            <strong>{buildShareUrl(share.token)}</strong>
            <span className={styles.muted}>
              {(share.visibility || 'anyone_with_link')} · {(share.role || 'viewer')}
            </span>
            <div className={styles.detailActions}>
              <Link href={buildShareUrl(share.token)} className="erp-button erp-button-secondary" target="_blank">
                열기
              </Link>
              <button type="button" className="erp-button erp-button-text" onClick={() => onRevokeShare(share.id)}>
                링크 폐기
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
