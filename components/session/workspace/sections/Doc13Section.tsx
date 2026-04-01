/* eslint-disable @next/next/no-img-element */

import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { SupportSectionProps } from '@/components/session/workspace/types';

export default function Doc13Section({
  session,
}: Pick<SupportSectionProps, 'session'>) {
  const cards = [...session.document13Cases];

  while (cards.length < 4) {
    cards.push({
      id: `placeholder-${cards.length + 1}`,
      title: '자료 없음',
      summary: '표시할 사례 데이터가 아직 없습니다.',
      imageUrl: '',
    });
  }

  return (
    <>
      <p className={styles.fieldAssist}>관리자 콘텐츠의 재해 사례 중 정렬순 상위 4건만 표시됩니다.</p>
      <div className={styles.caseGrid}>
        {cards.slice(0, 4).map((item) => (
          <article key={item.id} className={styles.caseCard}>
            {item.imageUrl ? <img src={item.imageUrl} alt={item.title} className={styles.caseImage} /> : <div className={styles.casePlaceholder}>자료 없음</div>}
            <div className={styles.caseBody}>
              <h3 className={styles.caseTitle}>{item.title}</h3>
              <p className={styles.caseSummary}>{item.summary}</p>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

