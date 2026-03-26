import styles from '@/components/session/InspectionSessionWorkspace.module.css';

interface WorkspaceBottomBarProps {
  canMoveNext: boolean;
  canMovePrev: boolean;
  isGeneratingDocument: boolean;
  isLastSection: boolean;
  moveSection: (direction: -1 | 1) => void;
  onGenerateDocument: () => void;
}

export function WorkspaceBottomBar({
  canMoveNext,
  canMovePrev,
  isGeneratingDocument,
  isLastSection,
  moveSection,
  onGenerateDocument,
}: WorkspaceBottomBarProps) {
  return (
    <footer className={styles.bottomBar}>
      <div className={styles.bottomActions}>
        <button
          type="button"
          className="app-button app-button-secondary"
          disabled={!canMovePrev}
          onClick={() => moveSection(-1)}
        >
          이전 문서
        </button>
        {isLastSection ? (
          <button
            type="button"
            className="app-button app-button-primary"
            onClick={onGenerateDocument}
            disabled={isGeneratingDocument}
          >
            {isGeneratingDocument ? '문서 생성 중...' : '보고서 생성하기'}
          </button>
        ) : (
          <button
            type="button"
            className="app-button app-button-primary"
            disabled={!canMoveNext}
            onClick={() => moveSection(1)}
          >
            다음 문서
          </button>
        )}
      </div>
    </footer>
  );
}

