/* eslint-disable @next/next/no-img-element */

import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { SupportSectionProps } from '@/components/session/workspace/types';

export default function Doc13Section({
  session,
}: Pick<SupportSectionProps, 'session'>) {
  const cases = [...session.document13Cases];

  while (cases.length < 4) {
    cases.push({
      id: `placeholder-${cases.length + 1}`,
      title: '자료 없음',
      summary: '표시할 사례 데이터가 아직 없습니다.',
      imageUrl: '',
    });
  }

  return (
    <>
      <p className={styles.fieldAssist}>관리자 콘텐츠의 재해 사례 중 정렬순 상위 4건만 표시됩니다.</p>
      <div className={`${styles.tableCard} ${styles.doc13TableWrap}`}>
        <table className={styles.doc13Table}>
          <tbody>
            <tr>
              {cases.slice(0, 4).map((item) => (
                <td key={`${item.id}-image`} className={styles.doc13ImageCell}>
                  {item.imageUrl ? (
                    <div className={styles.doc13ImageFrame}>
                      <img src={item.imageUrl} alt={item.title} className={styles.doc13Image} />
                    </div>
                  ) : (
                    <div className={styles.doc13ImagePlaceholder}>자료 없음</div>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              {cases.slice(0, 4).map((item) => (
                <td key={`${item.id}-title`} className={styles.doc13TitleCell}>
                  <strong className={styles.doc13CaseTitle}>{item.title}</strong>
                </td>
              ))}
            </tr>
            <tr>
              {cases.slice(0, 4).map((item) => (
                <td key={`${item.id}-summary`} className={styles.doc13SummaryCell}>
                  <p className={styles.doc13CaseSummary}>{item.summary}</p>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

