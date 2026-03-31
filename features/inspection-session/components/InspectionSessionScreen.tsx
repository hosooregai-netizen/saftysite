'use client';

import LoginPanel from '@/components/auth/LoginPanel';
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

  if (!screen.isReady) {
    return <LoadingStatePanel />;
  }

  if (!screen.isAuthenticated) {
    return <LoginPanel error={screen.authError} onSubmit={screen.login} title="세션 로그인" />;
  }

  if (screen.isLoadingSession) {
    return <LoadingStatePanel />;
  }

  if (!screen.sectionSession || !screen.derivedData.progress) {
    return <MissingStatePanel />;
  }

  const sectionProps = {
    applyDocumentUpdate: screen.applyDocumentUpdate,
    correctionResultOptions: screen.derivedData.correctionResultOptions,
    currentAccidentEntries: screen.derivedData.currentAccidentEntries,
    currentAgentEntries: screen.derivedData.currentAgentEntries,
    currentSection: screen.currentSection,
    cumulativeAccidentEntries: screen.derivedData.cumulativeAccidentEntries,
    cumulativeAgentEntries: screen.derivedData.cumulativeAgentEntries,
    legalReferenceLibrary: screen.derivedData.legalReferenceLibrary,
    measurementTemplates: screen.derivedData.measurementTemplates,
    session: screen.sectionSession,
    withFileData: screen.withFileData,
  };

  return (
    <WorkspaceShell
      backHref={screen.backHref}
      currentSection={screen.currentSection}
      currentSectionIndex={screen.currentSectionIndex}
      currentUserName={screen.currentUserName}
      documentError={screen.documentError}
      isAdminView={screen.isAdminView}
      moveSection={screen.moveSection}
      onLogout={screen.logout}
      onMetaChange={screen.changeMetaField}
      onSectionSelect={screen.selectSection}
      progress={screen.derivedData.progress}
      renderSection={getInspectionSectionContent(sectionProps)}
      sectionToolbar={getInspectionSectionToolbar(sectionProps)}
      session={screen.sectionSession}
      syncError={screen.syncError}
      uploadError={screen.uploadError}
    />
  );
}
