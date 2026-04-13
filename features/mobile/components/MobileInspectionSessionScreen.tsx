'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import LoginPanel from '@/components/auth/LoginPanel';
import { getSessionTitle } from '@/constants/inspectionSession';
import {
  buildDoc2ProcessNotesDraft,
  buildDoc2RiskFallback,
} from '@/features/inspection-session/workspace/sections/doc2/doc2ProcessNotes';
import { useInspectionSessionScreen } from '@/features/inspection-session/hooks/useInspectionSessionScreen';
import {
  buildMobileHomeHref,
  buildMobileSiteReportsHref,
} from '@/features/home/lib/siteEntry';
import { MobileShell } from './MobileShell';
import { MobileTabBar } from './MobileTabBar';
import { buildSiteTabs } from '../lib/buildSiteTabs';
import { MobileInspectionSessionModals } from '../inspection-session/MobileInspectionSessionModals';
import { MobileInspectionSessionStandaloneState } from '../inspection-session/MobileInspectionSessionStandaloneState';
import { MobileInspectionSessionSummaryBar } from '../inspection-session/MobileInspectionSessionSummaryBar';
import { useMobileInspectionAiActions } from '../inspection-session/useMobileInspectionAiActions';
import { useMobileInspectionMeasurementActions } from '../inspection-session/useMobileInspectionMeasurementActions';
import { useMobileInspectionPhotoPicker } from '../inspection-session/useMobileInspectionPhotoPicker';
import { useMobileInspectionScenePlanActions } from '../inspection-session/useMobileInspectionScenePlanActions';
import { MobileInspectionSessionWorkspace } from '../inspection-session/MobileInspectionSessionWorkspace';
import {
  MOBILE_INSPECTION_STEPS,
  MobileInspectionStepId,
  generateDoc2RiskLines,
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
  const directSignatureSectionRef = useRef<HTMLDivElement | null>(null);
  const handledDirectSignatureRef = useRef(false);
  const scrolledDirectSignatureRef = useRef(false);
  const [isDoc2ProcessModalOpen, setIsDoc2ProcessModalOpen] = useState(false);
  const [isGeneratingDoc2ProcessNotes, setIsGeneratingDoc2ProcessNotes] = useState(false);
  const [doc2ProcessRiskLines, setDoc2ProcessRiskLines] = useState<string[] | null>(null);
  const [doc2ProcessError, setDoc2ProcessError] = useState<string | null>(null);
  const [doc2ProcessNotice, setDoc2ProcessNotice] = useState<string | null>(null);
  const [documentInfoOpen, setDocumentInfoOpen] = useState(false);
  const isDirectSignatureAction = searchParams.get('action') === 'direct-signature';
  const measurementTemplateOptions = [...screen.derivedData.measurementTemplates].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );
  const {
    closePhotoAlbumModal,
    closePhotoSourceModal,
    handlePhotoAlbumSelect,
    handlePhotoSlotKeyDown,
    handlePhotoSourceInputChange,
    isPhotoAlbumModalOpen,
    isPhotoSourceModalOpen,
    openPhotoAlbumPicker,
    openPhotoSourceCamera,
    openPhotoSourceGallery,
    openPhotoSourcePicker,
    photoAlbumError,
    photoAlbumLoading,
    photoAlbumQuery,
    photoAlbumRows,
    photoAlbumSelectingId,
    photoPickerCameraInputRef,
    photoPickerGalleryInputRef,
    photoSourceTitle,
    resetPhotoSourceTarget,
    setPhotoAlbumQuery,
  } = useMobileInspectionPhotoPicker({
    siteId: displaySession?.siteKey,
  });
  const {
    doc11ContentError,
    doc11ContentNotice,
    doc11GeneratingId,
    doc5DraftError,
    doc5DraftLoading,
    doc5DraftNotice,
    doc7AiErrors,
    doc7AiLoadingId,
    handleDoc7AiRefill,
    handleGenerateDoc11Content,
    handleGenerateDoc5Draft,
  } = useMobileInspectionAiActions({
    screen,
    session,
  });
  const {
    activeDoc8PlanId,
    applyDoc3ScenePhoto,
    doc3AnalyzingSceneIds,
    handleDoc8ProcessBlur,
    setActiveDoc8PlanId,
    updateDoc8ProcessPlan,
  } = useMobileInspectionScenePlanActions({
    screen,
    session,
  });
  const {
    applyDoc10MeasurementPhoto,
    doc10MatchErrors,
    doc10MatchingMeasurementId,
    handleDoc10PhotoSelect,
  } = useMobileInspectionMeasurementActions({
    measurementTemplateOptions,
    screen,
  });

  useEffect(() => {
    handledDirectSignatureRef.current = false;
    scrolledDirectSignatureRef.current = false;
  }, [isDirectSignatureAction, sessionId]);

  useEffect(() => {
    if (!isDirectSignatureAction || !session) {
      return;
    }

    if (handledDirectSignatureRef.current) {
      return;
    }

    handledDirectSignatureRef.current = true;
    setActiveStep('step2');

    if (session.document2Overview.notificationMethod !== 'direct') {
      screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
        ...current,
        document2Overview: {
          ...current.document2Overview,
          notificationMethod: 'direct',
        },
      }));
    }
  }, [isDirectSignatureAction, screen, session]);

  useEffect(() => {
    if (!isDirectSignatureAction || !session) {
      return;
    }

    if (scrolledDirectSignatureRef.current) {
      return;
    }

    if (
      activeStep !== 'step2' ||
      session.document2Overview.notificationMethod !== 'direct' ||
      !directSignatureSectionRef.current
    ) {
      return;
    }

    scrolledDirectSignatureRef.current = true;
    const timeoutId = window.setTimeout(() => {
      directSignatureSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 80);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeStep, isDirectSignatureAction, session]);

  if (!screen.isReady) {
    return <MobileInspectionSessionStandaloneState title="보고서를 준비하는 중입니다." />;
  }

  if (!screen.isAuthenticated) {
    return (
      <LoginPanel
        error={screen.authError}
        onSubmit={screen.login}
        title="모바일 보고서 로그인"
        description="핵심 섹션 중심으로 기술지도 보고서를 이어서 작성합니다."
      />
    );
  }

  if (screen.isLoadingSession && !displaySession) {
    return <MobileInspectionSessionStandaloneState title="보고서를 불러오는 중입니다." />;
  }

  if (!displaySession || !screen.displayProgress) {
    return (
      <MobileInspectionSessionStandaloneState
        title="보고서를 찾을 수 없습니다."
        description="보고서가 아직 동기화되지 않았거나 접근 가능한 범위를 벗어났습니다."
        action={
          <Link href={buildMobileHomeHref()} className="app-button app-button-secondary">
            현장 목록으로 돌아가기
          </Link>
        }
      />
    );
  }

  const hasLoadedSessionPayload = Boolean(session);
  const fallbackDoc2RiskLines = session ? buildDoc2RiskFallback(session.document2Overview) : [];
  const previewDoc2RiskLines = doc2ProcessRiskLines ?? fallbackDoc2RiskLines;
  const doc2ProcessNoteDraft = session
    ? buildDoc2ProcessNotesDraft(session.document2Overview, previewDoc2RiskLines)
    : '';
  const errors = [screen.uploadError, screen.syncError, screen.documentError].filter(
    (message): message is string => Boolean(message),
  );
  const mobileReportsHref = buildMobileSiteReportsHref(displaySession.siteKey);

  const resetDoc2ProcessState = () => {
    setDoc2ProcessRiskLines(null);
    setDoc2ProcessError(null);
    setDoc2ProcessNotice(null);
  };

  const handleDoc2ProcessFieldChange = (
    key:
      | 'processWorkContent'
      | 'processWorkerCount'
      | 'processEquipment'
      | 'processTools'
      | 'processHazardousMaterials',
    value: string,
  ) => {
    resetDoc2ProcessState();
    screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
      ...current,
      document2Overview: {
        ...current.document2Overview,
        [key]: value,
      },
    }));
  };

  const handleGenerateDoc2ProcessNotes = async () => {
    if (!session) {
      return;
    }

    setIsGeneratingDoc2ProcessNotes(true);
    setDoc2ProcessError(null);
    setDoc2ProcessNotice(null);

    try {
      const generatedRiskLines = await generateDoc2RiskLines({
        processWorkContent: session.document2Overview.processWorkContent,
        processWorkerCount: session.document2Overview.processWorkerCount,
        processEquipment: session.document2Overview.processEquipment,
        processTools: session.document2Overview.processTools,
        processHazardousMaterials: session.document2Overview.processHazardousMaterials,
      });

      if (generatedRiskLines.length === 0) {
        throw new Error('AI 위험요인 생성 결과가 비어 있습니다.');
      }

      setDoc2ProcessRiskLines(generatedRiskLines);
      setDoc2ProcessNotice('AI가 주요 위험 요인 2줄을 생성했습니다.');
    } catch (error) {
      setDoc2ProcessRiskLines(null);
      setDoc2ProcessError(
        error instanceof Error ? error.message : 'AI 위험요인 생성에 실패했습니다.',
      );
      setDoc2ProcessNotice('AI 생성에 실패해 규칙 기반 위험 요인으로 미리보기를 유지합니다.');
    } finally {
      setIsGeneratingDoc2ProcessNotes(false);
    }
  };

  const applyDoc2ProcessNotesDraft = () => {
    screen.applyDocumentUpdate('doc2', 'derived', (current) => ({
      ...current,
      document2Overview: {
        ...current.document2Overview,
        processAndNotes: buildDoc2ProcessNotesDraft(
          current.document2Overview,
          doc2ProcessRiskLines ?? buildDoc2RiskFallback(current.document2Overview),
        ),
      },
    }));
    setIsDoc2ProcessModalOpen(false);
  };

  return (
    <MobileShell
      fullHeight={true}
      backHref={mobileReportsHref}
      backLabel="보고서 목록"
      currentUserName={screen.currentUserName}
      tabBar={<MobileTabBar tabs={buildSiteTabs(displaySession.siteKey, 'reports')} />}
      onLogout={screen.logout}
      title={getSessionTitle(displaySession)}
      webHref={`/sessions/${encodeURIComponent(sessionId)}`}
    >
      <MobileInspectionSessionSummaryBar
        hasLoadedSessionPayload={hasLoadedSessionPayload}
        isGeneratingHwpx={screen.isGeneratingHwpx}
        isGeneratingPdf={screen.isGeneratingPdf}
        isSaving={screen.isSaving}
        onGenerateHwpx={() => void screen.generateHwpxDocument()}
        onGeneratePdf={() => void screen.generatePdfDocument()}
        onOpenDocumentInfo={() => setDocumentInfoOpen(true)}
        onSave={() => void screen.saveNow()}
        progressPercentage={screen.displayProgress.percentage}
      />

      <MobileInspectionSessionWorkspace
        activeDoc8PlanId={activeDoc8PlanId}
        activeStep={activeStep}
        applyDoc10MeasurementPhoto={applyDoc10MeasurementPhoto}
        applyDoc3ScenePhoto={applyDoc3ScenePhoto}
        directSignatureSectionRef={directSignatureSectionRef}
        doc10MatchErrors={doc10MatchErrors}
        doc10MatchingMeasurementId={doc10MatchingMeasurementId}
        doc11ContentError={doc11ContentError}
        doc11ContentNotice={doc11ContentNotice}
        doc11GeneratingId={doc11GeneratingId}
        doc3AnalyzingSceneIds={doc3AnalyzingSceneIds}
        doc5DraftError={doc5DraftError}
        doc5DraftLoading={doc5DraftLoading}
        doc5DraftNotice={doc5DraftNotice}
        doc7AiErrors={doc7AiErrors}
        doc7AiLoadingId={doc7AiLoadingId}
        handleDoc10PhotoSelect={handleDoc10PhotoSelect}
        handleDoc7AiRefill={handleDoc7AiRefill}
        handleDoc8ProcessBlur={handleDoc8ProcessBlur}
        handleGenerateDoc11Content={handleGenerateDoc11Content}
        handleGenerateDoc5Draft={handleGenerateDoc5Draft}
        handlePhotoSlotKeyDown={handlePhotoSlotKeyDown}
        hasLoadedSessionPayload={hasLoadedSessionPayload}
        measurementTemplateOptions={measurementTemplateOptions}
        onOpenDoc2ProcessModal={() => setIsDoc2ProcessModalOpen(true)}
        openPhotoSourcePicker={openPhotoSourcePicker}
        screen={screen}
        session={session}
        setActiveDoc8PlanId={setActiveDoc8PlanId}
        setActiveStep={setActiveStep}
        updateDoc8ProcessPlan={updateDoc8ProcessPlan}
      />

      <MobileInspectionSessionModals
        applyDoc2ProcessNotesDraft={applyDoc2ProcessNotesDraft}
        closePhotoAlbumModal={closePhotoAlbumModal}
        closePhotoSourceModal={closePhotoSourceModal}
        doc2ProcessError={doc2ProcessError}
        doc2ProcessNotice={doc2ProcessNotice}
        doc2ProcessNoteDraft={doc2ProcessNoteDraft}
        documentInfoOpen={documentInfoOpen}
        handleDoc2ProcessFieldChange={handleDoc2ProcessFieldChange}
        handleGenerateDoc2ProcessNotes={handleGenerateDoc2ProcessNotes}
        handlePhotoAlbumSelect={handlePhotoAlbumSelect}
        handlePhotoSourceInputChange={handlePhotoSourceInputChange}
        hasLoadedSessionPayload={hasLoadedSessionPayload}
        isDoc2ProcessModalOpen={isDoc2ProcessModalOpen}
        isGeneratingDoc2ProcessNotes={isGeneratingDoc2ProcessNotes}
        isPhotoAlbumModalOpen={isPhotoAlbumModalOpen}
        isPhotoSourceModalOpen={isPhotoSourceModalOpen}
        openPhotoAlbumPicker={openPhotoAlbumPicker}
        openPhotoSourceCamera={openPhotoSourceCamera}
        openPhotoSourceGallery={openPhotoSourceGallery}
        photoAlbumError={photoAlbumError}
        photoAlbumLoading={photoAlbumLoading}
        photoAlbumQuery={photoAlbumQuery}
        photoAlbumRows={photoAlbumRows}
        photoAlbumSelectingId={photoAlbumSelectingId}
        photoPickerCameraInputRef={photoPickerCameraInputRef}
        photoPickerGalleryInputRef={photoPickerGalleryInputRef}
        photoSourceTitle={photoSourceTitle}
        resetPhotoSourceTarget={resetPhotoSourceTarget}
        screen={screen}
        session={session}
        setDocumentInfoOpen={setDocumentInfoOpen}
        setIsDoc2ProcessModalOpen={setIsDoc2ProcessModalOpen}
        setPhotoAlbumQuery={setPhotoAlbumQuery}
      />

      {errors.length > 0 && (
        <div style={{ padding: '0 16px 16px' }}>
          {errors.map((message) => (
            <p key={message} className={styles.errorNotice}>
              {message}
            </p>
          ))}
        </div>
      )}
    </MobileShell>
  );
}
