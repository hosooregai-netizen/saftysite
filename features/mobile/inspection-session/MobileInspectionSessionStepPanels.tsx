'use client';

import type { Dispatch, FocusEvent, KeyboardEvent, MutableRefObject, SetStateAction } from 'react';
import type { useInspectionSessionScreen } from '@/features/inspection-session/hooks/useInspectionSessionScreen';
import type { MobilePhotoSourceTarget, MobileInspectionStepId } from './mobileInspectionSessionHelpers';
import { MobileInspectionSessionStep2 } from './MobileInspectionSessionStep2';
import { MobileInspectionSessionStep3 } from './MobileInspectionSessionStep3';
import { MobileInspectionSessionStep4 } from './MobileInspectionSessionStep4';
import { MobileInspectionSessionStep5 } from './MobileInspectionSessionStep5';
import { MobileInspectionSessionStep6 } from './MobileInspectionSessionStep6';
import { MobileInspectionSessionStep7 } from './MobileInspectionSessionStep7';
import { MobileInspectionSessionStep8 } from './MobileInspectionSessionStep8';
import { MobileInspectionSessionStep9 } from './MobileInspectionSessionStep9';
import { MobileInspectionSessionStep10 } from './MobileInspectionSessionStep10';
import { MobileInspectionSessionStep11 } from './MobileInspectionSessionStep11';
import { MobileInspectionSessionStep12 } from './MobileInspectionSessionStep12';

type InspectionScreenController = ReturnType<typeof useInspectionSessionScreen>;
type InspectionSessionDraft = NonNullable<InspectionScreenController['sectionSession']>;

export interface MobileInspectionSessionStepPanelsProps {
  activeDoc8PlanId: string | null;
  activeStep: MobileInspectionStepId;
  applyDoc10MeasurementPhoto: (
    measurementId: string,
    photoUrl: string,
    fileForMatch?: File | null,
  ) => Promise<void>;
  applyDoc3ScenePhoto: (
    sceneId: string,
    index: number,
    photoUrl: string,
    fileForAi?: File | null,
  ) => Promise<void>;
  directSignatureSectionRef: MutableRefObject<HTMLDivElement | null>;
  doc10MatchErrors: Record<string, string>;
  doc10MatchingMeasurementId: string | null;
  doc11ContentError: { id: string; message: string } | null;
  doc11ContentNotice: { id: string; message: string } | null;
  doc11GeneratingId: string | null;
  doc3AnalyzingSceneIds: string[];
  doc5DraftError: string | null;
  doc5DraftLoading: boolean;
  doc5DraftNotice: string | null;
  doc7AiErrors: Record<string, string>;
  doc7AiLoadingId: string | null;
  handleDoc10PhotoSelect: (measurementId: string, file: File) => Promise<void>;
  handleDoc7AiRefill: (findingId: string, photoUrl: string) => Promise<void>;
  handleDoc8ProcessBlur: (planId: string, event: FocusEvent<HTMLDivElement>) => void;
  handleGenerateDoc11Content: (recordId: string) => Promise<void>;
  handleGenerateDoc5Draft: () => Promise<void>;
  handlePhotoSlotKeyDown: (event: KeyboardEvent<HTMLElement>, action: () => void) => void;
  measurementTemplateOptions: InspectionScreenController['derivedData']['measurementTemplates'];
  onOpenDoc2ProcessModal: () => void;
  openPhotoSourcePicker: (target: MobilePhotoSourceTarget) => void;
  screen: InspectionScreenController;
  session: InspectionSessionDraft;
  setActiveDoc8PlanId: Dispatch<SetStateAction<string | null>>;
  updateDoc8ProcessPlan: (planId: string, nextProcessName: string) => void;
}

export function MobileInspectionSessionStepPanels({
  activeDoc8PlanId,
  activeStep,
  applyDoc10MeasurementPhoto,
  applyDoc3ScenePhoto,
  directSignatureSectionRef,
  doc10MatchErrors,
  doc10MatchingMeasurementId,
  doc11ContentError,
  doc11ContentNotice,
  doc11GeneratingId,
  doc3AnalyzingSceneIds,
  doc5DraftError,
  doc5DraftLoading,
  doc5DraftNotice,
  doc7AiErrors,
  doc7AiLoadingId,
  handleDoc10PhotoSelect,
  handleDoc7AiRefill,
  handleDoc8ProcessBlur,
  handleGenerateDoc11Content,
  handleGenerateDoc5Draft,
  handlePhotoSlotKeyDown,
  measurementTemplateOptions,
  onOpenDoc2ProcessModal,
  openPhotoSourcePicker,
  screen,
  session,
  setActiveDoc8PlanId,
  updateDoc8ProcessPlan,
}: MobileInspectionSessionStepPanelsProps) {
  return (
    <>
      {activeStep === 'step2' && (
        <MobileInspectionSessionStep2
          directSignatureSectionRef={directSignatureSectionRef}
          onOpenDoc2ProcessModal={onOpenDoc2ProcessModal}
          screen={screen}
          session={session}
        />
      )}
      {activeStep === 'step3' && (
        <MobileInspectionSessionStep3
          applyDoc3ScenePhoto={applyDoc3ScenePhoto}
          doc3AnalyzingSceneIds={doc3AnalyzingSceneIds}
          openPhotoSourcePicker={openPhotoSourcePicker}
          screen={screen}
          session={session}
        />
      )}
      {activeStep === 'step4' && (
        <MobileInspectionSessionStep4
          openPhotoSourcePicker={openPhotoSourcePicker}
          screen={screen}
          session={session}
        />
      )}
      {activeStep === 'step5' && (
        <MobileInspectionSessionStep5
          doc5DraftError={doc5DraftError}
          doc5DraftLoading={doc5DraftLoading}
          doc5DraftNotice={doc5DraftNotice}
          handleGenerateDoc5Draft={handleGenerateDoc5Draft}
          screen={screen}
          session={session}
        />
      )}
      {activeStep === 'step6' && <MobileInspectionSessionStep6 screen={screen} session={session} />}
      {activeStep === 'step7' && (
        <MobileInspectionSessionStep7
          doc7AiErrors={doc7AiErrors}
          doc7AiLoadingId={doc7AiLoadingId}
          handleDoc7AiRefill={handleDoc7AiRefill}
          openPhotoSourcePicker={openPhotoSourcePicker}
          screen={screen}
          session={session}
        />
      )}
      {activeStep === 'step8' && (
        <MobileInspectionSessionStep8
          activeDoc8PlanId={activeDoc8PlanId}
          handleDoc8ProcessBlur={handleDoc8ProcessBlur}
          screen={screen}
          session={session}
          setActiveDoc8PlanId={setActiveDoc8PlanId}
          updateDoc8ProcessPlan={updateDoc8ProcessPlan}
        />
      )}
      {activeStep === 'step9' && <MobileInspectionSessionStep9 screen={screen} session={session} />}
      {activeStep === 'step10' && (
        <MobileInspectionSessionStep10
          applyDoc10MeasurementPhoto={applyDoc10MeasurementPhoto}
          doc10MatchErrors={doc10MatchErrors}
          doc10MatchingMeasurementId={doc10MatchingMeasurementId}
          handleDoc10PhotoSelect={handleDoc10PhotoSelect}
          measurementTemplateOptions={measurementTemplateOptions}
          openPhotoSourcePicker={openPhotoSourcePicker}
          screen={screen}
          session={session}
        />
      )}
      {activeStep === 'step11' && (
        <MobileInspectionSessionStep11
          doc11ContentError={doc11ContentError}
          doc11ContentNotice={doc11ContentNotice}
          doc11GeneratingId={doc11GeneratingId}
          handleGenerateDoc11Content={handleGenerateDoc11Content}
          openPhotoSourcePicker={openPhotoSourcePicker}
          screen={screen}
          session={session}
        />
      )}
      {activeStep === 'step12' && (
        <MobileInspectionSessionStep12
          handlePhotoSlotKeyDown={handlePhotoSlotKeyDown}
          openPhotoSourcePicker={openPhotoSourcePicker}
          screen={screen}
          session={session}
        />
      )}
    </>
  );
}
