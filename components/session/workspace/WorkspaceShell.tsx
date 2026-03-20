'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppModal from '@/components/ui/AppModal';
import { INSPECTION_SECTIONS, getSectionCompletion, getSessionTitle, getSiteDisplayTitle } from '@/constants/inspectionSession';
import {
  DOCUMENT_SOURCE_LABELS,
  DOCUMENT_STATUS_LABELS,
  SECTION_DESCRIPTIONS,
} from '@/components/session/workspace/constants';
import { formatDateTime } from '@/components/session/workspace/utils';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { InspectionSectionKey, InspectionSession, InspectionSite } from '@/types/inspectionSession';

interface WorkspaceShellProps {
  backHref: string;
  currentSection: InspectionSectionKey;
  currentSectionIndex: number;
  currentSectionMeta: InspectionSession['documentsMeta'][InspectionSectionKey];
  isSaving: boolean;
  moveSection: (direction: -1 | 1) => void;
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
  backHref,
  currentSection,
  currentSectionIndex,
  currentSectionMeta,
  isSaving,
  moveSection,
  onMetaChange,
  onSave,
  onSectionSelect,
  progress,
  renderSection,
  session,
  site,
  syncError,
  uploadError,
}: WorkspaceShellProps) {
  const [metaModalOpen, setMetaModalOpen] = useState(false);
  const currentSectionInfo =
    INSPECTION_SECTIONS.find((section) => section.key === currentSection) || INSPECTION_SECTIONS[0];

  return (
    <main className="app-page">
      <div className="app-container">
        <section className={`app-shell ${styles.shell}`}>
          <header className={styles.header}>
            <div className={styles.headerMain}>
              <Link href={backHref} className={styles.backLink}>보고서 목록으로</Link>
              <div>
                <div className={styles.headerMeta}>
                  <span className="app-chip">HWPX 14문서</span>
                  <span className="app-chip">{site ? getSiteDisplayTitle(site) : session.meta.siteName || '현장'}</span>
                </div>
                <h1 className={styles.headerTitle}>{session.meta.siteName || '보고서'}</h1>
                <p className={styles.headerDescription}>{getSessionTitle(session)}</p>
              </div>
            </div>
            <div className={styles.headerSide}>
              <div className={styles.progressCard}>
                <div className={styles.progressMeta}>
                  <span className={styles.progressLabel}>문서 진행률</span>
                  <strong className={styles.progressValue}>{progress.completed}/{progress.total} ({progress.percentage}%)</strong>
                </div>
                <div className={styles.progressTrack} aria-hidden="true">
                  <span className={styles.progressFill} style={{ width: `${progress.percentage}%` }} />
                </div>
              </div>
              <div className={styles.headerActions}>
                <button type="button" className="app-button app-button-secondary" onClick={onSave}>
                  {isSaving ? '저장 중...' : '지금 저장'}
                </button>
              </div>
              {uploadError ? <p className={styles.headerError}>{uploadError}</p> : null}
              {syncError ? <p className={styles.headerError}>{syncError}</p> : null}
            </div>
          </header>

          <div className={styles.workspace}>
            <div className={styles.topRail}>
              <div className={styles.topRailHeader}>
                <div className={styles.topRailActions}>
                  <button
                    type="button"
                    className="app-button app-button-secondary"
                    onClick={() => setMetaModalOpen(true)}
                  >
                    기본 정보
                  </button>
                  <span className="app-chip">{DOCUMENT_SOURCE_LABELS[currentSectionMeta.source]}</span>
                  <span className="app-chip">{DOCUMENT_STATUS_LABELS[currentSectionMeta.status]}</span>
                </div>
                <div className={styles.topRailMeta}>
                  마지막 저장 {formatDateTime(session.lastSavedAt)}
                </div>
              </div>
              <nav className={styles.navRail} aria-label="문서 이동">
                {INSPECTION_SECTIONS.map((section) => {
                  const isActive = section.key === currentSection;
                  const isCompleted = getSectionCompletion(session, section.key);
                  const meta = session.documentsMeta[section.key];
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
                        <span>
                          {DOCUMENT_STATUS_LABELS[meta.status]} · {DOCUMENT_SOURCE_LABELS[meta.source]}
                        </span>
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
                    <div className={styles.cardEyebrow}>우측 단일 편집영역</div>
                    <h2 className={styles.editorTitle}>{currentSectionInfo.label}</h2>
                    <p className={styles.editorDescription}>{SECTION_DESCRIPTIONS[currentSection]}</p>
                  </div>
                </div>
                <div className={styles.editorBody}>{renderSection}</div>
              </div>
            </section>
          </div>

          <footer className={styles.bottomBar}>
            <div className={styles.bottomMeta}>
              자동 저장 기준으로 동작합니다. 마지막 저장 시각: {formatDateTime(session.lastSavedAt)}
              {isSaving ? ' · 서버 저장 중' : ''}
            </div>
            <div className={styles.bottomActions}>
              <button type="button" className="app-button app-button-secondary" disabled={currentSectionIndex <= 0} onClick={() => moveSection(-1)}>이전 문서</button>
              <button type="button" className="app-button app-button-secondary" onClick={onSave}>{isSaving ? '저장 중' : '저장'}</button>
              <button type="button" className="app-button app-button-primary" disabled={currentSectionIndex >= INSPECTION_SECTIONS.length - 1} onClick={() => moveSection(1)}>다음 문서</button>
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
          <p className={styles.editorDescription}>
            현장명, 작성일, 담당, 검토, 승인은 상단에 고정 노출하지 않고 여기서만 수정합니다.
          </p>
          <div className={styles.metaGrid}>
            {(['siteName', 'reportDate', 'drafter', 'reviewer', 'approver'] as const).map((field) => (
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
                          : '승인'}
                </span>
                <input
                  type={field === 'reportDate' ? 'date' : 'text'}
                  className="app-input"
                  value={session.meta[field]}
                  onChange={(event) => onMetaChange(field, event.target.value)}
                />
              </label>
            ))}
          </div>
        </div>
      </AppModal>
    </main>
  );
}
