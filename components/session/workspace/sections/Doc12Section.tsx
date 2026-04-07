import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { SupportSectionProps } from '@/components/session/workspace/types';
import { UploadBox } from '@/components/session/workspace/widgets';
import type { ActivityRecord } from '@/types/inspectionSession';

export default function Doc12Section(props: SupportSectionProps) {
  const { applyDocumentUpdate, session, withFileData } = props;
  const item = session.document12Activities[0];
  if (!item) {
    return <div className={styles.sectionStack} />;
  }

  const patchFirst = (patch: Partial<ActivityRecord>) =>
    applyDocumentUpdate('doc12', 'manual', (current) => ({
      ...current,
      document12Activities: current.document12Activities.map((activity, index) =>
        index === 0 ? { ...activity, ...patch } : activity,
      ),
    }));

  return (
    <div className={styles.sectionStack}>
      <article key={item.id} className={`${styles.card} ${styles.doc4Card}`}>
        <div className={styles.doc10CardInner}>
          <div className={`${styles.tableCard} ${styles.doc12TableWrap}`}>
            <table className={styles.doc12Table}>
              <colgroup>
                <col />
                <col />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">활동 1 사진</th>
                  <th scope="col">활동 2 사진</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={styles.doc12PhotoCell}>
                    <div className={styles.doc12PhotoUpload}>
                      <UploadBox
                        id={`activity-photo-${item.id}`}
                        label=""
                        labelLayout="field"
                        fieldClearOverlay
                        value={item.photoUrl}
                        onClear={() => patchFirst({ photoUrl: '' })}
                        onSelect={async (file) =>
                          withFileData(file, (dataUrl) => patchFirst({ photoUrl: dataUrl }))
                        }
                      />
                    </div>
                  </td>
                  <td className={styles.doc12PhotoCell}>
                    <div className={styles.doc12PhotoUpload}>
                      <UploadBox
                        id={`activity-photo2-${item.id}`}
                        label=""
                        labelLayout="field"
                        fieldClearOverlay
                        value={item.photoUrl2}
                        onClear={() => patchFirst({ photoUrl2: '' })}
                        onSelect={async (file) =>
                          withFileData(file, (dataUrl) => patchFirst({ photoUrl2: dataUrl }))
                        }
                      />
                    </div>
                  </td>
                </tr>
                <tr>
                  <th scope="row">활동 1 내용</th>
                  <th scope="row">활동 2 내용</th>
                </tr>
                <tr>
                  <td className={styles.doc12ContentCell}>
                    <input
                      type="text"
                      className={`${styles.doc10CellControl} app-input`}
                      value={item.activityType}
                      placeholder="예: 조회, TBM, 비상훈련"
                      onChange={(event) => patchFirst({ activityType: event.target.value })}
                    />
                  </td>
                  <td className={styles.doc12ContentCell}>
                    <input
                      type="text"
                      className={`${styles.doc10CellControl} app-input`}
                      value={item.content}
                      placeholder="활동 요약 및 비고"
                      onChange={(event) => patchFirst({ content: event.target.value })}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </article>
    </div>
  );
}
