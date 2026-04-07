import { FOLLOW_UP_RESULT_OPTIONS } from '@/constants/inspectionSession';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { OverviewSectionProps } from '@/components/session/workspace/types';
import { UploadBox } from '@/components/session/workspace/widgets';

export default function Doc4Section(props: OverviewSectionProps) {
  const {
    applyDocumentUpdate,
    isRelationHydrating,
    relationStatus,
    session,
    withFileData,
  } = props;
  const showRelationSkeleton =
    isRelationHydrating && session.document4FollowUps.length === 0;
  const showRelationError =
    relationStatus === 'error' && session.document4FollowUps.length === 0;
  const showEmptyState =
    !showRelationSkeleton &&
    !showRelationError &&
    session.document4FollowUps.length === 0;

  return (
    <div className={`${styles.sectionStack} ${styles.doc4SectionStack}`}>
      {isRelationHydrating ? (
        <div className={styles.relationNotice} role="status">
          이전 보고서 연동값을 계산 중입니다.
        </div>
      ) : null}
      {showRelationError ? (
        <div className={`${styles.relationNotice} ${styles.relationNoticeError}`} role="status">
          이전 보고서 연동값을 아직 불러오지 못했습니다.
        </div>
      ) : null}
      {showEmptyState ? (
        <div className={styles.doc4EmptyState} role="status">
          이전 기술지도 이행 항목이 없습니다.
        </div>
      ) : null}
      {showRelationSkeleton
        ? Array.from({ length: 2 }).map((_, index) => (
            <article
              key={`doc4-skeleton-${index + 1}`}
              className={`${styles.card} ${styles.doc4Card} ${styles.relationSkeletonCard}`}
              aria-hidden="true"
            >
              <div className={styles.relationSkeletonLine} />
              <div className={styles.relationSkeletonLine} />
              <div className={styles.relationSkeletonLineShort} />
            </article>
          ))
        : null}
      {session.document4FollowUps.map((item) => {
        const isDerived = Boolean(item.sourceSessionId && item.sourceFindingId);
        const canRemove = !isDerived;
        const updateField = (
          key:
            | 'location'
            | 'guidanceDate'
            | 'confirmationDate'
            | 'result'
            | 'beforePhotoUrl'
            | 'afterPhotoUrl',
          value: string,
        ) =>
          applyDocumentUpdate('doc4', 'manual', (current) => ({
            ...current,
            document4FollowUps: current.document4FollowUps.map((followUp) =>
              followUp.id === item.id ? { ...followUp, [key]: value } : followUp,
            ),
          }));

        return (
          <article key={item.id} className={`${styles.card} ${styles.doc4Card}`}>
            <div
              className={`${styles.doc4CardInner} ${
                isDerived ? styles.doc4CardInnerWithEyebrow : ''
              }`}
            >
              {isDerived ? (
                <div className={styles.doc4DerivedEyebrow}>
                  <span className={styles.cardEyebrow}>이전 보고서 연동</span>
                </div>
              ) : null}
              <div className={styles.doc4PhotoRow}>
                <div className={styles.doc4PhotoTableWrap}>
                  <table className={styles.doc4PhotoTable}>
                    <tbody>
                      <tr>
                        <th scope="col" className={styles.doc4PhotoTitleCell}>
                          시정 전 사진
                        </th>
                        <th scope="col" className={styles.doc4PhotoTitleCell}>
                          시정 후 사진
                        </th>
                      </tr>
                      <tr>
                        <td className={styles.doc4PhotoValueCell}>
                          <UploadBox
                            id={`follow-up-before-${item.id}`}
                            label="시정 전 사진"
                            labelLayout="field"
                            value={item.beforePhotoUrl}
                            onClear={
                              isDerived ? undefined : () => updateField('beforePhotoUrl', '')
                            }
                            onSelect={async (file) => {
                              if (!isDerived) {
                                await withFileData(file, (dataUrl) =>
                                  updateField('beforePhotoUrl', dataUrl),
                                );
                              }
                            }}
                          />
                        </td>
                        <td className={styles.doc4PhotoValueCell}>
                          <UploadBox
                            id={`follow-up-after-${item.id}`}
                            label="시정 후 사진"
                            labelLayout="field"
                            value={item.afterPhotoUrl}
                            onClear={() => updateField('afterPhotoUrl', '')}
                            onSelect={async (file) =>
                              withFileData(file, (dataUrl) =>
                                updateField('afterPhotoUrl', dataUrl),
                              )
                            }
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className={styles.doc4MetaBundle}>
                <div className={styles.doc4MetaTableWrap}>
                  <table className={styles.doc4MetaTable}>
                    <tbody>
                      <tr>
                        <th scope="row" className={styles.doc4MetaLabelCell}>
                          유해·위험요소
                        </th>
                        <td className={styles.doc4MetaValueCell}>
                          <input
                            type="text"
                            className={`app-input ${styles.doc4MetaControl}`}
                            value={item.location}
                            onChange={(event) => updateField('location', event.target.value)}
                          />
                        </td>
                        <th scope="row" className={styles.doc4MetaLabelCell}>
                          시정조치 결과
                        </th>
                        <td className={styles.doc4MetaValueCell}>
                          <select
                            className={`app-select ${styles.doc4MetaControl}`}
                            value={item.result}
                            onChange={(event) => updateField('result', event.target.value)}
                          >
                            {FOLLOW_UP_RESULT_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                      <tr>
                        <th scope="row" className={styles.doc4MetaLabelCell}>
                          지도일자
                        </th>
                        <td className={styles.doc4MetaValueCell}>
                          <input
                            type="date"
                            className={`app-input ${styles.doc4MetaControl}`}
                            value={item.guidanceDate}
                            readOnly={isDerived}
                            onChange={(event) => updateField('guidanceDate', event.target.value)}
                          />
                        </td>
                        <th scope="row" className={styles.doc4MetaLabelCell}>
                          확인일
                        </th>
                        <td className={styles.doc4MetaValueCell}>
                          <input
                            type="date"
                            className={`app-input ${styles.doc4MetaControl}`}
                            value={item.confirmationDate}
                            onChange={(event) =>
                              updateField('confirmationDate', event.target.value)
                            }
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            {canRemove ? (
              <button
                type="button"
                className={`${styles.inlineDangerButton} ${styles.doc4CardDeleteOverlay}`}
                onClick={() =>
                  applyDocumentUpdate('doc4', 'manual', (current) => ({
                    ...current,
                    document4FollowUps: current.document4FollowUps.filter(
                      (followUp) => followUp.id !== item.id,
                    ),
                  }))
                }
              >
                삭제
              </button>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
