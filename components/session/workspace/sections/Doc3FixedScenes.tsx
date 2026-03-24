import { UploadBox } from '@/components/session/workspace/widgets';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import { getFixedSceneTitle } from '@/constants/inspectionSession/scenePhotos';
import type { SiteScenePhoto } from '@/types/inspectionSession';

export default function Doc3FixedScenes({
  items,
  onClear,
  onDescriptionChange,
  onUpload,
}: {
  items: SiteScenePhoto[];
  onClear: (sceneId: string) => void;
  onDescriptionChange: (sceneId: string, value: string) => void;
  onUpload: (sceneId: string, file: File) => Promise<void>;
}) {
  return (
    <section className={`${styles.doc3Section} ${styles.doc3FullRow}`}>
      <div className={styles.doc3SectionHeader}>
        <div>
          <div className={styles.cardEyebrow}>상단 영역</div>
          <h3 className={styles.cardTitle}>현장 전경</h3>
        </div>
        <p className={styles.fieldAssist}>문서 첫 줄에 좌우 2칸으로 들어갑니다.</p>
      </div>

      <div className={styles.doc3SectionGrid}>
        {items.map((item, index) => (
          <article key={item.id} className={`${styles.card} ${styles.doc3SlotCard}`}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.doc3SlotIndex}>{`전경 슬롯 ${index + 1}`}</div>
                <h3 className={styles.cardTitle}>{getFixedSceneTitle(index)}</h3>
              </div>
            </div>
            <UploadBox id={`scene-photo-${item.id}`} label="전경 사진" value={item.photoUrl} onClear={() => onClear(item.id)} onSelect={async (file) => onUpload(item.id, file)} />
            <label className={styles.field}>
              <span className={styles.fieldLabel}>사진 설명</span>
              <input type="text" className="app-input" placeholder="예: 현장 전경, 자재 적치 및 작업구간 전반" value={item.description} onChange={(event) => onDescriptionChange(item.id, event.target.value)} />
            </label>
          </article>
        ))}
      </div>
    </section>
  );
}
