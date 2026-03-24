'use client';

import {
  createCurrentHazardFinding,
  createFutureProcessRiskPlan,
  createMeasurementCheckItem,
  createPreviousGuidanceFollowUpItem,
  createSafetyEducationRecord,
} from '@/constants/inspectionSession';
import Doc10Section from '@/components/session/workspace/sections/Doc10Section';
import Doc11Section from '@/components/session/workspace/sections/Doc11Section';
import Doc12Section from '@/components/session/workspace/sections/Doc12Section';
import Doc13Section from '@/components/session/workspace/sections/Doc13Section';
import Doc14Section from '@/components/session/workspace/sections/Doc14Section';
import Doc1Section from '@/components/session/workspace/sections/Doc1Section';
import Doc2Section from '@/components/session/workspace/sections/Doc2Section';
import Doc3Section from '@/components/session/workspace/sections/Doc3Section';
import Doc4Section from '@/components/session/workspace/sections/Doc4Section';
import Doc5Section from '@/components/session/workspace/sections/Doc5Section';
import Doc6Section from '@/components/session/workspace/sections/Doc6Section';
import Doc7Section from '@/components/session/workspace/sections/Doc7Section';
import Doc8Section from '@/components/session/workspace/sections/Doc8Section';
import Doc9Section from '@/components/session/workspace/sections/Doc9Section';
import type {
  HazardStatsSectionProps,
  OverviewSectionProps,
  SupportSectionProps,
} from '@/components/session/workspace/types';
import type { InspectionSectionKey } from '@/types/inspectionSession';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';

type RenderSectionProps = OverviewSectionProps &
  HazardStatsSectionProps &
  SupportSectionProps & {
    currentSection: InspectionSectionKey;
  };

export function renderSectionToolbar({
  currentSection,
  ...props
}: RenderSectionProps) {
  switch (currentSection) {
    case 'doc4':
      return (
        <div className={`${styles.sectionToolbar} ${styles.doc4Toolbar}`}>
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={() =>
              props.applyDocumentUpdate('doc4', 'manual', (current) => ({
                ...current,
                document4FollowUps: [
                  ...current.document4FollowUps,
                  createPreviousGuidanceFollowUpItem({ confirmationDate: current.meta.reportDate }),
                ],
              }))
            }
          >
            이행여부 추가
          </button>
        </div>
      );
    case 'doc7':
      return (
        <div className={`${styles.sectionToolbar} ${styles.doc4Toolbar}`}>
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={() =>
              props.applyDocumentUpdate('doc7', 'manual', (current) => ({
                ...current,
                document7Findings: [
                  ...current.document7Findings,
                  createCurrentHazardFinding({ inspector: current.meta.drafter }),
                ],
              }))
            }
          >
            위험요인 추가
          </button>
        </div>
      );
    case 'doc8':
      return (
        <div className={`${styles.sectionToolbar} ${styles.doc4Toolbar}`}>
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={() =>
              props.applyDocumentUpdate('doc8', 'manual', (current) => ({
                ...current,
                document8Plans: [...current.document8Plans, createFutureProcessRiskPlan()],
              }))
            }
          >
            행 추가
          </button>
        </div>
      );
    case 'doc10':
      return (
        <div className={`${styles.sectionToolbar} ${styles.doc4Toolbar}`}>
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={() =>
              props.applyDocumentUpdate('doc10', 'manual', (current) => ({
                ...current,
                document10Measurements: [...current.document10Measurements, createMeasurementCheckItem()],
              }))
            }
          >
            행 추가
          </button>
        </div>
      );
    case 'doc11':
      return (
        <div className={`${styles.sectionToolbar} ${styles.doc4Toolbar}`}>
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={() =>
              props.applyDocumentUpdate('doc11', 'manual', (current) => ({
                ...current,
                document11EducationRecords: [...current.document11EducationRecords, createSafetyEducationRecord()],
              }))
            }
          >
            교육 기록 추가
          </button>
        </div>
      );
    default:
      return null;
  }
}

export function renderSectionBody({
  currentSection,
  ...props
}: RenderSectionProps) {
  switch (currentSection) {
    case 'doc1':
      return <Doc1Section session={props.session} />;
    case 'doc2':
      return <Doc2Section {...props} />;
    case 'doc3':
      return <Doc3Section {...props} />;
    case 'doc4':
      return <Doc4Section {...props} />;
    case 'doc5':
      return <Doc5Section {...props} />;
    case 'doc6':
      return <Doc6Section {...props} />;
    case 'doc7':
      return <Doc7Section {...props} />;
    case 'doc8':
      return <Doc8Section {...props} />;
    case 'doc9':
      return <Doc9Section {...props} />;
    case 'doc10':
      return <Doc10Section {...props} />;
    case 'doc11':
      return <Doc11Section {...props} />;
    case 'doc12':
      return <Doc12Section {...props} />;
    case 'doc13':
      return <Doc13Section session={props.session} />;
    case 'doc14':
      return <Doc14Section session={props.session} />;
    default:
      return <div className={styles.emptyInline}>이 문서 섹션은 이어서 연결 중입니다.</div>;
  }
}
