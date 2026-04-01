'use client';

import { useState } from 'react';
import { AdminMenuDrawer, AdminMenuPanel } from '@/components/admin/AdminMenu';
import { INSPECTION_SECTIONS } from '@/constants/inspectionSession';
import WorkerAppHeader from '@/components/worker/WorkerAppHeader';
import WorkerMenuSidebar from '@/components/worker/WorkerMenuSidebar';
import WorkerShellBody from '@/components/worker/WorkerShellBody';
import { WorkerMenuDrawer, WorkerMenuPanel } from '@/components/worker/WorkerMenu';
import type { InspectionSectionKey, InspectionSession } from '@/types/inspectionSession';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import { WorkspaceHeader } from '@/features/inspection-session/workspace/components/WorkspaceHeader';
import { WorkspaceMetaModal } from '@/features/inspection-session/workspace/components/WorkspaceMetaModal';
import { WorkspaceToolbar } from '@/features/inspection-session/workspace/components/WorkspaceToolbar';

interface WorkspaceShellProps {
  backHref: string;
  currentSection: InspectionSectionKey;
  currentSectionIndex: number;
  currentUserName?: string;
  documentError: string | null;
  generateHwpxDocument: () => Promise<void>;
  generatePdfDocument: () => Promise<void>;
  isAdminView: boolean;
  isGeneratingHwpx: boolean;
  isGeneratingPdf: boolean;
  moveSection: (direction: -1 | 1) => void;
  onLogout: () => void;
  onMetaChange: (field: keyof InspectionSession['meta'], value: string) => void;
  onSectionSelect: (key: InspectionSectionKey) => void;
  progress: { completed: number; total: number; percentage: number };
  renderSection: React.ReactNode;
  sectionToolbar?: React.ReactNode;
  session: InspectionSession;
  syncError: string | null;
  uploadError: string | null;
}

export function WorkspaceShell({
  backHref,
  currentSection,
  currentSectionIndex,
  currentUserName,
  documentError,
  generateHwpxDocument,
  generatePdfDocument,
  isAdminView,
  isGeneratingHwpx,
  isGeneratingPdf,
  moveSection,
  onLogout,
  onMetaChange,
  onSectionSelect,
  progress,
  renderSection,
  sectionToolbar,
  session,
  syncError,
  uploadError,
}: WorkspaceShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [metaModalOpen, setMetaModalOpen] = useState(false);
  const canMovePrev = currentSectionIndex > 0;
  const canMoveNext = currentSectionIndex < INSPECTION_SECTIONS.length - 1;
  const currentSectionInfo =
    INSPECTION_SECTIONS.find((section) => section.key === currentSection) ??
    INSPECTION_SECTIONS[0];

  return (
    <main className="app-page">
      <div className="app-container">
        <section className={`app-shell ${styles.shell}`}>
          <WorkerAppHeader
            currentUserName={currentUserName}
            onLogout={onLogout}
            onOpenMenu={() => setMenuOpen(true)}
          />

          <WorkerShellBody>
            <WorkerMenuSidebar>
              {isAdminView ? (
                <AdminMenuPanel activeSection="headquarters" currentSiteKey={session.siteKey} />
              ) : (
                <WorkerMenuPanel currentSiteKey={session.siteKey} />
              )}
            </WorkerMenuSidebar>

            <div className={styles.workspacePanel}>
              <WorkspaceHeader backHref={backHref} session={session} />

              <div className={styles.workspaceContentFrame}>
                <div className={styles.workspace}>
                  <WorkspaceToolbar
                    canMoveNext={canMoveNext}
                    canMovePrev={canMovePrev}
                    currentSection={currentSection}
                    errors={[uploadError, syncError, documentError]}
                    moveSection={moveSection}
                    onOpenMeta={() => setMetaModalOpen(true)}
                    onSectionSelect={onSectionSelect}
                    progress={progress}
                  />

                  <section className={styles.editor}>
                    <div className={styles.editorCard}>
                      <div className={styles.editorHeader}>
                        <h2 className={styles.editorTitle}>{currentSectionInfo.label}</h2>
                        <div className={styles.editorHeaderToolbar}>
                          {sectionToolbar}
                          <div className={styles.editorDocumentActions}>
                            <button
                              type="button"
                              className="app-button app-button-secondary"
                              disabled={isGeneratingHwpx || isGeneratingPdf}
                              onClick={() => void generateHwpxDocument()}
                            >
                              {isGeneratingHwpx ? 'HWPX 생성 중...' : 'HWPX 다운로드'}
                            </button>
                            <button
                              type="button"
                              className="app-button app-button-secondary"
                              disabled={isGeneratingHwpx || isGeneratingPdf}
                              onClick={() => void generatePdfDocument()}
                            >
                              {isGeneratingPdf ? 'PDF 생성 중...' : 'PDF 다운로드'}
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className={styles.editorBody}>{renderSection}</div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </WorkerShellBody>
        </section>
      </div>

      <WorkspaceMetaModal
        meta={session.meta}
        onClose={() => setMetaModalOpen(false)}
        onMetaChange={onMetaChange}
        open={metaModalOpen}
      />

      {isAdminView ? (
        <AdminMenuDrawer
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          activeSection="headquarters"
          currentSiteKey={session.siteKey}
        />
      ) : (
        <WorkerMenuDrawer
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          currentSiteKey={session.siteKey}
        />
      )}
    </main>
  );
}
