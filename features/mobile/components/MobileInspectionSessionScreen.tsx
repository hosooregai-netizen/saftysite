'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSessionTitle } from '@/constants/inspectionSession';
import { useInspectionSessionScreen } from '@/features/inspection-session/hooks/useInspectionSessionScreen';
import { buildMobileSiteReportsHref } from '@/features/home/lib/siteEntry';
import { MobileShell } from './MobileShell';
import { MobileTabBar } from './MobileTabBar';
import { buildSiteTabs } from '../lib/buildSiteTabs';
import { MobileInspectionSessionModals } from '../inspection-session/MobileInspectionSessionModals';
import { MobileInspectionSessionStateGate } from '../inspection-session/MobileInspectionSessionStateGate';
import { MobileInspectionSessionSummaryBar } from '../inspection-session/MobileInspectionSessionSummaryBar';
import { useMobileInspectionAiActions } from '../inspection-session/useMobileInspectionAiActions';
import { useMobileInspectionDirectSignature } from '../inspection-session/useMobileInspectionDirectSignature';
import { useMobileInspectionDoc2Process } from '../inspection-session/useMobileInspectionDoc2Process';
import { useMobileInspectionMeasurementActions } from '../inspection-session/useMobileInspectionMeasurementActions';
import { useMobileInspectionPhotoPicker } from '../inspection-session/useMobileInspectionPhotoPicker';
import { useMobileInspectionScenePlanActions } from '../inspection-session/useMobileInspectionScenePlanActions';
import { MobileInspectionSessionWorkspace } from '../inspection-session/MobileInspectionSessionWorkspace';
import {
  MOBILE_INSPECTION_STEPS,
  type MobileInspectionStepId,
} from '../inspection-session/mobileInspectionSessionHelpers';
import styles from './MobileShell.module.css';

interface MobileInspectionSessionScreenProps {
  sessionId: string;
}

export function MobileInspectionSessionScreen({
  sessionId,
}: MobileInspectionSessionScreenProps) {
  const searchParams = useSearchParams();
  const screen = useInspectionSessionScreen(sessionId);
  const displaySession = screen.displaySession;
  const session = screen.sectionSession;
  const [activeStep, setActiveStep] = useState<MobileInspectionStepId>(
    MOBILE_INSPECTION_STEPS[0].id,
  );
  const [documentInfoOpen, setDocumentInfoOpen] = useState(false);
  const isDirectSignatureAction = searchParams.get('action') === 'direct-signature';
  const measurementTemplateOptions = [...screen.derivedData.measurementTemplates].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );
  const {
    directSignatureSectionRef,
  } = useMobileInspectionDirectSignature({
    activeStep,
    isDirectSignatureAction,
    screen,
    session,
    sessionId,
    setActiveStep,
  });
  const {
    applyDoc2ProcessNotesDraft,
    doc2ProcessError,
    doc2ProcessNoteDraft,
    doc2ProcessNotice,
    handleDoc2ProcessFieldChange,
    handleGenerateDoc2ProcessNotes,
    isDoc2ProcessModalOpen,
    isGeneratingDoc2ProcessNotes,
    setIsDoc2ProcessModalOpen,
  } = useMobileInspectionDoc2Process({
    screen,
    session,
  });
  const photoPicker = useMobileInspectionPhotoPicker({
    siteId: displaySession?.siteKey,
  });
  const aiActions = useMobileInspectionAiActions({
    screen,
    session,
  });
  const scenePlanActions = useMobileInspectionScenePlanActions({
    screen,
    session,
  });
  const measurementActions = useMobileInspectionMeasurementActions({
    measurementTemplateOptions,
    screen,
  });

  return (
    <MobileInspectionSessionStateGate screen={screen}>
      {displaySession && screen.displayProgress ? (
        <MobileShell
          fullHeight={true}
          backHref={buildMobileSiteReportsHref(displaySession.siteKey)}
          backLabel="보고서 목록"
          currentUserName={screen.currentUserName}
          tabBar={<MobileTabBar tabs={buildSiteTabs(displaySession.siteKey, 'reports')} />}
          onLogout={screen.logout}
          title={getSessionTitle(displaySession)}
          webHref={`/sessions/${encodeURIComponent(sessionId)}`}
        >
          <MobileInspectionSessionSummaryBar
            hasLoadedSessionPayload={Boolean(session)}
            isGeneratingHwpx={screen.isGeneratingHwpx}
            isGeneratingPdf={screen.isGeneratingPdf}
            isSaving={screen.isSaving}
            progressPercentage={screen.displayProgress.percentage}
            onGenerateHwpx={() => void screen.generateHwpxDocument()}
            onGeneratePdf={() => void screen.generatePdfDocument()}
            onOpenDocumentInfo={() => setDocumentInfoOpen(true)}
            onSave={() => void screen.saveNow()}
          />

          <MobileInspectionSessionWorkspace
            activeDoc8PlanId={scenePlanActions.activeDoc8PlanId}
            activeStep={activeStep}
            applyDoc10MeasurementPhoto={measurementActions.applyDoc10MeasurementPhoto}
            applyDoc3ScenePhoto={scenePlanActions.applyDoc3ScenePhoto}
            directSignatureSectionRef={directSignatureSectionRef}
            doc10MatchErrors={measurementActions.doc10MatchErrors}
            doc10MatchingMeasurementId={measurementActions.doc10MatchingMeasurementId}
            doc11ContentError={aiActions.doc11ContentError}
            doc11ContentNotice={aiActions.doc11ContentNotice}
            doc11GeneratingId={aiActions.doc11GeneratingId}
            doc3AnalyzingSceneIds={scenePlanActions.doc3AnalyzingSceneIds}
            doc5DraftError={aiActions.doc5DraftError}
            doc5DraftLoading={aiActions.doc5DraftLoading}
            doc5DraftNotice={aiActions.doc5DraftNotice}
            doc7AiErrors={aiActions.doc7AiErrors}
            doc7AiLoadingId={aiActions.doc7AiLoadingId}
            handleDoc10PhotoSelect={measurementActions.handleDoc10PhotoSelect}
            handleDoc7AiRefill={aiActions.handleDoc7AiRefill}
            handleDoc8ProcessBlur={scenePlanActions.handleDoc8ProcessBlur}
            handleGenerateDoc11Content={aiActions.handleGenerateDoc11Content}
            handleGenerateDoc5Draft={aiActions.handleGenerateDoc5Draft}
            handlePhotoSlotKeyDown={photoPicker.handlePhotoSlotKeyDown}
            hasLoadedSessionPayload={Boolean(session)}
            measurementTemplateOptions={measurementTemplateOptions}
            openPhotoSourcePicker={photoPicker.openPhotoSourcePicker}
            screen={screen}
            session={session}
            setActiveDoc8PlanId={scenePlanActions.setActiveDoc8PlanId}
            setActiveStep={setActiveStep}
            updateDoc8ProcessPlan={scenePlanActions.updateDoc8ProcessPlan}
            onOpenDoc2ProcessModal={() => setIsDoc2ProcessModalOpen(true)}
          />

          <MobileInspectionSessionModals
            applyDoc2ProcessNotesDraft={applyDoc2ProcessNotesDraft}
            closePhotoAlbumModal={photoPicker.closePhotoAlbumModal}
            closePhotoSourceModal={photoPicker.closePhotoSourceModal}
            doc2ProcessError={doc2ProcessError}
            doc2ProcessNotice={doc2ProcessNotice}
            doc2ProcessNoteDraft={doc2ProcessNoteDraft}
            documentInfoOpen={documentInfoOpen}
            handleDoc2ProcessFieldChange={handleDoc2ProcessFieldChange}
            handleGenerateDoc2ProcessNotes={handleGenerateDoc2ProcessNotes}
            handlePhotoAlbumSelect={photoPicker.handlePhotoAlbumSelect}
            handlePhotoSourceInputChange={photoPicker.handlePhotoSourceInputChange}
            hasLoadedSessionPayload={Boolean(session)}
            isDoc2ProcessModalOpen={isDoc2ProcessModalOpen}
            isGeneratingDoc2ProcessNotes={isGeneratingDoc2ProcessNotes}
            isPhotoAlbumModalOpen={photoPicker.isPhotoAlbumModalOpen}
            isPhotoSourceModalOpen={photoPicker.isPhotoSourceModalOpen}
            openPhotoAlbumPicker={photoPicker.openPhotoAlbumPicker}
            openPhotoSourceCamera={photoPicker.openPhotoSourceCamera}
            openPhotoSourceGallery={photoPicker.openPhotoSourceGallery}
            photoAlbumError={photoPicker.photoAlbumError}
            photoAlbumLoading={photoPicker.photoAlbumLoading}
            photoAlbumQuery={photoPicker.photoAlbumQuery}
            photoAlbumRows={photoPicker.photoAlbumRows}
            photoAlbumSelectingId={photoPicker.photoAlbumSelectingId}
            photoPickerCameraInputRef={photoPicker.photoPickerCameraInputRef}
            photoPickerGalleryInputRef={photoPicker.photoPickerGalleryInputRef}
            photoSourceTitle={photoPicker.photoSourceTitle}
            resetPhotoSourceTarget={photoPicker.resetPhotoSourceTarget}
            screen={screen}
            session={session}
            setDocumentInfoOpen={setDocumentInfoOpen}
            setIsDoc2ProcessModalOpen={setIsDoc2ProcessModalOpen}
            setPhotoAlbumQuery={photoPicker.setPhotoAlbumQuery}
          />

          {[
            screen.uploadError,
            screen.syncError,
            screen.documentError,
          ]
            .filter((message): message is string => Boolean(message))
            .map((message) => (
              <div key={message} style={{ padding: '0 16px 16px' }}>
                <p className={styles.errorNotice}>{message}</p>
              </div>
            ))}
        </MobileShell>
      ) : null}
    </MobileInspectionSessionStateGate>
  );
}
