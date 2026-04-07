import { UploadBox } from '@/components/session/workspace/widgets';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { SiteScenePhoto } from '@/types/inspectionSession';

export default function Doc3FixedScenes({
  items,
  onClear,
  onUpload,
}: {
  items: SiteScenePhoto[];
  onClear: (sceneId: string) => void;
  onUpload: (sceneId: string, file: File) => Promise<void>;
}) {
  return (
    <section className={`${styles.doc3Section} ${styles.doc3FullRow}`}>
      <div className={styles.doc3SectionHeader}>
        <h3 className={styles.cardTitle}>현장 전경</h3>
      </div>

      <div className={styles.doc3TableWrap}>
        <table className={styles.doc3UnifiedTable}>
          <colgroup>
            <col className={styles.doc3HalfCol} />
            <col className={styles.doc3HalfCol} />
          </colgroup>
          <tbody>
            <tr>
              {items.map((item, index) => (
                <th key={`title-${item.id}`} scope="col" className={styles.doc3TitleCell}>
                  <span className={styles.doc3TitleCellText}>{`전경 사진 ${index + 1}`}</span>
                </th>
              ))}
            </tr>
            <tr>
              {items.map((item, index) => (
                <td key={`image-${item.id}`} className={styles.doc3ImageCell}>
                  <UploadBox
                    id={`scene-photo-${item.id}`}
                    label={`전경 사진 ${index + 1}`}
                    labelLayout="field"
                    value={item.photoUrl}
                    fieldClearOverlay
                    onClear={() => onClear(item.id)}
                    onSelect={async (file) => onUpload(item.id, file)}
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
