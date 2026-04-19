'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useState } from 'react';
import { AdminMenuDrawer, AdminMenuPanel } from '@/components/admin/AdminMenu';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import WorkerAppHeader from '@/components/worker/WorkerAppHeader';
import WorkerShellBody from '@/components/worker/WorkerShellBody';
import { WorkerMenuDrawer, WorkerMenuPanel } from '@/components/worker/WorkerMenu';
import WorkerMenuSidebar from '@/components/worker/WorkerMenuSidebar';
import { WorkspaceHeader } from '@/features/inspection-session/workspace/components/WorkspaceHeader';
import { WorkspaceMetaModal } from '@/features/inspection-session/workspace/components/WorkspaceMetaModal';
import { WorkspaceToolbar } from '@/features/inspection-session/workspace/components/WorkspaceToolbar';
import { INSPECTION_WORKSPACE_SECTIONS } from '@/features/inspection-session/workspace/workspaceSections';
import type { InspectionSectionKey, InspectionSession } from '@/types/inspectionSession';

interface WorkspaceShellProps {
  backHref: string;
  currentSection: InspectionSectionKey;
  currentSectionIndex: number;
  currentHeadquarterId?: string | null;
  currentUserName?: string;
  documentError: string | null;
  generateHwpxDocument: () => Promise<void>;
  generatePdfDocument: () => Promise<void>;
  isAdminView: boolean;
  isGeneratingHwpx: boolean;
  isGeneratingPdf: boolean;
  isInteractive?: boolean;
  moveSection: (direction: -1 | 1) => void;
  onLogout: () => void;
  onMetaChange: (field: keyof InspectionSession['meta'], value: string) => void;
  onSectionSelect: (key: InspectionSectionKey) => void;
  photoAlbumHref?: string | null;
  progress: { completed: number; total: number; percentage: number };
  relationNotice?: string | null;
  renderSection: ReactNode;
  sectionToolbar?: ReactNode;
  session: InspectionSession;
  syncError: string | null;
  uploadError: string | null;
}

export function WorkspaceShell({
  backHref,
  currentSection,
  currentSectionIndex,
  currentHeadquarterId = null,
  currentUserName,
  documentError,
  generateHwpxDocument,
  generatePdfDocument,
  isAdminView,
  isGeneratingHwpx,
  isGeneratingPdf,
  isInteractive = true,
  moveSection,
  onLogout,
  onMetaChange,
  onSectionSelect,
  photoAlbumHref,
  progress,
  relationNotice,
  renderSection,
  sectionToolbar,
  session,
  syncError,
  uploadError,
}: WorkspaceShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [metaModalOpen, setMetaModalOpen] = useState(false);
  const canMovePrev = currentSectionIndex > 0;
  const canMoveNext = currentSectionIndex < INSPECTION_WORKSPACE_SECTIONS.length - 1;
  const currentSectionInfo =
    INSPECTION_WORKSPACE_SECTIONS.find((section) => section.key === currentSection) ??
    INSPECTION_WORKSPACE_SECTIONS[0];

  return (
    <main className="app-page">
      <div className="app-container">
        <section className={`app-shell ${styles.shell}`}>
          <WorkerAppHeader
            brandHref={isAdminView ? '/admin' : '/'}
            currentUserName={currentUserName}
            onLogout={onLogout}
            onOpenMenu={() => setMenuOpen(true)}
          />

          <WorkerShellBody>
            <WorkerMenuSidebar>
              {isAdminView ? (
                <AdminMenuPanel
                  activeSection="headquarters"
                  currentHeadquarterId={currentHeadquarterId}
                  currentSiteKey={session.siteKey}
                />
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
                    disabled={!isInteractive}
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
                            {photoAlbumHref ? (
                              <Link
                                href={photoAlbumHref}
                                className="app-button app-button-secondary"
                              >
                                사진첩 열기
                              </Link>
                            ) : null}
                            <button
                              type="button"
                              className="app-button app-button-secondary"
                              disabled={!isInteractive || isGeneratingHwpx || isGeneratingPdf}
                              onClick={() => void generateHwpxDocument()}
                            >
                              {isGeneratingHwpx ? 'HWPX 생성 중..' : 'HWPX 다운로드'}
                            </button>
                            <button
                              type="button"
                              className="app-button app-button-secondary"
                              disabled={!isInteractive || isGeneratingHwpx || isGeneratingPdf}
                              onClick={() => void generatePdfDocument()}
                            >
                              {isGeneratingPdf ? 'PDF 생성 중..' : 'PDF 다운로드'}
                            </button>
                          </div>
                        </div>
                      </div>
                      {relationNotice ? (
                        <div className={styles.relationNotice} role="status">
                          {relationNotice}
                        </div>
                      ) : null}
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
          currentHeadquarterId={currentHeadquarterId}
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
