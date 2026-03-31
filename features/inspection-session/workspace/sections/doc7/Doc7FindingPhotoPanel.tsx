import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import { UploadBox } from '@/components/session/workspace/widgets';
import type { CurrentHazardFinding } from '@/types/inspectionSession';

interface Doc7FindingPhotoPanelProps {
  aiError: string;
  isAnalyzing: boolean;
  item: CurrentHazardFinding;
  onAiRetry: () => Promise<void>;
  onPhotoSelect: (slot: 1 | 2, file: File) => Promise<void>;
  updateFinding: (updater: (finding: CurrentHazardFinding) => CurrentHazardFinding) => void;
}

export function Doc7FindingPhotoPanel({
  aiError,
  isAnalyzing,
  item,
  onAiRetry,
  onPhotoSelect,
  updateFinding,
}: Doc7FindingPhotoPanelProps) {
  return (
    <div className={styles.doc7PhotoColumn}>
      <div className={styles.doc7ScenePhotoRow}>
        <UploadBox
          id={`finding-photo-1-${item.id}`}
          label="현장 사진 1"
          labelLayout="field"
          fieldClearOverlay
          value={item.photoUrl}
          onClear={() => updateFinding((finding) => ({ ...finding, photoUrl: '' }))}
          onSelect={async (file) => onPhotoSelect(1, file)}
        />
        <UploadBox
          id={`finding-photo-2-${item.id}`}
          label="현장 사진 2"
          labelLayout="field"
          fieldClearOverlay
          value={item.photoUrl2 ?? ''}
          onClear={() => updateFinding((finding) => ({ ...finding, photoUrl2: '' }))}
          onSelect={async (file) => onPhotoSelect(2, file)}
        />
      </div>
      {aiError ? <p className={styles.fieldAssistError}>{aiError}</p> : null}
      <div className={styles.doc7AiActions}>
        {item.photoUrl ? (
          <>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => void onAiRetry()}
              disabled={isAnalyzing}
            >
              AI 다시 채우기
            </button>
            {isAnalyzing ? (
              <span className={styles.doc3AiInline} role="status" aria-live="polite">
                <span className={styles.doc3AiSpinner} aria-hidden />
                <span className={styles.doc3AiCaption}>(ai 생성중)</span>
              </span>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
