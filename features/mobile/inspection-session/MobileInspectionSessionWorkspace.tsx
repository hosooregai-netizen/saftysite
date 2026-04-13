'use client';

import type { Dispatch, SetStateAction } from 'react';
import type { useInspectionSessionScreen } from '@/features/inspection-session/hooks/useInspectionSessionScreen';
import {
  MOBILE_INSPECTION_STEPS,
  type MobileInspectionStepId,
} from './mobileInspectionSessionHelpers';
import { MobileInspectionSessionStepPanels, type MobileInspectionSessionStepPanelsProps } from './MobileInspectionSessionStepPanels';
import styles from '@/features/mobile/components/MobileShell.module.css';
import tabStyles from '@/features/mobile/components/MobileStepTabs.module.css';

type InspectionScreenController = ReturnType<typeof useInspectionSessionScreen>;

interface MobileInspectionSessionWorkspaceProps
  extends Omit<MobileInspectionSessionStepPanelsProps, 'session'> {
  hasLoadedSessionPayload: boolean;
  setActiveStep: Dispatch<SetStateAction<MobileInspectionStepId>>;
  session: NonNullable<InspectionScreenController['sectionSession']> | null;
}

export function MobileInspectionSessionWorkspace({
  activeStep,
  hasLoadedSessionPayload,
  session,
  setActiveStep,
  ...stepPanelsProps
}: MobileInspectionSessionWorkspaceProps) {
  if (!hasLoadedSessionPayload || !session) {
    return (
      <p className={styles.inlineNotice} style={{ margin: '16px' }}>
        보고서 본문을 동기화하는 중입니다.
      </p>
    );
  }

  return (
    <div className={tabStyles.layoutWrapper}>
      <div className={tabStyles.tabContainer}>
        {MOBILE_INSPECTION_STEPS.map((step) => (
          <button
            key={step.id}
            type="button"
            className={`${tabStyles.tabButton} ${activeStep === step.id ? tabStyles.tabButtonActive : ''}`}
            onClick={() => setActiveStep(step.id)}
          >
            {step.label}
          </button>
        ))}
      </div>

      <div className={tabStyles.stepContent}>
        <MobileInspectionSessionStepPanels
          activeStep={activeStep}
          session={session}
          {...stepPanelsProps}
        />
      </div>
    </div>
  );
}
