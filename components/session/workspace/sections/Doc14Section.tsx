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
    <article className={`${styles.noticeCard} ${styles.doc14ViewerCard}`}>
      {url ? (
        <div className={styles.doc14Viewer}>
          <div className={styles.doc14Caption}>
            {info?.title ? <h3 className={styles.doc14CaptionTitle}>{info.title}</h3> : null}
          </div>
          {isPdf ? (
            <iframe
              title={info?.title || '안전 정보 PDF'}
              src={url}
              className={styles.doc14PdfFrame}
            />
          ) : (
            <img
              src={url}
              alt={info?.title || '안전 정보'}
              className={styles.doc14FullImage}
            />
          )}
        </div>
      ) : (
        <div className={styles.noticeBody}>
          <h3 className={styles.noticeTitle}>{info?.title || '안전 정보'}</h3>
        </div>
      )}
    </article>
  );
}
