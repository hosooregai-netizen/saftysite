import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { SupportSectionProps } from '@/components/session/workspace/types';
import { UploadBox } from '@/components/session/workspace/widgets';

export default function Doc12Section(props: SupportSectionProps) {
  const { applyDocumentUpdate, session, withFileData } = props;

  return (
    <div className={styles.caseGrid}>
      {session.document12Activities.map((item) => (
        <article key={item.id} className={`${styles.caseCard} ${styles.activityCard}`}>
          <div className={styles.activityHeader}>
            <label className={styles.activityHeaderLabel}>
              <span className={styles.activityHeaderLabelText}>활동 내용</span>
              <input
                type="text"
                className={styles.activityHeaderInput}
                value={item.content}
                placeholder="이미지 제목(활동 내용)을 입력하세요"
                aria-label="활동 내용"
                onChange={(event) =>
                  applyDocumentUpdate('doc12', 'manual', (current) => ({
                    ...current,
                    document12Activities: current.document12Activities.map((activity) =>
                      activity.id === item.id ? { ...activity, content: event.target.value } : activity,
                    ),
                  }))
                }
              />
            </label>
          </div>
          <div className={styles.activityPhoto}>
            <UploadBox
              id={`activity-photo-${item.id}`}
              label="활동 사진"
              labelLayout="field"
              fieldClearOverlay
              value={item.photoUrl}
              onClear={() =>
                applyDocumentUpdate('doc12', 'manual', (current) => ({
                  ...current,
                  document12Activities: current.document12Activities.map((activity) =>
                    activity.id === item.id ? { ...activity, photoUrl: '' } : activity,
                  ),
                }))
              }
              onSelect={async (file) =>
                withFileData(file, (dataUrl) =>
                  applyDocumentUpdate('doc12', 'manual', (current) => ({
                    ...current,
                    document12Activities: current.document12Activities.map((activity) =>
                      activity.id === item.id ? { ...activity, photoUrl: dataUrl } : activity,
                    ),
                  })),
                )
              }
            />
          </div>
        </article>
      ))}
    </div>
  );
}
