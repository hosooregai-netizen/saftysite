import { ACCIDENT_OCCURRENCE_OPTIONS } from '@/components/session/workspace/constants';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { OverviewSectionProps } from '@/components/session/workspace/types';
import Doc2AccidentDatePicker from '@/components/session/workspace/sections/Doc2AccidentDatePicker';
import { updateOverviewField } from '@/components/session/workspace/sections/doc2Shared';

interface Doc2AccidentFieldsProps {
  props: OverviewSectionProps;
}

export function Doc2AccidentFields({ props }: Doc2AccidentFieldsProps) {
  const { session } = props;
  const accidentOccurredYes = session.document2Overview.accidentOccurred === 'yes';

  return (
    <article className={styles.tableCard}>
      <div className={styles.doc2AccidentTableWrap}>
        <table className={styles.doc2AccidentTable}>
          <colgroup>
            <col className={styles.doc2AccidentLabelCol} />
            <col className={styles.doc2AccidentValueCol} />
            <col className={styles.doc2AccidentLabelCol} />
            <col className={styles.doc2AccidentValueCol} />
            <col className={styles.doc2AccidentLabelCol} />
            <col className={styles.doc2AccidentValueCol} />
          </colgroup>
          <tbody>
            {accidentOccurredYes ? (
              <>
                <tr>
                  <th scope="row" className={styles.doc2AccidentLabelCell}>
                    업무상재해 발생유무
                  </th>
                  <td className={styles.doc2AccidentValueCell}>
                    <select
                      className="app-select"
                      value={session.document2Overview.accidentOccurred === 'yes' ? 'yes' : 'no'}
                      onChange={(event) =>
                        updateOverviewField(props, 'accidentOccurred', event.target.value)
                      }
                    >
                      {ACCIDENT_OCCURRENCE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <th scope="row" className={styles.doc2AccidentLabelCell}>
                    최근 발생일자
                  </th>
                  <td className={styles.doc2AccidentValueCell}>
                    <Doc2AccidentDatePicker
                      value={session.document2Overview.recentAccidentDate}
                      disabled={false}
                      onChange={(next) => updateOverviewField(props, 'recentAccidentDate', next)}
                    />
                  </td>
                  <th scope="row" className={styles.doc2AccidentLabelCell}>
                    재해형태
                  </th>
                  <td className={styles.doc2AccidentValueCell}>
                    <input
                      type="text"
                      className="app-input"
                      value={session.document2Overview.accidentType}
                      onChange={(event) =>
                        updateOverviewField(props, 'accidentType', event.target.value)
                      }
                      placeholder="예: 추락"
                    />
                  </td>
                </tr>
                <tr>
                  <th scope="row" className={styles.doc2AccidentLabelCell}>재해개요</th>
                  <td colSpan={5} className={styles.doc2AccidentValueCell}>
                    <input
                      type="text"
                      className="app-input"
                      value={session.document2Overview.accidentSummary}
                      onChange={(event) =>
                        updateOverviewField(props, 'accidentSummary', event.target.value)
                      }
                      placeholder="재해 개요 입력"
                    />
                  </td>
                </tr>
              </>
            ) : (
              <tr>
                <th scope="row" className={styles.doc2AccidentLabelCell}>
                  업무상재해 발생유무
                </th>
                <td colSpan={5} className={styles.doc2AccidentValueCell}>
                  <select
                    className="app-select"
                    value={session.document2Overview.accidentOccurred === 'yes' ? 'yes' : 'no'}
                    onChange={(event) =>
                      updateOverviewField(props, 'accidentOccurred', event.target.value)
                    }
                  >
                    {ACCIDENT_OCCURRENCE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            )}
            <tr>
              <th scope="row" className={styles.doc2AccidentLabelCell}>
                진행공정 및 특이사항
              </th>
              <td colSpan={5} className={styles.doc2AccidentValueCell}>
                <textarea
                  className={`app-textarea ${styles.doc2AccidentTextarea}`}
                  value={session.document2Overview.processAndNotes}
                  onChange={(event) =>
                    updateOverviewField(props, 'processAndNotes', event.target.value)
                  }
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  );
}

