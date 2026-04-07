import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import { FUTURE_PROCESS_LIBRARY } from '@/components/session/workspace/constants';
import type { HazardStatsSectionProps } from '@/components/session/workspace/types';
import { createFutureProcessRiskPlan } from '@/constants/inspectionSession';

export default function Doc8Section({
  applyDocumentUpdate,
  session,
}: Pick<HazardStatsSectionProps, 'applyDocumentUpdate' | 'session'>) {
  return (
    <div className={styles.sectionStack}>
      <div className={styles.workPlanSection}>
        <table className={`${styles.workPlanTable} ${styles.doc8FutureTable}`}>
          <caption className={styles.doc8CaptionWrap}>
            <span className={styles.doc8CaptionTitle}>향후 주요 작업공정 · 위험요인 · 안전대책</span>
          </caption>
          <colgroup>
            <col className={styles.doc8ColProcess} />
            <col className={styles.doc8ColHazard} />
            <col className={styles.doc8ColMeasure} />
            <col className={styles.doc8ColAction} />
          </colgroup>
          <thead>
            <tr>
              <th scope="col" className={styles.doc8Th}>
                향후 주요 작업공정
              </th>
              <th scope="col" className={styles.doc8Th}>
                위험요인
              </th>
              <th scope="col" className={styles.doc8Th}>
                안전대책
              </th>
              <th scope="col" className={`${styles.doc8Th} ${styles.doc8ThAction}`}>
                행 관리
              </th>
            </tr>
          </thead>
          <tbody>
            {session.document8Plans.map((item, index) => {
              const isLastRow = index === session.document8Plans.length - 1;

              return (
                <tr key={item.id}>
                  <td className={styles.doc8TdProcess}>
                    <div className={styles.doc8ProcessCellStack}>
                      <input
                        list="future-process-library"
                        autoComplete="off"
                        className={`${styles.doc8ProcessInput} app-input`}
                        value={item.processName}
                        onChange={(event) => {
                          const matched = FUTURE_PROCESS_LIBRARY.find(
                            (libraryItem) => libraryItem.processName === event.target.value,
                          );

                          applyDocumentUpdate('doc8', matched ? 'api' : 'manual', (current) => ({
                            ...current,
                            document8Plans: current.document8Plans.map((plan) =>
                              plan.id === item.id
                                ? {
                                    ...plan,
                                    processName: event.target.value,
                                    hazard: matched?.hazard ?? plan.hazard,
                                    countermeasure: matched?.countermeasure ?? plan.countermeasure,
                                    source: matched ? 'api' : 'manual',
                                  }
                                : plan,
                            ),
                          }));
                        }}
                      />
                    </div>
                  </td>
                  <td className={styles.doc8TdArea}>
                    <textarea
                      rows={5}
                      className={`${styles.doc8Textarea} app-textarea`}
                      value={item.hazard}
                      onChange={(event) =>
                        applyDocumentUpdate('doc8', 'manual', (current) => ({
                          ...current,
                          document8Plans: current.document8Plans.map((plan) =>
                            plan.id === item.id
                              ? { ...plan, hazard: event.target.value, source: 'manual' }
                              : plan,
                          ),
                        }))
                      }
                    />
                  </td>
                  <td className={styles.doc8TdArea}>
                    <textarea
                      rows={5}
                      className={`${styles.doc8Textarea} app-textarea`}
                      value={item.countermeasure}
                      onChange={(event) =>
                        applyDocumentUpdate('doc8', 'manual', (current) => ({
                          ...current,
                          document8Plans: current.document8Plans.map((plan) =>
                            plan.id === item.id
                              ? { ...plan, countermeasure: event.target.value, source: 'manual' }
                              : plan,
                          ),
                        }))
                      }
                    />
                  </td>
                  <td className={styles.doc8TdAction}>
                    <div className={styles.doc8ActionStack}>
                      {isLastRow ? (
                        <button
                          type="button"
                          className={`${styles.doc8RowActionButton} ${styles.doc8RowActionAdd}`}
                          onClick={() =>
                            applyDocumentUpdate('doc8', 'manual', (current) => ({
                              ...current,
                              document8Plans: [...current.document8Plans, createFutureProcessRiskPlan()],
                            }))
                          }
                        >
                          행 추가
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className={`${styles.doc8RowActionButton} ${styles.doc8RowActionRemove}`}
                        onClick={() =>
                          applyDocumentUpdate('doc8', 'manual', (current) => ({
                            ...current,
                            document8Plans:
                              current.document8Plans.length <= 1
                                ? current.document8Plans
                                : current.document8Plans.filter((plan) => plan.id !== item.id),
                          }))
                        }
                        disabled={session.document8Plans.length <= 1}
                      >
                        행 삭제
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <datalist id="future-process-library">
          {FUTURE_PROCESS_LIBRARY.map((libraryItem) => (
            <option key={libraryItem.processName} value={libraryItem.processName} />
          ))}
        </datalist>
      </div>
    </div>
  );
}
