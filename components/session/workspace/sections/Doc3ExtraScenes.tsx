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

      <div className={styles.doc3TableWrap}>
        <table className={styles.doc3UnifiedTable}>
          <colgroup>
            <col className={styles.doc3QuarterCol} />
            <col className={styles.doc3QuarterCol} />
            <col className={styles.doc3QuarterCol} />
            <col className={styles.doc3QuarterCol} />
          </colgroup>
          <tbody>
            <tr>
              {items.map((item, index) => (
                <th
                  key={`photo-title-${item.id}`}
                  scope="col"
                  className={styles.doc3TitleCell}
                >
                  <span className={styles.doc3TitleCellText}>{`공정 사진 ${index + 1}`}</span>
                </th>
              ))}
            </tr>
            <tr>
              {items.map((item, index) => {
                const sceneIndex = index + FIXED_SCENE_COUNT;
                const defaultTitle = getExtraSceneTitle(sceneIndex);

                return (
                  <td key={`photo-cell-${item.id}`} className={styles.doc3ImageCellCompact}>
                    <UploadBox
                      id={`scene-extra-photo-${item.id}`}
                      label={`공정 사진 ${index + 1}`}
                      labelLayout="field"
                      value={item.photoUrl}
                      fieldClearOverlay
                      onClear={() => onClear(item.id)}
                      onSelect={async (file) => onUpload(item.id, file, defaultTitle)}
                    />
                  </td>
                );
              })}
            </tr>
            <tr>
              {items.map((item) => (
                <th
                  key={`name-title-${item.id}`}
                  scope="col"
                  className={styles.doc3SubLabelCell}
                >
                  <div className={styles.doc3TitleCellInner}>
                    <span className={styles.doc3TitleCellText}>공정명</span>
                    {isAnalyzing(item.id) ? (
                      <span className={styles.doc3AiInline} role="status" aria-live="polite">
                        <span className={styles.doc3AiSpinner} aria-hidden />
                        <span className={styles.doc3AiCaption}>AI 정리 중</span>
                      </span>
                    ) : null}
                  </div>
                </th>
              ))}
            </tr>
            <tr>
              {items.map((item, index) => {
                const sceneIndex = index + FIXED_SCENE_COUNT;
                const defaultTitle = getExtraSceneTitle(sceneIndex);

                return (
                  <td key={`name-cell-${item.id}`} className={styles.doc3InputValueCell}>
                    <input
                      type="text"
                      className={`app-input ${styles.doc3SceneTitleInput}`}
                      placeholder={`${defaultTitle} 예: 천장 배관 설치, 거푸집 해체 작업`}
                      value={item.title}
                      onChange={(event) => onTitleChange(item.id, event.target.value)}
                    />
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
