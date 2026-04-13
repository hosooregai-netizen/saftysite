'use client';

import { useEffect, useRef } from 'react';
import type { useInspectionSessionScreen } from '@/features/inspection-session/hooks/useInspectionSessionScreen';
import type { MobileInspectionStepId } from './mobileInspectionSessionHelpers';

type InspectionScreenController = ReturnType<typeof useInspectionSessionScreen>;
type InspectionSessionDraft = NonNullable<InspectionScreenController['sectionSession']>;

interface UseMobileInspectionDirectSignatureParams {
  activeStep: MobileInspectionStepId;
  isDirectSignatureAction: boolean;
  screen: InspectionScreenController;
  session: InspectionSessionDraft | null;
  sessionId: string;
  setActiveStep: (step: MobileInspectionStepId) => void;
}

export function useMobileInspectionDirectSignature({
  activeStep,
  isDirectSignatureAction,
  screen,
  session,
  sessionId,
  setActiveStep,
}: UseMobileInspectionDirectSignatureParams) {
  const directSignatureSectionRef = useRef<HTMLDivElement | null>(null);
  const handledDirectSignatureRef = useRef(false);
  const scrolledDirectSignatureRef = useRef(false);

  useEffect(() => {
    handledDirectSignatureRef.current = false;
    scrolledDirectSignatureRef.current = false;
  }, [isDirectSignatureAction, sessionId]);

  useEffect(() => {
    if (!isDirectSignatureAction || !session || handledDirectSignatureRef.current) {
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
  }, [isDirectSignatureAction, screen, session, setActiveStep]);

  useEffect(() => {
    if (
      activeStep !== 'step2' ||
      !isDirectSignatureAction ||
      !session ||
      scrolledDirectSignatureRef.current ||
      !directSignatureSectionRef.current ||
      session.document2Overview.notificationMethod !== 'direct'
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

  return { directSignatureSectionRef };
}
