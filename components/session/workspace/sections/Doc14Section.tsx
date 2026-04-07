/* eslint-disable @next/next/no-img-element */

import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { SupportSectionProps } from '@/components/session/workspace/types';

function isPdfSource(url: string): boolean {
  const normalized = url.trim().toLowerCase();
  if (normalized.startsWith('data:application/pdf')) return true;
  const pathOnly = normalized.split(/[?#]/)[0] ?? normalized;
  return /\.pdf$/i.test(pathOnly);
}

export default function Doc14Section({
  session,
}: Pick<SupportSectionProps, 'session'>) {
  const info = session.document14SafetyInfos[0];
  const url = info?.imageUrl?.trim() ?? '';
  const isPdf = url ? isPdfSource(url) : false;

  return (
    <article className={`${styles.tableCard} ${styles.doc14SimpleCard}`}>
      <div className={styles.doc14SimpleBody}>
        <strong className={styles.doc14TitleText}>{info?.title || '안전 정보'}</strong>
        {url ? (
          isPdf ? (
            <iframe
              title={info?.title || '안전 정보 PDF'}
              src={url}
              className={styles.doc14PdfFrame}
            />
          ) : (
            <div className={styles.doc14ImageFrame}>
              <img
                src={url}
                alt={info?.title || '안전 정보'}
                className={styles.doc14PreviewImage}
              />
            </div>
          )
        ) : (
          <div className={styles.doc14EmptyState}>표시할 안전 정보가 없습니다.</div>
        )}
      </div>
    </article>
  );
}
