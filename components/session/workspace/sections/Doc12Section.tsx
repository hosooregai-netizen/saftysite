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
          <div className={styles.doc12Activities}>
            <div className={styles.doc12ActivityBlock}>
              <UploadBox
                id={`activity-photo-${item.id}`}
                label="활동 1 사진"
                labelLayout="field"
                fieldClearOverlay
                value={item.photoUrl}
                onClear={() => patchFirst({ photoUrl: '' })}
                onSelect={async (file) =>
                  withFileData(file, (dataUrl) => patchFirst({ photoUrl: dataUrl }))
                }
              />
              <label className={styles.field}>
                <span className={styles.fieldLabel}>활동 1 내용</span>
                <input
                  type="text"
                  className="app-input"
                  value={item.activityType}
                  placeholder="예: 순회점검, TBM, 비상훈련"
                  onChange={(event) => patchFirst({ activityType: event.target.value })}
                />
              </label>
            </div>
            <div className={styles.doc12ActivityBlock}>
              <UploadBox
                id={`activity-photo2-${item.id}`}
                label="활동 2 사진"
                labelLayout="field"
                fieldClearOverlay
                value={item.photoUrl2}
                onClear={() => patchFirst({ photoUrl2: '' })}
                onSelect={async (file) =>
                  withFileData(file, (dataUrl) => patchFirst({ photoUrl2: dataUrl }))
                }
              />
              <label className={styles.field}>
                <span className={styles.fieldLabel}>활동 2 내용</span>
                <input
                  type="text"
                  className="app-input"
                  value={item.content}
                  placeholder="활동 요약·비고"
                  onChange={(event) => patchFirst({ content: event.target.value })}
                />
              </label>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

