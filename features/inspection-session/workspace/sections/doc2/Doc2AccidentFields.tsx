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
    <div className={styles.formGrid}>
      {accidentOccurredYes ? (
        <>
          <div className={styles.doc2AccidentRowThree}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>업무상재해 발생유무</span>
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
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>최근 발생일자</span>
              <Doc2AccidentDatePicker
                value={session.document2Overview.recentAccidentDate}
                disabled={false}
                onChange={(next) => updateOverviewField(props, 'recentAccidentDate', next)}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>재해형태</span>
              <input
                type="text"
                className="app-input"
                value={session.document2Overview.accidentType}
                onChange={(event) => updateOverviewField(props, 'accidentType', event.target.value)}
                placeholder="예: 추락"
              />
            </label>
          </div>
          <label className={`${styles.field} ${styles.fieldWide}`}>
            <span className={styles.fieldLabel}>재해개요</span>
            <input
              type="text"
              className="app-input"
              value={session.document2Overview.accidentSummary}
              onChange={(event) =>
                updateOverviewField(props, 'accidentSummary', event.target.value)
              }
              placeholder="재해 개요 입력"
            />
          </label>
        </>
      ) : (
        <div className={`${styles.doc2OverviewRow} ${styles.doc2AccidentOccurrenceOnly}`}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>업무상재해 발생유무</span>
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
          </label>
        </div>
      )}
      <label className={`${styles.field} ${styles.fieldWide}`}>
        <span className={styles.fieldLabel}>진행공정 및 특이사항</span>
        <textarea
          className="app-textarea"
          value={session.document2Overview.processAndNotes}
          onChange={(event) => updateOverviewField(props, 'processAndNotes', event.target.value)}
        />
      </label>
    </div>
  );
}

