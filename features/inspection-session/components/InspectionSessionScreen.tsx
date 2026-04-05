'use client';

import LoginPanel from '@/components/auth/LoginPanel';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import {
  LoadingStatePanel,
  MissingStatePanel,
} from '@/components/session/workspace/WorkspaceStatePanels';
import { useInspectionSessionScreen } from '@/features/inspection-session/hooks/useInspectionSessionScreen';
import {
  getInspectionSectionContent,
  getInspectionSectionToolbar,
} from '@/features/inspection-session/workspace/sectionRegistry';
import { WorkspaceShell } from '@/features/inspection-session/workspace/WorkspaceShell';

interface InspectionSessionScreenProps {
  sessionId: string;
}

export function InspectionSessionScreen({ sessionId }: InspectionSessionScreenProps) {
  const screen = useInspectionSessionScreen(sessionId);
  const hasLoadedSessionPayload = Boolean(screen.sectionSession);
  const displaySession = screen.displaySession;

  if (!screen.isReady) {
    return <LoadingStatePanel />;
  }

  if (!screen.isAuthenticated) {
    return (
      <LoginPanel
        error={screen.authError}
        onSubmit={screen.login}
        title="세션 로그인"
      />
    );
  }

  if (screen.isLoadingSession && !displaySession) {
    return <LoadingStatePanel />;
  }

  if (!displaySession || !screen.displayProgress) {
    return <MissingStatePanel />;
  }

  const sectionProps = hasLoadedSessionPayload
    ? {
        applyDocumentUpdate: screen.applyDocumentUpdate,
        currentAccidentEntries: screen.derivedData.currentAccidentEntries,
        currentAgentEntries: screen.derivedData.currentAgentEntries,
        currentSection: screen.currentSection,
        cumulativeAccidentEntries: screen.derivedData.cumulativeAccidentEntries,
        cumulativeAgentEntries: screen.derivedData.cumulativeAgentEntries,
        doc7ReferenceMaterials: screen.derivedData.doc7ReferenceMaterials,
        isRelationHydrating: screen.isRelationHydrating,
        isRelationReady: screen.isRelationReady,
        measurementTemplates: screen.derivedData.measurementTemplates,
        relationStatus: screen.relationStatus,
        session: screen.sectionSession!,
        withFileData: screen.withFileData,
      }
    : null;

  return (
    <WorkspaceShell
      backHref={screen.backHref}
      currentSection={screen.currentSection}
      currentSectionIndex={screen.currentSectionIndex}
      currentUserName={screen.currentUserName}
      documentError={screen.documentError}
      generateHwpxDocument={screen.generateHwpxDocument}
      generatePdfDocument={screen.generatePdfDocument}
      isAdminView={screen.isAdminView}
      isGeneratingHwpx={screen.isGeneratingHwpx}
      isGeneratingPdf={screen.isGeneratingPdf}
      isInteractive={hasLoadedSessionPayload}
      moveSection={screen.moveSection}
      onLogout={screen.logout}
      onMetaChange={screen.changeMetaField}
      onSectionSelect={screen.selectSection}
      photoAlbumHref={screen.photoAlbumHref}
      progress={screen.displayProgress}
      relationNotice={hasLoadedSessionPayload ? screen.relationNotice : null}
      renderSection={
        hasLoadedSessionPayload && sectionProps ? (
          getInspectionSectionContent(sectionProps)
        ) : (
          <div className={styles.sectionStack}>
            <div className={styles.relationNotice} role="status">
              저장된 보고서 본문을 불러오는 중입니다.
            </div>
          </div>
        )
      }
      sectionToolbar={
        hasLoadedSessionPayload && sectionProps
          ? getInspectionSectionToolbar(sectionProps)
          : undefined
      }
      session={displaySession}
      syncError={screen.syncError}
      uploadError={screen.uploadError}
    />
  );
}
