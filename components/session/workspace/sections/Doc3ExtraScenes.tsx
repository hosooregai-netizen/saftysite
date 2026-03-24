import { UploadBox } from '@/components/session/workspace/widgets';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import { FIXED_SCENE_COUNT } from '@/constants/inspectionSession/catalog';
import { getExtraSceneTitle } from '@/constants/inspectionSession/scenePhotos';
import type { SiteScenePhoto } from '@/types/inspectionSession';

export default function Doc3ExtraScenes({
  items,
  isAnalyzing,
  onClear,
  onTitleChange,
  onUpload,
}: {
  items: SiteScenePhoto[];
  isAnalyzing: (sceneId: string) => boolean;
  onClear: (sceneId: string) => void;
  onTitleChange: (sceneId: string, value: string) => void;
  onUpload: (sceneId: string, file: File, defaultTitle: string) => Promise<void>;
}) {
  return (
    <section className={`${styles.doc3Section} ${styles.doc3FullRow}`}>
      <div className={styles.doc3SectionHeader}>
        <h3 className={styles.cardTitle}>주요 진행공정</h3>
      </div>

      <div className={styles.doc3SectionGrid}>
        {items.map((item, index) => {
          const sceneIndex = index + FIXED_SCENE_COUNT;
          const defaultTitle = getExtraSceneTitle(sceneIndex);
          const analyzing = isAnalyzing(item.id);

          return (
            <article key={item.id} className={`${styles.card} ${styles.doc3SlotCard}`}>
              <UploadBox
                id={`scene-extra-photo-${item.id}`}
                label={`공정 사진 ${index + 1}`}
                labelLayout="field"
                value={item.photoUrl}
                onClear={() => onClear(item.id)}
                onSelect={async (file) => onUpload(item.id, file, defaultTitle)}
              />
              <label className={styles.field}>
                <span className={styles.doc3ProcessNameLabelRow}>
                  <span className={styles.fieldLabel}>공정명</span>
                  {analyzing ? (
                    <span className={styles.doc3AiInline} role="status" aria-live="polite">
                      <span className={styles.doc3AiSpinner} aria-hidden />
                      <span className={styles.doc3AiCaption}>(ai 생성중)</span>
                    </span>
                  ) : null}
                </span>
                <input
                  type="text"
                  className={`app-input ${styles.doc3SceneTitleInput}`}
                  placeholder={`${defaultTitle} · 예: 철근 배근 작업, 거푸집 설치 작업`}
                  value={item.title}
                  onChange={(event) => onTitleChange(item.id, event.target.value)}
                />
              </label>
            </article>
          );
        })}
      </div>
    </section>
  );
}
