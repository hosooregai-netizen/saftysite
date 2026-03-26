import { INSPECTION_SECTIONS } from '@/constants/inspectionSession';
import type { InspectionSectionKey } from '@/types/inspectionSession';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';

interface WorkspaceToolbarProps {
  currentSection: InspectionSectionKey;
  errors: Array<string | null>;
  onOpenMeta: () => void;
  onSectionSelect: (key: InspectionSectionKey) => void;
  progress: { completed: number; total: number; percentage: number };
}

export function WorkspaceToolbar({
  currentSection,
  errors,
  onOpenMeta,
  onSectionSelect,
  progress,
}: WorkspaceToolbarProps) {
  return (
    <div className={styles.workspaceToolbar}>
      <div
        className={styles.workspaceToolbarMain}
        role="group"
        aria-label="문서 선택과 진행률 정보"
      >
        <span className={styles.toolbarAxisLabel} id="workspace-toolbar-doc-heading">
          문서 선택
        </span>
        <div className={styles.toolbarCellSelect}>
          <select
            className="app-select"
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
        <button
          type="button"
          className={`app-button app-button-secondary ${styles.toolbarMetaButton}`}
          onClick={onOpenMeta}
        >
          기본 정보
        </button>
      </div>

      {errors.filter(Boolean).map((message) => (
        <p key={message} className={styles.workspaceError}>
          {message}
        </p>
      ))}
    </div>
  );
}

