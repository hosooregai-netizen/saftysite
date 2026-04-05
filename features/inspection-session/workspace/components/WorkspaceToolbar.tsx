import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import { INSPECTION_SECTIONS } from '@/constants/inspectionSession';
import type { InspectionSectionKey } from '@/types/inspectionSession';

interface WorkspaceToolbarProps {
  canMoveNext: boolean;
  canMovePrev: boolean;
  currentSection: InspectionSectionKey;
  disabled?: boolean;
  errors: Array<string | null>;
  moveSection: (direction: -1 | 1) => void;
  onOpenMeta: () => void;
  onSectionSelect: (key: InspectionSectionKey) => void;
  progress: { completed: number; total: number; percentage: number };
}

export function WorkspaceToolbar({
  canMoveNext,
  canMovePrev,
  currentSection,
  disabled = false,
  errors,
  moveSection,
  onOpenMeta,
  onSectionSelect,
  progress,
}: WorkspaceToolbarProps) {
  return (
    <div className={styles.workspaceToolbar}>
      <div
        className={styles.workspaceToolbarMain}
        role="group"
        aria-label="문서 선택, 기본 정보, 진행률과 문서 이동 도구"
      >
        <span className={styles.toolbarAxisLabel} id="workspace-toolbar-doc-heading">
          문서 선택
        </span>
        <div className={styles.toolbarCellSelect}>
          <select
            className="app-select"
            disabled={disabled}
            value={currentSection}
            onChange={(event) => onSectionSelect(event.target.value as InspectionSectionKey)}
            aria-labelledby="workspace-toolbar-doc-heading"
          >
            {INSPECTION_SECTIONS.map((section) => (
              <option key={section.key} value={section.key}>
                {`${section.compactLabel}. ${section.shortLabel}`}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className={`app-button app-button-secondary ${styles.toolbarMetaButton}`}
          disabled={disabled}
          onClick={onOpenMeta}
        >
          기본 정보
        </button>

        <span className={styles.toolbarAxisLabel} id="workspace-toolbar-progress-heading">
          진행률
        </span>
        <div
          className={styles.toolbarCellProgress}
          aria-labelledby="workspace-toolbar-progress-heading"
        >
          <div className={styles.toolbarProgressRow}>
            <div className={styles.toolbarProgressTrack}>
              <span
                className={styles.toolbarProgressFill}
                style={{ width: `${progress.percentage}%` }}
              >
                <span className={styles.toolbarProgressFillPercent}>{progress.percentage}%</span>
              </span>
            </div>
            <strong className={styles.toolbarProgressFraction}>
              {progress.completed}/{progress.total}
            </strong>
          </div>
        </div>

        <div className={styles.toolbarNavActions} role="group" aria-label="문서 이동">
          <button
            type="button"
            className="app-button app-button-secondary"
            disabled={disabled || !canMovePrev}
            onClick={() => moveSection(-1)}
          >
            이전
          </button>
          <button
            type="button"
            className="app-button app-button-primary"
            disabled={disabled || !canMoveNext}
            onClick={() => moveSection(1)}
          >
            다음
          </button>
        </div>
      </div>

      {errors.filter(Boolean).map((message) => (
        <p key={message} className={styles.workspaceError}>
          {message}
        </p>
      ))}
    </div>
  );
}
