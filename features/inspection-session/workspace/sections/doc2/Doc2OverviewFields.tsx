import { useState } from 'react';
import AppModal from '@/components/ui/AppModal';
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
  const [isDirectDeliveryModalOpen, setIsDirectDeliveryModalOpen] = useState(false);
  const constructionDisplay =
    session.document2Overview.constructionType?.trim() || DEFAULT_CONSTRUCTION_TYPE;
  const hasDirectSignature = session.document2Overview.notificationRecipientSignature.trim().length > 0;
  const recipientName = session.document2Overview.notificationRecipientName;

  return (
    <>
      <article className={styles.tableCard}>
        <div className={styles.doc2OverviewTableWrap}>
          <table className={styles.doc2OverviewTable}>
            <colgroup>
              <col className={styles.doc2OverviewLabelCol} />
              <col className={styles.doc2OverviewValueCol} />
              <col className={styles.doc2OverviewLabelCol} />
              <col className={styles.doc2OverviewValueCol} />
              <col className={styles.doc2OverviewLabelCol} />
              <col className={styles.doc2OverviewValueCol} />
              <col className={styles.doc2OverviewLabelCol} />
              <col className={styles.doc2OverviewValueCol} />
            </colgroup>
            <tbody>
              <tr>
                <th scope="row" className={styles.doc2OverviewLabelCell}>지도일</th>
                <td className={styles.doc2OverviewValueCell}>
                  <input
                    type="date"
                    className="app-input"
                    value={session.document2Overview.guidanceDate}
                    onChange={(event) => updateOverviewField(props, 'guidanceDate', event.target.value)}
                  />
                </td>
                <th scope="row" className={styles.doc2OverviewLabelCell}>공정률</th>
                <td className={styles.doc2OverviewValueCell}>
                  <input
                    type="text"
                    className="app-input"
                    value={session.document2Overview.progressRate}
                    placeholder="예: 45%"
                    onChange={(event) => updateOverviewField(props, 'progressRate', event.target.value)}
                  />
                </td>
                <th scope="row" className={styles.doc2OverviewLabelCell}>회차</th>
                <td className={styles.doc2OverviewValueCell}>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    className="app-input"
                    value={String(session.reportNumber || '')}
                    onChange={(event) => updateOverviewField(props, 'visitCount', event.target.value)}
                  />
                </td>
                <th scope="row" className={styles.doc2OverviewLabelCell}>총회차</th>
                <td className={styles.doc2OverviewValueCell}>
                  <input
                    type="text"
                    className="app-input"
                    value={session.document2Overview.totalVisitCount}
                    onChange={(event) =>
                      updateOverviewField(props, 'totalVisitCount', event.target.value)
                    }
                  />
                </td>
              </tr>
              <tr>
                <th scope="row" className={styles.doc2OverviewLabelCell}>이전기술지도 이행여부</th>
                <td className={styles.doc2OverviewValueCell}>
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
                </td>
                <th scope="row" className={styles.doc2OverviewLabelCell}>담당요원</th>
                <td className={styles.doc2OverviewValueCell}>
                  <input
                    type="text"
                    className="app-input"
                    value={session.document2Overview.assignee}
                    onChange={(event) => updateOverviewField(props, 'assignee', event.target.value)}
                  />
                </td>
                <th scope="row" className={styles.doc2OverviewLabelCell}>연락처</th>
                <td colSpan={3} className={styles.doc2OverviewValueCell}>
                  <input
                    type="text"
                    className="app-input"
                    value={session.document2Overview.contact}
                    onChange={(event) => updateOverviewField(props, 'contact', event.target.value)}
                  />
                </td>
              </tr>
              <tr>
                <th scope="row" className={styles.doc2OverviewLabelCell}>공사구분</th>
                <td colSpan={3} className={styles.doc2OverviewValueCell}>
                  <input type="text" className="app-input" value={constructionDisplay} readOnly />
                </td>
                <th scope="row" className={styles.doc2OverviewLabelCell}>현장 책임자 통보방법</th>
                <td colSpan={3} className={styles.doc2OverviewValueCell}>
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
                </td>
              </tr>

              {session.document2Overview.notificationMethod === 'direct' ? (
                <tr>
                  <th scope="row" className={styles.doc2OverviewLabelCell}>직접전달 수령자 성함</th>
                  <td colSpan={7} className={styles.doc2OverviewValueCell}>
                    <div className={styles.doc2OverviewInlineAction}>
                      <input
                        type="text"
                        className={`app-input ${styles.doc2OverviewReadonlyInput}`}
                        value={recipientName}
                        placeholder="수령자 성함 입력"
                        readOnly
                      />
                      <span
                        className={
                          hasDirectSignature
                            ? styles.doc2OverviewStatusDone
                            : styles.doc2OverviewStatusPending
                        }
                      >
                        {hasDirectSignature ? '서명 작성됨' : '서명 미작성'}
                      </span>
                      <button
                        type="button"
                        className="app-button app-button-secondary"
                        onClick={() => setIsDirectDeliveryModalOpen(true)}
                      >
                        서명 작성
                      </button>
                    </div>
                  </td>
                </tr>
              ) : null}

              {session.document2Overview.notificationMethod === 'other' ? (
                <tr>
                  <th scope="row" className={styles.doc2OverviewLabelCell}>기타 통보방법</th>
                  <td colSpan={7} className={styles.doc2OverviewValueCell}>
                    <input
                      type="text"
                      className="app-input"
                      value={session.document2Overview.otherNotificationMethod}
                      onChange={(event) =>
                        updateOverviewField(props, 'otherNotificationMethod', event.target.value)
                      }
                    />
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>

      <AppModal
        open={isDirectDeliveryModalOpen}
        title="직접전달 수령자/서명"
        onClose={() => setIsDirectDeliveryModalOpen(false)}
        verticalAlign="center"
        actions={
          <button
            type="button"
            className="app-button app-button-primary"
            onClick={() => setIsDirectDeliveryModalOpen(false)}
          >
            완료
          </button>
        }
      >
        <div className={styles.doc2SignatureModalBody}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>수령자 성함</span>
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
            label="수령자 서명"
            value={session.document2Overview.notificationRecipientSignature}
            onChange={(nextValue) =>
              updateOverviewField(props, 'notificationRecipientSignature', nextValue)
            }
          />
        </div>
      </AppModal>
    </>
  );
}

