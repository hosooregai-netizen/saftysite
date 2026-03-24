'use client';

import { useState } from 'react';
import AppModal from '@/components/ui/AppModal';
import {
  INSPECTION_SECTIONS,
  getSectionCompletion,
  getSessionTitle,
} from '@/constants/inspectionSession';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import {
  WorkerMenuButton,
  WorkerMenuDrawer,
  WorkerMenuPanel,
} from '@/components/worker/WorkerMenu';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type {
  InspectionSectionKey,
  InspectionSession,
  InspectionSite,
} from '@/types/inspectionSession';

interface WorkspaceShellProps {
  backHref: string;
  currentSection: InspectionSectionKey;
  currentSectionIndex: number;
  currentSectionMeta: InspectionSession['documentsMeta'][InspectionSectionKey];
  documentError: string | null;
  isGeneratingDocument: boolean;
  isSaving: boolean;
  moveSection: (direction: -1 | 1) => void;
  onGenerateDocument: () => void;
  onMetaChange: (field: keyof InspectionSession['meta'], value: string) => void;
  onSave: () => void;
  onSectionSelect: (key: InspectionSectionKey) => void;
  progress: { completed: number; total: number; percentage: number };
  renderSection: React.ReactNode;
  session: InspectionSession;
  site: InspectionSite | null;
  syncError: string | null;
  uploadError: string | null;
}

export default function WorkspaceShell({
  backHref: _backHref,
  currentSection,
  currentSectionIndex,
  currentSectionMeta: _currentSectionMeta,
  documentError,
  isGeneratingDocument,
  isSaving,
  moveSection,
  onGenerateDocument,
  onMetaChange,
  onSave,
  onSectionSelect,
  progress,
  renderSection,
  session,
  site: _site,
  syncError,
  uploadError,
}: WorkspaceShellProps) {
  const [metaModalOpen, setMetaModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { currentUser, sites, logout } = useInspectionSessions();
  const currentSectionInfo =
    INSPECTION_SECTIONS.find((section) => section.key === currentSection) ||
    INSPECTION_SECTIONS[0];
  const canMovePrev = currentSectionIndex > 0;
  const canMoveNext = currentSectionIndex < INSPECTION_SECTIONS.length - 1;
  const isLastSection = !canMoveNext;

  return (
    <main className="app-page">
      <div className="app-container">
        <section className={`app-shell ${styles.shell}`}>
          <header className={styles.header}>
            <div className={styles.headerTop}>
              <div className={styles.mobileMenuOnly}>
                <WorkerMenuButton onClick={() => setMenuOpen(true)} />
              </div>
            </div>

            <div className={styles.headerBody}>
              <div className={styles.headerMain}>
                <h1 className={styles.headerTitle}>{getSessionTitle(session)}</h1>
              </div>

              <div className={styles.headerSide}>
                <div className={styles.progressCard}>
                  <div className={styles.progressCluster}>
                    <div className={styles.progressSummary}>
                      <strong className={styles.progressValue}>
                        {progress.completed}/{progress.total} ({progress.percentage}%)
                      </strong>
                      <span className={styles.progressCaption}>진행률</span>
                    </div>
                    <div className={styles.progressTrack} aria-hidden="true">
                      <span
                        className={styles.progressFill}
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="app-button app-button-secondary"
                    onClick={onSave}
                  >
                    {isSaving ? '저장 중...' : '저장하기'}
                  </button>
                </div>

                {uploadError ? <p className={styles.headerError}>{uploadError}</p> : null}
                {syncError ? <p className={styles.headerError}>{syncError}</p> : null}
                {documentError ? <p className={styles.headerError}>{documentError}</p> : null}
              </div>
            </div>
          </header>

          <div className={styles.shellBody}>
            <aside className={styles.menuSidebar}>
              <WorkerMenuPanel
                currentUserName={currentUser?.name}
                siteCount={sites.length}
                onLogout={logout}
              />
            </aside>

            <div className={styles.workspacePanel}>
              <div className={styles.workspace}>
                <div className={styles.topRail}>
                  <div className={styles.topRailHeader}>
                    <div className={styles.topRailActions}>
                      <div className={styles.topRailPrimaryActions}>
                        <button
                          type="button"
                          className="app-button app-button-secondary"
                          onClick={() => setMetaModalOpen(true)}
                        >
                          기본 정보
                        </button>
                        <button
                          type="button"
                          className="app-button app-button-secondary"
                          onClick={onSave}
                        >
                          {isSaving ? '저장 중...' : '저장'}
                        </button>
                      </div>

                      <div className={styles.topRailStatus}>
                        <span className="app-chip">
                          문서 {currentSectionIndex + 1}/{INSPECTION_SECTIONS.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.quickControls}>
                    <label className={styles.sectionPicker}>
                      <select
                        className="app-select"
                        value={currentSection}
                        onChange={(event) =>
                          onSectionSelect(event.target.value as InspectionSectionKey)
                        }
                      >
                        {INSPECTION_SECTIONS.map((section) => (
                          <option key={section.key} value={section.key}>
                            {`${section.compactLabel}. ${section.shortLabel}`}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className={styles.quickMoveButtons}>
                      <button
                        type="button"
                        className="app-button app-button-secondary"
                        disabled={!canMovePrev}
                        onClick={() => moveSection(-1)}
                      >
                        이전
                      </button>
                      <button
                        type="button"
                        className="app-button app-button-primary"
                        disabled={!canMoveNext}
                        onClick={() => moveSection(1)}
                      >
                        다음
                      </button>
                    </div>
                  </div>

                  <nav className={styles.navRail} aria-label="문서 이동">
                    {INSPECTION_SECTIONS.map((section) => {
                      const isActive = section.key === currentSection;
                      const isCompleted = getSectionCompletion(session, section.key);

                      return (
                        <button
                          key={section.key}
                          type="button"
                          className={[
                            styles.navTab,
                            isActive ? styles.navTabActive : '',
                            isCompleted ? styles.navTabCompleted : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          onClick={() => onSectionSelect(section.key)}
                        >
                          <span className={styles.navIndex}>{section.compactLabel}</span>
                          <span className={styles.navTabText}>
                            <strong>{section.shortLabel}</strong>
                          </span>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                <section className={styles.editor}>
                  <div className={styles.editorCard}>
                    <div className={styles.editorHeader}>
                      <div>
                        <h2 className={styles.editorTitle}>{currentSectionInfo.label}</h2>
                      </div>
                    </div>
                    <div className={styles.editorBody}>{renderSection}</div>
                  </div>
                </section>
              </div>
            </div>
          </div>

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
              <button type="button" className="app-button app-button-secondary" onClick={onSave}>
                {isSaving ? '저장 중' : '저장'}
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
        </section>
      </div>

      <AppModal
        open={metaModalOpen}
        title="보고서 기본 정보"
        size="large"
        onClose={() => setMetaModalOpen(false)}
        actions={
          <button
            type="button"
            className="app-button app-button-primary"
            onClick={() => setMetaModalOpen(false)}
          >
            완료
          </button>
        }
      >
        <div className={styles.metaModal}>
          <div className={styles.metaGrid}>
            {(['siteName', 'reportDate', 'drafter', 'reviewer', 'approver'] as const).map(
              (field) => (
                <label key={field} className={styles.metaField}>
                  <span className={styles.metaLabel}>
                    {field === 'siteName'
                      ? '현장명'
                      : field === 'reportDate'
                        ? '작성일'
                        : field === 'drafter'
                          ? '담당'
                          : field === 'reviewer'
                            ? '검토'
                            : '확인'}
                  </span>
                  <input
                    type={field === 'reportDate' ? 'date' : 'text'}
                    className="app-input"
                    value={session.meta[field]}
                    onChange={(event) => onMetaChange(field, event.target.value)}
                  />
                </label>
              )
            )}
          </div>
        </div>
      </AppModal>

      <WorkerMenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        currentUserName={currentUser?.name}
        siteCount={sites.length}
        onLogout={logout}
      />
    </main>
  );
}
