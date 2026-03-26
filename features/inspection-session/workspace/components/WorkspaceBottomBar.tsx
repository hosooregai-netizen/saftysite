import styles from '@/components/session/InspectionSessionWorkspace.module.css';

interface WorkspaceBottomBarProps {
  canMoveNext: boolean;
  canMovePrev: boolean;
  isGeneratingDocument: boolean;
  isGeneratingHwpx: boolean;
  isGeneratingPdf: boolean;
  isLastSection: boolean;
  moveSection: (direction: -1 | 1) => void;
  onGenerateHwpxDocument: () => void;
  onGeneratePdfDocument: () => void;
}

export function WorkspaceBottomBar({
  canMoveNext,
  canMovePrev,
  isGeneratingDocument,
  isGeneratingHwpx,
  isGeneratingPdf,
  isLastSection,
  moveSection,
  onGenerateHwpxDocument,
  onGeneratePdfDocument,
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
          <>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={onGenerateHwpxDocument}
              disabled={isGeneratingDocument}
            >
              {isGeneratingHwpx ? '한글 파일 생성 중...' : '한글 파일 생성'}
            </button>
            <button
              type="button"
              className="app-button app-button-primary"
              onClick={onGeneratePdfDocument}
              disabled={isGeneratingDocument}
            >
              {isGeneratingPdf ? 'PDF 생성 중...' : 'PDF 보고서 생성'}
            </button>
          </>
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
