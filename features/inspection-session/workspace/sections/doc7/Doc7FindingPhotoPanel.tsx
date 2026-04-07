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
      <div className={styles.doc7PhotoTableWrap}>
        <table className={styles.doc7PhotoTable}>
          <tbody>
            <tr>
              <th scope="row" className={styles.doc7PhotoLabelCell}>
                <span className={styles.doc7PhotoLabelText}>현장 사진 1</span>
                {item.photoUrl ? (
                  <span className={styles.doc7PhotoLabelOverlay}>
                    <button
                      type="button"
                      className={styles.doc7AiActionButton}
                      onClick={() => void onAiRetry()}
                      disabled={isAnalyzing}
                    >
                      AI 다시 채우기
                    </button>
                    {isAnalyzing ? (
                      <span
                        className={`${styles.doc3AiInline} ${styles.doc7AiActionInline}`}
                        role="status"
                        aria-live="polite"
                      >
                        <span className={styles.doc3AiSpinner} aria-hidden />
                        <span className={styles.doc3AiCaption}>(ai 생성중)</span>
                      </span>
                    ) : null}
                  </span>
                ) : null}
              </th>
            </tr>
            <tr>
              <td className={styles.doc7PhotoValueCell}>
                <UploadBox
                  id={`finding-photo-1-${item.id}`}
                  label="현장 사진 1"
                  labelLayout="field"
                  fieldClearOverlay
                  value={item.photoUrl}
                  onClear={() => updateFinding((finding) => ({ ...finding, photoUrl: '' }))}
                  onSelect={async (file) => onPhotoSelect(1, file)}
                />
              </td>
            </tr>
            <tr>
              <th scope="row" className={styles.doc7PhotoLabelCell}>
                현장 사진 2
              </th>
            </tr>
            <tr>
              <td className={styles.doc7PhotoValueCell}>
                <UploadBox
                  id={`finding-photo-2-${item.id}`}
                  label="현장 사진 2"
                  labelLayout="field"
                  fieldClearOverlay
                  value={item.photoUrl2 ?? ''}
                  onClear={() => updateFinding((finding) => ({ ...finding, photoUrl2: '' }))}
                  onSelect={async (file) => onPhotoSelect(2, file)}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {aiError ? <p className={styles.fieldAssistError}>{aiError}</p> : null}
    </div>
  );
}
