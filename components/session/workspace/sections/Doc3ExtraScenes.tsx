import { UploadBox } from '@/components/session/workspace/widgets';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import { FIXED_SCENE_COUNT } from '@/constants/inspectionSession/catalog';
import { getExtraSceneTitle } from '@/constants/inspectionSession/scenePhotos';
import type { SiteScenePhoto } from '@/types/inspectionSession';

export default function Doc3ExtraScenes({
  items,
  isAnalyzing,
  onClear,
  onDescriptionChange,
  onTitleChange,
  onUpload,
}: {
  items: SiteScenePhoto[];
  isAnalyzing: (sceneId: string) => boolean;
  onClear: (sceneId: string, defaultTitle: string) => void;
  onDescriptionChange: (sceneId: string, value: string) => void;
  onTitleChange: (sceneId: string, value: string) => void;
  onUpload: (sceneId: string, file: File, defaultTitle: string) => Promise<void>;
}) {
  return (
    <section className={`${styles.doc3Section} ${styles.doc3FullRow}`}>
      <div className={styles.doc3SectionHeader}>
        <div>
          <div className={styles.cardEyebrow}>하단 영역</div>
          <h3 className={styles.cardTitle}>주요 진행공정</h3>
        </div>
        <p className={styles.fieldAssist}>문서 하단 4칸에 순서대로 배치됩니다.</p>
      </div>

      <div className={styles.doc3SectionGrid}>
        {items.map((item, index) => {
          const sceneIndex = index + FIXED_SCENE_COUNT;
          const defaultTitle = getExtraSceneTitle(sceneIndex);
          const analyzing = isAnalyzing(item.id);

          return (
            <article key={item.id} className={`${styles.card} ${styles.doc3SlotCard}`}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.doc3SlotIndex}>{`공정 슬롯 ${index + 1}`}</div>
                  <h3 className={styles.cardTitle}>{defaultTitle}</h3>
                </div>
                {analyzing ? <span className="app-chip">AI 분석 중</span> : null}
              </div>
              <UploadBox id={`scene-extra-photo-${item.id}`} label="공정 사진" value={item.photoUrl} onClear={() => onClear(item.id, defaultTitle)} onSelect={async (file) => onUpload(item.id, file, defaultTitle)} />
              <label className={styles.field}>
                <span className={styles.fieldLabel}>공정명</span>
                <input type="text" className="app-input" placeholder="예: 철근 배근 작업, 거푸집 설치 작업" value={item.title} onChange={(event) => onTitleChange(item.id, event.target.value)} />
              </label>
              <p className={styles.fieldAssist}>
                {analyzing
                  ? '업로드한 사진을 바탕으로 공정명을 자동 제안하고 있습니다.'
                  : '사진 업로드 후 AI가 공정명을 먼저 제안합니다. 필요하면 바로 수정하면 됩니다.'}
              </p>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>사진 설명</span>
                <input type="text" className="app-input" placeholder="예: 철근 배근 상태 및 작업 동선 확인" value={item.description} onChange={(event) => onDescriptionChange(item.id, event.target.value)} />
              </label>
            </article>
          );
        })}
      </div>
    </section>
  );
}
