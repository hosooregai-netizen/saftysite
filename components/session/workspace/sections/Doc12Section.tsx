import { padDocument12Activities } from '@/constants/inspectionSession/itemFactory';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { SupportSectionProps } from '@/components/session/workspace/types';
import { UploadBox } from '@/components/session/workspace/widgets';
import type { ActivityRecord } from '@/types/inspectionSession';

const VISIBLE_ACTIVITY_COUNT = 2;

export default function Doc12Section(props: SupportSectionProps) {
  const { applyDocumentUpdate, session, withFileData } = props;
  const activities = padDocument12Activities(session.document12Activities).slice(
    0,
    VISIBLE_ACTIVITY_COUNT,
  );

  const patchActivity = (activityIndex: number, patch: Partial<ActivityRecord>) =>
    applyDocumentUpdate('doc12', 'manual', (current) => {
      const nextActivities = padDocument12Activities(current.document12Activities);

      return {
        ...current,
        document12Activities: nextActivities.map((activity, index) =>
          index === activityIndex ? { ...activity, ...patch } : activity,
        ),
      };
    });

  return (
    <div className={styles.sectionStack}>
      <article className={`${styles.card} ${styles.doc4Card}`}>
        <div className={styles.doc10CardInner}>
          <div className={`${styles.tableCard} ${styles.doc12TableWrap}`}>
            <table className={styles.doc12Table}>
              <colgroup>
                <col />
                <col />
              </colgroup>
              <thead>
                <tr>
                  {activities.map((activity, index) => (
                    <th key={`title-head-${activity.id}`} scope="col">
                      활동 {index + 1} 제목
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {activities.map((activity, index) => (
                    <td key={`title-${activity.id}`} className={styles.doc12ContentCell}>
                      <input
                        type="text"
                        className={`${styles.doc10CellControl} app-input`}
                        value={activity.activityTitle}
                        placeholder="예: 정기 안전교육"
                        onChange={(event) =>
                          patchActivity(index, { activityTitle: event.target.value })
                        }
                      />
                    </td>
                  ))}
                </tr>
                <tr>
                  {activities.map((activity, index) => (
                    <th key={`image-head-${activity.id}`} scope="col">
                      활동 {index + 1} 사진
                    </th>
                  ))}
                </tr>
                <tr>
                  {activities.map((activity, index) => (
                    <td key={`image-${activity.id}`} className={styles.doc12PhotoCell}>
                      <div className={styles.doc12PhotoUpload}>
                        <UploadBox
                          id={`activity-photo-${activity.id}`}
                          label={`활동 ${index + 1} 사진`}
                          labelLayout="field"
                          fieldClearOverlay
                          value={activity.photoUrl}
                          onClear={() => patchActivity(index, { photoUrl: '' })}
                          onSelect={async (file) =>
                            withFileData(file, (dataUrl) =>
                              patchActivity(index, { photoUrl: dataUrl }),
                            )
                          }
                        />
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  {activities.map((activity, index) => (
                    <th key={`content-head-${activity.id}`} scope="col">
                      활동 {index + 1} 내용
                    </th>
                  ))}
                </tr>
                <tr>
                  {activities.map((activity, index) => (
                    <td key={`content-${activity.id}`} className={styles.doc12ContentCell}>
                      <input
                        type="text"
                        className={`${styles.doc10CellControl} app-input`}
                        value={activity.content}
                        placeholder="활동 내용"
                        onChange={(event) => patchActivity(index, { content: event.target.value })}
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </article>
    </div>
  );
}
