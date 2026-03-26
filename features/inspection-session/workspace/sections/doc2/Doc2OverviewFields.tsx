import SignaturePad from '@/components/ui/SignaturePad';
import { DEFAULT_CONSTRUCTION_TYPE } from '@/constants/inspectionSession/catalog';
import {
  NOTIFICATION_METHOD_OPTIONS,
  PREVIOUS_IMPLEMENTATION_OPTIONS,
} from '@/components/session/workspace/constants';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { OverviewSectionProps } from '@/components/session/workspace/types';
import { updateOverviewField } from '@/components/session/workspace/sections/doc2Shared';

interface Doc2OverviewFieldsProps {
  props: OverviewSectionProps;
}

export function Doc2OverviewFields({ props }: Doc2OverviewFieldsProps) {
  const { session } = props;
  const constructionDisplay =
    session.document2Overview.constructionType?.trim() || DEFAULT_CONSTRUCTION_TYPE;

  return (
    <div className={styles.doc2OverviewForm}>
      <div className={`${styles.doc2OverviewRow} ${styles.doc2OverviewRowDates}`}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>지도일</span>
          <input
            type="date"
            className="app-input"
            value={session.document2Overview.guidanceDate}
            onChange={(event) => updateOverviewField(props, 'guidanceDate', event.target.value)}
          />
        </label>
        <div className={styles.doc2OverviewDatesRight}>
          {[
            ['공정률', 'progressRate', '예: 45%'],
            ['회차', 'visitCount', ''],
            ['총회차', 'totalVisitCount', ''],
          ].map(([label, key, placeholder]) => (
            <label key={key} className={styles.field}>
              <span className={styles.fieldLabel}>{label}</span>
              <input
                type="text"
                className="app-input"
                value={
                  session.document2Overview[
                    key as 'progressRate' | 'visitCount' | 'totalVisitCount'
                  ]
                }
                placeholder={placeholder}
                onChange={(event) =>
                  updateOverviewField(
                    props,
                    key as 'progressRate' | 'visitCount' | 'totalVisitCount',
                    event.target.value,
                  )
                }
              />
            </label>
          ))}
        </div>
      </div>

      <div className={`${styles.doc2OverviewRow} ${styles.doc2OverviewRowFollow}`}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>이전기술지도 이행여부</span>
          <select
            className="app-select"
            value={session.document2Overview.previousImplementationStatus}
            onChange={(event) =>
              updateOverviewField(props, 'previousImplementationStatus', event.target.value)
            }
          >
            {PREVIOUS_IMPLEMENTATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>담당요원</span>
          <input
            type="text"
            className="app-input"
            value={session.document2Overview.assignee}
            onChange={(event) => updateOverviewField(props, 'assignee', event.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>연락처</span>
          <input
            type="text"
            className="app-input"
            value={session.document2Overview.contact}
            onChange={(event) => updateOverviewField(props, 'contact', event.target.value)}
          />
        </label>
      </div>

      <div className={`${styles.doc2OverviewRow} ${styles.doc2OverviewRowNotify}`}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>공사구분</span>
          <input type="text" className="app-input" value={constructionDisplay} readOnly />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>현장 책임자 통보방법</span>
          <select
            className="app-select"
            value={session.document2Overview.notificationMethod}
            onChange={(event) =>
              updateOverviewField(props, 'notificationMethod', event.target.value)
            }
          >
            <option value="">선택</option>
            {NOTIFICATION_METHOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {session.document2Overview.notificationMethod === 'direct' ? (
        <div className={styles.doc2OverviewSignatureWrap}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>직접전달 수령자 성함</span>
            <input
              type="text"
              className="app-input"
              value={session.document2Overview.notificationRecipientName}
              onChange={(event) =>
                updateOverviewField(props, 'notificationRecipientName', event.target.value)
              }
              placeholder="수령자 성함 입력"
            />
          </label>
          <SignaturePad
            label="직접전달 서명"
            value={session.document2Overview.notificationRecipientSignature}
            onChange={(nextValue) =>
              updateOverviewField(props, 'notificationRecipientSignature', nextValue)
            }
          />
        </div>
      ) : null}

      {session.document2Overview.notificationMethod === 'other' ? (
        <label className={`${styles.field} ${styles.doc2OverviewOtherField}`}>
          <span className={styles.fieldLabel}>기타 통보방법</span>
          <input
            type="text"
            className="app-input"
            value={session.document2Overview.otherNotificationMethod}
            onChange={(event) =>
              updateOverviewField(props, 'otherNotificationMethod', event.target.value)
            }
          />
        </label>
      ) : null}
    </div>
  );
}

