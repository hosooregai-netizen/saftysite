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

      <div className={styles.doc3SectionGrid}>
        {items.map((item, index) => (
          <article key={item.id} className={`${styles.card} ${styles.doc3SlotCard}`}>
            <UploadBox
              id={`scene-photo-${item.id}`}
              label={`전경 사진 ${index + 1}`}
              labelLayout="field"
              value={item.photoUrl}
              onClear={() => onClear(item.id)}
              onSelect={async (file) => onUpload(item.id, file)}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
