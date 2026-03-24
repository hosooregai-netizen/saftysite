/* eslint-disable @next/next/no-img-element */

import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { SupportSectionProps } from '@/components/session/workspace/types';

export default function Doc14Section({
  session,
}: Pick<SupportSectionProps, 'session'>) {
  const info = session.document14SafetyInfos[0];

  return (
    <article className={styles.noticeCard}>
      {info?.imageUrl ? <img src={info.imageUrl} alt={info.title} className={styles.noticeImage} /> : null}
      <div className={styles.noticeBody}>
        <div className={styles.cardEyebrow}>안전 정보</div>
        <h3 className={styles.noticeTitle}>{info?.title || '안전 정보'}</h3>
        <p className={styles.noticeText}>{info?.body || '표시할 안전 정보가 아직 없습니다.'}</p>
      </div>
    </article>
  );
}
