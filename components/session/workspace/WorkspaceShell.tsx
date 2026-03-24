'use client';

import Link from 'next/link';
import { useState } from 'react';

import AppModal from '@/components/ui/AppModal';
import { INSPECTION_SECTIONS, getSessionTitle } from '@/constants/inspectionSession';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import WorkerAppHeader from '@/components/worker/WorkerAppHeader';
import WorkerMenuSidebar from '@/components/worker/WorkerMenuSidebar';
import WorkerShellBody from '@/components/worker/WorkerShellBody';
import { WorkerMenuDrawer, WorkerMenuPanel } from '@/components/worker/WorkerMenu';
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
  /** 문서 제목(h2)과 같은 행에 표시(위험요인 추가 등) */
  sectionToolbar?: React.ReactNode;
  session: InspectionSession;
  site: InspectionSite | null;
  syncError: string | null;
  uploadError: string | null;
}

export default function WorkspaceShell({
  backHref,
  currentSection,
  currentSectionIndex,
  currentSectionMeta: _currentSectionMeta,
  documentError,
  isGeneratingDocument,
  isSaving: _isSaving,
  moveSection,
  onGenerateDocument,
  onMetaChange,
  onSave: _onSave,
  onSectionSelect,
  progress,
  renderSection,
  sectionToolbar,
  session,
  site: _site,
  syncError,
  uploadError,
}: WorkspaceShellProps) {
  const [metaModalOpen, setMetaModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { currentUser, logout } = useInspectionSessions();
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
          <WorkerAppHeader
            currentUserName={currentUser?.name}
            onLogout={logout}
            onOpenMenu={() => setMenuOpen(true)}
          />

          <WorkerShellBody>
            <WorkerMenuSidebar>
              <WorkerMenuPanel />
            </WorkerMenuSidebar>

            <div className={styles.workspacePanel}>
              <header className={styles.header}>
                <div className={styles.headerBody}>
                  <Link
                    href={backHref}
                    className={styles.headerBackLink}
                    aria-label="이전 화면으로 돌아가기"
                  >
                    {'<'} 이전
                  </Link>
                  <div className={styles.headerMain}>
                    <h1 className={styles.headerTitle}>
                      기술 지도 - {getSessionTitle(session)}
                    </h1>
                  </div>
                </div>
              </header>

              <div className={styles.workspace}>
                <div className={styles.workspaceToolbar}>
                  <div
                    className={styles.workspaceToolbarMain}
                    role="group"
                    aria-label="문서 선택, 진행률, 기본 정보"
                  >
                    <span
                      className={styles.toolbarAxisLabel}
                      id="workspace-toolbar-doc-heading"
                    >
                      문서 선택
                    </span>
                    <div className={styles.toolbarCellSelect}>
                      <select
                        className="app-select"
                        value={currentSection}
                        onChange={(event) =>
                          onSectionSelect(event.target.value as InspectionSectionKey)
                        }
                        aria-labelledby="workspace-toolbar-doc-heading"
                      >
                        {INSPECTION_SECTIONS.map((section) => (
                          <option key={section.key} value={section.key}>
                            {`${section.compactLabel}. ${section.shortLabel}`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <span
                      className={styles.toolbarAxisLabel}
                      id="workspace-toolbar-progress-heading"
                    >
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
                            <span className={styles.toolbarProgressFillPercent}>
                              {progress.percentage}%
                            </span>
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
                      onClick={() => setMetaModalOpen(true)}
                    >
                      기본 정보
                    </button>
                  </div>

                  {uploadError ? <p className={styles.workspaceError}>{uploadError}</p> : null}
                  {syncError ? <p className={styles.workspaceError}>{syncError}</p> : null}
                  {documentError ? <p className={styles.workspaceError}>{documentError}</p> : null}
                </div>

                <section className={styles.editor}>
                  <div className={styles.editorCard}>
                    <div className={styles.editorHeader}>
                      <h2 className={styles.editorTitle}>{currentSectionInfo.label}</h2>
                      {sectionToolbar ? (
                        <div className={styles.editorHeaderToolbar}>{sectionToolbar}</div>
                      ) : null}
                    </div>
                    <div className={styles.editorBody}>{renderSection}</div>
                  </div>
                </section>
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
            </div>
          </WorkerShellBody>
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

      <WorkerMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </main>
  );
}
